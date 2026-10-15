'use client';

// Turn profile interests into optional one-tap discovery filters.
export default function DiscoveryInterestShortcuts({interests,active,onChoose}:{
 interests:string[];active:string;onChoose:(interest:string)=>void;
}){
 if(!interests.length)return null;
 return <div className="interest-shortcuts" aria-label="Explore people by your interests">
  <span className="interest-shortcuts-label">Your interests</span>
  <div className="interest-shortcuts-list">
   {interests.map(interest=><button type="button" key={interest} className={active===interest?'active':''} aria-pressed={active===interest} onClick={()=>onChoose(interest)}>{interest}</button>)}
  </div>
 </div>;
}
