import ts from 'typescript';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';

const code=ts.transpileModule(readFileSync('app/notification-filters.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText;
const {groupMessageNotifications,filterNotifications,notificationCategory,notificationFilterAnnouncement,notificationFilterOptions,unreadNotificationCount}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
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
assert.equal(notificationFilterAnnouncement('all',8),'All activity: 8 notifications.');
assert.equal(notificationFilterAnnouncement('account',1),'Account activity: 1 notification.');
console.log('Notification quick filters preserve all items and count unread activity by category');

const alerts=[
 {id:'latest',kind:'message',url:'#chat/a',read:0},
 {id:'photo',kind:'photo_exchange',url:'#chat/a',read:0},
 {id:'other',kind:'message',url:'#chat/b',read:0},
 {id:'older',kind:'message',url:'#chat/a',read:1},
 {id:'reaction',kind:'reaction',url:'#chat/a',read:0},
 {id:'unavailable',kind:'message',url:'',available:false,read:0},
 {id:'circle-a',kind:'circle_message',url:'#circles/c',read:0},
 {id:'circle-b',kind:'circle_message',url:'#circles/c',read:1},
 {id:'request',kind:'circle_request',url:'#circles/c',read:0}
];
const grouped=groupMessageNotifications(alerts);
assert.deepEqual(grouped.map(g=>g.items.map(i=>i.id)),[['latest','older'],['photo'],['other'],['reaction'],['unavailable'],['circle-a','circle-b'],['request']]);
assert.equal(grouped.flatMap(g=>g.items).length,alerts.length,'grouping does not lose events');
assert.equal(grouped.flatMap(g=>g.items).filter(i=>!i.read).length,alerts.filter(i=>!i.read).length,'read state stays per event');
assert.equal(groupMessageNotifications(alerts.slice(1).concat(alerts[0])).find(g=>g.key==='message:#chat/a').key,grouped[0].key,'conversation group identity survives a refreshed latest event');
assert.equal(alerts[0].read,0,'grouping does not mutate events');
