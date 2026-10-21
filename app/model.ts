export type Profile={id:string;name:string;age:number;birthDate?:string;birthDateChanges?:number;availabilityChoices?:string[];participation?:string[];orientationDescription?:string;promptKeys?:string[];gender:string;genderDescription?:string;interested:string[];minAge:number;maxAge:number;city:string;region?:string;country?:string;locationConfirmed?:boolean;areaLat?:number|null;areaLon?:number|null;locationPlaceId?:string;distanceMiles?:number|null;remote:boolean;intentions:string[];orientation:string;aceOnly:boolean;expectation:string;affection:string;faith:string;about:string;responsibility:string;space:string;growth:string;interests:string[];active:boolean;discoverable?:boolean;demo?:boolean;background?:string;startRole?:string;care?:string;question?:string;perspective?:string;startIdea?:string;offer?:string;support?:string;firstStep?:string;availability?:string;activities?:string[];topics?:string[];hasPhoto?:boolean;photoDescription?:string;introPrompt?:string;connectionBoundary?:string;communication?:string[];communicationNote?:string};
const areaFold=(value:unknown)=>typeof value==='string'?value.normalize('NFKD').replace(/\p{M}/gu,'').trim().replace(/\s+/g,' ').toLowerCase():'';
const structuredArea=(p:Partial<Profile>)=>p.city&&p.region&&p.country?[areaFold(p.city),areaFold(p.region),areaFold(p.country)].join('|'):'';
const sameBroadArea=(a:Partial<Profile>,b:Partial<Profile>)=>structuredArea(a)&&structuredArea(b)?structuredArea(a)===structuredArea(b):!!areaFold(a.city)&&areaFold(a.city)===areaFold(b.city);
const locationLabel=(p:Partial<Profile>)=>[p.city,p.region,p.country].map(x=>typeof x==='string'?x.trim():'').filter(Boolean).filter((x,i,a)=>i===0||areaFold(x)!==areaFold(a[i-1])).join(', ');
export const MAX_NEARBY_MILES=100;
const areaPoint=(p:Partial<Profile>)=>typeof p.areaLat==='number'&&Number.isFinite(p.areaLat)&&p.areaLat>=-90&&p.areaLat<=90&&typeof p.areaLon==='number'&&Number.isFinite(p.areaLon)&&p.areaLon>=-180&&p.areaLon<=180?[p.areaLat,p.areaLon] as const:null;
export function areaDistanceMiles(a:Partial<Profile>,b:Partial<Profile>){const left=areaPoint(a),right=areaPoint(b);if(!left||!right)return null;const rad=(n:number)=>n*Math.PI/180,dLat=rad(right[0]-left[0]),dLon=rad(right[1]-left[1]),lat1=rad(left[0]),lat2=rad(right[0]),h=Math.sin(dLat/2)**2+Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;return 3958.7613*2*Math.asin(Math.min(1,Math.sqrt(h)));}
const candidateDistance=(a:Partial<Profile>,b:Partial<Profile>)=>typeof b.distanceMiles==='number'&&Number.isFinite(b.distanceMiles)?b.distanceMiles:areaDistanceMiles(a,b);
const withinNearby=(a:Partial<Profile>,b:Partial<Profile>,miles:number)=>{const distance=candidateDistance(a,b);return distance===null?sameBroadArea(a,b):distance<=miles;};
export const communicationOptions=['I appreciate direct questions.','Ask before giving advice.','I sometimes need time to respond.','I prefer one topic at a time.','It depends; please ask me.'];
export const intentions=['Connect'];
export const connectionBoundaries=['Friendship only','Open to romance over time','Unsure'];
export const genders=['Woman','Man','Nonbinary','Self-described','Prefer not to say'];
export const expectations=['Not wanted','Optional','Wanted eventually','Required','Unsure'];
export const startRoles=['I have something I’d like to start','I’d like to help someone build','I’m looking for someone to explore ideas with'];
export const availabilityOptions=['Weekday daytime','Weekday evenings','Weekends','Varies','Flexible','Occasional'];
export const editableAvailabilityOptions=['Weekday daytime','Weekday evenings','Weekends','Varies'];
export const activityOptions=['Conversation','Reading together','Creating','Volunteering','Organizing','Skill exchange','Local meetups','Online calls'];
export const interestGroups=[
 {name:'Power & society',topics:['Imperialism','Colonialism','Sociology','Inequality','Tribalism']},
 {name:'History & culture',topics:['History','Wigs & beauty history','Makeup & beauty standards','Cultural identity']},
 {name:'Belief & belonging',topics:['Religion','Cults & group influence','Independent thought','Belonging']},
 {name:'Philosophy & humanity',topics:['Philosophy','Ethics','Compassion','Human dignity','Meaning & purpose']},
 {name:'Self-understanding',topics:['Ego','Self-esteem','Self-worth','Confidence']},
 {name:'Men & emotional life',topics:['Masculinity','Emotional expression','Vulnerability','Male friendship']},
 {name:'Community & collective action',topics:['Community organizing','Mutual support','Social movements','Systems thinking']},
 {name:'Learning & mentorship',topics:['Mentorship','Teaching','Learning','Skill exchange']},
 {name:'Everyday interests',topics:['Reading','Music','Art','Cooking','Nature','Long walks','Volunteering','Football','Writing','Travel','Film','Fitness']}
];
// Birth dates are calendar dates; UTC avoids daylight-saving and date-string timezone shifts.
export function ageFromBirthDate(value:unknown,today=new Date()):number|null{
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;
 const [year,month,day]=value.split('-').map(Number),date=new Date(Date.UTC(year,month-1,day));
 if(year<1900||date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day)return null;
 const age=today.getUTCFullYear()-year-(today.getUTCMonth()+1<month||today.getUTCMonth()+1===month&&today.getUTCDate()<day?1:0);
 return age>=0?age:null;
}
export function profileAvailability(p:Partial<Profile>){return Array.isArray(p.availabilityChoices)?p.availabilityChoices:p.availability?[p.availability]:[];}
export function profileParticipation(p:Partial<Profile>){return Array.isArray(p.participation)?p.participation:p.startRole?[p.startRole]:[];}
export const profilePrompts=[
 ['care','What do you care about?','A concern, cause, or something you want to understand.'],
 ['question','What question keeps coming back to you?','A question about yourself, society, or being human.'],
 ['perspective','Your perspective—and what you’re still questioning','You don’t need a finished answer.'],
 ['startIdea','What would you like to start, join, or explore?','A conversation, reading circle, project, or possibility.'],
 ['offer','What could you offer?','Listening, hosting, a skill, curiosity, or showing up.'],
 ['support','What would you appreciate from someone else?','A thinking partner, encouragement, consistency, or practical help.'],
 ['responsibility','What does taking responsibility after hurting someone look like to you?','A short answer is enough.'],
 ['space','When someone asks for space, how do you respond?','A short answer is enough.'],
 ['growth','What are you actively working on in yourself?','A short answer is enough.']
] as const;
export function canonicalIntention(value:string){return value==='Build community'?'Build together':value;}
export function normalizeProfile(p:Profile):Profile{return {...p,availabilityChoices:profileAvailability(p),participation:profileParticipation(p),promptKeys:Array.from(new Set([...(p.promptKeys??[]),...profilePrompts.filter(([key])=>p[key]?.trim()).map(([key])=>key)])),age:p.birthDate?ageFromBirthDate(p.birthDate)??p.age:p.age,region:p.region??'',country:p.country??'',areaLat:typeof p.areaLat==='number'?p.areaLat:null,areaLon:typeof p.areaLon==='number'?p.areaLon:null,locationPlaceId:p.locationPlaceId??'',genderDescription:p.genderDescription??'',communication:p.communication??[],communicationNote:p.communicationNote??'',discoverable:p.discoverable!==false,intentions:['Connect'],connectionBoundary:p.connectionBoundary??(p.intentions.includes('Romance')?'Open to romance over time':p.intentions.includes('Friendship')?'Friendship only':'Unsure'),background:p.background??'',startRole:p.startRole??'',care:p.care??'',question:p.question??'',perspective:p.perspective??'',startIdea:p.startIdea??'',offer:p.offer??'',support:p.support??'',firstStep:p.firstStep??'',availability:p.availability??'',activities:p.activities??[],topics:p.topics??[]};}
export function eligibleForIntention(a:Profile,b:Profile,_kind:string){void _kind;return eligible(a,b);}
export function eligible(a:Profile,b:Profile){return a.active&&b.active&&a.id!==b.id&&b.age>=a.minAge&&b.age<=a.maxAge&&a.age>=b.minAge&&a.age<=b.maxAge&&((a.remote&&b.remote)||withinNearby(a,b,MAX_NEARBY_MILES));}
const shared=(a:string[],b:string[])=>Array.from(new Map(a.map(x=>[x.trim().toLowerCase(),x.trim()])).values()).filter(x=>b.some(y=>y.trim().toLowerCase()===x.trim().toLowerCase()));
export function interestOverlap(a:Profile,b:Profile){const left=Array.from(new Set([...a.interests,...a.topics??[]].map(x=>x.trim().toLowerCase()))),right=Array.from(new Set([...b.interests,...b.topics??[]].map(x=>x.trim().toLowerCase())));const exact=left.filter(x=>right.includes(x));const related=interestGroups.filter(g=>!exact.some(x=>x===g.name.toLowerCase()||g.topics.some(t=>t.toLowerCase()===x))&&((left.includes(g.name.toLowerCase())&&g.topics.some(x=>right.includes(x.toLowerCase())))||(right.includes(g.name.toLowerCase())&&g.topics.some(x=>left.includes(x.toLowerCase()))))).map(g=>g.name);return {exact,related};}
const discoveryWords=(p:Profile)=>searchFold([p.question,p.perspective,p.care,p.startIdea,p.about].filter(Boolean).join(' ')).split(/[^a-z0-9]+/).filter(word=>word.length>=5);
export function intellectualOverlap(a:Profile,b:Profile){const left=new Set(discoveryWords(a)),right=new Set(discoveryWords(b));let count=0;for(const word of left)if(right.has(word))count++;return count;}
export function discoveryScore(a:Profile,b:Profile){const overlap=interestOverlap(a,b);return overlap.exact.length*5+overlap.related.length*2+Math.min(3,intellectualOverlap(a,b));}
export function reasons(a:Profile|undefined,b:Profile){if(!a)return ['Explore their interests and introduction'];const context=connectionContext(a,b),r:string[]=[];if(context.exact.length)r.push('Shared interests: '+context.exact.slice(0,3).join(', '));if(context.related.length)r.push('Related interest areas: '+context.related.slice(0,2).map(x=>x.area).join(', '));if(context.activities.length)r.push('Both open to '+context.activities.slice(0,2).map(x=>x.toLowerCase()).join(' and '));if(context.availability)r.push('Similar availability: '+context.availability.toLowerCase());if(context.sameArea)r.push('Same general area');else if(context.distanceMiles!==null&&context.distanceMiles<=MAX_NEARBY_MILES)r.push('Nearby: within '+Math.round(context.distanceMiles)+' miles');else if(context.online)r.push('Both open to online connection');return r.length?r.slice(0,3):['No exact or related interest overlap listed. Explore their introduction.'];}

const base={gender:'Nonbinary',interested:genders,minAge:18,maxAge:99,city:'Austin',region:'Texas',country:'United States',areaLat:30.2672,areaLon:-97.7431,locationPlaceId:'demo:austin',remote:true,intentions:['Build together','Friendship'],orientation:'Prefer not to label',aceOnly:false,expectation:'Unsure',affection:'Ask first. Affection is something to discuss.',faith:'Different worldviews are welcome.',responsibility:'Listen to the impact, apologize specifically, and agree on what changes.',space:'Respect the request. Ask once about a check-in, without demanding a reply.',growth:'Practicing clearer boundaries and making time for people.',active:true,demo:true,background:'',startRole:startRoles[0],care:'',question:'',perspective:'',startIdea:'',offer:'',support:'',firstStep:'',availability:'Weekends',activities:['Conversation','Online calls'],topics:[],hasPhoto:false};
export const examples:Profile[]=[
 {...base,id:'demo-amara',name:'Amara',age:28,gender:'Woman',background:'Nigerian · Yoruba heritage',about:'A curious reader who enjoys history, slow walks, and asking why things became normal.',care:'How culture shapes identity and what we call beautiful.',interests:['History & culture','Power & society','Reading'],topics:['Wigs & beauty history','Makeup & beauty standards','Cultural identity'],question:'Who gets to decide what beauty looks like?',startIdea:'A small reading-and-discussion circle about beauty, identity, and history.',offer:'Finding readings and hosting an unhurried conversation.',support:'Someone curious enough to bring another perspective.',firstStep:'Read one short piece and talk about it over coffee or a call.',activities:['Reading together','Conversation'],growth:'Learning to ask better questions before reaching for conclusions.'},
 {...base,id:'demo-jules',name:'Jules',age:30,about:'I like making things with people and learning from those who see the world differently.',care:'Building belonging while protecting the freedom to disagree.',interests:['Community & collective action','Belief & belonging','Art'],topics:['Systems thinking','Cults & group influence','Independent thought'],question:'How can a community stay accountable without becoming controlling?',startIdea:'A workshop to explore how small communities make decisions.',offer:'Facilitation, creative exercises, and keeping notes.',support:'A thinking partner to design the first session.',firstStep:'Spend 30 minutes sketching a gathering for four people.',activities:['Creating','Organizing','Online calls'],orientation:'Asexual',expectation:'Not wanted',intentions:['Build together','Friendship','Romance']},
 {...base,id:'demo-eli',name:'Eli',age:27,gender:'Man',background:'Black American',city:'Houston',areaLat:29.7604,areaLon:-95.3698,locationPlaceId:'demo:houston',about:'I care about men having friends they can be honest with. Football, music, and real conversation.',care:'Men being able to express emotions without performing strength.',interests:['Men & emotional life','Self-understanding','Football'],topics:['Emotional expression','Male friendship','Self-worth'],question:'What would make it easier for men to ask for support?',startIdea:'A small, consistent conversation circle for men.',offer:'Hosting, listening, and organizing a simple schedule.',support:'Someone willing to show up and help make the space welcoming.',firstStep:'Have one honest conversation and decide whether to meet again.',availability:'Weekday evenings',activities:['Conversation','Local meetups']},
 {...base,id:'demo-noor',name:'Noor',age:29,gender:'Woman',background:'Pakistani heritage',about:'I enjoy cooking, reading, and learning alongside someone. I don’t need to be the person leading.',care:'Care that shows up in ordinary, practical ways.',interests:['Philosophy & humanity','Learning & mentorship','Cooking'],topics:['Human dignity','Mentorship','Compassion'],question:'How do we make care part of everyday life?',startRole:startRoles[1],startIdea:'Join a shared meal, learning circle, or neighborhood project.',offer:'Cooking, patient listening, and helping with logistics.',support:'A clear invitation and a small way to contribute.',firstStep:'Meet for a conversation and choose one useful thing to do together.',activities:['Skill exchange','Volunteering','Conversation'],faith:'Faith matters to me; agreement on everything does not.'}
];

export const sameArea=(a:Profile,b:Profile)=>sameBroadArea(a,b);
export const profileLocation=(p:Profile)=>locationLabel(p)||p.city.trim();
export function compareDiscovery(a:Profile,left:Profile,right:Profile){const l=interestOverlap(a,left),r=interestOverlap(a,right),li=intellectualOverlap(a,left),ri=intellectualOverlap(a,right),ld=candidateDistance(a,left),rd=candidateDistance(a,right);return r.exact.length-l.exact.length||r.related.length-l.related.length||ri-li||discoveryScore(a,right)-discoveryScore(a,left)||Number(sameArea(a,right))-Number(sameArea(a,left))||(ld!==null&&rd!==null?ld-rd:ld!==null?-1:rd!==null?1:0)||left.id.localeCompare(right.id);}
export type DiscoveryFilters={interestMode:'mine'|'any';location:'any'|'local'|'online';radiusMiles:number;minAge:number;maxAge:number;activity:string;availability:string};
export function matchesDiscovery(a:Profile|null,p:Profile,f:DiscoveryFilters){const overlap=a?interestOverlap(a,p):null,nearby=a?withinNearby(a,p,f.radiusMiles):true,online=!!a&&a.remote&&p.remote,location=!a||f.location==='local'?nearby:f.location==='online'?online:nearby||online;return (!a||f.interestMode==='any'||!!(overlap!.exact.length+overlap!.related.length))&&location&&p.age>=f.minAge&&p.age<=f.maxAge&&(!f.activity||(p.activities??[]).includes(f.activity))&&(!f.availability||profileAvailability(p).includes(f.availability));}

export function profileHasInterest(p:Profile,topic:string){const key=topic.trim().toLowerCase(),group=interestGroups.find(g=>g.name.toLowerCase()===key);return [...p.interests,...p.topics??[]].some(x=>x.trim().toLowerCase()===key||group?.topics.some(t=>t.toLowerCase()===x.trim().toLowerCase()));}

// Explain only explicit profile selections. These are conversation cues, not a character score.
const interestKey=(value:string)=>value.trim().toLowerCase();
export function profileInterests(p:Profile){return Array.from(new Map([...p.interests,...p.topics??[]].map(x=>[interestKey(x),x.trim()])).values()).filter(Boolean);}
export function orderedProfileInterests(p:Profile,me?:Profile|null){const all=profileInterests(p);if(!me)return all;const exact=interestOverlap(me,p).exact;return all.filter(x=>exact.includes(interestKey(x))).concat(all.filter(x=>!exact.includes(interestKey(x))));}
export function connectionContext(a:Profile,b:Profile){
 const overlap=interestOverlap(a,b),mine=profileInterests(a),theirs=profileInterests(b);
 const exact=theirs.filter(x=>overlap.exact.includes(interestKey(x)));
 const related=overlap.related.map(area=>{const group=interestGroups.find(g=>g.name===area)!;const keys=group.topics.map(interestKey);return {area,mine:mine.filter(x=>interestKey(x)===interestKey(area)||keys.includes(interestKey(x))),theirs:theirs.filter(x=>interestKey(x)===interestKey(area)||keys.includes(interestKey(x)))};});
 const activities=Array.from(new Set(shared(a.activities??[],b.activities??[])));
 const commonTimes=profileAvailability(a).filter(x=>!['Flexible','Varies','Occasional'].includes(x)&&profileAvailability(b).includes(x));
 const availability=commonTimes.length?commonTimes.join(', '):null;
 const distanceMiles=candidateDistance(a,b);
 const curiosity:string[]=[];
 if(exact.length)curiosity.push('What first drew each of you to '+exact[0]+'?');
 if(b.question?.trim())curiosity.push('Ask about their question: “'+b.question.trim()+'”');
 else if(b.perspective?.trim())curiosity.push('What shaped their perspective: “'+b.perspective.trim()+'”?');
 else if(b.care?.trim())curiosity.push('What makes this important to them: “'+b.care.trim()+'”?');
 const discuss:string[]=[];
 if(profileAvailability(a).length&&profileAvailability(b).length&&!availability)discuss.push('Availability: you list '+profileAvailability(a).join(', ').toLowerCase()+'; they list '+profileAvailability(b).join(', ').toLowerCase()+'. Agree on a time together.');
 if(a.activities?.length&&b.activities?.length&&!activities.length)discuss.push('You listed different activities. Ask what you would both enjoy doing.');
 if(a.expectation&&b.expectation&&a.expectation!=='Unsure'&&b.expectation!=='Unsure'&&a.expectation!==b.expectation)discuss.push('You list different sexual expectations for a possible future relationship. Discuss them only if relevant; starting a friendship creates no sexual expectation.');
 return {exact,related,activities,availability,distanceMiles,sameArea:sameArea(a,b),online:a.remote&&b.remote,curiosity,discuss};
}
// Discover is for new introductions; pending invitations and accepted contacts live in the inbox.
export function newDiscoveryPeople<T extends {id:string}>(people:T[],connections:{status:string;person:{id:string}}[]){
 const connected=new Set(connections.filter(c=>c.status==='pending'||c.status==='accepted').map(c=>c.person.id));
 return people.filter(p=>!connected.has(p.id));
}

export function profileGender(p:Pick<Profile,'gender'|'genderDescription'>){return !p.gender||p.gender==='Prefer not to say'||p.gender==='Self-described'&&!p.genderDescription?.trim()?'Gender not shared':p.gender==='Self-described'?p.genderDescription!.trim():p.gender;}

export const profileTextFields=[
 ['background','Race or cultural background'],['genderDescription','Self-described gender'],['name','Chosen name'],['city','City or general area'],['about','Introduction'],['care','What they care about'],['question','A question they carry'],['perspective','Their perspective'],['startIdea','What they want to explore'],['offer','What they can offer'],['support','What they would appreciate'],['responsibility','Taking responsibility'],['space','Respecting space'],['growth','What they are working on'],['faith','Faith or worldview'],['affection','Affection and boundaries'],['firstStep','Something to do together'],['communicationNote','Communication in their own words']
] as const;
export type ProfileTextField=typeof profileTextFields[number][0];
export type ProfileAnswerRule={field:ProfileTextField;mode:'contains'|'shared'|'not-shared';value:string};
export type ExtraProfileFilters={gender?:string;orientation?:string;expectation?:string;startRole?:string;introPrompt?:string;photo?:'available'|'none';communication?:string[];activities?:string[];answers?:ProfileAnswerRule[]};
// Seven optional attraction choices fit a compact single-choice dropdown; blank is not an identity label.
export const orientationOptions=['Asexual','Gray-asexual','Demisexual','Allosexual','Exploring','Self-described','Prefer not to label'];
export const introPromptOptions=['A little about me','I could talk for hours about…','Something I’m curious about…'];
export function normalizeProfileFilters(value:unknown):ExtraProfileFilters{
 const input=value&&typeof value==='object'?value as Record<string,unknown>:{};const result:ExtraProfileFilters={};
 for(const [key,options] of [['gender',genders],['orientation',orientationOptions],['expectation',expectations],['startRole',startRoles],['introPrompt',introPromptOptions]] as const)if(typeof input[key]==='string'&&options.includes(input[key] as string))result[key]=input[key] as string;
 if(input.photo==='available'||input.photo==='none')result.photo=input.photo;
 for(const [key,options] of [['communication',communicationOptions],['activities',activityOptions]] as const){const choices=Array.isArray(input[key])?Array.from(new Set((input[key] as unknown[]).filter((x):x is string=>typeof x==='string'&&options.includes(x)))):[];if(choices.length)result[key]=choices;}
 const answers=new Map<ProfileTextField,ProfileAnswerRule>();if(Array.isArray(input.answers))for(const rule of input.answers.slice(0,profileTextFields.length)){if(!rule||typeof rule!=='object'||!profileTextFields.some(([field])=>field===rule.field)||!['contains','shared','not-shared'].includes(rule.mode))continue;const text=typeof rule.value==='string'&&rule.value.length<=120?rule.value.trim():'';if(rule.mode==='contains'&&!text)continue;answers.set(rule.field,{field:rule.field,mode:rule.mode,value:rule.mode==='contains'?text:''});}if(answers.size)result.answers=Array.from(answers.values());return result;
}
function searchFold(value:string){return value.normalize('NFKD').replace(/\p{M}/gu,'').trim().toLowerCase();}
export function sharedProfileAnswer(p:Profile,key:ProfileTextField){if(key==='genderDescription'&&p.gender!=='Self-described')return '';const value=p[key];return typeof value==='string'?value.trim():'';}
export function matchesProfileFilters(p:Profile,f:ExtraProfileFilters){
 if(f.gender&&(f.gender==='Prefer not to say'?profileGender(p)!=='Gender not shared':p.gender!==f.gender||f.gender==='Self-described'&&!sharedProfileAnswer(p,'genderDescription')))return false;
 if(f.orientation&&p.orientation!==f.orientation||f.expectation&&p.expectation!==f.expectation||f.startRole&&!profileParticipation(p).includes(f.startRole)||f.introPrompt&&p.introPrompt!==f.introPrompt)return false;
 if(f.photo==='available'&&!p.hasPhoto||f.photo==='none'&&!!p.hasPhoto)return false;
 if(f.communication?.some(choice=>!p.communication?.includes(choice))||f.activities?.some(choice=>!p.activities?.includes(choice)))return false;
 return !f.answers?.some(rule=>{const text=sharedProfileAnswer(p,rule.field);return rule.mode==='shared'?!text:rule.mode==='not-shared'?!!text:!text||!searchFold(text).includes(searchFold(rule.value));});
}
export function profileSearchText(p:Profile){return searchFold([...profileTextFields.map(([field])=>sharedProfileAnswer(p,field)),p.region??'',p.country??'',profileGender(p),p.orientation==='Prefer not to label'?'':p.orientation,p.expectation==='Unsure'?'':p.expectation,...profileAvailability(p),...profileParticipation(p),p.orientationDescription??'',p.introPrompt??'',...profileInterests(p),...p.activities??[],...p.communication??[]].join(' '));}
export function discoverySearchRelevance(p:Profile,query:string){
 const q=searchFold(query);if(!q)return 0;
 const exactInterests=profileInterests(p).map(searchFold);
 if(exactInterests.some(value=>value===q))return 40;
 if(exactInterests.some(value=>value.includes(q)))return 30;
 const intellectual=[p.question,p.perspective,p.care,p.startIdea].map(value=>searchFold(value||''));
 if(intellectual.some(value=>value.includes(q)))return 20;
 if(searchFold(p.about||'').includes(q))return 12;
 return profileSearchText(p).includes(q)?5:0;
}
export function discoverySearchSuggestions(query:string){
 const q=searchFold(query);if(!q)return [];
 const suggestions:string[]=[];
 const add=(value:string)=>{if(value&&!suggestions.includes(value))suggestions.push(value);};
 if(/bronze|ancient|collapse/.test(q)){add('History');add('Ancient Civilizations');add('Collapse & Systems');}
 for(const group of interestGroups){
  const values=[group.name,...group.topics];
  if(values.some(value=>q.includes(searchFold(value))||searchFold(value).includes(q))){add(group.name);for(const topic of group.topics)if(suggestions.length<3)add(topic);}
 }
 return suggestions.slice(0,3);
}
export function profileFilterLabels(f:ExtraProfileFilters){return [
 ...(['gender','orientation','expectation','startRole','introPrompt','photo'] as const).flatMap(key=>f[key]?[{key,label:({gender:'Gender',orientation:'Attraction',expectation:'Sexual expectations',startRole:'Participation',introPrompt:'Introduction prompt',photo:'Photo availability'}[key])+': '+(key==='photo'?(f.photo==='available'?'Uploaded':'Not uploaded'):f[key])}]:[]),
 ...(f.communication??[]).map(value=>({key:'communication:'+value,label:'Communication: '+value})),...(f.activities??[]).map(value=>({key:'activities:'+value,label:'Activity: '+value})),
 ...(f.answers??[]).map(rule=>({key:'answer:'+rule.field,label:profileTextFields.find(([field])=>field===rule.field)![1]+': '+(rule.mode==='contains'?rule.value:rule.mode==='shared'?'Shared':'Not shared')}))
 ];}
export function removeProfileFilter(f:ExtraProfileFilters,key:string){const next={...f};if(key.startsWith('answer:'))next.answers=f.answers?.filter(rule=>rule.field!==key.slice(7));else if(key.startsWith('communication:'))next.communication=f.communication?.filter(choice=>choice!==key.slice(14));else if(key.startsWith('activities:'))next.activities=f.activities?.filter(choice=>choice!==key.slice(11));else delete next[key as keyof ExtraProfileFilters];return normalizeProfileFilters(next);}

// Private profile bookkeeping. Initial entry and calculated birthdays are not corrections.
export function birthDateCorrectionState(previous:{birthDate?:string;birthDateChanges?:number}|null|undefined,nextDate:string){
 const raw=previous?.birthDateChanges;
 const used=raw===undefined?0:typeof raw==='number'&&Number.isInteger(raw)&&raw>=0?Math.min(2,raw):2;
 const changed=!!previous?.birthDate&&nextDate!==previous.birthDate;
 return {used,remaining:2-used,changed,allowed:!changed||used<2,nextUsed:used+(changed&&used<2?1:0)};
}
