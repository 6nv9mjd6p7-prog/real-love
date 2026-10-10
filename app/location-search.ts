import {locationKey,type BroadLocationPoint} from './location';

type PhotonFeature={geometry?:{coordinates?:unknown};properties?:Record<string,unknown>};
type PhotonResponse={features?:unknown};

const text=(value:unknown,max:number)=>typeof value==='string'?value.trim().replace(/\s+/g,' ').slice(0,max):'';
const number=(value:unknown)=>typeof value==='number'&&Number.isFinite(value)?value:null;

export function photonSuggestions(payload:unknown):BroadLocationPoint[]{
 const features=Array.isArray((payload as PhotonResponse)?.features)?(payload as {features:PhotonFeature[]}).features:[];
 const results:BroadLocationPoint[]=[],seen=new Set<string>();
 for(const feature of features){
  const p=feature?.properties??{},coordinates=feature?.geometry?.coordinates;
  if(!Array.isArray(coordinates)||coordinates.length<2)continue;
  const lon=number(coordinates[0]),lat=number(coordinates[1]);if(lat===null||lon===null||lat<-90||lat>90||lon<-180||lon>180)continue;
  const city=text(p.name||p.city,60),country=text(p.country,80),region=text(p.state||p.county||p.region||p.country,80);
  if(!city||!region||!country)continue;
  const key=locationKey({city,region,country});if(!key||seen.has(key))continue;seen.add(key);
  const osmType=text(p.osm_type,12),osmId=typeof p.osm_id==='number'||typeof p.osm_id==='string'?String(p.osm_id):'';
  results.push({city,region,country,areaLat:Math.round(lat*10000)/10000,areaLon:Math.round(lon*10000)/10000,locationPlaceId:osmType&&osmId?osmType+'/'+osmId:key});
  if(results.length>=8)break;
 }
 return results;
}

const cache=new Map<string,{until:number;results:BroadLocationPoint[]}>();
export async function searchBroadLocations(query:string){
 const q=query.trim().replace(/\s+/g,' ').slice(0,120);if(q.length<3)return [];
 const key=q.toLocaleLowerCase();const existing=cache.get(key);if(existing&&existing.until>Date.now())return existing.results;
 const url=new URL('https://photon.komoot.io/api');url.searchParams.set('q',q);url.searchParams.set('limit','8');url.searchParams.append('layer','city');url.searchParams.append('layer','locality');
 const response=await fetch(url,{headers:{Accept:'application/geo+json','Accept-Language':'en'},signal:AbortSignal.timeout(5000)});
 if(!response.ok){await response.body?.cancel();throw Error('Place search is unavailable.');}
 const results=photonSuggestions(await response.json());cache.set(key,{until:Date.now()+6*60*60*1000,results});
 if(cache.size>200)cache.delete(cache.keys().next().value as string);
 return results;
}
