'use client';
import {useEffect,useId,useState} from 'react';
import {locationKey,locationLabel,type BroadLocationPoint} from './location';

export default function LocationEditor({accountId,form,setForm,me,busy}:{accountId:string;form:any;setForm:(value:any)=>void;me:any;busy:boolean}){
 const listId=useId();
 const [query,setQuery]=useState(''),[results,setResults]=useState<BroadLocationPoint[]>([]),[searching,setSearching]=useState(false),[finding,setFinding]=useState(false),[message,setMessage]=useState(''),[connectionKey,setConnectionKey]=useState('');
 const confirmed=!!me?.locationConfirmed&&locationKey(form)===locationKey(me)&&!form.confirmLocation;
 const selected=locationLabel(form),hasDistancePoint=typeof form.areaLat==='number'&&typeof form.areaLon==='number'&&!!form.locationPlaceId;

 useEffect(()=>{
  const q=query.trim();if(q.length<3){setResults([]);setSearching(false);return;}
  const controller=new AbortController(),timer=setTimeout(async()=>{setSearching(true);try{const response=await fetch('/api/location?q='+encodeURIComponent(q)+'&expectedAccount='+encodeURIComponent(accountId),{signal:controller.signal,cache:'no-store'});const data:any=await response.json();if(!response.ok)throw Error(data.error||'Place suggestions are unavailable.');setResults(data.suggestions||[]);setMessage(data.suggestions?.length?'':'No matching city or general area found. Try a nearby city or a more complete name.');}catch(e:any){if(e.name!=='AbortError'){setResults([]);setMessage(e.message||'Place suggestions are unavailable.');}}finally{setSearching(false);}},450);
  return()=>{clearTimeout(timer);controller.abort();};
 },[query,accountId]);

 function choose(place:BroadLocationPoint){
  const canConfirm=!!connectionKey&&locationKey(place)===connectionKey;
  setForm((previous:any)=>({...previous,city:place.city,region:place.region,country:place.country,areaLat:place.areaLat,areaLon:place.areaLon,locationPlaceId:place.locationPlaceId,confirmLocation:canConfirm}));
  setQuery('');setResults([]);setMessage(canConfirm?'Selected from place data. Save your profile to confirm this area from your connection.':'Selected from place data. This general-area point will be used only for approximate distance matching.');
 }
 async function find(){
  if(finding)return;setFinding(true);setMessage('');
  try{const response=await fetch('/api/app',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'connection_location',expectedAccount:accountId})});const data:any=await response.json();if(!response.ok)throw Error(data.error||'Your connection area could not be checked.');const key=locationKey(data.location);setConnectionKey(key);setQuery(locationLabel(data.location));setMessage('Choose the matching place below. Nothing changes until you select it.');}
  catch(e:any){setConnectionKey('');setMessage(e.message||'Your connection area could not be checked.');}
  finally{setFinding(false);}
 }

 return <div className="location-editor">
  <label className="location-search">City or general area (required)
   <input type="search" disabled={busy} autoComplete="off" maxLength={120} value={query} placeholder={selected||'Start typing a city, town, or general area'} role="combobox" aria-autocomplete="list" aria-expanded={results.length>0} aria-controls={listId} onChange={event=>{setQuery(event.target.value);setMessage('');setConnectionKey('');}}/>
   {searching&&<span className="field-help" role="status">Finding real places…</span>}
   {results.length>0&&<div className="location-results" id={listId} role="listbox" aria-label="Location suggestions">{results.map(place=><button type="button" role="option" key={place.locationPlaceId+locationKey(place)} disabled={busy} onClick={()=>choose(place)}><strong>{place.city}</strong><span>{[place.region,place.country].filter((x,i,a)=>i===0||x!==a[i-1]).join(', ')}</span></button>)}</div>}
  </label>
  {selected&&<div className="selected-location"><strong>Selected area</strong><span>{selected}</span><span className="field-help">{hasDistancePoint?'Linked to place data for nearby-distance matching.':'Older saved location. Search and reselect it to enable distance-based nearby matching.'}</span></div>}
  <div className="location-check"><strong>{confirmed?'Area confirmed recently':form.confirmLocation?'Ready to confirm when you save':'Area confirmation optional'}</strong><p className="field-help">Confirmation compares your selected broad area with the approximate area of your current internet connection. It does not verify identity, residence, or an exact position.</p><button type="button" className="secondary" disabled={busy||finding} onClick={find}>{finding?'Checking connection…':'Find my connection area'}</button>{message&&<p className="field-help" role="status">{message}</p>}</div>
  <p className="location-attribution field-help">Place suggestions © OpenStreetMap contributors · powered by Photon.</p>
 </div>;
}
