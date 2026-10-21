import ts from 'typescript';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const compile=source=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText).toString('base64');
const storageModule=compile(readFileSync('app/draft-storage.ts','utf8'));
const {draftKey,writeDraft}=await import(storageModule);
const items=new Map();const storage={getItem:k=>items.get(k)??null,setItem:(k,v)=>items.set(k,v),removeItem:k=>items.delete(k)};
globalThis.window={sessionStorage:storage};
let slots=[],index=0,pending=[];
globalThis.__draftHooks={useState(initial){const i=index++;if(!(i in slots))slots[i]=initial;return [slots[i],value=>slots[i]=typeof value==='function'?value(slots[i]):value];},useCallback(fn,deps){const i=index++,old=slots[i];if(!old||deps.some((v,j)=>!Object.is(v,old.deps[j])))slots[i]={fn,deps};return slots[i].fn;},useEffect(fn,deps){const i=index++,old=slots[i];if(!old||deps.some((v,j)=>!Object.is(v,old[j]))){slots[i]=deps;pending.push(fn);}}};
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
slots=[];pending=[];const card={key:'question',label:'A question',text:'What matters?'};let opened=0;
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
