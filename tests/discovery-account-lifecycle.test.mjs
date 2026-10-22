import ts from 'typescript';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const compile=source=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
const model=compile(readFileSync('app/model.ts','utf8'));
const preferences=compile(readFileSync('app/discovery-preferences.ts','utf8').replace("from './model'",`from '${model}'`));
const {defaultDiscovery,writeDiscovery,readDiscovery}=await import(preferences);
const items=new Map();let storageCalls=0;const storage={get length(){storageCalls++;return items.size;},key:i=>(storageCalls++,[...items.keys()][i]),getItem:k=>(storageCalls++,items.get(k)??null),setItem:(k,v)=>(storageCalls++,items.set(k,v)),removeItem:k=>(storageCalls++,items.delete(k))};
globalThis.window={localStorage:storage};
// Subscriptions restore only after commit; snapshots stay stable during rendering.
let slots=[],index=0,pending=new Map(),notifications=0;
const changed=(old,deps)=>!old||deps.some((value,i)=>!Object.is(value,old[i]));
globalThis.__discoveryHooks={useState(initial){const i=index++;if(!(i in slots))slots[i]={value:initial};return [slots[i].value,value=>slots[i].value=typeof value==='function'?value(slots[i].value):value];},useMemo(fn,deps){const i=index++;if(changed(slots[i]?.deps,deps))slots[i]={value:fn(),deps};return slots[i].value;},useSyncExternalStore(subscribe,getSnapshot){const i=index++;if(slots[i]?.subscribe!==subscribe)pending.set(i,subscribe);return getSnapshot();}};
const source=readFileSync('app/use-discovery-preferences.ts','utf8').replace("import {useMemo,useState,useSyncExternalStore} from 'react';","const {useMemo,useState,useSyncExternalStore}=globalThis.__discoveryHooks;").replace("from './discovery-preferences'",`from '${preferences}'`);
const {useDiscoveryPreferences}=await import(compile(source));
function render(account,demo=false,scope='discover'){index=0;return useDiscoveryPreferences(account,demo,scope);}
function commit(){for(const [i,subscribe]of pending){slots[i]?.cleanup?.();slots[i]={subscribe,cleanup:subscribe(()=>notifications++)};}pending.clear();}
function settle(account,demo=false,scope='discover'){render(account,demo,scope);commit();return render(account,demo,scope);}
const a={...defaultDiscovery,search:'Alice only',profileFilters:{gender:'Woman'}};
const b={...defaultDiscovery,search:'Bob only',profileFilters:{gender:'Man'}};
writeDiscovery(storage,'alice',a);
const callsBeforeRestore=storageCalls;assert.equal(render('alice').ready,false);assert.equal(storageCalls,callsBeforeRestore,'rendering does not read, write or clear browser storage');commit();assert.deepEqual(settle('alice').filters,a);
writeDiscovery(storage,'bob',b);
const transition=render('bob');assert.equal(transition.ready,false,'account changes immediately hide unrestored preferences');assert.deepEqual(transition.filters,defaultDiscovery,'previous account choices never render for the new account');commit();
assert.deepEqual(readDiscovery(storage,'bob'),b,'the first account-change effects must not overwrite new-account storage');
const bob=settle('bob');assert.deepEqual(bob.filters,b);assert(bob.remembering);
bob.set('search','Updated Bob');commit();assert.equal(settle('bob').filters.search,'Updated Bob');assert.equal(readDiscovery(storage,'bob').search,'Updated Bob');
const demo=settle('bob',true);demo.set('search','Demo only');commit();assert.equal(settle('bob',true).filters.search,'Demo only');assert.equal(readDiscovery(storage,'bob').search,'Updated Bob','demo changes never overwrite member filters');
settle('bob').reset();commit();assert.deepEqual(settle('bob').filters,defaultDiscovery);assert.deepEqual(readDiscovery(storage,'bob'),defaultDiscovery);
const logout=render('');assert(!logout.ready);assert.deepEqual(logout.filters,defaultDiscovery);commit();assert.deepEqual(settle('').filters,defaultDiscovery);assert.equal(storage.length,0,'sign-out clears saved preferences');
// A scope change must restore its own filters before permitting edits or persistence.
writeDiscovery(storage,'scoped',{...defaultDiscovery,search:'Discover only'});
writeDiscovery(storage,'scoped',{...defaultDiscovery,search:'Bookmarks only'},'saved');
const discover=settle('scoped');assert.equal(discover.filters.search,'Discover only');
const beforeScope=items.get('real-love-saved-v1:scoped');const changingScope=render('scoped',false,'saved');assert(!changingScope.ready);assert.equal(changingScope.filters.search,'');changingScope.set('search','Too early');assert.equal(items.get('real-love-saved-v1:scoped'),beforeScope,'unrestored scope edits cannot overwrite storage');commit();
const saved=render('scoped',false,'saved');assert.equal(saved.filters.search,'Bookmarks only');saved.set('search','Saved update');assert.equal(readDiscovery(storage,'scoped','saved').search,'Saved update');assert.equal(readDiscovery(storage,'scoped').search,'Discover only');
discover.set('search','Stale Discover callback');assert.equal(readDiscovery(storage,'scoped').search,'Discover only','a detached store cannot write through a stale callback');
const detached=saved;settle('replacement');detached.set('search','Old account callback');assert.equal(items.has('real-love-saved-v1:scoped'),false,'account cleanup cannot be undone by an old setter');
// Both writes and reads fail safely when browser storage is denied.
const normalWindow=globalThis.window;globalThis.window={localStorage:{get length(){throw Error('denied');},getItem(){throw Error('denied');},setItem(){throw Error('denied');}}};
let denied=settle('denied');assert(denied.ready);assert(!denied.remembering);denied.set('search','In-memory choice');denied=render('denied');assert.equal(denied.filters.search,'In-memory choice');assert(!denied.remembering);denied.reset();assert.deepEqual(render('denied').filters,defaultDiscovery);globalThis.window=normalWindow;
const beforeNotifications=notifications;for(const slot of slots)slot?.cleanup?.();denied.set('search','Unmounted choice');assert.equal(notifications,beforeNotifications,'unmount releases listeners and ignores stale edits');
// Real server rendering always uses the empty snapshot, even with browser globals present.
const require=createRequire(import.meta.url);
const serverSource=readFileSync('app/use-discovery-preferences.ts','utf8').replace("from './discovery-preferences'",`from '${preferences}'`).replace("from 'react'",`from '${pathToFileURL(require.resolve('react')).href}'`)+"\nexport default function ServerProbe(){const state=useDiscoveryPreferences('server',false);return state.ready?'ready':'pending:'+state.filters.search;}";
const {default:ServerProbe}=await import(compile(serverSource));const beforeServer=storageCalls;assert.equal(renderToStaticMarkup(React.createElement(ServerProbe)),'pending:');assert.equal(storageCalls,beforeServer,'SSR never touches browser storage');
console.log('Discovery snapshots restore after commit, isolate accounts/scopes, preserve demo/reset behavior, reject stale edits, and recover from unavailable storage.');
