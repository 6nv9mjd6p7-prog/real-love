import {normalizeDiscovery,type DiscoveryPreferences} from './discovery-preferences';

// A Misskey Antenna-inspired saved view keeps a named, reusable discovery query.
export type DiscoveryView={id:string;name:string;preferences:DiscoveryPreferences};
const PREFIX='real-love-discovery-views-v1:';
const MAX_VIEWS=8;
export function discoveryViewsKey(account:string){return PREFIX+encodeURIComponent(account);}
export function readDiscoveryViews(storage:Storage|null,account:string):DiscoveryView[]{
 try{
  const raw=storage?.getItem(discoveryViewsKey(account));if(!raw)return [];
  const parsed=JSON.parse(raw);if(parsed.version!==1||!Array.isArray(parsed.views))return [];
  return parsed.views.slice(0,MAX_VIEWS).flatMap((view:unknown)=>{
   if(!view||typeof view!=='object')return [];
   const item=view as Record<string,unknown>;
   if(typeof item.id!=='string'||item.id.length>80||typeof item.name!=='string')return [];
   const name=item.name.trim().slice(0,40);if(!name)return [];
   return [{id:item.id,name,preferences:normalizeDiscovery(item.preferences)}];
  });
 }catch{return [];}
}
export function saveDiscoveryView(storage:Storage|null,account:string,views:DiscoveryView[],name:string,preferences:DiscoveryPreferences):DiscoveryView[]{
 const clean=name.trim().replace(/\s+/g,' ').slice(0,40);if(!storage||!account||!clean||views.length>=MAX_VIEWS||views.some(view=>view.name.toLocaleLowerCase()===clean.toLocaleLowerCase()))return views;
 const next=[...views,{id:globalThis.crypto?.randomUUID?.()??`${Date.now()}-${Math.random().toString(36).slice(2)}`,name:clean,preferences:normalizeDiscovery(preferences)}];
 try{storage.setItem(discoveryViewsKey(account),JSON.stringify({version:1,views:next}));return next;}catch{return views;}
}
export function removeDiscoveryView(storage:Storage|null,account:string,views:DiscoveryView[],id:string):DiscoveryView[]{
 const next=views.filter(view=>view.id!==id);try{if(storage&&account)storage.setItem(discoveryViewsKey(account),JSON.stringify({version:1,views:next}));}catch{return views;}return next;
}
