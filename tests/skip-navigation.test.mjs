import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const layout=readFileSync('app/layout.tsx','utf8');
const app=readFileSync('app/love-app.tsx','utf8');
const auth=readFileSync('app/auth/page.tsx','utf8');
const landing=readFileSync('app/public-landing.tsx','utf8');
const css=readFileSync('app/globals.css','utf8');

assert(layout.indexOf('className="skip-link"')<layout.indexOf('className="site-utility"'),'skip navigation is the first keyboard destination before utility links');
assert.match(app,/id="main-content" tabIndex=\{-1\}/,'the main app exposes a programmatic skip target');
assert.match(auth,/<main id="main-content" tabIndex=\{-1\}/,'the authentication screen exposes the same skip target');
assert.match(landing,/<main id="main-content" tabIndex=\{-1\}/,'the public landing screen exposes the shared skip target');
assert.match(landing,/<section id="public-top" className="public-hero"/,'the home link still returns to the public landing hero');
assert.match(css,/\.skip-link:focus\{transform:translateY\(0\)\}/,'the skip link becomes visible when keyboard focused');
console.log('Skip navigation is first in keyboard order and targets both app and sign-in screens.');
