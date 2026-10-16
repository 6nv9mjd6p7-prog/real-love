import ts from 'typescript';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url);
function compile(source){return 'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}}).outputText.replace(/from ["']react\/jsx-runtime["']/,`from '${pathToFileURL(require.resolve('react/jsx-runtime')).href}'`)).toString('base64');}
const location=compile(readFileSync('app/location.ts','utf8'));
const {CircleAreaProposal, CircleAreaFilter}=await import(compile(readFileSync('app/circle-area-controls.tsx','utf8').replace("from './location'",`from '${location}'`)));
function elements(node){if(!node||typeof node!=='object')return [];return [node,...React.Children.toArray(node.props?.children).flatMap(elements)];}
const area={city:'Austin',region:'Texas',country:'United States'};
let value=false;const change=v=>value=v;
let tree=CircleAreaProposal({area,checked:false,disabled:false,onChange:change}),nodes=elements(tree);
assert.equal(nodes.find(n=>n.type==='input').props.checked,false,'sharing never defaults on');
nodes.find(n=>n.type==='input').props.onChange({target:{checked:true}});assert.equal(value,true);
assert(renderToStaticMarkup(tree).includes('The other founder reviews this area'));
assert(!elements(CircleAreaProposal({area:null,checked:false,disabled:false,onChange:change})).some(n=>n.type==='input'),'incomplete profile does not offer disclosure');
tree=CircleAreaFilter({area,value:false,disabled:false,onChange:change});nodes=elements(tree);
assert.equal(nodes.find(n=>n.type==='select').props.value,'any');
nodes.find(n=>n.type==='select').props.onChange({target:{value:'mine'}});assert.equal(value,true);
tree=CircleAreaFilter({area:null,value:true,disabled:false,onChange:change});nodes=elements(tree);
assert.equal(nodes.find(n=>n.type==='select').props.value,'any');assert(nodes.find(n=>n.type==='option'&&n.props.value==='mine').props.disabled);
console.log('Circle area disclosure is optional, explicit and reviewable; filtering starts at Any area and handles missing profile areas.');
