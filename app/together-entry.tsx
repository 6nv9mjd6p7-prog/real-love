'use client';
import {useId,useState} from 'react';
import type {CircleSummary} from './circle-experience';

export default function TogetherEntry({circles,active,busy,loading,failed,onOpen,onBrowse}:{circles:CircleSummary[];active:boolean;busy:boolean;loading:boolean;failed:boolean;onOpen:(circle:CircleSummary)=>void;onBrowse:()=>void}){
 const id=useId(),[choice,setChoice]=useState('');
 const joined=circles.filter(c=>c.membership==='accepted'&&c.status==='open'&&!c.restricted);
 const selected=joined.find(c=>c.id===choice);
 return <section className="together-entry" aria-labelledby={id}>
  <h2 id={id}>Together</h2>
  <p>Talk · Help · Do · Build</p>
  <p>Offer help, make a request, plan an activity, or build a project with your circle.</p>
  <p className="field-help">Posts stay inside the circle and its available history. Participation is always optional.</p>
  {!active?<p className="field-help">Resume participation to open Together.</p>:loading?<p role="status">Loading your circles…</p>:failed?<p className="field-help">Your circles could not load. Use “Retry loading circles” below to try again.</p>:joined.length?<form onSubmit={event=>{event.preventDefault();if(selected&&!busy)onOpen(selected);}}>
   <label htmlFor={id+'-circle'}>Choose a joined circle</label>
   <div className="together-entry-controls"><select id={id+'-circle'} value={selected?.id??''} disabled={busy} onChange={event=>setChoice(event.target.value)} required><option value="">Choose a circle</option>{joined.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}</select><button className="secondary" disabled={busy||!selected}>Open Together</button></div>
  </form>:<><p className="field-help">Join a circle or start one with an accepted connection to use Together.</p><button type="button" className="secondary" disabled={busy} onClick={onBrowse}>Browse circles</button></>}
 </section>;
}
