import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import React from 'react';
import ts from 'typescript';
const require=createRequire(import.meta.url),url=name=>pathToFileURL(require.resolve(name)).href;
const fake=['useEffect','useRef','useState'].map(name=>`const ${name}=(...args)=>globalThis.__photoHooks.${name}(...args);`).join('');
const source=readFileSync('app/interactive-photo.tsx','utf8').replace("import {useEffect,useRef,useState,type ReactNode} from 'react';",fake).replace("import {createPortal} from 'react-dom';",'const createPortal=child=>child;');
let js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
for(const name of ['react/jsx-runtime','lucide-react'])js=js.replace(`from "${name}"`,`from '${url(name)}'`).replace(`from '${name}'`,`from '${url(name)}'`);
const {default:Photo}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const nodes=n=>!n||typeof n!=='object'?[]:[n,...React.Children.toArray(n.props?.children).flatMap(nodes)];
const slots=[],pending=new Map();let index,dirty,shown=0,closed=0,focused=0,reported=0,thumbnailErrors=0;
const dialog={showModal(){shown++;},close(){closed++;}},trigger={focus(options){assert.deepEqual(options,{preventScroll:true});focused++;}};
globalThis.__photoHooks={useState(initial){const i=index++;if(!(i in slots))slots[i]={value:initial};return [slots[i].value,next=>{const value=typeof next==='function'?next(slots[i].value):next;if(!Object.is(value,slots[i].value)){slots[i].value=value;dirty=true;}}];},useRef(initial){const i=index++;return slots[i]??(slots[i]={current:initial});},useEffect(fn,deps){const i=index++,old=slots[i];if(!old||deps.some((value,j)=>!Object.is(value,old.deps[j])))pending.set(i,{fn,deps});else pending.delete(i);}};
let props={src:'/api/photo?member=a',label:'Member photo',description:'Photo description',onReport:()=>reported++,onThumbnailError:()=>thumbnailErrors++};
function render(){for(let pass=0;pass<10;pass++){index=0;dirty=false;const tree=nodes(Photo(props));if(!dirty){for(const node of tree){if(node.type==='dialog')node.props.ref.current=dialog;else if(node.type==='button'&&node.props.ref)node.props.ref.current=trigger;}return tree;}}throw Error('Viewer reset did not settle');}
function commit(){const tasks=[...pending];pending.clear();for(const [i,{fn,deps}] of tasks){slots[i]?.cleanup?.();slots[i]={deps,cleanup:fn()};}}
const button=label=>render().find(n=>n.type==='button'&&n.props['aria-label']===label),open=()=>{button('Enlarge '+props.label).props.onClick();render();commit();},close=()=>{button('Close photo').props.onClick();render();commit();};
const enlarged=()=>render().find(n=>n.type==='img'&&n.props.className?.startsWith('photo-zoom-')),alert=()=>render().find(n=>n.props.role==='alert')?.props.children;
const documentDescriptor=Object.getOwnPropertyDescriptor(globalThis,'document'),realFetch=globalThis.fetch,realInterval=globalThis.setInterval,realClear=globalThis.clearInterval,realCreate=URL.createObjectURL,realRevoke=URL.revokeObjectURL;
const listeners=new Set(),timers=new Map(),requests=[],created=[],revoked=[];let timerId=0;
const document={body:{},hidden:false,addEventListener(type,fn){assert.equal(type,'visibilitychange');listeners.add(fn);},removeEventListener(_type,fn){listeners.delete(fn);}};
Object.defineProperty(globalThis,'document',{value:document,configurable:true});
globalThis.setInterval=(fn,delay)=>{assert.equal(delay,5000);timers.set(++timerId,fn);return timerId;};globalThis.clearInterval=id=>timers.delete(id);
globalThis.fetch=(src,options)=>new Promise((resolve,reject)=>requests.push({src,options,resolve,reject}));URL.createObjectURL=()=>{const value='blob:checked-'+(created.length+1);created.push(value);return value;};URL.revokeObjectURL=value=>revoked.push(value);
const tick=()=>new Promise(resolve=>setImmediate(resolve)),poll=()=>[...timers.values()].forEach(fn=>fn()),visibility=()=>[...listeners].forEach(fn=>fn());
const succeed=async(request=requests.at(-1))=>{request.resolve({ok:true,status:200,blob:async()=>new Blob(['photo'],{type:'image/png'})});await tick();};
try{
 render();commit();assert.equal(requests.length,0);assert.equal(timers.size,0);assert.equal(shown,0);
 open();assert.equal(shown,1);assert.equal(requests.length,1);assert.equal(timers.size,1);assert.equal(listeners.size,1);assert(button('Zoom in').props.disabled);assert(!enlarged());
 poll();visibility();assert.equal(requests.length,1,'access checks never overlap');await succeed();assert.equal(enlarged().props.alt,'Photo description');const first=enlarged().props.src;
 button('Zoom in').props.onClick();button('Zoom in').props.onClick();assert.equal(enlarged().props.className,'photo-zoom-200');render();commit();assert.equal(requests.length,1,'zoom does not restart loading or polling');
 poll();const second=requests.at(-1);visibility();assert.equal(requests.at(-1),second);await succeed();assert(revoked.includes(first));assert.equal(enlarged().props.className,'photo-zoom-200','poll refresh preserves zoom');const secondUrl=enlarged().props.src;
 document.hidden=true;const beforeHidden=requests.length;poll();visibility();assert.equal(requests.length,beforeHidden,'hidden tabs skip refreshes');document.hidden=false;visibility();assert.equal(requests.length,beforeHidden+1);
 requests.at(-1).resolve(new Response('',{status:403}));await tick();assert.equal(alert(),'This photo is no longer available.');assert(!enlarged());assert(button('Zoom in').props.disabled);assert(revoked.includes(secondUrl));
 poll();requests.at(-1).resolve(new Response('',{status:404}));await tick();assert.equal(alert(),'This photo is no longer available.');
 poll();requests.at(-1).resolve(new Response('',{status:500}));await tick();assert.equal(alert(),'The photo could not load. Please close and try again.');
 poll();requests.at(-1).reject(Error('Offline'));await tick();assert.equal(alert(),'Could not check photo access. Close and try again.');poll();await succeed();assert.equal(alert(),undefined);
 // A response can arrive after a new source renders but before passive cleanup.
 poll();const oldSource=requests.at(-1);props={...props,src:'/api/chat-image?message=b'};render();assert(!enlarged(),'new source hides the old image before effects');await succeed(oldSource);assert(!enlarged(),'late old-source responses cannot enter the new viewer');assert.equal(alert(),undefined);commit();assert.equal(shown,1,'source changes keep the existing dialog open');assert(oldSource.options.signal.aborted);assert.equal(timers.size,1);await succeed();assert.equal(enlarged().props.className,'photo-zoom-100');
 const activeUrl=enlarged().props.src;close();assert.equal(closed,1);assert.equal(focused,1);assert.equal(timers.size,0);assert.equal(listeners.size,0);assert(revoked.includes(activeUrl));
 open();const previousSession=requests.at(-1);close();open();const currentSession=requests.at(-1),beforeLate=created.length;await succeed(previousSession);assert.equal(created.length,beforeLate,'closed sessions do not allocate new URLs');assert(!enlarged());await succeed(currentSession);enlarged().props.onError();assert.equal(alert(),'This photo could not be displayed.');assert(button('Zoom in').props.disabled);poll();await succeed();assert.equal(alert(),undefined);close();
 props={...props,src:'blob:local-selection'};render();commit();const beforeBlob=requests.length;open();assert.equal(enlarged().props.src,'blob:local-selection');poll();visibility();assert.equal(requests.length,beforeBlob,'local previews never make access requests');enlarged().props.onError();poll();assert.equal(alert(),'This photo could not be displayed.');
 render().find(n=>n.type==='img'&&n.props.loading==='lazy').props.onError();assert.equal(thumbnailErrors,1);render().find(n=>n.type==='button'&&n.props.children==='Report photo').props.onClick();render();commit();assert.equal(reported,1);assert(!revoked.includes('blob:local-selection'),'the viewer does not own caller-provided URLs');assert.equal(timers.size,0);
 props={...props,src:'/api/photo?member=c'};render();commit();open();const unfinished=requests.at(-1);let finishBody;unfinished.resolve({ok:true,status:200,blob:()=>new Promise(resolve=>finishBody=resolve)});await tick();for(const slot of slots)slot?.cleanup?.();assert(unfinished.options.signal.aborted);assert.equal(timers.size,0);assert.equal(listeners.size,0);const beforeUnmount=created.length;finishBody(new Blob(['late photo']));await tick();assert.equal(created.length,beforeUnmount);assert(created.every(value=>revoked.includes(value)),'every viewer-owned URL is released');
 for(const request of requests){assert.equal(request.options.cache,'no-store');assert(request.options.signal instanceof AbortSignal);}
}finally{for(const slot of slots)slot?.cleanup?.();globalThis.fetch=realFetch;globalThis.setInterval=realInterval;globalThis.clearInterval=realClear;URL.createObjectURL=realCreate;URL.revokeObjectURL=realRevoke;if(documentDescriptor)Object.defineProperty(globalThis,'document',documentDescriptor);else delete globalThis.document;delete globalThis.__photoHooks;}
console.log('Photo access polling, hidden tabs, denials, stale sessions, zoom, blob previews, focus and object-URL cleanup passed (simulated lifecycle).');
