import ts from 'typescript';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import React from 'react';
const require=createRequire(import.meta.url);
function compile(source){return 'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}}).outputText.replace(/from ["']react\/jsx-runtime["']/,`from '${pathToFileURL(require.resolve('react/jsx-runtime')).href}'`)).toString('base64');}
let open,index=0;
globalThis.__circleToolsHooks={useState:initial=>[open??initial,value=>open=value]};
const {default:Tools}=await import(compile(readFileSync('app/circle-chat-tools.tsx','utf8').replace("import {useState,type ReactNode} from 'react';",'const {useState}=globalThis.__circleToolsHooks;')));
const content=React.createElement('p',null,'Circle controls');
let tree=Tools({children:content});assert.equal(tree.type,'details');assert.equal(tree.props.open,false,'circle tools start collapsed');
tree.props.onToggle({currentTarget:{open:true}});assert.equal(Tools({children:content}).props.open,true);
open=undefined;tree=Tools({children:content,initialOpen:true});assert.equal(tree.props.open,true,'Together shortcuts can expand tools');tree.props.onToggle({currentTarget:{open:false}});assert.equal(Tools({children:content,initialOpen:true}).props.open,false,'shortcut-opened tools can still close');

const circle={id:'test-circle',title:'A long circle title that should not crowd the message viewport',membership:'accepted',status:'open',role:'host',tags:[],activity:'Choose an activity together.',description:'Read and talk together.'};
globalThis.__circleLayoutHooks={useState(initial){const i=index++;return [i===0?[circle]:i===1?circle:initial,()=>{}];},useRef:initial=>({current:initial}),useEffect(){},useLayoutEffect(){},useCallback:fn=>fn};
let source=readFileSync('app/circles.tsx','utf8').replace(/^import (.+) from '[^']+';$/gm,(_,bindings)=>{
 if(bindings.startsWith('type '))return '';
 const names=bindings.startsWith('{')?bindings.slice(1,-1).split(',').map(s=>s.trim()).filter(s=>!s.startsWith('type ')):[bindings];
 return names.map(name=>{
  if(name in globalThis.__circleLayoutHooks)return `const ${name}=globalThis.__circleLayoutHooks.${name};`;
  if(name==='LatestRequest')return 'class LatestRequest{begin(){return 1;}current(){return true;}cancel(){}}';
  if(name==='useTabDraft')return 'const useTabDraft=()=>["",()=>{}];';
  return `const ${name}=()=>[];`;
 }).join('\n');
});
const {default:Circles}=await import(compile(source));
function elements(node){if(!node||typeof node!=='object')return [];return [node,...React.Children.toArray(node.props?.children).flatMap(elements)];}
index=0;tree=Circles({accountId:'member',active:true,connections:[],onReport:()=>{}});
const nodes=elements(tree),context=nodes.find(n=>n.props?.className==='chat-context-area');
const contextChildren=React.Children.toArray(context.props.children);
assert.equal(contextChildren.length,3,'header, compact management and tools disclosures own the upper chat area');
const heading=contextChildren[0],management=contextChildren[1],tools=contextChildren[2];
assert.equal(management.props.circle.id,circle.id,'management is scoped to the current circle');
assert.equal(heading.props.className,'chat-heading');assert(!elements(heading).some(n=>n.type==='button'&&n.props.children==='Leave circle'),'rare leave action does not crowd the mobile header');
assert(elements(tools).some(n=>n.props?.className==='message-search'),'search belongs inside the tools disclosure');
assert(!elements(tools).some(n=>n.props?.className==='messages conversation-messages'),'transcript is outside the collapsible controls');
assert(nodes.some(n=>n.props?.className==='messages conversation-messages'));
console.log('Circle tools collapse and reopen, Together shortcut remains closable, and search/rare actions cannot crowd the transcript by default. Browser touch/layout QA remains unverified.');
