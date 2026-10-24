'use client';

import {useRef} from 'react';
import {termsFromThought} from './thought-search';
import {ArrowRight, MessageCircle, PenLine, UsersRound} from 'lucide-react';

export type DiscoveryConcept='people'|'questions'|'thought';
export type SharedQuestion={text:string;count:number};

const concepts:{id:DiscoveryConcept;label:string;icon:typeof UsersRound}[]=[
 {id:'people',label:'People',icon:UsersRound},
 {id:'questions',label:'Questions',icon:MessageCircle},
 {id:'thought',label:'Your thought',icon:PenLine},
];

export function DiscoveryConceptSwitcher({value,onChange,allowThought=true}:{value:DiscoveryConcept;onChange:(value:DiscoveryConcept)=>void;allowThought?:boolean}){
 const availableConcepts=concepts.filter(item=>allowThought||item.id!=='thought');
 const selectedIndex=Math.max(0,availableConcepts.findIndex(item=>item.id===value));
 const radios=useRef<Array<HTMLButtonElement|null>>([]);
 const navigate=(index:number,key:string,event:React.KeyboardEvent<HTMLButtonElement>)=>{
  let next=index;
  if(key==='ArrowRight'||key==='ArrowDown')next=(index+1)%availableConcepts.length;
  else if(key==='ArrowLeft'||key==='ArrowUp')next=(index-1+availableConcepts.length)%availableConcepts.length;
  else if(key==='Home')next=0;
  else if(key==='End')next=availableConcepts.length-1;
  else return;
  event.preventDefault();onChange(availableConcepts[next].id);radios.current[next]?.focus();
 };
 return <div className="discovery-concept-switcher" role="radiogroup" aria-label="Choose how to discover">
  {availableConcepts.map(({id,label,icon:Icon},index)=><button type="button" role="radio" key={id} ref={node=>{radios.current[index]=node;}} aria-checked={value===id} tabIndex={index===selectedIndex?0:-1} onKeyDown={event=>navigate(index,event.key,event)} onClick={()=>onChange(id)}><Icon size={16} aria-hidden="true"/><span>{label}</span></button>)}
 </div>;
}

export function QuestionsBrowser({questions,onExplore,onWriteThought,onReset,onDemo,onPeople,demo=false,filtered=false}:{questions:SharedQuestion[];onExplore:(question:string)=>void;onWriteThought:()=>void;onReset:()=>void;onDemo:()=>void;onPeople:()=>void;demo?:boolean;filtered?:boolean}){
 return <section className="discovery-question-browser" aria-labelledby="discovery-questions-title">
  <header><p className="eyebrow">START WITH AN IDEA{demo?' · FICTIONAL EXAMPLES':''}</p><h2 id="discovery-questions-title">Questions people are carrying</h2><p className="field-help">{demo?'These questions belong to fictional example profiles.':'These are questions people chose to share on their profiles.'} Choose a question to see the profiles that mention it. Nothing is sent.</p><p className="question-browse-count" role="status">{questions.length} {questions.length===1?'question':'questions'} shown{filtered?' with your current filters':''}</p></header>
  {questions.length?<><p className="field-help">Showing up to 30 distinct questions. Shared wording does not mean shared beliefs.</p><div className="discovery-question-list">{questions.map(question=><article key={question.text}>
   <button type="button" aria-label={'See '+(demo?'example profiles':'people')+' for: '+question.text} onClick={()=>onExplore(question.text)}><span className="discovery-question-text">{question.text}</span><span className="discovery-question-meta">{question.count} {demo?(question.count===1?'example profile shares':'example profiles share'):(question.count===1?'person shared':'people shared')} this{demo?' question':''}</span><span className="discovery-question-action">See {demo?'examples':'people'} <ArrowRight size={18} aria-hidden="true"/></span></button>
  </article>)}</div></>:<div className="discovery-ideas-empty questions-empty"><h3>{filtered?'No questions match your current choices.':'No shared questions available yet.'}</h3><p>{filtered?'Try removing search terms or filters. Profile visibility and access limits still apply.':'People can add a question to their profile whenever they are ready. You can explore profiles even when they have not shared a question.'}</p><div className="inline-actions">{filtered&&<button type="button" className="secondary" onClick={onReset}>Reset search and filters</button>}<button type="button" className="secondary" onClick={onPeople}>Browse people</button>{!demo&&<button type="button" className="text-button" onClick={onDemo}>Try example questions</button>}</div></div>}
  {!demo&&<div className="question-own-thought"><p className="field-help">Have a different question in mind?</p><button type="button" className="text-button" onClick={onWriteThought}>Start with your own thought <ArrowRight size={16} aria-hidden="true"/></button><p className="field-help">This opens a private search. It does not post to your profile.</p></div>}
 </section>;
}

export function ThoughtFinder({thought,onThoughtChange,onFind,disabled=false,demo=false}:{thought:string;onThoughtChange:(value:string)=>void;onFind:()=>void;disabled?:boolean;demo?:boolean}){
 const input=useRef<HTMLTextAreaElement>(null),terms=termsFromThought(thought);
 const examples=['How does culture shape what we believe?','How can men ask for support?','Building a community without controlling people'];
 return <section className="discovery-thought-finder" aria-labelledby="discovery-thought-title">
  <p className="eyebrow">PRIVATE SEARCH{demo?' · FICTIONAL EXAMPLES':''}</p><h2 id="discovery-thought-title">Start with your thought.</h2>
  <p id="thought-help" className="field-help">Write a question, perspective, or a few topics. We look for shared profile text containing at least one of up to five keywords. You decide whether to start a conversation.</p>
  <p id="thought-privacy" className="thought-privacy-note"><strong>Only a search.</strong> This is not posted to your profile or sent to anyone. Your draft stays here until you reload or leave this page.</p>
  <label htmlFor="discovery-thought-input">Your question or perspective</label>
  <textarea ref={input} id="discovery-thought-input" aria-describedby="thought-help thought-privacy thought-count thought-keywords" value={thought} maxLength={500} rows={4} placeholder="What would you like to explore with someone?" onChange={event=>onThoughtChange(event.target.value)} />
  <div className="thought-answer-actions"><span id="thought-count" className="field-help">{thought.length}/500 characters</span><span className="sr-only" role="status" aria-atomic="true">{thought.length>0&&thought.length%50===0?`${thought.length} of 500 characters used.`:''}</span><button type="button" className="text-button" disabled={!thought} onClick={()=>{onThoughtChange('');input.current?.focus();}}>Clear thought</button></div>
  <div id="thought-keywords" className="thought-keywords"><strong>Keywords for this search</strong>{terms.length?<><div className="thought-keyword-list">{terms.map(term=><span key={term}>{term}</span>)}</div><p className="field-help">Other discovery filters still apply. Shared words do not mean shared beliefs.</p></>:<p className="field-help">{thought.trim()?'Add a specific topic, like art, AI, history, or community. Common words and single letters are skipped.':'Add your thought to preview its keywords.'}</p>}</div>
  <button type="button" className="primary" disabled={disabled||!terms.length} onClick={onFind}>Find {demo?'examples':'people'} exploring this <ArrowRight size={17} aria-hidden="true"/></button>
  {!thought.trim()&&<div className="thought-examples"><h3>Need a starting point?</h3><p className="field-help">Choose an example to edit. It will not search until you choose Find.</p>{examples.map(example=><button type="button" className="secondary" key={example} onClick={()=>{onThoughtChange(example);input.current?.focus();}}>{example}</button>)}</div>}
 </section>;
}
