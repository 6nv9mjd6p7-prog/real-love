/**
 * Photo access predicate, public-profile allowlist, PNG validation/metadata stripping, and review tokens. Never return an R2 photo key in a public profile.
 * Reading guide: docs/CODE_READING_GUIDE.md.
 */
// Owners can view their own photo. Other viewers need both active accounts, an accepted connection, no block, and explicit consent.
export function photoMayBeViewed(viewer:string,target:string,state:{viewerActive:boolean;targetActive:boolean;blocked:boolean;accepted:boolean;consented?:boolean}){return viewer===target||(!state.blocked&&state.viewerActive&&state.targetActive&&state.accepted&&state.consented===true);}
const locationConfirmed=(p:any)=>{const fold=(value:unknown)=>typeof value==='string'?value.normalize('NFKD').replace(/\p{M}/gu,'').trim().replace(/\s+/g,' ').toLowerCase():'';const key=p.city&&p.region&&p.country?[fold(p.city),fold(p.region),fold(p.country)].join('|'):'';const time=Date.parse(p.locationConfirmedAt||'');return !!key&&p.locationConfirmationKey===key&&Number.isFinite(time)&&time<=Date.now()&&time>=Date.now()-90*86400000;};
// Compute the PNG chunk checksum using the standard reflected polynomial; unsigned shifts keep the result in 32 bits.
// Copy only allowlisted public fields. Never spread the stored profile into the response: it contains private fields and storage keys.
// Birth dates and prompt-selection metadata are private and deliberately absent from this public allowlist.
export function publicProfile<T extends {photoKey?:string;hasPhoto?:boolean;connectionBoundary?:string;photoPending?:boolean}>(p:T){const fields=['id','name','age','gender','city','region','country','remote','intentions','orientation','expectation','affection','faith','about','introPrompt','responsibility','space','growth','interests','active','demo','background','startRole','participation','orientationDescription','care','question','perspective','startIdea','offer','support','firstStep','communication','communicationNote','availability','availabilityChoices','activities','topics'];const result:Record<string,any>={};for(const field of fields)if(field in p)result[field]=(p as any)[field];if((p as any).gender==='Self-described'&&(p as any).genderDescription)result.genderDescription=(p as any).genderDescription;return {...result,locationConfirmed:locationConfirmed(p),hasPhoto:!!p.photoKey&&!p.photoPending};}
function crc32(bytes:Uint8Array){let crc=0xffffffff;for(const b of bytes){crc^=b;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
// Accept bounded standard PNG data, validate chunk checksums/structure, and copy only required image chunks to strip metadata.
export function sanitizePng(bytes:Uint8Array){
 if(bytes.length>2*1024*1024||bytes.length<45||!bytes.slice(0,8).every((x,i)=>x===[137,80,78,71,13,10,26,10][i]))throw Error('Choose a PNG image up to 2 MB.');
 // DataView reads multi-byte PNG integers in network byte order. Keep the original signature.
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);const chunks=[bytes.slice(0,8)];let offset=8,header=false,image=false,end=false;
 // Each chunk has a length, four-byte type, payload, and checksum; validate bounds before reading.
 while(offset<bytes.length){if(offset+12>bytes.length)throw Error('Incomplete image.');const len=view.getUint32(offset);if(len>bytes.length-offset-12)throw Error('Invalid image chunk.');const type=String.fromCharCode(...bytes.slice(offset+4,offset+8));const chunk=bytes.slice(offset,offset+len+12);if(crc32(chunk.slice(4,len+8))!==view.getUint32(offset+len+8))throw Error('Damaged image.');
 // IHDR must be first and unique; accept only supported dimensions and color formats.
 if(!header&&type!=='IHDR')throw Error('Invalid image header.');if(type==='IHDR'){if(header||len!==13)throw Error('Invalid image header.');const w=view.getUint32(offset+8),h=view.getUint32(offset+12);if(!w||!h||w>1400||h>1400||bytes[offset+16]!==8||![2,6].includes(bytes[offset+17])||bytes[offset+18]!==0||bytes[offset+19]!==0||bytes[offset+20]>1)throw Error('Use a standard RGB image up to 1400 pixels per side.');header=true;}
 // Require image data before the final marker.
 if(type==='IDAT')image=true;if(type==='IEND'){if(len!==0||!image)throw Error('Invalid image end.');end=true;}
 // Keep pixel/palette/transparency chunks; discard ancillary metadata and reject unknown critical chunks.
 if(['IHDR','PLTE','IDAT','IEND','tRNS'].includes(type))chunks.push(chunk);else if(type[0]===type[0].toUpperCase())throw Error('Unsupported image.');offset+=len+12;if(end)break;
 }
 // Reject incomplete or trailing data, then join retained chunks into the sanitized result.
 if(!header||!image||!end||offset!==bytes.length)throw Error('Incomplete image.');const size=chunks.reduce((n,c)=>n+c.length,0),out=new Uint8Array(size);let at=0;for(const c of chunks){out.set(c,at);at+=c.length;}return out;
}

// Hash the specific storage key so a stale review screen cannot approve a replacement image by member ID alone.
export async function photoReviewToken(key:string){const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(key));return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');}
