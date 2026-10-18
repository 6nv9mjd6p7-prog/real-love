import type {Profile} from './model';

// One answer gives a compact reason to open the full profile.
export default function DiscoveryCardAnswer({person}:{person:Profile}){
 const answer=[['A question I carry',person.question],['My perspective',person.perspective],['What I care about',person.care],['What I would enjoy exploring',person.startIdea]].find(([,text])=>text?.trim());
 if(answer)return <div className="card-starter discovery-thought"><strong>{answer[0]}</strong><p>{answer[1]}</p></div>;
 return <p className="about">{person.about.length>180?person.about.slice(0,177).trimEnd()+'…':person.about}</p>;
}
