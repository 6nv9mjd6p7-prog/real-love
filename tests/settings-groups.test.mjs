import ts from 'typescript';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url);
const source=readFileSync('app/love-app.tsx','utf8');
const start=source.indexOf(" {route==='settings'&&")+" {route==='settings'&&".length;
const end=source.indexOf('\n</div></div></>}',start)+'\n</div></div></>'.length;
const fragment=source.slice(start,end);
const moduleSource=`const Guidelines=()=>null,Shield=()=>null,EyeOff=()=>null,MessageCircle=()=>null,UserRound=()=>null,AppearanceControl=()=>null;
const appearance='glass';
const empty={};
const deletePromptRef={current:null},deleteTriggerRef={current:null},deleteSummaryRef={current:null};
function jumpToSettingsSection(id){const target=document.getElementById(id);if(!target)return;if(target.tagName==='DETAILS')target.open=true;target.scrollIntoView({behavior:'smooth',block:'start'});target.focus({preventScroll:true});}
export default function Settings({me,blocked=[],receipts=[],busy=false,emailSignIn=false,legacySignIn=false,isModerator=false,deleteConfirm=false,nav=()=>{},act=()=>{},startReport=()=>{},setDeleteConfirm=()=>{}}){return ${fragment};}`;
const js=ts.transpileModule(moduleSource,{compilerOptions:{module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}}).outputText.replace(/from ["']react\/jsx-runtime["']/,`from '${pathToFileURL(require.resolve('react/jsx-runtime')).href}'`);
const {default:Settings}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const me={id:'self',active:true,discoverable:true};
const html=renderToStaticMarkup(React.createElement(Settings,{me,blocked:['blocked'],receipts:[{id:'receipt',reason:'Harassment',status:'received'}]}));
assert(html.includes('Manage visibility, safety, privacy, notifications, and account access.'),'settings overview names the full scope of its sections');
assert(html.includes('aria-label="Jump to a settings section"'));
for(const label of ['Visibility','Safety','Account','Privacy'])assert(html.includes('>'+label+'</button>'),'settings has a quick jump for '+label);
for(const group of ['visibility','safety','account','privacy'])assert(html.includes('id="settings-'+group+'" tabindex="-1"'));
assert(html.indexOf('id="settings-visibility"')<html.indexOf('id="settings-safety"'));
assert(html.indexOf('id="settings-safety"')<html.indexOf('id="settings-account"'));
assert(html.indexOf('id="settings-account"')<html.indexOf('id="settings-privacy"'));
assert(html.indexOf('settings-delete')>html.indexOf('id="settings-privacy"'));
assert(html.includes('<details class="form-section settings-delete">'),'deletion begins collapsed');
assert(html.includes('Receipt: receipt'));assert(!html.includes('Confirm deletion'));assert.equal((html.match(/role="heading" aria-level="3"/g)||[]).length,5,'each nested privacy disclosure is reachable as a level-three heading');
const fresh=renderToStaticMarkup(React.createElement(Settings,{}));
assert(!fresh.includes('id="settings-visibility"'));assert(!fresh.includes('settings-delete'));assert(fresh.includes('You have no report receipts yet.'));assert(fresh.includes('<span class="field-help" role="status">You have no blocked members.</span>'),'empty blocked-member state is announced');assert(fresh.includes('<p class="field-help" role="status">You have no report receipts yet.</p>'),'empty report state is announced');
const confirmation=renderToStaticMarkup(React.createElement(Settings,{me,deleteConfirm:true}));
assert(confirmation.includes('Confirm deletion'));assert(confirmation.includes('Keep my profile'));
function elements(node){if(!node||typeof node!=='object')return [];return [node,...React.Children.toArray(node.props?.children).flatMap(elements)];}
let navigated,action,reported,confirm;
const nodes=elements(Settings({me,blocked:['blocked'],nav:x=>navigated=x,act:x=>action=x,startReport:x=>reported=x,setDeleteConfirm:x=>confirm=x}));
let scrolled='',focused='',jumpTarget={tagName:'DETAILS',open:false,scrollIntoView:options=>scrolled=options.behavior,focus:options=>focused=String(options.preventScroll)};globalThis.document={getElementById:id=>{assert.equal(id,'settings-safety');return jumpTarget;}};
nodes.find(n=>n.type==='button'&&n.props.children==='Safety').props.onClick();assert.equal(jumpTarget.open,true);assert.equal(scrolled,'smooth');assert.equal(focused,'true');delete globalThis.document;
const button=label=>nodes.find(n=>n.type==='button'&&n.props.children===label);
button('Manage notifications').props.onClick();assert.equal(navigated,'notifications');
button('Hide from discovery').props.onClick();assert.deepEqual(action,{action:'discovery_visibility',discoverable:false});
button('Pause all interaction').props.onClick();assert.deepEqual(action,{action:'visibility',active:false});
button('Unblock').props.onClick();assert.deepEqual(action,{action:'unblock',target:'blocked'});
button('Report').props.onClick();assert.equal(reported.id,'blocked');
button('Delete my profile').props.onClick();assert.equal(confirm,true);
nodes.find(n=>n.type==='details'&&n.props.className==='form-section settings-delete').props.onToggle({currentTarget:{open:false}});assert.equal(confirm,false);
console.log('Settings grouping, native disclosures, safety controls, account links, and separate deletion confirmation passed (render/action checks).');

for(const group of ['visibility','safety','account','privacy']){
 const disclosure=nodes.find(n=>n.type==='details'&&n.props.id==='settings-'+group);assert(disclosure,'complete settings group remains accessible');
 assert(elements(disclosure).some(n=>n.type==='summary'),'each group has a native keyboard-operated control');
 assert.equal(!!disclosure.props.open,false,'settings overview begins compact with every group available');
}
