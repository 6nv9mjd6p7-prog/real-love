import ts from 'typescript';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url);
function compile(s){const js=ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}}).outputText.replace(/from ["']react\/jsx-runtime["']/,`from '${pathToFileURL(require.resolve('react/jsx-runtime')).href}'`);return 'data:text/javascript;base64,'+Buffer.from(js).toString('base64');}
const workerRules=compile(readFileSync('app/worker-rules.tsx','utf8'));
const helper=compile(readFileSync('app/circle-experience.ts','utf8'));const source=readFileSync('app/circle-card.tsx','utf8').replace("from './worker-rules'",`from '${workerRules}'`).replace("from './circle-experience'",`from '${helper}'`).replace("from 'lucide-react'",`from '${pathToFileURL(require.resolve('lucide-react')).href}'`);
const {default:Card}=await import(compile(source));const noop=()=>{};const base={id:'test',title:'History',description:'Read together',tags:['History'],activity:'Read on Sunday',status:'open',membership:null,role:null,canApprove:false,count:2};
const render=(circle=base,reviewing=false)=>renderToStaticMarkup(React.createElement(Card,{circle,active:true,busy:false,reviewing,onReview:noop,onCancelReview:noop,onAct:noop,onOpen:noop,onTogether:noop,onReviewRequests:noop,onSearch:noop,onReport:noop,onLeave:noop}));
assert(render().includes('Review joining'));assert(!render().includes('Send join request'),'request is not sent before reviewing disclosure');const review=render(base,true);assert(review.includes('shares your chosen name'));assert(review.includes('from when you join'));assert(review.includes('does not share your full profile or photos'));assert(review.includes('Send join request'));
const proposal={...base,status:'pending',membership:'accepted',role:'host',awaitingYourAgreement:true};const approval=render(proposal,true);assert(approval.includes('Agree &amp; open circle'));assert(approval.includes('Either host can approve'));assert(approval.includes('Private proposal'));
const requested=render({...base,membership:'requested'});assert(requested.includes('Withdraw request'));assert(!requested.includes('Open circle'));const host=render({...base,membership:'accepted',role:'host',joinRequests:2});assert(host.includes('Review 2 join'));assert(host.includes('Leave circle'));assert(!render({...base,membership:'accepted',role:'member'},true).includes('Send join request'),'stale review cannot ask an existing member to request again');assert(!render({...base,membership:'removed'},true).includes('Send join request'));
const guidelines={...base,membershipRules:'Stay curious, respect boundaries, and ask before giving advice.'};assert(render(guidelines).includes('Circle guidelines'));assert(render(guidelines,true).includes('Stay curious, respect boundaries, and ask before giving advice.'),'guidelines are visible before a join request is sent');
console.log('Circle joining disclosures, agreement actions, host review, and withdrawal labels passed');

const worker=render({...base,category:'worker_industry',membershipRules:'For local industry workers; hosts review each request.'},true);
for(const label of ['Industry worker circle','Membership rules','hosts review each request','not professional advice or formal union representation','No protection from retaliation','not an anonymous or confidential organizing space'])assert(worker.includes(label),label);

const organizingApproval=render({...proposal,category:'worker_organizing'},true);
assert(organizingApproval.includes('named recipients of current invitations'));
assert(organizingApproval.includes('privately invite accepted connections'));
assert(!organizingApproval.includes('Agreeing makes this title'),'unlisted founder consent does not promise discovery');

assert(render({...base,membership:"accepted"}).includes(">Together</button>"));
for(const c of [base,proposal,{...base,membership:"accepted",restricted:true}])assert(!render(c).includes(">Together</button>"));
