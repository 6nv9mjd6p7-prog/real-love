import ts from 'typescript';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url);
function compile(source){let code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}}).outputText;for(const module of ['react','react/jsx-runtime'])code=code.replaceAll(`from "${module}"`,`from '${pathToFileURL(require.resolve(module)).href}'`).replaceAll(`from '${module}'`,`from '${pathToFileURL(require.resolve(module)).href}'`);return 'data:text/javascript;base64,'+Buffer.from(code).toString('base64');}
const toggle=compile(readFileSync('app/notification-toggle.tsx','utf8')),gate=compile(readFileSync('app/request-gate.ts','utf8')),device=compile(readFileSync('app/device-notifications.ts','utf8')),filters=compile(readFileSync('app/notification-filters.ts','utf8'));
const source=readFileSync('app/notification-center.tsx','utf8').replace("from './notification-toggle'",`from '${toggle}'`).replace("from './request-gate'",`from '${gate}'`).replace("from './device-notifications'",`from '${device}'`).replace("from './notification-filters'",`from '${filters}'`).replace("import {Capacitor} from '@capacitor/core';",'const Capacitor={isNativePlatform:()=>globalThis.__native};').replace("import {useNativeApp} from './use-native-app';",'const useNativeApp=()=>globalThis.__native;');
const {default:Center}=await import(compile(source));
for(const native of [false,true]){globalThis.__native=native;const html=renderToStaticMarkup(React.createElement(Center,{accountId:'test',open:true,onUnread:()=>{},onNavigate:()=>{}}));assert(html.indexOf('Recent activity')<html.indexOf('notification-preferences'),'activity precedes setup on both platforms');assert(!html.includes('<details open'),'setup begins collapsed');assert.match(html,/Activity alert preferences/);assert.equal((html.match(/Recent activity/g)||[]).length,1);if(native)assert.match(html,/Phone alerts · not yet available/);else assert.match(html,/Phone &amp; browser alerts/);}
console.log('Web and native activity-first notification layouts and collapsed preference controls passed (render tests).');

// Render the actual pending-invitation controls without a network or role change.
const invitationSource=source.replace("import {useCallback,useEffect,useRef,useState,useLayoutEffect,useSyncExternalStore} from 'react';", "import {useRef,useSyncExternalStore} from 'react';const useCallback=fn=>fn;const useEffect=()=>{},useLayoutEffect=()=>{};const useState=initial=>[Array.isArray(initial)&&++globalThis.__arrayState===2?[{id:'pending-role',expires:'2099-01-01T00:00:00Z'}]:initial,()=>{}];");
const {default:InvitedCenter}=await import(compile(invitationSource));
globalThis.__arrayState=0;globalThis.__native=false;
const invited=renderToStaticMarkup(React.createElement(InvitedCenter,{accountId:'test',open:true,onUnread:()=>{},onNavigate:()=>{}}));
assert(invited.includes('Accept reviewer role')&&invited.includes('Decline'));
assert(invited.includes('Declining does not affect your membership'));
assert(invited.indexOf('Reviewer invitation')<invited.indexOf('Recent activity'),'an actionable role request is immediately visible');
assert(invited.includes('cannot browse unrestricted private chats or manage reviewer roles'),'scope of the role is explained before consent');
delete globalThis.__arrayState;
console.log('Pending reviewer invitation displays acceptance, decline, expiry and responsibility copy.');

const groupedSource=source.replace("import {useCallback,useEffect,useRef,useState,useLayoutEffect,useSyncExternalStore} from 'react';", "import {useRef,useSyncExternalStore} from 'react';const useCallback=fn=>fn;const useEffect=()=>{},useLayoutEffect=()=>{};const useState=initial=>{const i=globalThis.__groupState++;return [i===0?globalThis.__groupItems:i===7?false:initial,()=>{}];};");
const {default:GroupedCenter}=await import(compile(groupedSource));
globalThis.__groupState=0;globalThis.__groupItems=[{id:'new',kind:'message',url:'#chat/a',title:'Maya sent you a message',created:'2026-10-18T12:00:00Z',read:0,detail:'Private conversation with Maya'},{id:'old',kind:'message',url:'#chat/a',title:'Maya sent you a voice note',created:'2026-10-17T12:00:00Z',read:1,detail:'Private conversation with Maya'}];
const groupedHtml=renderToStaticMarkup(React.createElement(GroupedCenter,{accountId:'test',open:true,onUnread:()=>{},onNavigate:()=>{}}));
assert(groupedHtml.includes('2 message alerts')&&groupedHtml.includes('1 unread'));
assert(groupedHtml.includes('Maya sent you a voice note')&&groupedHtml.includes('Latest: Maya sent you a message'),'individual events and latest context remain available');
assert(groupedHtml.includes('<details class="notification-message-group">'),'message groups begin collapsed with native keyboard disclosure');
assert.equal((groupedHtml.match(/class="notification-open"/g)||[]).length,2,'each event retains its original open action');
delete globalThis.__groupState;delete globalThis.__groupItems;
