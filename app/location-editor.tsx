/**
 * Searches and selects a broad place, optionally using device location. Selection updates profile fields; free-form typing alone is not a verified place choice.
 * Reading guide: docs/CODE_READING_GUIDE.md.
 */
'use client';
import {useEffect,useId,useRef,useState} from 'react';
import {locationKey,locationLabel,type BroadLocationPoint} from './location';

export default function LocationEditor({accountId,form,setForm,me,busy}:{accountId:string;form:any;setForm:(value:any)=>void;me:any;busy:boolean}){
 const inputId=useId(),listId=useId(),skipSearch=useRef(false);
 const [query,setQuery]=useState(''),[results,setResults]=useState<BroadLocationPoint[]>([]),[searching,setSearching]=useState(false),[finding,setFinding]=useState(false),[locating,setLocating]=useState(false),[retry,setRetry]=useState(0),[message,setMessage]=useState(''),[connectionKey,setConnectionKey]=useState('');
 const confirmed=!!me?.locationConfirmed&&locationKey(form)===locationKey(me)&&!form.confirmLocation;
 const selected=locationLabel(form),hasDistancePoint=typeof form.areaLat==='number'&&typeof form.areaLon==='number'&&!!form.locationPlaceId;

 useEffect(()=>{
  if(skipSearch.current){skipSearch.current=false;return;}
  const q=query.trim();if(q.length<2){setResults([]);setSearching(false);return;}
  const controller=new AbortController(),timer=setTimeout(async()=>{setSearching(true);try{const response=await fetch('/api/location?q='+encodeURIComponent(q)+'&expectedAccount='+encodeURIComponent(accountId),{signal:controller.signal,cache:'no-store'});const data:any=await response.json();if(!response.ok)throw Error(data.error||'Place suggestions are unavailable.');setResults(data.suggestions||[]);setMessage(data.suggestions?.length?'':'No matching city or general area found. Try a nearby city or a more complete name.');}catch(e:any){if(e.name!=='AbortError'){setResults([]);setMessage(e.message||'Place suggestions are unavailable.');}}finally{setSearching(false);}},400);
  return()=>{clearTimeout(timer);controller.abort();};
 },[query,accountId,retry]);

 function choose(place:BroadLocationPoint){
  const canConfirm=!!connectionKey&&locationKey(place)===connectionKey;
  setForm((previous:any)=>({...previous,city:place.city,region:place.region,country:place.country,areaLat:place.areaLat,areaLon:place.areaLon,locationPlaceId:place.locationPlaceId,confirmLocation:canConfirm}));
  setQuery('');setResults([]);setMessage(canConfirm?'Selected from place data. Save your profile to confirm this area from your connection.':'Selected from place data. Nearby matching uses this area point, not an exact home or live location.');
 }
 async function find(){
  if(finding)return;setFinding(true);setMessage('');
  try{const response=await fetch('/api/app',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'connection_location',expectedAccount:accountId})});const data:any=await response.json();if(!response.ok)throw Error(data.error||'Your connection area could not be checked.');const key=locationKey(data.location);setConnectionKey(key);setQuery(locationLabel(data.location));setMessage('Choose the matching place below. Nothing changes until you select it.');}
  catch(e:any){setConnectionKey('');setMessage(e.message||'Your connection area could not be checked.');}
  finally{setFinding(false);}
 }
 function locate(){
  if(locating||busy)return;
  if(!navigator.geolocation){setMessage('This browser does not provide location access. Search for your city or general area instead.');return;}
  setLocating(true);setMessage('');setConnectionKey('');
  navigator.geolocation.getCurrentPosition(async position=>{
   try{
    const lat=Math.round(position.coords.latitude*100)/100,lon=Math.round(position.coords.longitude*100)/100;
    const response=await fetch('/api/location',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'reverse',lat,lon,expectedAccount:accountId})});
    const data:any=await response.json();if(!response.ok)throw Error(data.error||'Your current area could not be identified.');
    const place=data.suggestion as BroadLocationPoint;skipSearch.current=true;setQuery(locationLabel(place));setResults([place]);setMessage('Current general area found. Choose it below before saving. Your phone’s exact coordinates are not stored in your profile.');
   }catch(e:any){setResults([]);setMessage(e.message||'Your current area could not be identified. Search for your city instead.');}
   finally{setLocating(false);}
  },error=>{setLocating(false);setResults([]);setMessage(error.code===1?'Location permission was not granted. You can search for your city instead.':error.code===3?'Location lookup timed out. Try again or search for your city.':'Your current area could not be read. Search for your city instead.');},{enableHighAccuracy:false,timeout:10000,maximumAge:600000});
 }

 return <div className="location-editor">
  <div className="location-search"><label htmlFor={inputId}>City or general area (required)</label>
   <input id={inputId} data-profile-field="city" type="search" disabled={busy} autoComplete="off" maxLength={120} value={query} placeholder={selected||'Start typing a city, town, or general area'} role="combobox" aria-autocomplete="list" aria-expanded={results.length>0} aria-controls={listId} onChange={event=>{skipSearch.current=false;setQuery(event.target.value);setMessage('');setConnectionKey('');}}/>
   <p className="field-help">Choose a suggestion instead of saving free text, so the app can validate the place and use it for nearby matching.</p>
   {searching&&<span className="field-help" role="status">Finding real places…</span>}
   {results.length>0&&<div className="location-results" id={listId} role="listbox" aria-label="Location suggestions">{results.map(place=><button type="button" role="option" key={place.locationPlaceId+locationKey(place)} disabled={busy} onClick={()=>choose(place)}><strong>{place.city}</strong><span>{[place.region,place.country].filter((x,i,a)=>i===0||x!==a[i-1]).join(', ')}</span></button>)}</div>}
   {message&&<p className="field-help" role="status">{message}</p>}
   {!searching&&query.trim().length>=2&&!results.length&&message&&<button type="button" className="text-button" disabled={busy} onClick={()=>setRetry(x=>x+1)}>Retry suggestions</button>}
  </div>
  {selected&&<div className="selected-location"><strong>Selected area</strong><span>{selected}</span><span className="field-help">{hasDistancePoint?'Linked to place data for nearby-distance matching. You can adjust the nearby radius in Discover.':'Older saved location. Search and reselect it to enable distance-based nearby matching.'}</span></div>}
  <details className="signup-optional location-options"><summary>Location assistance and confirmation (optional)</summary><p className="field-help">Searching and choosing a place above is enough. Device location and connection-area confirmation are optional.</p>  <div className="location-check"><strong>Use my current area (optional)</strong><p className="field-help">With your permission, the browser can help identify your nearby city or general area. The app rounds the coordinates before the lookup and saves the selected area point—not your phone’s exact or live location.</p><button type="button" className="secondary" disabled={busy||locating} onClick={locate}>{locating?'Finding nearby area…':'Use my current area'}</button></div>
  <div className="location-check"><strong>{confirmed?'Area confirmed recently':form.confirmLocation?'Ready to confirm when you save':'Area confirmation optional'}</strong><p className="field-help">Confirmation compares your selected broad area with the approximate area of your current internet connection. It does not verify identity, residence, or an exact position.</p><button type="button" className="secondary" disabled={busy||finding} onClick={find}>{finding?'Checking connection…':'Find my connection area'}</button></div>
</details>
  <p className="location-attribution field-help">Place suggestions © OpenStreetMap contributors · powered by Photon.</p>
 </div>;
}
