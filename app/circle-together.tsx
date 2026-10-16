'use client';
import {useCallback,useEffect,useId,useRef,useState} from 'react';
import {useTabDraft} from './use-tab-draft';
import {messageAttempt,clearMessageAttempt} from './draft-storage';

type Post={id:string;sender:string;name:string;body:string;kind:string;status:string;created:string;mine:boolean;canClose:boolean};
const kinds=[['offer','Offer','Something I can help with'],['request','Request','Something I could use help with'],['activity','Activity','Something to do together'],['project','Project','Something to build together']] as const;
const emptyDraft={kind:'offer',description:'',when:''};

export default function CircleTogether({accountId,circleId,disabled,refreshKey,onDiscuss,onReport,onPosted}:{accountId:string;circleId:string;disabled:boolean;refreshKey:unknown;onDiscuss:(post:Post)=>void;onReport:(post:Post)=>void;onPosted:()=>Promise<void>}){
 const uid=useId(),[open,setOpen]=useState(false),[composing,setComposing]=useState(false),[posts,setPosts]=useState<Post[]>([]),[cursor,setCursor]=useState<number|null>(null),[more,setMore]=useState(false),[loading,setLoading]=useState(false),[saving,setSaving]=useState(false),[loaded,setLoaded]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[consent,setConsent]=useState(false);
 const [raw,setRaw]=useTabDraft(accountId,'circle-together',circleId);
 let draft=emptyDraft;try{const value=JSON.parse(raw);if(kinds.some(([kind])=>kind===value.kind)&&typeof value.description==='string'&&typeof value.when==='string')draft=value;}catch{}
 const alive=useRef(true),generation=useRef(0),pending=useRef(false),controller=useRef<AbortController|null>(null),formHeading=useRef<HTMLHeadingElement>(null),addButton=useRef<HTMLButtonElement>(null);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;generation.current++;controller.current?.abort();};},[]);
 useEffect(()=>{if(composing)formHeading.current?.focus();},[composing]);
 async function api(body:Record<string,unknown>,signal?:AbortSignal){const response=await fetch('/api/circles',{method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',signal,body:JSON.stringify({...body,circle:circleId,expectedAccount:accountId})});const data:any=await response.json();if(!response.ok)throw Error(data.error||'Together could not load. Try again.');return data;}
 const load=useCallback(async(before?:number)=>{
  const ticket=++generation.current;controller.current?.abort();const request=new AbortController();controller.current=request;setLoading(true);setError('');
  try{const data=await api({action:'together_list',...(before?{before}:{})},request.signal);if(!alive.current||ticket!==generation.current)return;setPosts(previous=>before?[...previous,...data.posts.filter((post:Post)=>!previous.some(p=>p.id===post.id))]:data.posts);setCursor(data.cursor);setMore(data.hasMore);setLoaded(true);}
  catch(e:any){if(alive.current&&ticket===generation.current&&!request.signal.aborted){setPosts([]);setMore(false);setLoaded(false);setError(e.message||'Together could not load. Try again.');}}
  finally{if(alive.current&&ticket===generation.current)setLoading(false);}
 },[accountId,circleId]);
 useEffect(()=>{if(open&&!saving)void load();},[open,refreshKey,load,saving]);
 function change(field:string,value:string){setRaw(JSON.stringify({...draft,[field]:value}));setConsent(false);}
 async function publish(){
  if(pending.current||disabled||!consent)return;pending.current=true;setSaving(true);setError('');setNotice('');
  try{const fingerprint=JSON.stringify(draft),attempt=messageAttempt(accountId,'circle-together',circleId,fingerprint);await api({action:'together_post',...draft,togetherConsent:consent,clientMessageId:attempt});clearMessageAttempt(accountId,'circle-together',circleId);if(!alive.current)return;setRaw('');setConsent(false);setComposing(false);setNotice('Posted to this circle and its chat. Participation is optional.');addButton.current?.focus();try{await onPosted();}catch{if(alive.current)setNotice('Your post was saved. Refresh the circle chat to see it.');}}
  catch(e:any){if(alive.current)setError((e.message||'Posting could not be confirmed.')+' Your draft is kept; retrying the same draft will not create a duplicate.');}
  finally{pending.current=false;if(alive.current)setSaving(false);}
 }
 async function close(post:Post){if(pending.current||disabled)return;pending.current=true;setSaving(true);setError('');try{await api({action:'together_close',message:post.id});if(alive.current)setNotice('Post marked closed. This does not delete its discussion.');}catch(e:any){if(alive.current)setError(e.message||'The post could not close. Try again.');}finally{pending.current=false;if(alive.current)setSaving(false);}}
 return <details className="together-panel" onToggle={event=>setOpen(event.currentTarget.open)}>
  <summary>Together <span>Talk · Help · Do · Build</span></summary>
  <div className="together-content">
   <p>Offer help, ask a question, plan an activity, or suggest a project with this circle. Helping is voluntary; nobody owes a response or a favour.</p>
   <p className="field-help">Only circle participants with access to this history can read these posts. New members see posts from when they join. Nothing is added to your profile or public discovery.</p>
   <div className="inline-actions"><button ref={addButton} type="button" className="secondary" disabled={disabled||saving||composing} onClick={()=>setComposing(true)}>{raw?'Continue post draft':'Add a post'}</button><button type="button" className="text-button" disabled={loading||saving||disabled} onClick={()=>void load()}>Refresh posts</button></div>
   {notice&&<p role="status" className="field-help">{notice}</p>}{error&&<p role="alert" className="inline-error">{error}</p>}
   {composing&&<form className="together-form" onSubmit={event=>{event.preventDefault();void publish();}}>
    <h2 ref={formHeading} tabIndex={-1}>Share with your circle</h2>
    <label htmlFor={uid+'-kind'}>Type<select id={uid+'-kind'} disabled={saving||disabled} value={draft.kind} onChange={event=>change('kind',event.target.value)}>{kinds.map(([kind,label,help])=><option key={kind} value={kind}>{label} · {help}</option>)}</select></label>
    <label htmlFor={uid+'-description'}>What would you like to share?<textarea id={uid+'-description'} required minLength={10} maxLength={1000} rows={3} disabled={saving||disabled} value={draft.description} onChange={event=>change('description',event.target.value)} placeholder="I can help someone practise a language, or we could plan a reading afternoon."/></label>
    <label htmlFor={uid+'-when'}>When? (optional)<input id={uid+'-when'} maxLength={100} disabled={saving||disabled} value={draft.when} onChange={event=>change('when',event.target.value)} placeholder="Saturday afternoon, or agree together"/></label>
    <p id={uid+'-limits'} className="field-help">Start with knowledge, time, simple activities, or planning. No money requests, sales, lending arrangements, hazardous tasks, or care or transport for minors. Keep exact home addresses and private details out of posts. Real Love does not verify offers or guarantee safe meetings.</p>
    <label className="consent"><input type="checkbox" required aria-describedby={uid+'-limits'} disabled={saving||disabled} checked={consent} onChange={event=>setConsent(event.target.checked)}/>I understand these limits and that participation is voluntary.</label>
    <div className="inline-actions"><button type="submit" className="primary" disabled={saving||disabled||!consent||draft.description.trim().length<10}>{saving?'Posting…':'Post to circle'}</button><button type="button" className="muted-button" disabled={saving} onClick={()=>{setComposing(false);addButton.current?.focus();}}>Keep draft &amp; close</button></div>
   </form>}
   <div className="together-posts" aria-label="Circle cooperation posts" aria-busy={loading}>
    {loading&&!loaded&&<p role="status">Loading posts…</p>}{loaded&&!posts.length&&!loading&&<p>No posts available in your circle history yet. You can start with one small idea.</p>}
    {posts.map(post=><article key={post.id} className="together-post"><div className="together-post-heading"><strong>{kinds.find(([kind])=>kind===post.kind)?.[1]||'Together'}</strong><span>{post.status==='closed'?'Closed':'Open'}</span></div><p className="together-body">{post.body}</p><p className="field-help">{post.name} · <time dateTime={post.created}>{new Date(post.created).toLocaleDateString()}</time></p><div className="inline-actions"><button type="button" className="secondary" disabled={disabled||saving} onClick={()=>onDiscuss(post)}>Discuss in chat</button>{post.canClose&&post.status!=='closed'&&<button type="button" className="text-button" disabled={disabled||saving} onClick={()=>void close(post)}>Mark closed</button>}{!post.mine&&<button type="button" className="text-button" disabled={saving} onClick={()=>onReport(post)}>Report post</button>}</div></article>)}
   </div>{more&&cursor&&<button type="button" className="secondary" disabled={loading||saving||disabled} onClick={()=>void load(cursor)}>Show older posts</button>}
  </div>
 </details>;
}
