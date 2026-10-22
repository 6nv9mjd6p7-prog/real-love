import ts from 'typescript';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import React from 'react';
const require=createRequire(import.meta.url);
const url=name=>pathToFileURL(require.resolve(name)).href;
const compile=s=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}}).outputText.replace(/from ["']react\/jsx-runtime["']/g,`from '${url('react/jsx-runtime')}'`)).toString('base64');
const location=compile(readFileSync('app/location.ts','utf8'));
let state=[],index=0,ids=0,dirty=false,replaceResults;
globalThis.__loc={useState:x=>{const i=index++;if(!(i in state))state[i]=x;const setter=next=>{const value=typeof next==='function'?next(state[i]):next;if(!Object.is(value,state[i])){state[i]=value;dirty=true;}};if(x===globalThis.__places&&!replaceResults)replaceResults=setter;return [state[i],setter];},useRef:x=>{const i=index++;return state[i]??(state[i]={current:x});},useId:()=>`place-${ids++}`};
const fake="const {useState,useRef,useId}=globalThis.__loc;const useEffect=()=>{},useLayoutEffect=()=>{};";
const places=[{city:'Austin',region:'Texas',country:'United States',areaLat:30.26,areaLon:-97.74,locationPlaceId:'austin',locationSelectionToken:'token-austin'},{city:'Austin',region:'Minnesota',country:'United States',areaLat:43.66,areaLon:-92.97,locationPlaceId:'austin-mn',locationSelectionToken:'token-austin-mn'}];
globalThis.__places=places;
const source=readFileSync('app/location-editor.tsx','utf8').replace("import {useEffect,useId,useRef,useState,useLayoutEffect} from 'react';",fake).replace("from './location'",`from '${location}'`).replace('useState<LocationSuggestion[]>([])','useState(globalThis.__places)');
const {default:Editor}=await import(compile(source));
function nodes(n){return !n||typeof n!=='object'?[]:[n,...React.Children.toArray(n.props?.children).flatMap(nodes)];}
let form={city:'',region:'',country:''};
const props={accountId:'member',form,setForm:update=>{form=typeof update==='function'?update(form):update;},me:null,busy:false};
function render(){for(let pass=0;pass<10;pass++){index=0;ids=0;dirty=false;const result=nodes(Editor({...props,form}));if(!dirty)return result;}throw Error('Render resets did not settle');}
const input=()=>render().find(n=>n.props.role==='combobox');
const press=key=>input().props.onKeyDown({key,preventDefault(){}});
input().props.onChange({target:{value:'Austin'}});
press('ArrowDown');assert.equal(input().props['aria-activedescendant'],'place-1-0');
press('ArrowDown');assert.equal(input().props['aria-activedescendant'],'place-1-1');
press('ArrowUp');assert.equal(input().props['aria-activedescendant'],'place-1-0');
assert(render().find(n=>n.props.role==='option'&&n.props['aria-selected']).props.id==='place-1-0');
press('Escape');assert.equal(input().props['aria-expanded'],false);assert(!render().some(n=>n.props.role==='listbox'));
press('ArrowUp');assert.equal(input().props['aria-activedescendant'],'place-1-1');
// An unchanged render preserves Escape; a fresh result page reopens the list
// without carrying a keyboard index into a different suggestion.
press('Escape');assert.equal(input().props['aria-expanded'],false);
replaceResults([...places]);assert.equal(input().props['aria-expanded'],true);assert.equal(input().props['aria-activedescendant'],undefined);
press('ArrowUp');assert.equal(input().props['aria-activedescendant'],'place-1-1');
press('Enter');assert.equal(form.locationPlaceId,'austin-mn');assert.equal(form.region,'Minnesota');assert.equal(input().props.value,'Austin, Minnesota, United States');
assert(!input().props['aria-expanded']);
input().props.onChange({target:{value:'Unfinished search'}});
form={...form};assert.equal(input().props.value,'Unfinished search','refreshing the same selected area preserves manual search text');
replaceResults([...places]);press('ArrowDown');
form={city:'Chicago',region:'Illinois',country:'United States'};
assert.equal(input().props.value,'Chicago, Illinois, United States','an external selected-area change resets the displayed query before effects');
assert.equal(input().props['aria-expanded'],false,'the previous area suggestions are cleared');assert.equal(input().props['aria-activedescendant'],undefined);
assert.equal(form.city,'Chicago','resetting the search never selects or mutates an area');
delete globalThis.__loc;delete globalThis.__places;
console.log('Location arrow navigation, selected option, Escape, Enter, and structured place selection passed.');
