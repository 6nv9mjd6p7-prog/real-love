export type BroadLocation={city:string;region:string;country:string};

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

export function locationLabel(value:Partial<BroadLocation>){return [value.city,value.region,value.country].map(x=>typeof x==='string'?x.trim():'').filter(Boolean).join(', ');}

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
