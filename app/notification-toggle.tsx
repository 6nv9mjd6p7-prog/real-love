
'use client';
import {useEffect,useRef,useState} from 'react';
export default function NotificationToggle({accountId,scope='',channel='direct'}:{accountId:string;scope?:string;channel?:'direct'|'circle'|'reactions'|'review'}){
 const key=channel==='reactions'?'reactions':channel+':'+(scope==='all'?'*':scope);
 const [retry,setRetry]=useState(0),[state,setState]=useState({accountId,key,retry,muted:false,busy:true,error:'',ready:false});
 if(state.accountId!==accountId||state.key!==key||state.retry!==retry){setState({accountId,key,retry,muted:state.muted,busy:true,error:'',ready:false});}
 const {muted,busy,error,ready}=state,version=useRef(0);
 useEffect(()=>{
  const versionRef=version,ticket=++versionRef.current;
  const update=(patch:Partial<typeof state>)=>{if(ticket!==versionRef.current)return;setState(current=>current.accountId===accountId&&current.key===key&&current.retry===retry?{...current,...patch}:current);};
  fetch('/api/notifications',{cache:'no-store'}).then(async r=>{const d:{accountId?:string;mutedScopes?:string[]}=await r.json();if(!r.ok||d.accountId!==accountId)throw Error('Alert settings could not load.');update({muted:(d.mutedScopes||[]).includes(key),ready:true});}).catch(e=>update({error:e.message})).finally(()=>update({busy:false}));
  return()=>{versionRef.current++;};
 },[accountId,key,retry]);
 async function save(){
  if(busy||!ready)return;const ticket=version.current,next=!muted;
  const update=(patch:Partial<typeof state>)=>{if(ticket!==version.current)return;setState(current=>current.accountId===accountId&&current.key===key&&current.retry===retry?{...current,...patch}:current);};
  update({busy:true,error:''});
  try{const r=await fetch('/api/notifications',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'mute',expectedAccount:accountId,channel,scope,muted:next})});const d:{error?:string}=await r.json();if(!r.ok)throw Error(d.error||'Alert settings could not save.');update({muted:next});}
  catch(e:unknown){update({error:(e as Error).message});}finally{update({busy:false});}
 }
 const label=channel==='review'?(muted?'Enable safety review alerts':'Mute safety review alerts'):channel==='reactions'?(muted?'Enable reaction alerts':'Mute reaction alerts'):scope==='all'?channel==='direct'?(muted?'Enable chat and request alerts':'Mute all chat and request alerts'):(muted?'Enable circle alerts':'Mute all circle alerts'):(muted?'Unmute this conversation':'Mute this conversation');
 const help=channel==='review'?'Only phone alerts are affected. Eligible review items remain in Safety review and Notifications.':scope==='all'?'Only phone alerts are affected. Activity remains in your in-app inbox, Requests, or Circles.':'Controls phone alerts. Activity still appears in Notifications.';
 return <div className="notification-toggle"><button type="button" className="secondary" disabled={busy||!ready} aria-pressed={ready?!muted:undefined} onClick={save}>{busy?'Updating alert settings…':label}</button><p className="field-help" role={error?'alert':'status'}>{error||help}</p>{error&&<button type="button" className="secondary" disabled={busy} onClick={()=>ready?save():setRetry(n=>n+1)}>Retry alert settings</button>}</div>;
}
