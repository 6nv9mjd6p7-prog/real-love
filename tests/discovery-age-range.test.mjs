import ts from 'typescript';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import React from 'react';
const require=createRequire(import.meta.url);let slots=[],index=0,applied=[];
globalThis.__ageHooks={useState:x=>{const i=index++;if(!(i in slots))slots[i]=x;return[slots[i],v=>slots[i]=v];},useEffect:()=>{},useId:()=> 'age-help'};
const source=readFileSync('app/discovery-age-range.tsx','utf8').replace("import {useEffect,useId,useState} from 'react';",'const {useEffect,useId,useState}=globalThis.__ageHooks;');
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}}).outputText.replace(/from ["']react\/jsx-runtime["']/g,`from '${pathToFileURL(require.resolve('react/jsx-runtime')).href}'`);
const {default:Age}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const nodes=n=>!n||typeof n!=='object'?[]:[n,...React.Children.toArray(n.props?.children).flatMap(nodes)];
function inputs(){index=0;return nodes(Age({min:18,max:99,onChange:(min,max)=>applied.push([min,max])})).filter(n=>n.type==='input');}
inputs()[0].props.onChange({target:{value:'2'}});assert.equal(inputs()[0].props.value,'2');assert.equal(applied.length,0,'typing does not prematurely clamp a partial age');inputs()[0].props.onChange({target:{value:'25'}});inputs()[0].props.onBlur({target:{value:'25'}});assert.deepEqual(applied.pop(),[25,99]);
inputs()[1].props.onBlur({target:{value:'120'}});assert.deepEqual(applied.pop(),[18,99]);
inputs()[0].props.onBlur({target:{value:''}});assert.equal(inputs()[0].props.value,'18','empty input returns to the saved valid age');
let prevented=false;inputs()[0].props.onKeyDown({key:'Enter',currentTarget:{value:'30'},preventDefault:()=>prevented=true});assert(prevented);assert.deepEqual(applied.pop(),[30,99]);
delete globalThis.__ageHooks;
console.log('Age filters allow complete typing, apply on blur or Enter, clamp bounds, and recover empty inputs.');
