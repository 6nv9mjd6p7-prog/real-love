import {pendingReviewerInvitations,respondReviewerInvitation} from '../../reviewer-invitations';
import {reviewWorkItem} from '../../moderation-policy';
import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../chatgpt-auth';
import {quota,readInput,failure,safetyHeaders,moderator,isOwner,activeMember,RULES_VERSION} from '../../safety';
import {validPushEndpoint} from '../../web-push';
import {pushTo,pushFailureMessage,syncReviewNotifications} from '../../notifications-server';
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:safetyHeaders});
export async function GET(){try{const u=await getChatGPTUser();if(!u)return reply({error:'Sign in to view notifications.'},401);await quota(u.userId,'notifications_read',60,60);const reviewer=!!await moderator(u),owner=isOwner(u);if(reviewer)await syncReviewNotifications(u.userId,owner);await env.DB!.prepare('DELETE FROM notifications WHERE member=? AND created<?').bind(u.userId,new Date(Date.now()-30*86400000).toISOString()).run();const rows=await env.DB!.prepare("SELECT n.id,n.actor,n.kind,n.scope,n.title,n.url,n.created,n.read,p.data AS actor_data,p.active AS actor_active,a.status AS actor_status,c.status AS connection_status,c.sender,c.recipient,g.title AS circle_title,g.status AS circle_status,g.category AS circle_category,cm.status AS circle_membership,cm.role AS circle_role,cm.host_invited_by,(SELECT 1 FROM circle_invites ci WHERE ci.circle=n.scope AND ci.invitee=n.member AND ci.status='pending' AND ci.expires>?) AS named_circle_invite FROM notifications n LEFT JOIN profiles p ON p.id=n.actor LEFT JOIN safety_accounts a ON a.id=n.actor LEFT JOIN connections c ON c.id=n.scope LEFT JOIN circles g ON g.id=n.scope LEFT JOIN circle_members cm ON cm.circle=n.scope AND cm.member=n.member WHERE n.member=? AND (n.actor='' OR NOT EXISTS (SELECT actor FROM blocks WHERE (actor=? AND target=n.actor) OR (actor=n.actor AND target=?))) AND (n.kind NOT IN ('review','review_report','review_appeal') OR ?=1) ORDER BY n.created DESC LIMIT 100").bind(new Date().toISOString(),u.userId,u.userId,u.userId,reviewer?1:0).all();const reviewerInvitations=await pendingReviewerInvitations(u.userId);const visible=[];for(const row of rows.results as any[]){if(['review','review_report','review_appeal'].includes(row.kind)&&!await reviewWorkItem(u.userId,owner,row.kind,row.scope))continue;if(row.kind==='reviewer_invitation'&&!reviewerInvitations.some((i:any)=>i.id===row.scope))continue;visible.push(row);}const viewerActive=await activeMember(u.userId);return reply({accountId:u.userId,reviewerInvitations,notifications:visible.map((row:any)=>notificationDetails(row,u.userId,viewerActive)),mutedScopes:(await env.DB!.prepare('SELECT scope FROM notification_preferences WHERE member=? AND muted=1').bind(u.userId).all()).results.map((x:any)=>x.scope),publicKey:env.WEB_PUSH_PUBLIC_KEY||null});}catch(e){return failure(e);}}
export async function POST(req:Request){try{const u=await getChatGPTUser();if(!u)return reply({error:'Sign in to manage notifications.'},401);await quota(u.userId,'notifications_write',20,60);const input=await readInput(req);if(input.expectedAccount!==u.userId)return reply({error:'Your account changed. Refresh before continuing.'},409);
 if(input.action==='respond_reviewer_invitation'){if(typeof input.invitation!=='string'||typeof input.accept!=='boolean')return reply({error:'Choose Accept or Decline for a reviewer invitation.'},400);return reply(await respondReviewerInvitation(u.userId,input.invitation,input.accept));}
 if(input.action==='read'){if(input.id){await env.DB!.prepare('UPDATE notifications SET read=1 WHERE id=? AND member=?').bind(String(input.id),u.userId).run();}else await env.DB!.prepare('UPDATE notifications SET read=1 WHERE member=?').bind(u.userId).run();return reply({ok:true});}
 if(input.action==='mute'){if(typeof input.muted!=='boolean'||!['direct','circle','reactions','review'].includes(input.channel))return reply({error:'Choose valid alert settings.'},400);const scope=String(input.scope||'');const global=scope==='all';if(input.channel==='review'&&(!global||!await moderator(u)))return reply({error:'Reviewer access is required for review alert settings.'},403);if(!global&&input.channel==='direct'&&!await env.DB!.prepare("SELECT id FROM connections WHERE id=? AND status='accepted' AND (sender=? OR recipient=?)").bind(scope,u.userId,u.userId).first())return reply({error:'Conversation unavailable.'},403);if(!global&&input.channel==='circle'&&!await env.DB!.prepare("SELECT circle FROM circle_members WHERE circle=? AND member=? AND status='accepted'").bind(scope,u.userId).first())return reply({error:'Circle unavailable.'},403);const key=input.channel==='reactions'?'reactions':input.channel+':'+(global?'*':scope);const pref=JSON.stringify([u.userId,key]);if(input.muted)await env.DB!.prepare('INSERT INTO notification_preferences (id,member,scope,muted) VALUES (?,?,?,1) ON CONFLICT(id) DO UPDATE SET muted=1').bind(pref,u.userId,key).run();else await env.DB!.prepare('DELETE FROM notification_preferences WHERE id=? AND member=?').bind(pref,u.userId).run();return reply({ok:true});}
 const endpoint=input.endpoint;if(!validPushEndpoint(endpoint))return reply({error:'This browser’s push service is not supported.'},400);
 if(input.action==='unsubscribe'){await env.DB!.prepare('DELETE FROM push_subscriptions WHERE endpoint=? AND member=?').bind(endpoint,u.userId).run();return reply({ok:true});}
 if(input.action==='subscribe'){if(!env.WEB_PUSH_PUBLIC_KEY||!env.WEB_PUSH_PRIVATE_JWK)return reply({error:'Phone notifications are unavailable. Try again later.'},503);const existing=await env.DB!.prepare('SELECT member FROM push_subscriptions WHERE endpoint=?').bind(endpoint).first<any>();if(existing&&existing.member!==u.userId)return reply({error:'This device is linked to another account. Turn off its notifications before switching accounts.'},409);const count=await env.DB!.prepare('SELECT COUNT(*) AS n FROM push_subscriptions WHERE member=?').bind(u.userId).first<any>();if(!existing&&count.n>=3)return reply({error:'Notifications are already enabled on three devices.'},409);await env.DB!.prepare('INSERT INTO push_subscriptions (endpoint,member,updated,reviewer) VALUES (?,?,?,?) ON CONFLICT(endpoint) DO UPDATE SET updated=excluded.updated,reviewer=excluded.reviewer WHERE member=excluded.member').bind(endpoint,u.userId,new Date().toISOString(),isOwner(u)?2:await moderator(u)?1:0).run();return reply({ok:true});}
 if(input.action==='test'){const result=await pushTo(u.userId,endpoint);return result.accepted?reply({ok:true}):reply({error:pushFailureMessage(result.reason)},503);}
 return reply({error:'Unknown notification action.'},400);
 }catch(e){return failure(e);}}

// Resolve names only within access the viewer still has; never return joined profile data.
function notificationDetails(row:any,viewer:string,viewerActive:boolean){
 const item={id:row.id,kind:row.kind,scope:row.scope,title:row.title,url:row.url,created:row.created,read:row.read,detail:'',actionLabel:'View',available:true};
 let actor:any=null;try{actor=row.actor_data?JSON.parse(row.actor_data):null;}catch{}
 const actorAvailable=!!actor&&row.actor_active&&row.actor_status==='admitted'&&actor.rulesVersion===RULES_VERSION;
 const name=actorAvailable&&typeof actor.name==='string'?actor.name.trim()||'A member':'';
 if(['message','reaction','invitation','accepted','photo_exchange','private_plan'].includes(row.kind)){
  const access=viewerActive&&actorAvailable&&[row.sender,row.recipient].includes(viewer)&&['pending','accepted'].includes(row.connection_status);
  if(!access||(row.kind==='private_plan'&&row.connection_status!=='accepted'))return {...item,title:'Connection activity is no longer available',detail:'The invitation or conversation is closed, paused, or no longer accessible.',url:'',available:false,actionLabel:'Mark read'};
  const chat=row.connection_status==='accepted';
  item.url=chat?'#chat/'+encodeURIComponent(row.scope):'#conversations/requests';
  item.actionLabel=chat?'Open chat':'Review invitation';
  item.detail=chat?'Private conversation with '+name:'Invitation involving '+name;
  if(row.kind==='private_plan'){item.title=name+(/New private plan/i.test(row.title)?' proposed a private plan':' updated a private plan');item.actionLabel='View plans in chat';}
  else if(row.kind==='message')item.title=name+' sent you '+(/voice/i.test(row.title)?'a voice note':/photo/i.test(row.title)?'a photo':'a message');
  else if(row.kind==='reaction')item.title=name+' reacted to your message';
  else if(row.kind==='invitation')item.title=name+' invited you to talk';
  else if(row.kind==='accepted')item.title=name+' accepted your invitation';
  else if(row.kind==='photo_exchange')item.title=name+(/agreed/i.test(row.title)?' agreed to share profile photos':' requested profile photo sharing');
 }else if(row.kind==='reviewer_invitation'){
  item.title='You are invited to become a reviewer';item.detail='Choose whether to take on this role in Notifications. No access is granted until you accept.';item.url='#notifications';item.actionLabel='Review invitation';
 }else if(['review','review_report','review_appeal'].includes(row.kind)){
  item.title=row.kind==='review'?'A profile is waiting for review':row.kind==='review_appeal'?'An account appeal is waiting for review':'A report is waiting for review';
  item.detail='Open the safety queue to review items available to you.';item.url='#review';item.actionLabel='Review queue';
 }else if(row.kind.startsWith('circle_')){
  const access=viewerActive&&['open','pending'].includes(row.circle_status)&&(['accepted','requested'].includes(row.circle_membership)||!!row.named_circle_invite);
  if(!access)return {...item,title:'Circle activity is no longer available',detail:'This circle is closed or your access has changed.',url:'',available:false,actionLabel:'Mark read'};
  const title=typeof row.circle_title==='string'?row.circle_title:'Circle';
  item.detail=title;item.actionLabel='Open circle';
  item.url=row.circle_membership==='accepted'?'#circles/'+(row.circle_category==='worker_organizing'?'work/':'')+encodeURIComponent(row.scope):'#circles/'+(row.circle_category?.startsWith('worker_')?'work/':'')+'requests';
  if(row.circle_membership!=='accepted')item.actionLabel='Review request';
  const who=name||'A participant';
  if(row.kind==='circle_message')item.title=who+' sent a circle message';
  else if(row.kind==='circle_reaction')item.title=who+' reacted to your circle message';
  else if(row.kind==='circle_proposal'){item.title=who+' proposed a circle';item.actionLabel='Review proposal';}
  else if(row.kind==='circle_request'){item.title=who+' requested to join';item.actionLabel='Review members';}
  else if(row.kind==='circle_opened')item.title='Both founders agreed to open the circle';
  else if(row.kind==='circle_joined')item.title=who+' joined the circle';
  else if(row.kind==='circle_invite'){item.title=who+' invited you to a worker circle';item.actionLabel='Review invitation';}
  else if(row.kind==='circle_host_invitation'){item.title=row.circle_role==='host'?'You are now a circle host':row.host_invited_by===row.actor?who+' invited you to co-host':'Co-host invitation is no longer pending';}
 }
 return item;
}
