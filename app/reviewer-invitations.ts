import {env} from 'cloudflare:workers';
import {db,SafetyError} from './safety';

// Bind outstanding invitations to the current owner configuration without storing its email.
export async function reviewerAuthority(){
 const email=env.PILOT_OWNER_EMAIL?.toLowerCase();
 if(!email)return '';
 return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(email))),x=>x.toString(16).padStart(2,'0')).join('');
}
export async function pendingReviewerInvitations(member:string){
 const authority=await reviewerAuthority();if(!authority)return [];
 return (await db().prepare("SELECT i.id,i.created,i.expires FROM reviewer_invitations i JOIN safety_accounts a ON a.id=i.member JOIN safety_accounts issuer ON issuer.id=i.issuer WHERE i.member=? AND i.authority=? AND i.status='pending' AND i.expires>? AND a.status='admitted' AND issuer.status='admitted' AND NOT EXISTS (SELECT id FROM moderators WHERE id=i.member)").bind(member,authority,new Date().toISOString()).all()).results;
}
export async function respondReviewerInvitation(member:string,id:string,accept:boolean){
 const authority=await reviewerAuthority(),now=new Date().toISOString(),decision=crypto.randomUUID();
 if(!authority)throw new SafetyError('This reviewer invitation is no longer available.',409);
 const results=await db().batch([
  db().prepare("UPDATE reviewer_invitations SET status=?,decision_id=?,decided=? WHERE id=? AND member=? AND authority=? AND status='pending' AND expires>? AND EXISTS (SELECT id FROM safety_accounts WHERE id=? AND status='admitted') AND EXISTS (SELECT id FROM safety_accounts WHERE id=reviewer_invitations.issuer AND status='admitted') AND NOT EXISTS (SELECT id FROM moderators WHERE id=?)").bind(accept?'accepted':'declined',decision,now,id,member,authority,now,member,member),
  // A fresh decision token prevents retries or stale accepted records from regranting a revoked role.
  db().prepare("INSERT OR IGNORE INTO moderators (id) SELECT member FROM reviewer_invitations WHERE id=? AND member=? AND status='accepted' AND decision_id=?").bind(id,member,decision),
  db().prepare("UPDATE notifications SET read=1 WHERE member=? AND kind='reviewer_invitation' AND scope=? AND EXISTS (SELECT id FROM reviewer_invitations WHERE id=? AND decision_id=?)").bind(member,id,id,decision),
  db().prepare("INSERT INTO moderation_audit (id,actor,action,target,reason,created) SELECT ?,?,?,?,?,? WHERE EXISTS (SELECT id FROM reviewer_invitations WHERE id=? AND decision_id=?)").bind(crypto.randomUUID(),member,accept?'accept_reviewer_invitation':'decline_reviewer_invitation',member,'Member '+(accept?'accepted':'declined')+' reviewer invitation '+id,now,id,decision)
 ]);
 if(!results[0].meta.changes)throw new SafetyError('This invitation changed, expired, or is no longer available. Refresh Notifications.',409);
 return {ok:true,accepted:accept};
}
