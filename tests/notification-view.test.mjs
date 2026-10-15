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
