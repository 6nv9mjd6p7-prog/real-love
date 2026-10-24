import ts from 'typescript';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url);
const compile=s=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}}).outputText).toString('base64');
const modelUrl=compile(readFileSync('app/model.ts','utf8'));
const {examples,profileHasInterest}=await import(modelUrl);
const contextSource=readFileSync('app/connection-context.tsx','utf8').replace("from './model'",`from '${modelUrl}'`).replace("from 'lucide-react'",`from '${pathToFileURL(require.resolve('lucide-react')).href}'`);
const contextJs=ts.transpileModule(contextSource,{compilerOptions:{module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}}).outputText.replace(/from ["']react\/jsx-runtime["']/,`from '${pathToFileURL(require.resolve('react/jsx-runtime')).href}'`);
const contextUrl='data:text/javascript;base64,'+Buffer.from(contextJs).toString('base64');
const moduleSource=readFileSync('app/profile-view.tsx','utf8').replace("from './model'",`from '${modelUrl}'`).replace("from './connection-context'",`from '${contextUrl}'`).replace("from 'lucide-react'",`from '${pathToFileURL(require.resolve('lucide-react')).href}'`);
const js=ts.transpileModule(moduleSource,{compilerOptions:{module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}}).outputText.replace(/from ["']react\/jsx-runtime["']/,`from '${pathToFileURL(require.resolve('react/jsx-runtime')).href}'`);
const {default:View}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const {default:ConnectionContext}=await import(contextUrl);
const html=renderToStaticMarkup(React.createElement(View,{person:examples[1],onInterest:()=>{}}));
assert(html.includes('Explore people interested in Systems thinking'),'interest actions expose descriptive names');
assert(html.includes('Ideas &amp; curiosity')&&html.includes('Growth &amp; how I relate'),'answers are separated by recognizable groups');
assert(html.indexOf('Ideas &amp; curiosity')<html.indexOf('Optional things I’d enjoy doing'),'ideas and curiosity precede optional practical connection details');
const ordered=renderToStaticMarkup(React.createElement(View,{person:{...examples[1],communication:['Ask before giving advice.'],firstStep:'Read together.'},me:{...examples[1],id:'viewer'},onInterest:()=>{},onAnswer:()=>{}}));
const order=['Interests','A little about me','Ideas &amp; curiosity','How I communicate','What you share &amp; what to discuss','Optional things I’d enjoy doing'].map(text=>ordered.indexOf(text));
assert(order.every(index=>index>=0)&&order.every((index,i)=>i===0||order[i-1]<index),'profile order leads from interests and introduction into ideas before communication, context, and activities');
const preview=renderToStaticMarkup(React.createElement(View,{person:examples[1]}));
assert(!preview.includes('<button'),'own profile preview labels do not pretend to be actions');
assert(profileHasInterest({...examples[1],interests:['  Custom topic  '],topics:[]},'custom TOPIC'),'custom interest action filters normalize case and spacing');
assert(!profileHasInterest({...examples[1],interests:['Cooking'],topics:[],about:'I used to study history.'},'History'),'interest browsing matches selected topics rather than incidental bio text');
assert(profileHasInterest({...examples[1],interests:['History'],topics:[]},'History & culture'),'broad area browsing includes its topics');
console.log('Profile grouping, interaction cues, and topic browsing checks passed');

const compared=renderToStaticMarkup(React.createElement(View,{person:examples[1],me:{...examples[1],id:'other',city:' Austin ',interests:['Systems thinking']},onInterest:()=>{}}));assert(compared.includes('Exact shared interests'));assert(compared.includes('Same general area: Austin'));assert(compared.includes('self-reported preferences'));assert(compared.includes('shared-interest-label'));assert(!compared.includes('match percentage'));
const contextMarkup=renderToStaticMarkup(React.createElement(ConnectionContext,{me:{...examples[1],id:'viewer'},person:{...examples[1],id:'member',question:'How do communities build trust?',perspective:'Care grows through dependable action.'}}));
const contextOrder=['Exact shared interests','Ideas they shared','Location &amp; online connection','Activities in common'].map(text=>contextMarkup.indexOf(text));
assert(contextOrder.every(index=>index>=0)&&contextOrder.every((index,i)=>i===0||contextOrder[i-1]<index),'shared interests and member ideas lead location and activities');
assert(contextMarkup.includes('How do communities build trust?')&&contextMarkup.includes('Care grows through dependable action.'),'the profile answers remain in the member’s own words');

const actionable=renderToStaticMarkup(React.createElement(View,{person:examples[1],onAnswer:()=>{}}));assert(actionable.includes('Ask about this introduction'));assert(actionable.includes('Ask about doing this together'));

const selfDescribed=renderToStaticMarkup(React.createElement(View,{person:{...examples[1],gender:'Self-described',genderDescription:'Genderfluid',background:'Yoruba'}}));assert(selfDescribed.includes('Gender: Genderfluid'));assert(selfDescribed.includes('Race or cultural background: Yoruba'));assert(selfDescribed.includes(String(examples[1].age)));const withheld=renderToStaticMarkup(React.createElement(View,{person:{...examples[1],gender:'Prefer not to say',genderDescription:'Hidden description',background:''}}));assert(withheld.includes('Gender not shared'));assert(!withheld.includes('Hidden description'));assert(!withheld.includes('Race or cultural background:'));
const confirmedArea=renderToStaticMarkup(React.createElement(View,{person:{...examples[1],locationConfirmed:true}}));assert(confirmedArea.includes('Austin, Texas, United States'));assert(confirmedArea.includes('Area confirmed recently'));assert(confirmedArea.includes('does not verify identity, residence, or exact location'));
const relatedContext=renderToStaticMarkup(React.createElement(ConnectionContext,{compact:true,me:{...examples[1],id:'me',interests:['History & culture'],topics:[]},person:{...examples[1],id:'them',interests:['Wigs & beauty history'],topics:[]}}));assert(relatedContext.includes('History &amp; culture: you chose History &amp; culture; they chose Wigs &amp; beauty history'),'related matches name both people’s actual selected interests');assert(!relatedContext.includes('compatibility score'),'related interests are not presented as a compatibility rating');

function elements(node){if(!node||typeof node!=='object')return [];return [node,...React.Children.toArray(node.props?.children).flatMap(elements)];}
const compactTree=View({person:{...examples[1],communication:['Ask before giving advice.'],communicationNote:'Direct questions help.'},onAnswer:()=>{}}),compactNodes=elements(compactTree);
const communication=compactNodes.find(n=>n.type==='details'&&n.props.className==='profile-panel profile-communication');assert(communication&&!communication.props.open,'communication remains accessible in a labelled collapsed section');
assert(renderToStaticMarkup(communication).includes('Direct questions help.'));
assert(compactNodes.some(n=>n.type==='button'&&n.props.children==='Ask about this introduction'),'the primary introduction action stays visible');
const comparison=ConnectionContext({me:{...examples[1],id:'me'},person:examples[1]});assert.equal(comparison.type,'details');assert(!comparison.props.open);assert(renderToStaticMarkup(comparison).includes('Exact shared interests'));
const sparseTree=View({person:{...examples[1],firstStep:'Read together.',participation:[],startRole:'',availability:'',availabilityChoices:[],activities:[]}});
assert(!elements(sparseTree).some(n=>n.props?.className==='profile-inline-details'),'sparse profiles do not create empty detail controls');

const discoveryContext=ConnectionContext({compact:true,me:{...examples[1],id:'me'},person:examples[1]});
assert.equal(discoveryContext.type,'details');assert(!discoveryContext.props.open,'supporting discovery context starts collapsed');
assert(renderToStaticMarkup(discoveryContext).includes('<summary><strong>'),'the shared-interest reason stays visible in the disclosure summary');
const sharedPreview=ConnectionContext({compact:true,me:{...examples[1],id:'me',interests:['Systems thinking'],topics:[]},person:{...examples[1],interests:['Systems thinking'],topics:[]}});
const visibleSummary=elements(sharedPreview).find(n=>n.type==='summary');
const compactSharedMarkup=renderToStaticMarkup(sharedPreview);
assert(renderToStaticMarkup(visibleSummary).includes('1 shared interest'),'the compact card keeps the shared-interest count visible');
assert(!renderToStaticMarkup(visibleSummary).includes('Systems thinking'),'the compact summary avoids repeating tags already shown on the card');
assert(compactSharedMarkup.includes('Systems thinking'),'the complete overlap remains available when expanded');

const privateNeurotype=renderToStaticMarkup(React.createElement(View,{person:{...examples[0],shareNeurotype:false}}));
assert(!privateNeurotype.includes('Autistic'),'profile views hide neurotype when sharing is off');
const sharedNeurotype=renderToStaticMarkup(React.createElement(View,{person:examples[0]}));
assert(sharedNeurotype.includes('Autistic')&&sharedNeurotype.includes('How I communicate'),'the same example shows optional neurotype and personal communication preferences');
assert(examples.some(p=>p.shareNeurotype&&p.neurotypes?.includes('ADHD')));
assert(examples.some(p=>!p.shareNeurotype&&!p.neurotypes?.length&&p.communication?.length),'communication needs do not require a neurotype label');
const embedded=renderToStaticMarkup(React.createElement(View,{person:examples[0],embedded:true}));
assert(!embedded.includes('<h1>'),'the dialog keeps its own top heading');assert(embedded.includes('<h2>Amara, 28</h2>'));assert(embedded.includes('<h3 class="profile-section-title">'));
const blankAnswers=renderToStaticMarkup(React.createElement(View,{person:{...examples[0],care:'   ',question:'   ',startIdea:'',offer:'',support:'',perspective:''}}));assert(!blankAnswers.includes('Ideas &amp; curiosity'),'whitespace does not create empty answer panels');
const namedActions=renderToStaticMarkup(React.createElement(View,{person:examples[0],onAnswer:()=>{}}));assert(namedActions.includes('aria-label="Ask Amara about a question i carry"'),'repeated answer buttons have specific accessible names');
