'use client';
import {useEffect,useId,useRef,useState,useLayoutEffect} from 'react';
import {locationKey,locationLabel,type BroadLocationPoint} from './location';
type LocationForm=Omit<Partial<BroadLocationPoint>,'areaLat'|'areaLon'>&{areaLat?:number|null;areaLon?:number|null;confirmLocation?:boolean;locationSelectionToken?:string};
type PlaceResponse={error?:string;suggestions?:LocationSuggestion[];suggestion?:LocationSuggestion};
type PolicyDocument=Document&{permissionsPolicy?:{allowsFeature:(feature:string)=>boolean};featurePolicy?:{allowsFeature:(feature:string)=>boolean}};
type LocationSuggestion=BroadLocationPoint&{locationSelectionToken:string};

// Locations use a searchable, keyboard-operated combobox because a fixed dropdown cannot cover place names.
// Only a selected structured suggestion changes the saved area; free text remains a search query.
export default function LocationEditor<T extends LocationForm>({accountId,form,setForm,me,busy,onPendingChange}:{accountId:string;form:T;setForm:(value:T|((previous:T)=>T))=>void;me:(LocationForm&{locationConfirmed?:boolean})|null;busy:boolean;onPendingChange?:(pending:boolean)=>void}){
 const inputId=useId(),listId=useId(),skipSearch=useRef(true),inputRef=useRef<HTMLInputElement>(null),detection=useRef(0),alive=useRef(true),pendingCallback=useRef(onPendingChange);
 useLayoutEffect(()=>{pendingCallback.current=onPendingChange;},[onPendingChange]);
 const [query,setQuery]=useState(locationLabel(form)),[results,setResults]=useState<LocationSuggestion[]>([]),[searching,setSearching]=useState(false),[finding,setFinding]=useState(false),[locating,setLocating]=useState(false),[retry,setRetry]=useState(0),[message,setMessage]=useState(''),[connectionKey,setConnectionKey]=useState('');
 const placeSearch=useRef<{controller:AbortController;timer:ReturnType<typeof setTimeout>}|null>(null);
 function cancelSearch(){if(placeSearch.current){clearTimeout(placeSearch.current.timer);placeSearch.current.controller.abort();placeSearch.current=null;}}
 function searchQuery(value:string){if(value!==query||value.trim().length<2)cancelSearch();if(value.trim().length<2){setResults([]);setSearching(false);}setQuery(value);}
 const locationTimer=useRef<ReturnType<typeof setTimeout>|null>(null),locationRequest=useRef<AbortController|null>(null);
 const [deviceMessage,setDeviceMessage]=useState(''),[openBrowser,setOpenBrowser]=useState(false);
 function cancelDetection(){detection.current++;if(locationTimer.current!==null){clearTimeout(locationTimer.current);locationTimer.current=null;}locationRequest.current?.abort();locationRequest.current=null;}
 const [activeOption,setActiveOption]=useState(-1),[suggestionsClosed,setSuggestionsClosed]=useState(false);
 const [optionResults,setOptionResults]=useState(results);
 if(optionResults!==results){setOptionResults(results);setActiveOption(-1);setSuggestionsClosed(false);}
 const listVisible=results.length>0&&!suggestionsClosed;
 useEffect(()=>{alive.current=true;pendingCallback.current?.(false);return()=>{alive.current=false;cancelDetection();cancelSearch();};},[accountId]);
 function edit(){cancelDetection();cancelSearch();setSearching(false);setDeviceMessage('');setOpenBrowser(false);setLocating(false);setFinding(false);skipSearch.current=true;setQuery(locationLabel(form));setResults([]);setMessage('Type your city or area, then choose the matching suggestion.');setConnectionKey('');onPendingChange?.(false);inputRef.current?.focus();inputRef.current?.select();}
 const confirmed=!!me?.locationConfirmed&&locationKey(form)===locationKey(me)&&!form.confirmLocation;
 const selected=locationLabel(form),hasDistancePoint=typeof form.areaLat==='number'&&typeof form.areaLon==='number'&&!!form.locationPlaceId;
 const [selectedArea,setSelectedArea]=useState(selected);
 if(selectedArea!==selected){setSelectedArea(selected);setQuery(selected);setResults([]);}
 useEffect(()=>{skipSearch.current=true;pendingCallback.current?.(false);},[selected]);

 useEffect(()=>{
  if(skipSearch.current){skipSearch.current=false;return;}
  const q=query.trim();if(q.length<2)return;
  const controller=new AbortController(),timer=setTimeout(async()=>{setSearching(true);try{const response=await fetch('/api/location?q='+encodeURIComponent(q)+'&expectedAccount='+encodeURIComponent(accountId),{signal:controller.signal,cache:'no-store'});const data:PlaceResponse=await response.json();if(controller.signal.aborted||!alive.current)return;if(!response.ok)throw Error(data.error||'Place suggestions are unavailable.');setResults(data.suggestions||[]);setMessage(data.suggestions?.length?'':'No matching city or general area found. Try a nearby city or a more complete name.');}catch(e:unknown){if((e as Error).name!=='AbortError'&&!controller.signal.aborted&&alive.current){setResults([]);setMessage((e as Error).message||'Place suggestions are unavailable.');}}finally{if(!controller.signal.aborted&&alive.current)setSearching(false);}},400);
  placeSearch.current={controller,timer};
  return()=>{clearTimeout(timer);controller.abort();};
 },[query,accountId,retry]);

 function choose(place:LocationSuggestion){
  cancelDetection();cancelSearch();setSearching(false);setDeviceMessage('');setOpenBrowser(false);setLocating(false);setFinding(false);skipSearch.current=true;onPendingChange?.(false);
  const canConfirm=!!connectionKey&&locationKey(place)===connectionKey;
  setForm((previous:T)=>({...previous,city:place.city,region:place.region,country:place.country,areaLat:place.areaLat,areaLon:place.areaLon,locationPlaceId:place.locationPlaceId,locationSelectionToken:place.locationSelectionToken,confirmLocation:canConfirm}));
  setQuery(locationLabel(place));setResults([]);setActiveOption(-1);setSuggestionsClosed(true);setMessage(canConfirm?'Selected from place data. Save your profile to confirm this area from your connection.':'Selected from place data. Nearby matching uses this area point, not an exact home or live location.');
 }
 async function find(){
  if(finding)return;cancelDetection();setDeviceMessage('');setOpenBrowser(false);const ticket=detection.current;setFinding(true);setLocating(false);setMessage('');
  try{const response=await fetch('/api/app',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'connection_location',expectedAccount:accountId})});const data:{error?:string;location:Partial<BroadLocationPoint>}=await response.json();if(!alive.current||ticket!==detection.current)return;if(!response.ok)throw Error(data.error||'Your connection area could not be checked.');const key=locationKey(data.location);setConnectionKey(key);searchQuery(locationLabel(data.location));onPendingChange?.(true);setMessage('Internet connections can point to another city. Search or choose a place yourself; your saved area has not changed.');}
  catch(e:unknown){if(alive.current&&ticket===detection.current){setConnectionKey('');setMessage((e as Error).message||'Your connection area could not be checked.');}}
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
  const policy=typeof document!=='undefined'?(document as PolicyDocument).permissionsPolicy||(document as PolicyDocument).featurePolicy:null;
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
    const data:PlaceResponse=await response.json();if(!alive.current||ticket!==detection.current)return;if(!response.ok)throw Error(data.error||'Your current area could not be identified.');
    const places=(data.suggestions?.length?data.suggestions:[data.suggestion]).filter(Boolean).filter((place:LocationSuggestion|undefined)=>place?.locationSelectionToken) as LocationSuggestion[];if(!places.length)throw Error('No nearby places were found. Search for your city instead.');cancelSearch();setSearching(false);skipSearch.current=true;setQuery('');setResults(places);onPendingChange?.(true);setSuggestionsClosed(false);setActiveOption(-1);setDeviceMessage('Nearby places suggested'+(Number.isFinite(accuracy)?' · device accuracy about '+Math.max(1,Math.round(accuracy))+' metres':'')+'. Choose the correct area above, or type your city if these are wrong. Your saved area has not changed.');
   }catch(e:unknown){if(alive.current&&ticket===detection.current){setResults([]);setDeviceMessage((e as Error).message||'Your current area could not be identified. Search for your city instead.');}}
   finally{if(alive.current&&ticket===detection.current)finish();}
  },fail,{enableHighAccuracy:true,timeout:20000,maximumAge:0});}catch{fail({});}
 }


 return <div className="location-editor">
  <div className="location-search"><label htmlFor={inputId}>City or general area (required)</label>
   <input ref={inputRef} id={inputId} data-profile-field="city" aria-describedby={inputId+'-help'} type="search" disabled={busy} autoComplete="off" maxLength={120} value={query} placeholder={selected||'Start typing a city, town, or general area'} role="combobox" aria-autocomplete="list" aria-expanded={listVisible} aria-controls={listVisible?listId:undefined} aria-activedescendant={listVisible&&activeOption>=0?listId+'-'+activeOption:undefined} onKeyDown={e=>{if(e.nativeEvent?.isComposing)return;if(e.key==='Escape'){e.preventDefault();setSuggestionsClosed(true);setActiveOption(-1);}else if((e.key==='ArrowDown'||e.key==='ArrowUp')&&results.length){e.preventDefault();setSuggestionsClosed(false);setActiveOption(i=>e.key==='ArrowDown'?(i+1)%results.length:(i<=0?results.length-1:i-1));}else if(e.key==='Enter'&&query.trim()){e.preventDefault();if(listVisible&&activeOption>=0)choose(results[activeOption]);else setMessage('Choose a suggested place with the arrow keys and Enter, or select it below.');}}} onChange={event=>{cancelDetection();setDeviceMessage('');setOpenBrowser(false);setLocating(false);setFinding(false);skipSearch.current=false;onPendingChange?.(event.target.value.trim()!==selected);searchQuery(event.target.value);setActiveOption(-1);setSuggestionsClosed(false);setMessage('');setConnectionKey('');}}/>
   <p id={inputId+'-help'} className="field-help">Type your city in the box above, then choose a matching suggestion. Search text alone does not change your saved area.</p>
   {searching&&<span className="field-help" role="status">Finding real places…</span>}
   {listVisible&&<div className="location-results" id={listId} role="listbox" aria-label="Location suggestions">{results.map((place,index)=><button id={listId+'-'+index} aria-selected={activeOption===index} onMouseEnter={()=>setActiveOption(index)} onMouseDown={e=>e.preventDefault()} type="button" role="option" key={place.locationPlaceId+locationKey(place)} disabled={busy} onClick={()=>choose(place)}><strong>{place.city}</strong><span>{[place.region,place.country].filter((x,i,a)=>i===0||x!==a[i-1]).join(', ')}</span></button>)}</div>}
   {message&&<p className="field-help" role="status">{message}</p>}
   {!searching&&query.trim().length>=2&&!results.length&&message&&<button type="button" className="text-button" disabled={busy} onClick={()=>setRetry(x=>x+1)}>Retry suggestions</button>}
  </div>
  {selected&&<div className="selected-location"><strong>{me&&locationKey(form)===locationKey(me)?'Saved area':'Selected area · save to apply'}</strong><span>{selected}</span><button type="button" className="text-button" disabled={busy} onClick={edit}>Change area</button><span className="field-help">{hasDistancePoint?'Linked to place data for nearby-distance matching. You can adjust the nearby radius in Discover.':'Older saved location. Search and reselect it to enable distance-based nearby matching.'}</span></div>}
  <div className="location-check"><strong>Use my current area (optional)</strong><p className="field-help">With your permission, the browser can help identify your nearby city or general area. The app uses a rounded position to suggest nearby places. You choose the area to save; detection does not replace it automatically.</p><button type="button" className="secondary" aria-busy={locating} disabled={busy||locating} onClick={locate}>{locating?'Finding nearby area…':'Use my current area'}</button>{deviceMessage&&<p className="field-help" role="status">{deviceMessage}</p>}{openBrowser&&<a className="text-button" href="https://real-love-connections.fetes-rowboat-0k.chatgpt.site/#profile" target="_blank" rel="noopener noreferrer">Open Real Love in browser</a>}</div>
  <details className="signup-optional location-options"><summary>Internet connection estimate (optional)</summary><div className="location-check"><strong>{confirmed?'Area confirmed recently':form.confirmLocation?'Ready to confirm when you save':'Area confirmation optional'}</strong><p className="field-help">Confirmation compares your selected broad area with the approximate area of your current internet connection. It does not verify identity, residence, or an exact position.</p><button type="button" className="secondary" disabled={busy||finding} onClick={find}>{finding?'Checking connection…':'Estimate from internet connection'}</button></div>
</details>
  <p className="location-attribution field-help">Place suggestions © OpenStreetMap contributors · powered by Photon.</p>
 </div>;
}
