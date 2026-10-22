'use client';
import {useCallback,useEffect,useId,useRef,useState} from 'react';
import {useTabDraft} from './use-tab-draft';
import {messageAttempt,clearMessageAttempt} from './draft-storage';

type Entry={id:string;sender:string;name:string;body:string;status:string;created:string;mine:boolean;canManage:boolean};
type Details={status:string;canManage:boolean;steps:Entry[];updates:Entry[];cursor:number|null;hasMore:boolean};
export default function ProjectProgress({accountId,circleId,projectId,refreshKey,disabled,onPosted,onReport}:{accountId:string;circleId:string;projectId:string;refreshKey:unknown;disabled:boolean;onPosted:()=>Promise<void>;onReport:(entry:Entry)=>void}){
 const uid=useId(),kind='circle-project-'+encodeURIComponent(circleId);
 const [open,setOpen]=useState(false),[data,setData]=useState<Details|null>(null),[loading,setLoading]=useState(false),[saving,setSaving]=useState(false),[loadError,setLoadError]=useState(''),[actionError,setActionError]=useState(''),[notice,setNotice]=useState('');
 const [raw,setRaw]=useTabDraft(accountId,kind,projectId);
 let draft={step:'',update:''};try{const value=JSON.parse(raw);if(typeof value.step==='string'&&typeof value.update==='string')draft=value;}catch{}
 const alive=useRef(true),generation=useRef(0),pending=useRef(false),request=useRef<AbortController|null>(null);
 useEffect(()=>{alive.current=true;const generationRef=generation,requestRef=request;return()=>{alive.current=false;generationRef.current++;requestRef.current?.abort();};},[]);
 const api=useCallback(async(body:Record<string,unknown>,signal?:AbortSignal):Promise<unknown>=>{const response=await fetch('/api/circles',{method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',signal,body:JSON.stringify({...body,circle:circleId,project:projectId,expectedAccount:accountId})});const result:{error?:string}=await response.json();if(!response.ok)throw Error(result.error||'Project progress is unavailable.');return result;},[accountId,circleId,projectId]);
 const load=useCallback((before?:number)=>{
  const ticket=++generation.current;request.current?.abort();const controller=new AbortController();request.current=controller;
  return api({action:'project_details',...(before?{before}:{})},controller.signal).then(value=>{const result=value as Details;if(!alive.current||ticket!==generation.current)return;setData(previous=>before&&previous?{...result,updates:[...previous.updates,...result.updates.filter((entry:Entry)=>!previous.updates.some(old=>old.id===entry.id))]}:result);})
   .catch((error:unknown)=>{if(alive.current&&ticket===generation.current&&!controller.signal.aborted){setData(null);setLoadError((error as Error).message||'Project progress is unavailable.');}})
   .finally(()=>{if(alive.current&&ticket===generation.current)setLoading(false);});
 },[api]);
 const loadInputs=[open,refreshKey,accountId,circleId,projectId,saving];
 const [previousLoadInputs,setPreviousLoadInputs]=useState<unknown[]|null>(null);
 if(!previousLoadInputs||loadInputs.some((value,index)=>!Object.is(value,previousLoadInputs[index]))){setPreviousLoadInputs(loadInputs);if(open&&!saving){setLoading(true);setLoadError('');}}
 useEffect(()=>{if(open&&!saving)void load();},[open,refreshKey,load,saving]);
 function refresh(before?:number){setLoading(true);setLoadError('');return load(before);}
 function change(field:'step'|'update',value:string){setRaw(JSON.stringify({...draft,[field]:value}));}
 async function add(type:'step'|'update'){
  if(disabled||pending.current||!data||data.status!=='open')return;pending.current=true;setSaving(true);setActionError('');setNotice('');
  try{const text=draft[type],attemptKind=kind+'-'+type,attempt=messageAttempt(accountId,attemptKind,projectId,text);await api({action:type==='step'?'project_add_step':'project_update',text,clientMessageId:attempt});clearMessageAttempt(accountId,attemptKind,projectId);if(!alive.current)return;setRaw(JSON.stringify({...draft,[type]:''}));setNotice(type==='step'?'Step added to this project and the circle chat.':'Update shared with this project and the circle chat.');try{await onPosted();}catch{if(alive.current)setNotice('Saved. Refresh the circle chat to see the message.');}}
  catch(error:unknown){if(alive.current)setActionError(((error as Error).message||'Saving could not be confirmed.')+' Your draft is kept; retrying the same text will not create a duplicate.');}
  finally{pending.current=false;if(alive.current)setSaving(false);}
 }
 async function mark(step:Entry){if(disabled||pending.current)return;pending.current=true;setSaving(true);setActionError('');try{await api({action:'project_step_state',message:step.id,status:step.status==='done'?'open':'done',expectedStatus:step.status});if(alive.current){setNotice(step.status==='done'?'Step reopened.':'Step marked done.');try{await onPosted();}catch{setNotice('Step saved. Refresh to see the latest state.');}}}catch(error:unknown){if(alive.current)setActionError((error as Error).message||'Step state could not save. Refresh before trying again.');}finally{pending.current=false;if(alive.current)setSaving(false);}}
 return <details className="project-progress" onToggle={event=>setOpen(event.currentTarget.open)}>
  <summary>Project steps &amp; updates</summary>
  <p className="field-help">Plan small steps together. Updates are shared in this circle and its chat. Steps do not assign work or create an obligation to help.</p>
  <button type="button" className="text-button" disabled={loading||saving||disabled} onClick={()=>void refresh()}>Refresh project</button>
  {loading&&!data&&<p role="status">Loading project…</p>}{loadError&&<p role="alert" className="inline-error">{loadError}</p>}{actionError&&<p role="alert" className="inline-error">{actionError}</p>}{notice&&<p role="status" className="field-help">{notice}</p>}
  {data&&<><p className="field-help">{data.status==='open'?'The project author and hosts manage steps. Members can share progress.':'This project is closed. Steps and updates remain available in your permitted history.'}</p>
   <section aria-label="Project steps"><h3>Small steps</h3>{!data.steps.length&&<p className="field-help">No steps visible in your project history yet.</p>}
    <ul className="project-steps">{data.steps.map(step=><li key={step.id}><label><input type="checkbox" checked={step.status==='done'} disabled={saving||disabled||!step.canManage||data.status!=='open'} onChange={()=>void mark(step)}/><span>{step.body.startsWith('Project step: ')?step.body.slice(14):step.body}<small>{step.status==='done'?'Done':'Next step'} · {step.name}</small></span></label>{!step.mine&&<button type="button" className="text-button" disabled={saving} onClick={()=>onReport(step)}>Report step</button>}</li>)}</ul>
    {data.canManage&&data.status==='open'&&data.steps.length<20&&<form className="project-entry-form" onSubmit={event=>{event.preventDefault();void add('step');}}><label htmlFor={uid+'-step'}>Add a manageable step<input id={uid+'-step'} required minLength={3} maxLength={200} disabled={saving||disabled} value={draft.step} onChange={event=>change('step',event.target.value)} placeholder="Choose a short reading for our first session"/></label><button type="submit" className="secondary" disabled={saving||disabled||draft.step.trim().length<3}>Add step</button><p className="field-help">Up to 20 steps. Nothing is assigned to another member.</p></form>}
   </section>
   <section aria-label="Project updates"><h3>Progress updates</h3>{data.status==='open'&&<details><summary>Share an update</summary><form className="project-entry-form" onSubmit={event=>{event.preventDefault();void add('update');}}><label htmlFor={uid+'-update'}>What changed, or what would help next?<textarea id={uid+'-update'} required minLength={10} maxLength={1000} rows={3} disabled={saving||disabled} value={draft.update} onChange={event=>change('update',event.target.value)} placeholder="We found a useful reading. Next we could choose a time to discuss it."/></label><p className="field-help">Share your own information. Keep private details, money requests and pressure on other members out of updates.</p><button type="submit" className="secondary" disabled={saving||disabled||draft.update.trim().length<10}>Share update</button></form></details>}
    {!data.updates.length&&<p className="field-help">No updates visible in your project history yet.</p>}{data.updates.map(update=><article key={update.id} className="project-update"><p>{update.body.startsWith('Project update: ')?update.body.slice(16):update.body}</p><p className="field-help">{update.name} · <time dateTime={update.created}>{new Date(update.created).toLocaleString()}</time></p>{!update.mine&&<button type="button" className="text-button" disabled={saving} onClick={()=>onReport(update)}>Report update</button>}</article>)}
    {data.hasMore&&data.cursor&&<button type="button" className="secondary" disabled={loading||saving||disabled} onClick={()=>void refresh(data.cursor!)}>Show older updates</button>}
   </section>
  </>}
 </details>;
}
