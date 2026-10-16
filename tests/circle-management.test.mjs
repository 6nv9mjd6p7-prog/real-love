import ts from 'typescript';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url);
let source=ts.transpileModule(readFileSync('app/circle-management.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}}).outputText;
source=source.replace(/import \{ useState, useEffect \} from ['"]react['"];?/,'const useEffect=()=>{};const useState=initial=>[globalThis.circleManagementStates?.[globalThis.circleManagementIndex++]??initial,()=>{}];');
source=source.replace(/from ["']react\/jsx-runtime["']/,`from '${pathToFileURL(require.resolve('react/jsx-runtime')).href}'`);
const {default:Management}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const circle={id:'circle',title:'Fixed title',description:'Original circle purpose.',activity:'Original next activity.',role:'host',hostCount:1};
const members=[{id:'host',name:'Host',role:'host',status:'accepted',mine:true},{id:'member',name:'Member',role:'member',status:'accepted'},{id:'request',name:'Applicant',role:'member',status:'requested'}];
function tree(c=circle,states){globalThis.circleManagementIndex=0;globalThis.circleManagementStates=states;return Management({circle:c,members,disabled:false,onAction:async(data)=>{globalThis.managementAction=data;return true;}});}
function nodes(node){return !node||typeof node!=='object'?[]:[node,...React.Children.toArray(node.props?.children).flatMap(nodes)];}
let html=renderToStaticMarkup(tree());assert(html.includes('Choose a co-host'));assert(html.includes('Member</option>'));assert(!html.includes('Applicant</option>'));assert(!html.includes('name="title"'));
const edited=nodes(tree(circle,[{description:circle.description,activity:circle.activity},'Updated circle purpose.','Updated next activity.','member']));
await edited.find(n=>n.type==='form'&&n.props.className==='circle-edit-form').props.onSubmit({preventDefault(){}});
assert.deepEqual(globalThis.managementAction,{action:'update_circle',circle:'circle',description:'Updated circle purpose.',activity:'Updated next activity.',expectedDescription:circle.description,expectedActivity:circle.activity});
await edited.find(n=>n.type==='form'&&n.props.className.includes('circle-handover')).props.onSubmit({preventDefault(){}});assert.equal(globalThis.managementAction.action,'invite_host');assert.equal(globalThis.managementAction.target,'member');
assert.equal(tree({...circle,role:'member',hostInvitation:false}),null);
const invitation=nodes(tree({...circle,role:'member',hostInvitation:true}));
await invitation.find(n=>n.type==='button'&&n.props.children==='Accept co-host role').props.onClick();assert.equal(globalThis.managementAction.action,'accept_host');
await invitation.find(n=>n.type==='button'&&n.props.children==='Decline').props.onClick();assert.equal(globalThis.managementAction.action,'decline_host');
delete globalThis.circleManagementStates;delete globalThis.circleManagementIndex;delete globalThis.managementAction;
console.log('Circle edit payloads, current-member handover choices, explicit co-host consent and member-only visibility passed.');
