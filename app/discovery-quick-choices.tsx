'use client';
import type {ReactNode} from 'react';

// Quick choices narrow the same preferences as Filters; unrelated rules stay intact.
export default function DiscoveryQuickChoices({shared,location,onlineAvailable,onShared,onLocation,children}:{
 shared:boolean;location:'any'|'local'|'online';onlineAvailable:boolean;
 onShared:()=>void;onLocation:(value:'any'|'local'|'online')=>void;children:ReactNode;
}){
 return <div className="discovery-quick-choices">
  <div className="discovery-quick-buttons" role="group" aria-label="Quick discovery choices">
   <button type="button" aria-pressed={shared} onClick={onShared}>Shared interests</button>
   <button type="button" aria-pressed={location==='local'} onClick={()=>onLocation(location==='local'?'any':'local')}>Nearby</button>
   <button type="button" aria-pressed={location==='online'} disabled={!onlineAvailable} onClick={()=>onLocation(location==='online'?'any':'online')}>Online-friendly</button>
  </div>
  {!onlineAvailable&&<p className="field-help">To discover online-friendly people, enable online connections in My profile.</p>}
  <details className="discovery-topic-choices"><summary>Explore your interests</summary>{children}</details>
 </div>;
}
