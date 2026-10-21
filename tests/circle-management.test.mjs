import ts from 'typescript';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url);
let source=ts.transpileModule(readFileSync('app/circle-management.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}}).outputText;
source=source.replace(/import \{ useState, useEffect, useRef \} from ['"]react['"];?/,'const useEffect=()=>{};const useRef=initial=>({current:initial});const useState=initial=>[globalThis.circleManagementStates?.[globalThis.circleManagementIndex++]??initial,()=>{}];');
source=source.replace(/from ["']react\/jsx-runtime["']/,`from '${pathToFileURL(require.resolve('react/jsx-runtime')).href}'`);
const {default:Management,revealCircleHandover}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
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

let focused='',scrolled='';
const field={disabled:false,focus:()=>focused='select',scrollIntoView:()=>scrolled='select'};
const heading={focus:()=>focused='heading',scrollIntoView:()=>scrolled='heading'};
const root={open:false,querySelector:selector=>selector.endsWith('select')?field:heading};
revealCircleHandover(root);assert.equal(root.open,true);assert.equal(focused,'select');assert.equal(scrolled,'select');
field.disabled=true;revealCircleHandover(root);assert.equal(focused,'heading','an empty candidate list focuses the handover explanation');

// Exercise the real leave-review focus effect without rendering the full workspace.
const circlesSource=readFileSync('app/circles.tsx','utf8');
const focusStart=circlesSource.indexOf('const leaveCircleId='),focusEnd=circlesSource.indexOf('const loadGate=',focusStart);assert(focusStart>=0&&focusEnd>focusStart);
const focusSource=`export default function renderFocus({leaveCircle,leaveReview,leaveReturn,useEffect}){${circlesSource.slice(focusStart,focusEnd)}}`;
const focusJS=ts.transpileModule(focusSource,{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText;
const {default:renderFocus}=await import('data:text/javascript;base64,'+Buffer.from(focusJS).toString('base64'));
let reviewFocuses=0,returnOptions=[],focusDeps;
const opener={isConnected:true,focus:options=>returnOptions.push(options)};
const focusProps={leaveCircle:null,leaveReview:{current:{focus:()=>reviewFocuses++}},leaveReturn:{current:null},useEffect(fn,deps){if(!focusDeps||deps.some((value,i)=>!Object.is(value,focusDeps[i]))){focusDeps=deps;fn();}}};
renderFocus(focusProps);assert.equal(reviewFocuses,0);assert.equal(returnOptions.length,0,'initial closed state does not move focus');
focusProps.leaveReturn.current=opener;focusProps.leaveCircle={id:'first'};renderFocus(focusProps);assert.equal(reviewFocuses,1,'opening focuses leave review');
focusProps.leaveCircle={id:'first',title:'Refreshed'};renderFocus(focusProps);assert.equal(reviewFocuses,1,'same circle refresh never steals focus from review controls');
focusProps.leaveCircle={id:'second'};renderFocus(focusProps);assert.equal(reviewFocuses,2,'switching review circles focuses the new review');
focusProps.leaveCircle=null;renderFocus(focusProps);assert.deepEqual(returnOptions,[{preventScroll:true}]);assert.equal(focusProps.leaveReturn.current,null,'close restores the opener once and clears it');renderFocus(focusProps);assert.equal(returnOptions.length,1);
focusProps.leaveCircle={id:'first'};focusProps.leaveReturn.current={isConnected:false,focus:()=>assert.fail('removed opener must not receive focus')};renderFocus(focusProps);focusProps.leaveCircle=null;renderFocus(focusProps);assert.equal(returnOptions.length,1);
focusProps.leaveReview.current=null;focusProps.leaveCircle={id:'missing-review'};renderFocus(focusProps);
console.log('Leave-review focus opens once per circle, restores connected openers without scrolling, and tolerates missing elements.');
