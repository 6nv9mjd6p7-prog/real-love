import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';

const circles=readFileSync('app/circles.tsx','utf8');
const support=readFileSync('app/worker-support.tsx','utf8');
const profile=readFileSync('app/profile-view.tsx','utf8');
const api=readFileSync('app/api/circles/route.ts','utf8');

assert(circles.includes("import WorkerSupport from './worker-support'"),'worker support is integrated into Circles');
assert(circles.includes("tag.toLowerCase()==='work & worker support'"),'worker discovery uses a dedicated tag');
assert(circles.includes("Employer disclosure is optional."),'worker circle creation warns that employer disclosure is optional');
assert(circles.includes('No private chat or photos are copied.'),'circle creation preserves the private-chat boundary');
assert(support.includes('Worker-circle membership and activity are not added to public profiles.'),'worker support explains profile separation');
assert(support.includes('Real Love is not a union or law firm.'),'worker support does not misrepresent professional status');
assert(support.includes('cannot guarantee anonymity'),'worker support does not promise anonymity');
assert(support.includes('https://www.worker.gov/'),'worker.gov resource is present');
assert(support.includes('https://www.osha.gov/workers/'),'OSHA worker resource is present');
assert(support.includes('https://www.nlrb.gov/about-nlrb/rights-we-protect/your-rights/employee-rights'),'NLRB employee-rights resource is present');
assert(!profile.toLowerCase().includes('worker-circle membership'),'worker membership is not added to public profile rendering');
assert(api.includes("if(!isMember)return reply({error:'Join this circle to access its conversation.'},403)"),'non-members remain blocked from circle conversations');
assert(api.includes("m.rowid>?"),'circle message history remains admission-bounded');
console.log('Worker support integration, positioning, resource links, and privacy boundaries passed');
