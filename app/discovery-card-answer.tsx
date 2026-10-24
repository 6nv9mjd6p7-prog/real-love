'use client';
import type {Profile} from './model';
// Keep a member's question visible, then let people open one response in place.
export default function DiscoveryCardAnswer({person,onAsk}:{person:Profile;onAsk?:(key:string)=>void}){
 const question=person.question?.trim()||'';
 const response=[['perspective','My perspective',person.perspective],['care','What I care about',person.care],['startIdea','What I would enjoy exploring',person.startIdea]].find(([, ,text])=>text?.trim());
 const askButton=(key:string)=><button type="button" className="text-button" aria-label={'Ask '+person.name+' about this answer'} onClick={()=>onAsk?.(key)}>Ask about this</button>;
 if(question)return <div className="card-starter discovery-thought"><strong>A question I carry</strong><p className="discovery-question">{question}</p>{onAsk&&askButton('question')}{response&&<details className="discovery-answer"><summary>More they shared</summary><div className="discovery-answer-content"><strong>{response[1]}</strong><p>{response[2]}</p>{onAsk&&askButton(response[0]!)}</div></details>}</div>;
 if(response){const key=response[0]!,label=String(response[1]),text=String(response[2]),preview=text.length>220?text.slice(0,217).trimEnd()+'…':text;return <div className="card-starter discovery-thought"><strong>{label}</strong><p className="discovery-question">{preview}</p>{text.length>220&&<details className="discovery-answer"><summary>Read the full answer</summary><div className="discovery-answer-content"><p>{text}</p></div></details>}{onAsk&&askButton(key)}</div>;}
 const about=person.about.trim(),preview=about.length>220?about.slice(0,217).trimEnd()+'…':about;
 return <div className="card-starter discovery-thought discovery-intro"><strong>{person.introPrompt?.trim()||'A little about me'}</strong><p className="discovery-question">{preview}</p>{about.length>220&&<details className="discovery-answer"><summary>Read the full introduction</summary><div className="discovery-answer-content"><p>{about}</p></div></details>}{onAsk&&askButton('about')}</div>;
}
