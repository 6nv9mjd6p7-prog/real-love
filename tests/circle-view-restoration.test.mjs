import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const source=readFileSync('app/circles.tsx','utf8');
const start=source.indexOf('// Account-scoped tab state'),end=source.indexOf('useEffect(()=>{load();',start),resetStart=source.indexOf('const [sectionRequest,'),resetEnd=source.indexOf('const [workerCircles,',resetStart);assert(start>=0&&end>start&&resetStart>=0&&resetEnd>resetStart);
const ast=ts.createSourceFile('circles.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let sectionInitializer;function findSection(node){if(ts.isVariableDeclaration(node)&&ts.isArrayBindingPattern(node.name)&&node.name.elements[0]?.name?.getText(ast)==='section')sectionInitializer=node.initializer.getText(ast);ts.forEachChild(node,findSection);}findSection(ast);assert(sectionInitializer);
// Include the actual section, restoration, storage reader and persistence code.
const restoration=source.slice(resetStart,resetEnd)+source.slice(start,end);
const compile=text=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(text,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
const hook=compile(readFileSync('app/use-circle-view-restoration.ts','utf8').replace("import {useMemo,useSyncExternalStore} from 'react';",'const useMemo=(...args)=>globalThis.__circleViewHooks.useMemo(...args),useSyncExternalStore=(...args)=>globalThis.__circleViewHooks.useSyncExternalStore(...args);'));
const {default:render}=await import(compile(`import {useCircleViewRestoration} from '${hook}';export default function render({accountId,workerArea,initialSection,useState,useEffect}){const [query,setQuery]=useState('');const [section,setSection]=${sectionInitializer};${restoration}return {query,section,setQuery,setSection};}`));
const originalStorage=Object.getOwnPropertyDescriptor(globalThis,'sessionStorage');
const items=new Map(),reads=[],writes=[];let blocked=false;
Object.defineProperty(globalThis,'sessionStorage',{configurable:true,value:{getItem(key){reads.push(key);if(blocked)throw Error('storage blocked');return items.get(key)??null;},setItem(key,value){if(blocked)throw Error('storage blocked');writes.push({key,value});items.set(key,value);}}});
const key=(account,worker)=>'real-love-circle-view:'+account+':'+worker;
let slots=[],index=0,pending=new Map(),dirty=false,props,state;
const changed=(old,deps)=>!old||deps.some((value,i)=>!Object.is(value,old[i]));
const runtime={useState(initial){const i=index++;if(!(i in slots))slots[i]={value:initial};return [slots[i].value,next=>{const value=typeof next==='function'?next(slots[i].value):next;if(!Object.is(value,slots[i].value)){slots[i].value=value;dirty=true;}}];},useMemo(fn,deps){const i=index++;if(changed(slots[i]?.deps,deps))slots[i]={value:fn(),deps};return slots[i].value;},useSyncExternalStore(subscribe,getSnapshot){const i=index++;if(slots[i]?.subscribe!==subscribe)pending.set(i,()=>{slots[i]?.cleanup?.();slots[i]={subscribe,cleanup:subscribe(()=>{})};});else pending.delete(i);return getSnapshot();},useEffect(fn,deps){const i=index++;if(changed(slots[i]?.deps,deps))pending.set(i,()=>{slots[i]?.cleanup?.();slots[i]={deps,cleanup:fn()};});else pending.delete(i);}};
globalThis.__circleViewHooks=runtime;
function view(changes={}){props={...props,...changes};let passes=0;do{assert(++passes<10);index=0;dirty=false;state=render({...props,...runtime});}while(dirty);return state;}
function commit(){const tasks=[...pending.values()];pending.clear();tasks.forEach(fn=>fn());}
function settle(changes={}){view(changes);commit();view();commit();view();commit();}
function dispose(){slots.forEach(slot=>slot?.cleanup?.());}
function mount(accountId,workerArea=false,initialSection=''){dispose();slots=[];pending.clear();props={accountId,workerArea,initialSection};const before=reads.length;view();assert.equal(reads.length,before,'render never reads storage');commit();view();commit();}
const choice=()=>({query:state.query,section:state.section});
try{
 items.set(key('a',false),JSON.stringify({query:'General search',section:'Joined'}));items.set(key('a',true),JSON.stringify({query:'Worker search',section:'Requests'}));items.set(key('b',false),JSON.stringify({query:'Other account',section:'Requests'}));
 mount('a');assert.deepEqual(choice(),{query:'General search',section:'Joined'});assert.equal(reads.length,1);assert.deepEqual(JSON.parse(items.get(key('a',false))),choice());assert.equal(writes[0].value,JSON.stringify(choice()),'first write contains restored choices rather than defaults');
 state.setQuery('Unsubmitted search');settle();const readCount=reads.length;settle({initialSection:'Requests'});assert.equal(state.query,'Unsubmitted search','route tab changes never reload stored search');assert.equal(state.section,'Requests');assert.equal(reads.length,readCount);settle({initialSection:'Joined'});assert.equal(state.section,'Joined');
 const workerBefore=items.get(key('a',true));view({workerArea:true,initialSection:'Joined'});assert.equal(items.get(key('a',true)),workerBefore,'scope rendering cannot overwrite the destination');commit();assert.equal(items.get(key('a',true)),workerBefore,'subscription commit waits for restored render before persistence');view();commit();assert.equal(state.query,'Worker search');assert.equal(state.section,'Joined','explicit section beats stored section');assert.equal(reads.at(-1),key('a',true));
 mount('b');assert.deepEqual(choice(),{query:'Other account',section:'Requests'});assert.equal(JSON.parse(items.get(key('a',false))).query,'Unsubmitted search');
 mount('a',true,'Discover');assert.equal(state.section,'Discover');assert.equal(state.query,'Worker search');settle({initialSection:'invalid'});assert.equal(state.section,'Discover');
 // Disposing and resubscribing the same store does not reread or reset manual choices.
 state.setQuery('Manual worker choice');settle();const readsBefore=reads.length;dispose();for(const slot of slots)if(slot?.subscribe){slot.cleanup=slot.subscribe(()=>{});}settle();assert.equal(reads.length,readsBefore);assert.equal(state.query,'Manual worker choice');
 items.set(key('broken',false),'{bad json');mount('broken');assert.deepEqual(choice(),{query:'',section:'Discover'});items.set(key('invalid',false),JSON.stringify({query:123,section:'not a tab'}));mount('invalid');assert.deepEqual(choice(),{query:'',section:'Discover'},'invalid stored fields cannot enter controls');
 blocked=true;mount('blocked');assert.deepEqual(choice(),{query:'',section:'Discover'});blocked=false;mount('empty');assert.deepEqual(choice(),{query:'',section:'Discover'});
 dispose();slots=[];pending.clear();props={accountId:'discarded',workerArea:false,initialSection:''};const beforeDiscard=reads.length;view();assert.equal(reads.length,beforeDiscard,'discarded render has no storage effects');
}finally{dispose();delete globalThis.__circleViewHooks;if(originalStorage)Object.defineProperty(globalThis,'sessionStorage',originalStorage);else delete globalThis.sessionStorage;}
console.log('Circle view restoration preserves search, route priority, account/branch scope, replay, safe storage recovery and persistence after restoration.');
