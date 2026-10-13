// Navigation Composer 001. Published pairings are observations; lateral walks are invitations, not source history.
export const SOURCE = "https://abundent.org/week/";
export const ALBUM = "https://suno.com/album/7c2ca64a-32ed-4477-a7cb-e00d1a14c9bf";
export const SCHEMA = "static/navigation-score/v0";
const entries = [
  ["Begin again.", "What deserves another beginning?", ["Rosemary Bloom","70b1d32e-21b6-4340-990d-1a4ef67cfc42"], ["Where the Porch Boards Bend","66ce822e-be59-4511-887b-61feda608300"]],
  ["Warmth & motion.", "What makes the hard things softer?", ["Comfy Sweater (Psychedelic Country Daydream)","d4a7e58e-5930-4cbb-825f-9c6c8ed6da27"], ["Neon Fiddle Bounce Drop","2ec9a56b-6916-4af7-a4dd-5031e42f0bea"]],
  ["Good ground.", "What are you planting this week?", ["Neon Aria: Lo-Fi Soul Overture","2ba6fe93-9d4e-4098-acc5-7e53f9d4918b"], ["Good Ground","02af5b55-74b7-455e-9b9f-f7a840ccac3e"]],
  ["Make room.", "Who could use one more chair?", ["Standing on the Hill (Psychedelic Phonk Pop Mix)","f180e7d1-8b2a-4f89-93f8-3c26544d4701"], ["Room at the Table","d6dfeebd-65e7-4c0e-ba84-c092f671e495"]],
  ["Faith & release.", "What can you set down today?", ["Godfather Got My Back","a3cac8da-9c29-43d2-bf21-ba00a2b379bc"], ["Meet Me in the Valley (Loaf-i Mix)","c3a86308-bc04-4abc-911e-f55b03c4d5b2"]],
  ["Through the night.", "Who would you like beside you at morning?", ["Let It Find Us","5c5409ab-97c9-4035-bea0-d29e256e03fd"], ["Midnight Phonk Blues","5195c966-d1da-4e87-a9d4-b48faacf0047"]],
  ["Come home.", "What have you brought home?", ["There by Two","27efd551-733b-4192-be02-a90e3f574f53"], ["Blue Rosemary","c737f489-2912-408e-a444-bb35cdf893cd"]]
];
export const LETTERS = entries.map((e,i)=>({
  id:"letter-"+(i+1), kind:"letter", title:e[0], question:e[1], order:i+1,
  source: SOURCE+"#letter-"+(i+1), children:[e[2][1],e[3][1]]
}));
export const SONGS = entries.flatMap((e,i)=>[e[2],e[3]].map(([title,sunoId])=>({
  id:sunoId, kind:"song", title, letterId:"letter-"+(i+1),
  source:"https://suno.com/song/"+sunoId
})));
export const BUILTIN = [...LETTERS,...SONGS];
const KNOWN = new Map(BUILTIN.map(n=>[n.id,n]));
const idOk = id=>typeof id==="string" && /^[a-z0-9-]{1,80}$/.test(id);
const clean = (v,n)=>typeof v==="string" ? v.trim().slice(0,n) : "";
export function getNode(id,seeds=[]) {return KNOWN.get(id) || seeds.find(n=>n.id===id) || null;}
export function neighbors(id,seeds=[]) {
  if (!id) return LETTERS.map(n=>n.id);
  const n=getNode(id,seeds); if(!n)return [];
  let options=[];
  if(n.kind==="letter"){
    const i=n.order-1;
    options=[...n.children, LETTERS[(i+1)%7].id, LETTERS[(i+6)%7].id];
  } else if(n.kind==="song"){
    const letter=KNOWN.get(n.letterId);
    options=[n.letterId,...letter.children.filter(x=>x!==id)];
  } else if(n.kind==="seed") options=[n.parentId];
  options.push(...seeds.filter(s=>s.parentId===id).map(s=>s.id));
  return [...new Set(options.filter(x=>x!==id))];
}
export function relation(from,to,seeds=[]) {
  if (!getNode(to,seeds) || (from && !neighbors(from,seeds).includes(to))) return null;
  if(!from) return getNode(to,seeds).kind==="letter" ? "chosen-entry" : null;
  const a=getNode(from,seeds), b=getNode(to,seeds);
  if(a.kind==="seed" || b.kind==="seed") return "visitor-created-link";
  if(a.kind==="letter" && b.kind==="letter") return "suggested-letter-walk";
  if(a.kind==="song" && b.kind==="song") return "paired-in-published-letter";
  return "published-letter-membership";
}
export function newSeed(parentId,title,existing=[],phrase="") {
  if(!getNode(parentId,existing)) throw Error("A seed needs an existing particular");
  if(existing.length>=12) throw Error("This score holds at most 12 new particulars");
  title=clean(title,70); phrase=clean(phrase,420);
  if(!title) throw Error("Name the particular");
  const id="seed-"+(existing.length+1);
  if(getNode(id,existing)) throw Error("Seed already exists");
  return {id,kind:"seed",title,phrase,parentId};
}
export function makeScore(path,seeds=[],note="") {
  if (!Array.isArray(path) || path.length>64 || !path.length) throw Error("Choose a path first");
  const validated=validate({schema:SCHEMA,path,seeds,note});
  return {
    schema: SCHEMA, status:"unsigned-local-composition", origin:SOURCE,
    createdAt:new Date().toISOString(), path:validated.path, seeds:validated.seeds,
    note:validated.note,
    observations:validated.path.map((id,i)=>{
      const node=getNode(id,validated.seeds);
      return {id,title:node.title,kind:node.kind,
        relation:relation(i?validated.path[i-1]:null,id,validated.seeds),
        origin:node.kind==="seed"?null:node.source};
    })
  };
}
export function validate(value) {
  if(!value || value.schema!==SCHEMA) throw Error("Unsupported score format");
  if(!Array.isArray(value.seeds) || value.seeds.length>12) throw Error("Invalid seeds");
  const seeds=[];
  for(let i=0;i<value.seeds.length;i++){
    const s=value.seeds[i];
    if(!s || s.id!=="seed-"+(i+1) || !idOk(s.id) ||
       typeof s.title!=="string" || !s.title.trim() || s.title.length>70 ||
       typeof s.phrase!=="string" || s.phrase.length>420 ||
       !getNode(s.parentId,seeds)) throw Error("Invalid new particular");
    seeds.push({id:s.id,kind:"seed",title:s.title,phrase:s.phrase,parentId:s.parentId});
  }
  if(!Array.isArray(value.path) || !value.path.length || value.path.length>64 ||
     typeof value.note!=="string" || value.note.length>800) throw Error("Invalid path or note");
  let from=null;
  for(const id of value.path){
    if(typeof id!=="string" || !relation(from,id,seeds)) throw Error("The path contains an unsupported crossing");
    from=id;
  }
  return {path:[...value.path], seeds, note:value.note};
}
export function invitation(score) {
  const s=validate(score);
  const nodes=s.path.map(id=>getNode(id,s.seeds));
  const unique=[...new Set(nodes.map(n=>n.id))].map(id=>getNode(id,s.seeds));
  const lines=[
    "A LITTLE DOOR SOMEONE MADE",
    "",
    ...nodes.map((n,i)=>(i===0?"ARRIVED: ":"    → ")+n.title),
    ""
  ];
  if(s.note.trim()) lines.push(s.note.trim(),"");
  const songs=unique.filter(n=>n.kind==="song");
  if(songs.length) lines.push("LISTEN",...songs.map(n=>n.title+"\n"+n.source),"");
  const seeds=unique.filter(n=>n.kind==="seed");
  if(seeds.length) lines.push("PARTICULARS MADE HERE",...seeds.map(n=>n.title+(n.phrase?" — "+n.phrase:"")),"");
  lines.push("The listening letters: "+SOURCE,"");
  lines.push("A visitor's invitation, not a signed receipt or official Collective canon.");
  return lines.join("\n");
}
