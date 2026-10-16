import ts from 'typescript';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import React from 'react';
const require=createRequire(import.meta.url);
let slots=[],index=0,effects=[],headingFocused=0,triggerFocused=0;
globalThis.__discoveryToolbarHooks={
 useState(initial){const i=index++;if(!(i in slots))slots[i]=initial;return[slots[i],value=>slots[i]=typeof value==='function'?value(slots[i]):value];},
 useRef(initial){const i=index++;if(!(i in slots))slots[i]={current:initial};return slots[i];},
 useId:()=> 'filters-test',useEffect:fn=>effects.push(fn),
};
let source=readFileSync('app/discovery-toolbar.tsx','utf8')
 .replace("import {useEffect,useId,useRef,useState,type ReactNode} from 'react';",'const {useEffect,useId,useRef,useState}=globalThis.__discoveryToolbarHooks;')
 .replace("import {SlidersHorizontal} from 'lucide-react';",'const SlidersHorizontal=()=>null;');
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}}).outputText.replace(/from ["']react\/jsx-runtime["']/,`from '${pathToFileURL(require.resolve('react/jsx-runtime')).href}'`);
const {default:Toolbar}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const field=React.createElement('input',{defaultValue:'unfinished rule'}),search=React.createElement('input',{'aria-label':'Search'}),shortcuts=React.createElement('p',null,'Interest shortcuts');
let nodes;
function flatten(node){return !node||typeof node!=='object'?[]:[node,...React.Children.toArray(node.props?.children).flatMap(flatten)];}
function render(){index=0;effects=[];const tree=Toolbar({search,shortcuts,filterCount:2,children:field});nodes=flatten(tree);return tree;}
function panel(){return nodes.find(n=>n.props?.role==='region');}
function trigger(){return nodes.find(n=>n.props?.className==='secondary discovery-filter-toggle');}
render();assert.equal(panel().props.hidden,true);assert.equal(trigger().props['aria-expanded'],false);
assert.equal(trigger().props['aria-controls'],panel().props.id);
assert(flatten(panel()).some(n=>n.type==='input'&&n.props.defaultValue==='unfinished rule'),'closed filters stay mounted, preserving unfinished input state');
trigger().props.ref.current={focus(){triggerFocused++;}};
nodes.find(n=>n.type==='h2').props.ref.current={focus(){headingFocused++;}};
trigger().props.onClick();render();effects.forEach(fn=>fn());
assert.equal(panel().props.hidden,false);assert.equal(trigger().props['aria-expanded'],true);assert.equal(headingFocused,1,'opening filters moves keyboard focus to the panel heading');
let prevented=false;panel().props.onKeyDown({key:'Escape',preventDefault(){prevented=true;}});render();
assert(prevented);assert.equal(panel().props.hidden,true);assert.equal(triggerFocused,1,'Escape returns focus to Filters');assert(flatten(panel()).some(n=>n.type==='input'&&n.props.defaultValue==='unfinished rule'));
trigger().props.onClick();render();nodes.find(n=>n.type==='button'&&n.props.children==='Done').props.onClick();render();
assert.equal(panel().props.hidden,true);assert.equal(triggerFocused,2,'Done closes without resetting filters');
console.log('Discovery filters preserve mounted drafts, expose expansion state, focus the open panel, and return focus through Escape and Done.');
