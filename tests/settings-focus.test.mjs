import ts from 'typescript';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const source=readFileSync('app/settings-focus.ts','utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText;
const {focusSettingsDeleteTarget}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
function target(visible=true){return {focused:0,focus(){this.focused++},getClientRects(){return visible?[{}]:[]}};}
const prompt=target(),trigger=target(),summary=target();
focusSettingsDeleteTarget(true,false,{prompt,trigger,summary});assert.equal(prompt.focused,1,'opening confirmation moves focus to its warning');
focusSettingsDeleteTarget(false,true,{prompt,trigger,summary});assert.equal(trigger.focused,1,'canceling returns focus to the original trigger');
const hiddenTrigger=target(false),closedSummary=target();
focusSettingsDeleteTarget(false,true,{prompt,trigger:hiddenTrigger,summary:closedSummary});assert.equal(closedSummary.focused,1,'closing the disclosure returns focus to its summary');
const unchanged=target();focusSettingsDeleteTarget(false,false,{prompt,trigger,summary:unchanged});assert.equal(unchanged.focused,0,'initial render does not steal focus');
console.log('Settings deletion confirmation focus remains predictable when it opens, cancels, or closes.');
