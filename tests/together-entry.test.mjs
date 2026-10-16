import ts from 'typescript';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url);
let choice='';globalThis.__entryHooks={useId:()=> 'entry-test',useState:()=>[choice,value=>choice=value]};
const source=readFileSync('app/together-entry.tsx','utf8').replace("import {useId,useState} from 'react';",'const {useId,useState}=globalThis.__entryHooks;');
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}}).outputText.replace(/from ["']react\/jsx-runtime["']/,`from '${pathToFileURL(require.resolve('react/jsx-runtime')).href}'`);
const {default:Entry}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
function elements(node){if(!node||typeof node!=='object')return [];return [node,...React.Children.toArray(node.props?.children).flatMap(elements)];}
const circle={id:'joined',title:'Garden friends',membership:'accepted',status:'open'};
let opened,browsed=0;
const props={circles:[circle,{...circle,id:'pending',status:'pending'},{...circle,id:'requested',membership:'requested'},{...circle,id:'blocked',restricted:true}],active:true,busy:false,loading:false,failed:false,onOpen:c=>opened=c,onBrowse:()=>browsed++};
let tree=Entry(props),nodes=elements(tree);
assert.deepEqual(nodes.filter(n=>n.type==='option').map(n=>n.props.value),['','joined']);
assert(nodes.find(n=>n.type==='button').props.disabled,'requires explicit circle selection');
nodes.find(n=>n.type==='select').props.onChange({target:{value:'joined'}});
tree=Entry(props);nodes=elements(tree);assert(!nodes.find(n=>n.type==='button').props.disabled);
nodes.find(n=>n.type==='form').props.onSubmit({preventDefault(){}});assert.equal(opened,circle);
opened=null;tree=Entry({...props,circles:[]});nodes=elements(tree);assert(!nodes.some(n=>n.type==='select'));nodes.find(n=>n.type==='button').props.onClick();assert.equal(browsed,1);
for(const state of [{loading:true},{failed:true},{active:false}]){tree=Entry({...props,...state});assert(!elements(tree).some(n=>n.type==='select'),'unavailable state cannot open a circle');assert(!renderToStaticMarkup(tree).includes('Join a circle or start one'),'unavailable is not an empty membership state');}
console.log('Together entry selection, access filtering, unavailable states and browse action passed');
