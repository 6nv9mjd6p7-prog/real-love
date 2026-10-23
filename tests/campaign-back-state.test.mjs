import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const compile=text=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(text,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
const native=compile(readFileSync('app/native-links.ts','utf8')),navigation=compile(readFileSync('app/campaign-navigation.ts','utf8')),storage=compile(readFileSync('app/draft-storage.ts','utf8'));
const source=readFileSync('app/use-campaign-restoration.ts','utf8').replace("import {useMemo,useSyncExternalStore} from 'react';",'const useMemo=(...args)=>globalThis.__backHooks.useMemo(...args),useSyncExternalStore=(...args)=>globalThis.__backHooks.useSyncExternalStore(...args);').replace("from './native-links'",`from '${native}'`).replace("from './campaign-navigation'",`from '${navigation}'`).replace("from './draft-storage'",`from '${storage}'`);
const {useCampaignRestoration}=await import(compile(source));
const originals=Object.fromEntries(['window','history'].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
const listeners=new Set(),values=new Map();let reads=0;
const history={state:{realLoveNavigation:{account:'a',parent:'circles/work'}}};
const window={location:{hash:'#circles/action'},sessionStorage:{getItem(key){reads++;return values.get(key)??null;},setItem(key,value){values.set(key,value);},removeItem(key){values.delete(key);}},addEventListener(type,fn){assert.equal(type,'popstate');listeners.add(fn);},removeEventListener(_type,fn){listeners.delete(fn);}};
for(const [key,value]of Object.entries({history,window}))Object.defineProperty(globalThis,key,{value,configurable:true});
function harness(){let store,cleanup,notifications=0;globalThis.__backHooks={useMemo(fn){return store??(store=fn());},useSyncExternalStore(subscribe,getSnapshot,getServerSnapshot){return {subscribe,getSnapshot,getServerSnapshot};}};const result=useCampaignRestoration('a','proposal-a');return {...result,commit(){cleanup=result.subscribe(()=>notifications++);},dispose(){cleanup?.();},get notifications(){return notifications;}};}
try{
 let app=harness();assert.equal(app.getSnapshot().returnArea,'circles');assert.equal(app.getServerSnapshot().ready,false);assert.equal(reads,0,'render and server snapshot do not touch storage');assert.equal(listeners.size,0);
 app.commit();const first=app.getSnapshot();assert.equal(first.returnArea,'circles/work');assert.equal(first.ready,true);assert.equal(listeners.size,1);assert.equal(app.notifications,1);
 history.state.realLoveNavigation.parent='notifications';history.state.realLoveCampaign={account:'a',view:{tab:'My activity',selected:'campaign',compose:false,scroll:250,depth:2}};listeners.forEach(fn=>fn());const restored=app.getSnapshot();assert.notEqual(restored,first);assert.equal(restored.returnArea,'circles/work','internal navigation preserves the captured Back destination');assert.deepEqual(restored.view,{tab:'My activity',selected:'campaign',compose:false,scroll:250,depth:2});assert.equal(app.getSnapshot(),restored,'snapshot identity stays stable between events');
 window.location.hash='#saved';listeners.forEach(fn=>fn());assert.equal(app.getSnapshot(),restored,'unrelated routes do not restore campaigns');app.dispose();assert.equal(listeners.size,0);
 // Subscription replay neither rereads a draft nor resets the captured parent.
 const before=reads;app.commit();assert.equal(app.getSnapshot(),restored);assert.equal(reads,before);app.dispose();
 window.location.hash='#circles/action';history.state={realLoveNavigation:{account:'other',parent:'notifications'},realLoveCampaign:{account:'other',view:{compose:true,selected:'private'}}};app=harness();app.commit();assert.equal(app.getSnapshot().returnArea,'circles');assert.equal(app.getSnapshot().view.selected,'');assert.equal(app.getSnapshot().view.compose,false);app.dispose();
 // A discarded render cannot read or prune a proposal draft.
 const readBefore=reads;harness();assert.equal(reads,readBefore);assert.equal(listeners.size,0);
 const component=readFileSync('app/collective-action.tsx','utf8');assert(component.includes('backWithinApp(returnArea,accountId,readCampaignView(accountId).depth+1)'));assert(component.includes('routeBackLabel(returnArea)'));
}finally{delete globalThis.__backHooks;for(const [key,value]of Object.entries(originals)){if(value)Object.defineProperty(globalThis,key,value);else delete globalThis[key];}}
console.log('Campaign restoration captures account-scoped Back destinations after commit, follows history events, preserves scroll/depth, and cleans up without render-time storage reads.');
