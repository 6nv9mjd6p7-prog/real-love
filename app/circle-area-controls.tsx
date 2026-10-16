'use client';
import {locationLabel,type BroadLocation} from './location';

export function CircleAreaProposal({area,checked,disabled,onChange}:{area:BroadLocation|null;checked:boolean;disabled:boolean;onChange:(value:boolean)=>void}){
 return <section className="circle-area-option"><h3>General area (optional)</h3>{area?<>
  <label className="consent"><input type="checkbox" checked={checked} disabled={disabled} onChange={event=>onChange(event.target.checked)}/>Share {locationLabel(area)} as this circle’s general area.</label>
  <p className="field-help">The other founder reviews this area before agreeing. Once open, it appears in the discoverable listing. It is not a meeting address or proof of where participants live. No coordinates are copied from your profile.</p>
 </>:<p className="field-help">You can propose without an area. To add one, first save your city or general area in your profile, then return here.</p>}</section>;
}

export function CircleAreaFilter({area,value,disabled,onChange}:{area:BroadLocation|null;value:boolean;disabled:boolean;onChange:(value:boolean)=>void}){
 return <div className="circle-area-filter"><label>Circle area<select disabled={disabled} value={value&&area?'mine':'any'} onChange={event=>onChange(event.target.value==='mine')}><option value="any">Any area</option><option value="mine" disabled={!area}>My area{area?' · '+locationLabel(area):' · add an area to your profile'}</option></select></label>
  <p className="field-help">Matches city, region and country in these circle listings. Circles without a shared area stay in Any area. Joined circles and requests are always kept separate from this filter.</p>
 </div>;
}
