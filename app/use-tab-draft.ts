'use client';
import {useMemo,useSyncExternalStore} from 'react';
import {draftKey,readDraft,writeDraft,removeDraft,tabStorage} from './draft-storage';

function createDraftStore(key:string){
 const initial={value:'',ready:false},listeners=new Set<()=>void>();let snapshot=initial,restored=false;
 function publish(value:string){snapshot={value,ready:true};listeners.forEach(listener=>listener());}
 return {
  getSnapshot:()=>snapshot,
  getServerSnapshot:()=>initial,
  subscribe(listener:()=>void){listeners.add(listener);if(!restored){restored=true;const raw=readDraft(tabStorage(),key,'');publish(typeof raw==='string'?raw:'');}return()=>{listeners.delete(listener);};},
  setValue(text:string){if(text)writeDraft(tabStorage(),key,text);else removeDraft(tabStorage(),key);if(restored)publish(text);},
 };
}
export function useTabDraft(account:string,kind:string,id:string){
 const key=draftKey(account,kind,id),store=useMemo(()=>createDraftStore(key),[key]);
 const state=useSyncExternalStore(store.subscribe,store.getSnapshot,store.getServerSnapshot);
 return [state.value,store.setValue,state.ready] as const;
}
