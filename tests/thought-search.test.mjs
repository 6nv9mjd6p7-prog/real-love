import ts from 'typescript';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const code=ts.transpileModule(readFileSync('app/thought-search.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText;
const {termsFromThought,thoughtKeywordScore}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
assert.deepEqual(termsFromThought('AI and art'),['ai','art'],'short meaningful topics can be searched');
assert.deepEqual(termsFromThought('What do you think about this?'),[],'common words do not trigger an unrelated search');
assert.deepEqual(termsFromThought('CAFÉ café Culture'),['cafe','culture'],'accents and case normalize like profile search');
assert.deepEqual(termsFromThought('art art history community culture music reading'),['art','history','community','culture','music'],'keywords are distinct and capped at five');
assert.deepEqual(termsFromThought('a ! ?'),[]);
console.log('Thought search handles short topics, common words, accents, deduplication, and its keyword limit.');

assert.equal(thoughtKeywordScore('faith, part, moment',['ai','art','men']),0);
assert.equal(thoughtKeywordScore('AI, art and men',['ai','art','men']),3);
assert.equal(thoughtKeywordScore('Café culture',['cafe']),1);
