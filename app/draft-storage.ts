/**
 * Tab-scoped draft persistence with an in-memory fallback and expiry. Account-qualified keys prevent one signed-in person from inheriting another person's draft.
 * Reading guide: docs/CODE_READING_GUIDE.md.
 */
// Unsent work is local to this tab, never uploaded or shared across accounts.
const PREFIX='real-love-drafts-v1:';
const MAX_AGE=24*60*60*1000;
const memory=new Map<string,{updated:number;value:unknown}>();
export interface DraftStorage {length:number;key(index:number):string|null;getItem(key:string):string|null;setItem(key:string,value:string):void;removeItem(key:string):void}
// Include both account and conversation scope in the key; encode IDs so separators cannot collide.
export function draftKey(account:string,kind:string,id=''){return PREFIX+encodeURIComponent(account)+':'+kind+':'+encodeURIComponent(id);}
// Reject malformed, unsupported-version, or expired entries and return the caller's safe fallback.
export function readDraft<T>(storage:DraftStorage|null,key:string,fallback:T,now=Date.now()):T{
 try{const raw=storage?.getItem(key);if(raw){const item=JSON.parse(raw);if(item.version===1&&Number.isFinite(item.updated)&&now-item.updated<MAX_AGE&&now>=item.updated)return item.value as T;storage?.removeItem(key);memory.delete(key);}}
 catch{try{storage?.removeItem(key);}catch{}}
 const cached=memory.get(key);if(cached&&now>=cached.updated&&now-cached.updated<MAX_AGE)return cached.value as T;memory.delete(key);return fallback;
}
// Keep an in-memory copy first so blocked or full browser storage does not prevent editing.
export function writeDraft(storage:DraftStorage|null,key:string,value:unknown){const item={version:1,updated:Date.now(),value};memory.set(key,item);try{storage?.setItem(key,JSON.stringify(item));}catch{/* Navigation still works when browser storage is disabled. */}}
// Remove both persistence layers so a supposedly deleted draft cannot reappear from the fallback cache.
export function removeDraft(storage:DraftStorage|null,key:string){memory.delete(key);try{storage?.removeItem(key);}catch{}}
// Walk only this app's draft namespace; optionally keep the current account while discarding other accounts.
export function clearDrafts(storage:DraftStorage|null,keepAccount?:string){const keep=keepAccount?PREFIX+encodeURIComponent(keepAccount)+':':null;for(const key of memory.keys())if(key.startsWith(PREFIX)&&(!keep||!key.startsWith(keep)))memory.delete(key);try{for(let i=storage!.length-1;i>=0;i--){const key=storage!.key(i);if(key?.startsWith(PREFIX)&&(!keep||!key.startsWith(keep)))storage!.removeItem(key);}}catch{}}
export function tabStorage():DraftStorage|null{try{return typeof window==='undefined'?null:window.sessionStorage;}catch{return null;}}

// Reuse an attempt after an uncertain response, including navigation or reload.
// Reuse a send-attempt ID only for unchanged content, allowing retry deduplication without suppressing a later message.
export function messageAttempt(account:string,kind:string,id:string,text:string){
 const storage=tabStorage(),key=draftKey(account,kind+'-attempt',id);
 const previous=readDraft<{text:string;id:string}|null>(storage,key,null);
 if(previous?.text===text)return previous.id;
 const attempt={text,id:crypto.randomUUID()};writeDraft(storage,key,attempt);return attempt.id;
}
// After a completed send, remove its retry identity so the next message can receive a fresh ID.
export function clearMessageAttempt(account:string,kind:string,id:string){removeDraft(tabStorage(),draftKey(account,kind+'-attempt',id));}
