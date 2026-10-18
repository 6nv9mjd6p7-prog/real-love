'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,CalendarDays,Ellipsis} from 'lucide-react';
import CircleSections,{type CircleView} from '../../../circle-sections';
import CircleMessage from '../../../circle-message';
import ChatComposer from '../../../chat-composer';
import ConversationIdeas from '../../../conversation-ideas';
import MainNavigation from '../../../main-navigation';
import {appendPrompt} from '../../../conversation-tools';
const initial=[
 {id:'sample-1',name:'Maya',body:'Anyone up for the repair afternoon?',created:'2026-10-18T10:14:00',mine:false},
 {id:'sample-2',name:'Sam',body:'I can bring a few basic tools.',created:'2026-10-18T10:18:00',mine:false},
 {id:'sample-3',name:'You',body:'I’m in. What should we start with?',created:'2026-10-18T10:24:00',mine:true},
 {id:'sample-4',name:'Maya',body:'Let’s keep it small and see what everyone needs.',created:'2026-10-18T10:28:00',mine:false}
];
// Fictional layout fixture. All messages stay in memory; it has no production API transport.
export default function CirclePreview(){
 const [view,setView]=useState<CircleView>('Chat'),[more,setMore]=useState(false),[draft,setDraft]=useState(''),[messages,setMessages]=useState(initial),[active,setActive]=useState(false),[notice,setNotice]=useState('');
 const field=useRef<HTMLTextAreaElement>(null),nextMessage=useRef(4);
 useEffect(()=>{const receive=(event:MessageEvent)=>{if(event.origin===location.origin&&event.source===parent&&event.data?.type==='real-love-qa-keyboard')document.documentElement.toggleAttribute('data-qa-keyboard',!!event.data.open);};window.addEventListener('message',receive);return()=>{window.removeEventListener('message',receive);document.documentElement.removeAttribute('data-qa-keyboard');};},[]);
 const noop=()=>{};
 return <div className="app-shell qa-preview-app"><aside className="sidebar"><MainNavigation current="circles" onNavigate={()=>setNotice('Global navigation is available in the live app.')}/></aside><main><div className="content"><section className="chat-panel circle-conversation circle-workspace">
  <div className="chat-context-area"><header className="circle-workspace-heading"><button type="button" className="circle-back" onClick={()=>setNotice('Back to Circles is available in the live app.')}><ArrowLeft size={20}/><span>Circles</span></button><div className="circle-workspace-title"><h1>Weekend makers</h1><p>8 members</p></div><button type="button" className="circle-more-button" aria-expanded={more} disabled={active} onClick={()=>setMore(!more)}><Ellipsis size={20}/><span>More</span></button></header>
  {more&&<div className="circle-more-panel"><h2>Circle options</h2>{['Circle purpose & access','Conversation alerts','Who can see these messages?','Search this circle','Conversation help & privacy','Host tools'].map(label=><details key={label}><summary>{label}</summary><p>These controls remain available in the live app. This fictional preview contains no member data.</p></details>)}</div>}
  <CircleSections circleId="fictional" value={view} onChange={setView} disabled={active}/></div>
  {notice&&<p role="status">{notice}</p>}
  <section id="circle-panel-Chat-fictional" role="tabpanel" aria-labelledby="circle-tab-Chat-fictional" hidden={view!=='Chat'} className="circle-chat-panel"><details className="circle-activity-strip"><summary><CalendarDays size={18}/><span><strong>Next:</strong> Repair afternoon · Today, 3 PM</span></summary><div><button className="text-button" onClick={()=>{setView('Plan');}}>View plans</button></div></details>
  <div className="messages conversation-messages" role="log" aria-label="Fictional circle messages">{messages.map(message=><CircleMessage key={message.id} message={message} name={message.name} onReply={()=>{setDraft('Replying to '+message.name+': ');field.current?.focus();}} onReact={()=>setNotice('Reaction selected in the fictional preview.')} onReport={message.mine?undefined:()=>setNotice('Reporting remains available in the live app.')}/>)}</div>
  <div className="circle-compose-dock"><ConversationIdeas accountId="fictional-preview" circle draft={draft} onAdd={idea=>{const value=appendPrompt(draft,idea);if(value!==null){setDraft(value);field.current?.focus();}}} disabled={active}/><ChatComposer accountId="fictional-preview" kind="circle" scope="fictional" value={draft} onChange={setDraft} textareaRef={field} label="Group message" placeholder="Write a message…" disabled={false} sending={false} onActivityChange={setActive} onSubmit={event=>{event.preventDefault();if(!draft.trim())return;const id='sample-'+(++nextMessage.current);setMessages(previous=>[...previous,{id,name:'You',body:draft,created:new Date().toISOString(),mine:true}]);setDraft('');}} reply={null} onCancelReply={noop} onVoiceSent={async()=>{}} onImageSend={async()=>{throw Error('Photo uploads are disabled in this fictional layout preview.');}} onImageSent={async()=>{}}/></div></section>
  <section id="circle-panel-Plan-fictional" role="tabpanel" aria-labelledby="circle-tab-Plan-fictional" hidden={view!=='Plan'} className="circle-section-panel"><h2>Plan</h2><h3>Repair afternoon</h3><p>Today, 3 PM · Bring a small item you would like help repairing.</p><button className="secondary" onClick={()=>{setDraft('For the repair afternoon, what should we start with?');setView('Chat');}}>Discuss this activity</button></section>
  <section id="circle-panel-People-fictional" role="tabpanel" aria-labelledby="circle-tab-People-fictional" hidden={view!=='People'} className="circle-section-panel"><h2>Members</h2><p>8 members</p>{['Maya · host','Sam','You'].map(name=><p key={name}>{name}</p>)}<p className="field-help">Fictional layout preview. Membership actions remain in the live app.</p></section>
 </section></div></main><div className="qa-keyboard" aria-hidden="true"><div>Keyboard preview</div><div>Q W E R T Y U I O P</div><div>A S D F G H J K L</div><div>Z X C V B N M</div><div>space</div></div></div>;
}
