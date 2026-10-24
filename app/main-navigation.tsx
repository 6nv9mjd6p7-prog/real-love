'use client';
import {Compass,MessageCircle,Users,UserRound,Shield} from 'lucide-react';
export function mainDestination(route:string){
 if(route==='circles'||route.startsWith('circles/'))return 'circles';
 if(route==='settings')return 'settings';
 if(['profile','review','notifications'].includes(route))return route;
 if(route==='conversations'||route.startsWith('conversations/')||route.startsWith('chat/'))return 'conversations';
 return 'discover';
}
export default function MainNavigation({current,onNavigate,circleRequests=0,reviewAlerts=0,requests=0,unread=0}:{current:string;onNavigate:(route:string)=>void;circleRequests?:number;reviewAlerts?:number;requests?:number;unread?:number}){
 const items=[{key:'discover',label:'Discover',Icon:Compass,count:0},{key:'conversations',label:'Chats',Icon:MessageCircle,count:unread},{key:'circles',label:'Circles',Icon:Users,count:circleRequests},{key:'profile',label:'My profile',Icon:UserRound,count:0},{key:'settings',label:'Settings',Icon:Shield,count:0}];
 const badge=(count:number)=>count>99?'99+':String(count);
 return <nav aria-label="Main navigation">{items.map(({key,label,Icon,count})=>{
  const chat=key==='conversations',total=chat?unread+requests:count;
  const activity=chat?[unread>0?`${unread} unread ${unread===1?'message':'messages'}`:'',requests>0?`${requests} connection ${requests===1?'request':'requests'}`:''].filter(Boolean).join(', '):total>0?`${total} circle ${total===1?'request':'requests'}`:'';
  return <button type="button" key={key} className={'nav-item '+(current===key?'active':'')} aria-label={activity?label+', '+activity:label} aria-current={current===key?'page':undefined} onClick={()=>onNavigate(key)}><span className="nav-icon"><Icon size={20} aria-hidden="true"/>{total>0&&<span className="count" aria-hidden="true">{badge(total)}</span>}</span><span className="nav-item-label">{label}</span></button>;
 })}</nav>;
}
