import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const source=readFileSync('app/circles.tsx','utf8');
const start=source.indexOf('// Account-scoped tab state'),end=source.indexOf('useEffect(()=>{load();',start),resetStart=source.indexOf('const [sectionRequest,'),resetEnd=source.indexOf('const [workerCircles,',resetStart);assert(start>=0&&end>start&&resetStart>=0&&resetEnd>resetStart);
const ast=ts.createSourceFile('circles.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let sectionInitializer;function findSection(node){if(ts.isVariableDeclaration(node)&&ts.isArrayBindingPattern(node.name)&&node.name.elements[0]?.name?.getText(ast)==='section')sectionInitializer=node.initializer.getText(ast);ts.forEachChild(node,findSection);}findSection(ast);assert(sectionInitializer);
// Include the actual section, restoration, storage reader and persistence code.
const restoration=source.slice(resetStart,resetEnd)+source.slice(start,end);
const js=ts.transpileModule(`export default function render({accountId,workerArea,initialSection,query,setQuery,useState,useEffect,useEffectEvent}){const [section,setSection]=${sectionInitializer};${restoration}}`,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {default:render}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const items=new Map(),reads=[];let blocked=false;
globalThis.sessionStorage={getItem(key){reads.push(key);if(blocked)throw Error('storage blocked');return items.get(key)??null;},setItem(key,value){if(blocked)throw Error('storage blocked');items.set(key,value);}};
const key=(account,worker)=>'real-love-circle-view:'+account+':'+worker;
let slots=[],index=0,pending=[],eventCommits=[],state={query:'',section:'Discover'},props;
const runtime={useState(initial){const i=index++;if(!(i in slots))slots[i]={value:typeof initial==='function'?initial():initial};if(i===0)state.section=slots[i].value;return [slots[i].value,next=>{slots[i].value=typeof next==='function'?next(slots[i].value):next;if(i===0)state.section=slots[i].value;}];},useEffect(fn,deps){const i=index++,old=slots[i];if(!old||deps.some((value,j)=>!Object.is(value,old[j]))){slots[i]=deps;pending.push(fn);}},useEffectEvent(fn){const i=index++;slots[i]??={current:fn};eventCommits.push(()=>slots[i].current=fn);return (...args)=>slots[i].current(...args);}};
function view(changes={}){props={...props,...changes};index=0;render({...props,...state,setQuery:value=>state.query=value,setSection:value=>state.section=value,...runtime});const commits=eventCommits,effects=pending;eventCommits=[];pending=[];commits.forEach(fn=>fn());effects.forEach(fn=>fn());}
function settle(changes={}){view(changes);view();view();}
function mount(accountId,workerArea=false,initialSection=''){slots=[];pending=[];eventCommits=[];state={query:'',section:'Discover'};props={accountId,workerArea,initialSection};settle();}
items.set(key('a',false),JSON.stringify({query:'General search',section:'Joined'}));items.set(key('a',true),JSON.stringify({query:'Worker search',section:'Requests'}));items.set(key('b',false),JSON.stringify({query:'Other account',section:'Requests'}));
mount('a');assert.deepEqual(state,{query:'General search',section:'Joined'});assert.equal(reads.length,1);assert.deepEqual(JSON.parse(items.get(key('a',false))),state,'restored state persists after effects settle');
state.query='Unsubmitted search';settle();const readCount=reads.length;settle({initialSection:'Requests'});assert.equal(state.query,'Unsubmitted search','route tab changes never reload stored search');assert.equal(state.section,'Requests');assert.equal(reads.length,readCount,'restoration runs only for account or branch changes');
settle({initialSection:'Joined'});assert.equal(state.section,'Joined');assert.equal(state.query,'Unsubmitted search');
// Latest route priority applies when a scope change triggers restoration.
settle({workerArea:true,initialSection:'Joined'});assert.equal(state.query,'Worker search');assert.equal(state.section,'Joined','explicit section beats stored section');assert.equal(reads.at(-1),key('a',true));
mount('b');assert.deepEqual(state,{query:'Other account',section:'Requests'});assert.equal(reads.at(-1),key('b',false));assert.equal(JSON.parse(items.get(key('a',false))).query,'Unsubmitted search','other account restoration cannot overwrite first account storage');
mount('a',true,'Discover');assert.equal(state.section,'Discover');assert.equal(state.query,'Worker search','worker and general queries remain separate');
settle({initialSection:'invalid'});assert.equal(state.section,'Discover','invalid explicit section retains the existing safe fallback');
items.set(key('broken',false),'{bad json');mount('broken');assert.deepEqual(state,{query:'',section:'Discover'},'malformed storage is ignored');
blocked=true;mount('blocked');assert.deepEqual(state,{query:'',section:'Discover'},'unavailable storage does not break browsing');blocked=false;
items.delete(key('empty',false));mount('empty');assert.deepEqual(state,{query:'',section:'Discover'});
console.log('Circle view restoration preserves search across tab navigation, route priority, account/branch scope, and storage recovery');
