import ts from 'typescript';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import React from 'react';
const require=createRequire(import.meta.url);
function compile(source){return 'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}}).outputText.replace(/from ["']react\/jsx-runtime["']/,`from '${pathToFileURL(require.resolve('react/jsx-runtime')).href}'`)).toString('base64');}
let open,index=0;
globalThis.__circleToolsHooks={useState:initial=>[open??initial,value=>open=value]};
const {default:Tools}=await import(compile(readFileSync('app/circle-chat-tools.tsx','utf8').replace("import {useState,type ReactNode} from 'react';",'const {useState}=globalThis.__circleToolsHooks;')));
const content=React.createElement('p',null,'Circle controls');
let tree=Tools({children:content});assert.equal(tree.type,'details');assert.equal(tree.props.open,false,'circle tools start collapsed');
tree.props.onToggle({currentTarget:{open:true}});assert.equal(Tools({children:content}).props.open,true);
open=undefined;tree=Tools({children:content,initialOpen:true});assert.equal(tree.props.open,true,'Together shortcuts can expand tools');tree.props.onToggle({currentTarget:{open:false}});assert.equal(Tools({children:content,initialOpen:true}).props.open,false,'shortcut-opened tools can still close');

const circle={id:'test-circle',title:'A long circle title that should not crowd the message viewport',membership:'accepted',status:'open',role:'host',tags:[],activity:'Choose an activity together.',description:'Read and talk together.'};
globalThis.__circleLayoutHooks={useState(initial){const i=index++;return [i===0?[circle]:i===1?circle:initial,()=>{}];},useRef:initial=>({current:initial}),useEffect(){},useLayoutEffect(){},useCallback:fn=>fn};
let source=readFileSync('app/circles.tsx','utf8').replace(/^import (.+) from '[^']+';$/gm,(_,bindings)=>{
 if(bindings.startsWith('type '))return '';
 const names=bindings.startsWith('{')?bindings.slice(1,-1).split(',').map(s=>s.trim()).filter(s=>!s.startsWith('type ')):[bindings];
 return names.map(name=>{
  if(name in globalThis.__circleLayoutHooks)return `const ${name}=globalThis.__circleLayoutHooks.${name};`;
  if(name==='LatestRequest')return 'class LatestRequest{begin(){return 1;}current(){return true;}cancel(){}}';
  if(name==='useTabDraft')return 'const useTabDraft=()=>["",()=>{}];';
  return `const ${name}=()=>[];`;
 }).join('\n');
});
const {default:Circles}=await import(compile(source));
function elements(node){if(!node||typeof node!=='object')return [];return [node,...React.Children.toArray(node.props?.children).flatMap(elements)];}
index=0;tree=Circles({accountId:'member',active:true,connections:[],onReport:()=>{}});
const nodes=elements(tree),context=nodes.find(n=>n.props?.className==='chat-context-area');
const contextChildren=React.Children.toArray(context.props.children);
assert.equal(contextChildren.length,3,'compact header, hidden More tools and local section navigation');
const [heading,more,sections]=contextChildren;
assert.equal(more.props.hidden,true,'rare tools do not consume the default message viewport');
assert.equal(more.props.className,'circle-more-panel');
assert.equal(elements(heading).find(n=>n.type==='h1').props.title,circle.title,'full title remains accessible');
assert(!elements(heading).some(n=>n.type==='button'&&n.props.children==='Leave circle'));
assert(elements(more).some(n=>n.props?.circle?.id===circle.id),'management remains scoped to this circle');
assert(elements(more).some(n=>n.props?.className==='message-search'),'search remains in More');
assert(!elements(more).some(n=>n.props?.className==='messages conversation-messages'),'transcript stays outside More');
assert.equal(sections.props.value,'Chat');
const panels=nodes.filter(n=>n.props?.role==='tabpanel');
assert.equal(panels.length,3);
assert.equal(panels.find(n=>n.props.id.includes('-Chat-')).props.hidden,false);
assert.equal(panels.find(n=>n.props.id.includes('-People-')).props.hidden,true);
assert.equal(panels.find(n=>n.props.id.includes('-Together-')).props.hidden,true);
assert(nodes.some(n=>n.props?.className==='circle-activity-strip'),'next activity remains available from Chat');
assert(source.includes("if(!chatVisible.current||!scope"),'hidden transcript cannot acknowledge incoming messages');
assert(source.includes("selectCircleView('Chat');nearBottom.current=false"),'opening search results reveals Chat');
for(const initialView of ['Together','People']){index=0;const restored=elements(Circles({accountId:'member',active:true,connections:[],initialCircle:circle.id,initialView,onReport:()=>{}}));assert.equal(restored.find(n=>n.props?.id==='circle-panel-'+initialView+'-'+circle.id).props.hidden,false,'explicit section route seeds the visible panel on remount');}
console.log('Circle workspace preserves tools, next activity, management and mounted chat while separating Together and People.');

// Arrow navigation activates and focuses the matching tab; controls reference real panels.
let sectionSource=readFileSync('app/circle-sections.tsx','utf8').replace(/^import .* from 'lucide-react';$/m,'const MessageCircle=()=>null,Users=()=>null,UserRound=()=>null;');
const {default:Sections}=await import(compile(sectionSource));
let selectedView='Chat',focused=-1,prevented=false;
const tabs=React.Children.toArray(Sections({circleId:circle.id,value:selectedView,onChange:value=>selectedView=value}).props.children);
assert.equal(tabs.filter(tab=>tab.props.tabIndex===0).length,1);
assert.deepEqual(tabs.map(tab=>React.Children.toArray(tab.props.children).find(n=>n.type==='span').props.children),['Chat','Plans','Members'],'visible labels describe familiar circle destinations while internal IDs remain compatible');
assert.equal(tabs[0].props['aria-controls'],'circle-panel-Chat-'+circle.id);
tabs[0].props.onKeyDown({key:'ArrowLeft',preventDefault(){prevented=true;},currentTarget:{parentElement:{querySelectorAll:()=>tabs.map((_,i)=>({focus(){focused=i;}}))}}});
assert.equal(selectedView,'People');assert.equal(focused,2);assert(prevented);
tabs[1].props.onClick();assert.equal(selectedView,'Together');
console.log('Circle sections support pointer activation, arrow-key wrapping, focus and linked tab panels.');

const lockedTabs=React.Children.toArray(Sections({circleId:circle.id,value:'Chat',onChange:()=>{throw Error('Recording navigation must stay in Chat');},disabled:true}).props.children);
assert(lockedTabs.every(tab=>tab.props.disabled),'active media cannot be hidden by local tab navigation');
lockedTabs[0].props.onKeyDown({key:'ArrowRight'});
