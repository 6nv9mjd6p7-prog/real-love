import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import React from 'react';
import ts from 'typescript';
const require=createRequire(import.meta.url);
const fake=['useEffect','useState','useSyncExternalStore'].map(name=>`const ${name}=(...args)=>globalThis.__installHooks.${name}(...args);`).join('');
const source=readFileSync('app/install-app.tsx','utf8')
 .replace("import { useEffect, useState, useSyncExternalStore } from 'react';",fake)
 .replace("import { Capacitor } from '@capacitor/core';",'const Capacitor={isNativePlatform:()=>!!globalThis.__installNative};')
 .replace("import { useNativeApp } from './use-native-app';",'const useNativeApp=()=>!!globalThis.__installNative;');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText.replace('from "react/jsx-runtime"',`from '${pathToFileURL(require.resolve('react/jsx-runtime')).href}'`);
const {default:Install}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const nodes=n=>!n||typeof n!=='object'?[]:[n,...React.Children.toArray(n.props?.children).flatMap(nodes)];
function harness(server=false){const slots=[];let index,pending,updates=0;
 const changed=(a,b)=>!a||a.length!==b.length||b.some((value,i)=>!Object.is(value,a[i]));
 const hooks={useState(initial){const i=index++;if(!(i in slots))slots[i]={value:initial};return [slots[i].value,next=>{slots[i].value=typeof next==='function'?next(slots[i].value):next;}];},useEffect(fn,deps){const i=index++,old=slots[i];if(!server&&changed(old?.deps,deps)){slots[i]={deps,cleanup:old?.cleanup};pending.push(()=>{slots[i].cleanup?.();slots[i].cleanup=fn();});}},useSyncExternalStore(subscribe,snapshot,serverSnapshot){const i=index++;if(!server&&slots[i]?.subscribe!==subscribe){const old=slots[i];slots[i]={subscribe};pending.push(()=>{old?.cleanup?.();slots[i].cleanup=subscribe(()=>updates++);});}return server?serverSnapshot():snapshot();}};
 return {render(){index=0;pending=[];globalThis.__installHooks=hooks;const tree=Install();pending.forEach(fn=>fn());return tree;},dispose(){slots.forEach(slot=>slot?.cleanup?.());},get updates(){return updates;}};
}
// No browser globals are needed for the existing hidden server view.
assert.equal(harness(true).render(),null);
function events(){const listeners=new Map();return {addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,new Set());listeners.get(type).add(fn);},removeEventListener(type,fn){listeners.get(type)?.delete(fn);},fire(type,event={}){for(const fn of listeners.get(type)||[])fn(event);},count(){return [...listeners.values()].reduce((sum,set)=>sum+set.size,0);}};}
const windowEvents=events(),displayEvents=events(),display={matches:false,...displayEvents};let registrations=0,prompts=0;
const originals=new Map(['window','navigator'].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
Object.defineProperty(globalThis,'window',{value:{...windowEvents,isSecureContext:true,matchMedia:()=>display},configurable:true});
Object.defineProperty(globalThis,'navigator',{value:{userAgent:'Mozilla desktop',platform:'Linux',maxTouchPoints:0,standalone:false,serviceWorker:{register:async()=>{registrations++;}}},configurable:true});
let app=harness();
const tree=()=>app.render(),button=label=>nodes(tree()).find(n=>n.type==='button'&&(n.props['aria-label']===label||n.props.children===label));
try{
 assert(tree());assert.equal(registrations,1);assert.equal(windowEvents.count(),2);assert.equal(displayEvents.count(),2);
 button('Add Real Love to your phone').props.onClick();assert(nodes(tree()).some(n=>n.type==='p'&&String(n.props.children).includes('Open your browser menu')));
 const before=app.updates;display.matches=true;display.fire('change');assert(app.updates>before);assert.equal(tree(),null,'standalone display hides installation');
 display.matches=false;display.fire('change');assert(tree(),'leaving standalone mode restores installation');
 let prevented=false;windowEvents.fire('beforeinstallprompt',{preventDefault(){prevented=true;},prompt:async()=>{prompts++;},userChoice:Promise.resolve({outcome:'dismissed'})});assert(prevented);
 await button('Install Real Love').props.onClick();assert.equal(prompts,1);assert(nodes(tree()).some(n=>n.props.role==='status'&&String(n.props.children).includes('install later')));assert(!button('Install Real Love'),'browser prompt is consumed once');
 windowEvents.fire('appinstalled');assert.equal(tree(),null,'installation completion hides the guide even before display flags change');
 display.fire('change');assert(tree(),'a later display-mode event uses the current browser flags');assert(!button('Close install guide'),'completion closed the guide');
 app.dispose();assert.equal(windowEvents.count(),0);assert.equal(displayEvents.count(),0,'display and installation listeners are released');
 for(const device of [{userAgent:'iPhone',platform:'iPhone',maxTouchPoints:1},{userAgent:'Mozilla desktop',platform:'MacIntel',maxTouchPoints:5}]){
  Object.assign(navigator,device);app=harness();button('Add Real Love to your phone').props.onClick();assert(nodes(tree()).some(n=>n.type==='p'&&String(n.props.children).includes('Open this website in Safari')));app.dispose();
 }
 navigator.standalone=true;app=harness();assert.equal(tree(),null,'Safari home-screen apps stay hidden');app.dispose();navigator.standalone=false;
 const beforeNative=registrations;globalThis.__installNative=true;app=harness();assert.equal(tree(),null,'native shell has no web install guide');assert.equal(registrations,beforeNative);assert.equal(windowEvents.count(),0);assert.equal(displayEvents.count(),0);app.dispose();
}finally{app.dispose();for(const [key,descriptor] of originals){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}delete globalThis.__installNative;delete globalThis.__installHooks;}
console.log('Install hydration, desktop/iOS/iPad guidance, standalone transitions, prompt consumption, native shell and listener cleanup passed.');
