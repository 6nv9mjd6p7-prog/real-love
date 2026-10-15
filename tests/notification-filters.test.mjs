import ts from 'typescript';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';

const code=ts.transpileModule(readFileSync('app/notification-filters.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText;
const {filterNotifications,notificationCategory,notificationFilterOptions,unreadNotificationCount}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const items=[
 {kind:'message',read:0,id:'m1'},
 {kind:'reaction',read:1,id:'r1'},
 {kind:'invitation',read:0,id:'i1'},
 {kind:'photo_exchange',read:1,id:'p1'},
 {kind:'circle_message',read:0,id:'c1'},
 {kind:'circle_request',read:1,id:'c2'},
 {kind:'approved',read:0,id:'a1'},
 {kind:'review',read:0,id:'a2'}
];
assert.deepEqual(notificationFilterOptions.map(x=>x.key),['all','chats','connections','circles','account']);
assert.equal(filterNotifications(items,'all').length,8);
assert.deepEqual(filterNotifications(items,'chats').map(x=>x.id),['m1','r1']);
assert.deepEqual(filterNotifications(items,'connections').map(x=>x.id),['i1','p1']);
assert.deepEqual(filterNotifications(items,'circles').map(x=>x.id),['c1','c2']);
assert.deepEqual(filterNotifications(items,'account').map(x=>x.id),['a1','a2']);
assert.equal(unreadNotificationCount(items,'chats'),1);
assert.equal(unreadNotificationCount(items,'circles'),1);
assert.equal(notificationCategory('new_future_kind'),'account','new kinds remain visible in the account filter');
console.log('Notification quick filters preserve all items and count unread activity by category');
