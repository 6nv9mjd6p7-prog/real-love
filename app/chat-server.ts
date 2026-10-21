import {env} from 'cloudflare:workers';
import {reactionOptions,EDIT_WINDOW_MS,DELETE_WINDOW_MS,MAX_MESSAGE_EDITS,messageChangeAllowed,type MessageReaction} from './chat-tools';
import {SafetyError,contentCheck} from './safety';
type Kind='direct'|'circle';
type ReactionRow={message:string;member:string;emoji:string};
type ReplyRow={rowid:number;id:string;sender:string;body:string;data:string|null};
type EditableMessageRow={id:string;body:string;created:string;audio_key:string;attachment_key:string;edited_at:string;deleted_at:string;edit_count:number;edit_history:string;cooperation_parent?:string};
const db=()=>env.DB!;
export async function enrichMessages(rows:any[],kind:Kind,scope:string,viewer:string,visible:(row:any)=>Promise<boolean>,reactionVisible:(member:string)=>Promise<boolean>){
 const reactions=new Map<string,MessageReaction[]>(),visibility=new Map<string,boolean>();
 for(let start=0;start<rows.length;start+=70){const ids=rows.slice(start,start+70).map(x=>x.id);if(!ids.length)continue;
  const result=await db().prepare(`SELECT message,member,emoji FROM message_reactions WHERE kind=? AND scope=? AND message IN (${ids.map(()=>'?').join(',')})`).bind(kind,scope,...ids).all<ReactionRow>();
  for(const r of result.results){if(!visibility.has(r.member))visibility.set(r.member,await reactionVisible(r.member));if(!visibility.get(r.member))continue;const list=reactions.get(r.message)||[];let item=list.find(x=>x.emoji===r.emoji);if(!item){item={emoji:r.emoji,count:0,mine:false};list.push(item);}item.count++;if(r.member===viewer)item.mine=true;reactions.set(r.message,list);}
 }
 const table=kind==='direct'?'messages':'circle_messages',column=kind==='direct'?'connection':'circle';
 const output=[];
 for(const row of rows){let quoted=null;if(row.reply_to&&!row.deleted_at){const target=await db().prepare(`SELECT m.rowid,m.id,m.sender,m.body,p.data FROM ${table} m LEFT JOIN profiles p ON p.id=m.sender WHERE m.id=? AND m.${column}=? AND m.sender<>'' AND m.deleted_at=''`).bind(row.reply_to,scope).first<ReplyRow>();if(target&&await visible(target))quoted={id:target.id,body:target.body,name:target.sender===viewer?'You':target.data?JSON.parse(target.data).name:'Member',mine:target.sender===viewer};}
  const {audio_key,audio_type,audio_duration,attachment_key,attachment_type,edited_at,deleted_at,edit_count,edit_history,...safe}=row;
  const legacyImage=audio_type==='image/png'&&audio_key?.startsWith('chat-images/'),imageKey=attachment_type==='image/png'&&attachment_key?.startsWith('chat-images/')?attachment_key:legacyImage?audio_key:'';
  const image= !deleted_at&&imageKey?{url:'/api/chat-image?kind='+kind+'&scope='+encodeURIComponent(scope)+'&message='+encodeURIComponent(row.id)}:null;
  output.push({...safe,body:deleted_at?'Message deleted':row.body,audio:!deleted_at&&audio_key&&!legacyImage?{url:'/api/voice?kind='+kind+'&scope='+encodeURIComponent(scope)+'&message='+encodeURIComponent(row.id),duration:audio_duration}:null,image,editedAt:edited_at||'',deletedAt:deleted_at||'',editCount:edit_count||0,editHistory:deleted_at?[]:JSON.parse(edit_history||'[]'),reply:quoted,replyUnavailable:!deleted_at&&!!row.reply_to&&!quoted,reactions:deleted_at?[]:reactions.get(row.id)||[]});
 }
 return output;
}
export async function changeMessage(kind:Kind,scope:string,viewer:string,input:Record<string,unknown>,guard:string,values:unknown[]){
 const table=kind==='direct'?'messages':'circle_messages',column=kind==='direct'?'connection':'circle';
 if(typeof input.message!=='string'||input.message.length>600)throw new SafetyError('Choose a message.',400);
 const row=await db().prepare(`SELECT * FROM ${table} WHERE id=? AND ${column}=? AND sender=?`).bind(input.message,scope,viewer).first<EditableMessageRow>();
 if(!row)throw new SafetyError('Only your own messages can be changed.',403);
 if(row.deleted_at){if(input.action==='delete_message')return;throw new SafetyError('This message was deleted.',409);}
 const deleting=input.action==='delete_message',window=deleting?DELETE_WINDOW_MS:EDIT_WINDOW_MS;
 if(!messageChangeAllowed(row.created,window))throw new SafetyError(deleting?'The 2-minute delete window has ended.':'The 15-minute edit window has ended.',409);
 if(!deleting&&(row.audio_key||row.attachment_key||row.edit_count>=MAX_MESSAGE_EDITS))throw new SafetyError(row.audio_key||row.attachment_key?'Media messages cannot be edited.':'This message has reached its 5-edit limit.',409);
 if(!deleting&&input.expectedRevision!==row.edit_count)throw new SafetyError('This message changed. Refresh before editing.',409);
 const body=deleting?'':typeof input.text==='string'?input.text.trim():'';
 if(!deleting&&(!body||body.length>1500))throw new SafetyError('Write a message of 1–1,500 characters.',400);
 if(!deleting)contentCheck(body);if(!deleting&&body===row.body)return;
 if(kind==='circle'&&!deleting&&row.cooperation_parent){
  const root=await db().prepare("SELECT id FROM circle_messages WHERE id=? AND circle=? AND cooperation_kind='project' AND cooperation_status='open' AND deleted_at=''").bind(row.cooperation_parent,scope).first();
  if(!root)throw new SafetyError('This project is closed or unavailable. Its updates cannot be edited.',409);
  guard+=" AND EXISTS (SELECT 1 FROM circle_messages root JOIN circle_members cm ON cm.circle=root.circle AND cm.member=? JOIN profiles p ON p.id=root.sender JOIN safety_accounts a ON a.id=p.id WHERE root.id=? AND root.circle=? AND root.cooperation_kind='project' AND root.cooperation_status='open' AND root.deleted_at='' AND cm.status='accepted' AND root.rowid>cm.history_after AND p.active=1 AND a.status='admitted' AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.actor=? AND b.target=root.sender) OR (b.actor=root.sender AND b.target=?)))";
  values=[...values,viewer,row.cooperation_parent,scope,viewer,viewer];
 }
 const now=new Date().toISOString(),cutoff=new Date(Date.now()-window).toISOString();
 const history=deleting?[]:[...JSON.parse(row.edit_history||'[]'),{body:row.body,at:row.edited_at||row.created}];
 const r=await db().prepare(`UPDATE ${table} SET body=?,edited_at=?,deleted_at=?,edit_count=?,edit_history=?,audio_key=CASE WHEN ?=1 THEN '' ELSE audio_key END,attachment_key=CASE WHEN ?=1 THEN '' ELSE attachment_key END WHERE id=? AND ${column}=? AND sender=? AND deleted_at='' AND edit_count=? AND created>? AND (${guard})`).bind(body,deleting?row.edited_at:now,deleting?now:'',deleting?row.edit_count:row.edit_count+1,JSON.stringify(history),deleting?1:0,deleting?1:0,row.id,scope,viewer,row.edit_count,cutoff,...values).run();
 if(!r.meta.changes)throw new SafetyError('Message or conversation permissions changed. Refresh before trying again.',409);
 if(deleting){if(kind==='circle')await db().prepare('DELETE FROM circle_activity_participants WHERE message=?').bind(row.id).run();await db().prepare('DELETE FROM message_reactions WHERE kind=? AND scope=? AND message=?').bind(kind,scope,row.id).run();if(env.BUCKET)for(const key of [row.audio_key,row.attachment_key])if(key)await env.BUCKET.delete(key);}
}
export async function saveReaction(kind:Kind,scope:string,message:string,member:string,emoji:string,guard:string,values:unknown[]){
 if(emoji!==''&&!reactionOptions.some(x=>x.emoji===emoji))throw new SafetyError('Choose a supported reaction.',400);
 if(!message||message.length>600)throw new SafetyError('Choose a message.',400);
 if(!emoji){const result=await db().prepare(`DELETE FROM message_reactions WHERE kind=? AND scope=? AND message=? AND member=? AND (${guard})`).bind(kind,scope,message,member,...values).run();return result.meta.changes;}
 const result=await db().prepare(`INSERT INTO message_reactions (kind,scope,message,member,emoji) SELECT ?,?,?,?,? WHERE (${guard}) ON CONFLICT(kind,scope,message,member) DO UPDATE SET emoji=excluded.emoji`).bind(kind,scope,message,member,emoji,...values).run();return result.meta.changes;
}
