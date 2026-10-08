// RFC 8292 VAPID. Empty push payloads keep private content off push providers.
export function base64url(bytes:Uint8Array){return btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');}
export function validPushEndpoint(endpoint:unknown):endpoint is string{
 if(typeof endpoint!=='string'||endpoint.length>2048)return false;
 try{const url=new URL(endpoint);return url.protocol==='https:'&&!url.username&&!url.password&&!url.port&&['web.push.apple.com','fcm.googleapis.com','updates.push.services.mozilla.com'].includes(url.hostname)&&url.pathname.length>1;}catch{return false;}
}
export async function vapidAuthorization(endpoint:string,privateJwk:string,publicKey:string){
 const encode=(x:unknown)=>base64url(new TextEncoder().encode(JSON.stringify(x)));
 const jwt=encode({typ:'JWT',alg:'ES256'})+'.'+encode({aud:new URL(endpoint).origin,exp:Math.floor(Date.now()/1000)+3600,sub:'https://real-love-connections.fetes-rowboat-0k.chatgpt.site'});
 const key=await crypto.subtle.importKey('jwk',JSON.parse(privateJwk),{name:'ECDSA',namedCurve:'P-256'},false,['sign']);
 const signature=await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},key,new TextEncoder().encode(jwt));
 return 'vapid t='+jwt+'.'+base64url(new Uint8Array(signature))+', k='+publicKey;
}
