export const reactionOptions=[{emoji:'❤️',label:'Love'},{emoji:'👍',label:'Like'},{emoji:'👎',label:'Dislike'},{emoji:'😂',label:'Laugh'},{emoji:'‼️',label:'Emphasis'},{emoji:'❓',label:'Question'}] as const;
export type MessageReaction={emoji:string;count:number;mine:boolean};
export type ReplyPreview={id:string;body:string;name:string;mine:boolean};
export const EDIT_WINDOW_MS=15*60*1000,DELETE_WINDOW_MS=2*60*1000,MAX_MESSAGE_EDITS=5;
export function messageLengthAnnouncement(length:number,max=1500,start=1200,step=100){return length<start?0:Math.min(max,start+Math.floor((length-start)/step)*step);}
export type MessageExtras={audio?:{url:string;duration:number}|null;image?:{url:string}|null;editedAt?:string;deletedAt?:string;editCount?:number;editHistory?:{body:string;at:string}[]};
export function messageChangeAllowed(created:string,window:number,now=Date.now()){const age=now-Date.parse(created);return Number.isFinite(age)&&age>=0&&age<window;}
export function swipeReply(dx:number,dy:number){return dx>=60&&Math.abs(dy)<30;}
export function messageFingerprint(text:string,replyTo=''){return replyTo?JSON.stringify([replyTo,text.trim()]):text.trim();}
