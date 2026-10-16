Warning: truncated output (original token count: 27274)
Total output lines: 603

import ts from 'typescript';
import {readFileSync,readdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {DatabaseSync} from 'node:sqlite';
import {deflateSync,crc32} from 'node:zlib';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
function compile(file,transform=x=>x){const source=transform(readFileSync(file,'utf8'));return 'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');}
const modelUrl=compile('app/model.ts'),policyUrl=compile('app/photo-policy.ts'),locationUrl=compile('app/location.ts');
const invitationUrl=compile('app/invitations.ts',s=>s.replace("from './model'",`from '${modelUrl}'`));
const model=await import(modelUrl),policy=await import(policyUrl);
const sql=new DatabaseSync(':memory:');for(const f of readdirSync('drizzle').filter(x=>x.endsWith('.sql')).sort().map(x=>'drizzle/'+x))sql.exec(readFileSync(f,'utf8'));
const memory=new Map();
const DB={prepare(query){let values=[];return {bind(...v){values=v;return this;},async first(){return sql.prepare(query).get(...values)??null;},async all(){return {results:sql.prepare(query).all(...values)};},async run(){globalThis.__beforeRun?.(query,values);const r=sql.prepare(query).run(...values);return {meta:{changes:r.changes}};}};},async batch(statements){sql.exec('BEGIN');try{const result=[];for(const stmt of statements)result.push(await stmt.run());sql.exec('COMMIT');return result;}catch(e){sql.exec('ROLLBACK');throw e;}}};
globalThis.__rlEnv={DB,PILOT_OWNER_EMAIL:'referee@test.invalid',BUCKET:{async put(key,value){memory.set(key,new Uint8Array(value));},async head(key){const bytes=memory.get(key);return bytes?{size:bytes.length,httpEtag:'\"'+key+'\"'}:null;},async get(key,options){const bytes=memory.get(key);if(!bytes)return null;const range=options?.range;return {body:range?bytes.slice(range.offset,range.offset+range.length):bytes,size:bytes.length};},async delete(key){memory.delete(key);}}};
const rulesUrl=compile('app/rules.ts');const safetyUrl=compile('app/safety.ts',s=>s.replace("import {env} from 'cloudflare:workers';",'const env=globalThis.__rlEnv;').replaceAll("from './rules'",`from '${rulesUrl}'`));const modPolicyUrl=compile('app/moderation-policy.ts',s=>s.replace("from './safety'",`from '${safetyUrl}'`));
const circlePolicyUrl=compile('app/circle-policy.ts',s=>s.replace("import {env} from 'cloudflare:workers';",'const env=globalThis.__rlEnv;').replace("from './safety'",`from '${safetyUrl}'`));
const chatToolsUrl=compile('app/chat-tools.ts');const chatServerUrl=compile('app/chat-server.ts',s=>s.replace("import {env} from 'cloudflare:workers';",'const env=globalThis.__rlEnv;').replace("from './chat-tools'",`from '${chatToolsUrl}'`).replace("from './safety'",`from '${safetyUrl}'`));
const webPushUrl=compile('app/web-push.ts');globalThis.__pushTasks=[];const notificationServerUrl=compile('app/notifications-server.ts',s=>s.replace("import {env,waitUntil} from 'cloudflare:workers';",'const env=globalThis.__rlEnv;const waitUntil=p=>globalThis.__pushTasks.push(p);').replace("from './web-push'",`from '${webPushUrl}'`).replace("from './safety'",`from '${safetyUrl}'`));
const voiceAccessUrl=compile('app/voice-access.ts',s=>s.replace("import {env} from 'cloudflare:workers';",'const env=globalThis.__rlEnv;').replace("from './safety'",`from '${safetyUrl}'`));
const revisionUrl=compile('app/message-revision.ts');
const historyUrl=compile('app/history-tools.ts',s=>s.replace("from './safety'",`from '${safetyUrl}'`));const analyticsUrl=compile('app/product-analytics.ts');
function replacements(s){return s.replace("from '../../message-revision'",`from '${revisionUrl}'`).replace("from '../../history-tools'",`from '${historyUrl}'`).replace("from '../../product-analytics'",`from '${analyticsUrl}'`).replace("from '../../voice-access'",`from '${voiceAccessUrl}'`).replace("from '../../notifications-server'",`from '${notificationServerUrl}'`).replace("from '../../web-push'",`from '${webPushUrl}'`).replace("from '../../chat-server'",`from '${chatServerUrl}'`).replace("import { env } from 'cloudflare:workers';","const env=globalThis.__rlEnv;").replace("import {env} from 'cloudflare:workers';","const env=globalThis.__rlEnv;").replace("import {getChatGPTUser} from '../../chatgpt-auth';","const getChatGPTUser=async()=>globalThis.__rlUser;").replace("from '../../circle-policy'",`from '${circlePolicyUrl}'`).replace("from '../../invitations'",`from '${invitationUrl}'`).replace("from '../../location'",`from '${locationUrl}'`).replace("from '../../model'",`from '${modelUrl}'`).replace("from '../../photo-policy'",`from '${policyUrl}'`).replace("from '../../safety'",`from '${safetyUrl}'`).replace("from '../../moderation-policy'",`from '${modPolicyUrl}'`).replace("from 'zod'",`from '${pathToFileURL(require.resolve('zod')).href}'`);}
const voice=await import(compile('app/api/voice/route.ts',replacements));
const notificationsApi=await import(compile('app/api/notifications/route.ts',replacements));const reports=await import(compile('app/api/reports/route.ts',replacements)),moderation=await import(compile('app/api/moderation/route.ts',replacements));const app=await import(compile('app/api/app/route.ts',replacements));const photo=await import(compile('app/api/photo/route.ts',replacements));const circles=await import(compile('app/api/circles/route.ts',replacements));
function as(id){globalThis.__rlUser=id?{userId:id,email:id+'@test.invalid'}:null;}
function request(body,origin='https://rl.test',cf=null){const value=new Request('https://rl.test/api/app',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify(body)});if(cf)Object.defineProperty(value,'cf',{value:cf});return value;}
async function post(id,body,cf=null){as(id);const r=await (body.action==='report'?reports:app).POST(request(body,'https://rl.test',cf));return {status:r.status,data:await r.json()};}
async function get(id){as(id);const r=await app.GET();return {status:r.status,data:await r.json()};}
const draft=(id)=>({...model.examples[1],birthDate:`${new Date().getUTCFullYear()-30}-01-01`,id,name:id,demo:false,gender:'Man',interested:['Woman'],orientation:'Asexual',aceOnly:true,intentions:['Build together','Friendship','Romance'],connectionBoundary:'Friendship only',firstStep:'A conversation about community decisions',consent:true,rulesVersion:'2026-10-02'});
assert.equal((await get(null)).status,401);assert.equal((await post('alice',{action:'profile',expectedAccount:'bob',profile:draft('alice')})).status,409,'stale account drafts cannot be submitted as another account');as('alice');assert.equal((await circles.POST(request({action:'message',expectedAccount:'bob',circle:'none',text:'Unsent private text'}))).status,409);assert.equal((await get('alice')).data.accountId,'alice');as('alice');assert.equal((await app.POST(request({action:'profile',profile:draft('alice')},'https://other.test'))).status,403);
assert.equal((await post('alice',{action:'profile',profile:{...draft('alice'),birthDate:`${new Date().getUTCFullYear()-17}-01-01`,age:99}})).status,400);
assert.equal((await post('alice',{action:'profile',profile:{...draft('alice'),birthDate:undefined}})).status,400,'new profiles require a birth date');
const cfAustin={city:'Austin',region:'Texas',country:'US'};
assert.equal((await post('locator',{action:'connection_location'})).status,404,'place search remains available when connection metadata is absent');
const connectionArea=await post('locator',{action:'connection_location'},cfAustin);assert.deepEqual(connectionArea.data.location,{city:'Austin',region:'Texas',country:'United States'});
assert.equal((await post('locator',{action:'profile',confirmLocation:true,profile:draft('locator')},cfAustin)).status,200);
let locator=(await get('locator')).data.me;assert.equal(locator.locationConfirmed,true);assert.equal(locator.region,'Texas');assert.equal(locator.country,'United States');assert(!('locationConfirmationKey' in locator)&&!('locationConfirmedAt' in locator),'raw confirmation metadata stays private');
assert.equal((await post('locator',{action:'profile',confirmLocation:true,profile:{...draft('locator'),city:'Dallas',areaLat:null,areaLon:null,locationPlaceId:''}},cfAustin)).data.locationConfirmed,false,'a different selected area is not confirmed');locator=(await get('locator')).data.me;assert.equal(locator.locationConfirmed,false);
assert.equal((await post('alice',{action:'profile',profile:{...draft('alice'),firstStep:'',introPrompt:'Something I’m curious about…'}})).status,200,'only one introductory answer is required');assert.equal((await post('alice',{action:'profile',profile:{...draft('alice'),communication:['Ask before giving advice.'],communicationNote:'Direct questions help me.'}})).status,200);
assert.equal((await get('alice')).data.account.status,'pending');
// Birth date is authoritative, private, and compatible with older profile payloads.
assert.equal((await post('locator',{action:'profile',profile:{...draft('locator'),age:99,availabilityChoices:['Weekday evenings','Weekends'],participation:[model.startRoles[0],model.startRoles[1]],gender:'',orientation:'',expectation:'',connectionBoundary:''}})).status,200);
locator=(await get('locator')).data.me;assert.equal(locator.age,30,'server ignores a forged numeric age');assert.equal(locator.birthDate,draft('locator').birthDate);assert.deepEqual(locator.availabilityChoices,['Weekday evenings','Weekends']);assert.equal(locator.participation.length,2);assert.equal(locator.expectation,'','unanswered remains distinct from Unsure');
assert.equal((await post('locator',{action:'profile',profile:{...draft('locator'),birthDate:'2000-02-30'}})).status,400,'invalid calendar dates are rejected');
assert.equal((await post('locator',{action:'profile',profile:{...draft('locator'),birthDate:''}})).status,400,'a saved birth date cannot be replaced with an arbitrary numeric age');
const olderPayload={...locator,birthDate:undefined,availabilityChoices:undefined,participation:undefined,consent:true,rulesVersion:'2026-10-02'};
assert.equal((await post('locator',{action:'profile',profile:olderPayload})).status,200);locator=(await get('locator')).data.me;assert.equal(locator.birthDate,draft('locator').birthDate);assert.equal(locator.participation.length,2,'older clients do not erase new choices');
sql.prepare("UPDATE profiles SET data=json_remove(data,'$.birthDate') WHERE id='locator'").run();
assert.equal((await post('locator',{action:'profile',profile:{...olderPayload,age:99}})).status,200,'existing profiles without birth dates can still edit their answers');locator=(await get('locator')).data.me;assert.equal(locator.birthDate,'');assert.equal(locator.age,30,'legacy age is preserved until its owner enters a birth date');
async function review(body,who='referee'){as(who);if(['approve_photo','reject_photo'].includes(body.action)&&!('reviewToken' in body)){const queue=await (await moderation.GET()).json();body={...body,reviewToken:queue.photos?.find(p=>p.id===body.target)?.reviewToken||''};}const r=await moderation.POST(request(body));return {status:r.status,data:await r.json()};}
assert.equal((await review({action:'admit',target:'alice',reason:'Reviewed adult eligibility and orientation',adultReviewed:true})).status,200);
const b={...draft('bob'),orientation:'Allosexual',expectation:'Required',gender:'Man',interested:['Woman'],firstStep:'Read one piece together and discuss it'};
assert.equal((await post('bob',{action:'profile',profile:b})).status,200);assert.equal((await review({action:'admit',target:'bob',reason:'Reviewed adult eligibility and orientation',adultReviewed:true})).status,200);
// Ineligible bookmarked profiles must not crowd out an eligible candidate beyond 100 rows.
for(let i=0;i<105;i++){const key='discovery-hidden-'+i;sql.prepare('INSERT INTO safety_accounts (id,status,updated) VALUES (?,?,?)').run(key,'admitted',new Date().toISOString());sql.prepare('INSERT INTO profiles (id,data,active,updated) VALUES (?,?,1,?)').run(key,JSON.stringify({...draft(key),city:'Different city',remote:false}),new Date().toISOString());sql.prepare('INSERT INTO bookmarks (member,target) VALUES (?,?)').run('alice',key);}
assert((await get('alice')).data.people.some(p=>p.id==='bob'),'eligible people beyond the first 100 candidates remain discoverable');
assert(!(await get('alice')).data.people.some(p=>'birthDate' in p||'promptKeys' in p),'discovery never exposes private profile data');
assert((await get('bob')).data.me.birthDate,'the owner can edit their private birth date');
sql.prepare("DELETE FROM bookmarks WHERE target LIKE 'discovery-hidden-%'").run();sql.prepare("DELETE FROM profiles WHERE id LIKE 'discovery-hidden-%'").run();sql.prepare("DELETE FROM safety_accounts WHERE id LIKE 'discovery-hidden-%'").run();
assert.deepEqual((await get('bob')).data.people.find(p=>p.id==='alice').communication,['Ask before giving advice.']);assert.equal((await get('bob')).data.people.find(p=>p.id==='alice').communicationNote,'Direct questions help me.');
let result=await get('alice');assert.equal(result.data.people.length,1,'nonromantic introductions ignore date gender/sexual restrictions');assert(result.data.people[0].intentions.includes('Connect'));assert(!('connectionBoundary' in result.data.people[0]));assert.equal(result.data.me.connectionBoundary,'Friendship only');

assert.equal((await post('alice',{action:'invite',target:'bob',kind:'Build together'})).status,400);
assert.equal((await post('alice',{action:'invite',target:'bob',kind:'Build together',proposal:'Read one piece together and discuss it'})).status,200);
result=await get('bob');let id=result.data.connections[0].id;assert.equal(result.data.connections[0].proposal,'Read one piece together and discuss it');
assert.equal((await post('alice',{action:'accept',connection:id})).status,403,'sender cannot accept own invitation');
assert.equal((await post('bob',{action:'message',connection:id,text:'Hi'})).status,403,'pending invitations cannot message');
function chunk(type,body){const tag=Buffer.from(type),out=Buffer.alloc(body.length+12);out.writeUInt32BE(body.length);tag.copy(out,4);body.copy(out,8);out.writeUInt32BE(crc32(Buffer.concat([tag,body])),out.length-4);return out;}
const header=Buffer.alloc(13);header.writeUInt32BE(2,0);header.writeUInt32BE(2,4);header[8]=8;header[9]=6;
const image=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('tEXt',Buffer.from('Location\0private metadata')),chunk('IDAT',deflateSync(Buffer.alloc(18))),chunk('IEND',Buffer.alloc(0))]);
const cleaned=policy.sanitizePng(image);assert(!Buffer.from(cleaned).includes(Buffer.from('private metadata')));assert.throws(()=>policy.sanitizePng(Buffer.from('not a photo')));
as('alice');let r=await photo.POST(new Request('https://rl.test/api/photo',{method:'POST',headers:{Origin:'https://rl.test','Content-Type':'image/png','x-reveal-consent':'yes'},body:image}));assert.equal(r.status,200);
assert.equal((await get('alice')).data.me.photoPending,false,'uploads need no approval');sql.prepare("UPDATE profiles SET data=json_set(data,'$.photoPending',json('true')) WHERE id='alice'").run();
sql.prepare('INSERT INTO blocks (actor,target) VALUES (?,?)').run('referee','alice');as('referee');assert((await (await moderation.GET()).json()).photos.some(p=>p.id==='alice'),'owner can review despite a connection conflict');sql.prepare('DELETE FROM blocks WHERE actor=? AND target=?').run('referee','alice');as('referee');assert((await (await moderation.GET()).json()).photos.some(p=>p.id==='alice'),'independent reviewers can see pending photos');
result=await get('bob');assert.equal(result.data.connections[0].person.hasPhoto,false,'unreviewed photo never visible');assert.equal((await review({action:'approve_photo',target:'alice',reason:'Reviewed photo against content guidelines'})).status,200);result=await get('bob');assert.equal(result.data.connections[0].person.hasPhoto,true);assert(!JSON.stringify(result.data).includes('profile-photos/'),'storage keys must not leak');
as('bob');r=await photo.GET(new Request('https://rl.test/api/photo?member=alice'));assert.equal(r.status,403,'photos hidden before acceptance');
assert.equal((await post('bob',{action:'accept',connection:id})).status,200);
assert.equal((await post('alice',{action:'bookmark',target:'bob',saved:true})).status,200);assert((await get('alice')).data.bookmarks.includes('bob'),'bookmarks persist on fresh account loads');assert(!(await get('bob')).data.bookmarks.includes('bob'),'bookmarks remain private');assert.equal((await post('alice',{action:'bookmark',target:'demo-jules',saved:true})).status,400);

as('bob');r=await photo.GET(new Request('https://rl.test/api/photo?member=alice'));assert.equal(r.status,403,'acceptance does not reveal photos');assert.equal((await post('alice',{action:'profile',profile:{...draft('alice'),photoDescription:'A close-up portrait beside a garden wall.'}})).status,200);assert.equal((await get('alice')).data.me.photoDescription,'A close-up portrait beside a garden wall.');assert(!('photoDescription' in (await get('bob')).data.people.find(p=>p.id==='alice')),'photo descriptions stay out of general discovery');assert.equal((await post('alice',{action:'photo_consent',connection:id,share:true})).status,200);as('bob');assert.equal((await photo.GET(new Request('https://rl.test/api/photo?member=alice'))).status,403,'one-sided sharing is insufficient');assert(!('photoDescription' in (await get('bob')).data.connections[0].person),'description stays hidden before mutual photo consent');assert.equal((await post('bob',{action:'photo_consent',connection:id,share:true})).status,200);as('bob');assert.equal((await get('bob')).data.connections[0].person.photoDescription,'A close-up portrait beside a garden wall.','mutual photo consent unlocks its accessible description');r=await photo.GET(new Request('https://rl.test/api/photo?member=alice'));assert.equal(r.status,200);assert.equal(r.headers.get('cache-control'),'private, no-store');
assert.equal((await post('alice',{action:'discovery_visibility',discoverable:false})).status,200);as('bob');assert.equal((await photo.GET(new Request('https://rl.test/api/photo?member=alice'))).status,200,'hiding preserves mutually agreed existing photo access');assert.equal((await post('alice',{action:'discovery_visibility',discoverable:true})).status,200);
const photoReport=await post('bob',{action:'report',target:'alice',type:'photo',reason:'Privacy concern',details:'Please review this specific test photo.'});assert.equal(photoReport.status,200);assert.equal(memory.size,2,'specific reported photo evidence is retained separately');
as('referee');let queue=await moderation.GET();let queueData=await queue.json();assert(!JSON.stringify(queueData).includes('report-evidence/'),'storage keys do not leak through moderation summaries');
assert.equal((await post('bob',{action:'message',connection:id,text:'Let us choose a short reading.'})).status,200);assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM notifications WHERE member='bob' AND kind='invitation'").get().n,1);
assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM notifications WHERE member='alice' AND kind='accepted'").get().n,1);

assert.equal((await get('alice')).data.connections.find(c=>c.id===id).unread,1);assert.equal((await get('bob')).data.connections.find(c=>c.id===id).unread,0);

assert.equal((await post('alice',{action:'messages',connection:id})).data.messages[0].body,'Let us choose a short reading.');
const phraseSearch=await post('alice',{action:'search_messages',connection:id,query:'short reading'});assert.equal(phraseSearch.status,200);assert.equal(phraseSearch.data.messages[0].body,'Let us choose a short reading.','search finds matching messages across the conversation');assert.equal((await post('outsider',{action:'search_messages',connection:id,query:'reading'})).status,403,'search enforces the same conversation membership as history');assert.equal((await post('alice',{action:'search_messages',connection:id,query:'x'})).status,400,'search requires a useful query length');
assert.equal((await get('alice')).data.connections.find(c=>c.id===id).unread,1,'fetching does not mark unseen messages read');const visibleMessage=(await post('alice',{action:'messages',connection:id})).data.messages.at(-1).id;assert.equal((await post('outsider',{action:'read_messages',connection:id,message:visibleMessage})).status,403,'read acknowledgements require membership');assert.equal((await post('alice',{action:'read_messages',connection:id,message:'missing'})).status,404);assert.equal((await post('alice',{action:'read_messages',connection:id,message:visibleMessage})).status,200);assert.equal((await get('alice')).data.connections.find(c=>c.id===id).unread,0,'visible latest message acknowledgement clears unread count');assert.equal(sql.prepare("SELECT read FROM notifications WHERE member='alice' AND kind='message'").get().read,1,'chat reading clears message notifications');

// Replies and reactions are durable, scoped, and idempotent.
const rootMessage=(await post('alice',{action:'messages',connection:id})).data.messages[0].id;
const replyAttempt=crypto.randomUUID(),replyMessageId=JSON.stringify([id,'alice',replyAttempt]);
const replyPayload={action:'message',connection:id,text:'A specific reply',replyTo:rootMessage,clientMessageId:replyAttempt};
assert.equal((await post('alice',replyPayload)).status,200);assert.equal((await post('alice',replyPayload)).status,200);assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM notifications WHERE member='bob' AND kind='message' AND scope=?").get(id).n,1,'a retry produces only one notification');

assert.equal((await post('alice',{...replyPayload,replyTo:''})).status,409,'same attempt cannot change reply target');
let replyThread=(await post('bob',{action:'messages',connection:id})).data.messages;
assert.equal(replyThread.at(-1).reply.id,rootMessage);assert.equal(replyThread.at(-1).reply.body,'Let us choose a short reading.');assert.equal(replyThread.at(-1).reply.mine,true);
assert.equal((await post('alice',{action:'react',connection:id,message:rootMessage,emoji:'❤️'})).status,200);
assert.equal((await post('alice',{action:'react',connection:id,message:rootMessage,emoji:'❤️'})).status,200);
assert.equal((await post('bob',{action:'react',connection:id,message:rootMessage,emoji:'❤️'})).status,200);
assert.deepEqual((await post('alice',{action:'messages',connection:id})).data.messages[0].reactions,[{emoji:'❤️',count:2,mine:true}]);
assert.equal((await post('alice',{action:'react',connection:id,message:rootMessage,emoji:'😂'})).status,200,'changing replaces one reaction');
assert.equal((await post('alice',{action:'react',connection:id,message:rootMessage,emoji:''})).status,200);
assert.deepEqual((await post('alice',{action:'messages',connection:id})).data.messages[0].reactions,[{emoji:'❤️',count:1,mine:false}]);
assert.equal((await post('alice',{action:'react',connection:id,message:rootMessage,emoji:'unsupported'})).status,400);
assert.equal((await post('alice',{action:'message',connection:id,text:'Invalid target',replyTo:'another-conversation'})).status,403);
assert.equal((await post('alice',{action:'react',connection:id,message:'another-conversation',emoji:'👍'})).status,404);
assert.equal((await post('alice',{action:'visibility',active:false})).status,200);
assert.equal((await post('alice',{action:'react',connection:id,message:rootMessage,emoji:'👍'})).status,403,'paused members cannot react');
assert.equal((await post('alice',{action:'visibility',active:true})).status,200);
assert.equal((await get('bob')).data.connections.find(c=>c.id===id).lastMessage.body,'A specific reply');
sql.prepare('DELETE FROM messages WHERE id=?').run(replyMessageId);sql.prepare("DELETE FROM message_reactions WHERE kind='direct' AND scope=?").run(id);
s…15274 tokens truncated…(await post('history-c',{action:'messages',connection:historyConnection,before:latestPage.data.cursor})).status,404);
assert.equal((await notificationPost('history-a',{action:'mute',channel:'direct',scope:historyConnection,muted:true})).status,200);as('history-a');assert((await (await notificationsApi.GET()).json()).mutedScopes.includes('direct:'+historyConnection));assert.equal((await notificationPost('history-c',{action:'mute',channel:'direct',scope:historyConnection,muted:true})).status,403);
// The circle cursor cannot retrieve anything from before a participant's admission.
assert.equal((await circlePost('history-a',{action:'propose',connection:historyConnection,title:'History pages',description:'Read and talk together',tags:['History'],activity:'Read a short piece'})).status,200);
const historyCircle=(await circleGet('history-b')).data.circles.find(c=>c.title==='History pages').id;assert.equal((await circlePost('history-b',{action:'approve',circle:historyCircle})).status,200);
for(let i=0;i<210;i++)sql.prepare('INSERT INTO circle_messages (id,circle,sender,body,created) VALUES (?,?,?,?,?)').run('circle-history-'+i,historyCircle,'history-a','Earlier group message '+i,new Date().toISOString());
assert.equal((await circlePost('history-c',{action:'request',circle:historyCircle})).status,200);assert.equal((await circlePost('history-a',{action:'admit',circle:historyCircle,target:'history-c'})).status,200);
const newcomerSnapshot=await circlePost('history-c',{action:'conversation',circle:historyCircle});assert.equal(newcomerSnapshot.data.messages.length,0,'new circle members cannot see the conversation history from before joining');
sql.prepare('UPDATE circle_messages SET body=? WHERE id=?').run('Changed before the member joined','circle-history-0');
const hiddenHistoryRefresh=await circlePost('history-c',{action:'conversation',circle:historyCircle,knownRevision:newcomerSnapshot.data.revision});assert.equal(hiddenHistoryRefresh.data.unchanged,true,'changes to history hidden by the join cursor do not alter the new member’s revision fingerprint');
const groupLatest=await circlePost('history-b',{action:'conversation',circle:historyCircle});assert.equal(groupLatest.data.messages.length,200);const groupEarlier=await circlePost('history-b',{action:'conversation',circle:historyCircle,before:groupLatest.data.cursor});assert.equal(groupEarlier.data.messages.length,10);assert.equal((await circlePost('history-c',{action:'conversation',circle:historyCircle,before:groupLatest.data.cursor})).data.messages.length,0);
// Fetching circle history is read-only; acknowledgements cover only the viewed notification snapshot.
const addCircleAlert=(key,member='history-b',scope=historyCircle,kind='circle_message')=>sql.prepare('INSERT INTO notifications (id,member,actor,kind,scope,title,url,created) VALUES (?,?,?,?,?,?,?,?)').run(key,member,'history-a',kind,scope,'Circle activity','#circles/'+scope,new Date().toISOString());
addCircleAlert('circle-read-old');addCircleAlert('circle-read-other-member','history-a');addCircleAlert('circle-read-other-scope','history-b','unrelated-circle');addCircleAlert('circle-read-request','history-b',historyCircle,'circle_request');
const readSnapshot=await circlePost('history-b',{action:'conversation',circle:historyCircle});
assert.equal(sql.prepare('SELECT read FROM notifications WHERE id=?').get('circle-read-old').read,0,'latest background fetch never acknowledges activity');
await circlePost('history-b',{action:'conversation',circle:historyCircle,before:groupLatest.data.cursor});
assert.equal(sql.prepare('SELECT read FROM notifications WHERE id=?').get('circle-read-old').read,0,'older history fetch never acknowledges activity');
addCircleAlert('circle-read-new');
assert.equal((await circlePost('history-b',{action:'read_conversation',circle:historyCircle,through:readSnapshot.data.readCursor})).status,200);
assert.equal(sql.prepare('SELECT read FROM notifications WHERE id=?').get('circle-read-old').read,1);
for(const key of ['circle-read-new','circle-read-other-member','circle-read-other-scope','circle-read-request'])assert.equal(sql.prepare('SELECT read FROM notifications WHERE id=?').get(key).read,0,'acknowledgement does not clear unrelated or newer activity');
const readUnchanged=await circlePost('history-b',{action:'conversation',circle:historyCircle,knownRevision:readSnapshot.data.revision});assert.equal(readUnchanged.data.unchanged,true);assert(readUnchanged.data.readCursor>readSnapshot.data.readCursor,'unchanged messages still provide a fresh notification snapshot');
assert.equal((await circlePost('history-b',{action:'read_conversation',circle:historyCircle,through:readUnchanged.data.readCursor})).status,200);assert.equal(sql.prepare('SELECT read FROM notifications WHERE id=?').get('circle-read-new').read,1);
assert.equal((await circlePost('history-b',{action:'read_conversation',circle:historyCircle,through:-1})).status,400);
assert.equal((await circlePost('alice',{action:'read_conversation',circle:historyCircle,through:readUnchanged.data.readCursor})).status,403,'nonmembers cannot acknowledge circle activity');
assert.equal((await post('history-b',{action:'block',target:'history-a'})).status,200);const blockedSnapshot=await circlePost('history-b',{action:'conversation',circle:historyCircle,knownRevision:groupLatest.data.revision});assert(!blockedSnapshot.data.unchanged,'a block invalidates cached circle history');assert.notEqual(blockedSnapshot.data.revision,groupLatest.data.revision);assert.equal(blockedSnapshot.data.messages.length,0);assert.equal((await circlePost('history-b',{action:'conversation',circle:historyCircle,before:groupLatest.data.cursor})).data.messages.length,0);assert.equal((await post('history-a',{action:'messages',connection:historyConnection,before:latestPage.data.cursor})).status,403);
const metrics=await import(compile('app/api/metrics/route.ts',replacements));as('history-c');assert.equal((await metrics.GET()).status,403);as('referee');const summary=await (await metrics.GET()).json();assert(summary.totals.approved>0);assert(!JSON.stringify(summary).includes('Earlier group message'),'owner totals never include conversation contents');
console.log('Older-message pagination, circle admission/block boundaries, per-chat mute authorization and owner-only aggregate totals passed');

// Feedback is opt-in, account-scoped, replaceable per day, and contains no conversation identifier.
as('alice');let feedbackResponse=await metrics.POST(request({action:'conversation_feedback',expectedAccount:'bob',field:'understood',value:'Yes'}));assert.equal(feedbackResponse.status,400);
feedbackResponse=await metrics.POST(request({action:'conversation_feedback',expectedAccount:'alice',field:'person_rating',value:'Yes'}));assert.equal(feedbackResponse.status,400);
for(const value of ['Yes','Partly']){feedbackResponse=await metrics.POST(request({action:'conversation_feedback',expectedAccount:'alice',field:'understood',value}));assert.equal(feedbackResponse.status,200);}
const feedbackRows=sql.prepare("SELECT * FROM product_events WHERE member='alice' AND kind LIKE 'feedback_%'").all();assert.equal(feedbackRows.length,1);assert.equal(feedbackRows[0].kind,'feedback_understood_partly');assert(!feedbackRows[0].id.includes(id),'feedback is not associated with the connection');
console.log('Optional communication preferences round-trip and private daily feedback validation/replacement passed.');

const identityProfile={...draft('identity-member'),gender:'Self-described',genderDescription:'Genderfluid',background:'Yoruba',interested:model.genders};assert.equal((await post('identity-member',{action:'profile',profile:identityProfile})).status,200);let identitySaved=(await get('identity-member')).data.me;assert.equal(identitySaved.genderDescription,'Genderfluid');assert.equal(identitySaved.background,'Yoruba');assert.equal((await post('identity-member',{action:'profile',profile:{...identityProfile,gender:'Prefer not to say',background:''}})).status,200);identitySaved=(await get('identity-member')).data.me;assert.equal(identitySaved.gender,'Prefer not to say');assert(!identitySaved.genderDescription);assert.equal(identitySaved.background,'');assert.equal(JSON.parse(sql.prepare('SELECT data FROM profiles WHERE id=?').get('identity-member').data).genderDescription,'','withdrawing gender sharing clears the saved description');console.log('Identity self-description, optional sharing, legacy preference lists, and withdrawal passed.');

// Journey milestones are allowlisted, account scoped, and idempotent.
as(null);assert.equal((await metrics.POST(request({action:'journey',expectedAccount:'alice',kind:'signup_basics_completed'}))).status,401);
as('identity-member');assert.equal((await metrics.POST(request({action:'journey',expectedAccount:'other',kind:'signup_basics_completed'}))).status,400);
assert.equal((await metrics.POST(request({action:'journey',expectedAccount:'identity-member',kind:'approved'}))).status,400,'clients cannot claim server milestones');
assert.equal((await metrics.POST(request({action:'journey',expectedAccount:'identity-member',kind:'discovery_opened'}))).status,403,'unapproved members cannot claim discovery access');
for(let i=0;i<2;i++)assert.equal((await metrics.POST(request({action:'journey',expectedAccount:'identity-member',kind:'signup_basics_completed',answer:'must not be stored'}))).status,200);
const milestoneRows=sql.prepare("SELECT * FROM product_events WHERE member='identity-member' AND kind='signup_basics_completed'").all();assert.equal(milestoneRows.length,1);assert(!JSON.stringify(milestoneRows).includes('must not be stored'));
assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM product_events WHERE member='bob' AND kind='message_sent'").get().n,1,'successful messages count once per sender');
as('referee');const baseline=await (await metrics.GET()).json();
const day=86400000,stamp=days=>new Date(Date.now()-days*day).toISOString();
function milestone(member,kind,days){sql.prepare('INSERT INTO product_events (id,member,kind,created) VALUES (?,?,?,?)').run(JSON.stringify([member,kind]),member,kind,stamp(days));}
for(const member of ['journey-a','journey-b']){milestone(member,'signup_started',11);milestone(member,'approved',10);milestone(member,'signup_basics_completed',10.5);}
for(const [kind,days] of [['signup_interests_completed',10.4],['profile_saved',10.3],['discovery_opened',9],['profile_opened',8],['chat_opened',6],['invitation_sent',7],['accepted',6],['message_sent',5],['two_way',4],['visit',9]])milestone('journey-a',kind,days);
for(const [kind,days] of [['discovery_opened',11],['invitation_sent',2],['message_sent',1],['signup_interests_completed',1],['profile_saved',12],['visit',10]])milestone('journey-b',kind,days);
milestone('journey-recent','approved',2);milestone('journey-recent','signup_started',2);milestone('journey-recent','two_way',1);
milestone('journey-old','approved',40);milestone('journey-old','signup_started',40);
const measured=await (await metrics.GET()).json();
assert.equal(measured.cohort.approved-baseline.cohort.approved,2,'only matured approval windows from the past month count');
for(const field of ['discovered','viewed','chatted','invited','accepted','messaged','conversations','returned'])assert.equal(measured.cohort[field]-baseline.cohort[field],1,field+' excludes early, late, recent and old events');
assert.equal(measured.signupCohort.started-baseline.signupCohort.started,2);assert.equal(measured.signupCohort.basics-baseline.signupCohort.basics,2);assert.equal(measured.signupCohort.interests-baseline.signupCohort.interests,1);assert.equal(measured.signupCohort.saved-baseline.signupCohort.saved,1);
assert(!JSON.stringify(measured).includes('journey-a'),'owner response returns totals, not member identifiers');
console.log('Journey allowlist, authorization, deduplication, content omission, sender milestones and seven-day observation windows passed.');

// Worker support reuses the same server-enforced membership and moderation boundary.
const workerIds=['worker-a','worker-b','worker-c','worker-outsider'];
for(const who of workerIds){
 sql.prepare("INSERT INTO safety_accounts (id,status,updated) VALUES (?,'admitted',?)").run(who,new Date().toISOString());
 sql.prepare('INSERT INTO profiles (id,data,active,updated) VALUES (?,?,1,?)').run(who,JSON.stringify({...draft(who),interested:[],minAge:18,maxAge:99}),new Date().toISOString());
}
sql.prepare("INSERT INTO connections (id,sender,recipient,status,kind,proposal,created) VALUES ('worker-connection','worker-a','worker-b','accepted','Connect','A friendly conversation',?)").run(new Date().toISOString());
sql.prepare("INSERT INTO messages (id,connection,sender,body,created) VALUES ('worker-private','worker-connection','worker-a','PRIVATE FRIENDSHIP HISTORY',?)").run(new Date().toISOString());
async function workerAct(who,body){as(who);const response=await circles.POST(request({expectedAccount:who,...body}));return {status:response.status,data:await response.json()};}
async function workerList(who,worker=true){as(who);const response=await circles.GET(new Request('https://rl.test/api/circles'+(worker?'?scope=worker':'')));return {status:response.status,headers:response.headers,data:await response.json()};}
const workerDraft={action:'propose',connection:'worker-connection',title:'Industry peers',description:'Peer discussion of work and mutual care.',tags:['Learning'],activity:'Read an official resource together.',category:'worker_industry',membershipRules:'For people seeking respectful industry discussion. Hosts review every request.',workerConsent:true};
assert.equal((await workerList(null)).status,401);
assert.equal((await workerAct('worker-a',{...workerDraft,workerConsent:false})).status,400);
assert.equal((await workerAct('worker-a',{...workerDraft,category:'worker_workplace'})).status,400,'unsupported workplace category cannot bypass UI');
sql.prepare("DELETE FROM safety_events WHERE actor='worker-a' AND kind='circle_propose'").run();
assert.equal((await workerAct('worker-a',workerDraft)).status,200);
const workerCircle=sql.prepare("SELECT * FROM circles WHERE category='worker_industry'").get();
assert.equal(workerCircle.membership_rules,workerDraft.membershipRules);
assert.equal((await workerList('worker-outsider')).data.circles.some(c=>c.id===workerCircle.id),false,'pending proposal stays with founders');
assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM circle_messages WHERE circle=?').get(workerCircle.id).n,0,'direct messages never copied');
assert.equal((await workerAct('worker-b',{action:'approve',circle:workerCircle.id})).status,400);
assert.equal((await workerAct('worker-b',{action:'approve',circle:workerCircle.id,workerConsent:true})).status,200);
assert.equal((await workerList('worker-outsider',false)).data.circles.some(c=>c.id===workerCircle.id),false,'ordinary backend directory excludes worker circles');
const workerListing=await workerList('worker-outsider');
assert.equal(workerListing.headers.get('cache-control'),'no-store');
assert(workerListing.data.circles.some(c=>c.id===workerCircle.id));
assert(!JSON.stringify(workerListing.data).includes('worker-a'),'listing does not expose founder identity');
assert.equal((await workerAct('worker-outsider',{action:'conversation',circle:workerCircle.id})).status,403);
assert.equal((await workerAct('worker-c',{action:'request',circle:workerCircle.id})).status,400);
assert.equal((await workerAct('worker-c',{action:'request',circle:workerCircle.id,workerConsent:true})).status,200);
assert.equal((await workerAct('worker-c',{action:'conversation',circle:workerCircle.id})).status,403,'request is not admission');
assert.equal((await workerAct('worker-a',{action:'message',circle:workerCircle.id,text:'Before new admission'})).status,200);
assert.equal((await workerAct('worker-outsider',{action:'admit',circle:workerCircle.id,target:'worker-c'})).status,403,'only host can admit');
assert.equal((await workerAct('worker-a',{action:'admit',circle:workerCircle.id,target:'worker-c'})).status,200);
let workerConversation=await workerAct('worker-c',{action:'conversation',circle:workerCircle.id});
assert.equal(workerConversation.status,200);assert.equal(workerConversation.data.messages.length,0,'new member cannot read earlier messages');
assert.equal((await workerAct('worker-c',{action:'message',circle:workerCircle.id,text:'Glad to learn together'})).status,200);
assert.equal((await workerAct('worker-a',{action:'conversation',circle:workerCircle.id})).data.messages.length,2);
assert(!JSON.stringify((await get('worker-outsider')).data.people).includes('Industry peers'),'friendship profiles contain no worker participation');
sql.prepare("INSERT INTO blocks (actor,target) VALUES ('worker-a','worker-outsider')").run();
assert.equal((await workerList('worker-outsider')).data.circles.some(c=>c.id===workerCircle.id),false,'blocked applicant cannot discover circle');
assert.equal((await workerAct('worker-outsider',{action:'request',circle:workerCircle.id,workerConsent:true})).status,403);
assert.equal((await workerAct('worker-b',{action:'remove',circle:workerCircle.id,target:'worker-c'})).status,200);
assert.equal((await workerAct('worker-c',{action:'conversation',circle:workerCircle.id})).status,403);
assert.equal((await workerAct('worker-c',{action:'message',circle:workerCircle.id,text:'Must not be sent'})).status,403);
assert.equal((await workerAct('worker-c',{action:'request',circle:workerCircle.id,workerConsent:true})).status,403);
assert.equal((await workerAct('worker-a',{action:'close',circle:workerCircle.id})).status,200);
assert.equal((await workerAct('worker-b',{action:'conversation',circle:workerCircle.id})).status,403);
console.log('Worker proposals, consent, backend discovery filtering, admission, history isolation, profile privacy, blocks, removal and closing passed.');

// Union organizing uses a durable category and the existing worker consent boundary.
sql.prepare("DELETE FROM safety_events WHERE actor='worker-a' AND kind='circle_propose'").run();
const organizingDraft={...workerDraft,category:'worker_organizing',title:'Hospitality organizing learners',tags:[],workerConsent:true};
assert.equal((await workerAct('worker-a',{...organizingDraft,workerConsent:false})).status,400);
assert.equal((await workerAct('worker-a',organizingDraft)).status,200);
const organizingCircle=sql.prepare("SELECT * FROM circles WHERE category='worker_organizing'").get();
assert.equal(organizingCircle.tags,'[]','organizing classification survives without topic tags');
assert(!(await workerList('worker-c')).data.circles.some(c=>c.id===organizingCircle.id),'proposal is not visible before both founders agree');
assert.equal((await workerAct('worker-b',{action:'approve',circle:organizingCircle.id})).status,400);
assert.equal((await workerAct('worker-b',{action:'approve',circle:organizingCircle.id,workerConsent:true})).status,200);
assert(!(await workerList('worker-c')).data.circles.some(c=>c.id===organizingCircle.id),'approved organizing circles stay out of worker discovery');assert(!(await workerList('worker-c')).data.circles.some(c=>JSON.stringify(c).includes('Hospitality organizing learners')),'unlisted organizing details are not returned to outsiders');assert((await workerList('worker-a')).data.circles.some(c=>c.id===organizingCircle.id),'founders can still access their unlisted organizing circle');
assert(!(await workerList('worker-c',false)).data.circles.some(c=>c.id===organizingCircle.id),'organizing circle stays out of general discovery');
assert.equal((await workerAct('worker-c',{action:'conversation',circle:organizingCircle.id})).status,404,'direct-ID access does not reveal an unlisted organizing circle');
assert.equal((await workerAct('worker-c',{action:'request',circle:organizingCircle.id})).status,404,'outsiders cannot request access to an unlisted organizing circle');
assert.equal((await workerAct('worker-c',{action:'request',circle:organizingCircle.id,workerConsent:true})).status,404,'unlisted organizing circles cannot be joined through a direct-ID request');assert.equal((await workerAct('worker-c',{action:'conversation',circle:organizingCircle.id})).status,404,'a direct-ID conversation request does not reveal an unlisted circle');assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM notifications WHERE member=? AND scope=?').get('worker-c',organizingCircle.id).n,0,'organizing activity does not create notifications for outsiders');
assert.equal((await workerAct('worker-a',{action:'message',circle:organizingCircle.id,text:'Let us agree on a broad concern.'})).status,200);
// A private invitation is visible only to its accepted-connection recipient and never exposes earlier messages.
sql.prepare("INSERT INTO connections (id,sender,recipient,status,kind,created) VALUES ('worker-invite-connection','worker-a','worker-c','accepted','Connect',?)").run(new Date().toISOString());
assert.equal((await workerAct('worker-outsider',{action:'invite',circle:organizingCircle.id,target:'worker-c'})).status,404,'unlisted circle IDs stay hidden from nonmembers');
assert.equal((await workerAct('worker-a',{action:'invite',circle:organizingCircle.id,target:'worker-outsider'})).status,403,'hosts can invite only accepted connections');
const inviteResult=await workerAct('worker-a',{action:'invite',circle:organizingCircle.id,target:'worker-c'});assert.equal(inviteResult.status,200);
assert.equal((await workerAct('worker-a',{action:'invite',circle:organizingCircle.id,target:'worker-c'})).status,409,'duplicate pending invitations are rejected');
const invitedListing=(await workerList('worker-c')).data.circles.find(c=>c.id===organizingCircle.id);assert.equal(invitedListing.membership,'invited');assert(invitedListing.inviteId);
assert(!(await workerList('worker-outsider')).data.circles.some(c=>c.id===organizingCircle.id),'other outsiders cannot discover an invite-only circle');
assert.equal((await workerAct('worker-c',{action:'accept_invite',circle:organizingCircle.id,inviteId:invitedListing.inviteId})).status,400,'invite acceptance requires explicit access consent');
assert.equal((await workerAct('worker-c',{action:'accept_invite',circle:organizingCircle.id,inviteId:invitedListing.inviteId,workerConsent:true})).status,200);
const invitedConversation=await workerAct('worker-c',{action:'conversation',circle:organizingCircle.id});assert.equal(invitedConversation.status,200);assert.equal(invitedConversation.data.messages.length,0,'invitees cannot read earlier circle history');
assert.equal((await workerAct('worker-c',{action:'message',circle:organizingCircle.id,text:'Joining from the invitation'})).status,200,'accepted invitees can participate');
assert.equal((await workerAct('worker-a',{action:'conversation',circle:organizingCircle.id})).data.messages.length,2,'the founders and new invitee can see newly posted messages');
assert.equal((await workerAct('worker-a',{action:'conversation',circle:organizingCircle.id})).data.messages.length,1,'the founders retain access to their private discussion');
console.log('Union-organizing category, discovery separation, two-founder consent and admission history checks passed.');

// Consent version 2 is explicit ongoing sharing; existing version 1 is never upgraded implicitly.
for(const member of ['ongoing-a','ongoing-b','ongoing-legacy']){
 sql.prepare('INSERT INTO safety_accounts (id,status,updated) VALUES (?,?,?)').run(member,'admitted',new Date().toISOString());
 const photoKey='profile-photos/'+member+'.png';memory.set(photoKey,image);
 sql.prepare('INSERT INTO profiles (id,data,active,updated) VALUES (?,?,1,?)').run(member,JSON.stringify({...draft(member),photoKey,photoPending:false}),new Date().toISOString());
}
for(const [connection,recipient] of [['ongoing-pair','ongoing-b'],['legacy-pair','ongoing-legacy']])sql.prepare("INSERT INTO connections (id,sender,recipient,status,kind,created,sender_photo,recipient_photo) VALUES (?,?,?,'accepted','Connect',?,1,1)").run(connection,'ongoing-a',recipient,new Date().toISOString());
assert.equal((await get('ongoing-a')).data.connections.find(c=>c.id==='ongoing-pair').photoOngoingMine,false);
assert.equal((await post('ongoing-a',{action:'photo_consent',connection:'ongoing-pair',share:true,ongoing:true})).status,200);
assert.equal((await post('ongoing-b',{action:'photo_consent',connection:'ongoing-pair',share:true,ongoing:true})).status,200);
// Only one member of the second connection opts in; replacement must still reset it.
assert.equal((await post('ongoing-a',{action:'photo_consent',connection:'legacy-pair',share:true,ongoing:true})).status,200);
async function replaceOngoingPhoto(){as('ongoing-a');return photo.POST(new Request('https://rl.test/api/photo',{method:'POST',headers:{Origin:'https://rl.test','Content-Type':'image/png'},body:image}));}
assert.equal((await replaceOngoingPhoto()).status,200);
let ongoingConnections=(await get('ongoing-a')).data.connections;
assert.equal(ongoingConnections.find(c=>c.id==='ongoing-pair').photosShared,true);
assert.equal(ongoingConnections.find(c=>c.id==='ongoing-pair').photoOngoingOther,true);
assert.equal(ongoingConnections.find(c=>c.id==='legacy-pair').photosShared,false);
as('ongoing-b');assert.equal((await photo.GET(new Request('https://rl.test/api/photo?member=ongoing-a'))).status,200);
// Revocation remains effective through later replacements.
assert.equal((await post('ongoing-b',{action:'photo_consent',connection:'ongoing-pair',share:false})).status,200);
assert.equal((await replaceOngoingPhoto()).status,200);
as('ongoing-b');assert.equal((await photo.GET(new Request('https://rl.test/api/photo?member=ongoing-a'))).status,403);
// A stale failed replacement cannot reset any agreements.
sql.prepare("UPDATE connections SET sender_photo=1,recipient_photo=1 WHERE id='legacy-pair'").run();
globalThis.__beforeRun=(query)=>{if(query.startsWith("UPDATE profiles SET data=json_set(data,'$.photoKey'")){globalThis.__beforeRun=null;sql.prepare("UPDATE profiles SET data=json_set(data,'$.photoKey','concurrent-photo') WHERE id='ongoing-a'").run();}};
assert.equal((await replaceOngoingPhoto()).status,409);globalThis.__beforeRun=null;
assert.equal(sql.prepare("SELECT sender_photo FROM connections WHERE id='legacy-pair'").get().sender_photo,1);
// Explicit removal clears ongoing agreements as well.
await post('ongoing-a',{action:'photo_consent',connection:'ongoing-pair',share:true,ongoing:true});
await post('ongoing-b',{action:'photo_consent',connection:'ongoing-pair',share:true,ongoing:true});
as('ongoing-a');assert.equal((await photo.POST(new Request('https://rl.test/api/photo',{method:'POST',headers:{Origin:'https://rl.test','x-photo-action':'remove'}}))).status,200);
assert.equal(sql.prepare("SELECT sender_photo FROM connections WHERE id='ongoing-pair'").get().sender_photo,0);
assert.equal(sql.prepare("SELECT recipient_photo FROM connections WHERE id='ongoing-pair'").get().recipient_photo,0);
console.log('Ongoing opt-in preserves replacements; legacy, mixed consent, revocation, removal, and failed replacement remain bounded.');
