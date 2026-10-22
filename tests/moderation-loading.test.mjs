import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
const require=createRequire(import.meta.url);
const fake=['useCallback','useState','useEffect'].map(name=>`const ${name}=(...args)=>globalThis.__reviewHooks.${name}(...args);`).join('');
const source=readFileSync('app/moderation.tsx','utf8').replace("import {useCallback,useState,useEffect} from 'react';",fake).replace("import OwnerMetrics from './owner-metrics';",'const OwnerMetrics=()=>null;');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText.replace(/from ["']react\/jsx-runtime["']/,`from '${pathToFileURL(require.resolve('react/jsx-runtime')).href}'`);
const {default:Review}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const nodes=n=>!n||typeof n!=='object'?[]:[n,...React.Children.toArray(n.props?.children).flatMap(nodes)];
function harness(){const slots=[],pending=new Map();let index,rendering=false,restart=false,committing=false,synchronousWrites=0;
 const changed=(old,deps)=>!old||deps.some((value,i)=>!Object.is(value,old[i]));
 const hooks={useState(initial){const i=index++;if(!(i in slots))slots[i]={value:initial};return [slots[i].value,next=>{if(committing)synchronousWrites++;const value=typeof next==='function'?next(slots[i].value):next;if(!Object.is(value,slots[i].value)){slots[i].value=value;if(rendering)restart=true;}}];},useCallback(fn,deps){const i=index++;if(changed(slots[i]?.deps,deps))slots[i]={fn,deps};return slots[i].fn;},useEffect(fn,deps){const i=index++;if(changed(slots[i]?.committed,deps))pending.set(i,{fn,deps});}};
 return {render(accountId='owner'){globalThis.__reviewHooks=hooks;let tree;do{restart=false;index=0;rendering=true;tree=Review({accountId});rendering=false;}while(restart);return {html:renderToStaticMarkup(tree),nodes:nodes(tree),button(label){return nodes(tree).find(n=>n.type==='button'&&n.props.children===label);}};},commit(){committing=true;try{for(const [i,{fn,deps}]of pending){slots[i]={committed:deps};fn();}pending.clear();}finally{committing=false;}},get synchronousWrites(){return synchronousWrites;}};
}
const realFetch=globalThis.fetch,realWindow=globalThis.window,requests=[];let reloads=0;
globalThis.window={location:{reload(){reloads++;}}};
globalThis.fetch=(url,options)=>new Promise((resolve,reject)=>requests.push({url,options,resolve,reject}));
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const queue={accountId:'owner',owner:true,admissions:[{id:'applicant',name:'Applicant',age:25}],photos:[],cases:[],moderators:[],reviewerInvitations:[]};
let app=harness();
try{
 let state=app.render();assert(state.html.includes('Loading safety review…'));assert.equal(requests.length,0);app.commit();assert.equal(requests.length,1);assert.equal(app.synchronousWrites,0);
 app.render();app.commit();assert.equal(requests.length,1,'parent renders do not refetch');requests.at(-1).resolve(Response.json(queue));await tick();state=app.render();assert(state.html.includes('Applicant'));assert(!state.html.includes('Loading safety review…'));
 let refresh=state.button('Refresh review queue').props.onClick();state=app.render();assert(state.html.includes('Loading safety review…'));assert(state.html.includes('Applicant'),'refresh retains the current queue');assert(state.button('Refresh review queue').props.disabled);requests.at(-1).resolve(Response.json({error:'Reviewer access required.'},{status:403}));await refresh;state=app.render();assert(state.html.includes('Reviewer access required.'));assert(!state.html.includes('Applicant'),'failed refresh hides the old queue');
 refresh=state.button('Retry loading').props.onClick();state=app.render();assert(!state.html.includes('Reviewer access required.'),'retry clears the old error immediately');assert(state.html.includes('Loading safety review…'));requests.at(-1).resolve(Response.json({...queue,cases:null}));await refresh;assert(app.render().html.includes('incomplete response'));
 refresh=app.render().button('Retry loading').props.onClick();requests.at(-1).resolve({ok:true,json:async()=>{throw Error('Invalid queue response');}});await refresh;assert(app.render().html.includes('Invalid queue response'));
 refresh=app.render().button('Retry loading').props.onClick();requests.at(-1).reject(Error('Network unavailable'));await refresh;assert(app.render().html.includes('Network unavailable'));
 refresh=app.render().button('Retry loading').props.onClick();requests.at(-1).resolve(Response.json({...queue,accountId:'another-account',admissions:[{id:'foreign',name:'Foreign applicant'}]}));await refresh;assert.equal(reloads,1);assert(!app.render().html.includes('Foreign applicant'),'account mismatch reloads without accepting the queue');
 refresh=app.render().button('Refresh review queue').props.onClick();requests.at(-1).resolve(Response.json(queue));await refresh;state=app.render();assert(!state.html.includes('role="alert"'));
 // Review actions still require their own reason and refresh before reporting success.
 state.nodes.find(n=>n.type==='input'&&n.props.type==='checkbox').props.onChange({target:{checked:true}});
 state.nodes.find(n=>n.type==='textarea'&&n.props.id==='admission-reason-applicant').props.onChange({target:{value:'Eligibility and rules checked'}});
 state=app.render();assert(!state.button('Approve member').props.disabled);const action=state.button('Approve member').props.onClick();const post=requests.at(-1);assert.deepEqual(JSON.parse(post.options.body),{expectedAccount:'owner',action:'admit',target:'applicant',report:'',reason:'Eligibility and rules checked',adultReviewed:true,reviewToken:'',invitation:''});post.resolve(Response.json({ok:true}));await tick();state=app.render();assert(state.html.includes('Loading safety review…'));assert(!state.html.includes('Action recorded.'));requests.at(-1).resolve(Response.json({...queue,admissions:[]}));await action;state=app.render();assert(state.html.includes('Action recorded.'));assert(state.html.includes('No applicants awaiting admission.'));
 // A saved decision remains saved even if its follow-up refresh fails.
 refresh=state.button('Refresh review queue').props.onClick();requests.at(-1).resolve(Response.json(queue));await refresh;state=app.render();state.nodes.find(n=>n.type==='input'&&n.props.type==='checkbox').props.onChange({target:{checked:true}});state.nodes.find(n=>n.type==='textarea'&&n.props.id==='admission-reason-applicant').props.onChange({target:{value:'Checked again'}});const secondAction=app.render().button('Approve member').props.onClick();requests.at(-1).resolve(Response.json({ok:true}));await tick();requests.at(-1).reject(Error('Refresh interrupted'));await secondAction;assert(app.render().html.includes('Action recorded. Refresh the queue before taking another action.'));
 // Changing the account restores loading and clears the prior load error before its effect.
 state=app.render('new-owner');assert(state.html.includes('Loading safety review…'));assert(!state.html.includes('Refresh interrupted'));app.commit();assert.equal(app.synchronousWrites,0);requests.at(-1).resolve(Response.json({...queue,accountId:'new-owner'}));await tick();assert(!app.render('new-owner').html.includes('Loading safety review…'));
 for(const request of requests){assert.equal(request.url,'/api/moderation');if(request.options.method!=='POST')assert.deepEqual(request.options,{cache:'no-store'});}
 // A synchronously throwing transport must still settle outside the effect.
 globalThis.fetch=()=>{throw Error('Transport unavailable');};app=harness();app.render();app.commit();assert.equal(app.synchronousWrites,0);await tick();assert(app.render().html.includes('Transport unavailable'));
}finally{globalThis.fetch=realFetch;globalThis.window=realWindow;delete globalThis.__reviewHooks;}
console.log('Safety review loading preserves mount, refresh, retries, account validation, decision payloads and post-action refresh behavior.');
