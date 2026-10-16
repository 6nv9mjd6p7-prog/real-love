import ts from 'typescript';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url);
let slots=[],index=0;
const hooks={useState(initial){const i=index++;if(!(i in slots))slots[i]=initial;return [slots[i],value=>slots[i]=typeof value==='function'?value(slots[i]):value];},useRef(initial){return hooks.useState({current:initial})[0];},useEffect(){},useCallback:fn=>fn,useId:()=> 'together-test'};
globalThis.__togetherHooks=hooks;
let attempts=new Map();
globalThis.__togetherAttempt=(_account,_kind,_circle,fingerprint)=>{if(!attempts.has(fingerprint))attempts.set(fingerprint,crypto.randomUUID());return attempts.get(fingerprint);};
let source=readFileSync('app/circle-together.tsx','utf8')
 .replace("import {useCallback,useEffect,useId,useRef,useState} from 'react';",'const {useCallback,useEffect,useId,useRef,useState}=globalThis.__togetherHooks;')
 .replace("import {useTabDraft} from './use-tab-draft';",'const useTabDraft=()=>globalThis.__togetherHooks.useState(\'\');')
 .replace("import {messageAttempt,clearMessageAttempt} from './draft-storage';",'const messageAttempt=globalThis.__togetherAttempt;const clearMessageAttempt=()=>{};');
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}}).outputText.replace(/from ["']react\/jsx-runtime["']/,`from '${pathToFileURL(require.resolve('react/jsx-runtime')).href}'`);
const {default:Together}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
function elements(node){if(!node||typeof node!=='object')return [];return [node,...React.Children.toArray(node.props?.children).flatMap(elements)];}
let tree,nodes,discussed,reported,posted=0,calls=[];
const props={accountId:'member',circleId:'circle',disabled:false,refreshKey:[],onDiscuss:post=>discussed=post,onReport:post=>reported=post,onPosted:async()=>posted++};
function render(){index=0;tree=Together(props);nodes=elements(tree);return renderToStaticMarkup(tree);}
function button(label){return nodes.find(node=>node.type==='button'&&node.props.children===label);}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
let html=render();assert(html.includes('Talk · Help · Do · Build'));assert(!nodes.some(node=>node.type==='form'),'form is not forced into the initial chat');
tree.props.onToggle({currentTarget:{open:true}});render();button('Add a post').props.onClick();render();
const kind=nodes.find(node=>node.type==='select');assert.deepEqual(elements(kind).filter(node=>node.type==='option').map(node=>node.props.value),['offer','request','activity','project']);
kind.props.onChange({target:{value:'request'}});render();
nodes.find(node=>node.type==='textarea').props.onChange({target:{value:'Could someone help me practise Spanish conversation?'}});render();
nodes.find(node=>node.type==='input'&&node.props.type!=='checkbox').props.onChange({target:{value:'Saturday afternoon'}});render();
assert(button('Post to circle').props.disabled,'participation acknowledgement is required');
nodes.find(node=>node.type==='input'&&node.props.type==='checkbox').props.onChange({target:{checked:true}});render();assert(!button('Post to circle').props.disabled);
globalThis.fetch=async(_url,options)=>{calls.push(JSON.parse(options.body));throw Error('Connection interrupted');};
await nodes.find(node=>node.type==='form').props.onSubmit({preventDefault(){}});await tick();html=render();
assert(html.includes('Connection interrupted'));assert(html.includes('Could someone help me practise Spanish conversation?'),'failure preserves the draft');const firstAttempt=calls.at(-1).clientMessageId;
globalThis.fetch=async(_url,options)=>{calls.push(JSON.parse(options.body));return {ok:true,json:async()=>({ok:true})};};
nodes.find(node=>node.type==='form').props.onSubmit({preventDefault(){}});await tick();render();
assert.equal(calls.at(-1).clientMessageId,firstAttempt,'uncertain retry preserves the message identity');assert.equal(calls.at(-1).action,'together_post');assert.equal(calls.at(-1).kind,'request');assert.equal(calls.at(-1).expectedAccount,'member');assert.equal(calls.at(-1).circle,'circle');assert.equal(calls.at(-1).togetherConsent,true);assert.equal(posted,1);assert(!nodes.some(node=>node.type==='form'),'confirmed post clears the form');
const post={id:'post',sender:'other',name:'A member',body:'Offer: I can share language practice.',kind:'offer',status:'open',created:new Date().toISOString(),mine:false,canClose:false};
globalThis.fetch=async(_url,options)=>{calls.push(JSON.parse(options.body));return {ok:true,json:async()=>({posts:[post],cursor:1,hasMore:false})};};
button('Refresh posts').props.onClick();await tick();html=render();assert(html.includes(post.body));const beforeDiscussion=calls.length;button('Discuss in chat').props.onClick();assert.equal(discussed.id,post.id);assert.equal(calls.length,beforeDiscussion,'discussion does not send a message or claim participation');button('Report post').props.onClick();assert.equal(reported.id,post.id);assert(!button('Mark closed'),'other members cannot close this post');
let resolveOld;globalThis.fetch=(_url,options)=>new Promise(resolve=>{resolveOld=resolve;});button('Refresh posts').props.onClick();
globalThis.fetch=async()=>({ok:true,json:async()=>({posts:[{...post,id:'new',body:'The current post'}],cursor:2,hasMore:false})});button('Refresh posts').props.onClick();await tick();
resolveOld({ok:true,json:async()=>({posts:[{...post,body:'Stale private result'}],cursor:1,hasMore:false})});await tick();html=render();assert(html.includes('The current post'));assert(!html.includes('Stale private result'),'superseded results never replace the latest list');
globalThis.fetch=async()=>({ok:false,json:async()=>({error:'Circle unavailable.'})});button('Refresh posts').props.onClick();await tick();html=render();assert(html.includes('Circle unavailable.'));assert(!html.includes('The current post'),'denied reads clear the prior post content');
console.log('Together optional form, consent, failure recovery, retry identity, existing-chat discussion, reporting, stale results and access-loss cleanup passed.');
