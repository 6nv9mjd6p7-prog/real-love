/**
 * Checks direct or circle access before voice storage operations. Audio follows the same relationship and membership boundaries as text.
 * Reading guide: docs/CODE_READING_GUIDE.md.
 */
import {env} from 'cloudflare:workers';
import {RULES_VERSION,SafetyError,activeMember} from './safety';
export async function voiceAccess(kind:string,scope:string,id:string){
 if(!['direct','circle'].includes(kind)||!scope||scope.length>200)throw new SafetyError('Conversation unavailable.',400);
 if(!await activeMember(id))throw new SafetyError('Activate your profile to use chat.',403);
 const db=env.DB!;
 if(kind==='direct'){
  const c=await db.prepare("SELECT * FROM connections WHERE id=? AND status='accepted' AND (sender=? OR recipient=?)").bind(scope,id,id).first<any>();
  if(!c)throw new SafetyError('Conversation unavailable.',403);const other=c.sender===id?c.recipient:c.sender;
  if(!await activeMember(other)||await db.prepare('SELECT actor FROM blocks WHERE (actor=? AND target=?) OR (actor=? AND target=?)').bind(id,other,other,id).first())throw new SafetyError('Conversation unavailable.',403);
  return {table:'messages',column:'connection',after:0,other,guard:"EXISTS (SELECT id FROM connections WHERE id=? AND status='accepted') AND (SELECT COUNT(*) FROM profiles p JOIN safety_accounts a ON a.id=p.id WHERE p.id IN (?,?) AND p.active=1 AND a.status='admitted' AND json_extract(p.data,'$.rulesVersion')=?)=2 AND NOT EXISTS (SELECT actor FROM blocks WHERE (actor=? AND target=?) OR (actor=? AND target=?))",values:[scope,id,other,RULES_VERSION,id,other,other,id]};
 }
 const m=await db.prepare("SELECT m.* FROM circle_members m JOIN circles c ON c.id=m.circle WHERE m.circle=? AND m.member=? AND m.status='accepted' AND c.status='open'").bind(scope,id).first<any>();
 if(!m)throw new SafetyError('Circle unavailable.',403);
 return {table:'circle_messages',column:'circle',after:m.history_after||0,other:'',guard:"EXISTS (SELECT id FROM circles WHERE id=? AND status='open') AND EXISTS (SELECT member FROM circle_members WHERE circle=? AND member=? AND status='accepted') AND EXISTS (SELECT p.id FROM profiles p JOIN safety_accounts a ON a.id=p.id WHERE p.id=? AND p.active=1 AND a.status='admitted' AND json_extract(p.data,'$.rulesVersion')=?)",values:[scope,scope,id,id,RULES_VERSION]};
}
