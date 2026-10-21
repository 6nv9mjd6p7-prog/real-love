import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

// Exercise the actual tracker and route effect without rendering the full app.
const source=readFileSync('app/love-app.tsx','utf8');
const start=source.indexOf(' const journeySeen=');
const end=source.indexOf(' const main=',start);
assert(start>=0&&end>start);
const hooks=[];let index=0,pending=[];
const same=(a,b)=>a&&b&&a.length===b.length&&a.every((value,i)=>Object.is(value,b[i]));
globalThis.__journeyHooks={
 useRef(initial){const i=index++;return hooks[i]??(hooks[i]={current:initial});},
 useCallback(fn,deps){const i=index++;if(!same(hooks[i]?.deps,deps))hooks[i]={value:fn,deps};return hooks[i].value;},
 useEffect(fn,deps){const i=index++;if(!same(hooks[i]?.deps,deps)){hooks[i]={deps};pending.push(fn);}},
};
const wrapper=`const {useRef,useCallback,useEffect}=globalThis.__journeyHooks;
export default function render({accountId,initialized,loaded,canConnect,loadError,route,selected,existing,chat}){
${source.slice(start,end)}
return trackJourney;}`;
const js=ts.transpileModule(wrapper,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const {default:render}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const calls=[];let response=()=>Promise.resolve({ok:true});
globalThis.fetch=(url,options)=>{assert.equal(url,'/api/metrics');assert.equal(options.method,'POST');assert.equal(options.headers['Content-Type'],'application/json');const body=JSON.parse(options.body);assert.deepEqual(Object.keys(body).sort(),['action','expectedAccount','kind']);assert.equal(body.action,'journey');calls.push(body);return response();};
let props={accountId:'a',initialized:true,loaded:true,canConnect:true,loadError:'',route:'discover'};
function view(changes={}){props={...props,...changes};index=0;const tracker=render(props);const effects=pending;pending=[];effects.forEach(fn=>fn());return tracker;}
const tick=async()=>{await Promise.resolve();await Promise.resolve();};
const tracker=view();assert.equal(calls.length,1);assert.equal(calls[0].kind,'discovery_opened');
assert.equal(view(),tracker,'parent renders preserve tracker identity');tracker('discovery_opened');assert.equal(calls.length,1,'successful events deduplicate');
let reject;response=()=>new Promise((_,fail)=>reject=fail);
tracker('signup_basics_completed');tracker('signup_basics_completed');assert.equal(calls.length,2,'pending events deduplicate');
reject(Error('network'));await tick();response=()=>Promise.resolve({ok:false});tracker('signup_basics_completed');await tick();assert.equal(calls.length,3,'network failures allow retry');
response=()=>Promise.resolve({ok:true});tracker('signup_basics_completed');await tick();tracker('signup_basics_completed');assert.equal(calls.length,4,'HTTP failures allow retry, then success deduplicates');
for(const changes of [{initialized:false},{initialized:true,loaded:false},{loaded:true,canConnect:false},{canConnect:true,loadError:'offline'}])view({...changes,route:'circles'});
assert.equal(calls.length,4,'route metrics wait for initialization, access, and a successful load');
view({loadError:'',route:'person/demo',selected:{id:'demo',demo:true}});assert.equal(calls.length,4,'demo profiles are excluded');
view({route:'person/real',selected:{id:'real',demo:false},existing:{available:false}});assert.equal(calls.length,4,'unavailable profiles are excluded');
view({existing:{available:true}});assert.equal(calls.at(-1).kind,'profile_opened');const afterProfile=calls.length;
view({selected:{id:'real',demo:false,name:'changed'}});assert.equal(calls.length,afterProfile,'profile object refresh does not duplicate events');
view({route:'chat/c',chat:{status:'pending',available:true}});assert.equal(calls.length,afterProfile);
view({chat:{status:'accepted',available:false}});assert.equal(calls.length,afterProfile);
view({chat:{status:'accepted',available:true}});assert.equal(calls.at(-1).kind,'chat_opened');
view({route:'circles/c'});assert.equal(calls.at(-1).kind,'circles_opened');
const beforeSwitch=calls.length;const nextTracker=view({accountId:'b',route:'discover'});assert.notEqual(nextTracker,tracker);assert.equal(calls.length,beforeSwitch+1);assert.equal(calls.at(-1).expectedAccount,'b');
view({accountId:'a'});assert.equal(calls.length,beforeSwitch+1,'returning to an account keeps its deduplication state');
view({accountId:'',route:'profile'} )('signup_interests_completed');assert.equal(calls.length,beforeSwitch+1,'no anonymous journey request');
console.log('Journey deduplication, retries, route eligibility, private payloads, stable renders, and account isolation passed');
