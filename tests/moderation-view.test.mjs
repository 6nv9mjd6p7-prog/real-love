import ts from 'typescript';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url);
let source=ts.transpileModule(readFileSync('app/moderation.tsx','utf8').replace("import OwnerMetrics from './owner-metrics';","const OwnerMetrics=()=>null;"),{compilerOptions:{module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}}).outputText;
source=source.replace(/import \{ useState, useEffect \} from ['"]react['"];?/,'const useEffect=()=>{}; const useState=initial=>[globalThis.reviewStates[globalThis.reviewIndex++]??initial,()=>{}];');
source=source.replace(/from ["']react\/jsx-runtime["']/,`from '${pathToFileURL(require.resolve('react/jsx-runtime')).href}'`);
const {default:Review}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const data={owner:true,admissions:[{id:'applicant',name:'Applicant',age:25}],cases:[],moderators:[],photos:[]};
function render(confirmed,reason){globalThis.reviewIndex=0;globalThis.reviewStates=[data,'',false,'','',confirmed?'applicant':'',false,'',{applicant:reason}];return renderToStaticMarkup(React.createElement(Review,{accountId:'owner'}));}
function approvalDisabled(html){const button=html.match(/<button[^>]*>Approve member<\/button>/)?.[0];assert(button);return button.includes('disabled');}
assert(approvalDisabled(render(false,'')));
assert(approvalDisabled(render(true,'yes')));
assert(approvalDisabled(render(false,'Checks completed')));
const ready=render(true,'Checks completed');assert(!approvalDisabled(ready));
assert(ready.includes('Ready to approve this member.'));
assert(ready.includes('Reason for approving Applicant'));
assert(ready.indexOf('Profiles awaiting approval')<ready.indexOf('Reason for a report or reviewer action'));
assert(render(true,'yes').includes('at least 5 characters'));
delete globalThis.reviewStates;delete globalThis.reviewIndex;
console.log('Admission controls explain requirements and enable only after confirmation plus a valid applicant-specific reason');
