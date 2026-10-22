import ts from 'typescript';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const compile=source=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText).toString('base64');
const storageModule=compile(readFileSync('app/draft-storage.ts','utf8'));
const {draftKey,writeDraft,readDraft}=await import(storageModule);
const items=new Map();let storageCalls=0;const storage={getItem:k=>(storageCalls++,items.get(k)??null),setItem:(k,v)=>(storageCalls++,items.set(k,v)),removeItem:k=>(storageCalls++,items.delete(k))};
globalThis.window={sessionStorage:storage};
let slots=[],index=0,pending=new Map(),notifications=0;
const changed=(old,deps)=>!old||deps.some((value,i)=>!Object.is(value,old[i]));
globalThis.__draftHooks={useMemo(fn,deps){const i=index++;if(changed(slots[i]?.deps,deps))slots[i]={value:fn(),deps};return slots[i].value;},useSyncExternalStore(subscribe,getSnapshot){const i=index++;if(slots[i]?.subscribe!==subscribe)pending.set(i,()=>{slots[i]?.cleanup?.();slots[i]={subscribe,cleanup:subscribe(()=>notifications++)};});return getSnapshot();},useEffect(fn,deps){const i=index++;if(changed(slots[i]?.deps,deps))pending.set(i,()=>{slots[i]?.cleanup?.();slots[i]={deps,cleanup:fn()};});}};
const source=readFileSync('app/use-tab-draft.ts','utf8').replace("import {useMemo,useSyncExternalStore} from 'react';","const {useMemo,useSyncExternalStore}=globalThis.__draftHooks;").replace("from './draft-storage'",`from '${storageModule}'`);
const {useTabDraft}=await import(compile(source));
function render(id,kind='invitation',account='member'){index=0;return useTabDraft(account,kind,id);}
function commit(){const effects=[...pending.values()];pending.clear();effects.forEach(fn=>fn());}
writeDraft(storage,draftKey('member','invitation','eli'),'My unfinished opening');
assert.equal(render('jules')[2],false);commit();assert.equal(render('jules')[2],true);
const changing=render('eli');assert.equal(changing[0],'');assert.equal(changing[2],false,'destination must restore before context is selected');commit();
const restored=render('eli');assert.equal(restored[2],true);assert.equal(restored[0],'My unfinished opening');
render('eli','invitation-context');commit();const context=render('eli','invitation-context');context[1]('{"key":"question"}');
assert.equal(render('eli','invitation-context')[0],'{"key":"question"}');
assert.equal(JSON.parse(items.get(draftKey('member','invitation','eli'))).value,'My unfinished opening','context changes preserve opening draft');
console.log('Destination draft readiness prevents context selection before restoration and preserves the separate opening.');

// Restoration (including expiry cleanup) must never run during rendering.
const expiredKey=draftKey('member','invitation','expired');items.set(expiredKey,JSON.stringify({version:1,updated:Date.now()-24*60*60*1000-1,value:'Expired private text'}));
const beforeExpired=storageCalls;assert.deepEqual([render('expired')[0],render('expired')[2]],['',false]);assert.equal(storageCalls,beforeExpired);assert(items.has(expiredKey),'rendering does not delete expired storage');commit();assert.equal(render('expired')[0],'');assert(render('expired')[2]);assert(!items.has(expiredKey),'subscription prunes expired storage');
const malformed=draftKey('member','invitation','malformed');items.set(malformed,'invalid JSON');render('malformed');commit();assert.deepEqual([render('malformed')[0],render('malformed')[2]],['',true]);assert(!items.has(malformed));
const objectDraft=draftKey('member','invitation','object');writeDraft(storage,objectDraft,{private:'not text'});render('object');commit();assert.equal(render('object')[0],'','non-text values cannot enter a text draft');
// Each setter keeps its captured account/key, including after the destination changes.
writeDraft(storage,draftKey('alice','message','same'),'Alice draft');writeDraft(storage,draftKey('bob','message','same'),'Bob draft');render('same','message','alice');commit();const alice=render('same','message','alice');assert.equal(alice[0],'Alice draft');assert.equal(render('same','message','alice')[1],alice[1],'setter identity stays stable for the same key');
const bobPending=render('same','message','bob');assert.equal(bobPending[0],'');assert(!bobPending[2]);commit();assert.equal(render('same','message','bob')[0],'Bob draft');alice[1]('Alice updated');assert.equal(readDraft(storage,draftKey('alice','message','same'),''),'Alice updated');assert.equal(render('same','message','bob')[0],'Bob draft','a stale setter never changes the current account view');
const bob=render('same','message','bob');bob[1]('');assert.equal(render('same','message','bob')[0],'');assert(!items.has(draftKey('bob','message','same')),'empty text removes storage and memory fallback');assert.equal(readDraft(null,draftKey('bob','message','same'),''),'');
// A setter used before restoration may write its own key, but readiness still waits for the subscription.
const early=render('early');early[1]('Written before restore');assert(!render('early')[2]);commit();assert.equal(render('early')[0],'Written before restore');
// Browser-storage denial retains the existing memory fallback without cross-key leakage.
const normalWindow=globalThis.window;globalThis.window={get sessionStorage(){throw Error('Storage denied');}};writeDraft(null,draftKey('member','message','memory'),'Memory draft');render('memory','message');commit();let memory=render('memory','message');assert.equal(memory[0],'Memory draft');memory[1]('Memory update');assert.equal(render('memory','message')[0],'Memory update');render('other-memory','message');commit();assert.equal(render('other-memory','message')[0],'');render('memory','message');commit();assert.equal(render('memory','message')[0],'Memory update');globalThis.window=normalWindow;
const setter=render('memory','message')[1];for(const slot of slots)slot?.cleanup?.();const detachedNotifications=notifications;setter('After unmount');assert.equal(notifications,detachedNotifications,'unmount releases the old subscription');assert.equal(readDraft(storage,draftKey('member','message','memory'),''),'After unmount','a detached setter still writes only its captured draft key');
// Real SSR returns an empty, unready draft without touching browser storage.
const require=createRequire(import.meta.url),serverSource=readFileSync('app/use-tab-draft.ts','utf8').replace("from './draft-storage'",`from '${storageModule}'`).replace("from 'react'",`from '${pathToFileURL(require.resolve('react')).href}'`)+"\nexport default function Probe(){const [value,,ready]=useTabDraft('member','invitation','eli');return (ready?'ready':'pending')+':'+value;}";
const {default:Probe}=await import(compile(serverSource));const beforeServer=storageCalls;assert.equal(renderToStaticMarkup(React.createElement(Probe)),'pending:');assert.equal(storageCalls,beforeServer);
console.log('Draft snapshots defer reads/expiry until commit, isolate captured keys, preserve memory fallback, release subscriptions and keep SSR empty.');

// Run the actual card-opening effect with both real draft hooks.
const appSource=readFileSync('app/love-app.tsx','utf8');
const start=appSource.indexOf(' const canOpenCardInvitation='),end=appSource.indexOf(' function askFromCard',start);assert(start>=0&&end>start);
const modelUrl=compile(readFileSync('app/model.ts','utf8'));
const invitationsUrl=compile(readFileSync('app/invitations.ts','utf8').replace("from './model'",`from '${modelUrl}'`));
const {default:cardView}=await import(compile(`import {useTabDraft} from '${compile(source)}';import {invitationOpening} from '${invitationsUrl}';
const {useEffect}=globalThis.__draftHooks;
export default function cardView({accountId,selected,existing,canConnect,route,openingContext,setInvitationOpen}){
const [proposal,setProposal,proposalReady]=useTabDraft(accountId,'invitation',selected?.id||'');
const [contextDraft,setContextDraft,contextReady]=useTabDraft(accountId,'invitation-context',selected?.id||'');
${appSource.slice(start,end)}
return {proposal,contextDraft,proposalReady,contextReady};}`));
slots=[];pending=new Map();const card={key:'question',label:'A question',text:'What matters?'};let opened=0;
const props={accountId:'member',selected:{id:'eli',demo:false},existing:null,canConnect:true,route:'person/eli',openingContext:{current:{person:'eli',account:'member',context:card}},setInvitationOpen:value=>{if(value)opened++;}};
function cardRender(changes={}){Object.assign(props,changes);index=0;return cardView(props);}
function settleCard(){for(let i=0;i<3;i++){cardRender();commit();}return cardRender();}
cardRender();commit();assert(props.openingContext.current,'context waits while both destination drafts restore');assert.equal(opened,0);
const draft=settleCard();assert.equal(opened,1);assert.equal(draft.proposal,'My unfinished opening','card shortcut never replaces restored opening text');assert.deepEqual(JSON.parse(draft.contextDraft),card);assert.equal(props.openingContext.current,null,'pending card context is consumed once');
settleCard();assert.equal(opened,1,'background renders never reopen the invitation');
props.openingContext.current={person:'new',account:'member',context:card};cardRender({selected:{id:'new',demo:false},route:'person/new'});commit();assert.equal(opened,1);assert(props.openingContext.current,'new destination waits for its own draft restoration');
const fresh=settleCard();assert.equal(fresh.proposal,'What makes that question interesting to you?');assert.equal(opened,2,'empty destination gets one suggested opening');
for(const changes of [{selected:{id:'demo',demo:true}},{selected:{id:'connected',demo:false},existing:{id:'connection'}},{selected:{id:'paused',demo:false},existing:null,canConnect:false}]){
 props.openingContext.current={person:changes.selected.id,account:'member',context:card};cardRender({...changes,route:'person/'+changes.selected.id});commit();settleCard();assert.equal(opened,2,'ineligible card does not open invitation');assert.equal(props.openingContext.current,null);
}
props.openingContext.current={person:'other',account:'member',context:card};cardRender({selected:{id:'new',demo:false},route:'person/new',existing:null,canConnect:true});commit();settleCard();assert(props.openingContext.current,'different profile never consumes another card context');assert.equal(opened,2);
cardRender({accountId:'other-account'});commit();settleCard();assert.equal(props.openingContext.current,null,'account switch discards the previous account context');assert.equal(opened,2);
console.log('Card invitations wait for draft restoration, preserve openings, consume context once, and honor eligibility/account boundaries.');
