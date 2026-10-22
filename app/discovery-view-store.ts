import {preferenceStorage} from './discovery-preferences';
import {readDiscoveryViews,type DiscoveryView} from './discovery-views';

// Each mounted panel restores once per account, just as its previous load effect did.
export function createDiscoveryViewStore(account:string){
 const empty:DiscoveryView[]=[],listeners=new Set<()=>void>();let snapshot:DiscoveryView[]|null=null;
 return {
  getServerSnapshot:()=>empty,
  getSnapshot:()=>snapshot??(snapshot=readDiscoveryViews(preferenceStorage(),account)),
  subscribe(listener:()=>void){listeners.add(listener);return()=>{listeners.delete(listener);};},
  update(views:DiscoveryView[]){if(snapshot===views)return;snapshot=views;listeners.forEach(listener=>listener());},
 };
}
