'use client';
import {useState} from 'react';
export default function ApprovalStatus({compact=false,paused,onPreview,onEdit,onDemo,onAlerts,onStatus,onCheck}:{compact?:boolean;paused:boolean;onPreview:()=>void;onEdit:()=>void;onDemo:()=>void;onAlerts:()=>void;onStatus:()=>void;onCheck:()=>Promise<void>}){
 const [checking,setChecking]=useState(false);
 return <section className={'admission-card approval-status'+(compact?' approval-compact':'')} aria-labelledby="approval-title">
 <p className="approval-label">PROFILE SAVED · PRIVATE</p><h2 id="approval-title">Waiting for profile review</h2>
 <p>Your profile is saved. You do not need to submit it again.</p>
 {compact?<button className="text-button" onClick={onStatus}>View review status & next steps</button>:<>
 <ol className="approval-steps" aria-label="Your joining progress"><li><strong>1. Profile saved</strong><span>Your answers are ready for review.</span></li><li aria-current="step"><strong>2. Awaiting review</strong><span>A reviewer checks adult eligibility and your community agreement.</span></li><li><strong>3. Start connecting</strong><span>{paused?'Your profile will stay paused after approval until you choose to resume.':'After approval, discover people and send an invitation.'}</span></li></ol>
 <p className="field-help">There is no guaranteed review time during this pilot. This page checks for updates while open. Approval is community admission; it does not verify identity or guarantee safety.</p>
 <div className="inline-actions"><button className="primary" onClick={onDemo}>Explore the demo while you wait</button><button className="secondary" onClick={onPreview}>Preview saved profile</button><button className="text-button" onClick={onEdit}>Edit profile</button></div>
 <details className="approval-alerts"><summary>Get an alert when your profile is approved</summary><p>Optional phone or browser notifications can let you know when review is complete. Enable them on each device you want to use; delivery depends on your browser and device settings.</p><button className="secondary" onClick={onAlerts}>Set up approval alerts</button><p className="field-help">You can also return to the app to check your status.</p></details>
 <button className="text-button" disabled={checking} onClick={async()=>{setChecking(true);try{await onCheck();}finally{setChecking(false);}}}>{checking?'Checking status…':'Check status now'}</button>
 </>}
 </section>;
}
