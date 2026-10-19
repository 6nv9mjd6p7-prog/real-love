import {getChatGPTUser} from '../../chatgpt-auth';
import {initializeAccount,quota,readInput,safetyHeaders,failure} from '../../safety';
import {reverseBroadLocations,searchBroadLocations} from '../../location-search';
import {issueLocationSelection} from '../../location-selection';

async function selections(member:string,places:any[]){return await Promise.all(places.map(async place=>({...place,locationSelectionToken:await issueLocationSelection(member,place)})));}

async function userForLocation(){
 const user=await getChatGPTUser();if(!user)throw Object.assign(Error('Sign in to continue.'),{status:401});
 await initializeAccount(user);return user;
}
export async function GET(req:Request){
 try{
  const user=await userForLocation();
  const url=new URL(req.url),expected=url.searchParams.get('expectedAccount');if(expected&&expected!==user.userId)return Response.json({error:'Your signed-in account changed. Refresh before continuing.'},{status:409,headers:safetyHeaders});
  const query=(url.searchParams.get('q')||'').trim();if(query.length<2)return Response.json({suggestions:[]},{headers:safetyHeaders});if(query.length>120)return Response.json({error:'Search for a city or general area using 120 characters or fewer.'},{status:400,headers:safetyHeaders});
  await quota(user.userId,'location_search',30,60);
  return Response.json({suggestions:await selections(user.userId,await searchBroadLocations(query))},{headers:safetyHeaders});
 }catch(error:any){if(error?.status===401)return Response.json({error:error.message},{status:401,headers:safetyHeaders});return failure(error);}
}
export async function POST(req:Request){
 try{
  const user=await userForLocation(),input=await readInput(req);
  if(input.expectedAccount&&input.expectedAccount!==user.userId)return Response.json({error:'Your signed-in account changed. Refresh before continuing.'},{status:409,headers:safetyHeaders});
  if(input.action!=='reverse')return Response.json({error:'Unknown location action.'},{status:400,headers:safetyHeaders});
  const lat=typeof input.lat==='number'&&Number.isFinite(input.lat)?input.lat:NaN,lon=typeof input.lon==='number'&&Number.isFinite(input.lon)?input.lon:NaN;
  if(lat<-90||lat>90||lon<-180||lon>180||!Number.isFinite(lat)||!Number.isFinite(lon))return Response.json({error:'Location coordinates are invalid.'},{status:400,headers:safetyHeaders});
  await quota(user.userId,'location_reverse',10,60);
  const coarseLat=Math.round(lat*100)/100,coarseLon=Math.round(lon*100)/100;
  // Return provider area points, not the member's rounded device position, for profile matching.
  const suggestions=await selections(user.userId,await reverseBroadLocations(coarseLat,coarseLon));return Response.json({suggestion:suggestions[0],suggestions},{headers:safetyHeaders});
 }catch(error:any){if(error?.status===401)return Response.json({error:error.message},{status:401,headers:safetyHeaders});return failure(error);}
}
