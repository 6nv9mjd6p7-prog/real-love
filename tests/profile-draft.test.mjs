import ts from 'typescript';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const model='data:text/javascript;base64,'+Buffer.from(ts.transpileModule(readFileSync('app/model.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText).toString('base64');
const source=ts.transpileModule(readFileSync('app/profile-draft.ts','utf8').replace("from './model'",`from '${model}'`),{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText;
const {profileDraftChanged,profileDraftError,profileSetupError,profileValidationIssue}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const defaults={name:'',age:18,city:'',region:'',country:'',about:'',firstStep:'',interests:[],activities:[],photoDescription:'',minAge:18,maxAge:99,active:true,hasPhoto:false};
const saved={...defaults,birthDate:'2001-01-01',name:'Person',age:25,city:'Austin',region:'Texas',country:'United States',about:'Curious about history.',interests:['History']};
assert(!profileDraftChanged({...saved,age:'25'},saved,defaults,true,true),'numeric input types do not create false unsaved status');
assert(!profileDraftChanged({...saved,active:false,hasPhoto:true,photoPending:true},saved,defaults,true,true),'visibility and photo metadata do not masquerade as profile edits');
assert(profileDraftChanged({...saved,about:'I also enjoy writing.'},saved,defaults,true,true),'introduction edits are detected');
assert(profileDraftChanged({...saved,activities:['Reading together']},saved,defaults,true,true),'practical preference edits are detected');
assert(profileDraftChanged({...saved,photoDescription:'Portrait in a garden.'},saved,defaults,true,true),'accessible photo-description edits are detected');
assert(profileDraftChanged(saved,saved,defaults,false,true),'agreement changes are detected');
assert(profileDraftChanged(saved,null,defaults,false,false),'a new profile is never called saved');
assert(!profileDraftChanged({...saved},saved,defaults,true,true),'a confirmed snapshot clears the dirty state');
assert.equal(profileDraftError(saved,true),'');
assert.match(profileDraftError({...saved,about:''},true),/introduction/i);
assert.match(profileDraftError({...saved,minAge:40,maxAge:20},true),/age range/i);
assert.match(profileDraftError(saved,false),/agree/i);
assert.match(profileDraftError({...saved,birthDate:`${new Date().getUTCFullYear()-17}-01-01`,age:99},true),/18/);
console.log('Profile preview status and save validation checks passed');

assert.match(profileSetupError({...saved,name:''},1),/name/);assert.match(profileSetupError({...saved,birthDate:`${new Date().getUTCFullYear()-17}-01-01`,age:99},1),/18/);assert.match(profileSetupError({...saved,city:''},1),/city/);assert.match(profileSetupError({...saved,interests:[]},2),/1–8/);assert.equal(profileSetupError(saved,1),'');assert.equal(profileSetupError(saved,2),'');
for(const missing of ['region','country']){const incomplete={...saved,[missing]:''};assert.match(profileSetupError(incomplete,1),/location suggestions/);assert.equal(profileValidationIssue(incomplete,true).field,'city','incomplete selected locations focus the place-search control');}

assert.equal(profileValidationIssue({...saved,city:''},true).step,1);assert.equal(profileValidationIssue({...saved,interests:[]},true).step,2);assert.equal(profileValidationIssue({...saved,about:''},true).field,'about');assert.equal(profileValidationIssue({...saved,minAge:40,maxAge:20},true).step,4);assert.equal(profileValidationIssue(saved,false).field,'consent');
