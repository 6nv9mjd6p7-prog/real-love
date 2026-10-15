'use client';
// Overview cards are navigation with useful summaries; collapsing them into a dropdown would hide those summaries.
export default function ProfileSections({form,photoUploaded,busy,changed,onPreview,onChoose}:{form:any;photoUploaded:boolean;busy:boolean;changed:boolean;onPreview:()=>void;onChoose:(section:number)=>void}){
 const sections=[
  {title:'Basics',detail:[form.name,form.age&&`${form.age} years old`,form.city].filter(Boolean).join(' · ')||'Name, age, and general area',hint:'Name, location, and optional identity answers'},
  {title:'Interests',detail:form.interests?.join(' · ')||'Choose what you enjoy',hint:'Topics that give someone a way to connect'},
  {title:'Introduction & privacy',detail:form.about||'Add a short introduction',hint:'Your introduction and community agreement'},
  {title:'More about me',detail:'Communication, activities, and boundaries',hint:'Optional answers; add as much or as little as you choose'},
  {title:'Photos',detail:photoUploaded?'Photo uploaded':'No photo uploaded',hint:'Optional and private until mutually shared'},
 ];
 return <section className="profile-overview" aria-labelledby="profile-overview-title"><div className="form-section"><h2 id="profile-overview-title" tabIndex={-1}>Your profile at a glance</h2><p className="field-help">Preview how your answers appear, or choose a section to update. Switching sections keeps your unsaved edits.</p><button type="button" className="primary" disabled={busy} onClick={onPreview}>{changed?'Preview changes':'Preview my profile'}</button><button type="button" className="text-button" disabled={busy} onClick={()=>onChoose(1)}>Change location</button></div><div className="profile-section-grid">{sections.map((section,i)=><button key={section.title} type="button" className="profile-section-card" disabled={busy} onClick={()=>onChoose(i+1)}><strong>{section.title}</strong><span className="profile-section-summary">{section.detail}</span><span className="field-help">{section.hint}</span><span className="profile-section-action">{i===4?'Manage photos':'Edit section'} →</span></button>)}</div></section>;
}
