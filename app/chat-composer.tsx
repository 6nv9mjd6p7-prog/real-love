'use client';
import {useEffect,useId,useRef,useState,type RefObject,type FormEvent} from 'react';
import {ImagePlus,Send, X} from 'lucide-react';
import VoiceRecorder from './voice-recorder';
import {chatViewportState} from './chat-viewport';

export default function ChatComposer({accountId,kind,scope,value,onChange,textareaRef,label,placeholder,disabled,sending,onSubmit,reply,replyTo,onCancelReply,onVoiceSent,onImageSend,onImageSent}:{
 accountId:string;kind:'direct'|'circle';scope:string;value:string;onChange:(value:string)=>void;
 textareaRef:RefObject<HTMLTextAreaElement|null>;label:string;placeholder:string;disabled:boolean;sending:boolean;
 onSubmit:(event:FormEvent<HTMLFormElement>)=>void;reply:{name:string;body:string}|null;replyTo?:string;
 onCancelReply:()=>void;onVoiceSent:()=>Promise<void>;onImageSend:(image:Blob,caption:string,attempt:string)=>Promise<void>;onImageSent:()=>Promise<void>;
}){
 useEffect(()=>{
  // Capacitor resizes the native WebView for the iOS keyboard. Let its layout
  // viewport drive the transcript sizing instead of applying browser measurements.
  const root=document.documentElement;
  const nativePlatform=root.hasAttribute('data-native-platform')||navigator.userAgent.includes('RealLoveNative/');
  if(nativePlatform)return;
  const chat=textareaRef.current?.closest<HTMLElement>('.conversation-screen,.circle-conversation');
  if(!chat)return;
  const viewport=window.visualViewport;
  let layoutHeight=Math.max(window.innerHeight,viewport?.height??0);
  let frame=0;
  const updateViewport=()=>{
   cancelAnimationFrame(frame);
   frame=requestAnimationFrame(()=>{
      const state=chatViewportState(layoutHeight,window.innerHeight,viewport?.height??null,viewport?.offsetTop??null,document.activeElement===textareaRef.current);
      layoutHeight=state.layoutHeight;
      root.toggleAttribute('data-keyboard-open',state.keyboardOpen);
      // This height sizes the message pane; the page itself stays in normal flow.
      if(state.keyboardOpen){
        root.style.setProperty('--app-viewport',`${state.height}px`);
        root.style.setProperty('--app-viewport-top',`${state.top}px`);
      }else{
        // Do not keep an iOS visual-viewport offset after the keyboard closes.
        root.style.removeProperty('--app-viewport');
        root.style.removeProperty('--app-viewport-top');
      }
   });
  };
  updateViewport();
  viewport?.addEventListener('resize',updateViewport);
  viewport?.addEventListener('scroll',updateViewport);
  window.addEventListener('resize',updateViewport);
  document.addEventListener('focusin',updateViewport);
  document.addEventListener('focusout',updateViewport);
  return()=>{
   cancelAnimationFrame(frame);
   viewport?.removeEventListener('resize',updateViewport);
   viewport?.removeEventListener('scroll',updateViewport);
   window.removeEventListener('resize',updateViewport);
   document.removeEventListener('focusin',updateViewport);
   document.removeEventListener('focusout',updateViewport);
   root.style.removeProperty('--app-viewport');
   root.style.removeProperty('--app-viewport-top');
   root.removeAttribute('data-keyboard-open');
  };
 },[textareaRef]);
 const id=useId(),fileInput=useRef<HTMLInputElement>(null),attempt=useRef(''),[voiceActive,setVoiceActive]=useState(false),[photo,setPhoto]=useState<File|null>(null),[photoPreview,setPhotoPreview]=useState(''),[photoError,setPhotoError]=useState(''),[photoSending,setPhotoSending]=useState(false);
 useEffect(()=>{if(!photo){setPhotoPreview('');return;}const url=URL.createObjectURL(photo);setPhotoPreview(url);return()=>URL.revokeObjectURL(url);},[photo]);
 function choosePhoto(file?:File){setPhotoError('');if(!file)return;if(!['image/jpeg','image/png','image/webp'].includes(file.type)){setPhotoError('Choose a JPG, PNG, or WebP photo.');return;}if(file.size>10*1024*1024){setPhotoError('Choose a photo under 10 MB.');return;}attempt.current=crypto.randomUUID();setPhoto(file);}
 function replacePhoto(){if(sending||photoSending)return;if(fileInput.current)fileInput.current.value='';fileInput.current?.click();}
 function clearPhoto(){if(sending||photoSending)return;setPhoto(null);attempt.current='';setPhotoError('');if(fileInput.current)fileInput.current.value='';}
 async function preparePhoto(file:File){const bitmap=await createImageBitmap(file);try{const scale=Math.min(1,1400/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));const context=canvas.getContext('2d');if(!context)throw Error('Photo preparation is unavailable.');context.drawImage(bitmap,0,0,canvas.width,canvas.height);const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(Error('Photo preparation failed.')),'image/png'));if(blob.size>2*1024*1024)throw Error('This photo is still too large. Choose a smaller image.');return blob;}finally{bitmap.close();}}
 async function submit(event:FormEvent<HTMLFormElement>){if(!photo)return;event.preventDefault();if(disabled||sending||photoSending||voiceActive)return;setPhotoSending(true);setPhotoError('');try{const image=await preparePhoto(photo);await onImageSend(image,value.trim(),attempt.current);setPhoto(null);attempt.current='';onChange('');try{await onImageSent();}catch{setPhotoError('Photo sent. Refresh the conversation to see it.');}}catch(error:any){setPhotoError(error.message||'Photo was not sent. Your draft is still here.');}finally{setPhotoSending(false);}}
 useEffect(()=>{const el=textareaRef.current;if(el){el.style.height='auto';el.style.height=Math.min(el.scrollHeight,144)+'px';}},[value,voiceActive,textareaRef]);
 return <form className={'chat-composer'+(voiceActive?' recording-active':'')} onSubmit={event=>{if(photo){void submit(event);return;}if(disabled||voiceActive||!value.trim()){event.preventDefault();return;}onSubmit(event);}}>
  {reply&&<div className="reply-composer" role="status"><div><strong>Replying to {reply.name}</strong><p>{reply.body}</p></div><button type="button" aria-label="Cancel reply" disabled={disabled||voiceActive} onClick={onCancelReply}><X size={20}/></button></div>}
  {photo&&<div className="chat-photo-draft"><img src={photoPreview} alt="Selected photo preview"/><div><strong>Photo ready to send</strong><span>{kind==='circle'?'Visible to this circle’s members; not added to your profile.':'Visible in this chat; profile photo sharing stays separate.'}</span><span>Add an optional caption or description in the message field.</span><button type="button" className="secondary composer-photo-replace" disabled={sending||photoSending} onClick={replacePhoto}><ImagePlus size={16}/> Replace photo</button></div><button type="button" className="composer-icon" aria-label="Remove selected photo" disabled={sending||photoSending} onClick={clearPhoto}><X size={18}/></button></div>}
  <div className="composer-controls">
   {!photo&&<VoiceRecorder accountId={accountId} kind={kind} scope={scope} replyTo={replyTo} disabled={disabled} compact onBusyChange={setVoiceActive} onSent={onVoiceSent}/>}
   {!voiceActive&&<><input ref={fileInput} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Choose a photo" disabled={disabled||sending||photoSending} onChange={e=>choosePhoto(e.target.files?.[0])}/>{!photo&&<button type="button" className="composer-icon" aria-label="Attach a photo" title="Attach a photo" disabled={disabled||sending} onClick={()=>fileInput.current?.click()}><ImagePlus size={21}/></button>}<label className="sr-only" htmlFor={id}>{photo?'Photo caption or description (optional)':label}</label><textarea ref={textareaRef} id={id} rows={1} maxLength={1500} disabled={disabled} value={value} onChange={e=>onChange(e.target.value)} placeholder={photo?'Add a caption or description (optional)':placeholder} aria-describedby={[(photo?id+'-photo-help':null),(value.length>1200?id+'-count':null)].filter(Boolean).join(' ')||undefined}/>{photo&&<span className="sr-only" id={id+'-photo-help'}>Optional text is sent below the image as its caption.</span>}<button type="submit" className="composer-send" aria-label={(sending||photoSending)?(photo?'Sending photo':'Sending message'):photo?'Send photo':'Send message'} title={photo?'Send photo':'Send message'} disabled={disabled||photoSending||(!value.trim()&&!photo)}><Send size={20}/></button></>}
  </div>
  {photoError&&<p className="inline-error" role="alert">{photoError}</p>}
  {value.length>1200&&<p className="composer-count" id={id+'-count'} aria-live="polite">{value.length}/1,500</p>}
 </form>;
}
