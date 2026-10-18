import ts from 'typescript';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url);
function compile(s){const js=ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText.replace(/from ["']react\/jsx-runtime["']/,`from '${pathToFileURL(require.resolve('react/jsx-runtime')).href}'`).replace(/from ["']lucide-react["']/,`from '${pathToFileURL(require.resolve('lucide-react')).href}'`).replace(/from ["']react-dom["']/,`from '${pathToFileURL(require.resolve('react-dom')).href}'`).replace(/from ["']react["']/,`from '${pathToFileURL(require.resolve('react')).href}'`);return 'data:text/javascript;base64,'+Buffer.from(js).toString('base64');}
const suggestionsUrl=compile(readFileSync('app/conversation-suggestions.ts','utf8'));
const ideasUrl=compile(readFileSync('app/conversation-ideas.tsx','utf8').replace("from './conversation-suggestions'",`from '${suggestionsUrl}'`));
const modelUrl=compile(readFileSync('app/model.ts','utf8'));const {examples}=await import(modelUrl);
const toolsUrl=compile(readFileSync('app/conversation-tools.ts','utf8').replace("from './model'",`from '${modelUrl}'`));
const photoUrl=compile(readFileSync('app/interactive-photo.tsx','utf8'));const chatToolsUrl=compile(readFileSync('app/chat-tools.ts','utf8'));const bubbleUrl=compile(readFileSync('app/chat-bubble.tsx','utf8').replace("from './chat-tools'",`from '${chatToolsUrl}'`).replace("from './interactive-photo'",`from '${photoUrl}'`));
const rowUrl=compile(readFileSync('app/circle-message.tsx','utf8').replace("from './chat-bubble'",`from '${bubbleUrl}'`));
const deliveryUrl=compile(readFileSync('app/message-delivery.ts','utf8'));
const toggleUrl=compile(readFileSync('app/notification-toggle.tsx','utf8'));const mergeUrl=compile(readFileSync('app/merge-history.ts','utf8'));
const avatarUrl=compile(readFileSync('app/shared-avatar.tsx','utf8').replace("from './interactive-photo'",`from '${photoUrl}'`));
const draftUrl=compile(readFileSync('app/draft-storage.ts','utf8'));
const recorderUrl=compile(readFileSync('app/voice-recorder.tsx','utf8'));
const viewportUrl=compile(readFileSync('app/chat-viewport.ts','utf8'));
const composerUrl=compile(readFileSync('app/chat-composer.tsx','utf8').replace("from './voice-recorder'",`from '${recorderUrl}'`).replace("from './chat-viewport'",`from '${viewportUrl}'`));
const source=readFileSync('app/conversation.tsx','utf8').replace("from './conversation-ideas'",`from '${ideasUrl}'`).replace("from './notification-toggle'",`from '${toggleUrl}'`).replace("from './merge-history'",`from '${mergeUrl}'`).replace("from './interactive-photo'",`from '${photoUrl}'`).replace("from './chat-composer'",`from '${composerUrl}'`).replace("from './circle-message'",`from '${rowUrl}'`).replace("from './chat-tools'",`from '${chatToolsUrl}'`).replace("import {useTabDraft} from './use-tab-draft';", "const useTabDraft=()=>['Unfinished thought',()=>{}];").replace("from './shared-avatar'",`from '${avatarUrl}'`).replace("from './draft-storage'",`from '${draftUrl}'`).replace("from './message-delivery'",`from '${deliveryUrl}'`).replace("from './conversation-tools'",`from '${toolsUrl}'`);
const {default:View}=await import(compile(source));const noop=()=>{};
const html=renderToStaticMarkup(React.createElement(View,{accountId:'test',me:examples[1],connection:{id:'test',person:{...examples[1],communication:['Ask before giving advice.'],communicationNote:'Please ask directly.'},proposal:'An opening',context:{label:'Introduction',text:'Public context'},photoMine:false,photosShared:false},api:noop,onBack:noop,onProfile:noop,onReport:noop,onBlock:noop,onClose:noop,onPhoto:noop,onCircle:noop,onRead:noop}));
assert(html.includes('View profile'));assert(html.includes('Opening invitation'));assert(html.includes('role="log"'));assert(html.includes('aria-label="Conversation with'));assert(html.includes('Message to'));assert(html.includes('Unfinished thought'));assert(html.includes('Add to draft'));assert(html.includes('it does not mean read'));assert(!html.includes('conversation-photo'),'private photos remain absent until consent');assert(html.includes('Loading conversation'),'initial fetching is distinguished from an empty thread');
assert(html.includes('Help &amp; privacy')&&html.includes('Privacy &amp; message history')&&html.includes('not end-to-end encrypted'),'direct-chat privacy stays explicit inside one secondary help disclosure');
const circleSource=readFileSync('app/circles.tsx','utf8');assert(circleSource.includes('Who can see these messages?')&&circleSource.includes('Chats and voice notes are not end-to-end encrypted'),'circle-chat privacy boundary is disclosed inside the conversation');assert(circleSource.includes('Search this circle')&&circleSource.includes('history available to you'),'circle search is scoped and its history limit is clear');
assert(html.includes('Search this chat'));assert(html.includes('Find a word or phrase'),'history search remains collapsed until needed and its input is labeled');
assert(html.indexOf('Conversation details')<html.indexOf('Search this chat')&&html.indexOf('Search this chat')<html.indexOf('role="log"'),'chat search lives with secondary conversation details instead of interrupting the message flow');
assert(html.includes('Start voice recording'));assert(html.includes('Send message'));assert(html.includes('class="chat-composer"'));
console.log('Conversation labels, privacy, prompt actions, and initial loading render passed');

const {default:Avatar}=await import(avatarUrl);
const person={id:'private-person',name:'Friend',hasPhoto:true};
const privateAvatar=renderToStaticMarkup(React.createElement(Avatar,{person,shared:false}));assert(!privateAvatar.includes('/api/photo'));
const pendingAvatar=renderToStaticMarkup(React.createElement(Avatar,{person:{...person,hasPhoto:false},shared:true}));assert(!pendingAvatar.includes('/api/photo'));
const sharedAvatar=renderToStaticMarkup(React.createElement(Avatar,{person,shared:true}));assert(sharedAvatar.includes('/api/photo?member=private-person'));assert(sharedAvatar.includes('shared profile photo'));
const revokedAvatar=renderToStaticMarkup(React.createElement(Avatar,{person,shared:false}));assert(!revokedAvatar.includes('<img'));
console.log('Conversation avatar renders only approved, mutually shared photos');

const {default:PreviewPhoto}=await import(compile(readFileSync('app/profile-preview-photo.tsx','utf8').replace("from './interactive-photo'",`from '${photoUrl}'`)));
const renderPhoto=props=>renderToStaticMarkup(React.createElement(PreviewPhoto,props));
assert(!renderPhoto({memberId:'self',uploaded:false}).includes('<img'));
const own=renderPhoto({memberId:'self',uploaded:true,version:2});
assert(own.includes('/api/photo?member=self&amp;v=2'));
assert(own.includes('both agree to share'));
const selected=renderPhoto({memberId:'self',uploaded:true,selected:'blob:selected'});
assert(selected.includes('blob:selected'));
assert(!selected.includes('/api/photo'));
assert(selected.includes('not been uploaded yet'));
assert(!renderPhoto({uploaded:true}).includes('/api/photo'));
const app=readFileSync('app/love-app.tsx','utf8');
assert(app.includes('<ProfilePreviewPhoto memberId={me?.id} uploaded={!!(me as any)?.photoUploaded} selected={signupPhotoPreview} version={photoVersion} description={form.photoDescription}/>'));
console.log('Own photo previews retain private photo-description text without changing sharing consent');

assert(html.includes('How ')&&html.includes('communicates'));assert(html.includes('Ask before giving advice.'));assert(html.includes('Please ask directly.'));assert(html.includes('Conversation ideas'));assert(html.includes('Everyday'));assert(html.includes('Communicate'));assert(html.includes('A conversation starting point'));assert(html.includes('No conversation identifier or message text is collected'));

assert(html.includes('class="conversation-details"'),'secondary conversation information has one home');
assert(!html.includes('class="communication-card" open'),'communication preferences do not expand automatically');
const exchangeHtml=renderToStaticMarkup(React.createElement(View,{accountId:'test',me:{...examples[1],photoUploaded:true},connection:{id:'test',person:examples[1],photoMine:false,photosShared:false,photoState:'revoked'},api:noop,onBack:noop,onProfile:noop,onReport:noop,onBlock:noop,onClose:noop,onPhoto:noop,onCircle:noop,onRead:noop}));
assert.equal((exchangeHtml.match(/>Request exchange<\/button>/g)||[]).length,1,'one photo exchange action');
assert(!exchangeHtml.includes('>Request photo exchange</button>'),'duplicate photo actions removed');
assert(exchangeHtml.includes('Share my current and future profile photos'));
assert(exchangeHtml.includes('disabled="">Request exchange'),'explicit unchecked consent is required');
const legacyExchange=renderToStaticMarkup(React.createElement(View,{accountId:'test',me:{...examples[1],photoUploaded:true},connection:{id:'test',person:examples[1],photoMine:true,photosShared:true},api:noop,onBack:noop,onProfile:noop,onReport:noop,onBlock:noop,onClose:noop,onPhoto:noop,onCircle:noop,onRead:noop}));
assert(legacyExchange.includes('Agree to ongoing sharing'));
assert(legacyExchange.includes('Stop sharing'));

const sharedRow=renderToStaticMarkup(React.createElement(View,{accountId:'test',me:{...examples[1],photoUploaded:true},connection:{id:'test',person:{...examples[1],hasPhoto:true},photoMine:true,photoOther:true,photosShared:true,photoOngoingMine:true,photoOngoingOther:true},api:noop,onBack:noop,onProfile:noop,onReport:noop,onBlock:noop,onClose:noop,onPhoto:async()=>true,onCircle:noop,onRead:noop}));
assert(sharedRow.indexOf('shared-photo-shortcut')<sharedRow.indexOf('conversation-details'),'agreed photo is outside nested disclosures');
assert(sharedRow.includes('Photos · Shared'));
let state=[],hook=0;
const fake="const useState=initial=>{const i=globalThis.__photoHooks.index++;const states=globalThis.__photoHooks.state;if(!(i in states))states[i]=initial;return [states[i],next=>states[i]=typeof next==='function'?next(states[i]):next];};const useRef=initial=>{const i=globalThis.__photoHooks.index++;const states=globalThis.__photoHooks.state;return states[i]??(states[i]={current:initial});};const useEffect=()=>{},useLayoutEffect=()=>{};";
globalThis.__photoHooks={state:[],index:0};
const {default:InteractiveView}=await import(compile(source.replace(/import \{useEffect,useLayoutEffect,useRef,useState\} from '[^']+';/,fake)));
function elements(n){return !n||typeof n!=='object'?[]:[n,...React.Children.toArray(n.props?.children).flatMap(elements)];}
let success=false,attempts=[];
const props={accountId:'test',me:{...examples[1],photoUploaded:true},connection:{id:'test',person:{...examples[1],hasPhoto:true},photoMine:false,photosShared:false,photoState:'revoked'},api:noop,onBack:noop,onProfile:noop,onReport:noop,onBlock:noop,onClose:noop,onPhoto:async(...args)=>{attempts.push(args);return success;},onCircle:noop,onRead:noop};
function view(){globalThis.__photoHooks.index=0;return elements(InteractiveView(props));}
const button=label=>view().find(n=>n.type==='button'&&n.props.children===label);
button('Share photos').props.onClick();
view().find(n=>n.type==='input'&&n.props.type==='checkbox').props.onChange({target:{checked:true}});
await button('Request exchange').props.onClick();
assert(view().find(n=>n.type==='input'&&n.props.type==='checkbox').props.checked,'failed request preserves consent');
assert(view().some(n=>n.props.role==='alert'&&String(n.props.children).includes('Your choice is kept')));
success=true;await button('Request exchange').props.onClick();
assert.deepEqual(attempts,[[true,true],[true,true]],'retry keeps the same explicit sharing choice');
assert(!view().find(n=>n.type==='input'&&n.props.type==='checkbox').props.checked,'success clears the temporary checkbox');
assert(view().find(n=>n.props.className==='photo-exchange-status').props.hidden,'success closes consent controls');
delete globalThis.__photoHooks;

assert(html.indexOf('Conversation ideas')<html.indexOf('<textarea'),'ideas are reachable alongside the composer');
assert(html.indexOf('Conversation ideas')<html.indexOf('<details class="chat-help"'),'ideas are no longer nested in help');
assert(source.includes('const bothParticipated=messages.some(message=>message.mine)&&messages.some(message=>!message.mine);'),'shared-activity prompts require messages from both people');
assert(source.includes('allowDoTogether={bothParticipated}'),'mutual participation controls the Do together goal');
assert(source.includes("{bothParticipated&&<button onClick={onCircle}>Start a circle together</button>}"),'circle creation stays out of brand-new chats until both people participate');
assert(source.includes("const hasPhotoState=!!(connection.photosShared||connection.photoMine||connection.photoOther||connection.photoState==='revoked');"),'legacy photo states remain manageable');
assert(source.includes("{(bothParticipated||hasPhotoState)&&<>"),'photo exchange is secondary until mutual conversation or an existing photo state');
assert(source.includes('Communication note:'),'new chats can surface one communication preference without opening secondary details');
assert(source.includes('Start with what brought you here, or ask something new when you’re ready.'),'empty chat language points back to conversation context');

assert(source.includes('accepted-invitation-starter'),'empty accepted chats surface what started the connection');
assert(source.includes('Reply to this, ask something new, or take the conversation in another direction.'),'opening context does not force a reply path');
