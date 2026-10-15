import {activityOptions,availabilityOptions,normalizeProfileFilters,type ExtraProfileFilters} from './model';
export type DiscoveryPreferences={interestMode:'mine'|'any';locationFilter:'any'|'local'|'online';radiusMiles:number;filterMinAge:number;filterMaxAge:number;category:string;activityFilter:string;availabilityFilter:string;aceFilter:boolean;search:string;profileFilters:ExtraProfileFilters};
export const defaultDiscovery:DiscoveryPreferences={interestMode:'any',locationFilter:'any',radiusMiles:25,filterMinAge:18,filterMaxAge:99,category:'All interests',activityFilter:'',availabilityFilter:'',aceFilter:false,search:'',profileFilters:{}};
const PREFIX='real-love-discovery-v1:';
export type PreferenceScope='discover'|'saved';
const SAVED_PREFIX='real-love-saved-v1:';
const SAVED_VIEWS_PREFIX='real-love-discovery-views-v1:';
export function discoveryKey(account:string,scope:PreferenceScope='discover'){return (scope==='saved'?SAVED_PREFIX:PREFIX)+encodeURIComponent(account);}
export function normalizeDiscovery(value:unknown):DiscoveryPreferences{
 const p=value&&typeof value==='object'?value as Record<string,unknown>:{};
 const age=(v:unknown,fallback:number)=>typeof v==='number'&&Number.isInteger(v)&&v>=18&&v<=99?v:fallback;
 let min=age(p.filterMinAge,18),max=age(p.filterMaxAge,99);if(min>max){min=18;max=99;}
 const string=(v:unknown,max:number,fallback:string)=>typeof v==='string'&&v.length<=max?v:fallback;
 const radius=typeof p.radiusMiles==='number'&&Number.isInteger(p.radiusMiles)&&p.radiusMiles>=5&&p.radiusMiles<=100?p.radiusMiles:25;
 return {interestMode:p.interestMode==='mine'?'mine':'any',locationFilter:p.locationFilter==='local'||p.locationFilter==='online'?p.locationFilter:'any',radiusMiles:radius,filterMinAge:min,filterMaxAge:max,category:string(p.category,60,'All interests')||'All interests',activityFilter:typeof p.activityFilter==='string'&&activityOptions.includes(p.activityFilter)?p.activityFilter:'',availabilityFilter:typeof p.availabilityFilter==='string'&&availabilityOptions.includes(p.availabilityFilter)?p.availabilityFilter:'',aceFilter:p.aceFilter===true,search:string(p.search,120,''),profileFilters:normalizeProfileFilters(p.profileFilters)};
}
export function readDiscovery(storage:Storage|null,account:string,scope:PreferenceScope='discover'){try{const raw=storage?.getItem(discoveryKey(account,scope));if(raw){const parsed=JSON.parse(raw);if(parsed.version===1)return normalizeDiscovery(parsed.preferences);}}catch{}return {...defaultDiscovery};}
export function writeDiscovery(storage:Storage|null,account:string,preferences:DiscoveryPreferences,scope:PreferenceScope='discover'){try{if(!storage||!account)return false;storage.setItem(discoveryKey(account,scope),JSON.stringify({version:1,preferences:normalizeDiscovery(preferences)}));return true;}catch{return false;}}
export function clearDiscovery(storage:Storage|null,keepAccount?:string){try{const keep=keepAccount?[discoveryKey(keepAccount),discoveryKey(keepAccount,'saved'),SAVED_VIEWS_PREFIX+encodeURIComponent(keepAccount)]:[];for(let i=storage!.length-1;i>=0;i--){const key=storage!.key(i);if(key&&(key.startsWith(PREFIX)||key.startsWith(SAVED_PREFIX)||key.startsWith(SAVED_VIEWS_PREFIX))&&!keep.includes(key))storage!.removeItem(key);}}catch{}}
export function preferenceStorage():Storage|null{try{return typeof window==='undefined'?null:window.localStorage;}catch{return null;}}
