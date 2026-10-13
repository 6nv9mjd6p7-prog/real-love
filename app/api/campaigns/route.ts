/**
 * Campaign proposals, private participation, feedback, and independent review. Scoped pagination keeps personal activity accessible; a unique review event guards dependent writes.
 * Reading guide: docs/CODE_READING_GUIDE.md.
 */
import {getChatGPTUser} from '../../chatgpt-auth';
import {z} from 'zod';
import {db,initializeAccount,quota,readInput,moderator,activeMember,failure,safetyHeaders,SafetyError} from '../../safety';
import {caseConflict} from '../../moderation-policy';
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:safetyHeaders});
const text=(min:number,max:number)=>z.string().trim().min(min).max(max);
const https=z.string().url().max(1000).refine(s=>{const u=new URL(s);return u.protocol==='https:'&&!u.username&&!u.password;},'Use an HTTPS source without embedded credentials.');
const draft=z.object({title:text(5,100),company:text(2,120),summary:text(30,1500),demand:text(20,1000),uncertainty:text(10,800),alternatives:text(10,800),sources:z.array(z.object({url:https,claim:text(10,500)})).min(1).max(5),reviewDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(s=>Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s&&s>new Date().toISOString().slice(0,10)&&Date.parse(s)<=Date.now()+90*86400000,'Choose a future review date within 90 days.')});
const visible=(c:any,today:string)=>['active','paused','completed'].includes(c.status)&&!(c.status==='active'&&JSON.parse(c.data).reviewDate<today);
async function independent(id:string,creator:string){return !await caseConflict(id,{actor:creator,target:'',context:'{}'});}
export async function GET(req?:Request){try{
 const u=await getChatGPTUser();if(!u)return reply({error:'Sign in to view collective action.'},401);await initializeAccount(u);await quota(u.userId,'campaign_read',60,60);
 const reviewer=await moderator(u),active=await activeMember(u.userId),today=new Date().toISOString().slice(0,10);
 const params=new URL(req?.url||'https://real-love.invalid/api/campaigns').searchParams;
 const scope=z.enum(['all','explore','mine','review']).parse(params.get('scope')||'all');
 if(scope==='review'&&!reviewer)return reply({error:'Reviewer access required.'},403);
 let cursor:{created:string;id:string}|null=null;
 if(params.has('cursor')){try{cursor=z.object({created:z.string().max(40),id:z.string().min(1).max(100)}).parse(JSON.parse(params.get('cursor')!));}catch{return reply({error:'Invalid page cursor.'},400);}}
 const personal="(creator=? OR EXISTS (SELECT 1 FROM campaign_participation p WHERE p.campaign=campaigns.id AND p.member=?))";
 const publicFilter="(status IN ('paused','completed') OR (status='active' AND json_extract(data,'$.reviewDate')>=?))";
 let filter:string,values:(string|number)[];
 if(scope==='mine'){filter=personal;values=[u.userId,u.userId];}
 else if(scope==='explore'){filter='(?=1 AND '+publicFilter+')';values=[active?1:0,today];}
 else if(scope==='review'){filter="(status='pending' OR (status='active' AND json_extract(data,'$.reviewDate')<?) OR (status NOT IN ('withdrawn','rejected') AND EXISTS (SELECT 1 FROM campaign_feedback f WHERE f.campaign=campaigns.id AND f.status='open')))";values=[today];}
 else{filter='(?=1 OR '+personal+' OR (?=1 AND '+publicFilter+'))';values=[reviewer?1:0,u.userId,u.userId,active?1:0,today];}
 const after=cursor?' AND (created<? OR (created=? AND id<?))':'';
 if(cursor)values.push(cursor.created,cursor.created,cursor.id);
 const rows=await db().prepare("SELECT * FROM campaigns WHERE creator<>'' AND "+filter+after+' ORDER BY created DESC,id DESC LIMIT 26').bind(...values).all();
 const page=(rows.results as any[]).slice(0,25),last=page.at(-1);
 const nextCursor=rows.results.length>25&&last?JSON.stringify({created:last.created,id:last.id}):null;
 const campaigns=[];
 for(const c of page){const mine=c.creator===u.userId;const publicVisible=active&&visible(c,today);const due=c.status==='active'&&JSON.parse(c.data).reviewDate<today;
 const participation=await db().prepare('SELECT member FROM campaign_participation WHERE campaign=? AND member=?').bind(c.id,u.userId).first();
 if(!mine&&!reviewer&&!publicVisible&&!participation)continue;
 const updates=await db().prepare("SELECT id,body,kind,created FROM campaign_updates WHERE campaign=? AND (published=1 OR ?=1) ORDER BY created DESC").bind(c.id,reviewer||mine?1:0).all();
 const feedback=await db().prepare("SELECT id,kind,body,status,created FROM campaign_feedback WHERE campaign=? AND (?=1 OR actor=?) ORDER BY created DESC").bind(c.id,reviewer?1:0,u.userId).all();
 campaigns.push({id:c.id,...JSON.parse(c.data),status:due?'review_due':c.status,version:c.version,mine,participating:!!participation,canReview:reviewer&&await independent(u.userId,c.creator),updates:updates.results,feedback:feedback.results});
 }
 return reply({accountId:u.userId,reviewer,active,campaigns,nextCursor});
}catch(e){if(e instanceof z.ZodError)return reply({error:"Invalid campaign list request."},400);return failure(e);}}
export async function POST(req:Request){try{
 const u=await getChatGPTUser();if(!u)return reply({error:'Sign in.'},401);await initializeAccount(u);const input=await readInput(req);
 if(input.expectedAccount!==u.userId)return reply({error:'Your account changed. Refresh before continuing.'},409);
 await quota(u.userId,'campaign_write',30,60);const id=u.userId,now=new Date().toISOString(),today=now.slice(0,10);
 // Remove only the acting member's participation, including when further interaction is unavailable.
 if(input.action==='leave'){await db().prepare('DELETE FROM campaign_participation WHERE campaign=? AND member=?').bind(String(input.campaign||''),id).run();return reply({ok:true});}
 // Ownership-checked withdrawal stays available even when interaction is paused or restricted.
 if(input.action==='withdraw'){
  const c=await db().prepare('SELECT creator FROM campaigns WHERE id=?').bind(String(input.campaign||'')).first<any>();
  if(!c||c.creator!==id)return reply({error:'Only the proposer can withdraw.'},403);
  await db().prepare("UPDATE campaigns SET status='withdrawn',version=version+1 WHERE id=? AND creator=? AND status<>'withdrawn'").bind(String(input.campaign),id).run();return reply({ok:true});
 }
 const reviewer=await moderator(u),active=await activeMember(id);if(!active&&!reviewer)return reply({error:'An active, admitted account is required.'},403);
 // Validate required proposal details and record an unpublished proposal awaiting independent review.
 if(input.action==='propose'){
  if(!active)return reply({error:'Activate your admitted profile to propose a campaign.'},403);
  const p=draft.parse(input.draft);if(input.consent!==true)return reply({error:'Acknowledge the campaign rules before submitting.'},400);
  await quota(id,'campaign_propose',2,86400);const campaign=crypto.randomUUID();await db().prepare("INSERT INTO campaigns (id,creator,data,status,version,created) VALUES (?,?,?,'pending',1,?)").bind(campaign,id,JSON.stringify(p),now).run();return reply({ok:true,campaign});
 }
 const c=await db().prepare('SELECT * FROM campaigns WHERE id=?').bind(String(input.campaign||'')).first<any>();if(!c)return reply({error:'Campaign unavailable.'},404);
 const data=JSON.parse(c.data);
 // Insert participation only while the campaign is active and its review date has not expired.
 if(input.action==='join'){
  if(!active||input.consent!==true)return reply({error:'Review the participation choices and confirm voluntary participation.'},400);
  const changed=await db().prepare("INSERT INTO campaign_participation (campaign,member) SELECT id,? FROM campaigns WHERE id=? AND status='active' AND json_extract(data,'$.reviewDate')>=? ON CONFLICT(campaign,member) DO NOTHING").bind(id,c.id,today).run();
  if(!changed.meta.changes&&!(await db().prepare("SELECT p.member FROM campaign_participation p JOIN campaigns c ON c.id=p.campaign WHERE p.campaign=? AND p.member=? AND c.status='active' AND json_extract(c.data,'$.reviewDate')>=?").bind(c.id,id,today).first()))return reply({error:'This campaign is not accepting participation. Refresh for its latest status.'},409);return reply({ok:true});
 }
 // Keep corrections, responses, and reports in the review flow instead of automatically publishing them.
 if(input.action==='feedback'){
  if(c.creator!==id&&!reviewer&&!visible(c,today)&&!await db().prepare('SELECT member FROM campaign_participation WHERE campaign=? AND member=?').bind(c.id,id).first())return reply({error:'Campaign unavailable.'},404);
  const p=z.object({kind:z.enum(['correction','response','report','update']),body:text(10,1800)}).parse(input);await quota(id,'campaign_feedback',5,86400);
  await db().prepare("INSERT INTO campaign_feedback (id,campaign,actor,kind,body,status,created) VALUES (?,?,?,?,?,'open',?)").bind(crypto.randomUUID(),c.id,id,p.kind,p.body,now).run();return reply({ok:true});
 }
 // Validate reviewer independence, expected version, and allowed state transitions before recording the decision.
 if(input.action==='review'){
  if(!reviewer||!await independent(id,c.creator))return reply({error:'An independent authorized reviewer must handle this campaign.'},403);
  const p=z.object({decision:z.enum(['approve','reject','pause','complete','publish_update','dismiss_feedback']),reason:text(20,1800),version:z.number().int(),feedback:z.string().max(100).optional(),reviewDate:z.string().optional(),checked:z.literal(true)}).parse(input);
  if(c.version!==p.version)return reply({error:'The campaign changed. Refresh and review again.'},409);
  if(['withdrawn','rejected'].includes(c.status))return reply({error:'This campaign is closed.'},409);
  let status=c.status;
  if(p.decision==='approve'){if(!['pending','paused','active'].includes(status))return reply({error:'This campaign cannot be approved.'},409);data.reviewDate=p.reviewDate;draft.parse(data);status='active';}
  if(p.decision==='reject'){if(status!=='pending')return reply({error:'Only pending proposals can be rejected.'},409);status='rejected';}
  if(p.decision==='pause'){if(status!=='active')return reply({error:'Only active campaigns can be paused.'},409);status='paused';}
  if(p.decision==='complete'){if(!['active','paused'].includes(status))return reply({error:'Only reviewed campaigns can be completed.'},409);status='completed';}
  let feedback:any=null;
  if(['publish_update','dismiss_feedback'].includes(p.decision)){feedback=await db().prepare("SELECT * FROM campaign_feedback WHERE id=? AND campaign=? AND status='open'").bind(p.feedback||'',c.id).first<any>();if(!feedback)return reply({error:'Choose open feedback.'},409);if(!await independent(id,feedback.actor))return reply({error:'Another independent reviewer must review this submission.'},403);}
  // The unique event is the transaction's ownership token. A stale version
  // inserts no event, so every dependent write is a no-op in the atomic batch.
  const event=crypto.randomUUID(),published=['active','paused','completed'].includes(status)?1:0;
  const statements=[db().prepare('INSERT INTO campaign_updates (id,campaign,body,kind,published,created,reviewer) SELECT ?,?,?,?,?,?,? WHERE EXISTS (SELECT id FROM campaigns WHERE id=? AND version=?)').bind(event,c.id,p.reason,p.decision,published,now,id,c.id,p.version),db().prepare('UPDATE campaigns SET status=?,data=?,version=version+1 WHERE id=? AND version=? AND EXISTS (SELECT id FROM campaign_updates WHERE id=?)').bind(status,JSON.stringify(data),c.id,p.version,event)];
  if(feedback)statements.push(db().prepare("UPDATE campaign_feedback SET status='reviewed' WHERE id=? AND EXISTS (SELECT id FROM campaign_updates WHERE id=?)").bind(feedback.id,event));
  const results=await db().batch(statements);if(!results[0].meta.changes)throw new SafetyError('Campaign changed. Refresh and review again.',409);
  return reply({ok:true});
 }
 return reply({error:'Unknown campaign action.'},400);
}catch(e){if(e instanceof z.ZodError)return reply({error:e.issues[0]?.message||'Check the required fields.'},400);return failure(e);}}
