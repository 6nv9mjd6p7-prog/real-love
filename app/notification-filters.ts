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
 if(kind==='message'||kind==='reaction')return 'chats';
 if(kind==='invitation'||kind==='accepted'||kind==='photo_exchange')return 'connections';
 return 'account';
}

export function filterNotifications<T extends {kind:string}>(items:T[],filter:NotificationFilter):T[]{
 return filter==='all'?items:items.filter(item=>notificationCategory(item.kind)===filter);
}

export function unreadNotificationCount<T extends {kind:string;read:number}>(items:T[],filter:NotificationFilter):number{
 return filterNotifications(items,filter).filter(item=>!item.read).length;
}
