import ts from 'typescript';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import React from 'react';
const require=createRequire(import.meta.url);
// Stateful hook harness: these are lifecycle checks, not real-device browser QA.
globalThis.__voiceHooks=[];globalThis.__voiceIndex=0;globalThis.__voiceCleanup=[];
const fake=`const useState=x=>{const i=globalThis.__voiceIndex++;const h=globalThis.__voiceHooks;if(!(i in h))h[i]=x;return [h[i],v=>h[i]=typeof v==='function'?v(h[i]):v];};const useRef=x=>{const i=globalThis.__voiceIndex++;const h=globalThis.__voiceHooks;return h[i]??(h[i]={current:x});};const useEffect=fn=>{const i=globalThis.__voiceIndex++;if(!globalThis.__voiceHooks[i]){globalThis.__voiceHooks[i]=true;globalThis.__voiceCleanup.push(fn());}};`;
const source=readFileSync('app/voice-recorder.tsx','utf8').replace("import {useEffect,useRef,useState} from 'react';",fake);
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText.replace(/from ["']lucide-react["']/,`from '${pathToFileURL(require.resolve('lucide-react')).href}'`).replace('from "react/jsx-runtime"',`from '${pathToFileURL(require.resolve('react/jsx-runtime')).href}'`);
const {default:Recorder}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
let stopped=0,sent=0,requests=[],time=1000,interval,instances=[];
const mic=()=>({getTracks:()=>[{stop(){stopped++;}}]});
Object.defineProperty(globalThis,'navigator',{value:{mediaDevices:{getUserMedia:async()=>mic()}},configurable:true});
globalThis.MediaRecorder=class{static isTypeSupported(){return true;}constructor(stream,options){this.mimeType=options.mimeType;this.state='inactive';instances.push(this);}start(){this.state='recording';}stop(){this.state='inactive';queueMicrotask(()=>{this.ondataavailable?.({data:new Blob([new Uint8Array([...(this.mimeType.startsWith('audio/mp4')?[0,0,0,24,102,116,121,112]:[0x1a,0x45,0xdf,0xa3]),...Array(30).fill(0)])])});this.onstop?.();});}};
const realNow=Date.now,realInterval=globalThis.setInterval,realClear=globalThis.clearInterval,realFetch=globalThis.fetch,realCreate=URL.createObjectURL,realRevoke=URL.revokeObjectURL;
Date.now=()=>time;globalThis.setInterval=fn=>(interval=fn,1);globalThis.clearInterval=()=>{interval=null;};URL.createObjectURL=()=> 'blob:preview';URL.revokeObjectURL=()=>{};
let fail=true;globalThis.fetch=async(url,options)=>{requests.push({url,options});if(fail)throw Error('Network unavailable');return Response.json({ok:true});};
const props={accountId:'alice',kind:'direct',scope:'connection',replyTo:'parent',compact:true,onSent:async()=>{sent++;}};
function render(){globalThis.__voiceIndex=0;return Recorder(props);}
function nodes(node){return !node||typeof node!=='object'?[]:[node,...React.Children.toArray(node.props?.children).flatMap(nodes)];}
function button(label){return nodes(render()).find(n=>n.type==='button'&&(n.props['aria-label']===label||n.props.children===label));}
function sendButton(){return nodes(render()).find(n=>n.type==='button'&&n.props.className==='primary');}
const flush=async()=>{await Promise.resolve();await Promise.resolve();};
let start=button('Start voice recording');start.props.onClick();await flush();assert(button('Stop voice recording'),'one tap starts recording after permission');assert(!sendButton(),'recording does not send automatically');time+=2000;button('Stop voice recording').props.onClick();assert.equal(stopped,0,'microphone stays open until final audio is delivered');await flush();assert.equal(stopped,1,'Stop closes the microphone');assert(sendButton(),'Stop produces a replayable preview');assert(nodes(render()).some(n=>n.type==='audio'));assert.equal(requests.length,0);
assert(sendButton().props.disabled,'Send waits for a playable preview');await sendButton().props.onClick();assert.equal(requests.length,0,'unready preview cannot upload');nodes(render()).find(n=>n.type==='audio').props.onCanPlay();assert(!sendButton().props.disabled);await sendButton().props.onClick();assert(sendButton(),'failed sends keep preview');assert.equal(sent,0);fail=false;await sendButton().props.onClick();assert.equal(sent,1);assert.equal(requests[0].options.headers['x-voice-attempt'],requests[1].options.headers['x-voice-attempt'],'retry uses same attempt');assert.equal(requests[1].options.headers['x-voice-reply'],'parent');assert.equal(requests[1].options.headers['x-voice-duration'],'2000');assert.equal(requests[1].options.headers['Content-Type'],'audio/mp4;codecs=mp4a.40.2','prefer interoperable AAC recording when available');assert(button('Start voice recording'));
start=button('Start voice recording');start.props.onClick();await flush();button('Cancel voice recording').props.onClick();await flush();assert(!sendButton(),'Cancel discards recording');assert.equal(stopped,2);
let resolveMic;navigator.mediaDevices.getUserMedia=()=>new Promise(resolve=>resolveMic=resolve);start=button('Start voice recording');start.props.onClick();render();button('Cancel').props.onClick();resolveMic(mic());await flush();assert.equal(stopped,3,'cancel before permission stops late microphone stream');assert(button('Start voice recording'));assert(!sendButton());
// Permission can finish after the tap; releasing or blurring the button no longer cancels it.
start=button('Start voice recording');start.props.onClick();render();resolveMic(mic());await flush();assert(button('Stop voice recording'),'late permission starts recording without another tap');time+=2000;button('Stop voice recording').props.onClick();await flush();button('Discard voice note').props.onClick();
navigator.mediaDevices.getUserMedia=async()=>mic();start=button('Start voice recording');start.props.onClick();await flush();time+=60000;interval();await flush();nodes(render()).find(n=>n.type==='audio')?.props.onCanPlay();assert(sendButton(),'60 second limit stops and previews');button('Discard voice note').props.onClick();
button('Start voice recording').props.onClick();await flush();time+=2000;button('Stop voice recording').props.onClick();await flush();const previewAudio=nodes(render()).find(n=>n.type==='audio');previewAudio.props.onError();const requestCount=requests.length;assert(sendButton().props.disabled,'unplayable preview cannot be sent');await sendButton().props.onClick();assert.equal(requests.length,requestCount);button('Discard voice note').props.onClick();
// A stalled upload aborts while keeping the same recording and attempt for retry.
button('Start voice recording').props.onClick();await flush();time+=2000;button('Stop voice recording').props.onClick();await flush();
const savedSetTimeout=globalThis.setTimeout,savedClearTimeout=globalThis.clearTimeout,savedFetch=globalThis.fetch;let uploadDeadline;
globalThis.setTimeout=fn=>(uploadDeadline=fn,77);globalThis.clearTimeout=()=>{};
globalThis.fetch=async(url,options)=>new Promise((_,reject)=>options.signal.addEventListener('abort',()=>reject(Object.assign(Error('Aborted'),{name:'AbortError'}))));
nodes(render()).find(n=>n.type==='audio').props.onCanPlay();const stalledSend=sendButton().props.onClick();uploadDeadline();await stalledSend;assert(sendButton(),'timed-out upload retains preview');assert(nodes(render()).some(n=>n.props?.role==='alert'&&String(n.props.children).includes('timed out')));
globalThis.setTimeout=savedSetTimeout;globalThis.clearTimeout=savedClearTimeout;globalThis.fetch=savedFetch;button('Discard voice note').props.onClick();
let prompts=0;navigator.mediaDevices.getUserMedia=async()=>{prompts++;return mic();};start=button('Start voice recording');start.props.onClick();start.props.onClick();await flush();assert.equal(prompts,1,'rapid double taps create one recorder');button('Cancel voice recording').props.onClick();await flush();
navigator.mediaDevices.getUserMedia=async()=>{throw Object.assign(Error('Denied'),{name:'NotAllowedError'});};button('Start voice recording').props.onClick();await flush();assert(nodes(render()).some(n=>n.props?.role==='alert'),'permission denial is explained');assert(button('Start voice recording'),'permission denial restores composer');
// Browser recorder errors are followed asynchronously by a final stop event.
navigator.mediaDevices.getUserMedia=async()=>mic();button('Start voice recording').props.onClick();await flush();
const broken=instances.at(-1);broken.state='inactive';broken.onerror();
assert(!button('Start voice recording'),'do not allow a replacement recorder until the failed recorder has stopped');
broken.onstop();assert(button('Start voice recording'),'error cleanup restores recording after stop');assert(!sendButton(),'failed audio is discarded');
navigator.mediaDevices.getUserMedia=async()=>mic();button('Start voice recording').props.onClick();await flush();const before=stopped;for(const cleanup of globalThis.__voiceCleanup)cleanup?.();await flush();assert.equal(stopped,before+1,'unmount shuts down microphone');
Date.now=realNow;globalThis.setInterval=realInterval;globalThis.clearInterval=realClear;globalThis.fetch=realFetch;URL.createObjectURL=realCreate;URL.revokeObjectURL=realRevoke;
console.log('Tap start/stop, delayed permission, cancellation, denial, double taps, preview, retries, 60-second limit and microphone cleanup passed.');
