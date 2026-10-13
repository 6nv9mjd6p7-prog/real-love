/**
 * Selects up to two available accepted conversations, prioritizing unread activity, and renders request shortcuts. Empty activity returns no markup.
 * Reading guide: docs/CODE_READING_GUIDE.md.
 */
'use client';
type Chat={id:string;status:string;available?:boolean;unread?:number;person:{name:string};created?:string;lastMessage?:{created:string}|null};
export function recentActivityChats(connections:Chat[]){return connections.filter(c=>c.status==='accepted'&&c.available!==false).sort((a,b)=>Number(!!b.unread)-Number(!!a.unread)||(Date.parse(b.lastMessage?.created||b.created||'')||0)-(Date.parse(a.lastMessage?.created||a.created||'')||0)).slice(0,2);}
export default function ReturningActivity({connections,requests,circleRequests,circleUpdates,onNavigate}:{connections:Chat[];requests:number;circleRequests:number;circleUpdates:number;onNavigate:(route:string)=>void}){
 const chats=recentActivityChats(connections),unread=connections.filter(c=>c.status==='accepted'&&c.available!==false).reduce((n,c)=>n+(c.unread||0),0);
 if(!chats.length&&!requests&&!circleRequests&&!circleUpdates)return null;
 return <section className="returning-activity" aria-labelledby="returning-title"><div className="activity-heading"><h2 id="returning-title">Continue connecting</h2><span>At your own pace</span></div><div className="activity-shortcuts">
 <button onClick={()=>onNavigate('conversations/chats')}><strong>Chats</strong><span>{unread?unread+' unread messages':'Open your chats'}</span></button>
 {requests>0&&<button onClick={()=>onNavigate('conversations/requests')}><strong>Requests</strong><span>{requests} invitations to review</span></button>}
 {circleRequests>0&&<button onClick={()=>onNavigate('circles/requests')}><strong>Circle requests</strong><span>{circleRequests} to review</span></button>}
 {circleUpdates>0&&<button onClick={()=>onNavigate('notifications')}><strong>Circle activity</strong><span>{circleUpdates} new updates</span></button>}
 </div>{chats.length>0&&<div className="activity-recent" aria-label="Recent conversations">{chats.map(c=><button key={c.id} onClick={()=>onNavigate('chat/'+encodeURIComponent(c.id))}><strong>{c.person.name}</strong><span>{c.unread?c.unread+' unread':'Continue conversation'} →</span></button>)}</div>}</section>;
}
