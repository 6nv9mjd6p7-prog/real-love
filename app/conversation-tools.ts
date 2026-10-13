/**
 * Pure helpers for conversation prompts, unread additions, day labels, and proximity to the bottom of a message list.
 * Reading guide: docs/CODE_READING_GUIDE.md.
 */
import {profileInterests,type Profile} from './model';
import type {MessageExtras,MessageReaction,ReplyPreview} from './chat-tools';
export type ChatMessage=MessageExtras&{id:string;body:string;created:string;mine:boolean;reply?:ReplyPreview|null;replyUnavailable?:boolean;reactions?:MessageReaction[]};
// Build optional opening ideas from profile context without sending or saving a message.
export function conversationPrompts(me:Profile|null|undefined,person:Profile):string[]{
 const mine=new Set(me?profileInterests(me).map(x=>x.toLowerCase()):[]);
 const shared=profileInterests(person).find(x=>mine.has(x.toLowerCase()));
 return [shared?`What drew you to ${shared}?`:'What has held your interest lately?',
 'What is something you enjoyed this week?',
 'If we explored that interest together, what would be a good first step?'];
}
// Append only when the resulting draft fits its maximum length; otherwise return null for the caller to explain.
export function appendPrompt(draft:string,prompt:string,max=1500):string|null{
 const next=draft.trim()?draft+'\n\n'+prompt:prompt;return next.length<=max?next:null;
}
// Count newly arrived messages from the other person without treating already loaded history as new activity.
export function incomingSince(previous:ChatMessage[],next:ChatMessage[]):number{
 const seen=new Set(previous.map(m=>m.id));return next.filter(m=>!m.mine&&!seen.has(m.id)).length;
}
// Use a small pixel tolerance so read acknowledgements do not require exact scroll equality.
export function nearMessageBottom(scrollTop:number,clientHeight:number,scrollHeight:number){return scrollHeight-scrollTop-clientHeight<=64;}
// Format a local calendar label for message grouping.
export function messageDay(created:string){return new Date(created).toLocaleDateString([],{year:'numeric',month:'short',day:'numeric'});}
