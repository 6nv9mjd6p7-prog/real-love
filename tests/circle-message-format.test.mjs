import ts from 'typescript';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';

const source=readFileSync('app/circle-message-format.ts','utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText;
const {formatCircleMessageBody}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const canonical='2026-10-31T05:00:00.000Z';
const original='Activity: Read together\nStarts: '+canonical;
const formatted=formatCircleMessageBody(original);
assert.match(formatted,/Starts: .+ \(your device time\)$/,'valid generated activity times show a readable local time and timezone context');
assert(!formatted.includes(canonical),'raw ISO timestamp is hidden in the chat display');
assert(!formatCircleMessageBody(original).includes(canonical),'the same formatter can safely render a quoted reply preview');
assert.equal(formatCircleMessageBody('Starts: '+canonical), 'Starts: '+canonical,'a non-trailing Starts line is user text and remains untouched');
assert.equal(formatCircleMessageBody('Activity: Read together'), 'Activity: Read together','messages without a generated time remain unchanged');
assert.equal(formatCircleMessageBody('Activity: Read together\nStarts: 2026-02-30T05:00:00.000Z'),'Activity: Read together\nStarts: 2026-02-30T05:00:00.000Z','invalid timestamps remain untouched');
console.log('Circle chat formats only valid generated activity times for display.');
