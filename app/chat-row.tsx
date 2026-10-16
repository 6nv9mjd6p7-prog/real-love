'use client';
import type {ReactNode} from 'react';
type Chat={context?:{label:string;text:string}|null;person:{name:string};available?:boolean;unread?:number;lastMessage?:{mine:boolean;body:string;created:string}|null};
export default function ChatRow({chat,avatar,onOpen}:{chat:Chat;avatar:ReactNode;onOpen:()=>void}){
 const last=chat.lastMessage;
 return <article className={'conversation-row chat-list-row'+(chat.unread?' chat-unread':'')}><div className="chat-row-avatar">{avatar}</div><button type="button" className="chat-row-open" onClick={onOpen} aria-label={'Open conversation with '+chat.person.name+(chat.unread?' · '+chat.unread+' unread messages':'')}>
 <span className="chat-row-title"><strong>{chat.person.name}</strong>{last&&<time dateTime={last.created} title={new Date(last.created).toLocaleString()}>{chatListTimestamp(last.created)}</time>}</span>
 <span className="chat-row-preview">{chat.available===false?'Interaction unavailable · safety options':last?(last.mine?'You: ':'')+last.body:'Say hello'}</span>
 {!!chat.unread&&<span className="count chat-row-count" aria-hidden="true">{chat.unread}</span>}
 </button></article>;
}


export function chatListTimestamp(created:string,now=new Date()){
 const date=new Date(created);
 if(Number.isNaN(date.getTime()))return '';
 if(date.toDateString()===now.toDateString())return date.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
 const yesterday=new Date(now);yesterday.setDate(yesterday.getDate()-1);
 if(date.toDateString()===yesterday.toDateString())return 'Yesterday';
 return date.toLocaleDateString([],{month:'short',day:'numeric',...(date.getFullYear()!==now.getFullYear()?{year:'numeric' as const}:{})});
}
