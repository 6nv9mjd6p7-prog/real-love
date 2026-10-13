/**
 * Inbox summary for an accepted connection. Opening the row delegates navigation to the app shell.
 * Reading guide: docs/CODE_READING_GUIDE.md.
 */
'use client';
import type {ReactNode} from 'react';
type Chat={person:{name:string};available?:boolean;unread?:number;lastMessage?:{mine:boolean;body:string;created:string}|null};
export default function ChatRow({chat,avatar,onOpen}:{chat:Chat;avatar:ReactNode;onOpen:()=>void}){
 const last=chat.lastMessage;
 return <article className="conversation-row chat-list-row"><div className="chat-row-avatar">{avatar}</div><button className="chat-row-open" onClick={onOpen} aria-label={'Open conversation with '+chat.person.name+(chat.unread?' · '+chat.unread+' unread messages':'')}>
 <span className="chat-row-title"><strong>{chat.person.name}</strong>{last&&<time dateTime={last.created}>{new Date(last.created).toLocaleDateString([],{month:'short',day:'numeric'})+' · '+new Date(last.created).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</time>}</span>
 <span className="chat-row-preview">{chat.available===false?'Interaction unavailable · safety options':last?(last.mine?'You: ':'')+last.body:'Say hello'}</span>
 {!!chat.unread&&<span className="count chat-row-count" aria-hidden="true">{chat.unread}</span>}
 </button></article>;
}
