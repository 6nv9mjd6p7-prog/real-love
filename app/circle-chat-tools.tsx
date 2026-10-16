'use client';
import {useState,type ReactNode} from 'react';

export default function CircleChatTools({children,initialOpen=false}:{children:ReactNode;initialOpen?:boolean}){
 const [open,setOpen]=useState(initialOpen);
 return <details className="circle-chat-tools" open={open} onToggle={event=>setOpen(event.currentTarget.open)}>
  <summary>Circle tools <span>Together, activity &amp; search</span></summary>
  <div className="circle-chat-tools-content">{children}</div>
 </details>;
}
