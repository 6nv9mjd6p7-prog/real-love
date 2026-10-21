import {pendingReviewWork,reviewWorkItem} from './moderation-policy';
import {env,waitUntil} from 'cloudflare:workers';
import {activeMember} from './safety';
import {validPushEndpoint,vapidAuthorization} from './web-push';
export type PushFailure='unavailable'|'missing'|'expired'|'authorization'|'request'|'rate_limit'|'service'|'timeout'|'network';
export function pushFailureMessage(reason?:PushFailure){
 const messages:Record<PushFailure,string>={unavailable:'Notifications are temporarily unavailable. Please try again later.',missing:'This device is no longer registered. Turn notifications off and enable them again.',expired:'This device’s subscription expired. Turn notifications off and enable them again.',authorization:'The notification service rejected the app’s credentials. Please try again later; re-enabling notifications will not fix this.',request:'The app’s notification request was rejected. Please try again later.',rate_limit:'The notification service is busy. Wait a minute and try again.',service:'The notification service is temporarily unavailable. Please try again later.',timeout:'The notification service took too long to respond. Please try again.',network:'The app could not reach the notification service. Please try again later.'};
 return messages[reason||'service'];
}
export async function pushTo(member:string,onlyEndpoint?:string){
 if(!env.DB||!env.WEB_PUSH_PRIVATE_JWK||!env.WEB_PUSH_PUBLIC_KEY)return {accepted:0,failed:0,reason:'unavailable' as PushFailure};
 const rows=await env.DB.prepare('SELECT endpoint FROM push_subscriptions WHERE member=?'+(onlyEndpoint?' AND endpoint=?':'')+' LIMIT 3').bind(...(onlyEndpoint?[member,onlyEndpoint]:[member])).all<{endpoint:string}>();
 let accepted=0,failed=0,reason:PushFailure|undefined=rows.results.length?undefined:'missing';
 await Promise.all(rows.results.map(async(raw)=>{
  if(!validPushEndpoint(raw.endpoint)){failed++;reason='request';return;}
  const provider=new URL(raw.endpoint).hostname;let stage:'sign'|'send'='sign';
  try{
   const authorization=await vapidAuthorization(raw.endpoint,env.WEB_PUSH_PRIVATE_JWK!,env.WEB_PUSH_PUBLIC_KEY!);stage='send';
   // A fixed-length empty body makes Workers send Content-Length: 0.
   // Workers supports manual redirects; treat every redirect as a rejection.
   // Never forward the VAPID authorization to another endpoint.
   const result=await fetch(raw.endpoint,{method:'POST',headers:{Authorization:authorization,TTL:'300',Urgency:'normal',Topic:'real-love-activity'},body:new Uint8Array(0),redirect:'manual',signal:AbortSignal.timeout(10000)});
   if(result.ok)accepted++;
   else{
    failed++;reason=result.status===404||result.status===410?'expired':result.status===401||result.status===403?'authorization':result.status===429?'rate_limit':result.status>=500?'service':'request';
    console.error('Push delivery rejected',JSON.stringify({provider,status:result.status,reason}));
    if(reason==='expired')await env.DB!.prepare('DELETE FROM push_subscriptions WHERE endpoint=? AND member=?').bind(raw.endpoint,member).run();
   }
   await result.body?.cancel();
  }catch(e){failed++;reason=stage==='sign'?'authorization':e instanceof Error&&(e.name==='TimeoutError'||e.name==='AbortError')?'timeout':'network';console.error('Push delivery failed',JSON.stringify({provider,stage,reason}));}
 }));return {accepted,failed,reason};
}
export async function notify(member:string,actor:string,kind:string,scope:string,title:string,url:string,eventKey:string,accountEvent=false,sendPush=true,createdAt?:string){
 try{if(!env.DB||member===actor)return;if(!accountEvent&&!await activeMember(member))return;if(actor&&await env.DB.prepare('SELECT actor FROM blocks WHERE (actor=? AND target=?) OR (actor=? AND target=?)').bind(member,actor,actor,member).first())return;
 const result=await env.DB.prepare('INSERT OR IGNORE INTO notifications (id,member,actor,kind,scope,title,url,created) VALUES (?,?,?,?,?,?,?,?)').bind(JSON.stringify([member,kind,eventKey]),member,actor,kind,scope,title,url,createdAt||new Date().toISOString()).run();const channel=kind==='review'||kind.startsWith('review_')?'review':kind.startsWith('circle_')?'circle':'direct';const preferenceScope=channel+':'+scope;const muted=await env.DB.prepare("SELECT id FROM notification_preferences WHERE member=? AND muted=1 AND (scope=? OR scope=? OR (scope='reactions' AND ? IN ('reaction','circle_reaction')))").bind(member,preferenceScope,channel+':*',kind).first();if(sendPush&&result.meta.changes&&!muted)waitUntil(pushTo(member).catch(()=>({accepted:0,failed:1})));
 }catch{console.warn('Notification could not be queued.');}
}
export async function notifyCircle(circle:string,actor:string,messageId:string){
 try{const rows=await env.DB!.prepare("SELECT member FROM circle_members WHERE circle=? AND status='accepted' AND member<>?").bind(circle,actor).all<{member:string}>();await Promise.all(rows.results.map((x)=>notify(x.member,actor,'circle_message',circle,'New circle message','#circles/'+encodeURIComponent(circle),messageId)));}catch{console.warn('Circle notifications could not be queued.');}
}
// Catch-up is in-app only: opening the app must not burst old phone alerts.
export async function syncReviewNotifications(member:string,owner:boolean){
 const work=await pendingReviewWork(member,owner);
 for(const item of work)await notify(member,'',item.kind,item.scope,item.title,'#review',item.kind+':'+item.scope,true,false,item.created);
 return work;
}
export async function notifyReviewers(subject:string,_eventKey:string,kind:'review'|'review_report'|'review_appeal'='review'){
 try{
  const rows=await env.DB!.prepare("SELECT member,MAX(is_owner) AS is_owner FROM (SELECT m.id AS member,0 AS is_owner FROM moderators m JOIN safety_accounts a ON a.id=m.id WHERE a.status='admitted' UNION ALL SELECT DISTINCT s.member,1 AS is_owner FROM push_subscriptions s JOIN safety_accounts a ON a.id=s.member WHERE s.reviewer=2 AND a.status='admitted') GROUP BY member").all<{member:string;is_owner:number}>();
  await Promise.all(rows.results.map(async(raw)=>{
   const item=await reviewWorkItem(raw.member,!!raw.is_owner,kind,subject);
   if(item)await notify(raw.member,'',item.kind,item.scope,item.title,'#review',item.kind+':'+item.scope,true);
  }));
 }catch{console.warn('Review notification could not be queued.');}
}
