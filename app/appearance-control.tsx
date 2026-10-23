'use client';
import {useEffect,useSyncExternalStore} from 'react';

type Appearance = 'glass' | 'solid';

const changeEvent='real-love:appearance-change';
function readAppearance():Appearance{
 if(typeof window==='undefined')return 'glass';
 try{const value=window.localStorage.getItem('real-love:appearance');if(value==='solid'||value==='glass')return value;}catch{}
 return 'glass';
}
function subscribeAppearance(onStoreChange:()=>void){
 if(typeof window==='undefined')return ()=>{};
 window.addEventListener(changeEvent,onStoreChange);window.addEventListener('storage',onStoreChange);
 return ()=>{window.removeEventListener(changeEvent,onStoreChange);window.removeEventListener('storage',onStoreChange);};
}
function saveAppearance(value:Appearance){
 try{window.localStorage.setItem('real-love:appearance',value);}catch{}
 document.documentElement.dataset.appearance=value;
 window.dispatchEvent(new Event(changeEvent));
}
export default function AppearanceControl(){
 const value=useSyncExternalStore(subscribeAppearance,readAppearance,()=> 'glass');
 useEffect(()=>{document.documentElement.dataset.appearance=value;},[value]);
 return <section className="appearance-setting" aria-labelledby="appearance-setting-title">
  <div>
   <h2 id="appearance-setting-title">Appearance</h2>
   <p className="field-help">Choose how the navigation surface looks. Your choice stays on this device.</p>
  </div>
  <fieldset className="appearance-options">
   <legend className="sr-only">Navigation appearance</legend>
   <label><input type="radio" name="navigation-appearance" value="glass" checked={value==='glass'} onChange={()=>saveAppearance('glass')}/> Glass navigation</label>
   <label><input type="radio" name="navigation-appearance" value="solid" checked={value==='solid'} onChange={()=>saveAppearance('solid')}/> Solid appearance</label>
  </fieldset>
 </section>;
}
