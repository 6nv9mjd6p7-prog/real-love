import ts from 'typescript';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const js=ts.transpileModule(readFileSync('app/conversation-suggestions.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText;
const {conversationGoals,recommendConversationIdeas:recommend,suggestionTopics}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
for(const goal of conversationGoals){
 const first=recommend({goal});assert.equal(first.length,3);
 const next=recommend({goal,skipped:first.map(i=>i.id)});assert.equal(next.length,3);
 assert(next.every(i=>!first.some(old=>old.id===i.id)));
 assert.equal(recommend({goal,skipped:[...first,...next].map(i=>i.id)}).length,0);
 assert.deepEqual(recommend({goal}),first,'rankings are deterministic');
 const topical=recommend({goal,topic:'Gardening'});assert(topical[0].text.includes('Gardening'));
 assert.equal(topical[0].reason,'You chose Gardening');
}
assert.deepEqual(suggestionTopics([' Music ','music','', 'x'.repeat(61),'History\n']),['Music','History']);
assert.equal(suggestionTopics(Array.from({length:100},(_,i)=>String(i))).length,12);
const initial=recommend({goal:'Everyday'});
const similar=recommend({goal:'Everyday',preferred:[initial[0].theme],skipped:[initial[0].id]});
assert.equal(similar[0].theme,initial[0].theme);assert.equal(similar[0].reason,'More like an idea you chose');
const custom='A shared-interest starter';
assert(recommend({goal:'Everyday',starters:[custom]}).some(i=>i.text===custom));
assert(!recommend({goal:'Everyday',starters:[custom],circle:true}).some(i=>i.text===custom),'direct profile starters never bleed into circle recommendations');
assert(!recommend({goal:'Communicate',starters:[custom]}).some(i=>i.text===custom),'goal selection remains authoritative');
console.log('Curated goals, deterministic ranking, bounded topics, preference relevance, exhaustion and context separation passed.');
