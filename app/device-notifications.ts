const ownerKey='real-love-notification-account';
export function notificationOwner(){try{return localStorage.getItem(ownerKey);}catch{return null;}}
export function rememberNotificationOwner(account:string){try{if(account)localStorage.setItem(ownerKey,account);else localStorage.removeItem(ownerKey);}catch{}}
export async function disableDeviceNotifications(account:string){
 if(!('serviceWorker' in navigator))return;
 const registration=await navigator.serviceWorker.getRegistration('/'),subscription=await registration?.pushManager.getSubscription();
 if(subscription){try{await fetch('/api/notifications',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'unsubscribe',endpoint:subscription.endpoint,expectedAccount:account}),signal:AbortSignal.timeout(5000)});}catch{}await subscription.unsubscribe();}
 rememberNotificationOwner('');for(const notification of await registration?.getNotifications()||[])notification.close();
 try{await (navigator as Navigator&{clearAppBadge?:()=>Promise<void>}).clearAppBadge?.();}catch{}
}
