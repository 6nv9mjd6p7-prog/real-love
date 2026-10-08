// Ignore an older response after a newer refresh or mutation refresh starts.
export class LatestRequest {
 private sequence=0;
 begin(){return ++this.sequence;}
 current(ticket:number){return ticket===this.sequence;}
 cancel(){this.sequence++;}
}
