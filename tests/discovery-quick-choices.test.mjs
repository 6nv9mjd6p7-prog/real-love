import ts from 'typescript';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import React from 'react';
const require=createRequire(import.meta.url);
const code=ts.transpileModule(readFileSync('app/discovery-quick-choices.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}}).outputText.replace(/from ["']react\/jsx-runtime["']/,`from '${pathToFileURL(require.resolve('react/jsx-runtime')).href}'`);
const {default:Choices}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
function flatten(node){return !node||typeof node!=='object'?[]:[node,...React.Children.toArray(node.props?.children).flatMap(flatten)];}
let shared=false,location='any';
function render(onlineAvailable=true){return flatten(Choices({shared,location,onlineAvailable,onShared:()=>shared=!shared,onLocation:value=>location=value,children:React.createElement('span',null,'All original interest choices')}));}
function button(label){return render().find(n=>n.type==='button'&&n.props.children===label);}
assert.equal(button('Shared interests').props['aria-pressed'],false);
button('Shared interests').props.onClick();assert.equal(button('Shared interests').props['aria-pressed'],true);
button('Nearby').props.onClick();assert.equal(location,'local');assert(shared,'nearby preserves shared-interest choice');
button('Online-friendly').props.onClick();assert.equal(location,'online');assert.equal(button('Nearby').props['aria-pressed'],false);
button('Online-friendly').props.onClick();assert.equal(location,'any','selected location toggles back to the existing combined mode');
button('Nearby').props.onClick();button('Nearby').props.onClick();assert.equal(location,'any');
assert.equal(render(false).find(n=>n.type==='button'&&n.props.children==='Online-friendly').props.disabled,true,'online preference remains required');
assert(render(false).some(n=>n.type==='p'&&n.props.children.includes('enable online connections')));
const disclosure=render().find(n=>n.type==='details');assert(!disclosure.props.open,'specific topics start collapsed');
assert(flatten(disclosure).some(n=>n.props?.children==='All original interest choices'),'all interests remain mounted and accessible');
const app=readFileSync('app/love-app.tsx','utf8');
assert(app.includes("route==='discover'&&me&&<DiscoveryQuickChoices"),'quick choices do not alter Saved or the demo');
assert(app.includes('onLocation={setLocationFilter}'),'quick location choices use the existing preference field');
assert(app.includes("onShared={()=>setInterestMode(interestMode==='mine'?'any':'mine')}"),'shared choice changes only the interest mode');
assert(app.includes('<DiscoveryDetails value={profileFilters}'),'advanced filters remain available');
console.log('Quick discovery choices share existing preferences, preserve independent rules, enforce online eligibility, and disclose all interest topics.');
