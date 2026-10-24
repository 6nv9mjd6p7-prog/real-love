import ts from 'typescript';
import {readFileSync,readdirSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const compile=s=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText).toString('base64');
const safetySource=readFileSync('app/safety.ts','utf8').replace("import {env} from 'cloudflare:workers';",'const env={};').replace("import {RULES_VERSION} from './rules';","const RULES_VERSION='test';").replace("export {RULES_VERSION,reportReasons} from './rules';",'export const reportReasons=[];');
const safetyUrl='data:text/javascript;base64,'+Buffer.from(ts.transpileModule(safetySource,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
const {failure,SafetyError}=await import(safetyUrl);
const unexpectedFailure=await failure(Error('database host and private query details'));
assert.equal(unexpectedFailure.status,503);
assert.equal((await unexpectedFailure.json()).error,'Could not complete this action. Please try again.','unexpected server errors are sanitized before reaching the client');
const expectedFailure=await failure(new SafetyError('Request origin not allowed.',403));
assert.equal(expectedFailure.status,403);
assert.equal((await expectedFailure.json()).error,'Request origin not allowed.','safe, intentional application errors retain their status and message');
const {LatestRequest}=await import(compile(readFileSync('app/request-gate.ts','utf8')));
const gate=new LatestRequest();let resolveOld;const old=gate.begin();const pending=new Promise(r=>resolveOld=r).then(value=>gate.current(old)?value:null);const newer=gate.begin();assert(gate.current(newer));resolveOld('stale profile');assert.equal(await pending,null);gate.cancel();assert(!gate.current(newer),'unmount or mutation cancels outstanding work');
const {dialogControls,tabDestination,manageDialogFocus}=await import(compile(readFileSync('app/modal-focus.ts','utf8')));
const make=(name,options={})=>({name,tabIndex:0,isConnected:true,inert:false,...options,matches:()=>!!options.disabled,closest:()=>options.hidden?{}:null,getClientRects:()=>options.noLayout?[]:[{}],focus(){globalThis.document.activeElement=this;},contains(node){return node===this;}});
const first=make('first'),middle=make('middle'),last=make('last');const root=make('dialog');root.querySelectorAll=()=>[first,make('disabled',{disabled:true}),make('hidden',{hidden:true}),make('collapsed',{noLayout:true}),middle,last];root.contains=node=>[root,first,middle,last].includes(node);
assert.deepEqual(dialogControls(root),[first,middle,last]);assert.equal(tabDestination([first,middle,last],last,false),first);assert.equal(tabDestination([first,middle,last],first,true),last);assert.equal(tabDestination([first,middle,last],middle,false),undefined);assert.equal(tabDestination([],null,false),null);
const opener=make('opener'),background=make('main'),alreadyInert=make('hidden panel',{inert:true});const listeners={};globalThis.document={activeElement:opener,body:{style:{overflow:'auto'}},querySelector:()=>null,querySelectorAll:()=>[background,alreadyInert],addEventListener:(type,fn)=>listeners[type]=fn,removeEventListener:type=>delete listeners[type]};let dismissed=0,busy=true;const cleanup=manageDialogFocus(root,()=>dismissed++,()=>busy);assert.equal(document.activeElement,first);assert(background.inert);listeners.keydown({key:'Escape',preventDefault(){}});assert.equal(dismissed,0);busy=false;listeners.keydown({key:'Escape',preventDefault(){}});assert.equal(dismissed,1);document.activeElement=last;let prevented=false;listeners.keydown({key:'Tab',shiftKey:false,preventDefault(){prevented=true;}});assert(prevented);assert.equal(document.activeElement,first);cleanup();assert.equal(document.activeElement,opener);assert.equal(background.inert,false);assert.equal(alreadyInert.inert,true);assert.equal(document.body.style.overflow,'auto');assert.deepEqual(listeners,{});delete globalThis.document;
const handlers={};let networkCalls=0;runInNewContext(readFileSync('public/sw.js','utf8'),{self:{location:{origin:'https://example.test'},addEventListener:(name,fn)=>handlers[name]=fn,skipWaiting(){},clients:{claim(){return Promise.resolve();}}},URL,Response,fetch:async()=>{networkCalls++;throw Error('offline');}});
for(const request of [{url:'https://example.test/api/app',method:'GET',mode:'cors'},{url:'https://example.test/api/photos',method:'GET',mode:'same-origin'},{url:'https://example.test/api/circles',method:'POST',mode:'cors'},{url:'https://other.test/',method:'GET',mode:'navigate'}]){handlers.fetch({request,respondWith(){assert.fail('private data and cross-origin requests must bypass the worker');}});}
assert.equal(networkCalls,0);let response;handlers.fetch({request:{url:'https://example.test/',method:'GET',mode:'navigate'},respondWith(p){response=p;}});const offline=await response;assert.equal(offline.status,503);assert.equal(offline.headers.get('Cache-Control'),'no-store');const offlineHtml=await offline.text();assert.match(offlineHtml,/Reconnect to Real Love/);assert.match(offlineHtml,/<a href="\/">Try again<\/a>/,'offline retry uses normal navigation instead of inline JavaScript');const offlineStyle=offlineHtml.match(/<style>([\s\S]*?)<\/style>/)?.[1]||'';const offlineHash=createHash('sha256').update(offlineStyle).digest('base64');assert.equal(offline.headers.get('Content-Security-Policy'),`default-src 'none'; style-src 'sha256-${offlineHash}'; style-src-attr 'none'; base-uri 'none'`,'offline CSS uses an exact hash and rejects inline style attributes');assert.equal(networkCalls,1);
console.log('Stale request cancellation, dialog focus lifecycle, and private-data offline bypass passed (unit tests; not browser QA).');

// Exercise the actual response wrapper: recorded previews use local blob URLs.
// Cloudflare's HTMLRewriter adds the generated nonce to server-rendered scripts and styles.
globalThis.HTMLRewriter=class{on(selector,handler){this.selector=selector;this.handler=handler;return this;}transform(response){const handler=this.handler,html=globalThis.__securityHTML;const body=html.replace(/<(script|style)\b[^>]*>/gi,tag=>{const attrs={};handler.element({setAttribute:(name,value)=>attrs[name]=value});return tag.replace(/>$/,Object.entries(attrs).map(([name,value])=>' '+name+'="'+value+'"').join('')+'>');});return new Response(body,{status:response.status,headers:response.headers});}};
const workerSource=readFileSync('build/sites-worker.ts','utf8')
 .replace('import handler from "vinext/server/fetch-handler";', 'const handler={fetch:async()=>{globalThis.__securityHandlerCalls++;return globalThis.__securityResponse;}};')
 .replace('import { runWithConnectorBinding } from "../lib/connector-context";', 'const runWithConnectorBinding=(_,fn)=>fn();')
 .replace('import { cleanup } from "../app/safety";', 'const cleanup=()=>{globalThis.__retentionCleanupCalls++;return Promise.resolve();};')
 .replaceAll('import.meta.env.DEV','false');
const {default:worker}=await import(compile(workerSource));
globalThis.__securityHandlerCalls=0;
globalThis.__securityHTML='<html><script>bootstrap()</script><style>body{color:red}</style></html>';
globalThis.__securityResponse=new Response(globalThis.__securityHTML,{headers:{'Content-Type':'text/html'}});
const secured=await worker.fetch(new Request('https://example.test/'),{},{});
assert.equal(secured.headers.get('Strict-Transport-Security'),'max-age=31536000','HTTPS responses enable HSTS for this host only');
const directives=new Map(secured.headers.get('Content-Security-Policy').split(';').map(d=>{const [name,...sources]=d.trim().split(/\s+/);return [name,sources];}));
assert(directives.get('script-src').some(source=>/^'nonce-[a-f0-9]{36}'$/.test(source)),'inline scripts are authorized by a response-specific nonce');
assert(!directives.get('script-src').includes("'unsafe-inline'"),'inline JavaScript is no longer universally allowed');
assert(directives.get('style-src').some(source=>/^'nonce-[a-f0-9]{36}'$/.test(source)),'inline style blocks are authorized by a response-specific nonce');
assert(!directives.get('style-src').includes("'unsafe-inline'"),'inline stylesheet blocks are no longer universally allowed');
assert.deepEqual(directives.get('style-src-attr'),["'none'"],'style attributes are explicitly blocked while nonce-authorized style blocks remain available');
assert.match(await secured.text(),/<script nonce="[a-f0-9]{36}">bootstrap\(\)<\/script><style nonce="[a-f0-9]{36}">body\{color:red\}<\/style>/,'nonces are attached to server-rendered scripts and style blocks');
const ciWorkflow=readFileSync('.github/workflows/ci.yml','utf8');
for(const action of ['actions/checkout','pnpm/action-setup','actions/setup-node']){const escaped=action.replace('/','\\/');assert.match(ciWorkflow,new RegExp('uses: '+escaped+'@[a-f0-9]{40} # v[0-9]+[.][0-9]+[.][0-9]+'),'CI action '+action+' remains pinned to a full immutable SHA and reviewed version');}
assert.match(ciWorkflow,/persist-credentials:\s*false/,'checkout does not persist its GitHub token into build steps');
assert.match(readFileSync('.github/dependabot.yml','utf8'),/package-ecosystem:\s*github-actions[\s\S]*interval:\s*monthly/,'Dependabot reviews pinned GitHub Actions for updates monthly');
for(const file of ['app/interactive-photo.tsx','app/chat-bubble.tsx','app/dev/chat-preview/preview.tsx'])assert.doesNotMatch(readFileSync(file,'utf8'),/\sstyle=\{/,'runtime styling in '+file+' uses policy-compatible classes and data attributes');
assert.deepEqual(directives.get('media-src'),["'self'",'blob:'],'local voice previews and private saved notes are allowed');
assert.deepEqual(directives.get('connect-src'),["'self'"],'recordings stay on this app');
assert.deepEqual(directives.get('object-src'),["'none'"]);
assert.equal(secured.headers.get('Permissions-Policy'),'camera=(), microphone=(self), geolocation=(self)','microphone and optional location may request permission on this origin; camera stays blocked');
let limitedKey='';const limitedApi=await worker.fetch(new Request('https://example.test/api/app',{headers:{'CF-Connecting-IP':'203.0.113.5'}}),{RATE_LIMITER_API:{async limit({key}){limitedKey=key;return {success:false};}}},{});assert.equal(limitedApi.status,429,'the edge rejects over-limit API calls before reaching app handlers');assert.equal(limitedApi.headers.get('Retry-After'),'60');assert.equal(limitedKey,'203.0.113.5');assert.equal(globalThis.__securityHandlerCalls,1,'the blocked request never reaches the app handler');
const limitedAuth=await worker.fetch(new Request('https://example.test/api/auth',{method:'POST',headers:{'CF-Connecting-IP':'203.0.113.6'}}),{RATE_LIMITER_AUTH:{async limit(){return {success:false};}}},{});assert.equal(limitedAuth.status,429,'sign-in uses its stricter edge limiter');assert.equal(globalThis.__securityHandlerCalls,1);
const insecurePreview=await worker.fetch(new Request('http://localhost/'),{},{});
assert.equal(insecurePreview.headers.get('Strict-Transport-Security'),null,'local HTTP previews do not receive HSTS');
globalThis.__retentionCleanupCalls=0;
let scheduledCleanup;
worker.scheduled({}, {}, {waitUntil(promise){scheduledCleanup=promise;}});
await scheduledCleanup;
assert.equal(globalThis.__retentionCleanupCalls,1,'the scheduled Worker event invokes report and safety data retention cleanup');
globalThis.__securityResponse=new Response('photo',{headers:{'Content-Security-Policy':"default-src 'none'; sandbox"}});
const photoResponse=await worker.fetch(new Request('https://example.test/api/photo'),{},{});
assert.equal(photoResponse.headers.get('Content-Security-Policy'),"default-src 'none'; sandbox",'specific photo policy is preserved');
delete globalThis.__securityResponse;
console.log('Voice preview media sources and same-origin microphone permission passed.');

const {readMessageWindow}=await import(compile(readFileSync('app/merge-history.ts','utf8')));
let historyCalls=0,historyVersion='one',denyHistory=false;
const historyApi=async input=>{historyCalls++;if(denyHistory)throw Object.assign(Error('Unavailable'),{status:403});if(input.knownRevision===historyVersion)return {unchanged:true,revision:historyVersion};if(input.before)return {messages:[{id:'old'}],cursor:1,hasMore:false};return {messages:[{id:historyVersion}],cursor:3,hasMore:true,revision:historyVersion};};
const firstWindow=await readMessageWindow(historyApi,{action:'messages',connection:'scope'},1);assert.equal(historyCalls,2);assert.deepEqual(firstWindow.messages.map(m=>m.id),['old','one']);
const unchangedWindow=await readMessageWindow(historyApi,{action:'messages',connection:'scope'},1);assert.equal(historyCalls,3,'unchanged refresh performs one authorized request without loading older pages');assert.equal(unchangedWindow,firstWindow);
historyVersion='two';const changedWindow=await readMessageWindow(historyApi,{action:'messages',connection:'scope'},1);assert.equal(historyCalls,5);assert.equal(changedWindow.messages.at(-1).id,'two');denyHistory=true;await assert.rejects(()=>readMessageWindow(historyApi,{action:'messages',connection:'scope'},1));denyHistory=false;await readMessageWindow(historyApi,{action:'messages',connection:'scope'},1);assert.equal(historyCalls,8,'denied access invalidates cached window');

let notificationCursor=4;const circleWindowApi=async input=>input.knownRevision?{unchanged:true,revision:'same',readCursor:notificationCursor}:{messages:[{id:'circle-note'}],hasMore:false,cursor:1,revision:'same',readCursor:notificationCursor};
const circleWindow=await readMessageWindow(circleWindowApi,{action:'conversation',circle:'circle-scope'},null);notificationCursor=5;const refreshedCircleWindow=await readMessageWindow(circleWindowApi,{action:'conversation',circle:'circle-scope'},null);assert.equal(refreshedCircleWindow.readCursor,5,'fresh circle notification cursor survives unchanged-message caching');assert.equal(refreshedCircleWindow.messages,circleWindow.messages,'unchanged messages retain their existing history');
// Server queries must bind RULES_VERSION; a copied literal silently diverges when the rules change.
const rulesVersion=readFileSync('app/rules.ts','utf8').match(/RULES_VERSION='([^']+)'/)[1];
const appSources=readdirSync('app',{recursive:true}).filter(f=>/\.tsx?$/.test(f)&&f!=='rules.ts');
for(const file of appSources)assert(!readFileSync('app/'+file,'utf8').includes(rulesVersion),`app/${file} must use RULES_VERSION instead of the literal ${rulesVersion}`);
