import {profileInterests,type Profile} from './model';
import type {MessageExtras,MessageReaction,ReplyPreview} from './chat-tools';
export type ChatMessage=MessageExtras&{id:string;body:string;created:string;mine:boolean;reply?:ReplyPreview|null;replyUnavailable?:boolean;reactions?:MessageReaction[]};
export function sharedConversationInterests(me:Profile|null|undefined,person:Profile):string[]{
 const mine=new Set(me?profileInterests(me).map(x=>x.toLowerCase()):[]);
 return profileInterests(person).filter(x=>mine.has(x.toLowerCase()));
}
export type ConversationAnchor={context?:{label?:string;text?:string}|null;proposal?:string;incoming?:boolean};
export function conversationPrompts(me:Profile|null|undefined,person:Profile,anchor?:ConversationAnchor):string[]{
 const shared=sharedConversationInterests(me,person)[0];
 const exactContext=anchor?.context?.text?.trim();
 const proposal=anchor?.proposal?.trim();
 const opener=exactContext?`You replied to “${exactContext}”. What would you like me to understand about it?`:proposal?`${anchor?.incoming?'You asked':'We started with'}, “${proposal}”. What would you like to explore next?`:shared?`What drew you to ${shared}?`:'What has held your interest lately?';
 return [opener,
 'What is something you enjoyed this week?',
 'If we explored that interest together, what would be a good first step?'];
}
export function appendPrompt(draft:string,prompt:string,max=1500):string|null{
 const next=draft.trim()?draft+'\n\n'+prompt:prompt;return next.length<=max?next:null;
}
export function incomingSince(previous:ChatMessage[],next:ChatMessage[]):number{
 const seen=new Set(previous.map(m=>m.id));return next.filter(m=>!m.mine&&!seen.has(m.id)).length;
}
export function nearMessageBottom(scrollTop:number,clientHeight:number,scrollHeight:number){return scrollHeight-scrollTop-clientHeight<=64;}
export function messageDay(created:string){return new Date(created).toLocaleDateString([],{year:'numeric',month:'short',day:'numeric'});}
