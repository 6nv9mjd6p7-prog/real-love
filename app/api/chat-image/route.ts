import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../chatgpt-auth';
import {voiceAccess} from '../../voice-access';
import {SafetyError,initializeAccount,quota,failure,safetyHeaders,db,contentCheck} from '../../safety';
import {sanitizePng} from '../../photo-policy';
import {recordTwoWay} from '../../product-analytics';
import {notify,notifyCircle} from '../../notifications-server';

const respond=(data:unknown)=>Response.json(data,{headers:safetyHeaders});
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function readImage(req:Request){
 const reader=req.body?.getReader();
 if(!reader)throw new SafetyError('Choose a photo to send.',400);
 const parts:Uint8Array[]=[];let size=0;
 while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>2*1024*1024){await reader.cancel();throw new SafetyError('The prepared photo must be under 2 MB.',413);}parts.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length;}
 try{return sanitizePng(bytes);}catch(error:any){throw new SafetyError(error.message||'This photo could not be prepared safely.',400);}
}

async function visibleMessage(kind:string,scope:string,id:string,message:string,access:any){
 const row=await env.DB!.prepare(`SELECT rowid,* FROM ${access.table} WHERE id=? AND ${access.column}=? AND deleted_at='' AND sender<>'' AND rowid>?`).bind(message,scope,access.after).first<any>();
 const imageKey=row?.attachment_type==='image/png'&&row.attachment_key?.startsWith('chat-images/')?row.attachment_key:row?.audio_type==='image/png'&&row.audio_key?.startsWith('chat-images/')?row.audio_key:'';
 if(!row||!imageKey||await env.DB!.prepare('SELECT actor FROM blocks WHERE (actor=? AND target=?) OR (actor=? AND target=?)').bind(id,row.sender,row.sender,id).first())throw new SafetyError('Photo unavailable.',404);
 return row;
}

export async function GET(req:Request){try{
 const user=await getChatGPTUser();if(!user)throw new SafetyError('Sign in to view this photo.',401);
 await initializeAccount(user);await quota(user.userId,'chat_image_read',120,60);
 const query=new URL(req.url).searchParams,kind=query.get('kind')||'',scope=query.get('scope')||'',access=await voiceAccess(kind,scope,user.userId);
 const row=await visibleMessage(kind,scope,user.userId,query.get('message')||'',access),key=row.attachment_key||row.audio_key,object=await env.BUCKET?.get(key);
 if(!object)throw new SafetyError('Photo unavailable.',404);
 return new Response(object.body,{headers:{'Content-Type':'image/png','Cache-Control':'private, no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox"}});
 }catch(error){return failure(error);}}

export async function POST(req:Request){let key='';try{
 const user=await getChatGPTUser();if(!user)throw new SafetyError('Sign in to send a photo.',401);
 if(req.headers.get('origin')!==new URL(req.url).origin)throw new SafetyError('Request origin not allowed.',403);
 if(req.headers.get('x-expected-account')!==user.userId)throw new SafetyError('Your account changed. Refresh before sending.',409);
 if((req.headers.get('content-type')||'').split(';')[0]!=='image/png')throw new SafetyError('Prepare the photo before sending.',400);
 await initializeAccount(user);await quota(user.userId,'write',60,60);
 const kind=req.headers.get('x-chat-image-kind')||'',scope=req.headers.get('x-chat-image-scope')||'',attempt=req.headers.get('x-chat-image-attempt')||'',replyTo=req.headers.get('x-chat-image-reply')||'';
 let caption='';try{caption=decodeURIComponent(req.headers.get('x-chat-image-caption')||'');}catch{throw new SafetyError('Invalid photo caption.',400);}
 if(!uuid.test(attempt)||scope.length>200||replyTo.length>600||caption.length>1500)throw new SafetyError('Invalid photo message.',400);
 if(caption.trim())contentCheck(caption.trim());
 const access=await voiceAccess(kind,scope,user.userId),message=JSON.stringify([scope,user.userId,attempt]),body=caption.trim()||'Photo';
 const previous=await env.DB!.prepare(`SELECT body,reply_to,attachment_type FROM ${access.table} WHERE id=? AND ${access.column}=? AND sender=?`).bind(message,scope,user.userId).first<any>();
 if(previous){if(previous.body===body&&previous.reply_to===replyTo&&previous.attachment_type==='image/png')return respond({ok:true});throw new SafetyError('This attempt belongs to a different message.',409);}
 if(replyTo){const target=await env.DB!.prepare(`SELECT rowid,sender FROM ${access.table} WHERE id=? AND ${access.column}=? AND rowid>? AND sender<>'' AND deleted_at=''`).bind(replyTo,scope,access.after).first<any>();if(!target||await env.DB!.prepare('SELECT actor FROM blocks WHERE (actor=? AND target=?) OR (actor=? AND target=?)').bind(user.userId,target.sender,target.sender,user.userId).first())throw new SafetyError('The message you are replying to is unavailable.',403);}
 await quota(user.userId,'chat_image_upload',20,3600);await quota(user.userId,'message',60,3600);
 if(!env.BUCKET)throw new SafetyError('Photo storage is unavailable.',503);
 const image=await readImage(req);key='chat-images/'+crypto.randomUUID()+'.png';await env.BUCKET.put(key,image,{httpMetadata:{contentType:'image/png'}});
 const replyGuard=`(?='' OR EXISTS (SELECT x.id FROM ${access.table} x WHERE x.id=? AND x.${access.column}=? AND x.deleted_at='' AND x.sender<>'' AND x.rowid>? AND NOT EXISTS (SELECT actor FROM blocks WHERE (actor=? AND target=x.sender) OR (actor=x.sender AND target=?))))`;
 const saved=await env.DB!.prepare(`INSERT INTO ${access.table} (id,${access.column},sender,body,created,reply_to,attachment_key,attachment_type) SELECT ?,?,?,?,?,?,?,? WHERE (${access.guard}) AND ${replyGuard} ON CONFLICT(id) DO NOTHING`).bind(message,scope,user.userId,body,new Date().toISOString(),replyTo,key,'image/png',...access.values,replyTo,replyTo,scope,access.after,user.userId,user.userId).run();
 if(!saved.meta.changes){await env.BUCKET.delete(key);key='';const existing=await env.DB!.prepare(`SELECT body,reply_to,attachment_type FROM ${access.table} WHERE id=? AND sender=? AND ${access.column}=?`).bind(message,user.userId,scope).first<any>();if(existing?.body===body&&existing.reply_to===replyTo&&existing.attachment_type==='image/png')return respond({ok:true});throw new SafetyError('Conversation permissions changed. The photo was not sent.',403);}
 key='';
 if(kind==='direct'){const pair=await db().prepare('SELECT sender,recipient FROM connections WHERE id=?').bind(scope).first<any>();if(pair)await recordTwoWay(db(),scope,pair.sender,pair.recipient,user.userId);await notify(access.other,user.userId,'message',scope,'New private photo','#chat/'+encodeURIComponent(scope),message);}else await notifyCircle(scope,user.userId,message);
 return respond({ok:true});
 }catch(error){if(key&&env.BUCKET)await env.BUCKET.delete(key);return failure(error);}}
