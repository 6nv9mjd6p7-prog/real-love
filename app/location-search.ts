/**
 * Translates Photon geocoding responses into bounded city/region/country suggestions. Filters out unsuitable results and limits provider requests.
 * Reading guide: docs/CODE_READING_GUIDE.md.
 */
import {locationKey,type BroadLocationPoint} from './location';

type PhotonFeature={geometry?:{coordinates?:unknown};properties?:Record<string,unknown>};
type PhotonResponse={features?:unknown};

const text=(value:unknown,max:number)=>typeof value==='string'?value.trim().replace(/\s+/g,' ').slice(0,max):'';
const number=(value:unknown)=>typeof value==='number'&&Number.isFinite(value)?value:null;
const broadPlaceValues=new Set(['city','town','village','hamlet','suburb','neighbourhood','quarter','locality','borough','district']);

// Validate provider-shaped input and keep bounded broad-place fields; do not pass the raw provider response to clients.
export function photonSuggestions(payload:unknown,requireBroadPlace=false):BroadLocationPoint[]{
 const features=Array.isArray((payload as PhotonResponse)?.features)?(payload as {features:PhotonFeature[]}).features:[];
 const results:BroadLocationPoint[]=[],seen=new Set<string>();
 for(const feature of features){
  const p=feature?.properties??{},coordinates=feature?.geometry?.coordinates;
  if(requireBroadPlace&&(text(p.osm_key,24)!=='place'||!broadPlaceValues.has(text(p.osm_value,32).toLowerCase())))continue;
  if(!Array.isArray(coordinates)||coordinates.length<2)continue;
  const lon=number(coordinates[0]),lat=number(coordinates[1]);if(lat===null||lon===null||lat<-90||lat>90||lon<-180||lon>180)continue;
  const city=text(p.name||p.city||p.locality||p.district,60),country=text(p.country,80),region=text(p.state||p.county||p.region||p.country,80);
  if(!city||!region||!country)continue;
  const key=locationKey({city,region,country});if(!key||seen.has(key))continue;seen.add(key);
  const osmType=text(p.osm_type,12),osmId=typeof p.osm_id==='number'||typeof p.osm_id==='string'?String(p.osm_id):'';
  results.push({city,region,country,areaLat:Math.round(lat*10000)/10000,areaLon:Math.round(lon*10000)/10000,locationPlaceId:osmType&&osmId?osmType+'/'+osmId:key});
  if(results.length>=8)break;
 }
 return results;
}

// Wrap provider fetches with bounded network behavior and error handling.
async function photon(url:URL){
 const response=await fetch(url,{headers:{Accept:'application/geo+json','Accept-Language':'en'},signal:AbortSignal.timeout(5000)});
 if(!response.ok){await response.body?.cancel();throw Error('Place search is unavailable.');}
 return await response.json();
}
function searchUrl(query:string,filtered=true){
 const url=new URL('https://photon.komoot.io/api');url.searchParams.set('q',query);url.searchParams.set('limit',filtered?'8':'12');url.searchParams.set('lang','en');
 if(filtered){url.searchParams.append('layer','city');url.searchParams.append('layer','locality');url.searchParams.append('layer','district');}
 return url;
}

const cache=new Map<string,{until:number;results:BroadLocationPoint[]}>();
// Search broad places first and use the defined fallback when the filtered search has no useful suggestions.
export async function searchBroadLocations(query:string){
 const q=query.trim().replace(/\s+/g,' ').slice(0,120);if(q.length<2)return [];
 const key=q.toLocaleLowerCase();const existing=cache.get(key);if(existing&&existing.until>Date.now())return existing.results;
 let results:BroadLocationPoint[]=[];
 try{results=photonSuggestions(await photon(searchUrl(q,true)));}catch{}
 if(!results.length){
  try{results=photonSuggestions(await photon(searchUrl(q,false)),true);}
  catch{throw Error('Place suggestions are temporarily unavailable. Try again.');}
 }
 if(results.length){cache.set(key,{until:Date.now()+6*60*60*1000,results});if(cache.size>200)cache.delete(cache.keys().next().value as string);}
 return results;
}

// Resolve device coordinates to a broad selectable place instead of saving the exact device location.
export async function reverseBroadLocation(lat:number,lon:number){
 const make=(filtered:boolean)=>{const url=new URL('https://photon.komoot.io/reverse');url.searchParams.set('lat',String(lat));url.searchParams.set('lon',String(lon));url.searchParams.set('limit',filtered?'8':'12');url.searchParams.set('radius','50');url.searchParams.set('lang','en');if(filtered){url.searchParams.append('layer','city');url.searchParams.append('layer','locality');url.searchParams.append('layer','district');}return url;};
 let results:BroadLocationPoint[]=[];
 try{results=photonSuggestions(await photon(make(true)));}catch{}
 if(!results.length){try{results=photonSuggestions(await photon(make(false)),true);}catch{throw Error('Current-area lookup is temporarily unavailable. Try again.');}}
 if(!results.length)throw Error('We could not identify a nearby city or general area. Search for your area instead.');
 return results[0];
}
