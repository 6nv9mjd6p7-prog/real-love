'use client';
import {useEffect,useRef,useState} from 'react';
import {examples} from './model';
import {sampleReplyFor} from './sample-conversation-tools';
import SharedAvatar from './shared-avatar';

type SampleMessage={id:number;mine:boolean;text:string};
const sample=examples[1];
const subject=sample.question;
const firstStarter=`You asked, “${subject}” What do you think helps a group stay accountable?`;

export default function ConversationDemo({onBack}:{onBack:()=>void}){
 const [messages,setMessages]=useState<SampleMessage[]>([]);
 const [draft,setDraft]=useState(firstStarter);
 const [replying,setReplying]=useState(false);
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const pane=useRef<HTMLDivElement>(null);
 const draftField=useRef<HTMLTextAreaElement>(null);
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current);},[]);
 useEffect(()=>{if(pane.current)pane.current.scrollTop=pane.current.scrollHeight;},[messages,replying]);
 useEffect(()=>{
  const field=draftField.current;if(!field)return;
  const fitDraft=()=>{field.style.height='auto';field.style.height=Math.min(field.scrollHeight+4,148)+'px';};
  fitDraft();
  window.addEventListener('resize',fitDraft);
  window.visualViewport?.addEventListener('resize',fitDraft);
  return()=>{window.removeEventListener('resize',fitDraft);window.visualViewport?.removeEventListener('resize',fitDraft);};
 },[draft]);
 function send(event:React.FormEvent){
  event.preventDefault();
  const text=draft.trim();if(!text||replying)return;
  const next=[...messages,{id:Date.now(),mine:true,text}];
  setMessages(next);setDraft('');setReplying(true);
  timer.current=setTimeout(()=>{
   setMessages(current=>[...current,{id:Date.now()+1,mine:false,text:sampleReplyFor(text,current.filter(message=>!message.mine).length+1)}]);
   setReplying(false);
  },650);
 }
 function reset(){if(timer.current)clearTimeout(timer.current);timer.current=null;setMessages([]);setDraft(firstStarter);setReplying(false);}
 return <section className="conversation-screen sample-chat-screen" aria-labelledby="sample-chat-title">
  <header className="conversation-heading sample-chat-heading"><button className="text-button chat-back" onClick={onBack}><span aria-hidden="true">←</span><span>Examples</span></button><div><div className="conversation-person"><SharedAvatar person={sample} shared={false}/><h1 id="sample-chat-title">A sample conversation</h1></div><p>Fictional · simulated replies · nothing is sent or saved</p></div><button type="button" className="text-button sample-reset" onClick={reset}>Start over</button></header>
  <div className="sample-chat-layout"><aside className="sample-chat-context"><span className="eyebrow">How you connected</span><h2>Jules</h2><p>Shared interests: community, belonging, and art.</p><blockquote><strong>Question that started it</strong><p>{subject}</p></blockquote><p className="field-help">This example uses the exact profile question as the conversation starter.</p></aside>
   <div className="sample-chat-main"><div className="sample-chat-disclaimer" role="note"><strong>Practice chat</strong><span>Jules is fictional. Replies are simulated on this device and are not from a real person.</span></div>
    <div className="sample-chat-messages" role="log" aria-label="Sample conversation" aria-live="polite" ref={pane}>
     {!messages.length&&<div className="sample-chat-empty"><p>Start with the question Jules shared:</p><button className="sample-starter-chip" type="button" onClick={()=>setDraft(firstStarter)}>Use the suggested reply to “{subject}”</button><p className="field-help">Edit the suggested reply below, or write your own.</p></div>}
     {messages.map(message=><article className={'sample-message'+(message.mine?' mine':'')} key={message.id}><span className="sample-message-author">{message.mine?'You':'Jules · simulated'}</span><p>{message.text}</p></article>)}
     {replying&&<div className="sample-replying" role="status">Jules is writing a sample reply…</div>}
    </div>
    <form className="sample-chat-composer" onSubmit={send}><label htmlFor="sample-chat-draft">Your message</label><textarea ref={draftField} id="sample-chat-draft" maxLength={1500} value={draft} onChange={event=>setDraft(event.target.value)} placeholder="Write a message…"/><div><span className="field-help">{draft.length}/1500 · stays in this preview only</span><button className="primary" type="submit" disabled={!draft.trim()||replying}>{replying?'Replying…':'Send sample message'}</button></div></form>
   </div>
  </div>
 </section>;
}
