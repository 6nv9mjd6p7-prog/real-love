import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';

const app=readFileSync('app/love-app.tsx','utf8');
const start=app.indexOf('className="person-card compact-person"');
const end=app.indexOf('</article>',start);
assert(start>=0&&end>start,'Discover profile card is present');
const card=app.slice(start,end);
const markers=['className="person-title discovery-person-title"','className="bio-meta"','Self-described neurotype · shared:','className="interest-tags card-interests"','<DiscoveryCardAnswer','<ConnectionContext','className="discovery-card-actions"','className="profile-link primary"'];
const positions=markers.map(marker=>card.indexOf(marker));
assert(positions.every(position=>position>=0),'profile identity, interests, ideas, shared context, and actions remain visible');
assert.deepEqual(positions,[...positions].sort((a,b)=>a-b),'Discover profile cards lead from identity to area, interests, ideas, connection context, and actions');
assert(card.includes('className="discovery-avatar"'),'profile cards add a compact initials avatar without exposing private photos');
console.log('Discover cards show opt-in demo neurotype labels before interests, prompts, shared context, and actions.');
