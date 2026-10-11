import ts from 'typescript';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import React from 'react';
const require=createRequire(import.meta.url);
let slots=[],index=0;
globalThis.__ideaHooks={useState(initial){const i=index++;if(!(i in slots))slots[i]=initial;return [slots[i],v=>slots[i]=typeof v==='function'?v(slots[i]):v];}};
const source=readFileSync('app/conversation-ideas.tsx','utf8').replace("import {useState} from 'react';","const {useState}=globalThis.__ideaHooks;");
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}}).outputText.replace(/from ["']react\/jsx-runtime["']/,`from '${pathToFileURL(require.resolve('react/jsx-runtime')).href}'`);
const {default:Ideas}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
function elements(node){if(!node||typeof node!=='object')return [];return [node,...React.Children.toArray(node.props?.children).flatMap(elements)];}
let added;
function render(extra={}){index=0;return elements(Ideas({accountId:'test',draft:'My draft',onAdd:text=>added=text,starters:['What drew you to Music?'],...extra}));}
let nodes=render();
const choices=()=>nodes.filter(n=>n.props.className==='prompt-choice');
assert.equal(choices().length,6,'everyday prompts are the default');
assert(choices().some(n=>n.props.children[0].props.children==='Music'));
choices()[0].props.onClick();assert.equal(added,'What song have you had on repeat lately?','only adds selected wording through the draft callback');
for(const [category,count] of [['Starting points',1],['Go deeper',3],['Communicate',6]]){
 nodes.find(n=>n.type==='button'&&n.props.children===category).props.onClick();nodes=render();
 assert.equal(choices().length,count);assert(nodes.some(n=>n.props['aria-pressed']===true&&n.props.children===category));
 if(category==='Communicate')assert(choices().some(n=>n.props.children[0].props.children==='Set a boundary'),'boundary tools remain available in Communicate');
}
nodes=render({disabled:true});assert(choices().every(n=>n.props.disabled),'offline or busy state prevents adding prompts');
nodes=render({draft:'x'.repeat(1500)});assert(choices().every(n=>n.props.disabled),'message limit is respected');
nodes.find(n=>n.type==='button'&&n.props.children==='Starting points').props.onClick();nodes=render({starters:[]});
assert.equal(choices().length,6,'removed personalized starters fall back to everyday ideas');
assert(choices().every(n=>n.props.type==='button'),'prompt actions never submit a surrounding form');
console.log('Everyday defaults, category selection, draft-only actions, message limits and unavailable-state guards passed.');
