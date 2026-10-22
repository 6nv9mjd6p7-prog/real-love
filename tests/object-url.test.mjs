import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
const require=createRequire(import.meta.url);
const compile=source=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
const original=readFileSync('app/use-object-url.ts','utf8');
const source=original.replace("import {useMemo,useSyncExternalStore} from 'react';",'const useMemo=(...args)=>globalThis.__urlHooks.useMemo(...args),useSyncExternalStore=(...args)=>globalThis.__urlHooks.useSyncExternalStore(...args);');
const {useObjectUrl}=await import(compile(source));
function harness(){let committedMemo,renderedMemo,pending,subscription,cleanup,notifications=0;
 const hooks={useMemo(fn,deps){renderedMemo=committedMemo&&deps.every((value,i)=>Object.is(value,committedMemo.deps[i]))?committedMemo:{value:fn(),deps};return renderedMemo.value;},useSyncExternalStore(subscribe,getSnapshot){pending={subscribe,getSnapshot};return getSnapshot();}};
 const listener=()=>notifications++;
 return {render(blob){globalThis.__urlHooks=hooks;return useObjectUrl(blob);},commit(){if(pending.subscribe!==subscription){cleanup?.();subscription=pending.subscribe;cleanup=subscription(listener);}committedMemo=renderedMemo;pending=null;},replay(){cleanup?.();cleanup=subscription(listener);},unmount(){cleanup?.();cleanup=null;subscription=null;},get notifications(){return notifications;}};
}
const realCreate=URL.createObjectURL,realRevoke=URL.revokeObjectURL,created=[],revoked=[];
URL.createObjectURL=blob=>{const url='blob:owned-'+(created.length+1);created.push({url,blob});return url;};URL.revokeObjectURL=url=>revoked.push(url);
const first=new Blob(['first'],{type:'image/png'}),second=new Blob(['second'],{type:'image/webp'}),discarded=new Blob(['discarded']);
let app,other;
try{
 const serverSource=original.replace("from 'react'",`from '${pathToFileURL(require.resolve('react')).href}'`)+"\nexport default function Probe({blob}){return useObjectUrl(blob)||'empty';}";
 const {default:Probe}=await import(compile(serverSource));assert.equal(renderToStaticMarkup(React.createElement(Probe,{blob:first})),'empty');assert.equal(created.length,0,'SSR allocates no URL');
 app=harness();assert.equal(app.render(null),'');app.commit();assert.equal(created.length,0,'a missing file owns no URL');assert.equal(app.render(first),'');assert.equal(created.length,0,'rendering allocates no URL');app.commit();const firstUrl=created[0].url;assert.equal(created[0].blob,first);assert.equal(app.render(first),firstUrl);app.commit();assert.equal(created.length,1);assert.equal(app.notifications,1,'unchanged selections keep the same subscription and URL');
 assert.equal(app.render(discarded),'');assert.equal(created.length,1);assert.equal(app.render(first),firstUrl);app.commit();assert.equal(created.length,1,'discarded renders allocate no URL');assert.deepEqual(revoked,[]);
 assert.equal(app.render(second),'','replacement never renders the previous file URL');assert.deepEqual(revoked,[],'resource release waits for commit');app.commit();assert.deepEqual(revoked,[firstUrl]);assert.equal(created[1].blob,second);assert.equal(app.render(second),created[1].url);app.commit();
 app.replay();assert.deepEqual(revoked,created.slice(0,2).map(value=>value.url));assert.equal(app.render(second),created[2].url,'effect replay recreates a released resource');app.commit();
 // Removing the file also represents the app's account-switch/sign-out reset.
 assert.equal(app.render(null),'');app.commit();assert.equal(created.length,3);assert.deepEqual(revoked,created.map(value=>value.url));app.render(first);app.commit();assert.equal(app.render(first),created[3].url,'reselecting a former file gets a fresh URL');app.commit();
 other=harness();assert.equal(other.render(first),'');other.commit();assert.notEqual(other.render(first),app.render(first),'each mounted owner has an independent URL');other.commit();const beforeRemoval=revoked.length;app.unmount();assert.equal(revoked.length,beforeRemoval+1);assert.equal(other.render(first),created[4].url,'one owner cannot revoke another owner’s URL');other.commit();other.unmount();assert.deepEqual([...revoked].sort(),created.map(value=>value.url).sort());assert.equal(new Set(revoked).size,created.length,'every committed URL is released once');
}finally{app?.unmount();other?.unmount();URL.createObjectURL=realCreate;URL.revokeObjectURL=realRevoke;delete globalThis.__urlHooks;}
console.log('Object URL snapshots allocate after commit, hide replaced/removed selections, survive replay and release each owner’s resources without SSR or discarded-render allocations.');
