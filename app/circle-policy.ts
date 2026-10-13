/**
 * Checks whether a join request is still available under account and block rules before exposing it to a host.
 * Reading guide: docs/CODE_READING_GUIDE.md.
 */
import {env} from 'cloudflare:workers';
import {activeMember} from './safety';
// A request is actionable only while its applicant can interact and has no
// blocked relationship with any current participant. Do not expose why.
export async function joinRequestAvailable(circle:string,applicant:string){
 if(!await activeMember(applicant))return false;
 const block=await env.DB!.prepare("SELECT 1 FROM circle_members p JOIN blocks b ON ((b.actor=p.member AND b.target=?) OR (b.actor=? AND b.target=p.member)) WHERE p.circle=? AND p.status='accepted' LIMIT 1").bind(applicant,applicant,circle).first();
 return !block;
}
