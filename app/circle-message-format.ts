const STARTS_LINE=/\nStarts: (\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)$/;

/** Format the generated activity timestamp for people reading circle chat.
 * The stored message remains canonical; this is only a display transformation.
 */
export function formatCircleMessageBody(body:string):string{
 const match=body.match(STARTS_LINE);
 if(!match)return body;
 const date=new Date(match[1]);
 if(!Number.isFinite(date.getTime())||date.toISOString()!==match[1])return body;
 return body.replace(STARTS_LINE,'\nStarts: '+date.toLocaleString([],{dateStyle:'medium',timeStyle:'short'})+' (your device time)');
}
