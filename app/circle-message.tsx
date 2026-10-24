'use client';
import type {ComponentProps} from 'react';
import {EllipsisVertical} from 'lucide-react';
import ChatBubble from './chat-bubble';
import {formatCircleMessageBody} from './circle-message-format';
export default function CircleMessage(props:ComponentProps<typeof ChatBubble>){
 const {message,name}=props;
 return <div className={'circle-message-row'+(message.mine?' is-mine':'')}>
  {!message.mine&&<span className="circle-message-avatar" aria-hidden="true">{name.trim().charAt(0).toUpperCase()||'?'}</span>}
  <div className="circle-message-content"><div className="circle-message-heading"><strong>{message.mine?'You':name}</strong><time dateTime={message.created}>{new Date(message.created).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}{message.mine&&!message.deletedAt?' · Sent':''}</time></div>
   <ChatBubble {...props} displayBody={formatCircleMessageBody(message.body)} displayReplyBody={message.reply?formatCircleMessageBody(message.reply.body):undefined} externalMeta compactActions={<EllipsisVertical size={18} aria-hidden="true"/>}/>
  </div>
 </div>;
}
