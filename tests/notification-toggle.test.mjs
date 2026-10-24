import ts from 'typescript';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const source=readFileSync('app/notification-toggle.tsx','utf8').replace("import {useEffect,useRef,useState} from 'react';", "const useEffect=()=>{},useRef=value=>({current:value}),useState=initial=>[globalThis.__toggleState[globalThis.__toggleIndex++],()=>{}];");
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}}).outputText.replace(/from ["']react\/jsx-runtime["']/g,`from '${new URL('../node_modules/react/jsx-runtime.js',import.meta.url).href}'`);
const {default:NotificationToggle}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
function render({muted,channel='direct',scope='all'}){globalThis.__toggleIndex=0;globalThis.__toggleState=[muted,false,'',true,0];return renderToStaticMarkup(React.createElement(NotificationToggle,{accountId:'test',channel,scope}));}
const enabled=render({muted:false});assert.match(enabled,/aria-label="Chat and request alerts"[^>]*aria-pressed="true"/);assert.match(enabled,/>Chat and request alerts<\/button><span class="notification-toggle-state" aria-hidden="true">On<\/span>/);
const muted=render({muted:true});assert.match(muted,/aria-label="Chat and request alerts"[^>]*aria-pressed="false"/);assert.match(muted,/>Chat and request alerts<\/button><span class="notification-toggle-state" aria-hidden="true">Muted<\/span>/);
for(const [channel,name] of [['reactions','Reaction alerts'],['review','Safety review alerts'],['circle','Circle alerts']])assert.match(render({muted:false,channel,scope:'all'}),new RegExp(`aria-label="${name}"[^>]*>${name}</button>`));
assert.match(render({muted:false,channel:'direct',scope:'conversation-1'}),/aria-label="Alerts for this conversation"[^>]*>Alerts for this conversation<\/button>/);
console.log('Notification toggles keep visible labels aligned with accessible names and expose current state.');
