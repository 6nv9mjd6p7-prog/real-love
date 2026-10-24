'use client';
import WorkerSupport from './worker-support';

export default function CircleEntry({workerArea,resources,signInHref,signInLabel,onBrowse,onOrganize}:{workerArea:boolean;resources:boolean;signInHref:string;signInLabel:string;onBrowse:()=>void;onOrganize:()=>void}){
 if(resources)return <><aside className="entry-sign-in" aria-label="Join Real Love"><span>Worker resources are available without an account.</span><a className="text-button" href={signInHref} target="_top">{signInLabel}</a></aside><WorkerSupport onCircles={onBrowse} onOrganize={onOrganize} canOrganize={false}/></>;
 return <section className="circle-entry">
  <div className="page-heading"><div><h1>{workerArea?'Worker circles.':'Circles.'}</h1><p>Find people gathering around a shared interest, a question, or something to do together.</p></div></div>
  <div className="empty-state">
   <h2>Sign in to explore circles</h2>
   <p>Circles bring people together to talk, offer help, plan activities, and build projects.</p>
   <p className="field-help">After your profile is approved, you can browse eligible circles and request to join. To propose a circle, start with an accepted connection and the other founder’s agreement.</p>
   <div className="inline-actions"><a className="primary" href={signInHref} target="_top">{signInLabel}</a><a className="text-button" href="#discover">About Real Love</a></div>
   {workerArea&&<a className="text-button" href="#circles/work">Worker support resources · no account needed</a>}
  </div>
 </section>;
}
