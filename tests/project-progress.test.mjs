import ts from 'typescript';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url);
let slots=[],index=0;
const hooks={useState(initial){const i=index++;if(!(i in slots))slots[i]=initial;return [slots[i],value=>slots[i]=typeof value==='function'?value(slots[i]):value];},useRef(initial){return hooks.useState({current:initial})[0];},useEffect(){},useCallback:fn=>fn,useId:()=> 'project-test'};
globalThis.__projectHooks=hooks;const attempts=new Map();
globalThis.__projectAttempt=(_account,kind,_project,text)=>{const key=kind+text;if(!attempts.has(key))attempts.set(key,crypto.randomUUID());return attempts.get(key);};
const source=readFileSync('app/project-progress.tsx','utf8')
 .replace("import {useCallback,useEffect,useId,useRef,useState} from 'react';",'const {useCallback,useEffect,useId,useRef,useState}=globalThis.__projectHooks;')
 .replace("import {useTabDraft} from './use-tab-draft';",'const useTabDraft=()=>globalThis.__projectHooks.useState(\'\');')
 .replace("import {messageAttempt,clearMessageAttempt} from './draft-storage';",'const messageAttempt=globalThis.__projectAttempt;const clearMessageAttempt=()=>{};');
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}}).outputText.replace(/from ["']react\/jsx-runtime["']/,`from '${pathToFileURL(require.resolve('react/jsx-runtime')).href}'`);
const {default:Progress}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
function elements(node){if(!node||typeof node!=='object')return [];return [node,...React.Children.toArray(node.props?.children).flatMap(elements)];}
let tree,nodes,calls=[],reported,changed=0;
const props={accountId:'member',circleId:'circle',projectId:'project',refreshKey:{},disabled:false,onPosted:async()=>changed++,onReport:entry=>reported=entry};
function render(){index=0;tree=Progress(props);nodes=elements(tree);return renderToStaticMarkup(tree);}
const button=label=>nodes.find(node=>node.type==='button'&&node.props.children===label);
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const step={id:'step',sender:'host',name:'Host name',body:'Project step: Pick a reading',status:'open',created:new Date().toISOString(),mine:false,canManage:true};
const update={...step,id:'update',body:'Project update: We found two interesting readings.'};
let response={status:'open',canManage:true,steps:[step],updates:[update],cursor:null,hasMore:false};
async function refresh(){globalThis.fetch=async(_url,options)=>{calls.push(JSON.parse(options.body));return {ok:true,json:async()=>response};};button('Refresh project').props.onClick();await tick();return render();}
let html=render();assert(html.includes('Project steps &amp; updates'));assert(!nodes.some(node=>node.type==='form'),'no project form is forced into the initial view');
html=await refresh();assert(html.includes('Pick a reading'));assert(html.includes('We found two interesting readings.'));assert.equal(nodes.filter(node=>node.type==='form').length,2);
button('Report update').props.onClick();assert.equal(reported.id,'update');
nodes.find(node=>node.type==='input'&&node.props.type!=='checkbox').props.onChange({target:{value:'Choose a date to read together'}});render();
nodes.find(node=>node.type==='textarea').props.onChange({target:{value:'An independent progress update draft to keep.'}});render();
globalThis.fetch=async(_url,options)=>{calls.push(JSON.parse(options.body));throw Error('Network interrupted');};nodes.find(node=>node.type==='form').props.onSubmit({preventDefault(){}});await tick();html=render();assert(html.includes('Network interrupted'));assert(html.includes('Choose a date to read together'));const firstAttempt=calls.at(-1).clientMessageId;
globalThis.fetch=async(_url,options)=>{calls.push(JSON.parse(options.body));return {ok:true,json:async()=>({ok:true})};};nodes.find(node=>node.type==='form').props.onSubmit({preventDefault(){}});await tick();render();assert.equal(calls.at(-1).action,'project_add_step');assert.equal(calls.at(-1).clientMessageId,firstAttempt);assert.equal(calls.at(-1).project,'project');assert.equal(calls.at(-1).circle,'circle');assert.equal(calls.at(-1).expectedAccount,'member');assert.equal(nodes.find(node=>node.type==='input'&&node.props.type!=='checkbox').props.value,'');assert.equal(nodes.find(node=>node.type==='textarea').props.value,'An independent progress update draft to keep.','saving a step never discards an update draft');
nodes.filter(node=>node.type==='form')[1].props.onSubmit({preventDefault(){}});await tick();render();assert.equal(calls.at(-1).action,'project_update');assert.equal(changed,2);
nodes.find(node=>node.type==='input'&&node.props.type==='checkbox').props.onChange();await tick();render();assert.equal(calls.at(-1).action,'project_step_state');assert.equal(calls.at(-1).status,'done');assert.equal(calls.at(-1).expectedStatus,'open','step changes carry the displayed revision');
response={...response,canManage:false,steps:[{...step,canManage:false}]};await refresh();assert(!button('Add step'));assert(nodes.find(node=>node.type==='input'&&node.props.type==='checkbox').props.disabled);assert(button('Share update'),'members can still share updates');
response={...response,status:'closed'};html=await refresh();assert(!nodes.some(node=>node.type==='form'),'closed projects offer no mutation forms');assert(html.includes('We found two interesting readings.'),'closing retains permitted history');
let resolveOld;globalThis.fetch=()=>new Promise(resolve=>{resolveOld=resolve;});button('Refresh project').props.onClick();
response={...response,updates:[{...update,body:'Project update: Current response'}]};await refresh();resolveOld({ok:true,json:async()=>({...response,updates:[{...update,body:'Stale response'}]})});await tick();html=render();assert(html.includes('Current response'));assert(!html.includes('Stale response'));
globalThis.fetch=async()=>({ok:false,json:async()=>({error:'Project unavailable.'})});button('Refresh project').props.onClick();await tick();html=render();assert(html.includes('Project unavailable.'));assert(!html.includes('Current response'),'access loss clears prior project data');
console.log('Project forms, role controls, retry identity, independent drafts, explicit step revisions, reports, closure, stale responses and access-loss cleanup passed.');
