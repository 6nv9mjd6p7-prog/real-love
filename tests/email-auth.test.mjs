import ts from 'typescript';
import {readFileSync,readdirSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import assert from 'node:assert/strict';
const compile=s=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
const sql=new DatabaseSync(':memory:');for(const f of readdirSync('drizzle').filter(x=>x.endsWith('.sql')).sort())sql.exec(readFileSync('drizzle/'+f,'utf8'));
const DB={prepare(query){let args=[];return {bind(...x){args=x;return this;},async first(){return sql.prepare(query).get(...args)||null;},async run(){return {meta:{changes:sql.prepare(query).run(...args).changes}};}};},async batch(stmts){sql.exec('BEGIN');try{const r=[];for(const s of stmts)r.push(await s.run());sql.exec('COMMIT');return r;}catch(e){sql.exec('ROLLBACK');throw e;}}};
globalThis.__emailEnv={DB,SUPABASE_URL:'https://test-project.supabase.co',SUPABASE_PUBLISHABLE_KEY:'test-public-key'};globalThis.__emailHeaders=new Headers();globalThis.__legacy=null;
const rulesUrl=compile(readFileSync('app/rules.ts','utf8'));const safetyUrl=compile(readFileSync('app/safety.ts','utf8').replace("import {env} from 'cloudflare:workers';",'const env=globalThis.__emailEnv;').replaceAll("from './rules'",`from '${rulesUrl}'`));
const authUrl=compile(readFileSync('app/email-auth.ts','utf8').replace("import {env} from 'cloudflare:workers';",'const env=globalThis.__emailEnv;').replace("import {headers} from 'next/headers';",'const headers=async()=>globalThis.__emailHeaders;').replace("from './safety'",`from '${safetyUrl}'`));const auth=await import(authUrl);
const api=await import(compile(readFileSync('app/api/auth/route.ts','utf8').replace("import {getLegacyUser} from '../../chatgpt-auth';",'const getLegacyUser=async()=>globalThis.__legacy;').replace("from '../../email-auth'",`from '${authUrl}'`).replace("from '../../safety'",`from '${safetyUrl}'`)));
const realFetch=globalThis.fetch;let user={id:'11111111-1111-4111-8111-111111111111',email:'new@test.invalid',email_confirmed_at:new Date().toISOString()};let calls=[];
globalThis.fetch=async(url,options)=>{calls.push({url,options});if(url.endsWith('/otp'))return Response.json({});if(url.endsWith('/verify'))return Response.json({access_token:'verified-provider-token',user:{id:'forged-response-user'}});if(url.endsWith('/user'))return Response.json(user);throw Error('Unexpected provider path');};
function req(body,origin='https://real-love.test',cookie=''){return new Request('https://real-love.test/api/auth',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','cf-connecting-ip':'test-ip',Cookie:cookie},body:JSON.stringify(body)});}
try{
 let r=await api.POST(req({action:'verify',email:user.email,code:'123456',userId:'owner',role:'owner'}));assert.equal(r.status,200);
 const cookie=r.headers.get('set-cookie');assert(cookie.includes('HttpOnly')&&cookie.includes('Secure')&&cookie.includes('SameSite=Lax'));const token=auth.readSessionToken(cookie);assert(token);assert(!JSON.stringify(await r.json()).includes(token));
 globalThis.__emailHeaders=new Headers({Cookie:cookie});let member=await auth.getEmailUser();assert(member.userId.startsWith('email:'));assert.notEqual(member.userId,'owner');assert.equal(member.email,user.email);
 assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM auth_sessions WHERE token_hash=?').get(token).n,0,'raw session token is not stored');
 const session=sql.prepare('SELECT * FROM auth_sessions').get();assert.equal(session.token_hash,await auth.digest(token));
 assert(calls.find(x=>x.url.endsWith('/user')).options.headers.Authorization==='Bearer verified-provider-token','provider user endpoint establishes identity');
 r=await api.POST(req({action:'logout'},'https://evil.test',cookie));assert.equal(r.status,403);assert(await auth.getEmailUser());
 r=await api.POST(req({action:'logout'},'https://real-love.test',cookie));assert.equal(r.status,200);assert(r.headers.get('set-cookie').includes('Max-Age=0'));assert.equal(await auth.getEmailUser(),null);
 // Existing profile and connected records retain the exact legacy member ID.
 const legacy={userId:'existing-owner',email:'owner@test.invalid'};globalThis.__legacy=legacy;user={...user,id:'22222222-2222-4222-8222-222222222222',email:legacy.email};
 sql.prepare('INSERT INTO profiles (id,data,updated) VALUES (?,?,?)').run(legacy.userId,JSON.stringify({name:'Existing member'}),new Date().toISOString());sql.prepare('INSERT INTO safety_accounts (id,status,updated) VALUES (?,?,?)').run(legacy.userId,'admitted',new Date().toISOString());
 r=await api.POST(req({action:'verify',email:user.email,code:'123456',link:true,expectedLegacy:'wrong-member'}));assert.equal(r.status,409);
 r=await api.POST(req({action:'verify',email:'attacker@test.invalid',code:'123456',link:true,expectedLegacy:legacy.userId}));assert.equal(r.status,409);
 r=await api.POST(req({action:'verify',email:user.email,code:'123456',link:true,expectedLegacy:legacy.userId}));assert.equal(r.status,200);globalThis.__emailHeaders=new Headers({Cookie:r.headers.get('set-cookie')});assert.equal((await auth.getEmailUser()).userId,legacy.userId);assert.equal(sql.prepare('SELECT status FROM safety_accounts WHERE id=?').get(legacy.userId).status,'admitted');assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM profiles').get().n,1);
 const linked=await auth.createEmailSession(user,null);assert.equal(linked.member,legacy.userId,'future email-only login preserves linked identity');
 await assert.rejects(()=>auth.createEmailSession(user,{userId:'someone-else',email:user.email}),/already linked/);
 await assert.rejects(()=>auth.createEmailSession({...user,email_confirmed_at:null},null),/verified email/);
 sql.prepare('UPDATE auth_sessions SET expires=?').run('2000-01-01T00:00:00.000Z');assert.equal(await auth.getEmailUser(),null);
 sql.exec('DELETE FROM safety_events');calls=[];r=await api.POST(req({action:'send',email:'fresh@test.invalid'}));assert.equal(r.status,200);r=await api.POST(req({action:'send',email:'fresh@test.invalid'}));assert.equal(r.status,429);assert.equal(calls.length,1,'resend throttling occurs before provider request');
 globalThis.__emailEnv.SUPABASE_URL='https://127.0.0.1';assert.throws(()=>auth.emailAuthConfig(),/unavailable/);
 globalThis.__emailEnv.SUPABASE_URL=undefined;assert.equal(await auth.getEmailUser(),null);
 console.log('Verified provider identity, hashed sessions, expiry, logout/CSRF, rate limits, legacy linking, conflict rejection, and configuration guards passed (provider mocked).');
}finally{globalThis.fetch=realFetch;sql.close();}
