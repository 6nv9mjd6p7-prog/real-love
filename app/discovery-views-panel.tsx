'use client';
import {useEffect,useState} from 'react';
import {Bookmark,Trash2} from 'lucide-react';
import type {DiscoveryPreferences} from './discovery-preferences';
import {preferenceStorage} from './discovery-preferences';
import {type DiscoveryView,readDiscoveryViews,removeDiscoveryView,saveDiscoveryView} from './discovery-views';

// Saved views live only in this browser and are isolated to the signed-in account.
export default function DiscoveryViewsPanel({account,preferences,onApply}:{account:string;preferences:DiscoveryPreferences;onApply:(preferences:DiscoveryPreferences)=>void}){
 const [views,setViews]=useState<DiscoveryView[]>([]),[name,setName]=useState(''),[notice,setNotice]=useState('');
 useEffect(()=>{setViews(readDiscoveryViews(preferenceStorage(),account));setName('');setNotice('');},[account]);
 function save(){const next=saveDiscoveryView(preferenceStorage(),account,views,name,preferences);if(next===views){setNotice(views.length>=8?'Remove a saved view before adding another.':'Choose a new name for this view.');return;}setViews(next);setName('');setNotice('Discovery view saved on this browser.');}
 function remove(id:string){const next=removeDiscoveryView(preferenceStorage(),account,views,id);setViews(next);setNotice('Discovery view removed.');}
 return <section className="discovery-views" aria-label="Saved discovery views"><div className="discovery-views-heading"><div><strong>Saved discovery views</strong><p className="field-help">Keep up to 8 named filter combinations on this browser.</p></div><Bookmark size={18} aria-hidden="true"/></div>
  {views.length>0&&<ul className="discovery-view-list">{views.map(view=><li key={view.id}><button type="button" className="secondary" onClick={()=>{onApply(view.preferences);setNotice(`Showing “${view.name}”.`);}}>{view.name}</button><button type="button" className="discovery-view-remove" aria-label={`Remove ${view.name}`} onClick={()=>remove(view.id)}><Trash2 size={16}/></button></li>)}</ul>}
  {views.length<8&&<details className="discovery-view-create"><summary>Save current filters</summary><div className="discovery-view-save"><label htmlFor="discovery-view-name">Name this search<input id="discovery-view-name" maxLength={40} value={name} onChange={event=>setName(event.target.value)} placeholder="e.g. Nearby weekend walks"/></label><button type="button" className="secondary" disabled={!name.trim()} onClick={save}>Save view</button></div></details>}
  <p className="field-help" role="status" aria-live="polite">{notice||'Views include your current filters and search text. They are private to this browser and are not sent to other members.'}</p>
 </section>;
}
