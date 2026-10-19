export const privatePlanKinds=[['activity','Activity'],['offer','Offer'],['request','Request'],['project','Project']] as const;
export type PrivatePlan={id:string;creator:string;kind:string;description:string;timing:string;startsAt:string;status:string;revision:number;created:string;mine:boolean};
export function privatePlanNext(status:string,mine:boolean,action:string){
 if(status==='proposed'&&!mine&&(action==='accept'||action==='decline'))return action==='accept'?'accepted':'declined';
 if((status==='proposed'||status==='accepted')&&mine&&action==='cancel')return 'cancelled';
 if(status==='accepted'&&action==='complete')return 'completed';
 return null;
}
export function privatePlanDraft(input:Record<string,unknown>,now:number){
 const kind=String(input.kind||''),description=typeof input.description==='string'?input.description.trim():'',timing=typeof input.timing==='string'?input.timing.trim():'',startsAt=typeof input.startsAt==='string'?input.startsAt:'';
 if(!privatePlanKinds.some(([key])=>key===kind)||description.length<10||description.length>1000||timing.length>100||input.planConsent!==true)throw Error('Choose a plan type, write 10–1,000 characters, and confirm the limits.');
 if(startsAt&&(!Number.isFinite(Date.parse(startsAt))||new Date(startsAt).toISOString()!==startsAt||Date.parse(startsAt)<=now||Date.parse(startsAt)>now+2*365*86400000))throw Error('Choose a future date within two years, or leave the time open.');
 return {kind,description,timing,startsAt};
}
