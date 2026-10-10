'use client';
import {useState} from 'react';
import {locationKey,locationLabel,type BroadLocation} from './location';

export default function LocationEditor({accountId,form,setForm,me,busy}:{accountId:string;form:any;setForm:(value:any)=>void;me:any;busy:boolean}){
 const [suggestion,setSuggestion]=useState<BroadLocation|null>(null),[finding,setFinding]=useState(false),[message,setMessage]=useState('');
 const confirmed=!!me?.locationConfirmed&&locationKey(form)===locationKey(me)&&!form.confirmLocation;
 const change=(field:keyof BroadLocation,value:string)=>setForm((previous:any)=>({...previous,[field]:value,confirmLocation:false}));
 async function find(){
  if(finding)return;setFinding(true);setMessage('');
  try{const response=await fetch('/api/app',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'connection_location',expectedAccount:accountId})});const data:any=await response.json();if(!response.ok)throw Error(data.error||'Your connection area could not be checked.');setSuggestion(data.location);}
  catch(e:any){setSuggestion(null);setMessage(e.message||'Your connection area could not be checked.');}
  finally{setFinding(false);}
 }
 return <div className="location-editor"><div className="form-grid"><label>State, province, or region (required)<input disabled={busy} required autoComplete="address-level1" maxLength={80} value={form.region||''} placeholder="Texas" onChange={event=>change('region',event.target.value)}/></label><label>Country (required)<input disabled={busy} required autoComplete="country-name" maxLength={80} value={form.country||''} placeholder="United States" onChange={event=>change('country',event.target.value)}/></label></div><div className="location-check"><strong>{confirmed?'Area confirmed recently':form.confirmLocation?'Ready to confirm when you save':'Area not confirmed'}</strong><p className="field-help">Confirmation compares this broad area with the approximate area of your current internet connection. It does not verify identity, residence, or an exact position. No IP address or coordinates are saved.</p><button type="button" className="secondary" disabled={busy||finding} onClick={find}>{finding?'Checking connection…':'Find my connection area'}</button>{suggestion&&<div className="location-suggestion" role="status"><span>Connection area: {locationLabel(suggestion)}</span><button type="button" className="secondary" disabled={busy} onClick={()=>{setForm((previous:any)=>({...previous,...suggestion,confirmLocation:true}));setMessage('Save your profile to confirm this area.');}}>Use this area</button></div>}{message&&<p className="field-help" role="status">{message}</p>}</div></div>;
}
