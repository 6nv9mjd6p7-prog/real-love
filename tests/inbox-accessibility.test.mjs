import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync('app/love-app.tsx','utf8');
assert(source.includes('<input type="search" aria-label="Search conversations by name"'),'conversation search exposes native search semantics');
assert(source.includes('inboxResultCount>0&&<p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{inboxResultAnnouncement}</p>'),'positive search and filter results are announced without duplicating the zero-results message');
assert(source.includes('<h2>Your chats</h2>{!visibleChats.length&&<p className="field-help" role="status">'),'the filtered Chats empty state is announced when no conversations match');
assert(source.includes("inboxSearch.trim()?'No conversations match this name.':chatFilter==='Unread'?'You have no unread conversations.'"),'the announcement explains whether search or unread filtering produced the empty state');
assert.equal((source.match(/<p className="inbox-empty-title" role="status">/g)||[]).length,2,'the filtered Requests and Sent empty states are announced');
console.log('Filtered Chats empty states announce why no conversations are shown');
