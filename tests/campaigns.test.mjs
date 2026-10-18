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
const webPushUrl=compile('app/web-push.ts');globalThis.__pushTasks=[];const notificationServerUrl=compile('app/notifications-server.ts',s=>s.replace("import {env,waitUntil} from 'cloudflare:workers';",'const env=globalThis.__rlEnv;const waitUntil=p=>globalThis.__pushTasks.push(p);').replace("from './web-push'",`from '${webPushUrl}'`).replace("from './safety'",`from '${safetyUrl}'`).replace("from './moderation-policy'",`from '${modPolicyUrl}'`));
const voiceAccessUrl=compile('app/voice-access.ts',s=>s.replace("import {env} from 'cloudflare:workers';",'const env=globalThis.__rlEnv;').replace("from './safety'",`from '${safetyUrl}'`));
const revisionUrl=compile('app/message-revision.ts');
const historyUrl=compile('app/history-tools.ts',s=>s.replace("from './safety'",`from '${safetyUrl}'`));const analyticsUrl=compile('app/product-analytics.ts');
function replacements(s){return s.replace("import {searchBroadLocations} from '../../location-search';",'const searchBroadLocations=async()=>[];').replace("from '../../message-revision'",`from '${revisionUrl}'`).replace("from '../../history-tools'",`from '${historyUrl}'`).replace("from '../../product-analytics'",`from '${analyticsUrl}'`).replace("from '../../voice-access'",`from '${voiceAccessUrl}'`).replace("from '../../notifications-server'",`from '${notificationServerUrl}'`).replace("from '../../web-push'",`from '${webPushUrl}'`).replace("from '../../chat-server'",`from '${chatServerUrl}'`).replace("import { env } from 'cloudflare:workers';","const env=globalThis.__rlEnv;").replace("import {env} from 'cloudflare:workers';","const env=globalThis.__rlEnv;").replace("import {getChatGPTUser} from '../../chatgpt-auth';","const getChatGPTUser=async()=>globalThis.__rlUser;").replace("from '../../circle-policy'",`from '${circlePolicyUrl}'`).replace("from '../../invitations'",`from '${invitationUrl}'`).replace("from '../../location'",`from '${locationUrl}'`).replace("from '../../model'",`from '${modelUrl}'`).replace("from '../../photo-policy'",`from '${policyUrl}'`).replace("from '../../safety'",`from '${safetyUrl}'`).replace("from '../../moderation-policy'",`from '${modPolicyUrl}'`).replace("from 'zod'",`from '${pathToFileURL(require.resolve('zod')).href}'`);}
const voice=await import(compile('app/api/voice/route.ts',replacements));
const notificationsApi=await import(compile('app/api/notifications/route.ts',replacements));const reports=await import(compile('app/api/reports/route.ts',replacements)),moderation=await import(compile('app/api/moderation/route.ts',replacements));const app=await import(compile('app/api/app/route.ts',replacements));const photo=await import(compile('app/api/photo/route.ts',replacements));const circles=await import(compile('app/api/circles/route.ts',replacements));
function as(id){globalThis.__rlUser=id?{userId:id,email:id+'@test.invalid'}:null;}
function request(body,origin='https://rl.test',cf=null){const value=new Request('https://rl.test/api/app',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify(body)});if(cf)Object.defineProperty(value,'cf',{value:cf});return value;}
async function post(id,body,cf=null){as(id);const r=await (body.action==='report'?reports:app).POST(request(body,'https://rl.test',cf));return {status:r.status,data:await r.json()};}
async function get(id){as(id);const r=await app.GET();return {status:r.status,data:await r.json()};}
const draft=(id)=>({...model.examples[1],birthDate:`${new Date().getUTCFullYear()-30}-01-01`,id,name:id,demo:false,gender:'Man',interested:['Woman'],orientation:'Asexual',aceOnly:true,intentions:['Build together','Friendship','Romance'],connectionBoundary:'Friendship only',firstStep:'A conversation about community decisions',consent:true,rulesVersion:'2026-10-02'});
const campaigns=await import(compile('app/api/campaigns/route.ts',replacements));
for(const who of ['author','member','outsider','reviewer','referee']){await post(who,{action:'profile',profile:draft(who)});sql.prepare("UPDATE safety_accounts SET status='admitted' WHERE id=?").run(who);}
sql.prepare('INSERT INTO moderators (id) VALUES (?)').run('reviewer');
const payload={title:'Test company campaign',company:'Fictional test company',summary:'A hypothetical integration-test claim with sufficient detail.',demand:'Publish a documented response and meet the stated demand.',uncertainty:'This is fictional test data, not a real accusation.',alternatives:'No recommendations or financial relationships in this test.',sources:[{url:'https://example.org/evidence',claim:'Test evidence for a hypothetical claim.'}],reviewDate:new Date(Date.now()+7*86400000).toISOString().slice(0,10)};
async function read(who){as(who);const r=await campaigns.GET();return {status:r.status,data:await r.json()};}
async function write(who,body){as(who);const r=await campaigns.POST(request({expectedAccount:who,...body}));return {status:r.status,data:await r.json()};}
assert.equal((await read(null)).status,401);
assert.equal((await write('author',{action:'propose',draft:payload})).status,400);
assert.equal((await write('author',{action:'propose',draft:{...payload,sources:[{url:'javascript:alert(1)',claim:'Invalid executable source.'}]},consent:true})).status,400);
assert.equal((await write('author',{action:'propose',draft:{...payload,reviewDate:'2020-01-01'},consent:true})).status,400);
assert.equal((await write('author',{action:'propose',draft:payload,consent:true,expectedAccount:'other'})).status,409);
as('author');assert.equal((await campaigns.POST(request({action:'propose',draft:payload,consent:true,expectedAccount:'author'},'https://evil.invalid'))).status,403);
const proposed=await write('author',{action:'propose',draft:payload,consent:true});assert.equal(proposed.status,200);const campaign=proposed.data.campaign;
assert.equal((await read('outsider')).data.campaigns.length,0,'pending proposals never leak');
assert.equal((await read('author')).data.campaigns[0].status,'pending');
assert.equal((await write('member',{action:'join',campaign,consent:true})).status,409);
assert.equal((await write('member',{action:'feedback',campaign,kind:'report',body:'Should not access a private proposal.'})).status,404);
const review={action:'review',campaign,version:1,decision:'approve',reason:'Reviewed fictional evidence and verified test scope.',checked:true,reviewDate:payload.reviewDate};
assert.equal((await write('author',review)).status,403);
sql.prepare('INSERT INTO moderators (id) VALUES (?)').run('author');assert.equal((await write('author',review)).status,403,'even a moderator cannot self-approve');sql.prepare("DELETE FROM moderators WHERE id='author'").run();
assert.equal((await write('reviewer',{...review,checked:false})).status,400);
assert.equal((await write('reviewer',review)).status,200);
assert.equal((await write('reviewer',review)).status,409,'stale review is rejected');
assert.equal((await read('outsider')).data.campaigns.length,1);
assert.equal((await write('member',{action:'join',campaign,consent:false})).status,400);
assert.equal((await write('member',{action:'join',campaign,consent:true})).status,200);
assert.equal((await write('member',{action:'join',campaign,consent:true})).status,200);
assert.equal(sql.prepare('SELECT COUNT(*) n FROM campaign_participation').get().n,1);
assert.equal((await read('member')).data.campaigns[0].participating,true);
for(const who of ['author','outsider','reviewer']){const c=(await read(who)).data.campaigns[0];assert.equal(c.participating,false);for(const key of ['creator','participants','count','member','reviewer'])assert(!(key in c));}
assert.equal(sql.prepare("SELECT COUNT(*) n FROM notifications WHERE scope=?").get(campaign).n,0);
assert.equal((await write('member',{action:'feedback',campaign,kind:'correction',body:'A correction that must remain private until reviewed.'})).status,200);
assert.equal((await read('outsider')).data.campaigns[0].feedback.length,0);
assert.equal((await read('author')).data.campaigns[0].feedback.length,0);
assert.equal((await read('member')).data.campaigns[0].feedback.length,1);
const f=(await read('reviewer')).data.campaigns[0].feedback[0].id;
assert.equal((await write('reviewer',{...review,version:2,decision:'publish_update',feedback:f,reason:'Reviewed correction: the earlier evidence needs qualification.'})).status,200);
assert((await read('outsider')).data.campaigns[0].updates.some(u=>u.body.startsWith('Reviewed correction')));
assert.equal((await write('reviewer',{...review,version:3,decision:'pause'})).status,200);
assert.equal((await write('outsider',{action:'join',campaign,consent:true})).status,409);
assert.equal((await write('reviewer',{...review,version:4})).status,200);
sql.prepare("UPDATE campaigns SET data=json_set(data,'$.reviewDate','2020-01-01') WHERE id=?").run(campaign);
assert.equal((await read('outsider')).data.campaigns.length,0,'overdue campaigns leave discovery');
assert.equal((await read('member')).data.campaigns[0].status,'review_due');
assert.equal((await write('outsider',{action:'join',campaign,consent:true})).status,409);
sql.prepare("UPDATE safety_accounts SET status='suspended' WHERE id='member'").run();
assert.equal((await read('member')).data.campaigns[0].participating,true,'restricted members can access their own participation to remove it');
assert.equal((await write('member',{action:'leave',campaign})).status,200);
assert.equal(sql.prepare('SELECT COUNT(*) n FROM campaign_participation').get().n,0);
sql.prepare("UPDATE safety_accounts SET status='admitted' WHERE id='member'").run();
assert.equal((await write('reviewer',{...review,version:5})).status,200);
await write('member',{action:'join',campaign,consent:true});
assert.equal((await post('member',{action:'delete'})).status,200);
assert.equal(sql.prepare('SELECT COUNT(*) n FROM campaign_participation').get().n,0,'account deletion removes participation');
assert.equal((await write('outsider',{action:'withdraw',campaign})).status,403);
assert.equal((await write('author',{action:'withdraw',campaign})).status,200);
assert.equal((await read('outsider')).data.campaigns.length,0);
assert.equal((await post('author',{action:'delete'})).status,200);
assert.equal((await read('reviewer')).data.campaigns.length,0,'deleted proposer content is not rendered');
console.log('Campaign privacy, independent review, validation, private participation, feedback, expiry, suspension and deletion passed.');

// Regression: a withdrawal immediately before the atomic review batch must
// leave no review event and must not consume private feedback.
const stamp=new Date().toISOString();
function seedCampaign(key,created=stamp,data=payload,creator='outsider'){
 sql.prepare("INSERT INTO campaigns (id,creator,data,status,version,created) VALUES (?,?,?,'active',1,?)").run(key,creator,JSON.stringify(data),created);
}
seedCampaign('race-withdraw');
sql.prepare("INSERT INTO campaign_feedback VALUES ('race-feedback','race-withdraw','referee','correction','Keep this concern open until a valid review.','open',?)").run(stamp);
globalThis.__beforeRun=(query)=>{if(query.startsWith('INSERT INTO campaign_updates')){globalThis.__beforeRun=null;sql.prepare("UPDATE campaigns SET status='withdrawn',version=version+1 WHERE id='race-withdraw'").run();}};
const raceResult=await write('reviewer',{action:'review',campaign:'race-withdraw',version:1,decision:'publish_update',feedback:'race-feedback',reason:'This attempted review must not commit after withdrawal.',checked:true});
assert.equal(raceResult.status,409);
assert.equal(sql.prepare("SELECT COUNT(*) n FROM campaign_updates WHERE campaign='race-withdraw'").get().n,0,'stale review must not insert an event');
assert.equal(sql.prepare("SELECT status FROM campaign_feedback WHERE id='race-feedback'").get().status,'open','stale review must not consume feedback');
assert.equal(sql.prepare("SELECT status FROM campaigns WHERE id='race-withdraw'").get().status,'withdrawn');

// Removal stays available independently of account participation eligibility.
seedCampaign('paused-withdraw');sql.prepare("UPDATE profiles SET active=0 WHERE id='outsider'").run();
assert.equal((await write('outsider',{action:'withdraw',campaign:'paused-withdraw'})).status,200);
const withdrawnVersion=sql.prepare("SELECT version FROM campaigns WHERE id='paused-withdraw'").get().version;
assert.equal((await write('outsider',{action:'withdraw',campaign:'paused-withdraw'})).status,200);
assert.equal(sql.prepare("SELECT version FROM campaigns WHERE id='paused-withdraw'").get().version,withdrawnVersion,'withdrawal retries are idempotent');
seedCampaign('suspended-withdraw');sql.prepare("UPDATE safety_accounts SET status='suspended' WHERE id='outsider'").run();
assert.equal((await write('outsider',{action:'withdraw',campaign:'suspended-withdraw'})).status,200);
assert.equal((await write('reviewer',{action:'withdraw',campaign:'suspended-withdraw'})).status,403,'reviewer cannot withdraw another member’s proposal');
sql.prepare("UPDATE profiles SET active=1 WHERE id='outsider'").run();sql.prepare("UPDATE safety_accounts SET status='admitted' WHERE id='outsider'").run();

async function readPage(who,scope,cursor){as(who);const params=new URLSearchParams({scope});if(cursor)params.set('cursor',cursor);const r=await campaigns.GET(new Request('https://rl.test/api/campaigns?'+params));return {status:r.status,data:await r.json()};}
seedCampaign('older-joined','2019-01-01');sql.prepare("INSERT INTO campaign_participation VALUES ('older-joined','referee')").run();
for(let i=0;i<100;i++)seedCampaign('expired-'+i,stamp,{...payload,reviewDate:'2020-01-01'});
assert((await readPage('referee','mine')).data.campaigns.some(c=>c.id==='older-joined'),'older participation cannot be crowded out by discovery');
const discover=await readPage('referee','explore');assert(discover.data.campaigns.some(c=>c.id==='older-joined'),'expiration filtering occurs before pagination');assert(!discover.data.campaigns.some(c=>c.id.startsWith('expired-')));
for(let i=0;i<61;i++){seedCampaign('page-'+String(i).padStart(3,'0'));sql.prepare('INSERT INTO campaign_participation VALUES (?,?)').run('page-'+String(i).padStart(3,'0'),'referee');}
let cursor=null,ids=[];
do{const p=await readPage('referee','mine',cursor);assert.equal(p.status,200);ids.push(...p.data.campaigns.map(c=>c.id));cursor=p.data.nextCursor;}while(cursor);
assert.equal(ids.length,62);assert.equal(new Set(ids).size,62,'cursor pages neither duplicate nor omit tied timestamps');
assert(ids.includes('older-joined'));
assert.equal((await readPage('outsider','review')).status,403);
assert.equal((await readPage('referee','mine','invalid-json')).status,400);
assert.equal((await readPage('referee','unsupported')).status,400);
// An expired campaign's participant can still send a concern to reviewers.
sql.prepare("INSERT INTO campaign_participation VALUES ('expired-0','referee')").run();
assert.equal((await write('referee',{action:'feedback',campaign:'expired-0',kind:'report',body:'I participated and need to report an unresolved concern.'})).status,200);
console.log('Regression checks passed: withdrawal race rollback, paused/suspended withdrawal, idempotency, scoped pagination and expired-campaign reporting.');

// Detail restoration uses the same scope authorization as paginated lists.
async function readDetail(who,scope,id){as(who);const r=await campaigns.GET(new Request('https://rl.test/api/campaigns?'+new URLSearchParams({scope,id})));return {status:r.status,data:await r.json()};}
const specific=await readDetail('referee','mine','older-joined');assert.equal(specific.status,200);assert.deepEqual(specific.data.campaigns.map(c=>c.id),['older-joined']);assert.equal(specific.data.nextCursor,null);
seedCampaign('private-detail',stamp,payload,'author');sql.prepare("UPDATE campaigns SET status='pending' WHERE id='private-detail'").run();
assert.equal((await readDetail('referee','explore','private-detail')).data.campaigns.length,0,'a detail ID cannot bypass publication scope');
assert.equal((await readDetail('referee','mine','private-detail')).data.campaigns.length,0,'a detail ID cannot bypass ownership or participation');
assert.equal((await readDetail('author','mine','private-detail')).data.campaigns[0].id,'private-detail');
console.log('Campaign detail restoration retains list authorization and resolves older records without pagination.');

// A moderator's role must not reveal private proposal or feedback content when
// the moderator has a personal connection to the proposer or feedback author.
for(const who of ['conflict-reviewer','feedback-author']){
 await post(who,{action:'profile',profile:draft(who)});
 sql.prepare("UPDATE safety_accounts SET status='admitted' WHERE id=?").run(who);
}
sql.prepare('INSERT INTO moderators (id) VALUES (?)').run('conflict-reviewer');
for(const [id,sender,recipient] of [
 ['reviewer-proposer-link','conflict-reviewer','author'],
 ['reviewer-feedback-link','conflict-reviewer','feedback-author']
])sql.prepare("INSERT INTO connections (id,sender,recipient,status,kind,created) VALUES (?,?,?,'accepted','Connect',?)").run(id,sender,recipient,stamp);
seedCampaign('conflicted-private-proposal',stamp,payload,'author');
sql.prepare("UPDATE campaigns SET status='pending' WHERE id='conflicted-private-proposal'").run();
sql.prepare("INSERT INTO campaign_updates (id,campaign,body,kind,published,created,reviewer) VALUES ('private-proposal-update','conflicted-private-proposal','Private review notes','review',0,?,'referee')").run(stamp);
sql.prepare("INSERT INTO campaign_feedback VALUES ('conflicted-private-feedback','conflicted-private-proposal','feedback-author','report','Private feedback body','open',?)").run(stamp);
assert.equal((await readDetail('conflict-reviewer','review','conflicted-private-proposal')).data.campaigns.length,0,'a conflicted moderator cannot read the proposal, private updates, or feedback');
seedCampaign('public-feedback-conflict',stamp,payload,'outsider');
sql.prepare("INSERT INTO campaign_feedback VALUES ('public-conflicted-feedback','public-feedback-conflict','feedback-author','report','Sensitive feedback body','open',?)").run(stamp);
const conflictedPublic=await readDetail('conflict-reviewer','all','public-feedback-conflict');
assert.equal(conflictedPublic.status,200);
assert.equal(conflictedPublic.data.campaigns.length,1,'the public campaign remains available');
assert.equal(conflictedPublic.data.campaigns[0].canReview,true,'reviewer is independent of campaign proposer');
assert.equal(conflictedPublic.data.campaigns[0].feedback.some(f=>f.id==='public-conflicted-feedback'),false,'feedback from a connected author stays private to an independent reviewer');
assert.equal((await readDetail('reviewer','review','conflicted-private-proposal')).data.campaigns[0].feedback[0].id,'conflicted-private-feedback','an independent reviewer can still read private review feedback');
console.log('Campaign privacy regression passed: conflicted moderators cannot read private proposals or feedback.');
