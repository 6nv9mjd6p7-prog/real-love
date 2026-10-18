import {db} from './safety';
export async function caseConflict(reviewer:string,r:any){if(reviewer===r.actor||reviewer===r.target)return true;for(const person of [r.actor,r.target].filter(Boolean)){if(await db().prepare('SELECT id FROM connections WHERE (sender=? AND recipient=?) OR (sender=? AND recipient=?) LIMIT 1').bind(reviewer,person,person,reviewer).first())return true;if(await db().prepare('SELECT actor FROM blocks WHERE (actor=? AND target=?) OR (actor=? AND target=?)').bind(reviewer,person,person,reviewer).first())return true;}const ctx=JSON.parse(r.context||'{}');if(['circle','circle_message'].includes(ctx.type)&&ctx.scope){const circle=await db().prepare('SELECT founder_a,founder_b FROM circles WHERE id=?').bind(ctx.scope).first<any>();if(circle&&[circle.founder_a,circle.founder_b].includes(reviewer))return true;if(await db().prepare("SELECT member FROM circle_members WHERE circle=? AND member=? ").bind(ctx.scope,reviewer).first())return true;}if(await db().prepare('SELECT actor FROM blocks WHERE (actor=? AND target=?) OR (actor=? AND target=?)').bind(reviewer,r.target,r.target,reviewer).first())return true;return false;}

export type ReviewWork={kind:'review'|'review_report'|'review_appeal';scope:string;title:string;created:string};
export async function reviewWorkItem(reviewer:string,owner:boolean,kind:string,scope:string):Promise<ReviewWork|null>{
 if(kind==='review'){
  const pending=await db().prepare("SELECT p.id,p.updated FROM profiles p JOIN safety_accounts a ON a.id=p.id WHERE p.id=? AND a.status='pending'").bind(scope).first<any>();
  if(!pending||!owner&&await caseConflict(reviewer,{actor:'',target:scope,context:'{}'}))return null;
  return {kind:'review',scope,title:'A profile is waiting for review',created:pending.updated};
 }
 const report=await db().prepare("SELECT id,actor,target,context,created FROM reports WHERE id=? AND status='open' AND (expires='' OR expires>?)").bind(scope,new Date().toISOString()).first<any>();
 if(!report||!owner&&await caseConflict(reviewer,report))return null;
 const appeal=JSON.parse(report.context||'{}').type==='appeal';
 return {kind:appeal?'review_appeal':'review_report',scope,title:appeal?'An account appeal is waiting for review':'A report is waiting for review',created:report.created};
}
export async function pendingReviewWork(reviewer:string,owner:boolean){
 // Match the review screen's bounded queue, without reading names or evidence.
 const profiles=await db().prepare("SELECT p.id,p.updated FROM profiles p JOIN safety_accounts a ON a.id=p.id WHERE a.status='pending' ORDER BY p.updated ASC LIMIT 100").all();
 const reports=await db().prepare("SELECT id,actor,target,context,created FROM reports WHERE status='open' AND (expires='' OR expires>?) ORDER BY created ASC LIMIT 100").bind(new Date().toISOString()).all();
 const work:ReviewWork[]=[];
 for(const row of profiles.results as {id:string;updated:string}[]){
  if(!owner&&await caseConflict(reviewer,{actor:'',target:row.id,context:'{}'}))continue;
  work.push({kind:'review',scope:row.id,title:'A profile is waiting for review',created:row.updated});
 }
 for(const row of reports.results as any[]){
  if(!owner&&await caseConflict(reviewer,row))continue;
  const appeal=JSON.parse(row.context||'{}').type==='appeal';
  work.push({kind:appeal?'review_appeal':'review_report',scope:row.id,title:appeal?'An account appeal is waiting for review':'A report is waiting for review',created:row.created});
 }
 return work;
}
