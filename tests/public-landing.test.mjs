import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const landing=readFileSync('app/public-landing.tsx','utf8');
const app=readFileSync('app/love-app.tsx','utf8');
const css=readFileSync('app/globals.css','utf8');
const layout=readFileSync('app/layout.tsx','utf8');

assert(landing.includes('Find people you can actually talk to.'));
assert(landing.includes('FRIENDSHIP FIRST. PEOPLE BEFORE LABELS.'));
assert(landing.includes('Start with curiosity, not swiping.'));
assert(landing.includes('Profile photos are optional and stay private until both people agree to share.'));
assert(landing.includes('Circles grow from connection'));
assert.match(landing,/<div className="public-conversation-card" role="group" aria-label="Example of a conversation starting from a shared interest">/,'assistive technology gets the example conversation context as a named group');
assert(landing.includes('Early access for adults 18+'));
assert(app.includes("if(!signedIn&&route==='discover')"));
assert(app.includes("<PublicLanding authHref={authHref} authLabel={authLabel} onDemo={()=>nav('Examples')}/>"));
assert(css.includes('.public-landing{'));
assert(css.includes('@media(max-width:620px)'));
assert(layout.includes('Begin as friends and choose your own pace.'));
console.log('Public landing preserves the guest demo handoff and friendship-first positioning.');
