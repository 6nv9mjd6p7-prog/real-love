import {locationKey,type BroadLocationPoint} from './location';

type PhotonFeature={geometry?:{coordinates?:unknown};properties?:Record<string,unknown>};
type PhotonResponse={features?:unknown};

const text=(value:unknown,max:number)=>typeof value==='string'?value.trim().replace(/\s+/g,' ').slice(0,max):'';
const number=(value:unknown)=>typeof value==='number'&&Number.isFinite(value)?value:null;
const broadPlaceValues=new Set(['city','town','village','hamlet','suburb','neighbourhood','quarter','locality','borough','district']);

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

export async function reverseBroadLocations(lat:number,lon:number){
 const make=(filtered:boolean)=>{const url=new URL('https://photon.komoot.io/reverse');url.searchParams.set('lat',String(lat));url.searchParams.set('lon',String(lon));url.searchParams.set('limit',filtered?'8':'12');url.searchParams.set('radius','50');url.searchParams.set('lang','en');if(filtered){url.searchParams.append('layer','city');url.searchParams.append('layer','locality');url.searchParams.append('layer','district');}return url;};
 let results:BroadLocationPoint[]=[];
 try{results=photonSuggestions(await photon(make(true)));}catch{}
 if(!results.length){try{results=photonSuggestions(await photon(make(false)),true);}catch{throw Error('Current-area lookup is temporarily unavailable. Try again.');}}
 if(!results.length)throw Error('We could not identify a nearby city or general area. Search for your area instead.');
 // Providers can order by place prominence. Sort candidate area points by distance instead.
 const distance=(p:BroadLocationPoint)=>{const rad=(n:number)=>n*Math.PI/180;const a=Math.sin(rad(p.areaLat-lat)/2)**2+Math.cos(rad(lat))*Math.cos(rad(p.areaLat))*Math.sin(rad(p.areaLon-lon)/2)**2;return 2*Math.atan2(Math.sqrt(a),Math.sqrt(Math.max(0,1-a)));};
 return results.sort((a,b)=>distance(a)-distance(b));
}

// Retain the single-result helper for callers that need a default; the editor offers all candidates.
export async function reverseBroadLocation(lat:number,lon:number){return (await reverseBroadLocations(lat,lon))[0];}
