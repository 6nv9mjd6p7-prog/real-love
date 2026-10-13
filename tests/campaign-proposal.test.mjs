import ts from 'typescript';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import React from 'react';
const require=createRequire(import.meta.url);
let state=[],index=0;
globalThis.__proposal={useState:x=>{const i=index++;if(!(i in state))state[i]=x;return [state[i],next=>state[i]=typeof next==='function'?next(state[i]):next];},useRef:x=>{const i=index++;return state[i]??(state[i]={current:x});}};
const source=readFileSync('app/campaign-proposal.tsx','utf8').replace("import {useEffect,useRef,useState} from 'react';","const {useState,useRef}=globalThis.__proposal;const useEffect=()=>{};");
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}}).outputText.replace(/from ["']react\/jsx-runtime["']/g,`from '${pathToFileURL(require.resolve('react/jsx-runtime')).href}'`);
const {default:Proposal}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
function nodes(n){return !n||typeof n!=='object'?[]:[n,...React.Children.toArray(n.props?.children).flatMap(nodes)];}
let draft={title:'Sample proposal',company:'Example company',summary:'Documented sample facts sufficiently detailed for a proposal.',demand:'A specific, measurable change in the company policy.',uncertainty:'The available evidence has limits.',alternatives:'Practical choices and disclosed interests.',reviewDate:'2099-01-01',sources:[{url:'https://example.org/source',claim:'This sample source supports a specific claim.'}]};
let consent=false,sent=0,valid=true,succeed=false;
function render(){index=0;return Proposal({draft,setDraft:d=>draft=d,consent,setConsent:x=>consent=x,busy:false,onSubmit:async()=>{sent++;return succeed;}});}
const all=()=>nodes(render());
const heading=()=>all().find(n=>n.type==='h2').props.children;
const submit=()=>render().props.onSubmit({preventDefault(){},currentTarget:{reportValidity:()=>valid}});
assert.equal(heading(),'Purpose');assert(all().some(n=>n.type==='textarea'&&n.props.value===draft.demand));
valid=false;await submit();assert.equal(heading(),'Purpose');assert.equal(sent,0);
valid=true;await submit();assert.equal(heading(),'Evidence');assert(all().some(n=>n.type==='input'&&n.props.type==='url'));assert.equal(sent,0);
await submit();assert.equal(heading(),'Review and submit');assert(all().some(n=>n.props['aria-label']==='Proposal summary'));assert.equal(sent,0);
all().find(n=>n.type==='button'&&n.props.children==='Back').props.onClick();assert.equal(heading(),'Evidence');
consent=true;all().find(n=>n.type==='textarea'&&n.props.value===draft.uncertainty).props.onChange({target:{value:'Updated uncertainty without losing the rest of the draft.'}});assert.equal(consent,false);assert.equal(draft.company,'Example company');
await submit();await submit();assert.equal(sent,1);assert.equal(heading(),'Review and submit');assert.equal(draft.title,'Sample proposal','failed submit keeps the proposal');
assert(all().find(n=>n.type==='button'&&n.props.children==='Submit for review').props.disabled===false,'failed submit permits retry');
delete globalThis.__proposal;
console.log('Proposal stage validation, back navigation, consent reset, preserved draft, and failed-submit retry passed.');
