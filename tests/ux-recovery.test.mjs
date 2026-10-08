import ts from 'typescript';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import React from 'react';
const require=createRequire(import.meta.url);
let hooks=[],index=0,cleanups=[];
globalThis.__uxState=()=>({hooks,index:index++,cleanups});
const fake=`const useState=x=>{const {hooks,index}=globalThis.__uxState();if(!(index in hooks))hooks[index]=x;return [hooks[index],v=>hooks[index]=typeof v==='function'?v(hooks[index]):v];};const useRef=x=>{const {hooks,index}=globalThis.__uxState();return hooks[index]??(hooks[index]={current:x});};const useEffect=fn=>{const {hooks,index,cleanups}=globalThis.__uxState();if(!hooks[index]){hooks[index]=true;cleanups.push(fn());}};`;
function compile(file,transform=x=>x){let source=transform(readFileSync(file,'utf8')).replace(/import \{useEffect,useRef,useState\} from 'react';/,fake);return 'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}}).outputText.replace(/from ["']react\/jsx-runtime["']/,`from '${pathToFileURL(require.resolve('react/jsx-runtime')).href}'`).replace(/from ["']lucide-react["']/,`from '${pathToFileURL(require.resolve('lucide-react')).href}'`)).toString('base64');}
function nodes(n){return !n||typeof n!=='object'?[]:[n,...React.Children.toArray(n.props?.children).flatMap(nodes)];}
const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
const {default:Toggle}=await import(compile('app/notification-toggle.tsx'));
let failSave=true,saves=[];const realFetch=globalThis.fetch;
globalThis.fetch=async(url,options)=>{if(!options?.body)return Response.json({accountId:'alice',mutedScopes:[]});saves.push(JSON.parse(options.body));return failSave?Response.json({error:'Temporary failure'},{status:503}):Response.json({ok:true});};
const toggle=()=>{index=0;return nodes(Toggle({accountId:'alice',scope:'chat'}));};
toggle();await flush();let primary=toggle().find(n=>n.type==='button');assert(!primary.props.disabled);await primary.props.onClick();assert(toggle().some(n=>n.props.role==='alert'));const retry=toggle().find(n=>n.type==='button'&&n.props.children==='Retry alert settings');assert(retry);assert(!toggle().find(n=>n.type==='button').props.disabled,'failure does not lock out the control');failSave=false;await retry.props.onClick();assert(toggle().some(n=>n.type==='button'&&n.props.children==='Unmute this conversation'));assert(saves.every(s=>s.muted===true),'retry saves the same intended setting');
for(const cleanup of cleanups)cleanup?.();hooks=[];index=0;cleanups=[];
const chatTools=compile('app/chat-tools.ts');const {default:Bubble}=await import(compile('app/chat-bubble.tsx',s=>s.replace("from './chat-tools'",`from '${chatTools}'`)));
const bubble=()=>{index=0;return nodes(Bubble({message:{id:'voice',body:'Voice note',created:'2026-01-01T00:00:00Z',mine:false,audio:{duration:2000,url:'/api/voice?message=voice'}},name:'Friend',onReply(){},onReact(){}}));};
const audio=bubble().find(n=>n.type==='audio');audio.props.onError();assert(bubble().some(n=>n.props.role==='alert'));let loaded=0;audio.props.ref.current={load(){loaded++;}};bubble().find(n=>n.type==='button'&&n.props.children==='Retry playback').props.onClick();assert.equal(loaded,1);audio.props.onCanPlay();assert(bubble().some(n=>n.props.role==='status'&&n.props.children==='Ready to play'));
globalThis.fetch=realFetch;for(const cleanup of cleanups)cleanup?.();delete globalThis.__uxState;
console.log('Mute recovery and voice playback error/retry/ready states passed (lifecycle tests; not browser QA).');
