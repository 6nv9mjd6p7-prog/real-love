'use client';
import {useEffect,useId,useRef,useState,type ReactNode} from 'react';
import {SlidersHorizontal} from 'lucide-react';

// Keep filter fields mounted so closing the panel preserves unfinished rules and views.
export default function DiscoveryToolbar({search,shortcuts,filterCount,children}:{search:ReactNode;shortcuts:ReactNode;filterCount:number;children:ReactNode}){
 const [open,setOpen]=useState(false),id=useId(),trigger=useRef<HTMLButtonElement>(null),heading=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{if(open)heading.current?.focus();},[open]);
 return <div className="discovery-toolbar compact-discovery-toolbar">
  {search}
  <button ref={trigger} type="button" className="secondary discovery-filter-toggle" aria-expanded={open} aria-controls={id} onClick={()=>setOpen(value=>!value)}><SlidersHorizontal size={18} aria-hidden="true"/><span>Filters{filterCount?' · '+filterCount:''}</span>{filterCount>0&&<span className="sr-only"> active</span>}</button>
  {shortcuts}
  <section id={id} className="discovery-filters discovery-filter-panel" role="region" aria-labelledby={id+'-title'} hidden={!open} onKeyDown={event=>{if(event.key==='Escape'){event.preventDefault();setOpen(false);trigger.current?.focus();}}}>
   <div className="discovery-filter-heading"><h2 ref={heading} id={id+'-title'} tabIndex={-1}>Filters</h2><button type="button" className="text-button" onClick={()=>{setOpen(false);trigger.current?.focus();}}>Done</button></div>
   {children}
  </section>
 </div>;
}
