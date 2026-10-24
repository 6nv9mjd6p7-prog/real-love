import {Heart,MessageCircle,UsersRound,ShieldCheck} from 'lucide-react';

export default function PublicLanding({
  authHref,
  authLabel,
  onDemo,
}:{
  authHref:string;
  authLabel:string;
  onDemo:()=>void;
}){
  return <div className="public-landing">
    <header className="public-nav">
      <a className="public-brand" href="#public-top" aria-label="Real Love home">
        <span className="public-brand-icon"><Heart size={22} aria-hidden="true"/></span>
        <span>real love<span className="brand-dot">.</span></span>
      </a>
      <nav aria-label="Public website">
        <a href="#how-it-works">How it works</a>
        <a href="#privacy">Privacy</a>
        <a href="#circles">Circles</a>
      </nav>
      <div className="public-nav-actions">
        <a className="secondary" href={authHref} target="_top">Sign in</a>
        <a className="primary" href={authHref} target="_top">Join Real Love</a>
      </div>
    </header>

    <main id="main-content" tabIndex={-1}>
      <section id="public-top" className="public-hero" aria-labelledby="public-hero-title">
        <div className="public-hero-copy">
          <p className="public-eyebrow">FRIENDSHIP FIRST. PEOPLE BEFORE LABELS.</p>
          <h1 id="public-hero-title">Find people you can actually talk to.</h1>
          <p className="public-lede">Real Love helps you connect through shared interests, thoughtful conversation, and mutual care — without pressure to make it romantic or decide immediately what the connection should become.</p>
          <div className="public-actions">
            <a className="primary" href={authHref} target="_top">Join Real Love</a>
            <button className="secondary" onClick={onDemo}>Explore the demo</button>
          </div>
          <p className="public-fineprint">Early access for adults 18+. New profiles are reviewed before discovery or messaging.</p>
        </div>
        <div className="public-conversation-card" role="group" aria-label="Example of a conversation starting from a shared interest">
          <span className="public-kicker">YOU BOTH CARE ABOUT</span>
          <div className="public-topic-row"><span>History</span><span>Community</span><span>Meaning</span></div>
          <span className="public-kicker">A QUESTION WORTH TALKING ABOUT</span>
          <blockquote>What makes people feel understood even when they disagree?</blockquote>
          <div className="public-message-preview">
            <p>“I think being listened to changes the whole tone before agreement even matters.”</p>
            <span>Start with the question, not the photo.</span>
          </div>
        </div>
      </section>

      <section className="public-promise" id="privacy">
        <div>
          <p className="public-kicker">CONNECTION AT YOUR PACE</p>
          <h2>Connection does not have to start with attraction.</h2>
        </div>
        <p>Start as friends. Profile photos are optional and stay private until both people agree to share. You choose what to disclose, how quickly to respond, and whether a friendship ever becomes something else.</p>
      </section>

      <section className="public-section" id="how-it-works" aria-labelledby="how-title">
        <div className="public-section-heading">
          <p className="public-eyebrow">HOW IT WORKS</p>
          <h2 id="how-title">Start with curiosity, not swiping.</h2>
          <p>Real Love is designed around finding a reason to talk before deciding what someone should mean to you.</p>
        </div>
        <div className="public-steps">
          <article><span>1</span><h3>Share what matters</h3><p>Choose interests, questions, perspectives, and communication preferences that help someone understand you.</p></article>
          <article><span>2</span><h3>Find something real</h3><p>Discover people through shared interests and meaningful profile answers instead of a compatibility score.</p></article>
          <article><span>3</span><h3>Start with conversation</h3><p>Ask about something they actually wrote. Photos and activities do not have to lead the connection.</p></article>
          <article><span>4</span><h3>Let it grow naturally</h3><p>Friendship is valuable on its own. If the connection changes, you decide together.</p></article>
        </div>
      </section>

      <section className="public-section public-difference" aria-labelledby="different-title">
        <div className="public-section-heading">
          <p className="public-eyebrow">BUILT AROUND HUMAN INTERACTION</p>
          <h2 id="different-title">More context. Less guessing.</h2>
        </div>
        <div className="public-feature-grid">
          <article><Heart size={25}/><h3>Photos are optional</h3><p>You do not need to lead with appearance. Profile-photo sharing happens only after both people agree.</p></article>
          <article><MessageCircle size={25}/><h3>Communication is visible</h3><p>Say whether you appreciate direct questions, need time to respond, or want someone to ask before giving advice.</p></article>
          <article id="circles"><UsersRound size={25}/><h3>Circles grow from connection</h3><p>Create a circle around an idea, subject, or activity without exposing the private conversation that inspired it.</p></article>
          <article><ShieldCheck size={25}/><h3>You control the pace</h3><p>Boundaries, disclosure, location range, friendship, and participation remain your choices.</p></article>
        </div>
      </section>

      <section className="public-final-cta">
        <div>
          <p className="public-eyebrow">REAL LOVE</p>
          <h2>Find your people.</h2>
          <p>Start with something you actually care about talking about.</p>
        </div>
        <div className="public-actions">
          <a className="primary" href={authHref} target="_top">{authLabel}</a>
          <button className="secondary" onClick={onDemo}>Try the demo first</button>
        </div>
      </section>
    </main>

    <footer className="public-footer">
      <strong>real love.</strong>
      <span>Friendship first. Shared interests. Thoughtful conversation.</span>
    </footer>
  </div>;
}
