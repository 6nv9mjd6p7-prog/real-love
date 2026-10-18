import ts from 'typescript';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const compile=source=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText).toString('base64');
const storageModule=compile(readFileSync('app/draft-storage.ts','utf8'));
const {draftKey,writeDraft}=await import(storageModule);
const items=new Map();const storage={getItem:k=>items.get(k)??null,setItem:(k,v)=>items.set(k,v),removeItem:k=>items.delete(k)};
globalThis.window={sessionStorage:storage};
let slots=[],index=0,pending=[];
globalThis.__draftHooks={useState(initial){const i=index++;if(!(i in slots))slots[i]=initial;return [slots[i],value=>slots[i]=typeof value==='function'?value(slots[i]):value];},useCallback(fn){index++;return fn;},useEffect(fn,deps){const i=index++,old=slots[i];if(!old||deps.some((v,j)=>!Object.is(v,old[j]))){slots[i]=deps;pending.push(fn);}}};
const source=readFileSync('app/use-tab-draft.ts','utf8').replace("import {useCallback,useEffect,useState} from 'react';","const {useCallback,useEffect,useState}=globalThis.__draftHooks;").replace("from './draft-storage'",`from '${storageModule}'`);
const {useTabDraft}=await import(compile(source));
function render(id,kind='invitation'){index=0;return useTabDraft('member',kind,id);}
function commit(){const effects=pending;pending=[];effects.forEach(fn=>fn());}
writeDraft(storage,draftKey('member','invitation','eli'),'My unfinished opening');
assert.equal(render('jules')[2],false);commit();assert.equal(render('jules')[2],true);
const changing=render('eli');assert.equal(changing[0],'');assert.equal(changing[2],false,'destination must restore before context is selected');commit();
const restored=render('eli');assert.equal(restored[2],true);assert.equal(restored[0],'My unfinished opening');
render('eli','invitation-context');commit();const context=render('eli','invitation-context');context[1]('{"key":"question"}');
assert.equal(render('eli','invitation-context')[0],'{"key":"question"}');
assert.equal(JSON.parse(items.get(draftKey('member','invitation','eli'))).value,'My unfinished opening','context changes preserve opening draft');
console.log('Destination draft readiness prevents context selection before restoration and preserves the separate opening.');
