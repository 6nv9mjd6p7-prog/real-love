/**
 * Shared text and voice composer for direct and circle conversations. Parent callbacks own sending and draft updates.
 * Reading guide: docs/CODE_READING_GUIDE.md.
 */
'use client';
import {useEffect,useId,useState,type RefObject,type FormEvent} from 'react';
import {Send, X} from 'lucide-react';
import VoiceRecorder from './voice-recorder';

export default function ChatComposer({accountId,kind,scope,value,onChange,textareaRef,label,placeholder,disabled,sending,onSubmit,reply,replyTo,onCancelReply,onVoiceSent}:{
 accountId:string;kind:'direct'|'circle';scope:string;value:string;onChange:(value:string)=>void;
 textareaRef:RefObject<HTMLTextAreaElement|null>;label:string;placeholder:string;disabled:boolean;sending:boolean;
 onSubmit:(event:FormEvent<HTMLFormElement>)=>void;reply:{name:string;body:string}|null;replyTo?:string;
 onCancelReply:()=>void;onVoiceSent:()=>Promise<void>;
}){
 useEffect(()=>{const el=textareaRef.current?.closest<HTMLElement>('.conversation-screen,.circle-conversation');if(!el)return;const shell=el.closest<HTMLElement>('.app-shell');const viewport=window.visualViewport;const resize=()=>{shell?.style.setProperty('--app-viewport',(viewport?.height||window.innerHeight)+'px');if(textareaRef.current===document.activeElement)requestAnimationFrame(()=>textareaRef.current?.closest('form')?.scrollIntoView({block:'nearest',behavior:'auto'}));};resize();viewport?.addEventListener('resize',resize);viewport?.addEventListener('scroll',resize);window.addEventListener('resize',resize);return()=>{viewport?.removeEventListener('resize',resize);viewport?.removeEventListener('scroll',resize);window.removeEventListener('resize',resize);shell?.style.removeProperty('--app-viewport');};},[textareaRef]);
 const id=useId(),[voiceActive,setVoiceActive]=useState(false);
 useEffect(()=>{const el=textareaRef.current;if(el){el.style.height='auto';el.style.height=Math.min(el.scrollHeight,144)+'px';}},[value,voiceActive,textareaRef]);
 return <form className={'chat-composer'+(voiceActive?' recording-active':'')} onFocusCapture={()=>{if(window.matchMedia('(max-width:700px)').matches)requestAnimationFrame(()=>textareaRef.current?.closest('form')?.scrollIntoView({block:'nearest',behavior:'auto'}));}} onSubmit={event=>{if(disabled||voiceActive||!value.trim()){event.preventDefault();return;}onSubmit(event);}}>
  {reply&&<div className="reply-composer" role="status"><div><strong>Replying to {reply.name}</strong><p>{reply.body}</p></div><button type="button" aria-label="Cancel reply" disabled={disabled||voiceActive} onClick={onCancelReply}><X size={20}/></button></div>}
  <div className="composer-controls">
   <VoiceRecorder accountId={accountId} kind={kind} scope={scope} replyTo={replyTo} disabled={disabled} compact onBusyChange={setVoiceActive} onSent={onVoiceSent}/>
   {!voiceActive&&<><label className="sr-only" htmlFor={id}>{label}</label><textarea ref={textareaRef} id={id} rows={1} maxLength={1500} disabled={disabled} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} aria-describedby={value.length>1200?id+'-count':undefined}/><button type="submit" className="composer-send" aria-label={sending?'Sending message':'Send message'} title="Send message" disabled={disabled||!value.trim()}><Send size={20}/></button></>}
  </div>
  {value.length>1200&&<p className="composer-count" id={id+'-count'} aria-live="polite">{value.length}/1,500</p>}
 </form>;
}
