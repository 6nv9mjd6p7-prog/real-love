export type NotificationFilter='all'|'chats'|'connections'|'circles'|'account';
export const notificationFilterOptions:{key:NotificationFilter;label:string}[]=[
 {key:'all',label:'All'},
 {key:'chats',label:'Chats'},
 {key:'connections',label:'Connections'},
 {key:'circles',label:'Circles'},
 {key:'account',label:'Account'}
];

// Group only by notification kind; private titles and message text are not inspected.
export function notificationCategory(kind:string):Exclude<NotificationFilter,'all'>{
 if(kind.startsWith('circle_'))return 'circles';
 if(kind==='message'||kind==='reaction'||kind==='private_plan')return 'chats';
 if(kind==='invitation'||kind==='accepted'||kind==='photo_exchange')return 'connections';
 return 'account';
}

export function filterNotifications<T extends {kind:string}>(items:T[],filter:NotificationFilter):T[]{
 return filter==='all'?items:items.filter(item=>notificationCategory(item.kind)===filter);
}

export function unreadNotificationCount<T extends {kind:string;read:number}>(items:T[],filter:NotificationFilter):number{
 return filterNotifications(items,filter).filter(item=>!item.read).length;
}

export function notificationFilterAnnouncement(filter:NotificationFilter,count:number):string{
 const label=notificationFilterOptions.find(option=>option.key===filter)?.label||'All';
 return `${label} activity: ${count} notification${count===1?'':'s'}.`;
}

// Compact message activity only; preserve each event and keep consent/safety alerts separate.
export function groupMessageNotifications<T extends {id:string;kind:string;url:string;available?:boolean}>(items:T[]):{key:string;items:T[]}[]{
 const groups:{key:string;items:T[]}[]=[],byConversation=new Map<string,{key:string;items:T[]}>();
 for(const item of items){
  const message=item.available!==false&&((item.kind==='message'&&item.url.startsWith('#chat/'))||(item.kind==='circle_message'&&item.url.startsWith('#circles/')&&!item.url.endsWith('/requests')));
  const key=message?item.kind+':'+item.url:'event:'+item.id;
  let group=message?byConversation.get(key):undefined;
  if(!group){group={key,items:[]};groups.push(group);if(message)byConversation.set(key,group);}
  group.items.push(item);
 }
 return groups;
}
