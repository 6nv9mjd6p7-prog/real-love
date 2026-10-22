'use client';
import {useEffect,useRef} from 'react';

// The image owns its temporary URL for exactly as long as this selection is shown.
export default function SelectedPhotoPreview({photo,alt}:{photo:Blob;alt:string}){
 const image=useRef<HTMLImageElement>(null);
 useEffect(()=>{
  const element=image.current;if(!element)return;
  const url=URL.createObjectURL(photo);element.src=url;
  return()=>{element.removeAttribute('src');URL.revokeObjectURL(url);};
 },[photo]);
 return <img ref={image} alt={alt}/>;
}
