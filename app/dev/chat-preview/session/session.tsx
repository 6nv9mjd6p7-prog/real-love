'use client';
import {privatePlanNext,type PrivatePlan} from '../../../private-plan-model';
import {useCallback,useEffect,useRef} from 'react';
import Conversation from '../../../conversation';
import MainNavigation from '../../../main-navigation';
import {examples} from '../../../model';
import type {ChatMessage} from '../../../conversation-tools';

// Every fixture value is invented. The in-memory API below never uses fetch or storage.
const samplePerson={...examples[0],id:'qa-fictional-person',name:'Aisha',city:'Austin',region:'Texas',country:'United States',communication:['I appreciate direct questions.','Ask before giving advice.'],communicationNote:'One topic at a time works best.'};
const sampleMe={...examples[1],id:'qa-fictional-member',name:'You'};
const now=Date.now();
const sampleMessages:ChatMessage[]=[
 {id:'qa-message-1',body:'Hey! I saw we both like live music. What kind of shows have you been enjoying lately?',created:new Date(now-8*60_000).toISOString(),mine:false,reactions:[]},
 {id:'qa-message-2',body:'Mostly small venues. I like when the room feels relaxed and people are there for the music.',created:new Date(now-6*60_000).toISOString(),mine:true,reactions:[{emoji:'💜',count:1,mine:true}]},
 {id:'qa-message-3',body:'That makes sense. I found a little jazz place last month and it was exactly that kind of night.',created:new Date(now-4*60_000).toISOString(),mine:false,reply:{id:'qa-message-2',name:'You',body:'Mostly small venues. I like when the room feels relaxed and people are there for the music.',mine:true},reactions:[]},
 {id:'qa-message-4',body:'That sounds lovely. What was the place called? I would be up for checking it out sometime.',created:new Date(now-2*60_000).toISOString(),mine:true,reactions:[]},
];

export default function ChatPreviewSession(){
 const messagesRef=useRef<ChatMessage[]>(sampleMessages);
 const revision=useRef(1);
 const plansRef=useRef<PrivatePlan[]>([{id:'fictional-plan',creator:samplePerson.id,kind:'activity',description:'Visit a small live music venue together.',timing:'Choose a day together',startsAt:'',status:'proposed',revision:0,created:new Date().toISOString(),mine:false}]);
 useEffect(()=>{
  const receive=(event:MessageEvent)=>{
   if(event.origin!==window.location.origin||event.source!==window.parent||event.data?.type!=='real-love-qa-keyboard')return;
   const root=document.documentElement;
   // The production composer owns data-keyboard-open. Keep the simulator independent.
   root.toggleAttribute('data-qa-keyboard',!!event.data.open);
  };
  window.addEventListener('message',receive);
  return()=>{window.removeEventListener('message',receive);document.documentElement.removeAttribute('data-qa-keyboard');};
 },[]);
 const api=useCallback(async(input:Record<string,unknown>)=>{
  if(input.action==='private_plans')return {plans:plansRef.current,hasMore:false,cursor:null};
  if(input.action==='private_plan_create'){const plan:PrivatePlan={id:'fictional-plan-'+plansRef.current.length,creator:sampleMe.id,kind:input.kind as PrivatePlan['kind'],description:input.description as string,timing:input.timing as string,startsAt:input.startsAt as string,status:'proposed',revision:0,created:new Date().toISOString(),mine:true};plansRef.current=[plan,...plansRef.current];return {ok:true,plan};}
  if(input.action==='private_plan_update'){const plan=plansRef.current.find(plan=>plan.id===input.plan);if(!plan)throw Error('Plan unavailable');const next=privatePlanNext(plan.status,plan.mine,input.decision as string);if(!next||plan.revision!==input.revision)throw Error('Plan changed');plansRef.current=plansRef.current.map(p=>p.id===plan.id?{...p,status:next,revision:p.revision+1}:p);return {ok:true};}
  if(input.action==='messages'){
   const known=String(revision.current);
   if(input.knownRevision===known)return {unchanged:true,revision:known};
   const list=messagesRef.current;
   return {revision:known,cursor:list.length||null,hasMore:false,messages:list};
  }
  if(input.action==='message'){
   const message:ChatMessage={id:'qa-message-'+(revision.current+4),body:(input.text as string)||'',created:new Date().toISOString(),mine:true,reactions:[]};
   messagesRef.current=[...messagesRef.current,message];revision.current++;return {ok:true};
  }
  return {ok:true};
 },[]);
 const noop=useCallback(()=>{},[]);
 return <div className="app-shell qa-preview-app"><aside className="sidebar"><a className="brand" href="#">real love<span className="brand-dot">.</span></a><MainNavigation current="conversations" onNavigate={noop}/><div className="sidebar-bottom"><p>Fictional test session<br/>No member data</p></div></aside><main><header className="topbar"><span>REAL LOVE · LOCAL QA PREVIEW</span></header><div className="content"><Conversation accountId="qa-fictional-member" me={sampleMe} connection={{id:'qa-fictional-connection',status:'accepted',available:true,incoming:false,person:samplePerson,proposal:'Talk about live music',context:{label:'Shared interest',text:'Live music'},photoMine:false,photoOther:false,photosShared:false}} api={api} onBack={noop} onProfile={noop} onReport={noop} onBlock={noop} onClose={noop} onPhoto={async()=>true} onCircle={noop} onRead={noop}/></div></main><div className="qa-keyboard" aria-hidden="true"><div>◀　⌄ <span>✓</span></div><div>Q　W　E　R　T　Y　U　I　O　P</div><div>A　S　D　F　G　H　J　K　L</div><div>⇧　Z　X　C　V　B　N　M　⌫</div><div>123　　 ☺　　　　 space　　 ↵</div></div></div>;
}
