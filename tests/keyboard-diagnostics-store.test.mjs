import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

const source=readFileSync('app/keyboard-diagnostics-store.ts','utf8');
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const store=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));

// SSR stays disabled without accessing browser globals; hydration reads the real setting.
assert.equal(store.keyboardDiagnosticsServerSnapshot(),false);
const priorWindow=globalThis.window,priorStorage=globalThis.sessionStorage;
const events=new EventTarget();
events.location={search:''};
let saved=null,blocked=false;
globalThis.window=events;
globalThis.sessionStorage={getItem(){if(blocked)throw Error('Storage unavailable');return saved;}};
try {
  assert.equal(store.keyboardDiagnosticsEnabled(),false);
  saved='1';assert.equal(store.keyboardDiagnosticsEnabled(),true,'saved native diagnostics survive remounts');
  saved=null;events.location.search='?keyboardDebug=1';
  assert.equal(store.keyboardDiagnosticsEnabled(),true,'the browser debug URL enables the diagnostic notice');
  events.location.search='';blocked=true;
  assert.equal(store.keyboardDiagnosticsEnabled(),false,'blocked storage does not crash ordinary visitors');
  let updates=0;
  const unsubscribe=store.subscribeKeyboardDiagnostics(()=>updates++);
  const toggle=enabled=>events.dispatchEvent(new CustomEvent('real-love-keyboard-diagnostics-toggle',{detail:{enabled}}));
  toggle(true);assert.equal(updates,1);assert.equal(store.keyboardDiagnosticsEnabled(),true);
  events.location.search='?keyboardDebug=1';toggle(false);
  assert.equal(store.keyboardDiagnosticsEnabled(),false,'an explicit disable takes effect even with the debug URL');
  unsubscribe();toggle(true);assert.equal(updates,2,'unmounted diagnostics stop receiving events');
} finally {
  if(priorWindow===undefined)delete globalThis.window;else globalThis.window=priorWindow;
  if(priorStorage===undefined)delete globalThis.sessionStorage;else globalThis.sessionStorage=priorStorage;
}
console.log('Diagnostics hydration, saved settings, debug URLs, unavailable storage, toggles and cleanup passed.');
