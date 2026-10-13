/**
 * Email code request, verification, linking, and logout endpoint. Same-origin requests and session handling protect account mutations.
 * Reading guide: docs/CODE_READING_GUIDE.md.
 */
import {getLegacyUser} from '../../chatgpt-auth';
import {createEmailSession,digest,providerRequest,readSessionToken,sessionCookie} from '../../email-auth';
import {db,quota,readInput,failure,safetyHeaders,SafetyError} from '../../safety';
export async function POST(req:Request){try{
 const input=await readInput(req);
 if(input.action==='logout'){
  const token=readSessionToken(req.headers.get('cookie'));if(token)await db().prepare('DELETE FROM auth_sessions WHERE token_hash=?').bind(await digest(token)).run();
  return Response.json({ok:true},{headers:{...safetyHeaders,'Set-Cookie':sessionCookie('',0)}});
 }
 const email=typeof input.email==='string'?input.email.trim().toLowerCase():'';
 if(email.length>254||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new SafetyError('Enter a valid email address.',400);
 if(!['send','verify'].includes(input.action))throw new SafetyError('Unknown sign-in action.',400);
 const actor='auth:'+await digest(email),ip='auth-ip:'+await digest(req.headers.get('cf-connecting-ip')||'unavailable');
 await quota(ip,'auth_'+input.action,input.action==='send'?10:30,3600);
 await quota(actor,'auth_'+input.action,input.action==='send'?1:8,input.action==='send'?60:600);
 const legacy=await getLegacyUser();
 if(input.link){if(!legacy||input.expectedLegacy!==legacy.userId)throw new SafetyError('Your existing account changed. Sign in again before linking it.',409);if(legacy.email.toLowerCase()!==email)throw new SafetyError('Use the same email as your existing account.',409);}
 if(input.action==='send'){await providerRequest('otp',{email,create_user:true});return Response.json({ok:true},{headers:safetyHeaders});}
 if(typeof input.code!=='string'||!/^\d{6,8}$/.test(input.code))throw new SafetyError('Enter the code from your email.',400);
 const verified=await providerRequest('verify',{email,token:input.code,type:'email'});
 if(!verified.access_token||typeof verified.access_token!=='string')throw new SafetyError('The sign-in service returned an incomplete response.',503);
 // Verify the authenticated user directly with the provider; never trust browser claims.
 const user=await providerRequest('user',undefined,verified.access_token);
 if(user.email?.toLowerCase()!==email)throw new SafetyError('The verified account does not match this email.',401);
 const session=await createEmailSession(user,input.link?legacy:null);
 return Response.json({ok:true},{headers:{...safetyHeaders,'Set-Cookie':sessionCookie(session.token)}});
 }catch(e){return failure(e);}}
