import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';

const require=createRequire(import.meta.url);
const source=readFileSync('app/auth/sign-in.tsx','utf8').replace(
  "import {useEffect,useRef,useState} from 'react';",
  "const useEffect=()=>{},useRef=value=>({current:value}),useState=initial=>[globalThis.__authState[globalThis.__authIndex++]??initial,()=>{}];"
);
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}}).outputText.replace(
  /from ["']react\/jsx-runtime["']/,
  `from '${pathToFileURL(require.resolve('react/jsx-runtime')).href}'`
);
const {default:EmailSignIn}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));

function render(resendAt){
  globalThis.__authIndex=0;
  globalThis.__authState=['person@example.com','123456',true,false,'','',resendAt,0,'send'];
  return renderToStaticMarkup(React.createElement(EmailSignIn,{legacy:null}));
}

const waiting=render(60000);
assert.match(waiting,/<p class="sr-only" role="status" aria-live="polite" aria-atomic="true"><\/p>/,'the cooldown has a quiet, initially empty status region');
assert.match(waiting,/<button[^>]*disabled="">Resend in 60s<\/button>/,'resend remains disabled while the cooldown is active');

const ready=render(0);
assert.match(ready,/<p class="sr-only" role="status" aria-live="polite" aria-atomic="true">You can request another code now\.<\/p>/,'screen readers are told once when resend becomes available');
assert.match(ready,/<button[^>]*>Send another code<\/button>/,'the resend action becomes available at the end of the cooldown');
console.log('Email sign-in announces when the resend cooldown ends without announcing every second.');
