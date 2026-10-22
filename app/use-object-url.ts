'use client';
import {useMemo,useSyncExternalStore} from 'react';

function objectUrlStore(blob:Blob|null){
 const listeners=new Set<()=>void>();let url='';
 return {
  getSnapshot:()=>url,
  getServerSnapshot:()=>'',
  subscribe(listener:()=>void){
   listeners.add(listener);
   if(blob&&!url){url=URL.createObjectURL(blob);listeners.forEach(notify=>notify());}
   return()=>{listeners.delete(listener);if(!listeners.size&&url){URL.revokeObjectURL(url);url='';}};
  },
 };
}
export function useObjectUrl(blob:Blob|null){
 const store=useMemo(()=>objectUrlStore(blob),[blob]);
 return useSyncExternalStore(store.subscribe,store.getSnapshot,store.getServerSnapshot);
}
