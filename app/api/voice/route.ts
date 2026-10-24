import {recordTwoWay} from '../../product-analytics';
import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../chatgpt-auth';
import {voiceAccess} from '../../voice-access';
import {SafetyError,initializeAccount,quota,failure,safetyHeaders,moderator,isOwner,audit,db} from '../../safety';
import {caseConflict} from '../../moderation-policy';
import {notify,notifyCircle} from '../../notifications-server';
type MediaAccess=Awaited<ReturnType<typeof voiceAccess>>;
type VoiceMessageRow={sender:string;audio_key:string;audio_type:string};
type VoiceAttemptRow={audio_duration:number;reply_to:string;audio_type:string};
type ReportRow={actor:string;target:string;context:string;expires:string;evidence:string};
type ConnectionRow={sender:string;recipient:string};
const json=(data:unknown)=>Response.json(data,{headers:safetyHeaders});
const types=['audio/webm','audio/mp4','audio/ogg'];
async function target(access:MediaAccess,scope:string,message:string,id:string){
 const row=await env.DB!.prepare(`SELECT rowid,* FROM ${access.table} WHERE id=? AND ${access.column}=? AND deleted_at='' AND sender<>'' AND rowid>?`).bind(message,scope,access.after).first<VoiceMessageRow>();
 if(!row||await env.DB!.prepare('SELECT actor FROM blocks WHERE (actor=? AND target=?) OR (actor=? AND target=?)').bind(id,row.sender,row.sender,id).first())throw new SafetyError('Message unavailable.',403);return row;
}
async function audio(req:Request,key:string,type:string){
 const bucket=env.BUCKET,meta=await bucket?.head(key);if(!bucket||!meta)throw new SafetyError('Voice note unavailable.',404);
 const headers=new Headers({'Content-Type':types.includes(type)?type:'audio/webm','Cache-Control':'private, no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox",'Accept-Ranges':'bytes','ETag':meta.httpEtag});
 const range=req.headers.get('range');let offset=0,length=meta.size,status=200;
 // Single byte ranges cover Safari's initial probe and subsequent seeking.
 if(range&&(!req.headers.has('if-range')||req.headers.get('if-range')===meta.httpEtag)){
  const match=/^bytes=(\d*)-(\d*)$/.exec(range);
  if(match&&(match[1]||match[2])){
   const first=match[1]?Number(match[1]):null,last=match[2]?Number(match[2]):null;
   if(first===null){length=Math.min(last!,meta.size);offset=meta.size-length;}
   else{offset=first;length=Math.min(last===null?meta.size-1:last,meta.size-1)-offset+1;}
   if(!Number.isSafeInteger(offset)||!Number.isSafeInteger(length)||offset<0||offset>=meta.size||length<=0){headers.set('Content-Range','bytes */'+meta.size);return new Response(null,{status:416,headers});}
   status=206;headers.set('Content-Range',`bytes ${offset}-${offset+length-1}/${meta.size}`);
  }
 }
 const object=await bucket.get(key,status===206?{range:{offset,length}}:undefined);if(!object)throw new SafetyError('Voice note unavailable.',404);
 headers.set('Content-Length',String(length));return new Response(object.body,{status,headers});
}
export async function GET(req:Request){try{
 const user=await getChatGPTUser();if(!user)throw new SafetyError('Sign in to listen.',401);await initializeAccount(user);await quota(user.userId,'voice_read',120,60);const p=new URL(req.url).searchParams;
 if(p.has('report')){if(!await moderator(user))throw new SafetyError('Evidence unavailable.',403);const r=await db().prepare("SELECT * FROM reports WHERE id=? AND status='open'").bind(p.get('report')).first<ReportRow>();if(!r||(r.expires&&r.expires<=new Date().toISOString())||(!isOwner(user)&&await caseConflict(user.userId,r)))throw new SafetyError('Evidence unavailable.',403);const evidence=JSON.parse(r.evidence);if(!evidence.audioEvidenceKey)throw new SafetyError('Evidence unavailable.',404);await audit(user.userId,'view_reported_voice',r.target,'Reviewed specifically reported voice evidence');return audio(req,evidence.audioEvidenceKey,evidence.audioType);}
 const kind=p.get('kind')||'',scope=p.get('scope')||'',access=await voiceAccess(kind,scope,user.userId),row=await target(access,scope,p.get('message')||'',user.userId);if(!row.audio_key||!types.includes(row.audio_type))throw new SafetyError('Voice note unavailable.',404);return audio(req,row.audio_key,row.audio_type);
 }catch(e){return failure(e);}}
export async function POST(req:Request){let key='';try{
 const user=await getChatGPTUser();if(!user)throw new SafetyError('Sign in to record.',401);
 if(req.headers.get('origin')!==new URL(req.url).origin)throw new SafetyError('Request origin not allowed.',403);
 if(req.headers.get('x-expected-account')!==user.userId)throw new SafetyError('Your account changed. Refresh before sending.',409);
 await initializeAccount(user);await quota(user.userId,'write',60,60);
 const kind=req.headers.get('x-voice-kind')||'',scope=req.headers.get('x-voice-scope')||'',attempt=req.headers.get('x-voice-attempt')||'',replyTo=req.headers.get('x-voice-reply')||'',duration=Number(req.headers.get('x-voice-duration')),type=(req.headers.get('content-type')||'').split(';')[0];
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(attempt)||!Number.isInteger(duration)||duration<1||duration>60000||replyTo.length>600||!types.includes(type))throw new SafetyError('Invalid voice recording.',400);
 const access=await voiceAccess(kind,scope,user.userId),message=JSON.stringify([scope,user.userId,attempt]);
 const previous=await env.DB!.prepare(`SELECT * FROM ${access.table} WHERE id=? AND ${access.column}=? AND sender=?`).bind(message,scope,user.userId).first<VoiceAttemptRow>();
 if(previous){if(previous.audio_duration!==duration||previous.reply_to!==replyTo||previous.audio_type!==type)throw new SafetyError('This attempt belongs to a different message.',409);return json({ok:true});}
 if(replyTo)await target(access,scope,replyTo,user.userId);
 await quota(user.userId,'voice_upload',20,3600);await quota(user.userId,'message',60,3600);if(!env.BUCKET)throw new SafetyError('Voice storage unavailable.',503);
 if(Number(req.headers.get('content-length')||0)>5*1024*1024)throw new SafetyError('Voice notes must be under 5 MB.',413);
 const reader=req.body?.getReader();if(!reader)throw new SafetyError('Record a voice note.',400);const pieces:Uint8Array[]= [];let size=0;
 while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>5*1024*1024){await reader.cancel();throw new SafetyError('Voice notes must be under 5 MB.',413);}pieces.push(value);}
 const raw=new Uint8Array(size);let offset=0;for(const piece of pieces){raw.set(piece,offset);offset+=piece.length;}
 const valid=type==='audio/webm'?raw[0]===0x1a&&raw[1]===0x45&&raw[2]===0xdf&&raw[3]===0xa3:type==='audio/ogg'?String.fromCharCode(...raw.slice(0,4))==='OggS':String.fromCharCode(...raw.slice(4,8))==='ftyp';
 if(!valid||size<16)throw new SafetyError('The recording format was not recognised.',400);
 key='voice-notes/'+crypto.randomUUID();await env.BUCKET.put(key,raw,{httpMetadata:{contentType:type}});
 const replyGuard=`(?='' OR EXISTS (SELECT x.id FROM ${access.table} x WHERE x.id=? AND x.${access.column}=? AND x.deleted_at='' AND x.sender<>'' AND x.rowid>? AND NOT EXISTS (SELECT actor FROM blocks WHERE (actor=? AND target=x.sender) OR (actor=x.sender AND target=?))))`;
 const saved=await env.DB!.prepare(`INSERT INTO ${access.table} (id,${access.column},sender,body,created,reply_to,audio_key,audio_type,audio_duration) SELECT ?,?,?,?,?,?,?,?,? WHERE (${access.guard}) AND ${replyGuard} ON CONFLICT(id) DO NOTHING`).bind(message,scope,user.userId,'Voice note',new Date().toISOString(),replyTo,key,type,duration,...access.values,replyTo,replyTo,scope,access.after,user.userId,user.userId).run();
 if(!saved.meta.changes){await env.BUCKET.delete(key);key='';const existing=await env.DB!.prepare(`SELECT audio_duration,reply_to,audio_type FROM ${access.table} WHERE id=? AND sender=? AND ${access.column}=?`).bind(message,user.userId,scope).first<VoiceAttemptRow>();if(existing&&existing.audio_duration===duration&&existing.reply_to===replyTo&&existing.audio_type===type)return json({ok:true});throw new SafetyError('Conversation changed. Voice note was not sent.',403);}
 key='';if(kind==='direct'){const pair=await db().prepare('SELECT sender,recipient FROM connections WHERE id=?').bind(scope).first<ConnectionRow>();if(pair)await recordTwoWay(db(),scope,pair.sender,pair.recipient,user.userId);await notify(access.other,user.userId,'message',scope,'New private message','#chat/'+encodeURIComponent(scope),message);}else await notifyCircle(scope,user.userId,message);return json({ok:true});
 }catch(e){if(key&&env.BUCKET)await env.BUCKET.delete(key);return failure(e);}}
