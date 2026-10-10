import {getChatGPTUser} from '../../chatgpt-auth';
import {initializeAccount,quota,safetyHeaders,failure} from '../../safety';
import {searchBroadLocations} from '../../location-search';

export async function GET(req:Request){
 try{
  const user=await getChatGPTUser();if(!user)return Response.json({error:'Sign in to continue.'},{status:401,headers:safetyHeaders});
  const url=new URL(req.url),expected=url.searchParams.get('expectedAccount');if(expected&&expected!==user.userId)return Response.json({error:'Your signed-in account changed. Refresh before continuing.'},{status:409,headers:safetyHeaders});
  const query=(url.searchParams.get('q')||'').trim();if(query.length<3)return Response.json({suggestions:[]},{headers:safetyHeaders});if(query.length>120)return Response.json({error:'Search for a city or general area using 120 characters or fewer.'},{status:400,headers:safetyHeaders});
  await initializeAccount(user);await quota(user.userId,'location_search',30,60);
  return Response.json({suggestions:await searchBroadLocations(query)},{headers:safetyHeaders});
 }catch(error){return failure(error);}
}
