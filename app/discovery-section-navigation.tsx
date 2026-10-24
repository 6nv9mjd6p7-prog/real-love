'use client';

export default function DiscoverySectionNavigation({current,onNavigate}:{current:string;onNavigate:(route:string)=>void}){
 return <nav className="section-tabs discovery-section-tabs" aria-label="Discovery sections">
  <button type="button" aria-current={current==='discover'?'page':undefined} className={current==='discover'?'active':''} onClick={()=>onNavigate('Discover')}>Explore</button>
  <button type="button" aria-current={current==='saved'?'page':undefined} className={current==='saved'?'active':''} onClick={()=>onNavigate('Saved')}>Saved</button>
 </nav>;
}
