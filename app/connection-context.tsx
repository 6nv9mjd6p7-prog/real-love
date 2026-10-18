'use client';
import {HeartHandshake} from 'lucide-react';
import {connectionContext,profileLocation,type Profile} from './model';

export default function ConnectionContext({me,person,compact=false}:{me:Profile;person:Profile;compact?:boolean}){
 const context=connectionContext(me,person);
 const location=context.sameArea?'Same general area: '+profileLocation(person):context.distanceMiles!==null?'About '+Math.round(context.distanceMiles)+' miles away · '+profileLocation(person):'Different general areas: '+profileLocation(me)+' and '+profileLocation(person);

 // Keep the intellectual reason for discovery first. Location and logistics are supporting context.
 if(compact)return <details className="connection-summary connection-summary-compact"><summary><strong>{context.exact.length?context.exact.length+' shared '+(context.exact.length===1?'interest':'interests'):context.related.length?'Related interest area':'Explore across interests'}</strong></summary><div className="connection-summary-detail">{context.exact.length>0&&<p className="connection-topics">{context.exact.slice(0,2).join(' · ')}</p>}{!context.exact.length&&context.related.slice(0,1).map(item=><p className="connection-topics" key={item.area}>{item.area}: you chose {item.mine.join(', ')}; they chose {item.theirs.join(', ')}</p>)}{context.discuss.length>0&&<p className="field-help">Things you may want to discuss: {context.discuss[0]}</p>}{context.online&&<p className="field-help">Both open to online connection</p>}{!context.exact.length&&!context.related.length&&<p className="field-help">No shared or related interests are listed. You can still explore their full profile.</p>}</div></details>;

 return <details className="profile-panel match-note">
  <summary><h2 className="profile-section-title"><HeartHandshake size={20} aria-hidden="true"/>What you share & what to discuss</h2></summary>
  <dl className="connection-facts">
   <div><dt>Exact shared interests</dt><dd>{context.exact.length?context.exact.join(' · '):'No exact interests in common are listed.'}</dd></div>
   {context.related.length>0&&<div><dt>Related interest areas</dt><dd>{context.related.map(x=><p key={x.area}><strong>{x.area}</strong>: you selected {x.mine.join(', ')}; they selected {x.theirs.join(', ')}.</p>)}<p className="field-help">A broad interest area relates to a specific topic. This is different from selecting the same interest.</p></dd></div>}
  </dl>

  {context.discuss.length>0&&<div className="connection-discussion"><h3>Things you may want to discuss</h3><ul>{context.discuss.map(x=><li key={x}>{x}</li>)}</ul></div>}

  <dl className="connection-facts connection-facts-secondary">
   <div><dt>Location & online connection</dt><dd>{location}. {context.online?'Both profiles say they are open to online connection.':'Online connection is not selected by both people.'}</dd><dd className="field-help">Broad areas are self-reported unless marked recently confirmed. Approximate miles are calculated between selected general-area points, not homes or live locations. Confirmation checks only an approximate internet-connection area; it does not establish residence, identity, safety, or willingness to meet.</dd></div>
   <div><dt>Activities in common</dt><dd>{context.activities.length?context.activities.join(' · '):'No shared activity preferences are listed. You can choose something together later.'}</dd></div>
   {context.availability&&<div><dt>Availability in common</dt><dd>{context.availability}</dd></div>}
  </dl>

  <p className="field-help">These are self-reported preferences, not proof of character, safety, or guaranteed compatibility. Shared interests are conversation cues, not a prediction of the relationship.</p>
 </details>;
}
