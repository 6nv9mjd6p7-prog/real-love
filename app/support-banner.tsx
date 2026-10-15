// The optional support action is always visible on the website, including welcome screens.
// This is an external payment page; no payment information enters Real Love.
export default function SupportBanner() {
  return <section className="support-banner support-top" aria-label="Support Real Love">
    <div><h2>Help Real Love grow</h2><p>Optional support · every contribution helps.</p></div>
    <a className="secondary" href="https://ko-fi.com/real_love" target="_blank" rel="noopener noreferrer">Support on Ko-fi<span className="sr-only"> (opens in a new tab)</span></a>
  </section>;
}
