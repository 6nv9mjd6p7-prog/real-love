export type CircleSummary={category?:string;membershipRules?:string;id:string;inviteId?:string|null;title:string;description:string;tags:string[];activity:string;status:string;membership:string|null;role:string|null;canApprove:boolean;awaitingYourAgreement?:boolean;count:number;restricted?:boolean;reportTarget?:string;joinRequests?:number};
export type CircleSection='Discover'|'Joined'|'Requests';
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
export function circleGroups(circles:CircleSummary[],section:CircleSection,query:string){
 const matches=(c:CircleSummary)=>[c.title,c.description,c.membershipRules,c.activity,...c.tags].join(' ').toLowerCase().includes(query.trim().toLowerCase());
 if(section==='Requests')return ['Founder proposals','Requests to your circles','Your join requests','Organizing-circle invitations'].map(title=>({title,circles:circles.filter(c=>circleRequestGroup(c)===title&&matches(c))})).filter(g=>g.circles.length);
 return [{title:section==='Joined'?'Your circles':'Explore circles',circles:circles.filter(c=>c.status==='open'&&(section!=='Joined'||c.membership==='accepted')&&matches(c))}];
}
