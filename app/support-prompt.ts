const PREFIX='real-love-support-v1:';
export const SUPPORT_DELAY_MS=24*60*60*1000;
function key(account:string){return PREFIX+encodeURIComponent(account);}
export function clearSupportPrompts(storage:Storage|null,keepAccount?:string){try{for(let i=storage!.length-1;i>=0;i--){const item=storage!.key(i);if(item?.startsWith(PREFIX)&&item!== (keepAccount?key(keepAccount):null))storage!.removeItem(item);}}catch{}}
export function supportPromptReady(storage:Storage|null,account:string,experienced:boolean,now=Date.now()){
 if(!storage||!account||!experienced)return false;
 try{
  const raw=storage.getItem(key(account)),value=raw?JSON.parse(raw):null;
  if(value?.dismissed===true)return false;
  if(typeof value?.firstExperience==='number'&&Number.isFinite(value.firstExperience)&&value.firstExperience>=0&&value.firstExperience<=now)return now-value.firstExperience>=SUPPORT_DELAY_MS;
  storage.setItem(key(account),JSON.stringify({firstExperience:now,dismissed:false}));
 }catch{}
 return false;
}
export function dismissSupportPrompt(storage:Storage|null,account:string){try{if(account)storage?.setItem(key(account),JSON.stringify({dismissed:true}));}catch{}}
export function supportStorage():Storage|null{try{return typeof window==='undefined'?null:window.localStorage;}catch{return null;}}
