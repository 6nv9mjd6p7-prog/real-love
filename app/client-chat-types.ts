import type {Profile} from './model';
import type {ChatMessage} from './conversation-tools';
export type ConversationConnection={id:string;person:Profile;status?:string;available?:boolean;incoming?:boolean;proposal?:string;context?:{label:string;text:string}|null;photoMine?:boolean;photoOther?:boolean;photoState?:string;photosShared?:boolean;photoOngoingMine?:boolean;photoOngoingOther?:boolean};
export type MessagePage<T extends {id:string}=ChatMessage>={messages:T[];cursor:number|null;hasMore:boolean;revision?:string;readCursor?:number;unchanged?:false};
export type MessageApi<T extends MessagePage>=(input:Record<string,unknown>)=>Promise<T|{unchanged:true;revision?:string;readCursor?:number}>;
export type CircleChatMessage=ChatMessage&{sender:string;name:string;rowid?:number;cooperation_kind?:string;cooperation_status?:string};
export type CircleMember={id:string;name:string;role:string;status:string;mine:boolean;hostInvited:boolean;canAdmit:boolean};
export type CircleMessagePage=MessagePage<CircleChatMessage>&{members:CircleMember[];pendingInvites?:string[]};
