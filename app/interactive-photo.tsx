'use client';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import {X,ZoomIn,ZoomOut} from 'lucide-react';
async function requestPhoto(src:string,signal:AbortSignal){
 const response=await fetch(src,{cache:'no-store',signal});
 return {status:response.status,blob:response.ok?await response.blob():null};
}
export default function InteractivePhoto({src,label,description,className='',onProfile,onReport,actions,onThumbnailError}:{src:string;label:string;description?:string;className?:string;onProfile?:()=>void;onReport?:()=>void;actions?:ReactNode;onThumbnailError?:()=>void}){
 const [open,setOpen]=useState(false),[view,setView]=useState({request:{open:false,src},image:'',error:'',zoom:1});
 if(view.request.open!==open||view.request.src!==src){setView({request:{open,src},image:open&&src.startsWith('blob:')?src:'',error:'',zoom:1});}
 const {request,image,error,zoom}=view;
 function zoomBy(delta:number){setView(current=>current.request===request?{...current,zoom:Math.max(1,Math.min(3,current.zoom+delta))}:current);}
 function imageFailed(){setView(current=>current.request===request?{...current,image:'',error:'This photo could not be displayed.'}:current);}
 const dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLButtonElement>(null);
 useEffect(()=>{if(!open)return;const el=dialog.current,triggerEl=trigger.current;el?.showModal();return()=>{el?.close();triggerEl?.focus({preventScroll:true});};},[open]);
 useEffect(()=>{if(!open)return;let live=true,objectUrl='',working=false;const controller=new AbortController();
  const update=(patch:Partial<Pick<typeof view,'image'|'error'>>)=>{if(!live)return;setView(current=>current.request===request?{...current,...patch}:current);};
  function load(){
   if(working||src.startsWith('blob:'))return;working=true;
   requestPhoto(src,controller.signal).then(result=>{
    if(!live)return;
    if(!result.blob){update({image:'',error:result.status===403||result.status===404?'This photo is no longer available.':'The photo could not load. Please close and try again.'});if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl='';}return;}
    const previous=objectUrl;objectUrl=URL.createObjectURL(result.blob);update({image:objectUrl,error:''});if(previous)URL.revokeObjectURL(previous);
   }).catch(()=>{if(live){update({image:'',error:'Could not check photo access. Close and try again.'});if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl='';}}}).finally(()=>{working=false;});
  }
  const refresh=()=>{if(document.hidden)return;if(src.startsWith('blob:'))update({image:src});else load();};
  load();const timer=setInterval(refresh,5000);document.addEventListener('visibilitychange',refresh);
  return()=>{live=false;controller.abort();clearInterval(timer);document.removeEventListener('visibilitychange',refresh);if(objectUrl)URL.revokeObjectURL(objectUrl);};
 },[open,src,request]);
 return <><button ref={trigger} type="button" className={'photo-trigger '+className} aria-label={'Enlarge '+label} title="Tap to enlarge photo" onClick={()=>setOpen(true)}><img src={src} alt="" loading="lazy" onError={onThumbnailError}/><span className="photo-enlarge"><ZoomIn size={15}/></span></button>{open&&createPortal(<dialog ref={dialog} className="photo-viewer" aria-label={label} onCancel={()=>setOpen(false)}><header><strong>{label}</strong><button type="button" className="composer-icon" aria-label="Close photo" onClick={()=>setOpen(false)}><X/></button></header><div className="photo-viewport">{error?<p role="alert">{error}</p>:image?<img className={'photo-zoom-'+Math.round(zoom*100)} src={image} alt={description||label} onError={imageFailed}/>:<p role="status">Loading photo…</p>}</div>{description&&<p className="photo-description" aria-hidden="true">{description}</p>}<footer><button type="button" className="secondary" aria-label="Zoom out" disabled={!image||zoom<=1} onClick={()=>zoomBy(-.5)}><ZoomOut size={20}/></button><span>{Math.round(zoom*100)}%</span><button type="button" className="secondary" aria-label="Zoom in" disabled={!image||zoom>=3} onClick={()=>zoomBy(.5)}><ZoomIn size={20}/></button>{onProfile&&<button type="button" className="secondary" onClick={()=>{setOpen(false);onProfile();}}>View profile</button>}{onReport&&<button type="button" className="secondary" onClick={()=>{setOpen(false);onReport();}}>Report photo</button>}{actions}</footer><p className="field-help">Photo access follows your current sharing permission. Previously saved copies cannot be recalled.</p><button type="button" className="sr-only" onClick={()=>setOpen(false)}>Close viewer</button></dialog>,document.body)}</>;
}
