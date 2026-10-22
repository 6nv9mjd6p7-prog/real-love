'use client';
import {useState,useEffect,useRef} from 'react';
import type {CircleSummary} from './circle-experience';
type Member={id:string;name:string;role:string;status:string;mine?:boolean;hostInvited?:boolean};
export default function CircleManagement({circle,members,disabled,onAction,handoverRequested=false,onHandoverShown}:{circle:CircleSummary;members:Member[];disabled:boolean;handoverRequested?:boolean;onHandoverShown?:()=>void;onAction:(data:Record<string,unknown>,success:string)=>Promise<boolean>}){
 const [baseline,setBaseline]=useState({description:circle.description,activity:circle.activity});
 const [description,setDescription]=useState(circle.description),[activity,setActivity]=useState(circle.activity),[candidate,setCandidate]=useState('');
 const management=useRef<HTMLDetailsElement>(null);
 useEffect(()=>{if(handoverRequested&&!disabled&&management.current){revealCircleHandover(management.current);onHandoverShown?.();}},[handoverRequested,disabled,onHandoverShown]);
 const dirty=description!==baseline.description||activity!==baseline.activity;
 if(!dirty&&(baseline.description!==circle.description||baseline.activity!==circle.activity)){setBaseline({description:circle.description,activity:circle.activity});setDescription(circle.description);setActivity(circle.activity);}
 if(circle.role!=='host')return circle.hostInvitation?<section className="circle-host-invitation form-section"><h2>Co-host invitation</h2><p>A host invited you to help manage this circle. Hosts can edit its purpose and next activity, review membership, and close the circle. This does not appoint a union or legal representative.</p><p className="field-help">Accept only if you want this responsibility. Your message history still starts when you joined. The last host must hand over or explicitly close the circle before leaving.</p><div className="inline-actions"><button type="button" className="primary" disabled={disabled} onClick={()=>onAction({action:'accept_host',circle:circle.id},'You accepted the co-host role.')}>Accept co-host role</button><button type="button" className="text-button" disabled={disabled} onClick={()=>onAction({action:'decline_host',circle:circle.id},'Co-host invitation declined.')}>Decline</button></div></section>:null;
 const candidates=members.filter(m=>m.status==='accepted'&&m.role!=='host'&&!m.mine&&!m.hostInvited);
 return <details className="circle-management" ref={management}><summary>Manage circle{circle.hostCount===1?' · choose a co-host':''}</summary>
 <p className="field-help">Hosts share the same management powers. If one leaves, the remaining host continues and should choose a new co-host. No role changes until the invited member accepts.</p>
 {circle.hostCount===1&&<form className="circle-edit-form circle-handover" onSubmit={async e=>{e.preventDefault();if(await onAction({action:'invite_host',circle:circle.id,target:candidate},'Co-host invitation sent. Wait for their acceptance before handing over.'))setCandidate('');}}>
 <h2 tabIndex={-1}>Choose a co-host</h2><p>You are the remaining host. Invite a current member to share responsibility. You can leave after another host has accepted, or explicitly close the circle.</p>
 <label>Current member<select required disabled={disabled||!candidates.length} value={candidate} onChange={e=>setCandidate(e.target.value)}><option value="">Choose a member</option>{candidates.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
 {!candidates.length&&<p className="field-help">No eligible members to invite here. Review pending invitations below, or welcome a new member first.</p>}
 <button className="secondary" disabled={disabled||!candidate}>Invite to co-host</button>
 </form>}
 <form className="circle-edit-form" onSubmit={async e=>{e.preventDefault();if(await onAction({action:'update_circle',circle:circle.id,description:description.trim(),activity:activity.trim(),expectedDescription:baseline.description,expectedActivity:baseline.activity},'Circle information updated.')){setBaseline({description:description.trim(),activity:activity.trim()});setDescription(description.trim());setActivity(activity.trim());}}}>
 <p><strong>{circle.title}</strong><span className="field-help"> · Circle title stays fixed.</span></p>
 <label>Circle purpose<textarea required minLength={10} maxLength={800} disabled={disabled} value={description} onChange={e=>setDescription(e.target.value)}/></label>
 <label>Next activity<textarea required minLength={5} maxLength={400} disabled={disabled} value={activity} onChange={e=>setActivity(e.target.value)}/></label>
 <p className="field-help">These changes appear wherever the circle’s existing listing is available. Unlisted circles stay unlisted. Privacy, membership rules, and message access stay the same.</p>
 <button className="primary" disabled={disabled||!dirty||description.trim().length<10||activity.trim().length<5}>Save circle information</button>
 </form>
 {members.filter(m=>m.status==='accepted'&&m.role!=='host'&&m.hostInvited).map(m=><div key={m.id} className="circle-member"><span>{m.name} · co-host invitation pending</span><button type="button" className="text-button" disabled={disabled} onClick={()=>onAction({action:'cancel_host_invite',circle:circle.id,target:m.id},'Co-host invitation cancelled.')}>Cancel co-host invitation</button></div>)}
 </details>;
}

export function revealCircleHandover(root:HTMLDetailsElement){
 root.open=true;
 const field=root.querySelector('.circle-handover select') as unknown as HTMLSelectElement|null;
 const target=field&&!field.disabled?field:root.querySelector('.circle-handover h2') as unknown as HTMLElement|null;
 target?.focus({preventScroll:true});
 target?.scrollIntoView({block:'center',behavior:'auto'});
}
