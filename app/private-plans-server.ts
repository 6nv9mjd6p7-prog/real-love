import {privatePlanDraft,privatePlanNext} from './private-plan-model';
export class PrivatePlanError extends Error{constructor(message:string,public status=400){super(message);}}
// Repeat membership, active-account and block guards in each write to close access races.
export async function privatePlansAction(db:any,connection:string,actor:string,other:string,input:Record<string,any>,rulesVersion:string,checkContent:(text:string)=>void){
 const guard="EXISTS (SELECT 1 FROM connections c WHERE c.id=? AND c.status='accepted' AND ((c.sender=? AND c.recipient=?) OR (c.sender=? AND c.recipient=?))) AND (SELECT COUNT(*) FROM profiles p JOIN safety_accounts a ON a.id=p.id WHERE p.id IN (?,?) AND p.active=1 AND a.status='admitted' AND json_extract(p.data,'$.rulesVersion')=?)=2 AND NOT EXISTS (SELECT 1 FROM blocks WHERE (actor=? AND target=?) OR (actor=? AND target=?))";
 const values=[connection,actor,other,other,actor,actor,other,rulesVersion,actor,other,other,actor];
 if(!await db.prepare('SELECT 1 WHERE '+guard).bind(...values).first())throw new PrivatePlanError('This conversation is unavailable.',403);
 const decorate=(p:any)=>({id:p.id,creator:p.creator,kind:p.kind,description:p.description,timing:p.timing,startsAt:p.starts_at,status:p.status,revision:p.revision,created:p.created,mine:p.creator===actor});
 if(input.action==='private_plans'){
  const before=Number.isSafeInteger(input.before)&&input.before>0?input.before:0;
  const rows=await db.prepare('SELECT rowid,* FROM direct_plans WHERE connection=? AND (?=0 OR rowid<?) ORDER BY rowid DESC LIMIT 50').bind(connection,before,before).all();
  return {plans:rows.results.map(decorate),hasMore:rows.results.length===50,cursor:rows.results.at(-1)?.rowid??null};
 }
 const now=new Date().toISOString();
 if(input.action==='private_plan_create'){
  let draft;try{draft=privatePlanDraft(input,Date.now());}catch(e:any){throw new PrivatePlanError(e.message);}
  checkContent(draft.description+' '+draft.timing);
  if(typeof input.clientMessageId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.clientMessageId))throw new PrivatePlanError('Invalid plan attempt.');
  const id=JSON.stringify(['private-plan',connection,actor,input.clientMessageId]);
  const matches=(p:any)=>p&&p.creator===actor&&p.kind===draft.kind&&p.description===draft.description&&p.timing===draft.timing&&p.starts_at===draft.startsAt;
  const existing=await db.prepare('SELECT * FROM direct_plans WHERE id=? AND connection=?').bind(id,connection).first();
  if(existing){if(!matches(existing))throw new PrivatePlanError('This attempt belongs to another plan.',409);return {ok:true,plan:decorate(existing),event:id};}
  await db.prepare("INSERT INTO direct_plans (id,connection,creator,kind,description,timing,starts_at,status,revision,created,updated) SELECT ?,?,?,?,?,?,?,'proposed',0,?,? WHERE "+guard+' ON CONFLICT(id) DO NOTHING').bind(id,connection,actor,draft.kind,draft.description,draft.timing,draft.startsAt,now,now,...values).run();
  const saved=await db.prepare('SELECT * FROM direct_plans WHERE id=? AND connection=?').bind(id,connection).first();
  if(!matches(saved))throw new PrivatePlanError('Access changed or the plan attempt conflicts. Refresh and try again.',409);
  return {ok:true,plan:decorate(saved),event:id};
 }
 const plan=await db.prepare('SELECT * FROM direct_plans WHERE id=? AND connection=?').bind(String(input.plan||''),connection).first();
 if(!plan)throw new PrivatePlanError('Plan unavailable.',404);
 const next=privatePlanNext(plan.status,plan.creator===actor,String(input.decision||''));
 if(!next||!Number.isInteger(input.revision)||input.revision!==plan.revision)throw new PrivatePlanError('This plan changed or that action is unavailable. Refresh to see its latest status.',409);
 const updated=await db.prepare('UPDATE direct_plans SET status=?,revision=revision+1,updated=? WHERE id=? AND connection=? AND revision=? AND '+guard).bind(next,now,plan.id,connection,plan.revision,...values).run();
 if(!updated.meta.changes)throw new PrivatePlanError('The plan or conversation changed. Refresh before trying again.',409);
 return {ok:true,event:JSON.stringify([plan.id,plan.revision+1]),plan:decorate({...plan,status:next,revision:plan.revision+1})};
}
