import ts from 'typescript';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import React from 'react';

// These account-scoped components are direct siblings when campaigns are open.
// Duplicate keys can append a second campaign view when the parent refreshes.
const source=ts.createSourceFile('love-app.tsx',readFileSync('app/love-app.tsx','utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const names=['CollectiveAction','NotificationCenter'],nodes=new Map();
function visit(node){
 if(ts.isJsxSelfClosingElement(node)&&names.includes(node.tagName.getText(source))){
  const key=node.attributes.properties.find(p=>ts.isJsxAttribute(p)&&p.name.text==='key');
  assert(key?.initializer&&ts.isJsxExpression(key.initializer),'account view has an explicit identity');
  nodes.set(node.tagName.getText(source),key.initializer.expression.getText(source));
 }
 ts.forEachChild(node,visit);
}
visit(source);assert.equal(nodes.size,2);
const input=`export default function views(accountId){return <>${names.map(name=>'<div key={'+nodes.get(name)+'}/>').join('')}</>;}`;
const require=createRequire(import.meta.url);
const code=ts.transpileModule(input,{compilerOptions:{module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}}).outputText.replace(/from ["']react\/jsx-runtime["']/,`from '${pathToFileURL(require.resolve('react/jsx-runtime')).href}'`);
const {default:views}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const keys=account=>React.Children.toArray(views(account).props.children).map(child=>child.key);
const first=keys('member-a');
assert.equal(new Set(first).size,2,'simultaneous campaign and notification views must have distinct keys');
assert.deepEqual(keys('member-a'),first,'background parent renders keep each view identity stable');
assert(keys('member-b').every((key,i)=>key!==first[i]),'account switch resets both view identities');
console.log('Sibling account views have distinct, stable, account-isolated React keys.');
