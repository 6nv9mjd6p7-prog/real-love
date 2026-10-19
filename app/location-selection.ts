import {db} from './safety';
import {locationKey,type BroadLocationPoint} from './location';

// A place point is issued by the server after Photon returns it. The browser can
// display the point, but cannot create a usable selection for arbitrary coordinates.
const lifetimeMs=15*60*1000;
const validPoint=(value:any):BroadLocationPoint|null=>{
 if(!value||typeof value.city!=='string'||typeof value.region!=='string'||typeof value.country!=='string'||typeof value.locationPlaceId!=='string'||typeof value.areaLat!=='number'||typeof value.areaLon!=='number'||!Number.isFinite(value.areaLat)||!Number.isFinite(value.areaLon)||value.areaLat<-90||value.areaLat>90||value.areaLon<-180||value.areaLon>180||!locationKey(value))return null;
 return {city:value.city,region:value.region,country:value.country,areaLat:value.areaLat,areaLon:value.areaLon,locationPlaceId:value.locationPlaceId};
};

export async function issueLocationSelection(member:string,point:BroadLocationPoint){
 const token=crypto.randomUUID(),expires=new Date(Date.now()+lifetimeMs).toISOString();
 await db().batch([
  db().prepare('DELETE FROM location_selections WHERE member=? AND expires<?').bind(member,new Date().toISOString()),
  db().prepare('INSERT INTO location_selections (token,member,place,expires) VALUES (?,?,?,?)').bind(token,member,JSON.stringify(point),expires)
 ]);
 return token;
}

export async function takeLocationSelection(member:string,token:string){
 if(!token||token.length>100)return null;
 const now=new Date().toISOString();
 const row=await db().prepare('SELECT place FROM location_selections WHERE token=? AND member=? AND expires>?').bind(token,member,now).first<any>();
 if(!row)return null;
 await db().prepare('DELETE FROM location_selections WHERE token=? AND member=?').bind(token,member).run();
 return validPoint(JSON.parse(row.place));
}
