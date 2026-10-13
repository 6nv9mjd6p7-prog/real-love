/**
 * Selects profile answers that may be quoted in an invitation and translates invitation lifecycle state into human-readable labels.
 * Reading guide: docs/CODE_READING_GUIDE.md.
 */
import {profileInterests,type Profile} from './model';
export type InvitationContext={key:string;label:string;text:string};
// Only public, voluntarily shared answers can become invitation context.
export function invitationContexts(person:Profile):InvitationContext[]{
 const fields:[string,string][]=[['about',person.introPrompt||'Introduction'],['firstStep','Something to do together'],['question','A question I carry'],['care','What I care about'],['perspective','My perspective'],['startIdea','What I’d enjoy exploring'],['offer','What I can offer'],['support','What I’d appreciate'],['responsibility','Taking responsibility'],['space','Respecting space'],['growth','What I’m working on']];
 return [...profileInterests(person).map(text=>({key:'interest:'+text,label:'Interest',text})),...fields.flatMap(([key,label])=>{const text=person[key as keyof Profile];return typeof text==='string'&&text.trim()?[{key,label,text}]:[];})];
}
export function invitationStatus(c:{status:string;incoming:boolean;closure_kind?:string}){
 if(c.status==='pending')return c.incoming?'Awaiting your response':'Awaiting their response';
 if(c.status==='accepted')return 'Accepted';
 if(c.closure_kind==='declined')return c.incoming?'You declined':'Declined';
 if(c.closure_kind==='withdrawn')return c.incoming?'Withdrawn by sender':'You withdrew';
 return c.closure_kind==='ended'?'Connection ended':'Closed';
}
