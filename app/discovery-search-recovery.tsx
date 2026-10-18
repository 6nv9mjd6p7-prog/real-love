import {interestGroups} from './model';

export function recoveryInterests(query:string,interests:string[]){
 const fold=(text:string)=>text.normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().trim();
 const terms=fold(query).split(/[^\p{L}\p{N}]+/u).filter(term=>term.length>=4);
 const related=interestGroups.filter(group=>[group.name,...group.topics].some(topic=>terms.some(term=>fold(topic).includes(term)))).map(group=>group.name);
 return [...new Set(related.length?related:interests)].slice(0,3);
}
export default function DiscoverySearchRecovery({query,interests,onClear,onInterest}:{query:string;interests:string[];onClear:()=>void;onInterest:(topic:string)=>void}){
 const suggestions=recoveryInterests(query,interests);
 return <div className="discovery-search-recovery"><button type="button" className="secondary" onClick={onClear}>Clear search only</button><p className="field-help">Your other filters stay in place.</p>{suggestions.length>0&&<><p className="field-help">Or explore an interest instead. These suggestions do not indicate available matches.</p><div className="interest-tags" aria-label="Interests to explore instead">{suggestions.map(topic=><button type="button" className="interest-action" key={topic} onClick={()=>onInterest(topic)}>{topic}</button>)}</div></>}</div>;
}
