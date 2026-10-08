'use client';
import {useEffect,useState} from 'react';
import {type DiscoveryPreferences,defaultDiscovery,readDiscovery,writeDiscovery,clearDiscovery,preferenceStorage} from './discovery-preferences';
export function useDiscoveryPreferences(account:string,demo:boolean){
 const [real,setReal]=useState<{account:string|null;filters:DiscoveryPreferences}>({account:null,filters:{...defaultDiscovery}}),[example,setExample]=useState<DiscoveryPreferences>({...defaultDiscovery});
 const [savedAccount,setSavedAccount]=useState<string|null>(null);
 const ready=real.account===account;
 useEffect(()=>{const storage=preferenceStorage();clearDiscovery(storage,account||undefined);setSavedAccount(null);setReal({account,filters:account?readDiscovery(storage,account):{...defaultDiscovery}});},[account]);
 useEffect(()=>{if(ready)setSavedAccount(writeDiscovery(preferenceStorage(),account,real.filters)?account:null);},[account,real,ready]);
 function set<K extends keyof DiscoveryPreferences>(key:K,value:DiscoveryPreferences[K]){if(demo)setExample(previous=>({...previous,[key]:value}));else setReal(previous=>previous.account===account?{account,filters:{...previous.filters,[key]:value}}:previous);}
 function reset(){if(demo)setExample({...defaultDiscovery});else setReal(previous=>previous.account===account?{account,filters:{...defaultDiscovery}}:previous);}
 return {filters:demo?example:ready?real.filters:{...defaultDiscovery},set,reset,ready:demo||ready,remembering:ready&&!!account&&savedAccount===account};
}
