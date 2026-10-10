import ts from 'typescript';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url);
const compile=s=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}}).outputText).toString('base64');
const modelUrl=compile(readFileSync('app/model.ts','utf8'));
const {examples,profileHasInterest}=await import(modelUrl);
const contextSource=readFileSync('app/connection-context.tsx','utf8').replace("from './model'",`from '${modelUrl}'`).replace("from 'lucide-react'",`from '${pathToFileURL(require.resolve('lucide-react')).href}'`);
const contextJs=ts.transpileModule(contextSource,{compilerOptions:{module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}}).outputText.replace(/from ["']react\/jsx-runtime["']/,`from '${pathToFileURL(require.resolve('react/jsx-runtime')).href}'`);
const contextUrl='data:text/javascript;base64,'+Buffer.from(contextJs).toString('base64');
const moduleSource=readFileSync('app/profile-view.tsx','utf8').replace("from './model'",`from '${modelUrl}'`).replace("from './connection-context'",`from '${contextUrl}'`).replace("from 'lucide-react'",`from '${pathToFileURL(require.resolve('lucide-react')).href}'`);
const js=ts.transpileModule(moduleSource,{compilerOptions:{module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}}).outputText.replace(/from ["']react\/jsx-runtime["']/,`from '${pathToFileURL(require.resolve('react/jsx-runtime')).href}'`);
const {default:View}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const html=renderToStaticMarkup(React.createElement(View,{person:examples[1],onInterest:()=>{}}));
assert(html.includes('Explore people interested in Systems thinking'),'interest actions expose descriptive names');
assert(html.includes('Ideas &amp; curiosity')&&html.includes('Growth &amp; how I relate'),'answers are separated by recognizable groups');
assert(html.indexOf('A way to connect')<html.indexOf('Ideas &amp; curiosity'),'practical connection details precede deeper answers');
const preview=renderToStaticMarkup(React.createElement(View,{person:examples[1]}));
assert(!preview.includes('<button'),'own profile preview labels do not pretend to be actions');
assert(profileHasInterest({...examples[1],interests:['  Custom topic  '],topics:[]},'custom TOPIC'),'custom interest action filters normalize case and spacing');
assert(!profileHasInterest({...examples[1],interests:['Cooking'],topics:[],about:'I used to study history.'},'History'),'interest browsing matches selected topics rather than incidental bio text');
assert(profileHasInterest({...examples[1],interests:['History'],topics:[]},'History & culture'),'broad area browsing includes its topics');
console.log('Profile grouping, interaction cues, and topic browsing checks passed');

const compared=renderToStaticMarkup(React.createElement(View,{person:examples[1],me:{...examples[1],id:'other',city:' Austin ',interests:['Systems thinking']},onInterest:()=>{}}));assert(compared.includes('Exact shared interests'));assert(compared.includes('Same entered area: Austin'));assert(compared.includes('self-reported preferences'));assert(compared.includes('shared-interest-label'));assert(!compared.includes('match percentage'));

const actionable=renderToStaticMarkup(React.createElement(View,{person:examples[1],onAnswer:()=>{}}));assert(actionable.includes('Ask about this introduction'));assert(actionable.includes('Ask about doing this together'));

const selfDescribed=renderToStaticMarkup(React.createElement(View,{person:{...examples[1],gender:'Self-described',genderDescription:'Genderfluid',background:'Yoruba'}}));assert(selfDescribed.includes('Gender: Genderfluid'));assert(selfDescribed.includes('Race or cultural background: Yoruba'));assert(selfDescribed.includes(String(examples[1].age)));const withheld=renderToStaticMarkup(React.createElement(View,{person:{...examples[1],gender:'Prefer not to say',genderDescription:'Hidden description',background:''}}));assert(withheld.includes('Gender not shared'));assert(!withheld.includes('Hidden description'));assert(!withheld.includes('Race or cultural background:'));
const confirmedArea=renderToStaticMarkup(React.createElement(View,{person:{...examples[1],locationConfirmed:true}}));assert(confirmedArea.includes('Austin, Texas, United States'));assert(confirmedArea.includes('Area confirmed recently'));assert(confirmedArea.includes('does not verify identity, residence, or exact location'));
