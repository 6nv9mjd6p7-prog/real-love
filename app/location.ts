export type BroadLocation={city:string;region:string;country:string};
export type BroadLocationPoint=BroadLocation&{areaLat:number;areaLon:number;locationPlaceId:string};
export const MAX_NEARBY_MILES=100;

const fold=(value:unknown)=>typeof value==='string'?value.normalize('NFKD').replace(/\p{M}/gu,'').trim().replace(/\s+/g,' ').toLowerCase():'';

export function locationKey(value:Partial<BroadLocation>){
 const city=fold(value.city),region=fold(value.region),country=fold(value.country);
 return city&&region&&country?[city,region,country].join('|'):'';
}

export function legacyAreaKey(value:{city?:string}){return fold(value.city);}

export function sameBroadArea(a:Partial<BroadLocation>,b:Partial<BroadLocation>){
 const left=locationKey(a),right=locationKey(b);
 if(left&&right)return left===right;
 return !!legacyAreaKey(a)&&legacyAreaKey(a)===legacyAreaKey(b);
}

export function locationLabel(value:Partial<BroadLocation>){
 const parts=[value.city,value.region,value.country].map(x=>typeof x==='string'?x.trim():'').filter(Boolean);
 return parts.filter((x,i)=>i===0||fold(x)!==fold(parts[i-1])).join(', ');
}

const point=(value:{areaLat?:unknown;areaLon?:unknown})=>typeof value.areaLat==='number'&&Number.isFinite(value.areaLat)&&value.areaLat>=-90&&value.areaLat<=90&&typeof value.areaLon==='number'&&Number.isFinite(value.areaLon)&&value.areaLon>=-180&&value.areaLon<=180?[value.areaLat,value.areaLon] as const:null;
export function locationDistanceMiles(a:{areaLat?:unknown;areaLon?:unknown},b:{areaLat?:unknown;areaLon?:unknown}){
 const left=point(a),right=point(b);if(!left||!right)return null;
 const rad=(n:number)=>n*Math.PI/180,dLat=rad(right[0]-left[0]),dLon=rad(right[1]-left[1]),lat1=rad(left[0]),lat2=rad(right[0]);
 const h=Math.sin(dLat/2)**2+Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
 return 3958.7613*2*Math.asin(Math.min(1,Math.sqrt(h)));
}
export function withinMiles(a:Partial<BroadLocation>&{areaLat?:unknown;areaLon?:unknown},b:Partial<BroadLocation>&{areaLat?:unknown;areaLon?:unknown},miles:number){
 const distance=locationDistanceMiles(a,b);return distance===null?sameBroadArea(a,b):distance<=miles;
}

export function connectionLocation(req:Request):BroadLocation|null{
 const cf=(req as Request&{cf?:{city?:unknown;region?:unknown;regionCode?:unknown;country?:unknown}}).cf;
 const text=(value:unknown,max:number)=>typeof value==='string'?value.trim().slice(0,max):'';
 const city=text(cf?.city,60),region=text(cf?.region,80)||text(cf?.regionCode,20),code=text(cf?.country,2).toUpperCase();
 let country=code;
 try{country=code?new Intl.DisplayNames(['en'],{type:'region'}).of(code)||code:'';}catch{}
 return city&&region&&country?{city,region,country}:null;
}

export function locationIsConfirmed(value:Partial<BroadLocation>&{locationConfirmationKey?:string;locationConfirmedAt?:string},now=Date.now()){
 const time=Date.parse(value.locationConfirmedAt||'');
 return !!locationKey(value)&&value.locationConfirmationKey===locationKey(value)&&Number.isFinite(time)&&time<=now&&time>=now-90*86400000;
}

// Deliberately copies only a display area, never profile coordinates or location confirmation.
export function broadArea(value:unknown):BroadLocation|null{
 if(!value||typeof value!=='object'||Array.isArray(value))return null;
 const source=value as Record<string,unknown>;
 const field=(key:string,max:number)=>typeof source[key]==='string'?source[key].trim().replace(/\s+/g,' ').slice(0,max):'';
 const city=field('city',60),region=field('region',80),country=field('country',80);
 return city&&region&&country?{city,region,country}:null;
}


export const CIRCLE_DISTANCE_CHOICES=[5,10,25,50,100] as const;
// Resolve a public area label to a provider area point, never a member's device position.
export function circleAreaPoint(area:BroadLocation,suggestions:BroadLocationPoint[]){
 const candidate=suggestions.find(p=>locationKey(p)===locationKey(area)&&point(p));
 return candidate?{areaLat:Math.round(candidate.areaLat*100)/100,areaLon:Math.round(candidate.areaLon*100)/100}:null;
}
export function circleDistanceBand(viewer:{areaLat?:unknown;areaLon?:unknown},areaPoint:{areaLat?:unknown;areaLon?:unknown}|null){
 const distance=areaPoint?locationDistanceMiles(viewer,areaPoint):null;
 return distance===null?null:Math.max(5,Math.ceil(distance/5)*5);
}
