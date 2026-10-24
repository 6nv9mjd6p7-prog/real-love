import ts from 'typescript';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const compiled=ts.transpileModule(readFileSync('app/sample-conversation-tools.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText;
const {sampleReplyFor}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
assert.equal(sampleReplyFor('any message',1),'That is a thoughtful question. I think a group can stay accountable when expectations are clear, decisions are open to discussion, and people can raise concerns without being punished.');
assert.equal(sampleReplyFor('another message',2),'I like that distinction. Maybe accountability works best when it includes a way to repair harm and revisit the rules together, instead of relying on one person to police everyone.');
assert.equal(sampleReplyFor('continue',4),sampleReplyFor('continue',1),'sample replies cycle predictably for repeatable local testing');
console.log('Fictional conversation replies are deterministic and remain local');
