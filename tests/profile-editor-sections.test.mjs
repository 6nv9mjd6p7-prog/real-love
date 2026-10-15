import ts from 'typescript';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url);
const url=name=>pathToFileURL(require.resolve(name)).href;
const compile=source=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}}).outputText.replace(/from ["']react\/jsx-runtime["']/g,`from '${url('react/jsx-runtime')}'`)).toString('base64');
const model=compile(readFileSync('app/model.ts','utf8'));
const draft=compile(readFileSync('app/profile-draft.ts','utf8').replace("from './model'",`from '${model}'`));
const sections=compile(readFileSync('app/profile-sections.tsx','utf8'));
const stub=compile('export default function Stub(){return null;}');
let source=readFileSync('app/profile-editor.tsx','utf8').replace("from 'react'",`from '${url('react')}'`).replace("from './model'",`from '${model}'`).replace("from './profile-draft'",`from '${draft}'`).replace("from './profile-sections'",`from '${sections}'`).replace("from './guidelines'",`from '${stub}'`).replace("from './location-editor'",`from '${stub}'`).replace('useState(me?(consent?0:3):profileResumeStep(form))','useState(globalThis.__profileStep??(me?(consent?0:3):1))');
const {default:Editor}=await import(compile(source));
const {default:Sections}=await import(sections);
const {examples}=await import(model);
const form={...examples[1],birthDate:'1996-01-01',communication:[],communicationNote:''};
const props={accountId:'test',form,setForm:()=>{},me:{...form,photoUploaded:true},consent:true,setConsent:()=>{},busy:false,onSave:async()=>{},onPreview:()=>{},changed:false,photoSetup:React.createElement('section',null,'PHOTO MANAGEMENT')};
globalThis.__profileStep=0;
let html=renderToStaticMarkup(React.createElement(Editor,props));
assert(html.includes('Your profile at a glance'));assert(html.includes('Preview my profile'));assert(html.includes('Photo uploaded'));
assert(!html.includes('PHOTO MANAGEMENT'),'overview does not mount photo management');
globalThis.__profileStep=5;
html=renderToStaticMarkup(React.createElement(Editor,props));
assert(html.includes('PHOTO MANAGEMENT'));assert(!html.includes('Save changes'),'photo actions are separate from profile save');
globalThis.__profileStep=3;
html=renderToStaticMarkup(React.createElement(Editor,props));
assert(!html.includes('How I communicate'),'returning users edit communication in one place');
html=renderToStaticMarkup(React.createElement(Editor,{...props,me:null}));
assert(html.includes('How I communicate'),'signup retains optional communication controls');
assert(html.includes('PHOTO MANAGEMENT'),'signup photo remains optional at the final step');
assert(html.indexOf('Give someone a way to say hello')<html.indexOf('Privacy and agreement'));
assert(html.indexOf('Privacy and agreement')<html.indexOf('Add more to your profile (optional)'),'required agreement precedes optional extras');
assert(html.indexOf('Add more to your profile (optional)')<html.indexOf('How I communicate'));
assert(html.includes('You can skip these and save your profile now.'));
assert(!html.includes('<details open="" class="signup-optional'),'optional extras begin collapsed');
globalThis.__profileStep=1;
const basics=renderToStaticMarkup(React.createElement(Editor,{...props,me:null}));
assert(basics.indexOf('Date of birth (private, 18+ required)')<basics.indexOf('Identity details (optional)'));
assert(basics.includes('They are not required to continue.'));
assert(basics.includes('Everything else can wait.'));
assert(!basics.includes('<details open="" class="signup-optional'),'optional identity begins collapsed');
let chosen,previewed=false;
const tree=Sections({form,photoUploaded:false,busy:false,changed:true,onPreview:()=>previewed=true,onChoose:n=>chosen=n});
tree.props.children[0].props.children[2].props.onClick();assert(previewed);
const cards=tree.props.children[1].props.children;
cards.forEach((card,i)=>{card.props.onClick();assert.equal(chosen,i+1);assert.equal(card.props.type,'button');});
const disabled=Sections({form,photoUploaded:false,busy:true,changed:false,onPreview:()=>{},onChoose:()=>{}});
assert(disabled.props.children[1].props.children.every(card=>card.props.disabled));
const interactive=source.replace(/import \{useState,useEffect,useRef,type ReactNode\} from '[^']+';/,"const useState=initial=>[initial,()=>{}],useEffect=()=>{},useRef=initial=>({current:initial});");
const {default:ProgressEditor}=await import(compile(interactive));
const progress=[];let saved=0;
for(const step of [1,2]){globalThis.__profileStep=step;const tree=ProgressEditor({...props,me:null,onProgress:n=>progress.push(n),onSave:async()=>saved++});await tree.props.onSubmit({preventDefault(){}});}
assert.deepEqual(progress,[1,2],'valid Continue actions emit completed signup steps');assert.equal(saved,0);
globalThis.__profileStep=1;await ProgressEditor({...props,me:null,form:{...form,name:''},onProgress:n=>progress.push(n)}).props.onSubmit({preventDefault(){}});assert.deepEqual(progress,[1,2],'invalid fields do not emit completion');
await ProgressEditor({...props,onProgress:n=>progress.push(n),onSave:async()=>saved++}).props.onSubmit({preventDefault(){}});assert.deepEqual(progress,[1,2],'returning profile edits do not emit signup completion');assert.equal(saved,1);
console.log('Profile overview, section destinations, dedicated photos, save separation, and signup communication passed (render checks).');

for(const step of [0,1,2,3,4,5]){globalThis.__profileStep=step;const dirty=renderToStaticMarkup(React.createElement(Editor,{...props,changed:true}));assert(dirty.includes('profile-save-bar'));assert(dirty.includes('Save changes'));assert(dirty.includes('Unsaved profile answers'));}

// A typed replacement must be selected before either a first-time or existing profile can save.
let state=[],index=0;globalThis.__pendingLocation={useState:x=>{const i=index++;if(!(i in state))state[i]=x;return [state[i],v=>state[i]=typeof v==='function'?v(state[i]):v];},useRef:x=>({current:x})};
const pendingSource=source.replace(/import \{useState,useEffect,useRef,type ReactNode\} from '[^']+';/,"const {useState,useRef}=globalThis.__pendingLocation;const useEffect=()=>{};");
const {default:PendingEditor}=await import(compile(pendingSource));
function elements(n){return !n||typeof n!=='object'?[]:[n,...React.Children.toArray(n.props?.children).flatMap(elements)];}
let saves=0;globalThis.__profileStep=1;
const pendingProps={...props,changed:true,onSave:async()=>saves++};
function pendingForm(){index=0;return PendingEditor(pendingProps);}
elements(pendingForm()).find(n=>n.props.onPendingChange).props.onPendingChange(true);
await pendingForm().props.onSubmit({preventDefault(){}});assert.equal(saves,0);assert(elements(pendingForm()).some(n=>String(n.props.children).includes('Choose the matching location suggestion before saving')));
elements(pendingForm()).find(n=>n.props.onPendingChange).props.onPendingChange(false);await pendingForm().props.onSubmit({preventDefault(){}});assert.equal(saves,1);
delete globalThis.__pendingLocation;
