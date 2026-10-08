import {env} from 'cloudflare:workers';
import {headers} from 'next/headers';
import {SafetyError,db} from './safety';
export const SESSION_COOKIE='__Host-real-love-session';
const SESSION_SECONDS=7*86400;
export function emailAuthConfig(){
 if(!env.SUPABASE_URL||!env.SUPABASE_PUBLISHABLE_KEY)return null;
 const u=new URL(env.SUPABASE_URL);
 if(u.protocol!=='https:'||!u.hostname.endsWith('.supabase.co')||u.username||u.password||u.port||u.search||u.hash||!['','/'].includes(u.pathname))throw new SafetyError('Email sign-in is unavailable.',503);
 return {origin:u.origin,key:env.SUPABASE_PUBLISHABLE_KEY};
}
export async function digest(value:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(x=>x.toString(16).padStart(2,'0')).join('');}
export function readSessionToken(cookie:string|null){
 const value=cookie?.split(';').map(x=>x.trim()).find(x=>x.startsWith(SESSION_COOKIE+'='))?.slice(SESSION_COOKIE.length+1);
 return value&&/^[a-f0-9]{64}$/.test(value)?value:null;
}
export function sessionCookie(token:string,maxAge=SESSION_SECONDS){return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;}
export async function getEmailUser(){
 const config=emailAuthConfig();if(!config)return null;
 const token=readSessionToken((await headers()).get('cookie'));if(!token)return null;
 const row=await db().prepare('SELECT member,email FROM auth_sessions WHERE token_hash=? AND provider=? AND expires>?').bind(await digest(token),config.origin,new Date().toISOString()).first<any>();
 return row?{userId:row.member,email:row.email,displayName:row.email,fullName:null}:null;
}
export async function providerRequest(path:string,body?:unknown,accessToken?:string){
 const config=emailAuthConfig();if(!config)throw new SafetyError('Email sign-in is not connected yet.',503);
 let response:Response;
 try{response=await fetch(config.origin+'/auth/v1/'+path,{method:body===undefined?'GET':'POST',headers:{apikey:config.key,...(accessToken?{Authorization:'Bearer '+accessToken}:{}),...(body===undefined?{}:{'Content-Type':'application/json'})},...(body===undefined?{}:{body:JSON.stringify(body)}),redirect:'manual',signal:AbortSignal.timeout(10000)});}catch{throw new SafetyError('The sign-in service could not be reached. Please try again.',503);}
 if(!response.ok){await response.body?.cancel();throw new SafetyError(response.status===429?'Please wait before requesting or entering another code.':path==='verify'?'That code is invalid or expired. Request a new code.':'Email sign-in is unavailable. Please try again later.',response.status===429?429:path==='verify'?400:503);}
 return response.status===204?{}:await response.json() as any;
}
export async function createEmailSession(user:any,legacy:{userId:string;email:string}|null){
 const config=emailAuthConfig();if(!config)throw new SafetyError('Email sign-in is unavailable.',503);
 if(!user?.email_confirmed_at||typeof user.email!=='string'||typeof user.id!=='string'||!/^[a-f0-9-]{36}$/i.test(user.id))throw new SafetyError('A verified email account is required.',401);
 const email=user.email.toLowerCase(),identity=config.origin+':'+user.id;
 if(legacy&&legacy.email.toLowerCase()!==email)throw new SafetyError('Use the same email as your existing account to keep its profile and conversations.',409);
 const existing=await db().prepare('SELECT member FROM auth_identities WHERE provider_id=?').bind(identity).first<any>();
 const member=legacy?.userId||existing?.member||'email:'+await digest(identity);
 if(existing&&existing.member!==member)throw new SafetyError('This email sign-in is already linked to a different member.',409);
 const memberIdentity=await db().prepare('SELECT provider_id FROM auth_identities WHERE member=?').bind(member).first<any>();
 if(memberIdentity&&memberIdentity.provider_id!==identity)throw new SafetyError('This member already has a different email sign-in.',409);
 await db().prepare('INSERT OR IGNORE INTO auth_identities (provider_id,member,created) VALUES (?,?,?)').bind(identity,member,new Date().toISOString()).run();
 const mapped=await db().prepare('SELECT member FROM auth_identities WHERE provider_id=?').bind(identity).first<any>();
 if(mapped?.member!==member)throw new SafetyError('Account linking changed. Please try again.',409);
 const bytes=crypto.getRandomValues(new Uint8Array(32));const token=Array.from(bytes).map(x=>x.toString(16).padStart(2,'0')).join('');
 await db().batch([db().prepare('DELETE FROM auth_sessions WHERE expires<=?').bind(new Date().toISOString()),db().prepare('INSERT INTO auth_sessions (token_hash,member,email,provider,expires) VALUES (?,?,?,?,?)').bind(await digest(token),member,email,config.origin,new Date(Date.now()+SESSION_SECONDS*1000).toISOString())]);
 return {token,member};
}
