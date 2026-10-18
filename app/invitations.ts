import {profileInterests,type Profile} from './model';
export type InvitationContext={key:string;label:string;text:string};
// Only public, voluntarily shared answers can become invitation context.
export function invitationContexts(person:Profile):InvitationContext[]{
 const fields:[string,string][]=[['question','A question I carry'],['perspective','My perspective'],['care','What I care about'],['startIdea','What I’d enjoy exploring'],['about',person.introPrompt||'Introduction'],['offer','What I can offer'],['support','What I’d appreciate'],['responsibility','Taking responsibility'],['space','Respecting space'],['growth','What I’m working on'],['firstStep','Optional activity idea']];
 return [...profileInterests(person).map(text=>({key:'interest:'+text,label:'Interest',text})),...fields.flatMap(([key,label])=>{const text=person[key as keyof Profile];return typeof text==='string'&&text.trim()?[{key,label,text}]:[];})];
}
export function invitationOpening(context:InvitationContext):string{
 const text=context.text.trim();
 if(context.key.startsWith('interest:'))return `What got you interested in ${text}?`;
 if(context.key==='question')return 'What makes that question interesting to you?';
 if(context.key==='perspective')return 'What led you to that perspective?';
 if(context.key==='care')return 'What made you care about that?';
 if(context.key==='startIdea')return 'What interests you most about exploring that?';
 if(context.key==='about')return 'I’d like to hear more about that. What would you want someone to understand about it?';
 if(context.key==='offer')return 'What do you enjoy most about offering that?';
 if(context.key==='support')return 'What kind of support feels most useful to you?';
 if(context.key==='responsibility')return 'What helped you arrive at that way of thinking about responsibility?';
 if(context.key==='space')return 'What does respecting space look like to you in practice?';
 if(context.key==='growth')return 'What has been most interesting about working on that?';
 if(context.key==='firstStep')return 'What makes that something you’d enjoy doing?';
 return 'I’d like to hear more about that.';
}

export function invitationStatus(c:{status:string;incoming:boolean;closure_kind?:string}){
 if(c.status==='pending')return c.incoming?'Awaiting your response':'Awaiting their response';
 if(c.status==='accepted')return 'Accepted';
 if(c.closure_kind==='declined')return c.incoming?'You declined':'Declined';
 if(c.closure_kind==='withdrawn')return c.incoming?'Withdrawn by sender':'You withdrew';
 return c.closure_kind==='ended'?'Connection ended':'Closed';
}
