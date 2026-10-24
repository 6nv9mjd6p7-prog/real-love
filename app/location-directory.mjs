// Derived from GeoNames cities15000, CC BY 4.0. See data/cities-source.json.
// Imported only by the server when live geocoding is unavailable or has no result.
import cities from './data/cities.json' with {type:'json'};
/** @typedef {[number,string,string,string,number,number,number,string,string]} CityRow */
/** @type {CityRow[]} */
const rows=/** @type {CityRow[]} */(cities);
const normalize=value=>String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
/** @param {CityRow} row @returns {import('./location').BroadLocationPoint} */
const point=row=>({city:row[1],region:row[2],country:row[3],areaLat:row[4],areaLon:row[5],locationPlaceId:'geonames/'+row[0]});
/** @param {string} query @returns {import('./location').BroadLocationPoint[]} */
export function directorySearch(query){
 const q=normalize(query);if(q.length<2)return [];
 const terms=q.split(' ').map(term=>term==='uk'?'gb':term==='usa'?'us':term),matches=[];
 for(const row of rows){
  if(!terms.every(term=>row[8].includes(term)))continue;
  const name=normalize(row[1]),score=name===q?0:name.startsWith(q)?1:name.startsWith(terms[0])?2:3;
  matches.push({row,score});
 }
 matches.sort((a,b)=>a.score-b.score||b.row[6]-a.row[6]);
 const seen=new Set(),result=[];
 for(const {row} of matches){const key=[row[1],row[2],row[3]].join('|');if(seen.has(key))continue;seen.add(key);result.push(point(row));if(result.length===8)break;}
 return result;
}
/** @param {number} lat @param {number} lon @returns {import('./location').BroadLocationPoint[]} */
export function directoryReverse(lat,lon){
 if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)return [];
 const rad=n=>n*Math.PI/180,nearby=[];
 for(const row of rows){
  if(Math.abs(row[4]-lat)>.46)continue;
  const a=Math.sin(rad(row[4]-lat)/2)**2+Math.cos(rad(lat))*Math.cos(rad(row[4]))*Math.sin(rad(row[5]-lon)/2)**2;
  const km=6371*2*Math.atan2(Math.sqrt(a),Math.sqrt(Math.max(0,1-a)));
  if(km<=50)nearby.push({row,km});
 }
 nearby.sort((a,b)=>a.km-b.km);return nearby.slice(0,8).map(({row})=>point(row));
}
