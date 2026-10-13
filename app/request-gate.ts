/**
 * Sequence counter used to ignore late asynchronous responses. Cancellation invalidates results; it does not abort the underlying network request.
 * Reading guide: docs/CODE_READING_GUIDE.md.
 */
// Ignore an older response after a newer refresh or mutation refresh starts.
export class LatestRequest {
 private sequence=0;
 // Starting a request invalidates every older request ticket.
 begin(){return ++this.sequence;}
 // Apply a response only if its ticket still matches the latest sequence.
 current(ticket:number){return ticket===this.sequence;}
 // Mutations can invalidate reads even when no replacement request has started yet.
 cancel(){this.sequence++;}
}
