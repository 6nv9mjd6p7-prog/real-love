import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import React from 'react';
import ts from 'typescript';
const require=createRequire(import.meta.url);
const fake=['useEffect','useRef','useState'].map(name=>`const ${name}=(...args)=>globalThis.__alertHooks.${name}(...args);`).join('');
const source=readFileSync('app/notification-toggle.tsx','utf8').replace("import {useEffect,useRef,useState} from 'react';",fake);
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText.replace('from "react/jsx-runtime"',`from '${pathToFileURL(require.resolve('react/jsx-runtime')).href}'`);
const {default:Toggle}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const nodes=n=>!n||typeof n!=='object'?[]:[n,...React.Children.toArray(n.props?.children).flatMap(nodes)];
const slots=[];let index,dirty,pending=[],committing=false,effectWrites=0,writes=0;
globalThis.__alertHooks={useState(initial){const i=index++;if(!(i in slots))slots[i]={value:initial};return [slots[i].value,next=>{writes++;if(committing)effectWrites++;const value=typeof next==='function'?next(slots[i].value):next;if(!Object.is(value,slots[i].value)){slots[i].value=value;dirty=true;}}];},useRef(initial){const i=index++;return slots[i]??(slots[i]={current:initial});},useEffect(fn,deps){const i=index++,old=slots[i];if(!old||deps.some((value,j)=>!Object.is(value,old.deps[j]))){slots[i]={deps,cleanup:old?.cleanup};pending.push(()=>{slots[i].cleanup?.();slots[i].cleanup=fn();});}}};
let props={accountId:'a',scope:'one',channel:'direct'};
function render(){for(let pass=0;pass<10;pass++){index=0;dirty=false;const tree=nodes(Toggle(props));if(!dirty)return tree;}throw Error('Settings reset did not settle');}
function commit(){committing=true;try{const tasks=pending;pending=[];tasks.forEach(fn=>fn());}finally{committing=false;}}
const button=()=>render().find(n=>n.type==='button'),retry=()=>render().find(n=>n.type==='button'&&n.props.children==='Retry alert settings'),alerts=()=>render().filter(n=>n.props.role==='alert').map(n=>n.props.children);
const realFetch=globalThis.fetch,requests=[];globalThis.fetch=(url,options)=>new Promise((resolve,reject)=>requests.push({url,options,body:options?.body?JSON.parse(options.body):null,resolve,reject}));
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const load=async(data,status=200)=>{requests.at(-1).resolve(Response.json(data,{status}));await tick();};
try{
 assert.equal(button().props.disabled,true);assert.equal(requests.length,0);commit();assert.equal(requests.length,1);assert.equal(effectWrites,0);render();commit();assert.equal(requests.length,1,'ordinary renders do not reload settings');
 await load({},503);assert.equal(button().props.disabled,true);assert.equal(button().props['aria-pressed'],undefined);assert(retry());retry().props.onClick();assert.equal(button().props.children,'Updating alert settings…');assert.deepEqual(alerts(),[]);commit();
 await load({accountId:'a',mutedScopes:['direct:one']});assert.equal(button().props.children,'Unmute this conversation');assert.equal(button().props['aria-pressed'],false);
 let save=button().props.onClick();assert.deepEqual(requests.at(-1).body,{action:'mute',expectedAccount:'a',channel:'direct',scope:'one',muted:false});await load({error:'Save failed'},503);await save;assert.deepEqual(alerts(),['Save failed']);assert.equal(button().props.disabled,false);
 save=retry().props.onClick();assert.equal(requests.at(-1).body.muted,false,'save retry preserves the intended choice');await load({ok:true});await save;assert.equal(button().props.children,'Mute this conversation');assert.equal(button().props['aria-pressed'],true);
 props={...props,scope:'two'};assert.equal(button().props.disabled,true,'scope changes reset readiness before effects');assert.equal(button().props['aria-pressed'],undefined);commit();const second=requests.at(-1);
 props={...props,scope:'three'};assert.equal(button().props.disabled,true);second.resolve(Response.json({accountId:'a',mutedScopes:['direct:two']}));await tick();assert.equal(button().props.disabled,true,'a late GET cannot make a new scope ready before effect cleanup');assert.equal(button().props['aria-pressed'],undefined);commit();
 await load({accountId:'other',mutedScopes:[]});assert.equal(button().props.disabled,true);assert.deepEqual(alerts(),['Alert settings could not load.']);retry().props.onClick();render();commit();await load({accountId:'a',mutedScopes:['direct:three']});
 save=button().props.onClick();const oldSave=requests.at(-1);props={...props,channel:'circle',scope:'all'};assert.equal(button().props.disabled,true);oldSave.resolve(Response.json({error:'Old conversation failed'},{status:503}));await save;assert.deepEqual(alerts(),[],'a late save error cannot enter another scope');assert.equal(button().props.disabled,true);commit();await load({accountId:'a',mutedScopes:['circle:*']});assert.equal(button().props.children,'Enable circle alerts');
 save=button().props.onClick();assert.deepEqual(requests.at(-1).body,{action:'mute',expectedAccount:'a',channel:'circle',scope:'all',muted:false});await load({ok:true});await save;assert.equal(button().props.children,'Mute all circle alerts');
 props={...props,scope:'private'};render();commit();const previousAccount=requests.at(-1);
 props={accountId:'b',scope:'all',channel:'circle'};assert.equal(button().props.disabled,true,'account changes reset readiness before effects');previousAccount.resolve(Response.json({accountId:'a',mutedScopes:['circle:private']}));await tick();assert.equal(button().props.disabled,true,'a previous-account response cannot enable the new account before cleanup');commit();await load({accountId:'b',mutedScopes:[]});assert.equal(button().props.disabled,false);
 props={...props,scope:'ignored-one',channel:'reactions'};render();commit();await load({accountId:'b',mutedScopes:['reactions']});const before=requests.length;props={...props,scope:'ignored-two'};assert.equal(button().props.children,'Enable reaction alerts');commit();assert.equal(requests.length,before,'reaction settings use the canonical key rather than conversation scope');
 save=button().props.onClick();assert.equal(requests.at(-1).body.expectedAccount,'b');assert.equal(requests.at(-1).body.channel,'reactions');await load({ok:true});await save;assert.equal(button().props.children,'Mute reaction alerts');
 props={...props,channel:'review',scope:''};render();commit();await load({accountId:'b',mutedScopes:[]});assert.equal(button().props.children,'Mute safety review alerts');
 props={...props,scope:'unmount'};render();commit();for(const slot of slots)slot?.cleanup?.();const beforeUnmount=writes;await load({accountId:'b',mutedScopes:[]});assert.equal(writes,beforeUnmount,'unmount invalidates pending response and finally callbacks');assert.equal(effectWrites,0);
 for(const request of requests){assert.equal(request.url,'/api/notifications');if(!request.body)assert.deepEqual(request.options,{cache:'no-store'});}
}finally{for(const slot of slots)slot?.cleanup?.();globalThis.fetch=realFetch;delete globalThis.__alertHooks;}
console.log('Alert settings reset before display, keep GET/save retries and canonical scopes, reject stale/foreign responses, and invalidate pending work on unmount.');
