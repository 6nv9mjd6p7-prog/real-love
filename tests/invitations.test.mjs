import ts from 'typescript';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const compile=s=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText).toString('base64');
const modelUrl=compile(readFileSync('app/model.ts','utf8'));
const {examples}=await import(modelUrl);
const {invitationContexts,invitationOpening,invitationStatus}=await import(compile(readFileSync('app/invitations.ts','utf8').replace("from './model'",`from '${modelUrl}'`)));
const contexts=invitationContexts({...examples[1],connectionBoundary:'Friendship only',interests:['History','History'],about:'Public introduction',question:'',topics:[]});
assert.equal(contexts.filter(x=>x.key==='interest:History').length,1);assert(contexts.some(x=>x.key==='about'&&x.text==='Public introduction'));assert(!contexts.some(x=>['connectionBoundary','minAge','expectation','question','photoKey'].includes(x.key)));
const rich=invitationContexts({...examples[1],interests:[],question:'Why do people become tribal?',perspective:'Systems shape behavior.',care:'Understanding people matters.',firstStep:'Go to a lecture.',topics:[]});assert(rich.findIndex(x=>x.key==='question')<rich.findIndex(x=>x.key==='firstStep'),'intellectual context appears before optional activities');
assert.equal(invitationOpening({key:'question',label:'A question I carry',text:'Why do people become tribal?'}),'What makes that question interesting to you?');
assert.equal(invitationOpening({key:'interest:History',label:'Interest',text:'History'}),'What got you interested in History?');
for(const incoming of [true,false]){assert.equal(invitationStatus({status:'closed',incoming}),'Closed');assert.equal(invitationStatus({status:'accepted',incoming}),'Accepted');assert.equal(invitationStatus({status:'closed',incoming,closure_kind:'ended'}),'Connection ended');}
assert.equal(invitationStatus({status:'pending',incoming:true}),'Awaiting your response');assert.equal(invitationStatus({status:'pending',incoming:false}),'Awaiting their response');assert.equal(invitationStatus({status:'closed',incoming:true,closure_kind:'declined'}),'You declined');assert.equal(invitationStatus({status:'closed',incoming:false,closure_kind:'withdrawn'}),'You withdrew');
console.log('Invitation choices and legacy/status labels passed');
