'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { ArrowRight, CalendarDays, MessageCircle, Users, X } from 'lucide-react';

type PreviewTab = 'Chat' | 'Plan' | 'Members';
const previewTabs: PreviewTab[] = ['Chat', 'Plan', 'Members'];

/** Clearly labeled, local-only walkthrough shown when Discover has no results. */
export default function CircleEmptyPreview({ onStart }: { onStart: () => void }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<PreviewTab>('Chat');
  const [requestPreview, setRequestPreview] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const tabRefs = useRef<Record<PreviewTab, HTMLButtonElement | null>>({ Chat: null, Plan: null, Members: null });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function closePreview() {
    const dialog = dialogRef.current;
    if (dialog?.open) dialog.close();
    else setOpen(false);
  }

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, current: PreviewTab) {
    let next: PreviewTab | null = null;
    const index = previewTabs.indexOf(current);
    if (event.key === 'ArrowRight') next = previewTabs[(index + 1) % previewTabs.length];
    else if (event.key === 'ArrowLeft') next = previewTabs[(index + previewTabs.length - 1) % previewTabs.length];
    else if (event.key === 'Home') next = previewTabs[0];
    else if (event.key === 'End') next = previewTabs[previewTabs.length - 1];
    if (!next) return;
    event.preventDefault();
    setTab(next);
    setRequestPreview(false);
    tabRefs.current[next]?.focus();
  }

  return <section className="discovery-preview-empty" aria-label="Sample circle demo">
    <div className="circle-preview-invite">
      <div>
        <span className="demo-label">SAMPLE · NO REAL CIRCLE</span>
        <h2>Curious what a circle looks like?</h2>
        <p>Take a quick look at a sample chat, plan, and member list while you wait for circles to open.</p>
      </div>
      <button className="secondary" type="button" aria-haspopup="dialog" aria-controls="circle-preview-dialog" onClick={() => setOpen(true)}>Preview a circle <ArrowRight size={16} aria-hidden="true" /></button>
    </div>

    <dialog
      ref={dialogRef}
      className="circle-preview-dialog"
      id="circle-preview-dialog"
      aria-labelledby="circle-preview-title"
      aria-modal="true"
      onCancel={event => { event.preventDefault(); closePreview(); }}
      onClose={() => { setOpen(false); setRequestPreview(false); }}
      onClick={event => { if (event.target === event.currentTarget) closePreview(); }}
    >
      {open && <div className="circle-preview-demo">
        <header className="circle-preview-heading">
          <div><span className="demo-label">SAMPLE CIRCLE · DEMO ONLY</span><h2 id="circle-preview-title">Philosophy of Technology</h2><p>A small group exploring how technology shapes everyday life.</p></div>
          <button className="circle-preview-close" type="button" autoFocus aria-label="Close circle preview" onClick={closePreview}><X size={18} aria-hidden="true" /></button>
        </header>
        <div className="circle-preview-meta"><span><Users size={15} aria-hidden="true" /> 8 sample members</span><span><CalendarDays size={15} aria-hidden="true" /> Meets weekly</span></div>
        <div className="circle-preview-tabs" role="tablist" aria-label="Sample circle sections">
          {previewTabs.map(value => <button
            key={value}
            ref={element => { tabRefs.current[value] = element; }}
            type="button"
            role="tab"
            id={`circle-preview-tab-${value.toLowerCase()}`}
            aria-controls="circle-preview-panel"
            aria-selected={tab === value}
            tabIndex={tab === value ? 0 : -1}
            className={tab === value ? 'selected' : ''}
            onClick={() => { setTab(value); setRequestPreview(false); }}
            onKeyDown={event => onTabKeyDown(event, value)}
          >{value}</button>)}
        </div>
        <div className="circle-preview-panel" id="circle-preview-panel" role="tabpanel" aria-labelledby={`circle-preview-tab-${tab.toLowerCase()}`} tabIndex={0}>
          {tab === 'Chat' && <div className="circle-preview-chat">
            <p className="circle-preview-day">TODAY · CONVERSATION STARTER</p>
            <blockquote>“Do our tools shape who we become, or do we shape them?”</blockquote>
            <div className="circle-preview-message"><span className="preview-avatar">MC</span><p><strong>Maya</strong><br />I’ve been thinking about how maps change the way I remember places.</p></div>
            <div className="circle-preview-message mine"><span className="preview-avatar">JL</span><p><strong>You · sample</strong><br />I rely on them, but I notice less along the way.</p></div>
            <div className="circle-preview-composer"><MessageCircle size={16} aria-hidden="true" /><span>Messages are just examples in this preview</span></div>
          </div>}
          {tab === 'Plan' && <div className="circle-preview-plan">
            <div className="circle-preview-plan-item"><span className="preview-plan-icon"><CalendarDays size={17} aria-hidden="true" /></span><div><strong>Next conversation</strong><p>Thursday · 6:30 PM · Online</p></div><span className="demo-label">OPTIONAL</span></div>
            <div className="circle-preview-plan-item"><span className="preview-plan-icon">✦</span><div><strong>Shared prompt</strong><p>How does technology change what we remember?</p></div></div>
            <div className="circle-preview-plan-item"><span className="preview-plan-icon">↗</span><div><strong>Suggested reading</strong><p>“The Machine Stops” · E. M. Forster</p></div></div>
          </div>}
          {tab === 'Members' && <div className="circle-preview-members">
            {[['MC', 'Maya Chen', 'Circle host'], ['SR', 'Sam Rivera', 'Member'], ['JL', 'You', 'Member']].map(([initials, name, role]) => <div className="circle-preview-member" key={initials}><span className="preview-avatar">{initials}</span><div><strong>{name}</strong><span>{role}</span></div></div>)}
            <p>Sample names only. Real member lists are available to circle members.</p>
          </div>}
        </div>
        <div className="circle-preview-request" id="circle-preview-request" role="status" hidden={!requestPreview}>
          <strong>What happens when you request to join</strong>
          <ol><li>You review the circle’s purpose and guidelines.</li><li>A host reviews your request.</li><li>If approved, you can join new group conversations.</li></ol>
          <p>This is an example only. No request was sent.</p>
        </div>
        <footer className="circle-preview-footer">
          <p>This is a preview. No messages, requests, or invitations are sent.</p>
          <div><button className="secondary" type="button" aria-expanded={requestPreview} aria-controls="circle-preview-request" onClick={() => setRequestPreview(value => !value)}>{requestPreview ? 'Hide join flow' : 'Preview join flow'}</button><button className="primary" type="button" onClick={()=>{closePreview();requestAnimationFrame(onStart);}}>Start a circle</button></div>
        </footer>
      </div>}
    </dialog>
  </section>;
}
