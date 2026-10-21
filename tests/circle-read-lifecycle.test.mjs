import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

// Execute the real acknowledgement callback and its effects.
const source=readFileSync('app/circles.tsx','utf8');
const start=source.indexOf('const acknowledge=useCallback('),end=source.indexOf('const load=useCallback(',start);assert(start>=0&&end>start);
const names=['selected','readCursor','api','chatVisible','readBusy','readThrough','nearBottom','loadingRef','busyRef','messages','circleView','moreOpen','conversationLoading','busy','historyBusy','useCallback','useRef','useEffect','useLayoutEffect'];
const js=ts.transpileModule(`export default function render({${names.join(',')}}){${source.slice(start,end)}return acknowledge;}`,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {default:render}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const hooks=[];let index=0,pending=[],layouts=[],deferred=[],registrations=0;
const same=(a,b)=>a&&b&&a.length===b.length&&a.every((value,i)=>Object.is(value,b[i]));
const runtime={useRef(initial){const i=index++;return hooks[i]??(hooks[i]={current:initial});},useCallback(fn,deps){const i=index++;if(!same(hooks[i]?.deps,deps))hooks[i]={value:fn,deps};return hooks[i].value;},useEffect(fn,deps){const i=index++,old=hooks[i];if(!same(old?.deps,deps)){hooks[i]={deps,cleanup:old?.cleanup};pending.push(()=>{old?.cleanup?.();hooks[i].cleanup=fn();});}}};runtime.useLayoutEffect=(fn,deps)=>{const before=pending.length;runtime.useEffect(fn,deps);layouts.push(...pending.splice(before));};
const listeners=()=>({events:new Map(),addEventListener(name,fn){registrations++;if(!this.events.has(name))this.events.set(name,new Set());this.events.get(name).add(fn);},removeEventListener(name,fn){this.events.get(name)?.delete(fn);},fire(name){for(const fn of [...this.events.get(name)||[]])fn();}});
let focused=true;
globalThis.document={...listeners(),hidden:false,hasFocus:()=>focused};globalThis.window=listeners();Object.defineProperty(globalThis,'navigator',{value:{onLine:true},configurable:true});
const requests=[];let fail=false,release,hold=false;
const api=async data=>{requests.push(data);if(fail)throw Error('retry');if(hold)await new Promise(resolve=>release=resolve);};
const ref=current=>({current});
let props={selected:{id:'one'},readCursor:0,api,chatVisible:ref(true),readBusy:ref(false),readThrough:ref({scope:'',cursor:0}),nearBottom:ref(true),loadingRef:ref(false),busyRef:ref(false),messages:[],circleView:'Chat',moreOpen:false,conversationLoading:false,busy:false,historyBusy:false,...runtime};
function view(changes={},deferPassive=false){props={...props,...changes};index=0;const acknowledge=render(props);const layoutEffects=layouts,effects=pending;layouts=[];pending=[];layoutEffects.forEach(fn=>fn());if(deferPassive)deferred=effects;else effects.forEach(fn=>fn());return acknowledge;}
const tick=async()=>{await Promise.resolve();await Promise.resolve();};
view();await tick();assert.equal(requests.length,0,'empty cursor remains unread');
const acknowledge=view({readCursor:10});await tick();assert.deepEqual(requests,[{action:'read_conversation',circle:'one',through:10}]);
const registered=registrations;assert.equal(view({selected:{id:'one'},messages:[{id:'refresh'}]}),acknowledge);await tick();assert.equal(registrations,registered,'same-circle refresh preserves callback and listeners');assert.equal(requests.length,1,'read cursor is not acknowledged twice');
props.chatVisible.current=false;view({circleView:'Plan',readCursor:11});await tick();assert.equal(requests.length,1,'hidden Plan transcript is not acknowledged');
props.chatVisible.current=true;view({circleView:'Chat'});await tick();assert.equal(requests.length,2,'returning to Chat acknowledges latest cursor');
props.chatVisible.current=false;view({moreOpen:true,readCursor:12});await tick();assert.equal(requests.length,2,'More panel hides read eligibility');props.chatVisible.current=true;view({moreOpen:false});await tick();assert.equal(requests.length,3);
for(const guard of ['hidden','unfocused','offline','scrolled','loading','busy']){
 const before=requests.length;document.hidden=guard==='hidden';focused=guard!=='unfocused';navigator.onLine=guard!=='offline';props.nearBottom.current=guard!=='scrolled';props.loadingRef.current=guard==='loading';props.busyRef.current=guard==='busy';
 view({readCursor:props.readCursor+1});window.fire('focus');document.fire('visibilitychange');window.fire('online');await tick();assert.equal(requests.length,before,'read blocked while '+guard);
 document.hidden=false;focused=true;navigator.onLine=true;props.nearBottom.current=true;props.loadingRef.current=false;props.busyRef.current=false;window.fire('focus');await tick();assert.equal(requests.length,before+1,'focus retries after '+guard);
}
const beforeFailure=requests.length;fail=true;view({readCursor:props.readCursor+1},true);await tick();deferred.forEach(fn=>fn());await tick();assert.equal(props.readBusy.current,false);assert.equal(requests.length,beforeFailure+1,'a failed layout read is not retried by passive effects on cursor-only changes');fail=false;window.fire('focus');await tick();assert.equal(requests.length,beforeFailure+2,'failed read is retryable');
const beforePending=requests.length;hold=true;view({readCursor:props.readCursor+1});window.fire('focus');await tick();assert.equal(requests.length,beforePending+1,'in-flight read is never duplicated');
view({readCursor:props.readCursor+1});await tick();assert.equal(requests.length,beforePending+1);release();hold=false;await tick();window.fire('focus');await tick();assert.equal(requests.at(-1).through,props.readCursor,'next focus acknowledges a newer cursor');
const beforeSwitch=requests.length;view({selected:{id:'two'}});await tick();assert.equal(requests.length,beforeSwitch+1);assert.equal(requests.at(-1).circle,'two','same cursor in another circle has its own read scope');
view({selected:null,readCursor:0});await tick();const beforeUnmount=requests.length;for(const hook of hooks)hook?.cleanup?.();assert([...window.events.values(),...document.events.values()].every(set=>set.size===0),'all listeners are removed on unmount');window.fire('focus');await tick();assert.equal(requests.length,beforeUnmount);
console.log('Circle read guards, cursor deduplication, retries, stable listeners, scope changes, and cleanup passed');
