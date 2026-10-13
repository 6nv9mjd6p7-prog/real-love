/**
 * Separates successful sending from the subsequent refresh. A refresh failure must not encourage the user to resend an already accepted message.
 * Reading guide: docs/CODE_READING_GUIDE.md.
 */
// Sending and refreshing are separate outcomes: never report a confirmed send
// as failed just because retrieving the updated conversation failed.
export async function deliverMessage<T>(send:()=>Promise<unknown>,refresh:()=>Promise<T>):Promise<{sent:true;conversation:T|null}>{
 // Let send failures reach the caller: the message has not been confirmed.
 await send();
 // A later refresh failure returns null while preserving the successful-send result.
 try{return {sent:true,conversation:await refresh()};}
 catch{return {sent:true,conversation:null};}
}
