import ts from 'typescript';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const compile=source=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
const location=compile(readFileSync('app/location.ts','utf8'));
const source=readFileSync('app/location-search.ts','utf8').replace("from './location'",`from '${location}'`);
const {photonSuggestions,searchBroadLocations,reverseBroadLocation}=await import(compile(source));
const suggestions=photonSuggestions({features:[
 {geometry:{coordinates:[-97.7431,30.2672]},properties:{name:'Austin',state:'Texas',country:'United States',osm_type:'R',osm_id:113314}},
 {geometry:{coordinates:[-97.7432,30.2673]},properties:{name:'Austin',state:'Texas',country:'United States',osm_type:'N',osm_id:1}},
 {geometry:{coordinates:[103.8198,1.3521]},properties:{name:'Singapore',country:'Singapore',osm_type:'R',osm_id:536780}},
 {geometry:{coordinates:['bad',30]},properties:{name:'Broken',state:'Texas',country:'United States'}}
]});
assert.equal(suggestions.length,2,'invalid and duplicate results are removed');
assert.deepEqual(suggestions[0],{city:'Austin',region:'Texas',country:'United States',areaLat:30.2672,areaLon:-97.7431,locationPlaceId:'R/113314'});
assert.equal(suggestions[1].region,'Singapore','country is a safe region fallback for city-states');
assert.equal(suggestions[1].locationPlaceId,'R/536780');

const broadOnly=photonSuggestions({features:[
 {geometry:{coordinates:[-95.36,29.75]},properties:{name:'Main Street',state:'Texas',country:'United States',osm_key:'highway',osm_value:'residential',osm_type:'W',osm_id:1}},
 {geometry:{coordinates:[-95.36,29.76]},properties:{name:'Downtown',state:'Texas',country:'United States',osm_key:'place',osm_value:'neighbourhood',osm_type:'N',osm_id:2}}
]},true);
assert.equal(broadOnly.length,1,'unfiltered fallback keeps broad place features and rejects streets');
assert.equal(broadOnly[0].city,'Downtown');

const realFetch=globalThis.fetch;let calls=[];
globalThis.fetch=async url=>{calls.push(String(url));return Response.json({features:calls.length===1?[]:[{geometry:{coordinates:[-118.2437,34.0522]},properties:{name:'Los Angeles',state:'California',country:'United States',osm_key:'place',osm_value:'city',osm_type:'R',osm_id:207359}}]});};
const twoCharacter=await searchBroadLocations('LA');
assert.equal(twoCharacter[0].city,'Los Angeles','two-character searches can return validated places');
assert(calls[0].includes('layer=city')&&calls[0].includes('layer=district'),'first search uses broad-area layers');
assert(!calls[1].includes('layer=city'),'empty strict results retry through a guarded unfiltered search');

calls=[];globalThis.fetch=async url=>{calls.push(String(url));return Response.json({features:[{geometry:{coordinates:[-95.3698,29.7604]},properties:{name:'Houston',state:'Texas',country:'United States',osm_type:'R',osm_id:2688911}}]});};
const reversed=await reverseBroadLocation(29.76,-95.37);
assert.equal(reversed.city,'Houston');assert(calls[0].includes('/reverse?'),'browser-area lookup uses reverse geocoding');assert(calls[0].includes('layer=city'));
globalThis.fetch=realFetch;
console.log('Photon suggestions, guarded fallback search, short queries, and broad reverse lookup passed.');

const nearestSource=readFileSync('app/location-search.ts','utf8').replace("from './location'",`from '${location}'`);
const {reverseBroadLocations}=await import(compile(nearestSource));
globalThis.fetch=async()=>Response.json({features:[
 {geometry:{coordinates:[-95.37,29.76]},properties:{name:'Houston',state:'Texas',country:'United States',osm_type:'R',osm_id:1}},
 {geometry:{coordinates:[-97.7431,30.2672]},properties:{name:'Austin',state:'Texas',country:'United States',osm_type:'R',osm_id:2}}
]});
const nearby=await reverseBroadLocations(30.27,-97.74);assert.equal(nearby[0].city,'Austin','distance overrides provider prominence ordering');assert.equal(nearby.length,2,'let the member confirm among candidates');assert.equal(nearby[0].areaLon,-97.7431,'retain canonical place point');
// The HTTP response must not substitute the device coordinates for the selected area point.
let routeSource=readFileSync('app/api/location/route.ts','utf8').replace("import {getChatGPTUser} from '../../chatgpt-auth';","const getChatGPTUser=async()=>({userId:'member',email:'member@example.test'});").replace("import {initializeAccount,quota,readInput,safetyHeaders,failure} from '../../safety';","const initializeAccount=async()=>{},quota=async()=>{},readInput=req=>req.json(),safetyHeaders={'Cache-Control':'no-store'},failure=e=>Response.json({error:e.message},{status:503});").replace("from '../../location-search'",`from '${compile(nearestSource)}'`);
const locationApi=await import(compile(routeSource));
let response=await locationApi.POST(new Request('https://rl.test/api/location',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'reverse',lat:30.271234,lon:-97.741234,expectedAccount:'member'})}));
assert.equal(response.status,200);const payload=await response.json();assert.equal(payload.suggestions.length,2);assert.equal(payload.suggestion.areaLat,30.2672);assert.notEqual(payload.suggestion.areaLat,30.27,'do not store the rounded device position');
response=await locationApi.POST(new Request('https://rl.test/api/location',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'reverse',lat:91,lon:0,expectedAccount:'member'})}));assert.equal(response.status,400);
globalThis.fetch=realFetch;
