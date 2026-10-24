export function sampleReplyFor(text:string,turn:number){
 const replies=[
  'That is a thoughtful question. I think a group can stay accountable when expectations are clear, decisions are open to discussion, and people can raise concerns without being punished.',
  'I like that distinction. Maybe accountability works best when it includes a way to repair harm and revisit the rules together, instead of relying on one person to police everyone.',
  'That makes sense. What would a small, practical version of that look like for a group just getting started?'
 ];
 return replies[(Math.max(1,turn)-1)%replies.length];
}
