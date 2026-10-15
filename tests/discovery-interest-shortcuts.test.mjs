import ts from 'typescript';
import assert from 'node:assert/strict';
import React from 'react';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {renderToStaticMarkup} from 'react-dom/server';

const require=createRequire(import.meta.url);
const source=ts.transpileModule((await import('node:fs')).readFileSync('app/discovery-interest-shortcuts.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}}).outputText.replace(/from ["']react\/jsx-runtime["']/,`from '${pathToFileURL(require.resolve('react/jsx-runtime')).href}'`);
const {default:Shortcuts}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const html=renderToStaticMarkup(React.createElement(Shortcuts,{interests:['History','Music'],active:'Music',onChoose:()=>{}}));
assert(html.includes('Your interests'),'the shortcuts are clearly introduced');
assert(html.includes('aria-pressed="true">Music</button>'),'the active interest exposes its selected state');
assert(html.includes('aria-pressed="false">History</button>'),'inactive interests are selectable without appearing selected');
assert.equal(Shortcuts({interests:[],active:'',onChoose:()=>{}}),null,'no empty quick-filter row is shown');
console.log('Discovery interest shortcuts render clearly and expose selection state');
