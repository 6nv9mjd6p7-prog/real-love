'use client';
type Chat={id:string;status:string;available?:boolean;unread?:number;person:{name:string};created?:string;lastMessage?:{created:string}|null};
export function recentActivityChats(connections:Chat[]){return connections.filter(c=>c.status==='accepted'&&c.available!==false).sort((a,b)=>Number(!!b.unread)-Number(!!a.unread)||(Date.parse(b.lastMessage?.created||b.created||'')||0)-(Date.parse(a.lastMessage?.created||a.created||'')||0)).slice(0,2);}
export default function ReturningActivity({connections,requests,circleRequests,circleUpdates,onNavigate}:{connections:Chat[];requests:number;circleRequests:number;circleUpdates:number;onNavigate:(route:string)=>void}){
 const chats=recentActivityChats(connections),unread=connections.filter(c=>c.status==='accepted'&&c.available!==false).reduce((n,c)=>n+(c.unread||0),0);
 if(!chats.length&&!requests&&!circleRequests&&!circleUpdates)return null;
 return <section className="returning-activity" aria-labelledby="returning-title">
 <div className="activity-heading"><h2 id="returning-title">Continue connecting</h2>{chats.length>0&&<button className="text-button" onClick={()=>onNavigate('conversations/chats')}>All chats{unread>0&&<span> · {unread} unread messages</span>}</button>}</div>
 {(requests>0||circleRequests>0||circleUpdates>0)&&<div className="activity-shortcuts">
 {requests>0&&<button onClick={()=>onNavigate('conversations/requests')}><strong>Connection requests</strong><span>{requests} {requests===1?'invitation':'invitations'} to review</span></button>}
 {circleRequests>0?<button onClick={()=>onNavigate('circles/requests')}><strong>Circle requests</strong><span>{circleRequests} to review</span></button>:circleUpdates>0&&<button onClick={()=>onNavigate('notifications')}><strong>Circle activity</strong><span>{circleUpdates} new {circleUpdates===1?'update':'updates'}</span></button>}
 </div>}
 {chats.length>0&&<div className="activity-recent" aria-label="Recent conversations">{chats.map(c=><button key={c.id} onClick={()=>onNavigate('chat/'+encodeURIComponent(c.id))}><strong>{c.person.name}</strong><span>{c.unread?c.unread+' unread':'Open chat'} →</span></button>)}</div>}
 </section>;
}
