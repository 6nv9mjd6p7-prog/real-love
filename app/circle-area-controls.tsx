'use client';
import {locationLabel,CIRCLE_DISTANCE_CHOICES,type BroadLocation} from './location';

export function CircleAreaProposal({area,checked,disabled,onChange,nearby=false,onNearbyChange}:{area:BroadLocation|null;checked:boolean;disabled:boolean;onChange:(value:boolean)=>void;nearby?:boolean;onNearbyChange?:(value:boolean)=>void}){
 return <section className="circle-area-option"><h3>General area (optional)</h3>{area?<>
  <label className="consent"><input type="checkbox" checked={checked} disabled={disabled} onChange={event=>onChange(event.target.checked)}/>Share {locationLabel(area)} as this circle’s general area.</label>
  <p className="field-help">The other founder reviews this area before agreeing. Once open, it appears in the discoverable listing. It is not a meeting address or proof of where participants live. No coordinates are copied from your profile.</p>{checked&&onNearbyChange&&<><label className="consent"><input type="checkbox" checked={nearby} disabled={disabled} onChange={event=>onNearbyChange(event.target.checked)}/>Include this circle in approximate distance searches.</label><p className="field-help">A map provider resolves the shared area to a general-area point. Members see only an approximate distance from their saved area. The other founder reviews this choice too. This does not locate participants or set a meeting place.</p></>}
 </>:<p className="field-help">You can propose without an area. To add one, first save your city or general area in your profile, then return here.</p>}</section>;
}

export function CircleAreaFilter({area,value,disabled,onChange,nearby=false,canNearby=false,miles=25,onNearbyChange,onMilesChange}:{area:BroadLocation|null;value:boolean;disabled:boolean;onChange:(value:boolean)=>void;nearby?:boolean;canNearby?:boolean;miles?:number;onNearbyChange?:(value:boolean)=>void;onMilesChange?:(value:number)=>void}){
 const mode=nearby&&canNearby?'nearby':value&&area?'mine':'any';
 return <div className="circle-area-filter"><label>Circle area<select disabled={disabled} value={mode} onChange={event=>{onChange(event.target.value==='mine');onNearbyChange?.(event.target.value==='nearby');}}><option value="any">Any area</option><option value="mine" disabled={!area}>My area{area?' · '+locationLabel(area):' · add an area to your profile'}</option>{onNearbyChange&&<option value="nearby" disabled={!canNearby}>Within a distance{!canNearby?' · select a place in your profile':''}</option>}</select></label>
  {mode==='nearby'&&<label>Distance from your saved general area<select value={miles} disabled={disabled} onChange={event=>onMilesChange?.(Number(event.target.value))}>{CIRCLE_DISTANCE_CHOICES.map(distance=><option key={distance} value={distance}>{distance} miles</option>)}</select></label>}
  <details className="inline-guide"><summary>About area filters</summary><p className="field-help">{mode==='nearby'?'Uses approximate area points, not people’s locations or meeting addresses. Only circles whose founders enabled distance discovery appear.':'My area matches city, region and country. Circles without a shared area stay in Any area.'} These filters apply to the loaded circle listings. Joined circles and requests are always kept separate.</p></details>
 </div>;
}
