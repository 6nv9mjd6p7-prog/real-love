'use client';
import {useEffect,useId,useState} from 'react';
export default function DiscoveryAgeRange({min,max,onChange}:{min:number;max:number;onChange:(min:number,max:number)=>void}){
 const [lower,setLower]=useState(String(min)),[upper,setUpper]=useState(String(max)),id=useId();
 useEffect(()=>{setLower(String(min));setUpper(String(max));},[min,max]);
 function commit(which:'min'|'max',raw:string){const parsed=raw.trim()?Number(raw):NaN;if(!Number.isFinite(parsed)){setLower(String(min));setUpper(String(max));return;}const next=Math.max(18,Math.min(99,Math.trunc(parsed)));if(which==='min'){const low=Math.min(next,max);setLower(String(low));onChange(low,max);}else{const high=Math.max(next,min);setUpper(String(high));onChange(min,high);}}
 return <fieldset className="discovery-age-range"><legend>Age range</legend><div><label>Minimum age<input type="number" min={18} max={max} inputMode="numeric" aria-describedby={id} value={lower} onChange={e=>setLower(e.target.value)} onBlur={e=>commit('min',e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();commit('min',e.currentTarget.value);}}}/></label><label>Maximum age<input type="number" min={min} max={99} inputMode="numeric" aria-describedby={id} value={upper} onChange={e=>setUpper(e.target.value)} onBlur={e=>commit('max',e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();commit('max',e.currentTarget.value);}}}/></label></div><p id={id} className="field-help">Ages 18–99. Leave the field or press Enter to apply. Your profile’s connection age range still applies.</p></fieldset>;
}
