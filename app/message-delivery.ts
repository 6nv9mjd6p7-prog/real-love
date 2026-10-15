// Sending and refreshing are separate outcomes: never report a confirmed send
// as failed just because retrieving the updated conversation failed.
export async function deliverMessage<T>(send:()=>Promise<unknown>,refresh:()=>Promise<T>):Promise<{sent:true;conversation:T|null}>{
 await send();
 try{return {sent:true,conversation:await refresh()};}
 catch{return {sent:true,conversation:null};}
}
