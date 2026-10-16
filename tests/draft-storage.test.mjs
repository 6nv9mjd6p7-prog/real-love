import ts from 'typescript';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const source=ts.transpileModule(readFileSync('app/draft-storage.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {draftKey,readDraft,writeDraft,removeDraft,clearDrafts,messageAttempt,clearMessageAttempt,clearDraftKind}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const values=new Map();const storage={get length(){return values.size;},key(i){return [...values.keys()][i]??null;},getItem(k){return values.get(k)??null;},setItem(k,v){values.set(k,v);},removeItem(k){values.delete(k);}};
const a=draftKey('account-a','message','conversation-1'),b=draftKey('account-b','message','conversation-1'),other=draftKey('account-a','message','conversation-2');
writeDraft(storage,a,'Unsent hello');assert.equal(readDraft(storage,a,''),'Unsent hello');assert.equal(readDraft(storage,b,''),'');assert.equal(readDraft(storage,other,''),'');
// Simulate refreshing: stored envelope alone restores the unsent work.
const profile=draftKey('account-a','profile');storage.setItem(profile,JSON.stringify({version:1,updated:Date.now(),value:{form:{name:'Person'},consent:false}}));assert.equal(readDraft(storage,profile,null).form.name,'Person');
removeDraft(storage,a);assert.equal(readDraft(storage,a,''),'','confirmed send/discard cannot restore sent text');
writeDraft(storage,a,'Expired');const now=Date.now()+25*60*60*1000;assert.equal(readDraft(storage,a,'',now),'','draft expires after 24 hours');
writeDraft(storage,a,'A');writeDraft(storage,b,'B');storage.setItem('unrelated','keep');clearDrafts(storage,'account-b');assert.equal(readDraft(storage,a,''),'');assert.equal(readDraft(storage,b,''),'B');assert.equal(storage.getItem('unrelated'),'keep');
clearDrafts(storage);assert.equal(readDraft(storage,b,''),'');assert.equal(storage.getItem('unrelated'),'keep');
const denied={get length(){throw Error('denied');},getItem(){throw Error('denied');},setItem(){throw Error('denied');},removeItem(){throw Error('denied');}};writeDraft(denied,a,'Memory fallback');assert.equal(readDraft(denied,a,''),'Memory fallback');clearDrafts(denied);assert.equal(readDraft(denied,a,''),'');
storage.setItem(other,'invalid json');assert.equal(readDraft(storage,other,''),'');assert.equal(storage.getItem(other),null);
console.log('Draft isolation, restoration, expiry, clearing, and unavailable-storage checks passed');

const attempt=messageAttempt('a','message','one','hello');assert.equal(messageAttempt('a','message','one','hello'),attempt);assert.notEqual(messageAttempt('b','message','one','hello'),attempt);assert.notEqual(messageAttempt('a','message','two','hello'),attempt);assert.notEqual(messageAttempt('a','message','one','edited'),attempt);clearMessageAttempt('a','message','one');assert.notEqual(messageAttempt('a','message','one','hello'),attempt);

const projectDraft=draftKey('a','circle-project-one','post-1'),sameCircle=draftKey('a','circle-project-one','post-2'),anotherCircle=draftKey('a','circle-project-two','post-1'),otherAccount=draftKey('b','circle-project-one','post-1');
for(const key of [projectDraft,sameCircle,anotherCircle,otherAccount])writeDraft(storage,key,'Private project draft');
clearDraftKind(storage,'a','circle-project-one');assert.equal(readDraft(storage,projectDraft,''),'');assert.equal(readDraft(storage,sameCircle,''),'');assert.equal(readDraft(storage,anotherCircle,''),'Private project draft');assert.equal(readDraft(storage,otherAccount,''),'Private project draft');
writeDraft(denied,projectDraft,'Memory project draft');clearDraftKind(denied,'a','circle-project-one');assert.equal(readDraft(denied,projectDraft,''),'','circle cleanup also clears memory fallback');
