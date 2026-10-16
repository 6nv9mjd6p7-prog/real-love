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
function replacements(s){return s.replace("import {searchBroadLocations} from '../../location-search';",'const searchBroadLocations=async()=>globalThis.__circleAreaSuggestions??[];').replace("from '../../message-revision'",`from '${revisionUrl}'`).replace("from '../../history-tools'",`from '${historyUrl}'`).replace("from '../../product-analytics'",`from '${analyticsUrl}'`).replace("from '../../voice-access'",`from '${voiceAccessUrl}'`).replace("from '../../notifications-server'",`from '${notificationServerUrl}'`).replace("from '../../web-push'",`from '${webPushUrl}'`).replace("from '../../chat-server'",`from '${chatServerUrl}'`).replace("import { env } from 'cloudflare:workers';","const env=globalThis.__rlEnv;").replace("import {env} from 'cloudflare:workers';","const env=globalThis.__rlEnv;").replace("import {getChatGPTUser} from '../../chatgpt-auth';","const getChatGPTUser=async()=>globalThis.__rlUser;").replace("from '../../circle-policy'",`from '${circlePolicyUrl}'`).replace("from '../../invitations'",`from '${invitationUrl}'`).replace("from '../../location'",`from '${locationUrl}'`).replace("from '../../model'",`from '${modelUrl}'`).replace("from '../../photo-policy'",`from '${policyUrl}'`).replace("from '../../safety'",`from '${safetyUrl}'`).replace("from '../../moderation-policy'",`from '${modPolicyUrl}'`).replace("from 'zod'",`from '${pathToFileURL(require.resolve('zod')).href}'`);}
const voice=await import(compile('app/api/voice/route.ts',replacements));
const chatImage=await import(compile('app/api/chat-image/route.ts',replacements));
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
sql.prepare("DELETE FROM safety_events WHERE kind IN ('read','write','message') AND actor IN (?,?)").run('alice','bob');



async function voicePost(who,kind,scope,opts={}){as(who);return voice.POST(new Request('https://rl.test/api/voice',{method:'POST',headers:{Origin:'https://rl.test','Content-Type':'audio/webm','x-expected-account':who||'','x-voice-kind':kind,'x-voice-scope':scope,'x-voice-attempt':opts.attempt||crypto.randomUUID(),'x-voice-duration':'2000','x-voice-reply':opts.replyTo||'',...opts.headers},body:opts.body||new Uint8Array([0x1a,0x45,0xdf,0xa3,...Array(30).fill(0)])}));}
async function voiceGet(who,url,headers={}){as(who);return voice.GET(new Request('https://rl.test'+url,{headers}));}
async function chatImagePost(who,kind,scope,opts={}){as(who);const attempt=opts.attempt||crypto.randomUUID();const response=await chatImage.POST(new Request('https://rl.test/api/chat-image',{method:'POST',headers:{Origin:'https://rl.test','Content-Type':'image/png','x-expected-account':who||'','x-chat-image-kind':kind,'x-chat-image-scope':scope,'x-chat-image-attempt':attempt,'x-chat-image-caption':encodeURIComponent(opts.caption||'')},body:image}));return {response,attempt,id:JSON.stringify([scope,who,attempt])};}
async function chatImageGet(who,url){as(who);return chatImage.GET(new Request('https://rl.test'+url));}
// Server-authoritative time windows, ownership, revision conflict and retained evidence.
const editKey=crypto.randomUUID(),editId=JSON.stringify([id,'alice',editKey]);
assert.equal((await post('alice',{action:'message',connection:id,text:'Original version',clientMessageId:editKey})).status,200);
assert.equal((await post('bob',{action:'edit_message',connection:id,message:editId,text:'Not mine',expectedRevision:0})).status,403);
assert.equal((await post('alice',{action:'edit_message',connection:id,message:editId,text:'Second version',expectedRevision:0})).status,200);
assert.equal((await post('alice',{action:'edit_message',connection:id,message:editId,text:'Stale draft',expectedRevision:0})).status,409);
let edited=(await post('bob',{action:'messages',connection:id})).data.messages.find(m=>m.id===editId);assert.equal(edited.body,'Second version');assert.equal(edited.editHistory[0].body,'Original version');assert.equal(edited.editCount,1);
for(let n=1;n<5;n++)assert.equal((await post('alice',{action:'edit_message',connection:id,message:editId,text:'Revision '+n,expectedRevision:n})).status,200);
assert.equal((await post('alice',{action:'edit_message',connection:id,message:editId,text:'Too many',expectedRevision:5})).status,409);
assert.equal((await post('bob',{action:'delete_message',connection:id,message:editId})).status,403);
assert.equal((await post('alice',{action:'delete_message',connection:id,message:editId})).status,200);
assert.equal((await post('alice',{action:'delete_message',connection:id,message:editId})).status,200,'delete retry is idempotent');
edited=(await post('bob',{action:'messages',connection:id})).data.messages.find(m=>m.id===editId);assert.equal(edited.body,'Message deleted');assert.deepEqual(edited.editHistory,[]);assert.deepEqual(edited.reactions,[]);
assert.equal((await post('bob',{action:'search_messages',connection:id,query:'Revision 4'})).data.messages.length,0,'deleted messages do not remain discoverable in chat search');
assert.equal((await post('bob',{action:'react',connection:id,message:editId,emoji:'👍'})).status,404);
assert.equal((await post('bob',{action:'message',connection:id,text:'Deleted reply',replyTo:editId})).status,403);
sql.prepare('DELETE FROM messages WHERE id=?').run(editId);
const expiryId=crypto.randomUUID();sql.prepare('INSERT INTO messages (id,connection,sender,body,created) VALUES (?,?,?,?,?)').run(expiryId,id,'alice','Old text',new Date(Date.now()-16*60000).toISOString());
assert.equal((await post('alice',{action:'edit_message',connection:id,message:expiryId,text:'Late edit',expectedRevision:0})).status,409);
assert.equal((await post('alice',{action:'delete_message',connection:id,message:expiryId})).status,409);sql.prepare('DELETE FROM messages WHERE id=?').run(expiryId);
sql.prepare("DELETE FROM safety_events WHERE kind IN ('read','write','message') AND actor IN (?,?)").run('alice','bob');
const initialRevision=await post('bob',{action:'messages',connection:id});assert(initialRevision.data.revision);
const unchangedRevision=await post('bob',{action:'messages',connection:id,knownRevision:initialRevision.data.revision});assert.equal(unchangedRevision.data.unchanged,true);assert(!unchangedRevision.data.messages,'unchanged response omits repeated history');
const audioAttempt=crypto.randomUUID(),audioId=JSON.stringify([id,'alice',audioAttempt]),audioPayload={attempt:audioAttempt,replyTo:rootMessage};
assert.equal((await voicePost('alice','direct',id,audioPayload)).status,200);assert.equal((await voicePost('alice','direct',id,audioPayload)).status,200);
assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM messages WHERE id=?').get(audioId).n,1);
const note=(await post('bob',{action:'messages',connection:id})).data.messages.find(m=>m.id===audioId);assert(note.audio);assert.equal(note.reply.id,rootMessage);assert(!JSON.stringify(note).includes('voice-notes/'));assert.equal((await voiceGet('bob',note.audio.url)).status,200);assert.equal((await voiceGet('referee',note.audio.url)).status,403,'owner cannot read unrelated chats');
// Safari probes bytes 0-1, then requests more ranges to decode and seek.
const fullAudio=await voiceGet('bob',note.audio.url),fullBytes=new Uint8Array(await fullAudio.arrayBuffer());
assert.equal(fullAudio.headers.get('content-length'),String(fullBytes.length));assert.equal(fullAudio.headers.get('accept-ranges'),'bytes');
for(const [range,start,end] of [['bytes=0-1',0,2],['bytes=8-',8,fullBytes.length],['bytes=-5',fullBytes.length-5,fullBytes.length],['bytes=5-999',5,fullBytes.length]]){
 const part=await voiceGet('bob',note.audio.url,{Range:range});assert.equal(part.status,206);assert.equal(part.headers.get('content-range'),`bytes ${start}-${end-1}/${fullBytes.length}`);assert.equal(part.headers.get('content-length'),String(end-start));assert.deepEqual(new Uint8Array(await part.arrayBuffer()),fullBytes.slice(start,end));
}
assert.equal((await voiceGet('bob',note.audio.url,{Range:'bytes=999-'})).status,416);
assert.equal((await voiceGet('bob',note.audio.url,{Range:'bytes=0-1','If-Range':'"different"'})).status,200);
assert.equal((await voiceGet('referee',note.audio.url,{Range:'bytes=0-1'})).status,403,'range requests keep participant authorization');
const mp4Attempt=crypto.randomUUID(),mp4Bytes=new Uint8Array([0,0,0,24,102,116,121,112,...Array(26).fill(7)]);
assert.equal((await voicePost('alice','direct',id,{attempt:mp4Attempt,body:mp4Bytes,headers:{'Content-Type':'audio/mp4;codecs=mp4a.40.2'}})).status,200);
const mp4Id=JSON.stringify([id,'alice',mp4Attempt]),mp4Note=(await post('bob',{action:'messages',connection:id})).data.messages.find(m=>m.id===mp4Id);
const mp4Playback=await voiceGet('bob',mp4Note.audio.url);assert.equal(mp4Playback.headers.get('content-type'),'audio/mp4');assert.deepEqual(new Uint8Array(await mp4Playback.arrayBuffer()),mp4Bytes,'uploaded MP4 bytes survive storage and playback unchanged');
await post('alice',{action:'delete_message',connection:id,message:mp4Id});
assert.equal((await voiceGet(null,note.audio.url)).status,401);assert.equal((await voicePost('alice','direct',id,{body:new Uint8Array(30)})).status,400);assert.equal((await voicePost('alice','direct',id,{headers:{'x-expected-account':'bob'}})).status,409);assert.equal((await voicePost('alice','direct',id,{headers:{Origin:'https://other.test'}})).status,403);assert.equal((await voicePost('alice','direct',id,{headers:{'x-voice-duration':'60001'}})).status,400);
assert.equal((await post('alice',{action:'edit_message',connection:id,message:audioId,text:'No audio edits',expectedRevision:0})).status,409);
const evidenceCount=memory.size,audioReport=await post('bob',{action:'report',target:'alice',type:'message',objectId:audioId,reason:'Privacy concern',details:'Please review this particular voice note.'});assert.equal(audioReport.status,200);assert.equal(memory.size,evidenceCount+1);
as('referee');const voiceQueue=await (await moderation.GET()).json();assert(!JSON.stringify(voiceQueue).includes('report-evidence/'));const evidenceURL=voiceQueue.cases.find(c=>c.id===audioReport.data.receipt).evidence.audio.url;
assert.equal((await voiceGet('bob',evidenceURL)).status,403);assert.equal((await voiceGet('referee',evidenceURL)).status,200);
sql.prepare('INSERT INTO blocks (actor,target) VALUES (?,?)').run('bob','alice');assert.equal((await post('bob',{action:'messages',connection:id,knownRevision:initialRevision.data.revision})).status,403,'known revision never bypasses access checks');assert.equal((await voiceGet('bob',note.audio.url)).status,403);assert.equal((await voicePost('alice','direct',id)).status,403);sql.prepare('DELETE FROM blocks WHERE actor=? AND target=?').run('bob','alice');
assert.equal((await post('alice',{action:'delete_message',connection:id,message:audioId})).status,200);assert.equal(memory.size,evidenceCount,'original removed while specific report copy remains');
assert.equal((await voiceGet('bob',note.audio.url)).status,403);assert.equal((await voiceGet('referee',evidenceURL)).status,200,'delete cannot erase previously reported evidence');
const copyKey=JSON.parse(sql.prepare('SELECT evidence FROM reports WHERE id=?').get(audioReport.data.receipt).evidence).audioEvidenceKey;
sql.prepare('UPDATE reports SET expires=? WHERE id=?').run(new Date(Date.now()-1000).toISOString(),audioReport.data.receipt);as('referee');await moderation.GET();assert(!memory.has(copyKey),'expired reported audio is removed');sql.prepare('DELETE FROM reports WHERE id=?').run(audioReport.data.receipt);sql.prepare('DELETE FROM messages WHERE id=?').run(audioId);
sql.prepare("DELETE FROM safety_events WHERE kind IN ('read','write','message','voice_upload','voice_read','moderation_read')").run();
console.log('Edit/delete ownership, revision limits, time expiry, private voice uploads, retry safety, block checks and reported audio retention passed.');

const sendKey=crypto.randomUUID(),beforeRetry=sql.prepare('SELECT COUNT(*) AS n FROM messages WHERE connection=?').get(id).n;
const attempt={action:'message',connection:id,text:'A retry-safe test opening',clientMessageId:sendKey};
assert.equal((await post('alice',attempt)).status,200);assert.equal((await post('alice',attempt)).status,200);
assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM messages WHERE connection=?').get(id).n,beforeRetry+1,'lost-response retry stores one message');
assert.equal((await post('alice',{...attempt,text:'Changed payload'})).status,409);
assert.equal((await post('charlie',attempt)).status,403);
sql.prepare('DELETE FROM messages WHERE id=?').run(JSON.stringify([id,'alice',sendKey]));
assert.equal((await post('charlie',{action:'messages',connection:id})).status,403,'nonparticipants cannot read messages');
// Two-person agreement, admission, private/group separation, and group boundaries.
async function circlePost(who,body){as(who);const r=await circles.POST(request(body));return {status:r.status,data:await r.json()};}
async function circleGet(who){as(who);const r=await circles.GET();return {status:r.status,data:await r.json()};}
assert.equal((await post('charlie',{action:'profile',profile:draft('charlie')})).status,200);assert.equal((await review({action:'admit',target:'charlie',reason:'Reviewed adult eligibility and orientation',adultReviewed:true})).status,200);
assert.equal((await circlePost('charlie',{action:'propose',connection:id,title:'History circle',description:'Explore identity and history together',tags:['History'],activity:'Read a short piece together'})).status,403);
assert.equal((await circlePost('alice',{action:'propose',connection:id,title:'History circle',description:'Explore identity and history together',tags:['History'],activity:'Read a short piece together',membershipRules:'Stay curious, respect boundaries, and ask before giving advice.'})).status,200);
assert.equal((await get('bob')).data.circleAlerts.proposals,1);assert.equal((await get('alice')).data.circleAlerts.proposals,0);let circle=(await circleGet('bob')).data.circles[0];assert(circle.canApprove);assert.equal(circle.membershipRules,'Stay curious, respect boundaries, and ask before giving advice.','optional circle guidelines persist in the existing rules field');assert.equal((await circleGet('charlie')).data.circles.length,0,'unapproved proposal is private');
assert.equal((await circlePost('alice',{action:'approve',circle:circle.id})).status,403,'proposer cannot approve alone');
assert.equal((await circlePost('charlie',{action:'approve',circle:circle.id})).status,403);
assert.equal((await circlePost('bob',{action:'approve',circle:circle.id})).status,200);assert.equal((await get('bob')).data.circleAlerts.proposals,0);
assert.equal((await circleGet('charlie')).data.circles.length,1);
assert.equal((await circlePost('charlie',{action:'conversation',circle:circle.id})).status,403);
assert.equal((await circlePost('alice',{action:'message',circle:circle.id,text:'Group context before new participant joins'})).status,200);assert.equal((await circlePost('charlie',{action:'request',circle:circle.id})).status,200);assert.equal((await get('bob')).data.circleAlerts.joinRequests,1);assert.equal((await get('charlie')).data.circleAlerts.joinRequests,0);
assert.equal((await circlePost('charlie',{action:'admit',circle:circle.id,target:'charlie'})).status,403);
assert.equal((await circlePost('bob',{action:'admit',circle:circle.id,target:'charlie'})).status,200);assert.equal((await get('bob')).data.circleAlerts.joinRequests,0);
let group=await circlePost('charlie',{action:'conversation',circle:circle.id});assert.equal(group.status,200);assert.equal(group.data.messages.length,0,'private messages never copied');
const quoteBeforeJoin=sql.prepare('SELECT id FROM circle_messages WHERE circle=? ORDER BY rowid ASC LIMIT 1').get(circle.id).id;
assert.equal((await circlePost('charlie',{action:'message',circle:circle.id,text:'Cannot quote older history',replyTo:quoteBeforeJoin})).status,403);
assert.equal((await circlePost('charlie',{action:'react',circle:circle.id,message:quoteBeforeJoin,emoji:'👍'})).status,403);
assert.equal((await circlePost('bob',{action:'message',circle:circle.id,text:'Reply visible without older quote',replyTo:quoteBeforeJoin,clientMessageId:crypto.randomUUID()})).status,200);
const filteredReply=(await circlePost('charlie',{action:'conversation',circle:circle.id})).data.messages.at(-1);
assert.equal(filteredReply.reply,null,'old quoted body does not leak to later joiners');assert.equal(filteredReply.replyUnavailable,true);
assert.equal((await circlePost('charlie',{action:'react',circle:circle.id,message:filteredReply.id,emoji:'👍'})).status,200);
assert.equal((await circlePost('charlie',{action:'react',circle:circle.id,message:filteredReply.id,emoji:'👍'})).status,200);
const sharedReaction=(await circlePost('bob',{action:'conversation',circle:circle.id})).data.messages.at(-1).reactions;
assert.deepEqual(sharedReaction,[{emoji:'👍',count:1,mine:false}]);
assert.equal((await circlePost('charlie',{action:'message',circle:circle.id,text:'Cross scope reply',replyTo:rootMessage})).status,403);
assert.equal((await circlePost('charlie',{action:'react',circle:circle.id,message:rootMessage,emoji:'👍'})).status,403);

const circleAudioAttempt=crypto.randomUUID(),circleAudioId=JSON.stringify([circle.id,'bob',circleAudioAttempt]);
assert.equal((await voicePost('bob','circle',circle.id,{attempt:circleAudioAttempt})).status,200);
let circleNote=(await circlePost('charlie',{action:'conversation',circle:circle.id})).data.messages.find(m=>m.id===circleAudioId);assert(circleNote.audio);assert.equal((await voiceGet('charlie',circleNote.audio.url)).status,200);
assert.equal((await circlePost('alice',{action:'delete_message',circle:circle.id,message:circleAudioId})).status,403);
assert.equal((await circlePost('bob',{action:'delete_message',circle:circle.id,message:circleAudioId})).status,200);assert.equal((await voiceGet('charlie',circleNote.audio.url)).status,403);
sql.prepare('DELETE FROM circle_messages WHERE id=?').run(circleAudioId);
assert.equal((await circlePost('bob',{action:'edit_message',circle:circle.id,message:filteredReply.id,text:'An updated reply',expectedRevision:0})).status,200);
assert.equal((await circlePost('charlie',{action:'conversation',circle:circle.id})).data.messages.at(-1).editHistory[0].body,'Reply visible without older quote');

sql.prepare('DELETE FROM circle_messages WHERE id=?').run(filteredReply.id);sql.prepare("DELETE FROM message_reactions WHERE scope=?").run(circle.id);
sql.prepare("DELETE FROM safety_events WHERE kind IN ('read','write','message') AND actor IN (?,?,?)").run('alice','bob','charlie');
assert(!JSON.stringify(group).includes('photoKey'));assert(!JSON.stringify(group).includes('connectionBoundary'));
as('charlie');assert.equal((await photo.GET(new Request('https://rl.test/api/photo?member=alice'))).status,403,'circle membership never grants photo access');
assert.equal((await circlePost('charlie',{action:'message',circle:circle.id,text:'Looking forward to learning together'})).status,200);
assert.equal((await circlePost('bob',{action:'conversation',circle:circle.id})).data.messages.at(-1).name,'charlie');
const groupKey=crypto.randomUUID(),groupAttempt={action:'message',circle:circle.id,text:'A retry-safe circle message',clientMessageId:groupKey};
assert.equal((await circlePost('bob',groupAttempt)).status,200);assert.equal((await circlePost('bob',groupAttempt)).status,200);
assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM circle_messages WHERE id=?').get(JSON.stringify([circle.id,'bob',groupKey])).n,1);
assert.equal((await circlePost('bob',{...groupAttempt,text:'Different payload'})).status,409);
sql.prepare('DELETE FROM circle_messages WHERE id=?').run(JSON.stringify([circle.id,'bob',groupKey]));
const blockedImage=await chatImagePost('alice','circle',circle.id,{caption:'Private circle photo'});assert.equal(blockedImage.response.status,200);
const blockedImageUrl='/api/chat-image?kind=circle&scope='+encodeURIComponent(circle.id)+'&message='+encodeURIComponent(blockedImage.id);
assert.equal((await chatImageGet('charlie',blockedImageUrl)).status,200,'an admitted circle member can view an unblocked sender photo');
const blockedVoice=crypto.randomUUID(),blockedVoiceId=JSON.stringify([circle.id,'alice',blockedVoice]);assert.equal((await voicePost('alice','circle',circle.id,{attempt:blockedVoice})).status,200);
const blockedVoiceUrl='/api/voice?kind=circle&scope='+encodeURIComponent(circle.id)+'&message='+encodeURIComponent(blockedVoiceId);
assert.equal((await voiceGet('charlie',blockedVoiceUrl)).status,200,'an admitted circle member can listen to an unblocked sender voice note');
assert.equal((await post('charlie',{action:'block',target:'alice'})).status,200);
assert.equal((await chatImageGet('charlie',blockedImageUrl)).status,404,'blocking a circle sender revokes that sender’s old photo URL');
assert.equal((await voiceGet('charlie',blockedVoiceUrl)).status,403,'blocking a circle sender revokes that sender’s old voice URL');
assert.equal((await circlePost('charlie',{action:'conversation',circle:circle.id})).status,200,'blocking does not remove the reporter from a circle');assert(!(await circlePost('charlie',{action:'conversation',circle:circle.id})).data.members.some(m=>m.id==='alice'));
assert.equal((await circlePost('charlie',{action:'react',circle:circle.id,message:quoteBeforeJoin,emoji:'👍'})).status,403,'blocked or old messages cannot receive reactions');
const childKey=crypto.randomUUID(),childId=JSON.stringify([circle.id,'bob',childKey]);
assert.equal((await circlePost('bob',{action:'message',circle:circle.id,text:'A quote of hidden sender',replyTo:quoteBeforeJoin,clientMessageId:childKey})).status,200);
assert.equal((await circlePost('charlie',{action:'conversation',circle:circle.id})).data.messages.at(-1).reply,null,'blocked sender is not exposed through quotes');
sql.prepare('DELETE FROM circle_messages WHERE id=?').run(childId);

const retainedImage=await chatImagePost('bob','circle',circle.id,{caption:'Retained circle photo'});assert.equal(retainedImage.response.status,200);
const retainedImageUrl='/api/chat-image?kind=circle&scope='+encodeURIComponent(circle.id)+'&message='+encodeURIComponent(retainedImage.id);
const retainedVoice=crypto.randomUUID(),retainedVoiceId=JSON.stringify([circle.id,'bob',retainedVoice]);assert.equal((await voicePost('bob','circle',circle.id,{attempt:retainedVoice})).status,200);
const retainedVoiceUrl='/api/voice?kind=circle&scope='+encodeURIComponent(circle.id)+'&message='+encodeURIComponent(retainedVoiceId);
assert.equal((await chatImageGet('charlie',retainedImageUrl)).status,200,'a current member can view the photo before leaving');
assert.equal((await voiceGet('charlie',retainedVoiceUrl)).status,200,'a current member can play the voice note before leaving');
assert.equal((await circlePost('charlie',{action:'leave',circle:circle.id})).status,200,'can leave a blocked shared circle');
assert.equal((await chatImageGet('charlie',retainedImageUrl)).status,403,'leaving revokes previously shared media URLs');
assert.equal((await voiceGet('charlie',retainedVoiceUrl)).status,403,'leaving revokes previously shared voice URLs');
assert.equal((await post('charlie',{action:'unblock',target:'alice'})).status,200);
assert.equal((await circlePost('charlie',{action:'request',circle:circle.id})).status,200);
assert.equal((await circlePost('bob',{action:'admit',circle:circle.id,target:'charlie'})).status,200);
const removedImage=await chatImagePost('bob','circle',circle.id,{caption:'Photo before removal'});assert.equal(removedImage.response.status,200);
const removedImageUrl='/api/chat-image?kind=circle&scope='+encodeURIComponent(circle.id)+'&message='+encodeURIComponent(removedImage.id);
const removedVoice=crypto.randomUUID(),removedVoiceId=JSON.stringify([circle.id,'bob',removedVoice]);assert.equal((await voicePost('bob','circle',circle.id,{attempt:removedVoice})).status,200);
const removedVoiceUrl='/api/voice?kind=circle&scope='+encodeURIComponent(circle.id)+'&message='+encodeURIComponent(removedVoiceId);
assert.equal((await chatImageGet('charlie',removedImageUrl)).status,200,'re-admitted member can see media shared after rejoining');
assert.equal((await voiceGet('charlie',removedVoiceUrl)).status,200,'re-admitted member can listen to voice shared after rejoining');
assert.equal((await circlePost('bob',{action:'remove',circle:circle.id,target:'charlie'})).status,200);
assert.equal((await chatImageGet('charlie',removedImageUrl)).status,403,'removal revokes media URLs issued during the new membership');
assert.equal((await voiceGet('charlie',removedVoiceUrl)).status,403,'removal revokes voice URLs issued during the new membership');
for(const mediaId of [blockedImage.id,retainedImage.id,removedImage.id]){const media=sql.prepare('SELECT attachment_key FROM circle_messages WHERE id=?').get(mediaId);if(media?.attachment_key)memory.delete(media.attachment_key);sql.prepare('DELETE FROM circle_messages WHERE id=?').run(mediaId);}
for(const mediaId of [blockedVoiceId,retainedVoiceId,removedVoiceId]){const media=sql.prepare('SELECT audio_key FROM circle_messages WHERE id=?').get(mediaId);if(media?.audio_key)memory.delete(media.audio_key);sql.prepare('DELETE FROM circle_messages WHERE id=?').run(mediaId);}
assert.equal((await circlePost('charlie',{action:'leave',circle:circle.id})).status,403,'removed members cannot downgrade their removal');
assert.equal((await circlePost('charlie',{action:'request',circle:circle.id})).status,403,'removal cannot be evaded');
assert.equal((await post('charlie',{action:'delete'})).status,200);
assert.equal((await post('charlie',{action:'profile',profile:draft('charlie')})).status,200);
assert.equal((await circlePost('charlie',{action:'request',circle:circle.id})).status,403,'profile recreation cannot evade circle removal');
assert.equal((await circlePost('alice',{action:'leave',circle:circle.id})).status,200);
assert.equal((await circlePost('bob',{action:'conversation',circle:circle.id})).status,200,'circle can continue with one host');
assert.equal((await circlePost('bob',{action:'leave',circle:circle.id})).status,200);
assert.equal((await circleGet('bob')).data.circles.length,0,'last host leaving closes circle');
assert.equal((await post('alice',{action:'visibility',active:false})).status,200);
as('bob');assert.equal((await photo.GET(new Request('https://rl.test/api/photo?member=alice'))).status,403,'pausing stops photo access');
assert.equal((await post('alice',{action:'profile',profile:draft('alice')})).status,200);assert.equal((await get('alice')).data.me.active,false,'profile edits preserve a pause');assert.equal((await post('alice',{action:'visibility',active:true})).status,200);assert.equal((await get('alice')).data.me.hasPhoto,true,'profile edit retains private photo');
assert.equal((await post('bob',{action:'close',connection:id})).status,200);
as('bob');assert.equal((await photo.GET(new Request('https://rl.test/api/photo?member=alice'))).status,403,'unmatching stops photo access');
assert.equal((await post('bob',{action:'report',target:'alice',reason:'Other',details:'A test report after unmatching.'})).status,200);
assert.equal((await post('alice',{action:'invite',target:'bob',kind:'Friendship',proposal:'One conversation about the reading'})).status,403,'cannot repeat contact after decline');assert.equal((await post('alice',{action:'allow_reconnect',connection:id})).status,403);assert.equal((await post('bob',{action:'allow_reconnect',connection:id})).status,200);const oldId=id;assert.equal((await post('alice',{action:'invite',target:'bob',proposal:'One conversation about the reading'})).status,200);id=(await get('bob')).data.connections[0].id;assert.notEqual(id,oldId);assert.equal((await post('bob',{action:'accept',connection:id})).status,200);assert.equal((await post('alice',{action:'messages',connection:id})).data.messages.length,0,'new connection never restores old messages');
assert.equal((await post('alice',{action:'message',connection:id,text:'A test message for incident evidence'})).status,200);
const incident=(await post('bob',{action:'messages',connection:id})).data.messages[0];
const reported=await post('bob',{action:'report',target:'alice',type:'message',objectId:incident.id,reason:'Harassment',details:'Please review this test incident.'});assert.equal(reported.status,200);
as('charlie');assert.equal((await moderation.GET()).status,403,'ordinary members cannot see review queue');
assert.equal((await review({action:'grant_moderator',target:'bob',reason:'Appoint independent reviewer for testing'})).status,200);
assert.equal((await review({action:'suspend',report:reported.data.receipt,target:'alice',reason:'Test reporter conflict rejection'},'bob')).status,403,'reporter cannot judge their own case');
assert.equal((await review({action:'remove_message',report:reported.data.receipt,target:'alice',reason:'Confirmed reported content violates guidelines'})).status,200);
assert.equal((await post('bob',{action:'messages',connection:id})).data.messages.length,0);
assert.equal((await post('alice',{action:'message',connection:id,text:'A fresh message after moderation removal'})).status,200);assert.equal((await get('bob')).data.connections.find(c=>c.id===id).unread,1,'moderation removal does not cause new unread messages to be missed');

assert.equal((await review({action:'suspend',report:reported.data.receipt,target:'alice',reason:'Confirmed abuse requires a suspension'})).status,200);
assert.equal((await post('alice',{action:'profile',profile:draft('alice')})).status,403,'suspended account cannot recreate profile to evade enforcement');
assert.equal((await post('alice',{action:'message',connection:id,text:'Cannot send'})).status,403);
assert.equal((await post('alice',{action:'report',target:'alice',type:'appeal',reason:'Other',details:'Please reconsider this suspension.'})).status,200,'appeals remain accessible');
assert.equal((await review({action:'restore',report:reported.data.receipt,target:'alice',reason:'Reviewed test appeal and restored access'})).status,200);
assert.equal((await review({action:'resolve',report:reported.data.receipt,target:'alice',reason:'Completed review and resolution'})).status,200);
assert.equal((await post('alice',{action:'message',connection:id,text:'Please send me nudes'})).status,400);
assert.equal((await post('alice',{action:'message',connection:id,text:'Read https://example.test'})).status,400);
const evidence=sql.prepare('SELECT evidence FROM reports WHERE id=?').get(reported.data.receipt);assert(JSON.parse(evidence.evidence).body.includes('incident evidence'),'reported text retained independently of message deletion');
assert.equal((await post('bob',{action:'block',target:'alice'})).status,200);assert(!(await get('alice')).data.people.some(p=>p.id==='bob'));assert.equal((await post('alice',{action:'message',connection:id,text:'Blocked'})).status,403);
as('bob');assert.equal((await photo.GET(new Request('https://rl.test/api/photo?member=alice'))).status,403,'blocking stops photo access');
assert.equal((await post('alice',{action:'visibility',active:false})).status,200);assert.equal((await get('alice')).data.me.active,false,'pause applies immediately');assert.equal((await post('alice',{action:'profile',profile:{...draft('alice'),active:true}})).status,200);assert.equal((await get('alice')).data.me.active,false,'saving a stale active editor never undoes a pause');assert.equal((await post('alice',{action:'visibility',active:true})).status,200);assert.equal((await get('alice')).data.me.active,true);
assert.equal((await post('alice',{action:'delete'})).status,200);assert.equal(memory.size,1,'deletion removes profile photo while narrowly reported evidence is retained');assert.equal((await get('alice')).data.me,null);
as('referee');assert.equal((await photo.GET(new Request('https://rl.test/api/photo?member=alice&report='+photoReport.data.receipt))).status,200,'independent reviewer can inspect preserved evidence after deletion');
as('charlie');assert.equal((await photo.GET(new Request('https://rl.test/api/photo?member=alice&report='+photoReport.data.receipt))).status,404,'ordinary members cannot retrieve reported evidence');
assert.equal((await post('bob',{action:'unblock',target:'alice'})).status,200);
assert.equal((await post('alice',{action:'profile',profile:draft('alice')})).status,200);
assert.equal((await post('alice',{action:'invite',target:'bob',proposal:'Trying again after deleting my profile'})).status,403,'deleting a profile cannot erase a declined-contact restriction');
assert.equal((await post('alice',{action:'invite',target:'bob',proposal:'Trying again despite the daily limit'})).status,429,'attempt limits persist across profile deletion');
sql.prepare('UPDATE reports SET expires=? WHERE id=?').run('2000-01-01T00:00:00.000Z',photoReport.data.receipt);as('referee');assert.equal((await moderation.GET()).status,200);assert.equal(memory.size,0,'expired reported image evidence is removed');
const legacy={...draft('old'),intentions:['Build community']};assert.equal(model.normalizeProfile(legacy).intentions[0],'Connect');
console.log('Safety, account, invitation, circle, and protected-photo flow checks passed');
// Discovery visibility is independent of the full interaction pause.
for(const who of ['visible-a','visible-b','visible-c']){assert.equal((await post(who,{action:'profile',profile:draft(who)})).status,200);assert.equal((await review({action:'admit',target:who,reason:'Review test adult eligibility and orientation',adultReviewed:true})).status,200);}
assert.equal((await get('visible-a')).data.me.discoverable,true,'legacy/new profiles are shown by default');
assert.equal((await post('visible-a',{action:'invite',target:'visible-b',proposal:'Discuss a shared interest together'})).status,200);
const visibilityConnection=(await get('visible-b')).data.connections.find(c=>c.person.id==='visible-a').id;
assert.equal((await post('visible-a',{action:'discovery_visibility',discoverable:'false'})).status,400,'visibility requires an explicit boolean');
assert.equal((await post('visible-a',{action:'visibility',active:'false'})).status,400,'pause requires an explicit boolean');
assert.equal((await post('visible-a',{action:'discovery_visibility',discoverable:false})).status,200);
let hidden=(await get('visible-a')).data;assert.equal(hidden.me.discoverable,false);assert.equal(hidden.canConnect,true,'hidden members remain active');
assert(!(await get('visible-c')).data.people.some(p=>p.id==='visible-a'),'hidden profiles are absent from discovery');
assert.equal((await post('visible-c',{action:'invite',target:'visible-a',proposal:'Trying a saved profile identifier'})).status,403,'knowing a hidden ID cannot bypass visibility');
assert.equal((await post('visible-a',{action:'invite',target:'visible-c',proposal:'Trying to send while hidden'})).status,403,'hidden members cannot silently initiate new introductions');
assert.equal((await post('visible-b',{action:'accept',connection:visibilityConnection})).status,200,'existing pending invitations remain actionable while hidden');
assert((await get('visible-b')).data.connections.some(c=>c.id===visibilityConnection),'existing contact retains profile access');
assert.equal((await post('visible-b',{action:'message',connection:visibilityConnection,text:'An existing conversation still works'})).status,200);
assert.equal((await post('visible-a',{action:'messages',connection:visibilityConnection})).status,200);
assert.equal((await post('visible-a',{action:'profile',profile:{...draft('visible-a'),discoverable:true}})).status,200);
assert.equal((await get('visible-a')).data.me.discoverable,false,'stale profile edits cannot undo hiding');
assert.equal((await circlePost('visible-a',{action:'propose',connection:visibilityConnection,title:'Visibility test circle',description:'Explore shared interests without exposing profiles',tags:['History'],activity:'Read together'})).status,200);
const visibilityCircle=(await circleGet('visible-b')).data.circles.find(c=>c.title==='Visibility test circle').id;
assert.equal((await circlePost('visible-b',{action:'approve',circle:visibilityCircle})).status,200);
assert.equal((await circlePost('visible-a',{action:'message',circle:visibilityCircle,text:'Group participation works while hidden'})).status,200);
assert.equal((await post('visible-a',{action:'visibility',active:false})).status,200);
assert.equal((await post('visible-b',{action:'message',connection:visibilityConnection,text:'This should be stopped'})).status,403);
assert.equal((await post('visible-a',{action:'messages',connection:visibilityConnection})).status,403);
assert.equal((await circlePost('visible-a',{action:'conversation',circle:visibilityCircle})).status,403);
assert.equal((await circlePost('visible-a',{action:'message',circle:visibilityCircle,text:'This should also be stopped'})).status,403);
const pausedCircles=(await circleGet('visible-a')).data.circles;assert(pausedCircles.every(c=>c.membership==='accepted'||c.membership==='requested'),'paused members only receive their existing circles');
assert(pausedCircles.some(c=>c.id===visibilityCircle),'paused membership remains available for leaving/reporting');
assert.equal((await post('visible-a',{action:'visibility',active:true})).status,200);assert.equal((await get('visible-a')).data.me.discoverable,false,'resuming never undoes hiding');
assert.equal((await post('visible-a',{action:'discovery_visibility',discoverable:true})).status,200);assert((await get('visible-c')).data.people.some(p=>p.id==='visible-a'),'explicitly showing restores discovery');
assert.equal((await post('visible-a',{action:'visibility',active:false})).status,200);assert.equal((await circlePost('visible-a',{action:'leave',circle:visibilityCircle})).status,200,'paused members can leave existing circles');assert.equal((await post('visible-a',{action:'close',connection:visibilityConnection})).status,200,'paused members can end existing connections');
console.log('Discovery hiding, pending/existing contact, pause/resume, and circle boundary checks passed');

const visibilityReport=await post('visible-b',{action:'report',target:'visible-c',reason:'Other',details:'Test visibility does not override an independent moderation restriction.'});assert.equal(visibilityReport.status,200);assert.equal((await review({action:'suspend',report:visibilityReport.data.receipt,target:'visible-c',reason:'Test visibility cannot bypass moderation'})).status,200);assert.equal((await post('visible-c',{action:'discovery_visibility',discoverable:true})).status,403,'showing cannot bypass suspension');assert.equal((await post('visible-c',{action:'visibility',active:true})).status,403,'resuming cannot bypass suspension');

// New invitation context is canonical public content, retained only for participants.
for(const actor of ['invite-a','invite-b','invite-c']){assert.equal((await post(actor,{action:'profile',profile:draft(actor)})).status,200);assert.equal((await review({action:'admit',target:actor,reason:'Reviewed adult pilot eligibility',adultReviewed:true})).status,200);}
assert.equal((await get('invite-a')).data.invitationLimit.remaining,5);
assert.equal((await post('invite-a',{action:'invite',target:'invite-b',proposal:'Let us discuss this.',contextKey:'connectionBoundary',contextText:'Friendship only'})).status,409,'private fields cannot become quoted context');
assert.equal((await post('invite-a',{action:'invite',target:'invite-b',proposal:'Let us discuss this.',contextKey:'about',contextText:'Fabricated answer'})).status,409,'invented or stale quotes are rejected');
const inviteTarget=(await get('invite-a')).data.people.find(p=>p.id==='invite-b');
assert.equal((await post('invite-a',{action:'invite',target:'invite-b',proposal:'What got you interested in this?',contextKey:'about',contextText:inviteTarget.about})).status,200);
const quoted=(await get('invite-b')).data.connections.find(c=>c.person.id==='invite-a');assert.equal(quoted.context.text,inviteTarget.about);assert.equal(quoted.context.key,'about');assert(!(await get('invite-c')).data.connections.some(c=>c.id===quoted.id),'outsiders cannot read invitation context');
assert.equal((await post('invite-b',{action:'profile',profile:{...draft('invite-b'),about:'A changed introduction.'}})).status,200);assert.equal((await get('invite-a')).data.connections.find(c=>c.id===quoted.id).context.text,inviteTarget.about,'editing a profile does not rewrite the opening');
assert.equal((await post('invite-b',{action:'close',connection:quoted.id})).status,200);assert.equal((await get('invite-a')).data.connections.find(c=>c.id===quoted.id).closure_kind,'declined');assert.equal((await post('invite-a',{action:'invite',target:'invite-b',proposal:'A repeat invitation.'})).status,403,'decline still prevents further contact');
assert.equal((await post('invite-a',{action:'invite',target:'invite-c',proposal:'A small conversation together.'})).status,200);const withdrawn=(await get('invite-a')).data.connections.find(c=>c.person.id==='invite-c');assert.equal((await post('invite-a',{action:'close',connection:withdrawn.id})).status,200);assert.equal((await get('invite-c')).data.connections.find(c=>c.id===withdrawn.id).closure_kind,'withdrawn');
assert.equal((await get('invite-a')).data.invitationLimit.remaining,0);assert((await get('invite-a')).data.invitationLimit.resetAt);assert.equal((await post('invite-a',{action:'invite',target:'invite-c',proposal:'Another attempt.'})).status,429);
assert.equal((await post('invite-b',{action:'invite',target:'invite-c',proposal:'Shall we talk about a shared interest?'})).status,200);const accepted=(await get('invite-c')).data.connections.find(c=>c.person.id==='invite-b');assert.equal((await post('invite-c',{action:'accept',connection:accepted.id})).status,200);assert.equal((await post('invite-b',{action:'close',connection:accepted.id})).status,200);assert.equal((await get('invite-c')).data.connections.find(c=>c.id===accepted.id).closure_kind,'ended');
console.log('Public invitation context, participant privacy, closure states, and rolling limit checks passed');

// Circle agreement and actionable request counts stay consistent across pause/block states.
for(const actor of ['circle-a','circle-b','circle-c','circle-d']){assert.equal((await post(actor,{action:'profile',profile:draft(actor)})).status,200);assert.equal((await review({action:'admit',target:actor,reason:'Reviewed adult circle pilot eligibility',adultReviewed:true})).status,200);}
assert.equal((await post('circle-a',{action:'invite',target:'circle-b',proposal:'Explore history together.'})).status,200);const circleConnection=(await get('circle-b')).data.connections.find(c=>c.person.id==='circle-a').id;assert.equal((await post('circle-b',{action:'accept',connection:circleConnection})).status,200);
assert.equal((await circlePost('circle-a',{action:'propose',connection:circleConnection,title:'Agreement test circle',description:'Explore history through a shared reading',tags:['History'],activity:'Read together'})).status,200);
const proposalForB=(await circleGet('circle-b')).data.circles.find(c=>c.title==='Agreement test circle');const circleId=proposalForB.id;assert.equal(proposalForB.awaitingYourAgreement,true);assert.equal((await circleGet('circle-a')).data.circles.find(c=>c.id===circleId).awaitingYourAgreement,false);assert(!(await circleGet('circle-c')).data.circles.some(c=>c.id===circleId),'proposals stay private to founders');
assert.equal((await post('circle-b',{action:'visibility',active:false})).status,200);const pausedProposal=(await circleGet('circle-b')).data.circles.find(c=>c.id===circleId);assert.equal(pausedProposal.awaitingYourAgreement,true);assert.equal(pausedProposal.canApprove,false);assert.equal((await post('circle-b',{action:'visibility',active:true})).status,200);assert.equal((await circlePost('circle-b',{action:'approve',circle:circleId})).status,200);
assert.equal((await circlePost('circle-c',{action:'request',circle:circleId})).status,200);assert.equal((await circleGet('circle-a')).data.circles.find(c=>c.id===circleId).joinRequests,1);assert.equal((await get('circle-a')).data.circleAlerts.joinRequests,1);assert.equal((await circlePost('circle-a',{action:'conversation',circle:circleId})).data.members.find(m=>m.id==='circle-c').canAdmit,true);
assert.equal((await post('circle-c',{action:'visibility',active:false})).status,200);assert.equal((await circleGet('circle-a')).data.circles.find(c=>c.id===circleId).joinRequests,0);assert.equal((await get('circle-a')).data.circleAlerts.joinRequests,0);assert.equal((await circlePost('circle-a',{action:'conversation',circle:circleId})).data.members.find(m=>m.id==='circle-c').canAdmit,false);
assert.equal((await post('circle-c',{action:'visibility',active:true})).status,200);assert.equal((await circlePost('circle-d',{action:'request',circle:circleId})).status,200);assert.equal((await circlePost('circle-a',{action:'admit',circle:circleId,target:'circle-d'})).status,200);assert.equal((await post('circle-c',{action:'block',target:'circle-d'})).status,200);assert.equal((await circleGet('circle-a')).data.circles.find(c=>c.id===circleId).joinRequests,0,'a block involving any participant makes approval unavailable');assert.equal((await get('circle-a')).data.circleAlerts.joinRequests,0);assert.equal((await circlePost('circle-a',{action:'conversation',circle:circleId})).data.members.find(m=>m.id==='circle-c').canAdmit,false);assert.equal((await circlePost('circle-c',{action:'leave',circle:circleId})).status,200,'restricted applicants can withdraw');
assert.equal((await circlePost('circle-a',{action:'leave',circle:circleId})).status,200);assert((await circleGet('circle-b')).data.circles.some(c=>c.id===circleId),'leaving one host preserves the circle');assert.equal((await circlePost('circle-b',{action:'leave',circle:circleId})).status,200);assert(!(await circleGet('circle-d')).data.circles.some(c=>c.id===circleId),'last host leaving closes the circle');
console.log('Founder agreement states, actionable circle request counts, and host leave behavior passed');

// Safety review: reporting never grants access outside an authorized history.
for(const actor of ['guard-a','guard-b','guard-c','guard-d','guard-e']){assert.equal((await post(actor,{action:'profile',profile:draft(actor)})).status,200);assert.equal((await review({action:'admit',target:actor,reason:'Reviewed adult safety pilot eligibility',adultReviewed:true})).status,200);}
assert.equal((await post('guard-a',{action:'invite',target:'guard-b',proposal:'Explore a shared interest.'})).status,200);const guardConnection=(await get('guard-b')).data.connections.find(c=>c.person.id==='guard-a').id;assert.equal((await post('guard-b',{action:'accept',connection:guardConnection})).status,200);
assert.equal((await circlePost('guard-a',{action:'propose',connection:guardConnection,title:'Reporting boundary circle',description:'Explore history and responsible connection',tags:['History'],activity:'Read together'})).status,200);const guardCircle=(await circleGet('guard-b')).data.circles.find(c=>c.title==='Reporting boundary circle').id;assert.equal((await circlePost('guard-b',{action:'approve',circle:guardCircle})).status,200);
assert.equal((await circlePost('guard-a',{action:'message',circle:guardCircle,text:'Before the applicant joined'})).status,200);const beforeJoin=(await circlePost('guard-a',{action:'conversation',circle:guardCircle})).data.messages.at(-1).id;
assert.equal((await circlePost('guard-c',{action:'request',circle:guardCircle})).status,200);const groupReport=(objectId)=>({action:'report',target:'guard-a',type:'circle_message',scope:guardCircle,objectId,reason:'Other',details:'Test report history boundary.'});assert.equal((await post('guard-c',groupReport(beforeJoin))).status,403,'an applicant cannot attach group messages');assert.equal((await circlePost('guard-c',{action:'search_messages',circle:guardCircle,query:'Before'})).status,403,'an applicant cannot search circle history');assert.equal((await circlePost('guard-b',{action:'admit',circle:guardCircle,target:'guard-c'})).status,200);assert.equal((await post('guard-c',groupReport(beforeJoin))).status,403,'admission does not expose prior messages through reports');assert.equal((await circlePost('guard-c',{action:'search_messages',circle:guardCircle,query:'Before'})).data.messages.length,0,'circle search respects the member history cutoff');
assert.equal((await circlePost('guard-a',{action:'message',circle:guardCircle,text:'During the permitted membership'})).status,200);const withinJoin=(await circlePost('guard-a',{action:'conversation',circle:guardCircle})).data.messages.at(-1).id;const permittedSearch=await circlePost('guard-c',{action:'search_messages',circle:guardCircle,query:'permitted membership'});assert.equal(permittedSearch.status,200);assert.equal(permittedSearch.data.messages.length,1);assert.equal(permittedSearch.data.messages[0].body,'During the permitted membership');assert(Number.isInteger(permittedSearch.data.messages[0].rowid),'search results include a cursor for opening the original message');assert.equal((await circlePost('guard-c',{action:'search_messages',circle:guardCircle,query:'x'})).status,400,'circle search validates minimum length');assert.equal((await circlePost('guard-c',{action:'leave',circle:guardCircle})).status,200);assert.equal((await circlePost('guard-c',{action:'search_messages',circle:guardCircle,query:'permitted'})).status,403,'former members cannot search after leaving');assert.equal((await circlePost('guard-a',{action:'message',circle:guardCircle,text:'After this person left'})).status,200);const afterLeave=(await circlePost('guard-a',{action:'conversation',circle:guardCircle})).data.messages.at(-1).id;assert.equal((await post('guard-c',groupReport(withinJoin))).status,200,'former members can report previously permitted messages');assert.equal((await post('guard-c',groupReport(afterLeave))).status,403,'former members cannot attach future messages');assert.equal((await post('guard-d',groupReport(withinJoin))).status,403,'nonmembers cannot attach group messages');
assert.equal((await post('guard-b',{action:'discovery_visibility',discoverable:false})).status,200);assert.equal((await post('guard-e',{action:'report',target:'guard-b',reason:'Other',details:'An arbitrary hidden identifier.'})).status,403,'knowing a hidden ID does not authorize profile evidence');assert.equal((await post('guard-c',{action:'report',target:'guard-b',reason:'Other',details:'A concern about past group interaction.'})).status,200);const pastGroup=sql.prepare("SELECT evidence FROM reports WHERE actor='guard-c' AND target='guard-b' ORDER BY rowid DESC LIMIT 1").get();assert.deepEqual(JSON.parse(pastGroup.evidence),{},'group reports do not copy a hidden full profile');
assert.equal((await post('guard-c',{action:'report',expectedAccount:'guard-a',target:'guard-b',reason:'Other',details:'Stale account submission.'})).status,409);assert.equal((await post('guard-c',{action:'report',target:'guard-b',type:'appeal',reason:'Other',details:'Appeal somebody else.'})).status,403);assert.equal((await review({action:'grant_moderator',target:'guard-d',reason:'Assign an independent reviewer for test'})).status,200);
assert.equal((await post('guard-d',{action:'invite',target:'guard-c',proposal:'Talk about an interest.'})).status,200);const reporterCase=await post('guard-c',{action:'report',target:'guard-a',reason:'Other',details:'Reviewer is connected to reporter.'});assert.equal(reporterCase.status,200);as('guard-d');const conflictQueue=await (await moderation.GET()).json();assert.equal(conflictQueue.cases.find(c=>c.id===reporterCase.data.receipt).conflict,true);assert(!('details' in conflictQueue.cases.find(c=>c.id===reporterCase.data.receipt)));assert.equal((await review({action:'dismiss',report:reporterCase.data.receipt,target:'guard-a',reason:'Connected reviewer must not decide'},'guard-d')).status,403);
assert.equal((await post('pending-applicant',{action:'profile',profile:draft('pending-applicant')})).status,200);sql.prepare("INSERT INTO connections (id,sender,recipient,status,kind,created) VALUES ('reviewer-applicant-conflict','guard-d','pending-applicant','accepted','Connect',?)").run(new Date().toISOString());as('guard-d');const conflictedAdmissionQueue=await (await moderation.GET()).json();assert.equal(conflictedAdmissionQueue.admissions.some(a=>a.id==='pending-applicant'),false,'a conflicted reviewer cannot see applicant identity details');as('referee');const ownerAdmissionQueue=await (await moderation.GET()).json();assert.equal(ownerAdmissionQueue.admissions.some(a=>a.id==='pending-applicant'),true,'the owner retains access to admission applicants');
as('guard-b');assert.equal((await photo.POST(new Request('https://rl.test/api/photo',{method:'POST',headers:{Origin:'https://rl.test','Content-Type':'image/png','x-reveal-consent':'yes','x-expected-account':'guard-a'},body:image}))).status,409);as('guard-b');assert.equal((await photo.POST(new Request('https://rl.test/api/photo',{method:'POST',headers:{Origin:'https://rl.test','Content-Type':'image/png','x-reveal-consent':'yes'},body:image}))).status,200);assert.equal((await get('guard-b')).data.me.discoverable,false,'photo upload preserves discovery privacy');assert.equal((await get('guard-b')).data.me.photoPending,false,'uploaded photo can be shared without review');assert.equal((await post('guard-a',{action:'photo_consent',connection:guardConnection,share:true})).status,200);assert.equal((await post('guard-b',{action:'photo_consent',connection:guardConnection,share:true})).status,200);
const guardPhotoReport=await post('guard-a',{action:'report',type:'photo',target:'guard-b',reason:'Privacy concern',details:'Attach the currently shared photo.'});assert.equal(guardPhotoReport.status,200);assert.equal((await post('guard-a',{action:'photo_consent',connection:guardConnection,share:false})).status,200);assert.equal((await post('guard-a',{action:'report',type:'photo',target:'guard-b',reason:'Privacy concern',details:'Consent was revoked.'})).status,403);
// A report is bound to the photo version it captured, so moderation cannot
// accidentally remove a newer replacement uploaded while the case was open.
 const oldPhotoKey=JSON.parse(sql.prepare("SELECT data FROM profiles WHERE id='guard-b'").get().data).photoKey,replacementPhotoKey='profile-photos/guard-b-replacement.png';await globalThis.__rlEnv.BUCKET.put(replacementPhotoKey,image);sql.prepare("UPDATE profiles SET data=json_set(data,'$.photoKey',?,'$.photoPending',json('false')) WHERE id='guard-b'").run(replacementPhotoKey);await globalThis.__rlEnv.BUCKET.delete(oldPhotoKey);assert.equal((await review({action:'remove_photo',report:guardPhotoReport.data.receipt,target:'guard-b',reason:'Do not remove an unrelated replacement photo'})).status,409);assert.equal((await get('guard-b')).data.me.photoUploaded,true,'a report for an older photo cannot remove its replacement');assert(globalThis.__rlEnv.BUCKET&&await globalThis.__rlEnv.BUCKET.head(replacementPhotoKey),'the unrelated replacement photo remains stored');
sql.prepare('UPDATE reports SET expires=? WHERE id=?').run('2000-01-01T00:00:00.000Z',guardPhotoReport.data.receipt);as('referee');assert.equal((await photo.GET(new Request('https://rl.test/api/photo?member=guard-b&report='+guardPhotoReport.data.receipt))).status,404,'expired evidence does not fall back to a current photo before cleanup');
const directCount=sql.prepare('SELECT COUNT(*) AS n FROM messages WHERE connection=?').get(guardConnection).n;
globalThis.__beforeRun=(query)=>{if(query.startsWith('INSERT INTO messages')){globalThis.__beforeRun=null;sql.prepare("UPDATE connections SET status='closed' WHERE id=?").run(guardConnection);}};assert.equal((await post('guard-a',{action:'message',connection:guardConnection,text:'Permission changed during send'})).status,403);assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM messages WHERE connection=?').get(guardConnection).n,directCount,'closing during a send prevents insertion');
const groupCount=sql.prepare('SELECT COUNT(*) AS n FROM circle_messages WHERE circle=?').get(guardCircle).n;
globalThis.__beforeRun=(query)=>{if(query.startsWith('INSERT INTO circle_messages')){globalThis.__beforeRun=null;sql.prepare("UPDATE circle_members SET status='left' WHERE circle=? AND member=?").run(guardCircle,'guard-b');}};assert.equal((await circlePost('guard-b',{action:'message',circle:guardCircle,text:'Membership changed during send'})).status,403);assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM circle_messages WHERE circle=?').get(guardCircle).n,groupCount,'leaving during a send prevents insertion');
console.log('Report history/privacy, reviewer conflicts, photo evidence expiry, stale-account guards, and send-time permission races passed');

// Photo review is bound to the specific version loaded, without overwriting privacy choices.
as('guard-b');assert.equal((await photo.POST(new Request('https://rl.test/api/photo',{method:'POST',headers:{Origin:'https://rl.test','Content-Type':'image/png','x-reveal-consent':'yes'},body:image}))).status,200);sql.prepare("UPDATE profiles SET data=json_set(data,'$.photoPending',json('true')) WHERE id='guard-b'").run();as('referee');const firstReviewToken=(await (await moderation.GET()).json()).photos.find(p=>p.id==='guard-b').reviewToken;
globalThis.__beforeRun=(query)=>{if(query.startsWith('UPDATE profiles SET data=json_set')){globalThis.__beforeRun=null;sql.prepare("UPDATE profiles SET data=json_set(data,'$.discoverable',json('false')) WHERE id='guard-b'").run();}};
as('guard-b');assert.equal((await photo.POST(new Request('https://rl.test/api/photo',{method:'POST',headers:{Origin:'https://rl.test','Content-Type':'image/png','x-reveal-consent':'yes'},body:image}))).status,200);assert.equal((await get('guard-b')).data.me.discoverable,false,'photo updates preserve a concurrent visibility decision');sql.prepare("UPDATE profiles SET data=json_set(data,'$.photoPending',json('true')) WHERE id='guard-b'").run();assert.equal((await review({action:'approve_photo',target:'guard-b',reviewToken:firstReviewToken,reason:'Stale photo must not be approved'})).status,409);assert.equal((await get('guard-b')).data.me.photoPending,true);as('referee');assert.equal((await photo.GET(new Request('https://rl.test/api/photo?member=guard-b&review=pending&reviewToken='+firstReviewToken))).status,403,'stale review image URLs cannot silently show a replacement');const currentToken=(await (await moderation.GET()).json()).photos.find(p=>p.id==='guard-b').reviewToken;as('referee');assert.equal((await photo.GET(new Request('https://rl.test/api/photo?member=guard-b&review=pending&reviewToken='+currentToken))).status,200);assert.equal((await review({action:'approve_photo',target:'guard-b',reviewToken:currentToken,reason:'Reviewed the current specific image'})).status,200);assert.equal((await review({action:'grant_moderator',expectedAccount:'guard-d',target:'guard-e',reason:'Stale moderator account guard'})).status,409);
assert.equal((await post('guard-e',{action:'invite',target:'guard-a',proposal:'Another thoughtful connection.'})).status,200);const pauseContact=(await get('guard-a')).data.connections.find(c=>c.person.id==='guard-e').id;assert.equal((await post('guard-a',{action:'accept',connection:pauseContact})).status,200);assert.equal((await post('guard-a',{action:'visibility',active:false})).status,200);const unavailableContact=(await get('guard-e')).data.connections.find(c=>c.id===pauseContact);assert.equal(unavailableContact.available,false);assert.deepEqual(Object.keys(unavailableContact.person).sort(),['id','name'],'paused contact retains safety access without full profile');assert.equal((await post('guard-e',{action:'report',target:'guard-a',reason:'Other',details:'Concern after the other person paused.'})).status,200);assert.equal((await post('guard-e',{action:'close',connection:pauseContact})).status,200);assert.equal((await post('guard-a',{action:'visibility',active:true})).status,200);
console.log('Specific-photo review versions, concurrent privacy preservation, and safety access after another member pauses passed');

as('guard-b');assert.equal((await photo.POST(new Request('https://rl.test/api/photo',{method:'POST',headers:{Origin:'https://rl.test','Content-Type':'image/png','x-reveal-consent':'yes'},body:image}))).status,429);as('guard-b');assert.equal((await photo.POST(new Request('https://rl.test/api/photo',{method:'POST',headers:{Origin:'https://rl.test','x-photo-action':'remove'}}))).status,200,'the upload cap never prevents removing a photo');assert.equal((await get('guard-b')).data.me.photoUploaded,false);assert.equal((await get('guard-b')).data.me.discoverable,false);assert.equal((await review({action:'approve_photo',target:'guard-c',reviewToken:'',reason:'Connected reviewer cannot review this person'},'guard-d')).status,403);assert.equal((await review({action:'resolve',report:guardPhotoReport.data.receipt,target:'guard-b',reason:'Expired cases cannot be reused'})).status,403);
console.log('Photo removal remains available after upload limits; connected and expired reviews remain denied');

sql.prepare("DELETE FROM safety_events WHERE actor='referee' AND kind IN ('moderation_write','moderation_read')").run();
// Owner is above reviewers; own-photo approval stays version-specific and audited.
assert.equal((await post('referee',{action:'profile',profile:draft('referee')})).status,200);
as('referee');assert.equal((await photo.POST(new Request('https://rl.test/api/photo',{method:'POST',headers:{Origin:'https://rl.test','Content-Type':'image/png','x-reveal-consent':'yes'},body:image}))).status,200);
sql.prepare("UPDATE profiles SET data=json_set(data,'$.photoPending',json('true')) WHERE id='referee'").run();const ownerQueue=await (await moderation.GET()).json();assert(ownerQueue.owner);const ownerPhoto=ownerQueue.photos.find(p=>p.id==='referee');assert(ownerPhoto);
assert.equal((await photo.GET(new Request('https://rl.test/api/photo?member=referee&review=pending&reviewToken='+ownerPhoto.reviewToken))).status,200);
assert.equal((await review({action:'approve_photo',target:'referee',reviewToken:ownerPhoto.reviewToken,reason:'Owner reviewed own submitted photo'})).status,200);
assert.equal((await get('referee')).data.me.photoPending,false);
assert(sql.prepare("SELECT id FROM moderation_audit WHERE actor='referee' AND action='approve_photo' AND target='referee'").get());
assert.equal((await review({action:'grant_moderator',target:'guard-e',reason:'Reviewer cannot grant owner powers'},'guard-d')).status,403);
console.log('Owner self-photo review, audit recording, and reviewer role boundaries passed');

// Signup photo is private and reviewable before admission.
sql.prepare("DELETE FROM safety_events WHERE actor='referee' AND kind IN ('moderation_write','moderation_read')").run();
assert.equal((await post('signup-photo',{action:'profile',profile:draft('signup-photo')})).status,200);
as('signup-photo');assert.equal((await photo.POST(new Request('https://rl.test/api/photo',{method:'POST',headers:{Origin:'https://rl.test','Content-Type':'image/png','x-reveal-consent':'yes','x-expected-account':'signup-photo'},body:image}))).status,200);
const signupState=(await get('signup-photo')).data;assert.equal(signupState.account.status,'pending');assert(signupState.me.photoUploaded);assert.equal(signupState.me.photoPending,false,'signup photos need no manual approval');assert.equal(signupState.canConnect,false);
as('alice');assert.equal((await photo.GET(new Request('https://rl.test/api/photo?member=signup-photo'))).status,403);
assert.equal((await get('signup-photo')).data.account.status,'pending','uploading never admits an applicant');
as('alice');assert.equal((await photo.GET(new Request('https://rl.test/api/photo?member=signup-photo'))).status,403,'approval alone never shares a photo');
console.log('Signup upload, pre-admission review, and private photo boundaries passed');

// Existing pending uploads become shareable without granting photo consent.
const beforeMigration=sql.prepare('SELECT sender_photo,recipient_photo FROM connections WHERE id=?').get(id);
sql.prepare("UPDATE profiles SET data=json_set(data,'$.photoPending',json('true')) WHERE id='signup-photo'").run();
sql.exec(readFileSync('drizzle/0010_photo_sharing_without_review.sql','utf8'));
assert.equal((await get('signup-photo')).data.me.photoPending,false);assert.deepEqual(sql.prepare('SELECT sender_photo,recipient_photo FROM connections WHERE id=?').get(id),beforeMigration);
console.log('Photo approval removed; pending-upload migration preserves consent and admission');

as('alice');let feed=await (await notificationsApi.GET()).json();assert.equal(feed.accountId,'alice');assert(!JSON.stringify(feed).includes('Let us choose a short reading.'),'notifications do not expose message text');
async function notificationPost(who,body){as(who);const response=await notificationsApi.POST(request({...body,expectedAccount:who}));return {status:response.status,data:await response.json()};}
assert.equal((await notificationPost('bob',{action:'subscribe',endpoint:'https://127.0.0.1/internal'})).status,400,'subscription cannot redirect push to internal services');
assert.equal((await notificationPost('bob',{action:'subscribe',endpoint:'http://fcm.googleapis.com/token'})).status,400);
as('bob');assert.equal((await notificationsApi.POST(request({action:'read',expectedAccount:'alice'}))).status,409);
assert.equal((await notificationPost('alice',{action:'read'})).status,200);assert(!sql.prepare('SELECT id FROM notifications WHERE member=? AND read=0').get('alice'));
await Promise.all(globalThis.__pushTasks);
console.log('Notification deduplication, read state, private-content omission, stale-account checks, and push endpoint restrictions passed');

// Cursor pages retain the same permissions and refresh older history without exposing other scopes.
for(const who of ['history-a','history-b','history-c']){assert.equal((await post(who,{action:'profile',profile:draft(who)})).status,200);assert.equal((await review({action:'admit',target:who,reason:'Reviewed eligibility and community agreement',adultReviewed:true})).status,200);}
assert.equal((await post('history-a',{action:'invite',target:'history-b',proposal:'Talk about history together.'})).status,200);
const historyConnection=(await get('history-b')).data.connections.find(c=>c.person.id==='history-a').id;assert.equal((await post('history-b',{action:'accept',connection:historyConnection})).status,200);
for(let i=0;i<230;i++)sql.prepare('INSERT INTO messages (id,connection,sender,body,created) VALUES (?,?,?,?,?)').run('history-'+i,historyConnection,i%2?'history-a':'history-b','Earlier message '+i,new Date().toISOString());
const latestPage=await post('history-a',{action:'messages',connection:historyConnection});assert.equal(latestPage.data.messages.length,200);assert(latestPage.data.hasMore);const olderPage=await post('history-a',{action:'messages',connection:historyConnection,before:latestPage.data.cursor});assert.equal(olderPage.data.messages.length,30);assert(!olderPage.data.hasMore);assert.equal(new Set([...olderPage.data.messages,...latestPage.data.messages].map(m=>m.id)).size,230);
assert.equal((await post('history-a',{action:'messages',connection:historyConnection,before:-1})).status,400);assert.equal((await post('history-c',{action:'messages',connection:historyConnection,before:latestPage.data.cursor})).status,404);
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
console.log('Union-organizing category, discovery separation, two-founder consent and admission history checks passed.');

// Old chat media URLs must re-check sender blocks and current circle membership.
sql.prepare("DELETE FROM safety_events WHERE actor IN ('worker-a','worker-b','worker-c') AND kind IN ('circle_propose','circle_approve','circle_request','circle_admit','circle_leave','circle_remove')").run();
const mediaCircleDraft={...workerDraft,title:'Media access regression',category:'worker_industry',workerConsent:true};
assert.equal((await workerAct('worker-a',mediaCircleDraft)).status,200);
const mediaCircle=sql.prepare("SELECT * FROM circles WHERE title='Media access regression'").get();
assert.equal((await workerAct('worker-b',{action:'approve',circle:mediaCircle.id,workerConsent:true})).status,200);
assert.equal((await workerAct('worker-c',{action:'request',circle:mediaCircle.id,workerConsent:true})).status,200);
assert.equal((await workerAct('worker-a',{action:'admit',circle:mediaCircle.id,target:'worker-c'})).status,200);
const blockedPhoto=await chatImagePost('worker-a','circle',mediaCircle.id);assert.equal(blockedPhoto.response.status,200);
const blockedPhotoUrl='/api/chat-image?kind=circle&scope='+encodeURIComponent(mediaCircle.id)+'&message='+encodeURIComponent(blockedPhoto.id);
const blockedAudio=crypto.randomUUID(),blockedAudioId=JSON.stringify([mediaCircle.id,'worker-a',blockedAudio]);assert.equal((await voicePost('worker-a','circle',mediaCircle.id,{attempt:blockedAudio})).status,200);
const blockedAudioUrl='/api/voice?kind=circle&scope='+encodeURIComponent(mediaCircle.id)+'&message='+encodeURIComponent(blockedAudioId);
assert.equal((await chatImageGet('worker-c',blockedPhotoUrl)).status,200);assert.equal((await voiceGet('worker-c',blockedAudioUrl)).status,200);
assert.equal((await post('worker-c',{action:'block',target:'worker-a'})).status,200);
assert.equal((await chatImageGet('worker-c',blockedPhotoUrl)).status,404,'blocking the media sender invalidates their existing photo URL');assert.equal((await voiceGet('worker-c',blockedAudioUrl)).status,403,'blocking the media sender invalidates their existing voice URL');
assert.equal((await post('worker-c',{action:'unblock',target:'worker-a'})).status,200);
const leavePhoto=await chatImagePost('worker-b','circle',mediaCircle.id);assert.equal(leavePhoto.response.status,200);
const leavePhotoUrl='/api/chat-image?kind=circle&scope='+encodeURIComponent(mediaCircle.id)+'&message='+encodeURIComponent(leavePhoto.id);
const leaveAudio=crypto.randomUUID(),leaveAudioId=JSON.stringify([mediaCircle.id,'worker-b',leaveAudio]);assert.equal((await voicePost('worker-b','circle',mediaCircle.id,{attempt:leaveAudio})).status,200);
const leaveAudioUrl='/api/voice?kind=circle&scope='+encodeURIComponent(mediaCircle.id)+'&message='+encodeURIComponent(leaveAudioId);
assert.equal((await chatImageGet('worker-c',leavePhotoUrl)).status,200);assert.equal((await voiceGet('worker-c',leaveAudioUrl)).status,200);
assert.equal((await workerAct('worker-c',{action:'leave',circle:mediaCircle.id})).status,200);
assert.equal((await chatImageGet('worker-c',leavePhotoUrl)).status,403,'leaving immediately revokes the old photo URL');assert.equal((await voiceGet('worker-c',leaveAudioUrl)).status,403,'leaving immediately revokes the old voice URL');
assert.equal((await workerAct('worker-c',{action:'request',circle:mediaCircle.id,workerConsent:true})).status,200);
assert.equal((await workerAct('worker-a',{action:'admit',circle:mediaCircle.id,target:'worker-c'})).status,200);
const removedPhoto=await chatImagePost('worker-b','circle',mediaCircle.id);assert.equal(removedPhoto.response.status,200);
const removedPhotoUrl='/api/chat-image?kind=circle&scope='+encodeURIComponent(mediaCircle.id)+'&message='+encodeURIComponent(removedPhoto.id);
const removedAudio=crypto.randomUUID(),removedAudioId=JSON.stringify([mediaCircle.id,'worker-b',removedAudio]);assert.equal((await voicePost('worker-b','circle',mediaCircle.id,{attempt:removedAudio})).status,200);
const removedAudioUrl='/api/voice?kind=circle&scope='+encodeURIComponent(mediaCircle.id)+'&message='+encodeURIComponent(removedAudioId);
assert.equal((await chatImageGet('worker-c',removedPhotoUrl)).status,200);assert.equal((await voiceGet('worker-c',removedAudioUrl)).status,200);
assert.equal((await workerAct('worker-a',{action:'remove',circle:mediaCircle.id,target:'worker-c'})).status,200);
assert.equal((await chatImageGet('worker-c',removedPhotoUrl)).status,403,'host removal immediately revokes old photo access');assert.equal((await voiceGet('worker-c',removedAudioUrl)).status,403,'host removal immediately revokes old voice access');
for(const messageId of [blockedPhoto.id,leavePhoto.id,removedPhoto.id]){const stored=sql.prepare('SELECT attachment_key FROM circle_messages WHERE id=?').get(messageId);if(stored?.attachment_key)memory.delete(stored.attachment_key);sql.prepare('DELETE FROM circle_messages WHERE id=?').run(messageId);}
for(const messageId of [blockedAudioId,leaveAudioId,removedAudioId]){const stored=sql.prepare('SELECT audio_key FROM circle_messages WHERE id=?').get(messageId);if(stored?.audio_key)memory.delete(stored.audio_key);sql.prepare('DELETE FROM circle_messages WHERE id=?').run(messageId);}
console.log('Chat media URLs re-check current circle membership and block state after block, leave, and removal.');

// Account removal deletes private chat media objects and invalidates their old URLs.
const deleteDirectPhoto=await chatImagePost('worker-a','direct','worker-connection');assert.equal(deleteDirectPhoto.response.status,200);
const deleteDirectPhotoUrl='/api/chat-image?kind=direct&scope=worker-connection&message='+encodeURIComponent(deleteDirectPhoto.id);
const deleteDirectVoice=crypto.randomUUID(),deleteDirectVoiceId=JSON.stringify(['worker-connection','worker-a',deleteDirectVoice]);assert.equal((await voicePost('worker-a','direct','worker-connection',{attempt:deleteDirectVoice})).status,200);
const deleteDirectVoiceUrl='/api/voice?kind=direct&scope=worker-connection&message='+encodeURIComponent(deleteDirectVoiceId);
const deleteCirclePhoto=await chatImagePost('worker-a','circle',mediaCircle.id);assert.equal(deleteCirclePhoto.response.status,200);
const deleteCirclePhotoUrl='/api/chat-image?kind=circle&scope='+encodeURIComponent(mediaCircle.id)+'&message='+encodeURIComponent(deleteCirclePhoto.id);
const deleteCircleVoice=crypto.randomUUID(),deleteCircleVoiceId=JSON.stringify([mediaCircle.id,'worker-a',deleteCircleVoice]);assert.equal((await voicePost('worker-a','circle',mediaCircle.id,{attempt:deleteCircleVoice})).status,200);
const deleteCircleVoiceUrl='/api/voice?kind=circle&scope='+encodeURIComponent(mediaCircle.id)+'&message='+encodeURIComponent(deleteCircleVoiceId);
for(const url of [deleteDirectPhotoUrl,deleteCirclePhotoUrl])assert.equal((await chatImageGet('worker-b',url)).status,200);
for(const url of [deleteDirectVoiceUrl,deleteCircleVoiceUrl])assert.equal((await voiceGet('worker-b',url)).status,200);
const deleteDirectPhotoKey=sql.prepare('SELECT attachment_key FROM messages WHERE id=?').get(deleteDirectPhoto.id).attachment_key;
const deleteDirectVoiceKey=sql.prepare('SELECT audio_key FROM messages WHERE id=?').get(deleteDirectVoiceId).audio_key;
const deleteCirclePhotoKey=sql.prepare('SELECT attachment_key FROM circle_messages WHERE id=?').get(deleteCirclePhoto.id).attachment_key;
const deleteCircleVoiceKey=sql.prepare('SELECT audio_key FROM circle_messages WHERE id=?').get(deleteCircleVoiceId).audio_key;
assert.equal((await post('worker-a',{action:'delete'})).status,200);
for(const [who,url] of [['worker-b',deleteDirectPhotoUrl],['worker-b',deleteCirclePhotoUrl]])assert.notEqual((await chatImageGet(who,url)).status,200,'account removal invalidates saved photo URLs');
for(const [who,url] of [['worker-b',deleteDirectVoiceUrl],['worker-b',deleteCircleVoiceUrl]])assert.notEqual((await voiceGet(who,url)).status,200,'account removal invalidates saved voice URLs');
for(const key of [deleteDirectPhotoKey,deleteDirectVoiceKey,deleteCirclePhotoKey,deleteCircleVoiceKey])assert.equal(memory.has(key),false,'account removal deletes the stored chat media object');
console.log('Account removal deletes direct and circle chat media and invalidates retained links.');

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

// Together shares circle-message authorization, report evidence and admission history.
for(const who of ['together-a','together-b','together-c','together-outside']){
 assert.equal((await post(who,{action:'profile',profile:draft(who)})).status,200);
 assert.equal((await review({action:'admit',target:who,reason:'Reviewed adult eligibility and app conduct rules',adultReviewed:true})).status,200);
}
sql.prepare("INSERT INTO connections (id,sender,recipient,status,kind,proposal,created) VALUES ('together-connection','together-a','together-b','accepted','Connect','Read and learn together',?)").run(new Date().toISOString());
assert.equal((await circlePost('together-a',{action:'propose',connection:'together-connection',title:'Learning together',description:'A place to help one another learn.',tags:[],activity:'Choose a reading afternoon.'})).status,200);
const togetherCircle=(await circleGet('together-b')).data.circles.find(c=>c.title==='Learning together').id;
assert.equal((await circlePost('together-b',{action:'approve',circle:togetherCircle})).status,200);
const togetherAttempt=crypto.randomUUID(),togetherDraft={action:'together_post',circle:togetherCircle,kind:'offer',description:'I can help someone practise conversational Spanish.',when:'Saturday afternoon',togetherConsent:true,clientMessageId:togetherAttempt};
assert.equal((await circlePost('together-a',{...togetherDraft,togetherConsent:false})).status,400);
assert.equal((await circlePost('together-a',{...togetherDraft,kind:'payment'})).status,400);
assert.equal((await circlePost('together-a',{...togetherDraft,description:'https://example.com send money'})).status,400);
assert.equal((await circlePost('together-a',{...togetherDraft,expectedAccount:'another-account'})).status,409);
assert.equal((await circlePost('together-outside',{action:'together_list',circle:togetherCircle})).status,403);
assert.equal((await circlePost('together-outside',togetherDraft)).status,403);
assert.equal((await circlePost('together-a',togetherDraft)).status,200);
assert.equal((await circlePost('together-a',togetherDraft)).status,200,'same confirmed attempt never duplicates a Together post');
let togetherList=await circlePost('together-b',{action:'together_list',circle:togetherCircle});
assert.equal(togetherList.data.posts.length,1);const togetherPost=togetherList.data.posts[0];assert.equal(togetherPost.kind,'offer');assert(togetherPost.body.includes('Saturday afternoon'));assert.equal(togetherPost.status,'open');
assert.equal((await circlePost('together-a',{...togetherDraft,description:'A different offer using the same attempt identifier.'})).status,409);
const togetherThread=await circlePost('together-b',{action:'conversation',circle:togetherCircle});assert(togetherThread.data.messages.some(m=>m.id===togetherPost.id),'Together posts are reportable normal chat messages');
assert.equal((await post('together-b',{action:'report',target:'together-a',type:'circle_message',scope:togetherCircle,objectId:togetherPost.id,reason:'Other',details:'Please review this Together post.'})).status,200);
assert.equal((await circlePost('together-c',{action:'request',circle:togetherCircle})).status,200);
assert.equal((await circlePost('together-c',{action:'together_list',circle:togetherCircle})).status,403,'pending applicants cannot read Together');
assert.equal((await circlePost('together-a',{action:'admit',circle:togetherCircle,target:'together-c'})).status,200);
assert.equal((await circlePost('together-c',{action:'together_list',circle:togetherCircle})).data.posts.length,0,'new members cannot see earlier Together posts');
assert.equal((await circlePost('together-c',{action:'together_close',circle:togetherCircle,message:togetherPost.id})).status,403);
assert.equal((await circlePost('together-a',{...togetherDraft,clientMessageId:crypto.randomUUID(),kind:'project',description:'Let us build a shared reading list for the circle.'})).status,200);
const laterPost=(await circlePost('together-c',{action:'together_list',circle:togetherCircle})).data.posts[0];
assert.equal((await circlePost('together-c',{action:'together_close',circle:togetherCircle,message:laterPost.id})).status,403,'ordinary participants cannot close someone else’s post');
const beforeClose=await circlePost('together-b',{action:'conversation',circle:togetherCircle});
assert.equal((await circlePost('together-b',{action:'together_close',circle:togetherCircle,message:laterPost.id})).status,200,'a host may close a visible post');
assert.equal((await circlePost('together-a',{action:'together_close',circle:togetherCircle,message:laterPost.id})).status,200,'closure is idempotent');
assert.notEqual((await circlePost('together-b',{action:'conversation',circle:togetherCircle})).data.revision,beforeClose.data.revision,'closing changes the visible conversation revision');
assert.equal((await circlePost('together-c',{action:'together_list',circle:togetherCircle})).data.posts[0].status,'closed');
assert.equal((await post('together-c',{action:'block',target:'together-a'})).status,200);
assert.equal((await circlePost('together-c',{action:'together_list',circle:togetherCircle})).data.posts.length,0,'blocks hide Together posts');
assert.equal((await post('together-a',{action:'visibility',active:false})).status,200);
assert.equal((await circlePost('together-a',{action:'together_list',circle:togetherCircle})).status,403,'pause revokes Together reads');
assert.equal((await circlePost('together-a',{...togetherDraft,clientMessageId:crypto.randomUUID()})).status,403,'pause revokes Together writes');
assert.equal((await post('together-a',{action:'visibility',active:true})).status,200);
globalThis.__beforeRun=(query)=>{if(query.startsWith('INSERT INTO circle_messages')){globalThis.__beforeRun=null;sql.prepare("UPDATE circle_members SET status='left' WHERE circle=? AND member='together-a'").run(togetherCircle);}};
assert.equal((await circlePost('together-a',{...togetherDraft,clientMessageId:crypto.randomUUID()})).status,403,'revoked membership during insertion prevents a post');globalThis.__beforeRun=null;
assert.equal((await circlePost('together-a',{action:'together_list',circle:togetherCircle})).status,403,'former members cannot read Together');
assert(!JSON.stringify((await get('together-outside')).data.people).includes('practise conversational Spanish'),'Together content never enters profile discovery');
// Pagination and deletion share the same admitted circle history.
for(let i=0;i<32;i++)sql.prepare("INSERT INTO circle_messages (id,circle,sender,body,created,cooperation_kind) VALUES (?,?,?,?,?,'activity')").run('together-page-'+i,togetherCircle,'together-b','A reading activity '+i,new Date().toISOString());
const togetherPage=await circlePost('together-b',{action:'together_list',circle:togetherCircle});assert.equal(togetherPage.data.posts.length,30);assert(togetherPage.data.hasMore);
const togetherOlder=await circlePost('together-b',{action:'together_list',circle:togetherCircle,before:togetherPage.data.cursor});assert(togetherOlder.data.posts.length>=2);assert(!togetherOlder.data.posts.some(p=>togetherPage.data.posts.some(x=>x.id===p.id)));
assert.equal((await circlePost('together-b',{action:'delete_message',circle:togetherCircle,message:'together-page-31'})).status,200);
assert(!(await circlePost('together-b',{action:'together_list',circle:togetherCircle})).data.posts.some(p=>p.id==='together-page-31'));
assert.equal((await circlePost('together-b',{action:'close',circle:togetherCircle})).status,200);
assert.equal((await circlePost('together-b',{action:'together_list',circle:togetherCircle})).status,403,'closed circles cannot expose Together');
console.log('Together consent, retries, circle authorization, blocks, pause, history, closure, reports, pagination, deletion and write-time revocation passed.');

// Voluntary activity responses stay in the circle, with bounded history and exit cleanup.
for(const who of ['activity-a','activity-b','activity-c','activity-d','activity-outside']){
 assert.equal((await post(who,{action:'profile',profile:draft(who)})).status,200);
 assert.equal((await review({action:'admit',target:who,reason:'Reviewed adult eligibility and app rules',adultReviewed:true})).status,200);
}
sql.prepare("INSERT INTO connections (id,sender,recipient,status,kind,proposal,created) VALUES ('activity-connection','activity-a','activity-b','accepted','Connect','Learn together',?)").run(new Date().toISOString());
assert.equal((await circlePost('activity-a',{action:'propose',connection:'activity-connection',title:'Activity planning',description:'Voluntary shared learning activities.',tags:[],activity:'Read and discuss together.'})).status,200);
const activityCircle=(await circleGet('activity-b')).data.circles.find(c=>c.title==='Activity planning').id;assert.equal((await circlePost('activity-b',{action:'approve',circle:activityCircle})).status,200);
const activityStart=new Date(Date.now()+86400000).toISOString();
const activityDraft={action:'together_post',circle:activityCircle,kind:'activity',description:'A relaxed language practice afternoon with the circle.',when:'Agree on a public meeting place in chat.',startsAt:activityStart,togetherConsent:true,clientMessageId:crypto.randomUUID()};
assert.equal((await circlePost('activity-a',{...activityDraft,startsAt:'not-a-date'})).status,400);
assert.equal((await circlePost('activity-a',{...activityDraft,kind:'offer'})).status,400);
assert.equal((await circlePost('activity-a',{...activityDraft,startsAt:new Date(Date.now()-86400000).toISOString()})).status,400);
assert.equal((await circlePost('activity-a',activityDraft)).status,200);
let activity=(await circlePost('activity-a',{action:'together_list',circle:activityCircle})).data.posts[0];assert.equal(activity.startsAt,activityStart);assert.equal(activity.participants.length,0,'authors are never automatically signed up');assert(!activity.joined);
const response=(message,join=true)=>({action:'together_respond',circle:activityCircle,message,join,participationConsent:join});
assert.equal((await circlePost('activity-b',{...response(activity.id),participationConsent:false})).status,400);
assert.equal((await circlePost('activity-outside',response(activity.id))).status,403);
const activityBefore=await circlePost('activity-a',{action:'conversation',circle:activityCircle});
assert.equal((await circlePost('activity-b',response(activity.id))).status,200);
assert.equal((await circlePost('activity-b',response(activity.id))).status,200,'repeated participation is idempotent');
activity=(await circlePost('activity-a',{action:'together_list',circle:activityCircle})).data.posts[0];assert.deepEqual(activity.participants.map(p=>p.id),['activity-b']);assert(!activity.joined);
assert.notEqual((await circlePost('activity-a',{action:'conversation',circle:activityCircle})).data.revision,activityBefore.data.revision,'visible activity responses refresh the circle revision');
assert.equal((await circlePost('activity-c',{action:'request',circle:activityCircle})).status,200);
assert.equal((await circlePost('activity-c',response(activity.id))).status,403);
assert.equal((await circlePost('activity-a',{action:'admit',circle:activityCircle,target:'activity-c'})).status,200);
assert.equal((await circlePost('activity-c',response(activity.id))).status,409,'a new member cannot respond to pre-admission activities');
const anotherActivity={...activityDraft,clientMessageId:crypto.randomUUID(),description:'A second reading and language practice afternoon.'};assert.equal((await circlePost('activity-a',anotherActivity)).status,200);
let laterActivity=(await circlePost('activity-c',{action:'together_list',circle:activityCircle})).data.posts[0];
assert.equal((await circlePost('activity-b',response(laterActivity.id))).status,200);assert.equal((await circlePost('activity-c',response(laterActivity.id))).status,200);
assert.equal((await post('activity-c',{action:'block',target:'activity-b'})).status,200);
let memberView=(await circlePost('activity-c',{action:'together_list',circle:activityCircle})).data.posts[0];assert.deepEqual(memberView.participants.map(p=>p.id),['activity-c'],'blocked participant names are omitted');
assert.equal((await post('activity-c',{action:'visibility',active:false})).status,200);
assert.equal((await circlePost('activity-c',response(laterActivity.id,false))).status,200,'withdrawal remains an exit action while paused');
assert.equal((await post('activity-c',{action:'visibility',active:true})).status,200);
assert(!(await circlePost('activity-c',{action:'together_list',circle:activityCircle})).data.posts[0].joined,'resuming does not re-enroll a member');
assert.equal((await circlePost('activity-c',{action:'together_cancel',circle:activityCircle,message:laterActivity.id})).status,403,'a participant cannot cancel another member’s activity');
assert.equal((await circlePost('activity-a',{action:'together_cancel',circle:activityCircle,message:laterActivity.id})).status,200);
assert.equal((await circlePost('activity-a',{action:'together_cancel',circle:activityCircle,message:laterActivity.id})).status,200,'cancellation retry is idempotent');
assert.equal((await circlePost('activity-c',response(laterActivity.id))).status,409);
assert.equal((await circlePost('activity-a',{action:'together_close',circle:activityCircle,message:laterActivity.id})).status,409,'closing cannot undo a cancellation');
assert.equal((await circlePost('activity-b',{action:'together_list',circle:activityCircle})).data.posts[0].status,'cancelled');
assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM notifications WHERE member='activity-b' AND title='An activity you responded to was cancelled'").get().n,1,'respondents receive a single generic cancellation update');
assert.equal((await circlePost('activity-b',response(laterActivity.id,false))).status,200,'cancelled activities still allow withdrawal');
assert.equal((await circlePost('activity-a',{...activityDraft,clientMessageId:crypto.randomUUID(),description:'A new open activity after cancellation.'})).status,200);
let openActivity=(await circlePost('activity-c',{action:'together_list',circle:activityCircle})).data.posts[0];
assert.equal((await circlePost('activity-c',response(openActivity.id))).status,200);
assert.equal((await circlePost('activity-c',{action:'leave',circle:activityCircle})).status,200);assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM circle_activity_participants WHERE member='activity-c'").get().n,0,'leaving clears all responses in that circle');
assert.equal((await circlePost('activity-d',{action:'request',circle:activityCircle})).status,200);assert.equal((await circlePost('activity-a',{action:'admit',circle:activityCircle,target:'activity-d'})).status,200);
assert.equal((await circlePost('activity-a',{...activityDraft,clientMessageId:crypto.randomUUID(),description:'Activity for the newly admitted participant.'})).status,200);
let newestActivity=(await circlePost('activity-d',{action:'together_list',circle:activityCircle})).data.posts[0];
globalThis.__beforeRun=(query)=>{if(query.startsWith('INSERT INTO circle_activity_participants')){globalThis.__beforeRun=null;sql.prepare("UPDATE circle_members SET status='left' WHERE circle=? AND member='activity-d'").run(activityCircle);}};
assert.equal((await circlePost('activity-d',response(newestActivity.id))).status,409,'membership revocation during response insertion fails closed');globalThis.__beforeRun=null;
assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM circle_activity_participants WHERE member='activity-d'").get().n,0);
sql.prepare("UPDATE circle_members SET status='accepted' WHERE circle=? AND member='activity-d'").run(activityCircle);
assert.equal((await circlePost('activity-d',response(newestActivity.id))).status,200);
assert.equal((await circlePost('activity-a',{action:'remove',circle:activityCircle,target:'activity-d'})).status,200);assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM circle_activity_participants WHERE member='activity-d'").get().n,0,'host removal clears responses');
assert.equal((await circlePost('activity-b',response(newestActivity.id))).status,200);
sql.prepare("UPDATE circle_messages SET cooperation_starts_at=? WHERE id=?").run(new Date(Date.now()-1000).toISOString(),newestActivity.id);
assert(!(await circlePost('activity-a',{action:'together_list',circle:activityCircle})).data.posts[0].canJoin,'started activities do not invite new responses');
assert.equal((await circlePost('activity-a',response(newestActivity.id))).status,409);
assert.equal((await circlePost('activity-b',response(newestActivity.id,false))).status,200,'the start passing never prevents withdrawal');
assert.equal((await circlePost('activity-b',response(openActivity.id))).status,200);
assert.equal((await post('activity-b',{action:'delete'})).status,200);assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM circle_activity_participants WHERE member='activity-b'").get().n,0,'account deletion clears activity responses');
assert(!JSON.stringify((await get('activity-outside')).data.people).includes('participants'),'no activity participation is added to public profile discovery');
console.log('Activity dates, voluntary consent, history, idempotency, cancellation notifications, withdrawal, blocks, pause, membership races, removal and deletion cleanup passed.');

// Project progress extends existing circle messages without a separate public task system.
for(const who of ['project-a','project-b','project-c','project-outside']){assert.equal((await post(who,{action:'profile',profile:draft(who)})).status,200);assert.equal((await review({action:'admit',target:who,reason:'Reviewed adult eligibility and conduct rules',adultReviewed:true})).status,200);}
sql.prepare("INSERT INTO connections (id,sender,recipient,status,kind,proposal,created) VALUES ('project-connection','project-a','project-b','accepted','Connect','Build a reading project',?)").run(new Date().toISOString());
assert.equal((await circlePost('project-a',{action:'propose',connection:'project-connection',title:'Projects together',description:'Build small useful things together.',tags:[],activity:'Choose one small idea.'})).status,200);
const projectCircle=(await circleGet('project-b')).data.circles.find(c=>c.title==='Projects together').id;assert.equal((await circlePost('project-b',{action:'approve',circle:projectCircle})).status,200);
const rootProject={action:'together_post',circle:projectCircle,kind:'project',description:'Create a shared reading list for our circle.',when:'At our own pace',togetherConsent:true,clientMessageId:crypto.randomUUID()};
assert.equal((await circlePost('project-a',rootProject)).status,200);const oldProject=(await circlePost('project-a',{action:'together_list',circle:projectCircle})).data.posts[0];
const projectAction=(action,project,extra={})=>({action,circle:projectCircle,project,...extra});
assert.equal((await circlePost('project-outside',projectAction('project_details',oldProject.id))).status,403);
assert.equal((await circlePost('project-c',{action:'request',circle:projectCircle})).status,200);assert.equal((await circlePost('project-c',projectAction('project_details',oldProject.id))).status,403);
assert.equal((await circlePost('project-a',{action:'admit',circle:projectCircle,target:'project-c'})).status,200);
assert.equal((await circlePost('project-c',projectAction('project_details',oldProject.id))).status,403,'joining never exposes earlier project context');
assert.equal((await circlePost('project-c',projectAction('project_update',oldProject.id,{text:'An attempted update to hidden history.',clientMessageId:crypto.randomUUID()}))).status,403);
assert.equal((await circlePost('project-a',{...rootProject,clientMessageId:crypto.randomUUID(),description:'Make a reading and discussion plan for everyone.'})).status,200);
const newProject=(await circlePost('project-c',{action:'together_list',circle:projectCircle})).data.posts[0];let projectDetails=await circlePost('project-c',projectAction('project_details',newProject.id));assert.equal(projectDetails.status,200);assert(!projectDetails.data.canManage);assert.equal(projectDetails.data.steps.length,0);
const stepAttempt=crypto.randomUUID(),newStep=projectAction('project_add_step',newProject.id,{text:'Choose a short reading',clientMessageId:stepAttempt});
assert.equal((await circlePost('project-c',newStep)).status,403,'ordinary members cannot assign project steps');
assert.equal((await circlePost('project-b',newStep)).status,200);assert.equal((await circlePost('project-b',newStep)).status,200,'step retries reuse the circle-message attempt');
projectDetails=await circlePost('project-a',projectAction('project_details',newProject.id));assert.equal(projectDetails.data.steps.length,1);const projectStep=projectDetails.data.steps[0];assert.equal(projectStep.status,'open');assert(projectStep.canManage);
assert.equal((await circlePost('project-b',{...newStep,text:'Different text with the same attempt'})).status,409);
const stepChange=(status,expectedStatus)=>projectAction('project_step_state',newProject.id,{message:projectStep.id,status,expectedStatus});
assert.equal((await circlePost('project-c',stepChange('done','open'))).status,403);
const projectBefore=await circlePost('project-c',{action:'conversation',circle:projectCircle});assert.equal((await circlePost('project-a',stepChange('done','open'))).status,200);
assert.notEqual((await circlePost('project-c',{action:'conversation',circle:projectCircle})).data.revision,projectBefore.data.revision,'visible step changes refresh circle history');
assert.equal((await circlePost('project-a',stepChange('done','open'))).status,200,'repeating an already applied step state is safe');
assert.equal((await circlePost('project-a',stepChange('open','open'))).status,409,'a stale step state cannot overwrite a newer change');assert.equal((await circlePost('project-b',stepChange('open','done'))).status,200);
const updateAttempt=crypto.randomUUID(),updateDraft=projectAction('project_update',newProject.id,{text:'We found two short readings and can choose one together.',clientMessageId:updateAttempt});assert.equal((await circlePost('project-c',updateDraft)).status,200);assert.equal((await circlePost('project-c',updateDraft)).status,200);
projectDetails=await circlePost('project-a',projectAction('project_details',newProject.id));assert.equal(projectDetails.data.updates.length,1);const projectUpdate=projectDetails.data.updates[0];
assert.equal((await post('project-a',{action:'report',target:'project-c',type:'circle_message',scope:projectCircle,objectId:projectUpdate.id,reason:'Other',details:'Please review this project update.'})).status,200,'progress updates use existing report evidence');
assert.equal((await circlePost('project-c',{action:'together_list',circle:projectCircle})).data.posts.length,1,'steps and updates do not become separate root posts');
assert.equal((await circlePost('project-c',projectAction('project_update',newProject.id,{text:'https://example.com a link outside the permitted content.',clientMessageId:crypto.randomUUID()}))).status,400);
assert.equal((await post('project-c',{action:'block',target:'project-b'})).status,200);assert.equal((await circlePost('project-c',projectAction('project_details',newProject.id))).data.steps.length,0,'blocked step authors are omitted');
assert.equal((await post('project-c',{action:'block',target:'project-a'})).status,200);assert.equal((await circlePost('project-c',projectAction('project_details',newProject.id))).status,403,'blocking the project author removes project context');assert.equal((await post('project-c',{action:'unblock',target:'project-a'})).status,200);assert.equal((await post('project-c',{action:'unblock',target:'project-b'})).status,200);
for(let i=1;i<20;i++)assert.equal((await circlePost('project-a',projectAction('project_add_step',newProject.id,{text:'Small manageable step '+i,clientMessageId:crypto.randomUUID()}))).status,200);
assert.equal((await circlePost('project-a',projectAction('project_add_step',newProject.id,{text:'A twenty-first step should wait',clientMessageId:crypto.randomUUID()}))).status,409);assert.equal((await circlePost('project-b',newStep)).status,200,'confirmed retries remain safe even at the step cap');
for(let i=0;i<24;i++)sql.prepare("INSERT INTO circle_messages (id,circle,sender,body,created,cooperation_kind,cooperation_parent,reply_to) VALUES (?,?,?,?,?,'update',?,?)").run('project-page-'+i,projectCircle,'project-b','Project update: A shared progress note '+i,new Date().toISOString(),newProject.id,newProject.id);
const updatePage=await circlePost('project-c',projectAction('project_details',newProject.id));assert.equal(updatePage.data.updates.length,20);assert(updatePage.data.hasMore);const olderUpdates=await circlePost('project-c',projectAction('project_details',newProject.id,{before:updatePage.data.cursor}));assert.equal(olderUpdates.data.updates.length,5);assert(!olderUpdates.data.updates.some(x=>updatePage.data.updates.some(y=>x.id===y.id)));
assert.equal((await circlePost('project-a',{action:'together_close',circle:projectCircle,message:newProject.id})).status,200);
assert.equal((await circlePost('project-b',projectAction('project_add_step',newProject.id,{text:'Cannot add to a closed project',clientMessageId:crypto.randomUUID()}))).status,409);
assert.equal((await circlePost('project-c',projectAction('project_update',newProject.id,{text:'Cannot update a closed project.',clientMessageId:crypto.randomUUID()}))).status,409);assert.equal((await circlePost('project-a',stepChange('done','open'))).status,409);
assert.equal((await circlePost('project-c',{action:'edit_message',circle:projectCircle,message:projectUpdate.id,text:'An edit after the project closed.',expectedRevision:0})).status,409,'chat editing cannot bypass a closed project');
assert.equal((await circlePost('project-b',{action:'delete_message',circle:projectCircle,message:projectStep.id})).status,200,'the existing author deletion window remains available');assert.equal((await circlePost('project-a',projectAction('project_details',newProject.id))).data.steps.length,19);
assert.equal((await circlePost('project-a',{...rootProject,clientMessageId:crypto.randomUUID(),description:'A separate small project to check concurrent changes.'})).status,200);const raceProject=(await circlePost('project-b',{action:'together_list',circle:projectCircle})).data.posts[0];
globalThis.__beforeRun=(query)=>{if(query.startsWith('INSERT INTO circle_messages')){globalThis.__beforeRun=null;sql.prepare("UPDATE circle_messages SET cooperation_status='closed' WHERE id=?").run(raceProject.id);}};
assert.equal((await circlePost('project-b',projectAction('project_update',raceProject.id,{text:'This write should fail when the project closes.',clientMessageId:crypto.randomUUID()}))).status,403,'project state is rechecked inside message insertion');globalThis.__beforeRun=null;
assert.equal((await circlePost('project-c',{action:'leave',circle:projectCircle})).status,200);assert.equal((await circlePost('project-c',projectAction('project_details',newProject.id))).status,403);
assert.equal((await post('project-a',{action:'delete'})).status,200);assert.equal((await circlePost('project-b',projectAction('project_details',newProject.id))).status,403,'deleting a project author removes project context');
console.log('Project author/host controls, member updates, retries, bounded history, reports, block privacy, stale states, step cap, pagination, closure and write-time races passed.');

// Circle areas copy only a deliberately shared display label, never profile coordinates.
const areaLabel={city:'Austin',region:'Texas',country:'United States'};
for(const who of ['area-a','area-b','area-outside']){assert.equal((await post(who,{action:'profile',profile:{...draft(who),...areaLabel,areaLat:30.2672,areaLon:-97.7431,locationPlaceId:'N/123'}})).status,200);assert.equal((await review({action:'admit',target:who,reason:'Reviewed adult eligibility and conduct rules',adultReviewed:true})).status,200);}
sql.prepare("INSERT INTO connections (id,sender,recipient,status,kind,proposal,created) VALUES ('area-connection','area-a','area-b','accepted','Connect','Talk about a circle',?)").run(new Date().toISOString());
const areaDraft={action:'propose',connection:'area-connection',title:'Local reading circle',description:'Read and talk together about shared interests.',tags:[],activity:'Choose a short story together.'};
const areaKey=(await import(locationUrl)).locationKey(areaLabel);
async function areaPropose(fields={}){sql.prepare("DELETE FROM safety_events WHERE actor='area-a' AND kind='circle_propose'").run();return circlePost('area-a',{...areaDraft,...fields});}
assert.equal((await areaPropose({shareArea:'yes'})).status,400,'sharing must be a boolean');
assert.equal((await areaPropose({shareArea:true,areaKey:'a different saved area'})).status,409,'a stale label cannot authorize a changed area');
assert.equal((await areaPropose({shareArea:true,areaKey,category:'worker_organizing',workerConsent:true,membershipRules:'Hosts review people seeking respectful worker discussion.'})).status,400,'organizing circles cannot carry a structured shared area');
assert.equal((await areaPropose({area:{...areaLabel,areaLat:1,areaLon:2}})).status,200);
let noArea=(await circleGet('area-b')).data.circles.find(c=>c.title===areaDraft.title);assert.equal(noArea.area,null,'a client-supplied object never implies consent');
assert.equal((await areaPropose({title:'Austin local reading',shareArea:true,areaKey,area:{city:'Injected city',areaLat:1}})).status,200);
let areaCircle=(await circleGet('area-b')).data.circles.find(c=>c.title==='Austin local reading');assert.deepEqual(areaCircle.area,areaLabel,'cofounder reviews exactly the saved city, region and country');
assert.deepEqual(Object.keys(areaCircle.area).sort(),['city','country','region']);
assert(!(await circleGet('area-outside')).data.circles.some(c=>c.id===areaCircle.id),'pending listing remains private');
assert.equal((await circlePost('area-b',{action:'approve',circle:areaCircle.id})).status,200);
let publicAreaCircle=(await circleGet('area-outside')).data.circles.find(c=>c.id===areaCircle.id);assert.deepEqual(publicAreaCircle.area,areaLabel);
assert.equal((await circlePost('area-outside',{action:'together_list',circle:areaCircle.id})).status,403,'area discovery grants no message access');
assert.equal((await circlePost('area-outside',{action:'clear_area',circle:areaCircle.id})).status,403,'nonmembers cannot remove an area');
assert.equal((await circlePost('area-outside',{action:'request',circle:areaCircle.id})).status,200);assert.equal((await circlePost('area-b',{action:'admit',circle:areaCircle.id,target:'area-outside'})).status,200);
assert.equal((await circlePost('area-outside',{action:'clear_area',circle:areaCircle.id})).status,403,'ordinary participants cannot remove the listing area');
assert.equal((await circlePost('area-b',{action:'clear_area',circle:areaCircle.id})).status,200);assert.equal((await circleGet('area-outside')).data.circles.find(c=>c.id===areaCircle.id).area,null);
assert.equal((await circlePost('area-b',{action:'clear_area',circle:areaCircle.id})).status,200,'privacy removal is safe to retry');
const ownAreaResponse=(await circleGet('area-a')).data;assert.deepEqual(ownAreaResponse.myArea,areaLabel);assert(!JSON.stringify(ownAreaResponse).includes('areaLat'),'the circle endpoint never exposes profile coordinates');
console.log('Circle area defaults, stale-consent rejection, organizing exclusion, founder review, listing privacy, member boundaries and removal passed.');
sql.prepare('UPDATE circles SET area=? WHERE id=?').run(JSON.stringify(areaLabel),areaCircle.id);
sql.prepare("UPDATE profiles SET active=0 WHERE id='area-b'").run();
assert.equal((await circlePost('area-b',{action:'clear_area',circle:areaCircle.id})).status,200,'paused hosts retain the ability to remove disclosure');
sql.prepare("UPDATE profiles SET active=1 WHERE id='area-b'").run();
sql.prepare('UPDATE circles SET area=? WHERE id=?').run(JSON.stringify(areaLabel),areaCircle.id);
globalThis.__beforeRun=(query)=>{if(query.startsWith("UPDATE circles SET area='',area_point=''")){globalThis.__beforeRun=null;sql.prepare("UPDATE circle_members SET status='left' WHERE circle=? AND member='area-b'").run(areaCircle.id);}};
assert.equal((await circlePost('area-b',{action:'clear_area',circle:areaCircle.id})).status,409,'host membership is rechecked inside the privacy update');globalThis.__beforeRun=null;
assert.notEqual(sql.prepare('SELECT area FROM circles WHERE id=?').get(areaCircle.id).area,'');
sql.prepare("UPDATE circle_members SET status='accepted' WHERE circle=? AND member='area-b'").run(areaCircle.id);
assert.equal((await circlePost('area-b',{action:'clear_area',circle:areaCircle.id})).status,200);

// Distance discovery is an independent opt-in and uses a provider's area point.
assert.equal((await areaPropose({title:'Distance without area',shareNearby:true})).status,400);
globalThis.__circleAreaSuggestions=[{...areaLabel,region:'Minnesota',areaLat:30.5,areaLon:-97.75,locationPlaceId:'wrong-region'}];
assert.equal((await areaPropose({title:'Distance reading circle',shareArea:true,shareNearby:true,areaKey})).status,503,'a same-name place in a different region cannot resolve the area');
globalThis.__circleAreaSuggestions=[{...areaLabel,areaLat:30.5012,areaLon:-97.7512,locationPlaceId:'provider-public-area'}];
assert.equal((await areaPropose({title:'Distance reading circle',shareArea:true,shareNearby:true,areaKey,areaPoint:{areaLat:0,areaLon:0}})).status,200);
let distanceCircle=(await circleGet('area-b')).data.circles.find(c=>c.title==='Distance reading circle');
assert(distanceCircle.nearbyEnabled,'the other founder sees the distance-discovery choice before agreeing');
assert.deepEqual(JSON.parse(sql.prepare('SELECT area_point FROM circles WHERE id=?').get(distanceCircle.id).area_point),{areaLat:30.5,areaLon:-97.75},'retained point comes only from the provider and is coarsened');
assert(!(await circleGet('area-outside')).data.circles.some(c=>c.id===distanceCircle.id));
assert.equal((await circlePost('area-b',{action:'approve',circle:distanceCircle.id})).status,200);
let radiusResponse=(await circleGet('area-outside')).data;let radiusCircle=radiusResponse.circles.find(c=>c.id===distanceCircle.id);
assert.equal(radiusResponse.canNearby,true);assert.equal(radiusCircle.distanceMiles,20,'only the rounded distance band is returned');
assert(!JSON.stringify(radiusResponse).includes('areaLat'));assert(!JSON.stringify(radiusResponse).includes('area_point'));assert(!JSON.stringify(radiusResponse).includes('provider-public-area'));
assert.equal((await circlePost('area-outside',{action:'together_list',circle:distanceCircle.id})).status,403,'distance discovery never grants content access');
assert.equal((await circleGet('area-b')).data.circles.find(c=>c.id===noArea.id).distanceMiles,null,'old circles are not silently enrolled');
const savedRadiusProfile=sql.prepare("SELECT data FROM profiles WHERE id='area-outside'").get().data;
sql.prepare("UPDATE profiles SET data=json_remove(data,'$.areaLat','$.areaLon') WHERE id='area-outside'").run();
radiusResponse=(await circleGet('area-outside')).data;assert.equal(radiusResponse.canNearby,false);assert.equal(radiusResponse.circles.find(c=>c.id===distanceCircle.id).distanceMiles,null,'missing viewer area point never becomes zero distance');
sql.prepare("UPDATE profiles SET data=? WHERE id='area-outside'").run(savedRadiusProfile);
assert.equal((await circlePost('area-b',{action:'clear_area',circle:distanceCircle.id})).status,200);
assert.equal(sql.prepare('SELECT area_point FROM circles WHERE id=?').get(distanceCircle.id).area_point,'','removing the area also removes the distance point');
radiusCircle=(await circleGet('area-outside')).data.circles.find(c=>c.id===distanceCircle.id);assert.equal(radiusCircle.nearbyEnabled,false);assert.equal(radiusCircle.distanceMiles,null);
delete globalThis.__circleAreaSuggestions;
console.log('Independent distance opt-in, provider-only area resolution, coarse bands, missing-location recovery, founder review, content isolation and withdrawal passed.');
