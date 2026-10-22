'use client';
import {useCurrentTime} from './use-current-time';
import {useEffect,useRef,useState} from 'react';

export type CampaignDraft={title:string;company:string;summary:string;demand:string;uncertainty:string;alternatives:string;reviewDate:string;sources:{url:string;claim:string}[]};
/** Split the long proposal into focused steps; draft values remain owned by the parent. */
// Proposal steps are navigation, sources are free-form evidence, and agreement is a deliberate checkbox.
export default function CampaignProposal({draft,setDraft,consent,setConsent,busy,onSubmit}:{draft:CampaignDraft;setDraft:(draft:CampaignDraft)=>void;consent:boolean;setConsent:(value:boolean)=>void;busy:boolean;onSubmit:()=>Promise<boolean>}){
 const [step,setStep]=useState(0),[submitting,setSubmitting]=useState(false);
 const heading=useRef<HTMLHeadingElement>(null),sending=useRef(false);
 useEffect(()=>{heading.current?.focus();},[step]);
 const now=useCurrentTime();
 const steps=['Purpose','Evidence','Review and submit'];
 function update(next:CampaignDraft){setDraft(next);setConsent(false);}
 async function submit(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();if(busy||sending.current||!e.currentTarget.reportValidity())return;
  if(step<2){setStep(step+1);return;}
  sending.current=true;setSubmitting(true);try{await onSubmit();}finally{sending.current=false;setSubmitting(false);}
 }
 const fields=step===0?[
  {key:'title',label:'Campaign title',min:5,max:100},
  {key:'company',label:'Company or brand',min:2,max:120},
  {key:'summary',label:'What happened? Include dates and documented facts.',min:30,max:1500},
  {key:'demand',label:'Specific demand and how success can be checked',min:20,max:1000},
 ] as const:[
  {key:'uncertainty',label:'Disputed claims, missing evidence, or company response',min:10,max:800},
  {key:'alternatives',label:'Practical alternatives and any sponsorship or financial interests',min:10,max:800},
 ] as const;
 return <form className="form-section campaign-form" onSubmit={submit}>
  <div className="setup-progress" aria-label={'Proposal step '+(step+1)+' of 3'}>{steps.map((name,i)=><button type="button" key={name} disabled={busy||submitting||i>step} aria-current={i===step?'step':undefined} className={i===step?'current':''} onClick={()=>setStep(i)}>{i+1}. {name}</button>)}</div>
  <h2 ref={heading} tabIndex={-1}>{steps[step]}</h2>
  <p className="field-help">{step===0?'Target a company or brand, not a private individual. State the facts and the change you are asking for.':step===1?'Explain what each source supports, what remains uncertain, and practical alternatives.':'Check your proposal before sending it for independent review. It will not publish automatically.'}</p>
  {step<2&&fields.map(f=><label key={f.key}>{f.label}{f.max>120?<textarea disabled={busy||submitting} required minLength={f.min} maxLength={f.max} value={draft[f.key]} onChange={e=>update({...draft,[f.key]:e.target.value})}/>:<input disabled={busy||submitting} required minLength={f.min} maxLength={f.max} value={draft[f.key]} onChange={e=>update({...draft,[f.key]:e.target.value})}/>}</label>)}
  {step===1&&<fieldset><legend>Sources · explain what each one supports</legend>{draft.sources.map((source,i)=><div className="campaign-source" key={i}><label>Source {i+1} · HTTPS link<input disabled={busy||submitting} type="url" required maxLength={1000} pattern="https://.*" value={source.url} onChange={e=>update({...draft,sources:draft.sources.map((s,n)=>n===i?{...s,url:e.target.value}:s)})}/></label><label>Claim supported<textarea disabled={busy||submitting} required minLength={10} maxLength={500} value={source.claim} onChange={e=>update({...draft,sources:draft.sources.map((s,n)=>n===i?{...s,claim:e.target.value}:s)})}/></label>{draft.sources.length>1&&<button disabled={busy||submitting} type="button" className="text-button" onClick={()=>update({...draft,sources:draft.sources.filter((_,n)=>n!==i)})}>Remove source {i+1}</button>}</div>)}{draft.sources.length<5&&<button disabled={busy||submitting} className="secondary" type="button" onClick={()=>update({...draft,sources:[...draft.sources,{url:'',claim:''}]})}>Add source</button>}</fieldset>}
  {step===2&&<>
   <section className="proposal-review" aria-label="Proposal summary">
    {([['Campaign title',draft.title],['Company or brand',draft.company],['What happened',draft.summary],['The demand',draft.demand],['Uncertainty and responses',draft.uncertainty],['Alternatives and interests',draft.alternatives]]).map(([label,value])=><div key={label}><h3>{label}</h3><p>{value}</p></div>)}
    <div><h3>Evidence sources</h3>{draft.sources.map((s,i)=><div key={i}><p>{s.url}</p><p>{s.claim}</p></div>)}</div>
   </section>
   <label>Next review date · within 90 days<input disabled={busy||submitting} type="date" required min={new Date(now+86400000).toISOString().slice(0,10)} max={new Date(now+90*86400000).toISOString().slice(0,10)} value={draft.reviewDate} onChange={e=>update({...draft,reviewDate:e.target.value})}/></label>
   <label className="campaign-check"><input disabled={busy||submitting} type="checkbox" required checked={consent} onChange={e=>setConsent(e.target.checked)}/>I will keep participation voluntary, avoid threats and personal targeting, disclose conflicts, and distinguish evidence from allegations.</label>
  </>}
  <div className="setup-actions">{step>0&&<button type="button" className="secondary" disabled={busy||submitting} onClick={()=>setStep(step-1)}>Back</button>}<button className="primary" disabled={busy||submitting}>{busy||submitting?'Submitting…':step===0?'Continue to evidence':step===1?'Review proposal':'Submit for review'}</button></div>
 </form>;
}
