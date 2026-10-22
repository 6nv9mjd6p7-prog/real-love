'use client';
import {useMemo,useState,useSyncExternalStore} from 'react';
import {type DiscoveryPreferences,type PreferenceScope,defaultDiscovery,readDiscovery,writeDiscovery,clearDiscovery,preferenceStorage} from './discovery-preferences';

function createPreferenceStore(account:string,scope:PreferenceScope){
 const initial={filters:{...defaultDiscovery},ready:false,remembering:false},listeners=new Set<()=>void>();let snapshot=initial,restored=false;
 function publish(next:typeof initial){snapshot=next;listeners.forEach(listener=>listener());}
 return {
  getSnapshot:()=>snapshot,
  getServerSnapshot:()=>initial,
  subscribe(listener:()=>void){listeners.add(listener);if(!restored){restored=true;const storage=preferenceStorage();clearDiscovery(storage,account||undefined);const filters=account?readDiscovery(storage,account,scope):{...defaultDiscovery};publish({filters,ready:true,remembering:writeDiscovery(storage,account,filters,scope)});}return()=>{listeners.delete(listener);};},
  update(change:(filters:DiscoveryPreferences)=>DiscoveryPreferences){if(!snapshot.ready||!listeners.size)return;const filters=change(snapshot.filters);publish({filters,ready:true,remembering:writeDiscovery(preferenceStorage(),account,filters,scope)});},
 };
}
export function useDiscoveryPreferences(account:string,demo:boolean,scope:PreferenceScope='discover'){
 const store=useMemo(()=>createPreferenceStore(account,scope),[account,scope]);
 const real=useSyncExternalStore(store.subscribe,store.getSnapshot,store.getServerSnapshot);
 const [example,setExample]=useState<DiscoveryPreferences>({...defaultDiscovery});
 function set<K extends keyof DiscoveryPreferences>(key:K,value:DiscoveryPreferences[K]){if(demo)setExample(previous=>({...previous,[key]:value}));else store.update(previous=>({...previous,[key]:value}));}
 function reset(){if(demo)setExample({...defaultDiscovery});else store.update(()=>({...defaultDiscovery}));}
 return {filters:demo?example:real.filters,set,reset,ready:demo||real.ready,remembering:real.ready&&!!account&&real.remembering};
}
