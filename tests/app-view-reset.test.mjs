import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const text=readFileSync('app/love-app.tsx','utf8'),source=ts.createSourceFile('app.tsx',text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const app=source.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='LoveApp');
// Exercise the component's real state declarations and guards without running effects.
const stateNames=['circleUpdates','signupPhoto','signupPhotoPreview','photoError','viewAccount','invitationOpen','invitationView'];
const statements=app.body.statements.flatMap(node=>{
 if(ts.isVariableStatement(node)){
  const declarations=node.declarationList.declarations.filter(d=>ts.isArrayBindingPattern(d.name)&&stateNames.includes(d.name.elements[0].name?.text));
  return declarations.length?['const '+declarations.map(d=>d.getText(source)).join(',')+';']:[];
 }
 if(ts.isIfStatement(node)&&/^(viewAccount|invitationView\.)/.test(node.expression.getText(source)))return[node.getText(source)];
 return [];
});
const code=`const useState=(...args)=>globalThis.__appResetHooks.useState(...args);
export default function view({accountId,route,existing}){${statements.join('\n')}return {circleUpdates,setCircleUpdates,signupPhoto,setSignupPhoto,signupPhotoPreview,setSignupPhotoPreview,photoError,setPhotoError,invitationOpen,setInvitationOpen};}`;
const js=ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {default:view}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const slots=[];let index,dirty;
globalThis.__appResetHooks={useState(initial){const i=index++;if(!(i in slots))slots[i]=initial;return [slots[i],next=>{const value=typeof next==='function'?next(slots[i]):next;if(!Object.is(slots[i],value)){slots[i]=value;dirty=true;}}];}};
function render(props){for(let pass=0;pass<10;pass++){index=0;dirty=false;const result=view(props);if(!dirty)return result;}throw Error('State resets did not settle');}
let props={accountId:'a',route:'person/alice',existing:null},state=render(props);
assert.equal(state.circleUpdates,0);assert.equal(state.signupPhoto,null);assert.equal(state.invitationOpen,false);
const photo={name:'private.jpg'};
state.setCircleUpdates(7);state.setSignupPhoto(photo);state.setSignupPhotoPreview('blob:private');state.setPhotoError('Retry upload');state.setInvitationOpen(true);
state=render(props);
assert.equal(state.circleUpdates,7);assert.equal(state.signupPhoto,photo);assert.equal(state.photoError,'Retry upload');assert.equal(state.invitationOpen,true,'ordinary renders preserve an open invitation');
props={...props,route:'person/bob'};state=render(props);
assert.equal(state.invitationOpen,false,'changing destination closes the old invitation before effects');
assert.equal(state.signupPhoto,photo,'navigation preserves the unsaved photo selection');assert.equal(state.circleUpdates,7);
state.setInvitationOpen(true);props={...props,existing:{id:'connection'}};state=render(props);assert.equal(state.invitationOpen,false,'receiving a connection closes the invitation');
state.setInvitationOpen(true);state=render({...props,existing:{id:'connection',status:'accepted'}});assert.equal(state.invitationOpen,true,'refreshing the same connection does not reset local state');
props={...props,existing:{id:'replacement'}};state=render(props);assert.equal(state.invitationOpen,false,'a different connection resets the invitation');
state.setInvitationOpen(true);props={...props,accountId:'b'};state=render(props);
assert.equal(state.invitationOpen,false);assert.equal(state.circleUpdates,0);assert.equal(state.signupPhoto,null);assert.equal(state.signupPhotoPreview,'','another account cannot inherit the preview URL');assert.equal(state.photoError,'','another account cannot inherit photo errors');
state.setSignupPhoto(photo);state.setPhotoError('Another error');state.setCircleUpdates(2);state.setInvitationOpen(true);
props={...props,accountId:''};state=render(props);assert.equal(state.signupPhoto,null);assert.equal(state.photoError,'');assert.equal(state.circleUpdates,0);assert.equal(state.invitationOpen,false,'sign-out clears account-bound view state');
state=render({...props,accountId:'a'});assert.equal(state.signupPhoto,null,'returning to the first account never restores its old photo selection');
console.log('Account switches clear private photo selections and Circle counts; destination/connection changes close invitations before effects.');
