import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import React from 'react';
import ts from 'typescript';
const require=createRequire(import.meta.url);
const compile=text=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(text,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText.replace(/from ["']react\/jsx-runtime["']/g,`from '${pathToFileURL(require.resolve('react/jsx-runtime')).href}'`)).toString('base64');
const location=compile(readFileSync('app/location.ts','utf8'));
const source=readFileSync('app/location-editor.tsx','utf8').replace("import {useEffect,useId,useRef,useState,useLayoutEffect} from 'react';",'const {useEffect,useId,useRef,useState,useLayoutEffect}=globalThis.__searchHooks;').replace("from './location'",`from '${location}'`);
const slots=[],effects=new Map(),layouts=new Map();let index,restart,rendering=false,committing=false,effectWrites=0;
const changed=(previous,deps)=>!previous||deps.some((value,i)=>!Object.is(value,previous[i]));
function effect(queue,fn,deps){const i=index++;if(changed(slots[i]?.deps,deps))queue.set(i,{fn,deps});else queue.delete(i);}
globalThis.__searchHooks={useState(initial){const i=index++;if(!(i in slots))slots[i]={value:initial};return [slots[i].value,next=>{if(committing)effectWrites++;const value=typeof next==='function'?next(slots[i].value):next;if(!Object.is(value,slots[i].value)){slots[i].value=value;if(rendering)restart=true;}}];},useRef(initial){const i=index++;return(slots[i]??={value:{current:initial}}).value;},useId(){return 'location-'+index++;},useEffect(fn,deps){effect(effects,fn,deps);},useLayoutEffect(fn,deps){effect(layouts,fn,deps);}};
const {default:Editor}=await import(compile(source));
const nodes=node=>!node||typeof node!=='object'?[]:[node,...React.Children.toArray(node.props?.children).flatMap(nodes)];
let form={city:'',region:'',country:''},accountId='member',pending=false;
function render(){let tree,turns=0;do{assert(++turns<10);index=0;restart=false;rendering=true;tree=Editor({accountId,form,setForm:next=>form=typeof next==='function'?next(form):next,me:null,busy:false,onPendingChange:value=>pending=value});rendering=false;}while(restart);const all=nodes(tree);return {all,input:all.find(node=>node.props.role==='combobox'),options:all.filter(node=>node.props.role==='option'),button:label=>all.find(node=>node.type==='button'&&node.props.children===label),searching:all.some(node=>node.props.children==='Finding real places…')};}
function commit(){committing=true;try{for(const queue of [layouts,effects]){for(const [i,{fn,deps}]of queue){slots[i]?.cleanup?.();slots[i]={deps,cleanup:fn()};}queue.clear();}}finally{committing=false;}}
function type(value){render().input.props.onChange({target:{value}});return render();}
const originals=Object.fromEntries(['window','navigator'].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
const realFetch=globalThis.fetch,realTimeout=globalThis.setTimeout,realClearTimeout=globalThis.clearTimeout;
const timers=new Map(),requests=[];let timerId=0,position;
globalThis.setTimeout=(fn,delay)=>{timers.set(++timerId,{fn,delay});return timerId;};globalThis.clearTimeout=id=>timers.delete(id);
globalThis.fetch=(url,options)=>new Promise((resolve,reject)=>requests.push({url,options,resolve,reject}));
Object.defineProperty(globalThis,'window',{value:{},configurable:true});Object.defineProperty(globalThis,'navigator',{value:{geolocation:{getCurrentPosition(success){position=success;}}},configurable:true});
const tick=()=>new Promise(resolve=>setImmediate(resolve)),latest=()=>requests.at(-1);
const place={city:'Austin',region:'Texas',country:'United States',areaLat:30.26,areaLon:-97.74,locationPlaceId:'austin',locationSelectionToken:'token'};
const respond=(data,request=latest(),status=200)=>request.resolve({ok:status<400,json:async()=>data});
function debounce(){const timer=[...timers].find(([,value])=>value.delay===400);assert(timer,'a 400ms search debounce is scheduled');timers.delete(timer[0]);void timer[1].fn();}
try{
 render();commit();assert.equal(requests.length,0,'mount never searches the selected label');assert.equal(effectWrites,0);
 type('Austin');commit();assert.equal(requests.length,0);debounce();assert(render().searching);const old=latest();assert.equal(old.url,'/api/location?q=Austin&expectedAccount=member');assert.equal(old.options.cache,'no-store');
 // Settle the old response after the edit but before React can run effect cleanup.
 let state=type('A');assert(old.options.signal.aborted,'the edit cancels the active request immediately');assert(!state.searching);assert.equal(state.options.length,0);respond({suggestions:[place]},old);await tick();assert.equal(render().options.length,0,'late suggestions cannot repopulate a short query');const before=effectWrites;commit();assert.equal(effectWrites,before,'short queries no longer reset state in an effect');assert.equal(requests.length,1);
 type('  ');commit();assert.equal(timers.size,0);assert.equal(requests.length,1);
 type('Au');commit();type('Austin');assert.equal(timers.size,0,'typing cancels the old debounce before commit');commit();debounce();respond({suggestions:[place]});await tick();state=render();assert.equal(state.options.length,1);assert.equal(pending,true);assert.equal(form.city,'','suggestions never choose a saved area');
 type('A');assert.equal(render().options.length,0,'short edits clear visible suggestions immediately');commit();
 type('Missing');commit();debounce();respond({error:'Provider unavailable'},latest(),503);await tick();state=render();assert(state.button('Retry suggestions'));assert(!state.searching);state.button('Retry suggestions').props.onClick();render();commit();debounce();respond({suggestions:[place]});await tick();state=render();state.options[0].props.onClick();render();commit();assert.equal(form.locationPlaceId,'austin');assert.equal(pending,false);assert.equal(timers.size,0,'structured selection does not search its label');
 // Reverse lookup deliberately returns suggestions beside an empty input.
 render().button('Use my current area').props.onClick();const reverse=position({coords:{latitude:30.27123,longitude:-97.74123,accuracy:30}});const reverseRequest=latest();assert.deepEqual(JSON.parse(reverseRequest.options.body),{action:'reverse',lat:30.27,lon:-97.74,expectedAccount:'member'});respond({suggestions:[place]},reverseRequest);await reverse;state=render();commit();assert.equal(state.input.props.value,'');assert.equal(state.options.length,1,'nearby suggestions survive the empty-query effect');assert.equal(form.locationPlaceId,'austin','detection leaves the selected area untouched');type('');assert.equal(render().options.length,0,'an explicit empty edit clears nearby suggestions');commit();
 // An empty connection estimate also clears pending search results before cleanup.
 type('Chicago');commit();debounce();const stale=latest();const estimate=render().button('Estimate from internet connection').props.onClick();respond({location:{}},latest());await estimate;assert(stale.options.signal.aborted);respond({suggestions:[place]},stale);await tick();assert.equal(render().input.props.value,'');assert.equal(render().options.length,0);assert(!render().searching);render();commit();
 type('Denver');render();commit();debounce();const disposed=latest();const sameEstimate=render().button('Estimate from internet connection').props.onClick();respond({location:{city:'Denver'}},latest());await sameEstimate;assert(!disposed.options.signal.aborted,'an estimate matching the current query keeps its valid pending search');slots.forEach(slot=>slot?.cleanup?.());assert(disposed.options.signal.aborted);respond({suggestions:[place]},disposed);await tick();
}finally{slots.forEach(slot=>slot?.cleanup?.());globalThis.fetch=realFetch;globalThis.setTimeout=realTimeout;globalThis.clearTimeout=realClearTimeout;for(const [key,value]of Object.entries(originals)){if(value)Object.defineProperty(globalThis,key,value);else delete globalThis[key];}delete globalThis.__searchHooks;}
console.log('Location search preserves debounce, retry, structured selection, rounded nearby lookup, and pending edits while rejecting responses after short queries or unmount.');
