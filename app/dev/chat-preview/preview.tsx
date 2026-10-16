'use client';
import {useCallback,useState} from 'react';
import Link from 'next/link';

// Replays the same fictional conversation inside real browser viewports.
const presets=[
 {label:'Small phone',width:320,height:568},
 {label:'Phone',width:390,height:844},
 {label:'Large phone',width:430,height:932},
 {label:'Tablet',width:768,height:1024},
 {label:'Desktop',width:1280,height:800},
];

export default function ChatPreview(){
 const [size,setSize]=useState(presets[1]);
 const [keyboard,setKeyboard]=useState(false);
 const sendKeyboard=useCallback((open:boolean)=>{
  setKeyboard(open);
  document.querySelector<HTMLIFrameElement>('.qa-preview-frame')?.contentWindow?.postMessage({type:'real-love-qa-keyboard',open},window.location.origin);
 },[]);
 function choose(next:typeof presets[number]){setSize(next);sendKeyboard(false);}
 return <main className="qa-preview-page">
  <header className="qa-preview-heading"><div><p className="eyebrow">LOCAL TEST TOOL</p><h1>Chat viewport preview</h1><p>One fictional conversation, rendered at different screen sizes. Nothing is recorded or sent to Real Love.</p></div><Link className="text-button" href="/">Return to app</Link></header>
  <section className="qa-preview-controls" aria-label="Preview controls">
   <label>Screen size<select value={size.label} onChange={event=>choose(presets.find(item=>item.label===event.target.value)||presets[1])}>{presets.map(item=><option key={item.label}>{item.label}</option>)}</select></label>
   <span className="qa-preview-dimensions">{size.width} × {size.height} CSS px</span>
   <button type="button" className="secondary" disabled={size.width>720} aria-pressed={keyboard} onClick={()=>sendKeyboard(!keyboard)}>{keyboard?'Hide':'Show'} keyboard</button>
  </section>
  <div className="qa-preview-stage"><iframe className="qa-preview-frame" data-screen={size.width} title={'Fictional chat at '+size.label+' size'} src="/dev/chat-preview/session"/></div>
  <p className="field-help">Use the size selector to repeat the same scenario. The keyboard control simulates the reduced visible viewport on phones.</p>
 </main>;
}
