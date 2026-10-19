'use client';
import type {Profile} from './model';
// Keep a member's question visible, then let people open one response in place.
export default function DiscoveryCardAnswer({person,onAsk}:{person:Profile;onAsk?:(key:string)=>void}){
 const question=person.question?.trim()||'';
 const response=[['perspective','My perspective',person.perspective],['care','What I care about',person.care],['startIdea','What I would enjoy exploring',person.startIdea]].find(([, ,text])=>text?.trim());
 const askButton=(key:string)=><button type="button" className="text-button" aria-label={'Ask '+person.name+' about this answer'} onClick={()=>onAsk?.(key)}>Ask about this</button>;
 if(question)return <div className="card-starter discovery-thought"><strong>A question I carry</strong><p className="discovery-question">{question}</p>{response&&<details className="discovery-answer"><summary>View answer</summary><div className="discovery-answer-content"><strong>{response[1]}</strong><p>{response[2]}</p>{onAsk&&askButton(response[0]!)}</div></details>}</div>;
 if(response)return <details className="card-starter discovery-thought discovery-answer"><summary>View answer · {response[1]}</summary><div className="discovery-answer-content"><p>{response[2]}</p>{onAsk&&askButton(response[0]!)}</div></details>;
 return <p className="about">{person.about.length>180?person.about.slice(0,177).trimEnd()+'…':person.about}</p>;
}
