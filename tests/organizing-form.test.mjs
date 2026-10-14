import ts from 'typescript';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import React from 'react';
const require=createRequire(import.meta.url);
let slots=[],index=0;
globalThis.__organizingHooks={useState(initial){const i=index++;if(!(i in slots))slots[i]=initial;return [slots[i],v=>slots[i]=typeof v==='function'?v(slots[i]):v];},useRef:initial=>({current:initial}),useEffect:()=>{},useLayoutEffect:()=>{},useCallback:fn=>fn};
let source=readFileSync('app/circles.tsx','utf8');
source=source.replace(/^import (.+) from '[^']+';$/gm,(_,bindings)=>{
 if(bindings.startsWith('type '))return '';
 const names=bindings.startsWith('{')?bindings.slice(1,-1).split(',').map(x=>x.trim()).filter(x=>!x.startsWith('type ')): [bindings];
 return names.map(name=>{
  if(['useState','useEffect','useLayoutEffect','useRef','useCallback'].includes(name))return `const ${name}=globalThis.__organizingHooks.${name};`;
  if(name==='LatestRequest')return 'class LatestRequest{begin(){return 1;}current(){return true;}cancel(){}}';
  if(name==='useTabDraft')return 'const useTabDraft=()=>globalThis.__organizingHooks.useState("");';
  return `const ${name}=()=>[];`;
 }).join('\n');
});
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}}).outputText.replace(/from ["']react\/jsx-runtime["']/,`from '${pathToFileURL(require.resolve('react/jsx-runtime')).href}'`);
const {default:Circles}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
function elements(node){if(!node||typeof node!=='object')return [];return [node,...React.Children.toArray(node.props?.children).flatMap(elements)];}
const props={accountId:'member',active:true,organizing:true,workerArea:true,onReport:()=>{},connections:[{id:'available',status:'accepted',available:true,person:{name:'Co-founder'}},{id:'unavailable',status:'accepted',available:false,person:{name:'Unavailable person'}}]};
function render(){index=0;return elements(Circles(props));}
let nodes=render();
const form=()=>nodes.find(n=>n.type==='form');
const submit=()=>elements(form()).find(n=>n.type==='button'&&n.props.children==='Send for their agreement');
const label=text=>nodes.find(n=>n.type==='label'&&n.props.children?.[0]===text);
assert(form(),'direct organizing route opens the form');assert(submit().props.disabled);
assert(!nodes.some(n=>n.type==='option'&&n.props.value==='unavailable'),'unavailable connections are excluded');
elements(label('Start with')).find(n=>n.type==='select').props.onChange({target:{value:'available'}});nodes=render();
elements(label('Who is this for, and how will hosts decide admission?')).find(n=>n.type==='textarea').props.onChange({target:{value:'Hosts review respectful workers seeking broad industry discussion.'}});nodes=render();
assert(submit().props.disabled,'privacy acknowledgement is still required');
nodes.find(n=>n.type==='input'&&n.props.type==='checkbox').props.onChange({target:{checked:true}});nodes=render();
assert(!submit().props.disabled);
elements(label('Circle name')).find(n=>n.type==='input').props.onChange({target:{value:'Hospitality organizing group'}});nodes=render();
elements(label('What will you explore together?')).find(n=>n.type==='textarea').props.onChange({target:{value:'Learn about shared industry concerns and qualified organizing help.'}});nodes=render();
const originalWindow=Object.getOwnPropertyDescriptor(globalThis,'window');Object.defineProperty(globalThis,'window',{value:{location:{hash:'#circles/organize'}},configurable:true});
let posted;
globalThis.fetch=async(_url,options)=>{if(options?.method==='POST')posted=JSON.parse(options.body);return {ok:true,json:async()=>options?.method==='POST'?{ok:true}:{accountId:'member',circles:[]}};};
await form().props.onSubmit({preventDefault(){}});
assert.equal(posted.category,'worker_organizing');assert.equal(posted.workerConsent,true);assert.equal(posted.connection,'available');assert.deepEqual(posted.tags,[]);assert.equal(posted.expectedAccount,'member');
assert(!('employer' in posted));assert(!render().some(n=>n.type==='form'),'successful proposal closes the form');
console.log('Organizing form opens, gates privacy and co-founder selection, excludes unavailable contacts, and submits a worker proposal without employer data.');

if(originalWindow)Object.defineProperty(globalThis,'window',originalWindow);else delete globalThis.window;
