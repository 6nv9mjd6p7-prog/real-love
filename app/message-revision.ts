// A revision covers edits, deletions, reactions, quote names and visibility.
// Authorization still runs on every request before an unchanged response.
export async function messageRevision(store:D1Database,kind:'direct'|'circle',scope:string,viewer:string){
 const table=kind==='direct'?'messages':'circle_messages',column=kind==='direct'?'connection':'circle';
 const rows=await store.prepare(`SELECT m.rowid,m.id,m.sender,m.edit_count,m.deleted_at,m.reply_to,(m.audio_key<>'' OR m.attachment_key<>'') AS media,json_extract(p.data,'$.name') AS name FROM ${table} m LEFT JOIN profiles p ON p.id=m.sender WHERE m.${column}=? ORDER BY m.rowid`).bind(scope).all();
 const reactions=await store.prepare('SELECT message,member,emoji FROM message_reactions WHERE kind=? AND scope=? ORDER BY message,member').bind(kind,scope).all();
 const blocks=await store.prepare('SELECT actor,target FROM blocks WHERE actor=? OR target=? ORDER BY actor,target').bind(viewer,viewer).all();
 const members=kind==='circle'?(await store.prepare("SELECT m.member,m.status,m.role,m.history_after,json_extract(p.data,'$.name') AS name FROM circle_members m LEFT JOIN profiles p ON p.id=m.member WHERE m.circle=? ORDER BY m.member").bind(scope).all()).results:[];
 const bytes=new TextEncoder().encode(JSON.stringify([rows.results,reactions.results,blocks.results,members]));const digest=await crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('');
}
