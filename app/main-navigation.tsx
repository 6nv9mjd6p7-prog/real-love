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
 const items=[{key:'discover',label:'Discover',Icon:Compass,count:0,description:''},{key:'conversations',label:'Chats',Icon:MessageCircle,count:unread,description:`${unread} unread messages`},{key:'circles',label:'Circles',Icon:Users,count:circleRequests,description:'Circle requests'},{key:'profile',label:'My profile',Icon:UserRound,count:0,description:''},{key:'settings',label:'Settings',Icon:Shield,count:0,description:'Privacy and settings'}];
 return <nav aria-label="Main navigation">{items.map(({key,label,Icon,count,description})=><button type="button" key={key} className={'nav-item '+(current===key?'active':'')} aria-current={current===key?'page':undefined} onClick={()=>onNavigate(key)}><Icon size={20} aria-hidden="true"/>{label}{count>0&&<span className="count" aria-label={description}>{key==='conversations'?count+' msg':count}</span>}{key==='conversations'&&requests>0&&<span className="count request-count" aria-label={requests+' connection requests'}>{requests} req</span>}</button>)}</nav>;
}
