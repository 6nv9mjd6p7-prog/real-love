import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

// Run the component's real hooks and handlers with deterministic browser events.
const source=readFileSync('app/conversation.tsx','utf8');
const component=source.slice(source.indexOf('export default function Conversation'),source.indexOf(' const timeline='))+
 ' return {receive,acknowledge,showLatest:()=>{nearBottom.current=true;setNewCount(0);return acknowledge();},scrollAway:()=>{nearBottom.current=false;},newCount,messages,unavailable,retry:()=>setRetry(n=>n+1)}; }';
const hooks=[];let index=0,pending=[],frames=[],dirty=false;
const same=(a,b)=>a&&b&&a.length===b.length&&a.every((value,i)=>Object.is(value,b[i]));
const runtime={
 useState(initial){const i=index++;hooks[i]??={value:initial};return [hooks[i].value,next=>{const value=typeof next==='function'?next(hooks[i].value):next;if(!Object.is(value,hooks[i].value)){hooks[i].value=value;dirty=true;}}];},
 useRef(initial){const i=index++;return hooks[i]??(hooks[i]={current:initial});},
 useCallback(fn,deps){const i=index++;if(!same(hooks[i]?.deps,deps))hooks[i]={value:fn,deps};return hooks[i].value;},
 useEffect(fn,deps){const i=index++;if(!same(hooks[i]?.deps,deps)){const previous=hooks[i];hooks[i]={deps,cleanup:previous?.cleanup};pending.push(()=>{previous?.cleanup?.();hooks[i].cleanup=fn();});}},
};
runtime.useLayoutEffect=runtime.useEffect;
globalThis.__conversationHooks=runtime;
const prelude=`const {useState,useRef,useCallback,useEffect,useLayoutEffect}=globalThis.__conversationHooks;
const useTabDraft=()=>['',()=>{}];
const incomingSince=(old,next)=>next.filter(m=>!m.mine&&!old.some(o=>o.id===m.id)).length;
const readMessageWindow=api=>api({action:'messages'});`;
const js=ts.transpileModule(prelude+component,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const {default:Conversation}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const listeners=()=>({events:new Map(),addEventListener(name,fn){if(!this.events.has(name))this.events.set(name,new Set());this.events.get(name).add(fn);},removeEventListener(name,fn){this.events.get(name)?.delete(fn);},fire(name){for(const fn of [...this.events.get(name)||[]])fn();}});
globalThis.document={...listeners(),hidden:false,hasFocus:()=>focused};
globalThis.window=listeners();Object.defineProperty(globalThis,'navigator',{value:{onLine:true},configurable:true});
globalThis.requestAnimationFrame=fn=>frames.push(fn);
let interval,starts=0,clears=0,focused=true;
globalThis.setInterval=(fn,ms)=>{assert.equal(ms,12000);interval=fn;starts++;return starts;};
globalThis.clearInterval=()=>{clears++;};
let latest=[{id:'one',mine:false}],reads=[],fetches=0,notified=0,denied=false,failRead=false,holdRead;
const api=async request=>{if(request.action==='messages'){fetches++;if(denied)throw Object.assign(Error('Unavailable'),{status:403});return {messages:latest,cursor:null,hasMore:false};}reads.push(request);if(failRead)throw Error('retry');if(holdRead)await holdRead;};
let props={accountId:'a',connection:{id:'chat'},api,onRead:()=>notified++},view;
function render(){index=0;dirty=false;view=Conversation(props);const effects=pending;pending=[];effects.forEach(fn=>fn());}
async function settle(){for(let i=0;i<8;i++){await Promise.resolve();if(dirty)render();const callbacks=frames;frames=[];callbacks.forEach(fn=>fn());}}
render();await settle();
assert.equal(fetches,1);assert.equal(reads.length,1);assert.equal(notified,1);
assert.deepEqual(reads[0],{action:'read_messages',connection:'chat',message:'one'});
await interval();await settle();assert.equal(reads.length,1,'unchanged polls do not acknowledge twice');
props={...props,onRead:()=>notified+=10};render();await settle();assert.equal(starts,1,'parent renders do not restart polling');
view.scrollAway();latest=[...latest,{id:'two',mine:false}];await interval();await settle();
assert.equal(view.newCount,1);assert.equal(reads.length,1,'scrolled-up messages remain unread');
await interval();await settle();assert.equal(view.newCount,1,'repeat polls do not inflate the counter');
await view.showLatest();await settle();assert.equal(view.newCount,0);assert.equal(reads.length,2);assert.equal(notified,11,'acknowledgement uses the latest parent callback');
for(const guard of ['hidden','unfocused','offline']){
 document.hidden=guard==='hidden';focused=guard!=='unfocused';navigator.onLine=guard!=='offline';
 latest=[...latest,{id:guard,mine:false}];view.receive(latest);await settle();
 assert.equal(reads.length,2,'read guard: '+guard);
}
document.hidden=false;focused=true;navigator.onLine=true;
failRead=true;window.fire('focus');await settle();assert.equal(reads.length,3);assert.equal(notified,11);
failRead=false;window.fire('focus');await settle();assert.equal(reads.length,4);assert.equal(notified,21,'failed reads retry on focus');
denied=true;await interval();await settle();assert.equal(view.unavailable,true);assert.deepEqual(view.messages,[]);
window.fire('focus');await settle();assert.equal(reads.length,4,'unavailable chat is never acknowledged');assert.equal(starts,1,'availability changes do not restart polling');
denied=false;latest=[{id:'recovered',mine:false}];await interval();await settle();assert.equal(reads.length,5);assert.equal(starts,1);
let release;holdRead=new Promise(resolve=>release=resolve);latest=[{id:'pending',mine:false}];view.receive(latest);await settle();window.fire('focus');await settle();assert.equal(reads.length,6,'in-flight read is not duplicated');
for(const hook of hooks)hook?.cleanup?.();release();await settle();assert.equal(notified,31,'unmounted read completion does not notify the parent');
assert.equal(clears,1);assert([...window.events.values(),...document.events.values()].every(set=>set.size===0),'unmount removes all listeners');
console.log('Conversation polling, unread counts, guarded reads, retry, latest callbacks, recovery, and cleanup passed');
