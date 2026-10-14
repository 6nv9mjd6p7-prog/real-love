export type CampaignView={tab:string;selected:string;compose:boolean;scroll:number;depth:number};
export const defaultCampaignView:CampaignView={tab:'Explore',selected:'',compose:false,scroll:0,depth:0};
// History stores only navigation context, never proposal text, consent, or participation.
export function readCampaignView(account:string):CampaignView{
 if(typeof window==='undefined')return {...defaultCampaignView};
 const saved=history.state?.realLoveCampaign;
 if(saved?.account!==account)return {...defaultCampaignView};
 const value=saved.view;return {tab:['Explore','My activity','Review'].includes(value?.tab)?value.tab:'Explore',selected:typeof value?.selected==='string'?value.selected:'',compose:value?.compose===true,scroll:Number.isFinite(value?.scroll)?Math.max(0,value.scroll):0,depth:Number.isSafeInteger(value?.depth)?Math.max(0,value.depth):0};
}
export function saveCampaignView(account:string,view:Omit<CampaignView,'depth'>,replace=false){
 const previous=readCampaignView(account),state=history.state||{};
 history.replaceState({...state,realLoveCampaign:{account,view:{...previous,scroll:window.scrollY}}},'');
 const next={...view,depth:replace?previous.depth:previous.depth+1};
 history[replace?'replaceState':'pushState']({...history.state,realLoveCampaign:{account,view:next}},'');
 return next;
}
