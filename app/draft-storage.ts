// Unsent work is local to this tab, never uploaded or shared across accounts.
const PREFIX='real-love-drafts-v1:';
const MAX_AGE=24*60*60*1000;
const memory=new Map<string,{updated:number;value:unknown}>();
export interface DraftStorage {length:number;key(index:number):string|null;getItem(key:string):string|null;setItem(key:string,value:string):void;removeItem(key:string):void}
export function draftKey(account:string,kind:string,id=''){return PREFIX+encodeURIComponent(account)+':'+kind+':'+encodeURIComponent(id);}
export function readDraft<T>(storage:DraftStorage|null,key:string,fallback:T,now=Date.now()):T{
 try{const raw=storage?.getItem(key);if(raw){const item=JSON.parse(raw);if(item.version===1&&Number.isFinite(item.updated)&&now-item.updated<MAX_AGE&&now>=item.updated)return item.value as T;storage?.removeItem(key);memory.delete(key);}}
 catch{try{storage?.removeItem(key);}catch{}}
 const cached=memory.get(key);if(cached&&now>=cached.updated&&now-cached.updated<MAX_AGE)return cached.value as T;memory.delete(key);return fallback;
}
export function writeDraft(storage:DraftStorage|null,key:string,value:unknown){const item={version:1,updated:Date.now(),value};memory.set(key,item);try{storage?.setItem(key,JSON.stringify(item));}catch{/* Navigation still works when browser storage is disabled. */}}
export function removeDraft(storage:DraftStorage|null,key:string){memory.delete(key);try{storage?.removeItem(key);}catch{}}
export function clearDrafts(storage:DraftStorage|null,keepAccount?:string){const keep=keepAccount?PREFIX+encodeURIComponent(keepAccount)+':':null;for(const key of memory.keys())if(key.startsWith(PREFIX)&&(!keep||!key.startsWith(keep)))memory.delete(key);try{for(let i=storage!.length-1;i>=0;i--){const key=storage!.key(i);if(key?.startsWith(PREFIX)&&(!keep||!key.startsWith(keep)))storage!.removeItem(key);}}catch{}}
export function tabStorage():DraftStorage|null{try{return typeof window==='undefined'?null:window.sessionStorage;}catch{return null;}}

// Reuse an attempt after an uncertain response, including navigation or reload.
export function messageAttempt(account:string,kind:string,id:string,text:string){
 const storage=tabStorage(),key=draftKey(account,kind+'-attempt',id);
 const previous=readDraft<{text:string;id:string}|null>(storage,key,null);
 if(previous?.text===text)return previous.id;
 const attempt={text,id:crypto.randomUUID()};writeDraft(storage,key,attempt);return attempt.id;
}
export function clearMessageAttempt(account:string,kind:string,id:string){removeDraft(tabStorage(),draftKey(account,kind+'-attempt',id));}
// Clear one account's exact draft kind, including its in-memory fallback.
export function clearDraftKind(storage:DraftStorage|null,account:string,kind:string){const prefix=draftKey(account,kind);for(const key of memory.keys())if(key.startsWith(prefix))memory.delete(key);try{for(let i=storage!.length-1;i>=0;i--){const key=storage!.key(i);if(key?.startsWith(prefix))storage!.removeItem(key);}}catch{}}
