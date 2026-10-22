import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const source=readFileSync('app/use-current-time.ts','utf8').replace("import {useEffect,useState} from 'react';",'const useState=(...args)=>globalThis.__clockHooks.useState(...args);const useEffect=(...args)=>globalThis.__clockHooks.useEffect(...args);');
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {useCurrentTime}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const realNow=Date.now,realInterval=globalThis.setInterval,realClear=globalThis.clearInterval;
let time=1000,reads=0,value,initialized=false,subscribed=false,cleanup,callback,starts=0,clears=0;
Date.now=()=>{reads++;return time;};globalThis.setInterval=(fn,period)=>{assert.equal(period,1000);starts++;callback=fn;return 7;};globalThis.clearInterval=id=>{assert.equal(id,7);clears++;};
globalThis.__clockHooks={useState(initial){if(!initialized){value=initial();initialized=true;}return [value,next=>value=next];},useEffect(effect,deps){assert.deepEqual(deps,[]);if(!subscribed){subscribed=true;cleanup=effect();}}};
try{
 assert.equal(useCurrentTime(),1000);assert.equal(reads,1);
 time=2000;assert.equal(useCurrentTime(),1000,'renders use the clock snapshot, without reading wall time');assert.equal(reads,1);assert.equal(starts,1,'rerenders do not restart the timer');
 callback();assert.equal(useCurrentTime(),2000);time=5000;callback();assert.equal(useCurrentTime(),5000,'ticks read wall time rather than accumulating interval drift');
 cleanup();assert.equal(clears,1,'unmount removes the interval');
}finally{Date.now=realNow;globalThis.setInterval=realInterval;globalThis.clearInterval=realClear;delete globalThis.__clockHooks;}
console.log('Display clock initializes once, updates on ticks without render-time reads, avoids drift, and cleans up.');
