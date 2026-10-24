 'use client';
import {useId,useRef} from 'react';
import {Search} from 'lucide-react';
export default function DiscoverySearch({value,onChange}:{value:string;onChange:(value:string)=>void}){
 const id=useId(),input=useRef<HTMLInputElement>(null);
 return <div className="discovery-search-field"><label htmlFor={id}>Search interests, questions, and perspectives</label><div className="discovery-search-input"><Search size={18} aria-hidden="true"/><input ref={input} id={id} type="search" maxLength={120} aria-describedby={id+'-help'} value={value} onChange={e=>onChange(e.target.value)} placeholder="Try history or belonging"/>{value&&<button type="button" className="text-button" onClick={()=>{onChange('');input.current?.focus();}}>Clear search</button>}</div><p id={id+'-help'} className="field-help">Search what people chose to share. A match is a starting point for conversation.</p></div>;
}
