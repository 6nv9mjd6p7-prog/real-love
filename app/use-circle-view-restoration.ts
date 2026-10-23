'use client';
import {useMemo,useSyncExternalStore} from 'react';
import type {CircleSection} from './circle-experience';
type StoredView={query?:string;section?:CircleSection};
function createRestoration(accountId:string,workerArea:boolean){
 const initial:{ready:boolean;stored:StoredView}={ready:false,stored:{}};
 let snapshot=initial;
 const listeners=new Set<()=>void>();
 return {getSnapshot:()=>snapshot,getServerSnapshot:()=>initial,subscribe(listener:()=>void){
  listeners.add(listener);
  if(!snapshot.ready){const stored:StoredView={};try{const value=JSON.parse(sessionStorage.getItem('real-love-circle-view:'+accountId+':'+workerArea)||'{}');if(value&&typeof value==='object'){if(typeof value.query==='string')stored.query=value.query;if(['Discover','Joined','Requests'].includes(value.section))stored.section=value.section;}}catch{/* Browsing remains available when tab storage is blocked. */}snapshot={ready:true,stored};listeners.forEach(notify=>notify());}
  return()=>{listeners.delete(listener);};
 }};
}
export function useCircleViewRestoration(accountId:string,workerArea:boolean){const store=useMemo(()=>createRestoration(accountId,workerArea),[accountId,workerArea]);return useSyncExternalStore(store.subscribe,store.getSnapshot,store.getServerSnapshot);}
