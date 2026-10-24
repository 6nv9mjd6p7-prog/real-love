'use client';
import {useEffect,useId,useRef,useState} from 'react';
import {locationKey,locationLabel,type BroadLocationPoint} from './location';
type LocationSuggestion=BroadLocationPoint&{locationSelectionToken:string};

// Locations use a searchable, keyboard-operated combobox because a fixed dropdown cannot cover place names.
// Only a selected structured suggestion changes the saved area; free text remains a search query.
export default function LocationEditor({accountId,form,setForm,me,busy,invalid=false,errorId,onPendingChange}:{accountId:string;form:any;setForm:(value:any)=>void;me:any;busy:boolean;invalid?:boolean;errorId?:string;onPendingChange?:(pending:boolean)=>void}){
 const inputId=useId(),listId=useId(),skipSearch=useRef(true),inputRef=useRef<HTMLInputElement>(null),detection=useRef(0),alive=useRef(true);
 const [query,setQuery]=useState(locationLabel(form)),[results,setResults]=useState<LocationSuggestion[]>([]),[searching,setSearching]=useState(false),[finding,setFinding]=useState(false),[locating,setLocating]=useState(false),[retry,setRetry]=useState(0),[message,setMessage]=useState(''),[connectionKey,setConnectionKey]=useState('');
 const locationTimer=useRef<ReturnType<typeof setTimeout>|null>(null),locationRequest=useRef<AbortController|null>(null);
 const [deviceMessage,setDeviceMessage]=useState(''),[openBrowser,setOpenBrowser]=useState(false);
 function cancelDetection(){detection.current++;if(locationTimer.current!==null){clearTimeout(locationTimer.current);locationTimer.current=null;}locationRequest.current?.abort();locationRequest.current=null;}
 const [activeOption,setActiveOption]=useState(-1),[suggestionsClosed,setSuggestionsClosed]=useState(false);
 const listVisible=results.length>0&&!suggestionsClosed;
 useEffect(()=>{setActiveOption(-1);setSuggestionsClosed(false);},[results]);
 useEffect(()=>{alive.current=true;onPendingChange?.(false);return()=>{alive.current=false;cancelDetection();};},[accountId]);
 function edit(){cancelDetection();setDeviceMessage('');setOpenBrowser(false);setLocating(false);setFinding(false);skipSearch.current=true;setQuery(locationLabel(form));setResults([]);setMessage('Type your city or area, then choose the matching suggestion.');setConnectionKey('');onPendingChange?.(false);inputRef.current?.focus();inputRef.current?.select();}
 const confirmed=!!me?.locationConfirmed&&locationKey(form)===locationKey(me)&&!form.confirmLocation;
 const selected=locationLabel(form),hasDistancePoint=typeof form.areaLat==='number'&&typeof form.areaLon==='number'&&!!form.locationPlaceId;
 useEffect(()=>{skipSearch.current=true;setQuery(selected);setResults([]);onPendingChange?.(false);},[selected]);

 useEffect(()=>{
  if(skipSearch.current){skipSearch.current=false;return;}
  const q=query.trim();if(q.length<2){setResults([]);setSearching(false);return;}
  const controller=new AbortController(),timer=setTimeout(async()=>{setSearching(true);try{const response=await fetch('/api/location?q='+encodeURIComponent(q)+'&expectedAccount='+encodeURIComponent(accountId),{signal:controller.signal,cache:'no-store'});const data:any=await response.json();if(controller.signal.aborted||!alive.current)return;if(!response.ok)throw Error(response.status>=500?'City suggestions are temporarily unavailable. Try again shortly. Your saved area has not changed.':data.error||'Place suggestions are unavailable.');setResults(data.suggestions||[]);setMessage(data.suggestions?.length?'':'No matching city or general area found. Try a nearby city or a more complete name.');}catch(e:any){if(e.name!=='AbortError'&&!controller.signal.aborted&&alive.current){setResults([]);setMessage(e.message||'Place suggestions are unavailable.');}}finally{if(!controller.signal.aborted&&alive.current)setSearching(false);}},400);
  return()=>{clearTimeout(timer);controller.abort();};
 },[query,accountId,retry]);

 function choose(place:LocationSuggestion){
  cancelDetection();setDeviceMessage('');setOpenBrowser(false);setLocating(false);setFinding(false);skipSearch.current=true;onPendingChange?.(false);
  const canConfirm=!!connectionKey&&locationKey(place)===connectionKey;
  setForm((previous:any)=>({...previous,city:place.city,region:place.region,country:place.country,areaLat:place.areaLat,areaLon:place.areaLon,locationPlaceId:place.locationPlaceId,locationSelectionToken:place.locationSelectionToken,confirmLocation:canConfirm}));
  setQuery(locationLabel(place));setResults([]);setActiveOption(-1);setSuggestionsClosed(true);setMessage(canConfirm?'Selected from place data. Save your profile to confirm this area from your connection.':'Selected from place data. Nearby matching uses this area point, not an exact home or live location.');
 }
 async function find(){
  if(finding)return;cancelDetection();setDeviceMessage('');setOpenBrowser(false);const ticket=detection.current;setFinding(true);setLocating(false);setMessage('');
  try{const response=await fetch('/api/app',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'connection_location',expectedAccount:accountId})});const data:any=await response.json();if(!alive.current||ticket!==detection.current)return;if(!response.ok)throw Error(data.error||'Your connection area could not be checked.');const key=locationKey(data.location);setConnectionKey(key);setQuery(locationLabel(data.location));onPendingChange?.(true);setMessage('Internet connections can point to another city. Search or choose a place yourself; your saved area has not changed.');}
  catch(e:any){if(alive.current&&ticket===detection.current){setConnectionKey('');setMessage(e.message||'Your connection area could not be checked.');}}
  finally{if(alive.current&&ticket===detection.current)setFinding(false);}
 }
 function locate(){
  if(locating||busy||locationTimer.current!==null)return;
  cancelDetection();setOpenBrowser(false);setFinding(false);setMessage('');
  const embedded=typeof window!=='undefined'&&window.self!==window.top;
  const native=typeof document!=='undefined'&&!!document.documentElement?.dataset.nativePlatform;
  const deniedMessage=native
   ?'Location permission was not granted. Enable location for Real Love in your phone settings, then try again. You can also type your city.'
   :'Location permission was not granted. Open this site’s browser permissions, allow Location, then try again. Check device Location Services too. You can also type your city.';
  if(globalThis.isSecureContext===false){setDeviceMessage('Location requires a secure browser page. Open Real Love in your browser or type your city.');setOpenBrowser(true);return;}
  // An embedding page can deny geolocation even when this origin allows it.
  const policy=typeof document!=='undefined'?(document as any).permissionsPolicy||(document as any).featurePolicy:null;
  try{if(policy?.allowsFeature('geolocation')===false){setDeviceMessage(embedded?'This embedded view blocks location permission. Open Real Love in your browser, then choose Use my current area.':'This page blocks location access. Open Real Love in your browser or type your city.');setOpenBrowser(true);return;}}catch{/* Some browsers do not expose policy inspection. Try the permission request below. */}
  if(!navigator.geolocation){setDeviceMessage('This browser does not provide location access. Open Real Love in another browser or type your city.');setOpenBrowser(true);return;}
  const ticket=detection.current;setLocating(true);setConnectionKey('');
  setDeviceMessage('Requesting location access… Allow Location in your browser or device prompt. If access is already allowed, finding your current area may take a moment.');
  // Browser timeouts do not cover waiting for a permission decision. Keep the UI recoverable.
  locationTimer.current=setTimeout(()=>{
   if(!alive.current||ticket!==detection.current)return;
   cancelDetection();setLocating(false);setOpenBrowser(embedded);
   setDeviceMessage('No location response yet. Check the permission prompt and browser or device location settings, then try again. You can also type your city.');
  },45000);
  function finish(){if(locationTimer.current!==null){clearTimeout(locationTimer.current);locationTimer.current=null;}locationRequest.current=null;setLocating(false);}
  function fail(error:{code?:number}){
   if(!alive.current||ticket!==detection.current)return;
   cancelDetection();setLocating(false);setResults([]);setOpenBrowser(embedded);
   setDeviceMessage(error.code===1?deniedMessage:error.code===3?'Location lookup timed out. Try again or type your city.':'Your current area could not be read. Check device Location Services, try again, or type your city.');
  }
  try{navigator.geolocation.getCurrentPosition(async position=>{
   if(!alive.current||ticket!==detection.current)return;
   const accuracy=position.coords.accuracy;
   if(Number.isFinite(accuracy)&&accuracy>10000){finish();setDeviceMessage('Your device supplied a rough location (about '+Math.round(accuracy/1000)+' km). Search for your city or retry from a device with better location accuracy. Your saved area has not changed.');return;}
   setDeviceMessage('Location received. Finding nearby cities…');
   const controller=new AbortController();locationRequest.current=controller;
   try{
    const lat=Math.round(position.coords.latitude*100)/100,lon=Math.round(position.coords.longitude*100)/100;
    const response=await fetch('/api/location',{method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify({action:'reverse',lat,lon,expectedAccount:accountId})});
    const data:any=await response.json();if(!alive.current||ticket!==detection.current)return;if(!response.ok)throw Error(data.error||'Your current area could not be identified.');
    const places=(data.suggestions?.length?data.suggestions:[data.suggestion]).filter(Boolean).filter((place:any)=>place?.locationSelectionToken) as LocationSuggestion[];if(!places.length)throw Error('No nearby places were found. Search for your city instead.');skipSearch.current=true;setQuery('');setResults(places);onPendingChange?.(true);setSuggestionsClosed(false);setActiveOption(-1);setDeviceMessage('Nearby places suggested'+(Number.isFinite(accuracy)?' · device accuracy about '+Math.max(1,Math.round(accuracy))+' metres':'')+'. Choose the correct area above, or type your city if these are wrong. Your saved area has not changed.');
   }catch(e:any){if(alive.current&&ticket===detection.current){setResults([]);setDeviceMessage(e.message||'Your current area could not be identified. Search for your city instead.');}}
   finally{if(alive.current&&ticket===detection.current)finish();}
  },fail,{enableHighAccuracy:true,timeout:20000,maximumAge:0});}catch{fail({});}
 }


 return <div className="location-editor">
  <div className="location-search"><label htmlFor={inputId}>City or general area (required)</label>
   <input ref={inputRef} id={inputId} data-profile-field="city" aria-invalid={invalid} aria-describedby={inputId+'-help'+(errorId?' '+errorId:'')} type="search" disabled={busy} autoComplete="off" maxLength={120} value={query} placeholder={selected||'Start typing a city, town, or general area'} role="combobox" aria-autocomplete="list" aria-expanded={listVisible} aria-controls={listVisible?listId:undefined} aria-activedescendant={listVisible&&activeOption>=0?listId+'-'+activeOption:undefined} onKeyDown={e=>{if(e.nativeEvent?.isComposing)return;if(e.key==='Escape'){e.preventDefault();setSuggestionsClosed(true);setActiveOption(-1);}else if((e.key==='ArrowDown'||e.key==='ArrowUp')&&results.length){e.preventDefault();setSuggestionsClosed(false);setActiveOption(i=>e.key==='ArrowDown'?(i+1)%results.length:(i<=0?results.length-1:i-1));}else if(e.key==='Enter'&&query.trim()){e.preventDefault();if(listVisible&&activeOption>=0)choose(results[activeOption]);else setMessage('Choose a suggested place with the arrow keys and Enter, or select it below.');}}} onChange={event=>{cancelDetection();setDeviceMessage('');setOpenBrowser(false);setLocating(false);setFinding(false);skipSearch.current=event.target.value.trim()===selected;setResults([]);setSearching(false);onPendingChange?.(event.target.value.trim()!==selected);setQuery(event.target.value);setActiveOption(-1);setSuggestionsClosed(false);setMessage('');setConnectionKey('');}}/>
   <p id={inputId+'-help'} className="field-help">Search for your city, then choose a matching suggestion. Only your general area appears on your profile, never a street address or live location.</p>
   {searching&&<span className="field-help" role="status">Finding real places…</span>}
   {listVisible&&<><p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{results.length} {results.length===1?'place suggestion':'place suggestions'} found. Use the arrow keys to review and Enter to choose.</p><div className="location-results" id={listId} role="listbox" aria-label="Location suggestions">{results.map((place,index)=><button id={listId+'-'+index} aria-selected={activeOption===index} onMouseEnter={()=>setActiveOption(index)} onMouseDown={e=>e.preventDefault()} type="button" role="option" key={place.locationPlaceId+locationKey(place)} disabled={busy} onClick={()=>choose(place)}><strong>{place.city}</strong><span>{[place.region,place.country].filter((x,i,a)=>i===0||x!==a[i-1]).join(', ')}</span></button>)}</div></>}
   {message&&<p className="field-help" role="status">{message}</p>}
   {!searching&&query.trim().length>=2&&query.trim()!==selected&&!results.length&&message&&<button type="button" className="text-button" disabled={busy} onClick={()=>setRetry(x=>x+1)}>Retry suggestions</button>}
  </div>
  {selected&&<div className="selected-location"><strong>{me&&locationKey(form)===locationKey(me)?'Saved area':'Selected area · save to apply'}</strong><span>{selected}</span><button type="button" className="text-button" disabled={busy} onClick={edit}>Change area</button><span className="field-help">{hasDistancePoint?'Linked to place data for nearby-distance matching. You can adjust the nearby radius in Discover.':'Older saved location. Search and reselect it to enable distance-based nearby matching.'}</span></div>}
  <details className="location-check location-device-options"><summary>Help me find my current area (optional)</summary><p className="field-help">With your permission, the browser can help identify your nearby city or general area. The app uses a rounded position to suggest nearby places. You choose the area to save; detection does not replace it automatically.</p><button type="button" className="secondary" aria-busy={locating} disabled={busy||locating} onClick={locate}>{locating?'Finding nearby area…':'Use my current area'}</button>{deviceMessage&&<p className="field-help" role="status">{deviceMessage}</p>}{openBrowser&&<a className="text-button" href="https://real-love-connections.fetes-rowboat-0k.chatgpt.site/#profile" target="_blank" rel="noopener noreferrer">Open Real Love in browser</a>}</details>
  <details className="signup-optional location-options"><summary>Internet connection estimate (optional)</summary><div className="location-check"><strong>{confirmed?'Area confirmed recently':form.confirmLocation?'Ready to confirm when you save':'Area confirmation optional'}</strong><p className="field-help">Confirmation compares your selected broad area with the approximate area of your current internet connection. It does not verify identity, residence, or an exact position.</p><button type="button" className="secondary" disabled={busy||finding} onClick={find}>{finding?'Checking connection…':'Estimate from internet connection'}</button></div>
</details>
  <p className="location-attribution field-help">Place suggestions: OpenStreetMap / Photon · city fallback: <a href="https://www.geonames.org/" target="_blank" rel="noopener noreferrer">GeoNames</a> (<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>). If your town is missing, try a nearby city. To find places, our server sends Photon (photon.komoot.io) your search text or the rounded position from “Use my current area”, never your name, email or account.</p>
 </div>;
}
