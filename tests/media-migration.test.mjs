import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';

// Apply the schema that existed before the attachment migration, then seed
// realistic legacy image and voice records before applying the new migration.
const sql=new DatabaseSync(':memory:');
const migrations=readdirSync('drizzle').filter(file=>/^\d+_.*\.sql$/.test(file)).sort();
for(const file of migrations.slice(0,-1))sql.exec(readFileSync(`drizzle/${file}`,'utf8'));
sql.prepare('INSERT INTO messages (id,connection,sender,body,created,audio_key,audio_type,audio_duration) VALUES (?,?,?,?,?,?,?,?)')
  .run('legacy-image','connection','sender','Caption','2026-01-01','chat-images/legacy.png','image/png',0);
sql.prepare('INSERT INTO messages (id,connection,sender,body,created,audio_key,audio_type,audio_duration) VALUES (?,?,?,?,?,?,?,?)')
  .run('voice-note','connection','sender','Voice note','2026-01-01','voice/legacy.webm','audio/webm',12);
sql.prepare('INSERT INTO circle_messages (id,circle,sender,body,created,audio_key,audio_type,audio_duration) VALUES (?,?,?,?,?,?,?,?)')
  .run('legacy-circle-image','circle','sender','Circle caption','2026-01-01','chat-images/circle.png','image/png',0);
sql.exec(readFileSync(`drizzle/${migrations.at(-1)}`,'utf8'));

assert.deepEqual(
  {...sql.prepare('SELECT attachment_key,attachment_type,audio_key,audio_type,audio_duration FROM messages WHERE id=?').get('legacy-image')},
  {attachment_key:'',attachment_type:'',audio_key:'chat-images/legacy.png',audio_type:'image/png',audio_duration:0},
  'schema migration preserves legacy photo columns and their R2 key',
);
assert.deepEqual(
  {...sql.prepare('SELECT attachment_key,attachment_type,audio_key,audio_type,audio_duration FROM circle_messages WHERE id=?').get('legacy-circle-image')},
  {attachment_key:'',attachment_type:'',audio_key:'chat-images/circle.png',audio_type:'image/png',audio_duration:0},
  'schema migration preserves legacy circle photo columns and their R2 key',
);
assert.deepEqual(
  {...sql.prepare('SELECT attachment_key,attachment_type,audio_key,audio_type,audio_duration FROM messages WHERE id=?').get('voice-note')},
  {attachment_key:'',attachment_type:'',audio_key:'voice/legacy.webm',audio_type:'audio/webm',audio_duration:12},
  'voice notes stay in their existing audio columns',
);

sql.close();
console.log('Legacy chat photo migration preserves images and leaves voice notes intact.');
