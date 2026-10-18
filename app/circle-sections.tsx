'use client';
import {MessageCircle,Users,CalendarDays} from 'lucide-react';
const sections=[['Chat',MessageCircle],['Plan',CalendarDays],['People',Users]] as const;
export type CircleView=typeof sections[number][0];
const sectionLabels:Record<CircleView,string>={Chat:'Chat',Plan:'Plan',People:'Members'};
export default function CircleSections({circleId,value,onChange,disabled=false}:{disabled?:boolean;circleId:string;value:CircleView;onChange:(value:CircleView)=>void}){
 return <div className="circle-section-tabs" role="tablist" aria-label="Circle sections">{sections.map(([section,Icon],index)=><button key={section} type="button" role="tab" disabled={disabled} title={disabled?"Finish or discard your voice note, or wait for the photo upload, before switching sections.":undefined} id={'circle-tab-'+section+'-'+circleId} aria-controls={'circle-panel-'+section+'-'+circleId} aria-selected={value===section} tabIndex={value===section?0:-1} onClick={()=>onChange(section)} onKeyDown={event=>{
  const next=event.key==='ArrowRight'?(index+1)%3:event.key==='ArrowLeft'?(index+2)%3:event.key==='Home'?0:event.key==='End'?2:null;
  if(disabled||next===null)return;event.preventDefault();onChange(sections[next][0]);
  event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
 }}><Icon size={19} aria-hidden="true"/><span>{sectionLabels[section]}</span></button>)}</div>;
}
