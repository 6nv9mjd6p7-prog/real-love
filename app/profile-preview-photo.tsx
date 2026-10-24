'use client';
import {useState} from 'react';
import InteractivePhoto from './interactive-photo';

export default function ProfilePreviewPhoto({memberId,uploaded,selected='',version=0,description=''}:{memberId?:string;uploaded:boolean;selected?:string;version?:number;description?:string}){
 const src=selected||(uploaded&&memberId?'/api/photo?member='+encodeURIComponent(memberId)+'&v='+version:'');
 const [failedSrc,setFailedSrc]=useState(''),[retry,setRetry]=useState(0);
 if(!src)return null;
 const label=selected?'Selected profile photo preview':'Your uploaded profile photo';
 return <details className="preview-private-photo"><summary>Your private photo · only you in this preview</summary><div className="own-photo">{failedSrc===src?<div><p role="status">Your photo could not load.</p><button type="button" className="secondary" onClick={()=>{setFailedSrc('');setRetry(n=>n+1);}}>Retry photo</button></div>:<InteractivePhoto key={src+':'+retry} onThumbnailError={()=>setFailedSrc(src)} src={src} label={description?label+': '+description:label}/>}</div><p className="field-help">{selected?'This selected photo has not been uploaded yet. Save your profile to upload it.':'Your photo is visible to you here. Other members see it only after you both agree to share photos.'}</p></details>;
}
