import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
const require=createRequire(import.meta.url);
const fake=['useCallback','useEffect','useState'].map(name=>`const ${name}=(...args)=>globalThis.__metricsHooks.${name}(...args);`).join('');
const source=readFileSync('app/owner-metrics.tsx','utf8').replace("import {useCallback,useEffect,useState} from 'react';",fake).replace("import JourneySummary from './journey-summary';",'const JourneySummary=()=>null;');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText.replace('from "react/jsx-runtime"',`from '${pathToFileURL(require.resolve('react/jsx-runtime')).href}'`);
const {default:Metrics}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const nodes=n=>!n||typeof n!=='object'?[]:[n,...React.Children.toArray(n.props?.children).flatMap(nodes)];
function harness(){const slots=[];let index,pending=[],committing=false,synchronousWrites=0;
 const changed=(old,deps)=>!old||deps.some((value,i)=>!Object.is(value,old[i]));
 const hooks={useState(initial){const i=index++;if(!(i in slots))slots[i]={value:initial};return [slots[i].value,next=>{if(committing)synchronousWrites++;slots[i].value=typeof next==='function'?next(slots[i].value):next;}];},useCallback(fn,deps){const i=index++;if(changed(slots[i]?.deps,deps))slots[i]={fn,deps};return slots[i].fn;},useEffect(fn,deps){const i=index++;if(changed(slots[i],deps)){slots[i]=deps;pending.push(fn);}}};
 return {render(accountId='owner'){index=0;globalThis.__metricsHooks=hooks;const tree=Metrics({accountId});return {html:renderToStaticMarkup(tree),refresh:nodes(tree).find(n=>n.type==='button').props.onClick};},commit(){committing=true;try{const effects=pending;pending=[];effects.forEach(fn=>fn());}finally{committing=false;}},get synchronousWrites(){return synchronousWrites;}};
}
const realFetch=globalThis.fetch,requests=[];
globalThis.fetch=(url,options)=>new Promise((resolve,reject)=>requests.push({url,options,resolve,reject}));
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const data={accountId:'owner',totals:{saved:4,approved:3,pending:1},funnel:[],feedback:[],cohort:[],signupCohort:[]};
let app=harness();
try{
 assert(app.render().html.includes('Loading totals…'));assert.equal(requests.length,0,'rendering never fetches');app.commit();assert.equal(requests.length,1);assert.equal(app.synchronousWrites,0);
 app.render();app.commit();assert.equal(requests.length,1,'ordinary parent renders do not repeat the initial request');
 requests.at(-1).resolve(Response.json(data));await tick();let state=app.render();assert(state.html.includes('<dt>Saved profiles</dt><dd>4</dd>'));assert(!state.html.includes('Loading totals…'));
 let refresh=state.refresh();assert.equal(requests.length,2);assert(app.render().html.includes('<dd>4</dd>'),'manual refresh retains the current totals while pending');
 requests.at(-1).resolve(Response.json({...data,totals:{...data.totals,saved:7}}));await refresh;assert(app.render().html.includes('<dt>Saved profiles</dt><dd>7</dd>'));
 refresh=app.render().refresh();requests.at(-1).resolve(Response.json({accountId:'owner',error:'Owner access required.'},{status:403}));await refresh;assert(app.render().html.includes('Owner access required.'));assert(!app.render().html.includes('<dd>7</dd>'),'errors replace the displayed totals');
 refresh=app.render().refresh();requests.at(-1).resolve(Response.json({...data,accountId:'another-account',totals:{saved:999,approved:999,pending:999}}));await refresh;assert(app.render().html.includes('Activity totals unavailable.'));assert(!app.render().html.includes('999'),'foreign-account totals never enter the view');
 refresh=app.render().refresh();requests.at(-1).resolve({ok:true,json:async()=>{throw Error('Invalid totals response');}});await refresh;assert(app.render().html.includes('Invalid totals response'));
 refresh=app.render().refresh();requests.at(-1).reject(Error('Network unavailable'));await refresh;assert(app.render().html.includes('Network unavailable'));
 refresh=app.render().refresh();requests.at(-1).resolve(Response.json(data));await refresh;assert(!app.render().html.includes('role="alert"'),'a successful retry clears the error');assert(app.render().html.includes('<dd>4</dd>'));
 for(const request of requests){assert.equal(request.url,'/api/metrics');assert.deepEqual(request.options,{cache:'no-store'});}
 // Even a transport that throws before returning a promise reports through the response callback.
 globalThis.fetch=()=>{throw Error('Transport unavailable');};app=harness();app.render();app.commit();assert.equal(app.synchronousWrites,0);await tick();assert(app.render().html.includes('Transport unavailable'));
 // Fresh account-scoped mounts validate their own identity.
 globalThis.fetch=async()=>Response.json({...data,accountId:'new-owner'});app=harness();app.render('new-owner');app.commit();await tick();assert(app.render('new-owner').html.includes('<dd>4</dd>'));
}finally{globalThis.fetch=realFetch;delete globalThis.__metricsHooks;}
console.log('Owner totals mount once, refresh without clearing data, reject account mismatches, recover from HTTP/parse/network errors, and avoid synchronous effect state writes.');
