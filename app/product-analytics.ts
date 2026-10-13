/**
 * Records bounded product milestones and aggregates journey counts. Milestones exclude profile answers, message bodies, and photo contents.
 * Reading guide: docs/CODE_READING_GUIDE.md.
 */
export async function recordProductEvent(store:D1Database,member:string,kind:string){try{const now=new Date().toISOString(),suffix=kind==='visit'?':'+now.slice(0,10):'';await store.prepare('INSERT OR IGNORE INTO product_events (id,member,kind,created) VALUES (?,?,?,?)').bind(JSON.stringify([member,kind+suffix]),member,kind,now).run();}catch{console.warn('Activity totals could not update.');}}
export async function recordTwoWay(store:D1Database,connection:string,a:string,b:string,sender?:string){try{if(sender&&[a,b].includes(sender))await recordProductEvent(store,sender,'message_sent');const pair=await store.prepare("SELECT COUNT(DISTINCT sender) AS n FROM messages WHERE connection=? AND sender IN (?,?) AND deleted_at='' AND (body<>'' OR audio_key<>'')").bind(connection,a,b).first<{n:number}>();if(pair?.n===2)await Promise.all([recordProductEvent(store,a,'two_way'),recordProductEvent(store,b,'two_way')]);}catch{console.warn('Conversation activity totals could not update.');}}
