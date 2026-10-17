import {locationKey,CIRCLE_DISTANCE_CHOICES,type BroadLocation} from './location';
export type CircleSummary={hostCount?:number;hostInvitation?:boolean;nearbyEnabled?:boolean;distanceMiles?:number|null;area?:BroadLocation|null;category?:string;membershipRules?:string;id:string;inviteId?:string|null;title:string;description:string;tags:string[];activity:string;status:string;membership:string|null;role:string|null;canApprove:boolean;awaitingYourAgreement?:boolean;count:number;restricted?:boolean;reportTarget?:string;joinRequests?:number};
export type CircleSection='Discover'|'Joined'|'Requests';
// Explicit chat entry wins; reopening otherwise keeps a still-eligible draft choice.
export function circleFounderConnection(connections:readonly {id:string;status:string;available?:boolean}[],draft='',requested=''){
 const eligible=connections.filter(c=>c.status==='accepted'&&c.available!==false);
 return [requested,draft].find(id=>!!id&&eligible.some(c=>c.id===id))||eligible[0]?.id||'';
}
export function circleStatus(c:CircleSummary){
 if(c.status==='pending')return c.awaitingYourAgreement||c.canApprove?'Your agreement needed':'Awaiting the other founder';
 if(c.restricted)return 'Participation restricted';
 if(c.membership==='requested')return 'Join request pending';
 if(c.membership==='invited')return 'Private invitation';
 if(c.membership==='removed')return 'Participation unavailable';
 if(c.membership==='accepted')return c.role==='host'?'You’re a host':'You’re a member';
 return 'Open to join requests';
}
export function circleRequestGroup(c:CircleSummary){
 if(c.status==='pending')return 'Founder proposals';
 if((c.joinRequests??0)>0&&c.membership==='accepted'&&c.role==='host')return 'Requests to your circles';
 if(c.membership==='requested')return 'Your join requests';
 if(c.membership==='invited')return 'Organizing-circle invitations';
 return null;
}
export function circleGroups(circles:CircleSummary[],section:CircleSection,query:string,area?:BroadLocation|null,nearbyMiles?:number){
 const matches=(c:CircleSummary)=>[c.title,c.description,c.membershipRules,c.activity,c.area?.city,c.area?.region,c.area?.country,...c.tags].join(' ').toLowerCase().includes(query.trim().toLowerCase());
 if(section==='Requests')return ['Founder proposals','Requests to your circles','Your join requests','Organizing-circle invitations'].map(title=>({title,circles:circles.filter(c=>circleRequestGroup(c)===title&&matches(c))})).filter(g=>g.circles.length);
 return [{title:section==='Joined'?'Your circles':'Explore circles',circles:circles.filter(c=>c.status==='open'&&(section!=='Discover'||(nearbyMiles!==undefined?(CIRCLE_DISTANCE_CHOICES as readonly number[]).includes(nearbyMiles)&&c.nearbyEnabled===true&&typeof c.distanceMiles==='number'&&Number.isFinite(c.distanceMiles)&&c.distanceMiles>=5&&c.distanceMiles<=nearbyMiles:!area||!!locationKey(area)&&locationKey(c.area??{})===locationKey(area)))&&(section!=='Joined'||c.membership==='accepted')&&matches(c))}];
}
