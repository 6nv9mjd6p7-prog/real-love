/**
 * Shows a photo only when the caller supplies mutual sharing and a usable photo flag. Otherwise renders a non-photo avatar; the image endpoint also checks access.
 * Reading guide: docs/CODE_READING_GUIDE.md.
 */

'use client';
import {useState,useEffect} from 'react';
import InteractivePhoto from './interactive-photo';
export default function SharedAvatar({person,shared,onProfile,onReport}:{onProfile?:()=>void;onReport?:()=>void;person:{id:string;name:string;hasPhoto?:boolean};shared:boolean}){
 const [failed,setFailed]=useState(false);
 useEffect(()=>setFailed(false),[person.id,person.hasPhoto,shared]);
 return shared&&person.hasPhoto&&!failed?<InteractivePhoto className="shared-avatar-trigger" src={'/api/photo?member='+encodeURIComponent(person.id)} label={person.name+'’s shared profile photo'} onProfile={onProfile} onReport={onReport} onThumbnailError={()=>setFailed(true)}/>:onProfile?<button type="button" className="shared-avatar avatar-placeholder" aria-label={'View '+person.name+'’s profile · photo private or unavailable'} onClick={onProfile}>{person.name.trim().slice(0,1).toUpperCase()||'?'}</button>:<span className="shared-avatar avatar-placeholder" aria-hidden="true">{person.name.trim().slice(0,1).toUpperCase()||'?'}</span>;
}
