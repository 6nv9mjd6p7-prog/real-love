export const conversationGoals=['Everyday','Go deeper','Communicate','Do together'] as const;
export type ConversationGoal=typeof conversationGoals[number];
export type ConversationIdea={id:string;label:string;text:string;theme:string;reason:string};
type Entry=[string,string,string,string];
const library:Record<ConversationGoal,Entry[]>={
 Everyday:[
  ['music','Music','What song have you had on repeat lately?','play'],
  ['food','Food','What is a meal you always look forward to?','everyday'],
  ['small-wins','Small wins','What is one small thing that made your day better?','care'],
  ['free-time','Free time','If you had a free afternoon, how would you spend it?','play'],
  ['recommend','Recommendations','Have you watched, read, or played anything you would recommend?','learn'],
  ['curiosity','Curiosity','What is something new you would like to try?','learn']
 ],
 'Go deeper':[
  ['perspective','Perspective','What is something you have changed your mind about?','learn'],
  ['learning','Learning','What has taught you something useful recently?','learn'],
  ['care','Care','What does a thoughtful friendship look like to you?','care'],
  ['belong','Belonging','What helps you feel welcome in a group?','care'],
  ['meaning','Meaning','What is something you would like to make more time for?','everyday'],
  ['difference','Different views','How can we make room for different views while treating each other well?','understand']
 ],
 Communicate:[
  ['explore','Explore','What led you to that view?','understand'],
  ['listen','Listen','Would you like me to listen or help think it through?','care'],
  ['clarify','Clarify','I may have misunderstood. What did you mean?','understand'],
  ['pace','Pace','What kind of pace works for you when staying in touch?','everyday'],
  ['boundary','Set a boundary','I need some time. I’ll reach out when I’m ready.','care'],
  ['repair','Repair','I see how that affected you. Can we talk about it?','understand']
 ],
 'Do together':[
  ['first-step','Small first step','What is one small thing we could try together, with no pressure to commit?','build'],
  ['share-skill','Share a skill','Is there something you would enjoy teaching or learning together?','learn'],
  ['low-cost','Keep it accessible','What could we do together that costs little or nothing?','play'],
  ['offer-help','Offer support','Is there a small task we could help each other with, if anyone wants to?','care'],
  ['make-plan','Make a plan','What would make a first activity comfortable and practical for everyone?','build'],
  ['check-in','Check in','After we try it, how could we check what worked and what to change?','build']
 ]
};
export function suggestionTopics(values:string[]=[]){
 const seen=new Set<string>();return values.map(value=>value.replace(/[\u0000-\u001f\u007f]/g,'').trim()).filter(value=>{const key=value.toLowerCase();if(!value||value.length>60||seen.has(key))return false;seen.add(key);return true;}).slice(0,12);
}
// Curated and deterministic. Inputs are explicit choices, never messages or inferred identities.
export function recommendConversationIdeas({goal,topic='',starters=[],preferred=[],skipped=[],circle=false}:{goal:ConversationGoal;topic?:string;starters?:string[];preferred?:string[];skipped?:string[];circle?:boolean}):ConversationIdea[]{
 const selected=suggestionTopics([topic])[0]||'';
 const ideas:ConversationIdea[]=library[goal].map(([id,label,text,theme])=>({id:goal+':'+id,label,text,theme,reason:'From '+goal.toLowerCase()}));
 if(goal==='Everyday'&&!circle)starters.slice(0,3).filter(text=>text.trim()&&text.length<=300).reverse().forEach((text,index)=>ideas.unshift({id:'starter:'+index+':'+text,label:'Starting point',text,theme:'learn',reason:'A conversation starting point'}));
 if(selected){
  const texts:Record<ConversationGoal,string[]>={
   Everyday:[`What have you been enjoying about ${selected} lately?`,`What would you recommend to someone curious about ${selected}?`],
   'Go deeper':[`Has ${selected} changed how you see something? Share only what feels comfortable.`,`What is a question about ${selected} you would like to explore?`],
   Communicate:[`What would help us understand each other when we talk about ${selected}?`,`How could we discuss different views about ${selected} respectfully?`],
   'Do together':[`What is a small, low-cost way we could explore ${selected} together?`,`What could we learn or make together around ${selected}, if everyone wants to?`]
  };
  texts[goal].forEach((text,index)=>ideas.unshift({id:goal+':topic:'+selected+':'+index,label:selected,text,theme:'topic:'+selected,reason:'You chose '+selected}));
 }
 const hidden=new Set(skipped),liked=new Set(preferred);
 return ideas.filter(idea=>!hidden.has(idea.id)).map((idea,index)=>({idea,index,score:(liked.has(idea.theme)?10:0)+(selected&&idea.theme==='topic:'+selected?5:0)})).sort((a,b)=>b.score-a.score||a.index-b.index).slice(0,3).map(({idea})=>({...idea,reason:liked.has(idea.theme)?'More like an idea you chose':idea.reason}));
}
