import ts from 'typescript';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const compile=source=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
const model=compile(readFileSync('app/model.ts','utf8'));
const preferences=compile(readFileSync('app/discovery-preferences.ts','utf8').replace("from './model'",`from '${model}'`));
const {defaultDiscovery,writeDiscovery,readDiscovery}=await import(preferences);
const items=new Map();const storage={get length(){return items.size;},key:i=>[...items.keys()][i],getItem:k=>items.get(k)??null,setItem:(k,v)=>items.set(k,v),removeItem:k=>items.delete(k)};
globalThis.window={localStorage:storage};
// Queue effects after render, like React: all effects see the same render snapshot.
let slots=[],index=0,pending=[];
globalThis.__discoveryHooks={useState(initial){const i=index++;if(!(i in slots))slots[i]=initial;return [slots[i],value=>slots[i]=typeof value==='function'?value(slots[i]):value];},useEffect(fn,deps){const i=index++,old=slots[i];if(!old||deps.some((v,j)=>!Object.is(v,old[j]))){slots[i]=deps;pending.push(fn);}}};
const source=readFileSync('app/use-discovery-preferences.ts','utf8').replace("import {useEffect,useState} from 'react';","const {useEffect,useState}=globalThis.__discoveryHooks;").replace("from './discovery-preferences'",`from '${preferences}'`);
const {useDiscoveryPreferences}=await import(compile(source));
function render(account,demo=false){index=0;return useDiscoveryPreferences(account,demo);}
function commit(){const effects=pending;pending=[];effects.forEach(fn=>fn());}
function settle(account,demo=false){for(let i=0;i<4;i++){render(account,demo);commit();}return render(account,demo);}
const a={...defaultDiscovery,search:'Alice only',profileFilters:{gender:'Woman'}};
const b={...defaultDiscovery,search:'Bob only',profileFilters:{gender:'Man'}};
writeDiscovery(storage,'alice',a);
assert.equal(render('alice').ready,false);commit();assert.deepEqual(settle('alice').filters,a);
writeDiscovery(storage,'bob',b);
const transition=render('bob');assert.equal(transition.ready,false,'account changes immediately hide unrestored preferences');assert.deepEqual(transition.filters,defaultDiscovery,'previous account choices never render for the new account');commit();
assert.deepEqual(readDiscovery(storage,'bob'),b,'the first account-change effects must not overwrite new-account storage');
const bob=settle('bob');assert.deepEqual(bob.filters,b);assert(bob.remembering);
bob.set('search','Updated Bob');commit();assert.equal(settle('bob').filters.search,'Updated Bob');assert.equal(readDiscovery(storage,'bob').search,'Updated Bob');
const demo=settle('bob',true);demo.set('search','Demo only');commit();assert.equal(settle('bob',true).filters.search,'Demo only');assert.equal(readDiscovery(storage,'bob').search,'Updated Bob','demo changes never overwrite member filters');
settle('bob').reset();commit();assert.deepEqual(settle('bob').filters,defaultDiscovery);assert.deepEqual(readDiscovery(storage,'bob'),defaultDiscovery);
const logout=render('');assert(!logout.ready);assert.deepEqual(logout.filters,defaultDiscovery);commit();assert.deepEqual(settle('').filters,defaultDiscovery);assert.equal(storage.length,0,'sign-out clears saved preferences');
console.log('Discovery hook restoration, account-switch effects, demo isolation, updates, reset and sign-out passed (lifecycle harness).');
