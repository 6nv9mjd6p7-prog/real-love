import {profileInterests,type Profile} from './model';
import type {MessageExtras,MessageReaction,ReplyPreview} from './chat-tools';
export type ChatMessage=MessageExtras&{id:string;body:string;created:string;mine:boolean;reply?:ReplyPreview|null;replyUnavailable?:boolean;reactions?:MessageReaction[]};
export function conversationPrompts(me:Profile|null|undefined,person:Profile):string[]{
 const mine=new Set(me?profileInterests(me).map(x=>x.toLowerCase()):[]);
 const shared=profileInterests(person).find(x=>mine.has(x.toLowerCase()));
 return [shared?`What drew you to ${shared}?`:'What has held your interest lately?',
 'What is something you enjoyed this week?',
 'What kind of pace works for you when staying in touch?'];
}
export function appendPrompt(draft:string,prompt:string,max=1500):string|null{
 const next=draft.trim()?draft+'\n\n'+prompt:prompt;return next.length<=max?next:null;
}
export function incomingSince(previous:ChatMessage[],next:ChatMessage[]):number{
 const seen=new Set(previous.map(m=>m.id));return next.filter(m=>!m.mine&&!seen.has(m.id)).length;
}
export function nearMessageBottom(scrollTop:number,clientHeight:number,scrollHeight:number){return scrollHeight-scrollTop-clientHeight<=64;}
export function messageDay(created:string){return new Date(created).toLocaleDateString([],{year:'numeric',month:'short',day:'numeric'});}
