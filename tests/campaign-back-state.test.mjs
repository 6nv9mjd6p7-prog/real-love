import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import React from 'react';
import ts from 'typescript';
const require=createRequire(import.meta.url);
const compile=text=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(text,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText.replace('from "react/jsx-runtime"',`from '${pathToFileURL(require.resolve('react/jsx-runtime')).href}'`)).toString('base64');
const native=await import(compile(readFileSync('app/native-links.ts','utf8')));
const text=readFileSync('app/collective-action.tsx','utf8'),source=ts.createSourceFile('campaign.tsx',text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const app=source.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='CollectiveAction');
const statements=[];for(const node of app.body.statements){statements.push(node.getText(source));if(ts.isExpressionStatement(node)&&node.expression.expression?.getText(source)==='useEffect')break;}
let back;function visit(node){if(ts.isJsxElement(node)&&node.openingElement.attributes.properties.some(p=>p.name?.getText(source)==='className'&&p.initializer?.text==='secondary workflow-back'))back=node.getText(source);ts.forEachChild(node,visit);}visit(app);assert(back);
const dependencies=['useCallback','useState','useRef','useEffect','window','appBackDestination','backWithinApp','routeBackLabel','readCampaignView','readDraft','tabStorage','draftKey'];
const {default:view}=await import(compile(`export default function renderCampaign({accountId},{${dependencies.join(',')}}){const empty={};${statements.join('\n')}return ${back};}`));
function harness(){const slots=[];let index,pending=[];
 const hooks={useCallback:fn=>fn,useState(initial){const i=index++;if(!(i in slots))slots[i]=initial;return [slots[i],next=>slots[i]=typeof next==='function'?next(slots[i]):next];},useRef(initial){const i=index++;return slots[i]??(slots[i]={current:initial});},useEffect(fn,deps){const i=index++,old=slots[i];if(!old||deps.some((value,j)=>!Object.is(value,old.deps[j]))){slots[i]={deps,cleanup:old?.cleanup};pending.push(()=>{slots[i].cleanup?.();slots[i].cleanup=fn();});}}};
 return {render(props,deps){index=0;return view(props,{...deps,...hooks});},commit(){const tasks=pending;pending=[];tasks.forEach(fn=>fn());},dispose(){slots.forEach(slot=>slot?.cleanup?.());}};
}
const originalHistory=Object.getOwnPropertyDescriptor(globalThis,'history');
const history={state:{realLoveNavigation:{account:'a',parent:'circles/work'}}};Object.defineProperty(globalThis,'history',{value:history,configurable:true});
const listeners=new Set(),returned=[],captured=[];let depth=0;
const deps={window:{location:{hash:'#circles/action'},addEventListener(type,fn){assert.equal(type,'popstate');listeners.add(fn);},removeEventListener(_type,fn){listeners.delete(fn);}},appBackDestination:(fallback,account)=>{captured.push(account);return native.appBackDestination(fallback,account);},backWithinApp:(...args)=>returned.push(args),routeBackLabel:native.routeBackLabel,readCampaignView:()=>({tab:'Explore',selected:'',compose:false,scroll:0,depth}),readDraft:()=>null,tabStorage:()=>null,draftKey:(account,kind)=>account+':'+kind};
const label=button=>React.Children.toArray(button.props.children).join('');let appView=harness();
try{
 let button=appView.render({accountId:'a'},deps);assert.equal(label(button),'← Back to Circles');assert.equal(captured.length,0,'initial render does not inspect browser history');
 appView.commit();button=appView.render({accountId:'a'},deps);assert.equal(label(button),'← Back to Worker Support');assert.equal(listeners.size,1);
 depth=2;history.state.realLoveNavigation.parent='notifications';button=appView.render({accountId:'a'},deps);appView.commit();assert.equal(captured.length,1,'internal views preserve the captured area');assert.equal(label(button),'← Back to Worker Support');button.props.onClick();assert.deepEqual(returned.at(-1),['circles/work','a',3],'Back skips the current number of campaign entries');
 appView.dispose();assert.equal(listeners.size,0);
 // LoveApp mounts campaigns with an account key, so another account starts fresh.
 history.state.realLoveNavigation={account:'b',parent:'notifications'};appView=harness();button=appView.render({accountId:'b'},deps);assert.equal(label(button),'← Back to Circles');appView.commit();button=appView.render({accountId:'b'},deps);assert.equal(label(button),'← Back to Notifications');button.props.onClick();assert.deepEqual(returned.at(-1),['notifications','b',3]);appView.dispose();
 history.state.realLoveNavigation={account:'other',parent:'saved'};appView=harness();appView.render({accountId:'b'},deps);appView.commit();button=appView.render({accountId:'b'},deps);assert.equal(label(button),'← Back to Circles','foreign-account history uses the fallback');
}finally{appView.dispose();if(originalHistory)Object.defineProperty(globalThis,'history',originalHistory);else delete globalThis.history;}
console.log('Campaign Back labels and actions share the captured account-scoped destination, retain campaign depth, and clean up listeners.');
