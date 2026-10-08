import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';
const require=createRequire(import.meta.url);
const {Miniflare}=createRequire(require.resolve('wrangler/package.json'))('miniflare');
const keys=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);
const privateJwk=JSON.stringify(await crypto.subtle.exportKey('jwk',keys.privateKey));
const publicKey=Buffer.from(await crypto.subtle.exportKey('raw',keys.publicKey)).toString('base64url');
const endpoint='https://fcm.googleapis.com/runtime-test';
const source=readFileSync('app/web-push.ts','utf8')+'\n'+readFileSync('app/notifications-server.ts','utf8')
 .replace("import {env,waitUntil} from 'cloudflare:workers';",`const env={WEB_PUSH_PRIVATE_JWK:${JSON.stringify(privateJwk)},WEB_PUSH_PUBLIC_KEY:${JSON.stringify(publicKey)},DB:{prepare(){return {bind(){return this;},async all(){return {results:[{endpoint:${JSON.stringify(endpoint)}}]};}}}}};const waitUntil=()=>{};`)
 .replace("import {activeMember} from './safety';",'const activeMember=async()=>true;')
 .replace("import {validPushEndpoint,vapidAuthorization} from './web-push';",'')
 +'\nexport default {async fetch(){return Response.json(await pushTo("test-member"));}};';
let status=201;const requests=[];
const mf=new Miniflare({modules:true,compatibilityDate:'2026-05-15',
 script:ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText,
 outboundService:async request=>{requests.push({url:request.url,method:request.method,length:request.headers.get('content-length'),authorization:request.headers.get('authorization'),bytes:(await request.arrayBuffer()).byteLength});return new Response(null,{status,headers:status===307?{Location:'https://untrusted.example/redirect'}:{}});}});
try{
 const result=await (await mf.dispatchFetch('https://local.test/')).json();
 assert.equal(result.accepted,1,'real Workers runtime can construct and send the push request');
 assert.equal(requests.length,1);assert.equal(requests[0].url,endpoint);
 assert.equal(requests[0].method,'POST');assert.equal(requests[0].length,'0');assert.equal(requests[0].bytes,0);
 assert(requests[0].authorization.startsWith('vapid t='));
 status=307;
 const redirected=await (await mf.dispatchFetch('https://local.test/')).json();
 assert.equal(redirected.accepted,0);assert.equal(redirected.reason,'request');
 assert.equal(requests.length,2,'Workers must not follow redirects or forward credentials');
 console.log('Workers push request, zero-byte framing, VAPID authorization, and redirect rejection passed (provider mocked).');
}finally{await mf.dispose();}
