/**
 * Searches and selects a broad place, optionally using device location. Selection updates profile fields; free-form typing alone is not a verified place choice.
 * Reading guide: docs/CODE_READING_GUIDE.md.
 */
'use client';
import {useEffect,useId,useRef,useState} from 'react';
import {locationKey,locationLabel,type BroadLocationPoint} from './location';

export default function LocationEditor({accountId,form,setForm,me,busy,onPendingChange}:{accountId:string;form:any;setForm:(value:any)=>void;me:any;busy:boolean;onPendingChange?:(pending:boolean)=>void}){
 const inputId=useId(),listId=useId(),skipSearch=useRef(true),inputRef=useRef<HTMLInputElement>(null),detection=useRef(0),alive=useRef(true);
 const [query,setQuery]=useState(locationLabel(form)),[results,setResults]=useState<BroadLocationPoint[]>([]),[searching,setSearching]=useState(false),[finding,setFinding]=useState(false),[locating,setLocating]=useState(false),[retry,setRetry]=useState(0),[message,setMessage]=useState(''),[connectionKey,setConnectionKey]=useState('');
 const [activeOption,setActiveOption]=useState(-1),[suggestionsClosed,setSuggestionsClosed]=useState(false);
 const listVisible=results.length>0&&!suggestionsClosed;
 useEffect(()=>{setActiveOption(-1);setSuggestionsClosed(false);},[results]);
 useEffect(()=>{alive.current=true;onPendingChange?.(false);return()=>{alive.current=false;detection.current++;};},[accountId]);
 function edit(){detection.current++;setLocating(false);setFinding(false);skipSearch.current=true;setQuery(locationLabel(form));setResults([]);setMessage('Type your city or area, then choose the matching suggestion.');setConnectionKey('');onPendingChange?.(false);inputRef.current?.focus();inputRef.current?.select();}
 const confirmed=!!me?.locationConfirmed&&locationKey(form)===locationKey(me)&&!form.confirmLocation;
 const selected=locationLabel(form),hasDistancePoint=typeof form.areaLat==='number'&&typeof form.areaLon==='number'&&!!form.locationPlaceId;
 useEffect(()=>{skipSearch.current=true;setQuery(selected);setResults([]);onPendingChange?.(false);},[selected]);

 useEffect(()=>{
  if(skipSearch.current){skipSearch.current=false;return;}
  const q=query.trim();if(q.length<2){setResults([]);setSearching(false);return;}
  const controller=new AbortController(),timer=setTimeout(async()=>{setSearching(true);try{const response=await fetch('/api/location?q='+encodeURIComponent(q)+'&expectedAccount='+encodeURIComponent(accountId),{signal:controller.signal,cache:'no-store'});const data:any=await response.json();if(controller.signal.aborted||!alive.current)return;if(!response.ok)throw Error(data.error||'Place suggestions are unavailable.');setResults(data.suggestions||[]);setMessage(data.suggestions?.length?'':'No matching city or general area found. Try a nearby city or a more complete name.');}catch(e:any){if(e.name!=='AbortError'&&!controller.signal.aborted&&alive.current){setResults([]);setMessage(e.message||'Place suggestions are unavailable.');}}finally{if(!controller.signal.aborted&&alive.current)setSearching(false);}},400);
  return()=>{clearTimeout(timer);controller.abort();};
 },[query,accountId,retry]);

 function choose(place:BroadLocationPoint){
  detection.current++;setLocating(false);setFinding(false);skipSearch.current=true;onPendingChange?.(false);
  const canConfirm=!!connectionKey&&locationKey(place)===connectionKey;
  setForm((previous:any)=>({...previous,city:place.city,region:place.region,country:place.country,areaLat:place.areaLat,areaLon:place.areaLon,locationPlaceId:place.locationPlaceId,confirmLocation:canConfirm}));
  setQuery(locationLabel(place));setResults([]);setActiveOption(-1);setSuggestionsClosed(true);setMessage(canConfirm?'Selected from place data. Save your profile to confirm this area from your connection.':'Selected from place data. Nearby matching uses this area point, not an exact home or live location.');
 }
 async function find(){
  if(finding)return;const ticket=++detection.current;setFinding(true);setLocating(false);setMessage('');
  try{const response=await fetch('/api/app',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'connection_location',expectedAccount:accountId})});const data:any=await response.json();if(!alive.current||ticket!==detection.current)return;if(!response.ok)throw Error(data.error||'Your connection area could not be checked.');const key=locationKey(data.location);setConnectionKey(key);setQuery(locationLabel(data.location));onPendingChange?.(true);setMessage('Internet connections can point to another city. Search or choose a place yourself; your saved area has not changed.');}
  catch(e:any){if(alive.current&&ticket===detection.current){setConnectionKey('');setMessage(e.message||'Your connection area could not be checked.');}}
  finally{if(alive.current&&ticket===detection.current)setFinding(false);}
 }
 function locate(){
  if(locating||busy)return;
  if(!navigator.geolocation){setMessage('This browser does not provide location access. Search for your city or general area instead.');return;}
  const ticket=++detection.current;setLocating(true);setFinding(false);setMessage('');setConnectionKey('');
  navigator.geolocation.getCurrentPosition(async position=>{
   if(!alive.current||ticket!==detection.current)return;
   const accuracy=position.coords.accuracy;
   if(Number.isFinite(accuracy)&&accuracy>10000){setLocating(false);setMessage('Your device supplied a rough location (about '+Math.round(accuracy/1000)+' km). Search for your city or retry from a device with better location accuracy. Your saved area has not changed.');return;}
   try{
    const lat=Math.round(position.coords.latitude*100)/100,lon=Math.round(position.coords.longitude*100)/100;
    const response=await fetch('/api/location',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'reverse',lat,lon,expectedAccount:accountId})});
    const data:any=await response.json();if(!alive.current||ticket!==detection.current)return;if(!response.ok)throw Error(data.error||'Your current area could not be identified.');
    const places=(data.suggestions?.length?data.suggestions:[data.suggestion]).filter(Boolean) as BroadLocationPoint[];if(!places.length)throw Error('No nearby places were found. Search for your city instead.');skipSearch.current=true;setQuery('');setResults(places);onPendingChange?.(true);setSuggestionsClosed(false);setActiveOption(-1);setMessage('Nearby places suggested'+(Number.isFinite(accuracy)?' · device accuracy about '+Math.max(1,Math.round(accuracy))+' metres':'')+'. Choose the correct area below, or type your city if these are wrong. Your saved area has not changed.');
   }catch(e:any){if(alive.current&&ticket===detection.current){setResults([]);setMessage(e.message||'Your current area could not be identified. Search for your city instead.');}}
   finally{if(alive.current&&ticket===detection.current)setLocating(false);}
  },error=>{if(!alive.current||ticket!==detection.current)return;setLocating(false);setResults([]);setMessage(error.code===1?'Location permission was not granted. You can search for your city instead.':error.code===3?'Location lookup timed out. Try again or search for your city.':'Your current area could not be read. Search for your city instead.');},{enableHighAccuracy:true,timeout:20000,maximumAge:0});
 }

 return <div className="location-editor">
  <div className="location-search"><label htmlFor={inputId}>City or general area (required)</label>
   <input ref={inputRef} id={inputId} data-profile-field="city" aria-describedby={inputId+'-help'} type="search" disabled={busy} autoComplete="off" maxLength={120} value={query} placeholder={selected||'Start typing a city, town, or general area'} role="combobox" aria-autocomplete="list" aria-expanded={listVisible} aria-controls={listVisible?listId:undefined} aria-activedescendant={listVisible&&activeOption>=0?listId+'-'+activeOption:undefined} onKeyDown={e=>{if(e.nativeEvent?.isComposing)return;if(e.key==='Escape'){e.preventDefault();setSuggestionsClosed(true);setActiveOption(-1);}else if((e.key==='ArrowDown'||e.key==='ArrowUp')&&results.length){e.preventDefault();setSuggestionsClosed(false);setActiveOption(i=>e.key==='ArrowDown'?(i+1)%results.length:(i<=0?results.length-1:i-1));}else if(e.key==='Enter'&&query.trim()){e.preventDefault();if(listVisible&&activeOption>=0)choose(results[activeOption]);else setMessage('Choose a suggested place with the arrow keys and Enter, or select it below.');}}} onChange={event=>{detection.current++;setLocating(false);setFinding(false);skipSearch.current=false;onPendingChange?.(event.target.value.trim()!==selected);setQuery(event.target.value);setActiveOption(-1);setSuggestionsClosed(false);setMessage('');setConnectionKey('');}}/>
   <p id={inputId+'-help'} className="field-help">Type your city in the box above, then choose a matching suggestion. Search text alone does not change your saved area.</p>
   {searching&&<span className="field-help" role="status">Finding real places…</span>}
   {listVisible&&<div className="location-results" id={listId} role="listbox" aria-label="Location suggestions">{results.map((place,index)=><button id={listId+'-'+index} aria-selected={activeOption===index} onMouseEnter={()=>setActiveOption(index)} onMouseDown={e=>e.preventDefault()} type="button" role="option" key={place.locationPlaceId+locationKey(place)} disabled={busy} onClick={()=>choose(place)}><strong>{place.city}</strong><span>{[place.region,place.country].filter((x,i,a)=>i===0||x!==a[i-1]).join(', ')}</span></button>)}</div>}
   {message&&<p className="field-help" role="status">{message}</p>}
   {!searching&&query.trim().length>=2&&!results.length&&message&&<button type="button" className="text-button" disabled={busy} onClick={()=>setRetry(x=>x+1)}>Retry suggestions</button>}
  </div>
  {selected&&<div className="selected-location"><strong>{me&&locationKey(form)===locationKey(me)?'Saved area':'Selected area · save to apply'}</strong><span>{selected}</span><button type="button" className="text-button" disabled={busy} onClick={edit}>Change area</button><span className="field-help">{hasDistancePoint?'Linked to place data for nearby-distance matching. You can adjust the nearby radius in Discover.':'Older saved location. Search and reselect it to enable distance-based nearby matching.'}</span></div>}
  <div className="location-check"><strong>Use my current area (optional)</strong><p className="field-help">With your permission, the browser can help identify your nearby city or general area. The app uses a rounded position to suggest nearby places. You choose the area to save; detection does not replace it automatically.</p><button type="button" className="secondary" disabled={busy||locating} onClick={locate}>{locating?'Finding nearby area…':'Use my current area'}</button></div>
  <details className="signup-optional location-options"><summary>Internet connection estimate (optional)</summary><div className="location-check"><strong>{confirmed?'Area confirmed recently':form.confirmLocation?'Ready to confirm when you save':'Area confirmation optional'}</strong><p className="field-help">Confirmation compares your selected broad area with the approximate area of your current internet connection. It does not verify identity, residence, or an exact position.</p><button type="button" className="secondary" disabled={busy||finding} onClick={find}>{finding?'Checking connection…':'Estimate from internet connection'}</button></div>
</details>
  <p className="location-attribution field-help">Place suggestions © OpenStreetMap contributors · powered by Photon.</p>
 </div>;
}
