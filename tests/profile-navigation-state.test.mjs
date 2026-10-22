import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const compile=source=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
const text=readFileSync('app/love-app.tsx','utf8'),source=ts.createSourceFile('app.tsx',text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
let app;ts.forEachChild(source,node=>{if(ts.isFunctionDeclaration(node)&&node.name?.text==='LoveApp')app=node;});
const handler=name=>app.body.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name.text===name).getText(source);
let label;function visit(node){if(ts.isCallExpression(node)&&node.expression.getText(source)==='routeBackLabel'&&node.getText(source).includes('profileOrigins'))label=node.getText(source);ts.forEachChild(node,visit);}visit(app);assert(label);
const dependencies=['route','routeNames','profileOrigins','setProfileOrigins','currentRoute','scrollPositions','returnScroll','accountId','selected','setInboxTab','backWithinApp','appBackDestination','routeBackLabel'];
const {default:create}=await import(compile(`export default function create({${dependencies.join(',')}}){${handler('nav')} ${handler('backFromProfile')} return {nav,backFromProfile,label:()=>${label}};}`));
const {routeBackLabel}=await import(compile(readFileSync('app/native-links.ts','utf8')));
const originalWindow=Object.getOwnPropertyDescriptor(globalThis,'window');
let origins=new Map(),pending=[],returned=[],inbox=[],events=[];
const browser={scrollY:240,location:{hash:'#saved'},dispatchEvent:event=>events.push(event.type),scrollTo:position=>events.push(position)};
Object.defineProperty(globalThis,'window',{value:browser,configurable:true});
const context={route:'saved',routeNames:{Saved:'saved',Chats:'conversations'},profileOrigins:origins,setProfileOrigins:update=>pending.push(update),currentRoute:{current:'saved'},scrollPositions:{current:new Map()},returnScroll:{current:null},accountId:'member',selected:null,setInboxTab:tab=>inbox.push(tab),backWithinApp:(route,account)=>returned.push({route,account}),appBackDestination:fallback=>fallback,routeBackLabel};
try{
 create(context).nav('person/alice');
 assert.equal(browser.location.hash,'person/alice');assert.equal(context.scrollPositions.current.get('saved'),240);assert.deepEqual(events,['real-love-engaged']);
 // React may apply the state updater later; origin coordinates must already be captured.
 context.currentRoute.current='person/alice';browser.scrollY=0;
 for(const update of pending)origins=update(origins);pending=[];
 const profile=create({...context,route:'person/alice',profileOrigins:origins,selected:{demo:false}});
 assert.equal(profile.label(),'Saved');profile.backFromProfile();
 assert.deepEqual(returned.at(-1),{route:'saved',account:'member'});assert.equal(context.returnScroll.current,240);
 assert.equal(context.profileOrigins.size,0,'recording navigation does not mutate the previous rendered map');
 const before=origins;create({...context,route:'person/alice',profileOrigins:origins}).nav('person/bob');assert.equal(pending.length,0,'profile-to-profile navigation preserves the existing origin rules');assert.equal(origins,before);
 const direct=create({...context,route:'person/direct',profileOrigins:origins,selected:{demo:false}});assert.equal(direct.label(),'Discover');direct.backFromProfile();assert.equal(returned.at(-1).route,'discover');assert.equal(context.returnScroll.current,null);
 create({...context,route:'person/example',profileOrigins:origins,selected:{demo:true}}).backFromProfile();assert.equal(returned.at(-1).route,'examples');
 create({...context,route:'saved',profileOrigins:origins}).nav('Chats');assert.equal(browser.location.hash,'conversations');assert.equal(inbox.at(-1),'Chats');
}finally{if(originalWindow)Object.defineProperty(globalThis,'window',originalWindow);else delete globalThis.window;}
console.log('Profile navigation keeps Back labels, captured scroll, demo/direct fallbacks, and immutable origin state.');
