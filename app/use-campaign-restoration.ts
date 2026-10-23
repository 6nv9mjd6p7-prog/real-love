'use client';
import {useMemo,useSyncExternalStore} from 'react';
import {appBackDestination} from './native-links';
import {readCampaignView} from './campaign-navigation';
import {readDraft,tabStorage} from './draft-storage';
import type {CampaignDraft} from './campaign-proposal';

type Restoration={ready:boolean;returnArea:string;view:ReturnType<typeof readCampaignView>|null;draft:CampaignDraft|null};
function createRestoration(accountId:string,proposalKey:string){
 const initial:Restoration={ready:false,returnArea:'circles',view:null,draft:null};
 let snapshot=initial;
 const listeners=new Set<()=>void>();
 const publish=()=>listeners.forEach(listener=>listener());
 const restore=()=>{if(window.location.hash!=='#circles/action')return;snapshot={...snapshot,view:readCampaignView(accountId)};publish();};
 return {getSnapshot:()=>snapshot,getServerSnapshot:()=>initial,subscribe(listener:()=>void){
  listeners.add(listener);
  if(listeners.size===1){
   if(!snapshot.ready){const recovered=readDraft<{draft:CampaignDraft}|null>(tabStorage(),proposalKey,null);snapshot={ready:true,returnArea:appBackDestination('circles',accountId),view:window.location.hash==='#circles/action'?readCampaignView(accountId):null,draft:recovered?.draft??null};publish();}
   window.addEventListener('popstate',restore);
  }
  return()=>{listeners.delete(listener);if(!listeners.size)window.removeEventListener('popstate',restore);};
 }};
}
export function useCampaignRestoration(accountId:string,proposalKey:string){const store=useMemo(()=>createRestoration(accountId,proposalKey),[accountId,proposalKey]);return useSyncExternalStore(store.subscribe,store.getSnapshot,store.getServerSnapshot);}
