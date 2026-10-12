'use client';

const workerResources=[
 {title:'Worker.gov',kind:'Government worker-rights guide',href:'https://www.worker.gov/',description:'Start here for federal information about pay, safety, retaliation, discrimination, and other workplace concerns.'},
 {title:'U.S. Department of Labor — Wage and Hour Division',kind:'Government enforcement and education',href:'https://www.dol.gov/agencies/whd/workers',description:'Information about minimum wage, overtime, leave, misclassification, complaints, and related federal labor standards.'},
 {title:'OSHA worker rights',kind:'Government workplace-safety resource',href:'https://www.osha.gov/workers/',description:'Workplace safety rights, complaint options, inspections, and whistleblower information.'},
 {title:'National Labor Relations Board — employee rights',kind:'Government labor-rights resource',href:'https://www.nlrb.gov/about-nlrb/rights-we-protect/your-rights/employee-rights',description:'Information about acting together over working conditions, union activity, and rights protected by the NLRA.'},
 {title:'AFL-CIO — contact a union organizer',kind:'Established labor organization',href:'https://aflcio.org/formaunion/contact',description:'A route to an organizer when workers want help exploring formal union organizing. Real Love is not the representative.'},
] as const;

export default function WorkerSupport({active,canStart,onBrowse,onStart}:{active:boolean;canStart:boolean;onBrowse:()=>void;onStart:()=>void}){
 return <section className="form-section worker-support-entry" aria-labelledby="worker-support-heading">
  <div className="eyebrow">OPTIONAL WORK & WORKER SUPPORT</div>
  <h2 id="worker-support-heading">Find support around work.</h2>
  <p>Use worker circles to compare experiences, learn together, and find qualified help. This area is separate from your public profile and does not replace the friendship side of Real Love.</p>
  <div className="dialog-actions">
   <button type="button" className="primary" disabled={!active} onClick={onBrowse}>Browse worker circles</button>
   <button type="button" className="secondary" disabled={!active||!canStart} onClick={onStart}>Start a worker circle</button>
  </div>
  {!canStart&&<p className="field-help">Starting a circle still begins with an accepted Real Love connection so two people agree before it opens.</p>}
  <details className="chat-privacy">
   <summary>Privacy before you post</summary>
   <p>Worker-circle membership and activity are not added to public profiles. Sharing an employer is optional. Circle titles, descriptions, tags, and participant counts become discoverable to active members after both founders agree.</p>
   <p>Do not post names, schedules, documents, customer information, trade secrets, or other details that could unnecessarily identify you or coworkers. Real Love cannot guarantee anonymity, confidentiality, or protection from retaliation.</p>
  </details>
  <details>
   <summary>Reliable worker resources</summary>
   <p className="field-help">Peer discussion is not professional advice. These links lead to government agencies or established worker organizations; check the source that fits your situation.</p>
   <div className="profile-grid">
    {workerResources.map(resource=><article className="care-card" key={resource.href}>
     <p className="eyebrow">{resource.kind}</p>
     <h3>{resource.title}</h3>
     <p>{resource.description}</p>
     <a className="text-button" href={resource.href} target="_blank" rel="noreferrer">Open verified resource</a>
    </article>)}
   </div>
  </details>
  <p className="field-help"><strong>Real Love is not a union or law firm.</strong> It does not provide legal representation, certify anonymity, or guarantee protection from workplace retaliation.</p>
 </section>;
}
