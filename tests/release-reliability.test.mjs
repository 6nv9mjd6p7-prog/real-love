import ts from 'typescript';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import assert from 'node:assert/strict';
const compile=s=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText).toString('base64');
const {LatestRequest}=await import(compile(readFileSync('app/request-gate.ts','utf8')));
const gate=new LatestRequest();let resolveOld;const old=gate.begin();const pending=new Promise(r=>resolveOld=r).then(value=>gate.current(old)?value:null);const newer=gate.begin();assert(gate.current(newer));resolveOld('stale profile');assert.equal(await pending,null);gate.cancel();assert(!gate.current(newer),'unmount or mutation cancels outstanding work');
const {dialogControls,tabDestination,manageDialogFocus}=await import(compile(readFileSync('app/modal-focus.ts','utf8')));
const make=(name,options={})=>({name,tabIndex:0,isConnected:true,inert:false,...options,matches:()=>!!options.disabled,closest:()=>options.hidden?{}:null,getClientRects:()=>options.noLayout?[]:[{}],focus(){globalThis.document.activeElement=this;},contains(node){return node===this;}});
const first=make('first'),middle=make('middle'),last=make('last');const root=make('dialog');root.querySelectorAll=()=>[first,make('disabled',{disabled:true}),make('hidden',{hidden:true}),make('collapsed',{noLayout:true}),middle,last];root.contains=node=>[root,first,middle,last].includes(node);
assert.deepEqual(dialogControls(root),[first,middle,last]);assert.equal(tabDestination([first,middle,last],last,false),first);assert.equal(tabDestination([first,middle,last],first,true),last);assert.equal(tabDestination([first,middle,last],middle,false),undefined);assert.equal(tabDestination([],null,false),null);
const opener=make('opener'),background=make('main'),alreadyInert=make('hidden panel',{inert:true});const listeners={};globalThis.document={activeElement:opener,body:{style:{overflow:'auto'}},querySelector:()=>null,querySelectorAll:()=>[background,alreadyInert],addEventListener:(type,fn)=>listeners[type]=fn,removeEventListener:type=>delete listeners[type]};let dismissed=0,busy=true;const cleanup=manageDialogFocus(root,()=>dismissed++,()=>busy);assert.equal(document.activeElement,first);assert(background.inert);listeners.keydown({key:'Escape',preventDefault(){}});assert.equal(dismissed,0);busy=false;listeners.keydown({key:'Escape',preventDefault(){}});assert.equal(dismissed,1);document.activeElement=last;let prevented=false;listeners.keydown({key:'Tab',shiftKey:false,preventDefault(){prevented=true;}});assert(prevented);assert.equal(document.activeElement,first);cleanup();assert.equal(document.activeElement,opener);assert.equal(background.inert,false);assert.equal(alreadyInert.inert,true);assert.equal(document.body.style.overflow,'auto');assert.deepEqual(listeners,{});delete globalThis.document;
const handlers={};let networkCalls=0;runInNewContext(readFileSync('public/sw.js','utf8'),{self:{location:{origin:'https://example.test'},addEventListener:(name,fn)=>handlers[name]=fn,skipWaiting(){},clients:{claim(){return Promise.resolve();}}},URL,Response,fetch:async()=>{networkCalls++;throw Error('offline');}});
for(const request of [{url:'https://example.test/api/app',method:'GET',mode:'cors'},{url:'https://example.test/api/photos',method:'GET',mode:'same-origin'},{url:'https://example.test/api/circles',method:'POST',mode:'cors'},{url:'https://other.test/',method:'GET',mode:'navigate'}]){handlers.fetch({request,respondWith(){assert.fail('private data and cross-origin requests must bypass the worker');}});}
assert.equal(networkCalls,0);let response;handlers.fetch({request:{url:'https://example.test/',method:'GET',mode:'navigate'},respondWith(p){response=p;}});const offline=await response;assert.equal(offline.status,503);assert.equal(offline.headers.get('Cache-Control'),'no-store');assert.match(await offline.text(),/Reconnect to Real Love/);assert.equal(networkCalls,1);
console.log('Stale request cancellation, dialog focus lifecycle, and private-data offline bypass passed (unit tests; not browser QA).');

// Exercise the actual response wrapper: recorded previews use local blob URLs.
const workerSource=readFileSync('build/sites-worker.ts','utf8')
 .replace('import handler from "vinext/server/fetch-handler";', 'const handler={fetch:async()=>globalThis.__securityResponse};')
 .replace('import { runWithConnectorBinding } from "../lib/connector-context";', 'const runWithConnectorBinding=(_,fn)=>fn();')
 .replaceAll('import.meta.env.DEV','false');
const {default:worker}=await import(compile(workerSource));
globalThis.__securityResponse=new Response('<html></html>',{headers:{'Content-Type':'text/html'}});
const secured=await worker.fetch(new Request('https://example.test/'),{},{});
const directives=new Map(secured.headers.get('Content-Security-Policy').split(';').map(d=>{const [name,...sources]=d.trim().split(/\s+/);return [name,sources];}));
assert.deepEqual(directives.get('media-src'),["'self'",'blob:'],'local voice previews and private saved notes are allowed');
assert.deepEqual(directives.get('connect-src'),["'self'"],'recordings stay on this app');
assert.deepEqual(directives.get('object-src'),["'none'"]);
assert.equal(secured.headers.get('Permissions-Policy'),'camera=(), microphone=(self), geolocation=()','recording may request microphone access without enabling camera or location');
globalThis.__securityResponse=new Response('photo',{headers:{'Content-Security-Policy':"default-src 'none'; sandbox"}});
const photoResponse=await worker.fetch(new Request('https://example.test/api/photo'),{},{});
assert.equal(photoResponse.headers.get('Content-Security-Policy'),"default-src 'none'; sandbox",'specific photo policy is preserved');
delete globalThis.__securityResponse;
console.log('Voice preview media sources and same-origin microphone permission passed.');

const {readMessageWindow}=await import(compile(readFileSync('app/merge-history.ts','utf8')));
let historyCalls=0,historyVersion='one',denyHistory=false;
const historyApi=async input=>{historyCalls++;if(denyHistory)throw Object.assign(Error('Unavailable'),{status:403});if(input.knownRevision===historyVersion)return {unchanged:true,revision:historyVersion};if(input.before)return {messages:[{id:'old'}],cursor:1,hasMore:false};return {messages:[{id:historyVersion}],cursor:3,hasMore:true,revision:historyVersion};};
const firstWindow=await readMessageWindow(historyApi,{action:'messages',connection:'scope'},1);assert.equal(historyCalls,2);assert.deepEqual(firstWindow.messages.map(m=>m.id),['old','one']);
const unchangedWindow=await readMessageWindow(historyApi,{action:'messages',connection:'scope'},1);assert.equal(historyCalls,3,'unchanged refresh performs one authorized request without loading older pages');assert.equal(unchangedWindow,firstWindow);
historyVersion='two';const changedWindow=await readMessageWindow(historyApi,{action:'messages',connection:'scope'},1);assert.equal(historyCalls,5);assert.equal(changedWindow.messages.at(-1).id,'two');denyHistory=true;await assert.rejects(()=>readMessageWindow(historyApi,{action:'messages',connection:'scope'},1));denyHistory=false;await readMessageWindow(historyApi,{action:'messages',connection:'scope'},1);assert.equal(historyCalls,8,'denied access invalidates cached window');

let notificationCursor=4;const circleWindowApi=async input=>input.knownRevision?{unchanged:true,revision:'same',readCursor:notificationCursor}:{messages:[{id:'circle-note'}],hasMore:false,cursor:1,revision:'same',readCursor:notificationCursor};
const circleWindow=await readMessageWindow(circleWindowApi,{action:'conversation',circle:'circle-scope'},null);notificationCursor=5;const refreshedCircleWindow=await readMessageWindow(circleWindowApi,{action:'conversation',circle:'circle-scope'},null);assert.equal(refreshedCircleWindow.readCursor,5,'fresh circle notification cursor survives unchanged-message caching');assert.equal(refreshedCircleWindow.messages,circleWindow.messages,'unchanged messages retain their existing history');
