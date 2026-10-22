import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const compile=source=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
const storageUrl=compile(readFileSync('app/draft-storage.ts','utf8')),{draftKey,writeDraft,readDraft}=await import(storageUrl);
const items=new Map(),storage={getItem:k=>items.get(k)??null,setItem:(k,v)=>items.set(k,v),removeItem:k=>items.delete(k)};globalThis.window={sessionStorage:storage};
let slots=[],index=0,pending=new Map(),eventCommits=[],compose=false;const routes=[];
const same=(a,b)=>a&&b&&a.length===b.length&&a.every((value,i)=>Object.is(value,b[i]));
globalThis.__founderHooks={useState(initial){const i=index++;slots[i]??={value:initial};return [slots[i].value,value=>slots[i].value=typeof value==='function'?value(slots[i].value):value];},useMemo(fn,deps){const i=index++;if(!same(slots[i]?.deps,deps))slots[i]={value:fn(),deps};return slots[i].value;},useSyncExternalStore(subscribe,getSnapshot){const i=index++;if(slots[i]?.subscribe!==subscribe)pending.set(i,()=>{slots[i]?.cleanup?.();slots[i]={subscribe,cleanup:subscribe(()=>{})};});return getSnapshot();},useEffect(fn,deps){const i=index++;if(!same(slots[i]?.deps,deps))pending.set(i,()=>{slots[i]?.cleanup?.();slots[i]={deps,cleanup:fn()};});},useEffectEvent(fn){const i=index++;slots[i]??={current:fn};eventCommits.push(()=>slots[i].current=fn);return (...args)=>slots[i].current(...args);}};
const draftUrl=compile(readFileSync('app/use-tab-draft.ts','utf8').replace("import {useMemo,useSyncExternalStore} from 'react';",'const {useMemo,useSyncExternalStore}=globalThis.__founderHooks;').replace("from './draft-storage'",`from '${storageUrl}'`));
const source=readFileSync('app/circles.tsx','utf8'),start=source.indexOf('const applyInitialConnection='),end=source.indexOf('\nconst openRouteCircle=',start);assert(start>=0&&end>start);
const {default:render}=await import(compile(`import {useTabDraft} from '${draftUrl}';const {useEffect,useEffectEvent}=globalThis.__founderHooks;
export default function render({accountId,workerArea,organizing,initialCompose,initialConnection,connections,setCompose,replaceAppRoute}){
const [connection,setConnection]=useTabDraft(accountId,'circle-proposal-connection',workerArea?(organizing?'organizing':'worker'):'general');
${source.slice(start,end)}return {connection,setConnection};}`));
let props={accountId:'a',workerArea:false,organizing:false,initialCompose:false,initialConnection:'chosen',connections:[{id:'chosen',status:'accepted'},{id:'manual',status:'accepted'}],setCompose:value=>compose=value,replaceAppRoute:(...args)=>routes.push(args)},view;
function commit(changes={}){props={...props,...changes};index=0;view=render(props);const events=eventCommits,effects=[...pending.values()];eventCommits=[];pending.clear();events.forEach(fn=>fn());effects.forEach(fn=>fn());return view;}
function settle(changes={}){commit(changes);commit();return commit();}
settle();assert.equal(view.connection,'chosen');assert.equal(compose,true);assert.deepEqual(routes,[['circles/new','a',true]]);
view.setConnection('manual');settle({connections:[...props.connections]});assert.equal(view.connection,'manual','background connection refresh preserves manual co-founder choice');assert.equal(routes.length,1,'refresh does not repeat navigation');
settle({initialCompose:true,organizing:true});assert.equal(routes.length,1,'other props do not retrigger the same requested ID');
settle({initialConnection:'missing'});assert.equal(view.connection,'manual');assert.equal(routes.length,1);
for(const candidate of [{id:'pending',status:'pending'},{id:'closed',status:'closed'},{id:'unavailable',status:'accepted',available:false}]){settle({connections:[candidate],initialConnection:candidate.id});assert.equal(view.connection,'manual');assert.equal(routes.length,1,'ineligible co-founder does not open or navigate');}
// Read current route flags and destination setter when a new ID triggers the shortcut.
settle({workerArea:true,organizing:false,initialCompose:false,connections:[{id:'worker',status:'accepted'}],initialConnection:'worker'});assert.equal(view.connection,'worker');assert.deepEqual(routes.at(-1),['circles/work/new','a',true]);assert.equal(readDraft(storage,draftKey('a','circle-proposal-connection','general'),''),'manual');
settle({organizing:true,initialConnection:'organizer',connections:[{id:'organizer',status:'accepted'}]});assert.equal(view.connection,'organizer');assert.equal(routes.length,2,'organizing route suppresses replacement');
settle({organizing:false,initialCompose:true,initialConnection:'explicit',connections:[{id:'explicit',status:'accepted'}]});assert.equal(view.connection,'explicit');assert.equal(routes.length,2,'explicit compose route suppresses replacement');
settle({initialConnection:''});view.setConnection('manual worker');settle();assert.equal(view.connection,'manual worker','empty shortcut leaves the draft alone');
slots=[];pending=new Map();eventCommits=[];compose=false;writeDraft(storage,draftKey('b','circle-proposal-connection','general'),'other draft');settle({accountId:'b',workerArea:false,organizing:false,initialCompose:false,initialConnection:'b-founder',connections:[{id:'b-founder',status:'accepted'}]});assert.equal(view.connection,'b-founder');assert.deepEqual(routes.at(-1),['circles/new','b',true]);assert.equal(readDraft(storage,draftKey('a','circle-proposal-connection','general'),''),'manual','new account cannot overwrite previous account draft');
console.log('Circle co-founder shortcut preserves manual choices, eligibility, route flags, and account/branch drafts');
