import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFileSync} from 'node:fs';

const source=ts.transpileModule(readFileSync('app/voice-focus.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {voiceFocusTarget}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
assert.equal(voiceFocusTarget('requesting',true),'cancel');
assert.equal(voiceFocusTarget('recording',true),'stop');
assert.equal(voiceFocusTarget('finishing',true),'status');
assert.equal(voiceFocusTarget('preview',true),'status');
assert.equal(voiceFocusTarget('sending',true),'status');
assert.equal(voiceFocusTarget('idle',true),'start');
assert.equal(voiceFocusTarget('recording',false),null,'pointer interaction does not steal focus');
console.log('Keyboard-initiated voice recorder transitions retain a useful focus target without moving pointer focus.');
