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
