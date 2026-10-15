export default function LoadingSpace(){
 return <section className="loading-space" role="status" aria-label="Loading your space">
  <span className="sr-only">Loading your space…</span>
  <div className="loading-heading" aria-hidden="true"><i/><i/></div>
  <div className="loading-grid" aria-hidden="true">{[0,1,2,3].map(n=><article className="loading-card" key={n}><i/><i/><i/><i/></article>)}</div>
 </section>;
}
