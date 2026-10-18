import type {Profile} from './model';

// One answer gives a compact reason to open the full profile.
export default function DiscoveryCardAnswer({person,onAsk}:{person:Profile;onAsk?:(key:string)=>void}){
 const answer=[['question','A question I carry',person.question],['perspective','My perspective',person.perspective],['care','What I care about',person.care],['startIdea','What I would enjoy exploring',person.startIdea]].find(([, ,text])=>text?.trim());
 if(answer)return <div className="card-starter discovery-thought"><strong>{answer[1]}</strong><p>{answer[2]}</p>{onAsk&&<button type="button" className="text-button" aria-label={'Ask '+person.name+' about this answer'} onClick={()=>onAsk(answer[0]!)}>Ask about this</button>}</div>;
 return <p className="about">{person.about.length>180?person.about.slice(0,177).trimEnd()+'…':person.about}</p>;
}
