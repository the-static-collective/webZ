// VOQAL-013 Story Rooms receiver: external story questions are never canon, evidence,
// consent, rights or source-owner authority. Independently checks public source allowlist.
const allow=new Map([
  {
    "id": "collective-movie",
    "state": "CROSS_MEDIA_RELATION_CANON_EVENT_ONLY",
    "url": "https://app.gitbook.com/o/ddlx1UAH93SFyQsNFNa4/s/HILTtUulCBDqDzXXk6RQ/the-pet-sitter-featured-story-seed/the-room-inside-the-room-multimedia-project-seed/canon-001-the-collection-event",
    "medium": "MOVIE"
  },
  {
    "id": "pet-sitter",
    "state": "FEATURED_STORY_SEED",
    "url": "https://app.gitbook.com/o/ddlx1UAH93SFyQsNFNa4/s/HILTtUulCBDqDzXXk6RQ/the-pet-sitter-featured-story-seed",
    "medium": "COMEDY_FILM"
  },
  {
    "id": "deuce-stream",
    "state": "INCUBATING_MULTIMEDIA_SEED",
    "url": "https://app.gitbook.com/o/ddlx1UAH93SFyQsNFNa4/s/HILTtUulCBDqDzXXk6RQ/the-pet-sitter-featured-story-seed/the-room-inside-the-room-multimedia-project-seed",
    "medium": "LIVE_STREAM"
  },
  {
    "id": "renji-game",
    "state": "INCUBATING_MULTIMEDIA_SEED",
    "url": "https://app.gitbook.com/o/ddlx1UAH93SFyQsNFNa4/s/HILTtUulCBDqDzXXk6RQ/the-pet-sitter-featured-story-seed/the-room-inside-the-room-multimedia-project-seed",
    "medium": "GAME"
  },
  {
    "id": "renji-treatise",
    "state": "FICTIONAL_BOOK_PROPOSAL",
    "url": "https://app.gitbook.com/o/ddlx1UAH93SFyQsNFNa4/s/HILTtUulCBDqDzXXk6RQ/the-pet-sitter-featured-story-seed/the-room-inside-the-room-multimedia-project-seed",
    "medium": "IN_WORLD_BOOK"
  },
  {
    "id": "collection-event",
    "state": "FIXED_FICTIONAL_CANON",
    "url": "https://app.gitbook.com/o/ddlx1UAH93SFyQsNFNa4/s/HILTtUulCBDqDzXXk6RQ/the-pet-sitter-featured-story-seed/the-room-inside-the-room-multimedia-project-seed/canon-001-the-collection-event",
    "medium": "AUTHOR_APPROVED_FICTIONAL_CANON"
  },
  {
    "id": "octopus-rooms",
    "state": "CANDIDATE_CREATIVE_SEED",
    "url": "https://github.com/the-static-collective/the-daily-slice/blob/23c3d4bf7e4febb89919a3d54b6e8aaf3a764120/slices/2026/09/2026-09-16/octopus-made-this-rooms-that-remember.md",
    "medium": "SYSTEMIC_GAME_AND_BOOK"
  },
  {
    "id": "octopus-mutation",
    "state": "CANDIDATE_MUTATION_NOT_CANON",
    "url": "https://github.com/the-static-collective/the-daily-slice/blob/23c3d4bf7e4febb89919a3d54b6e8aaf3a764120/slices/2026/09/2026-09-16/octopus-made-this-mutation-line-001-relational-cold-war.md",
    "medium": "IN_WORLD_FABLE_AND_RTS_IDEA"
  }
].map(x=>[x.id,x]));
const allowedPurpose=new Set(['SECOND_TABLE','OPEN_STORY_EXPLORATION','VOQAL_APPLICANT_REVIEW']);
const lensIds=['VIEWPOINT','ABSENCE','RECEIVER','CARRIER'];
const hold=s=>{throw Error('STORY_RECEIVER_HOLD_'+s);};
const keys=(o,k)=>{if(!o||typeof o!=='object'||Array.isArray(o)||
 Object.keys(o).sort().join('|')!==[...k].sort().join('|'))hold('FIELDS');};
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
async function sha(payload){
 const bytes=new TextEncoder().encode(JSON.stringify(payload));
 const buf=await crypto.subtle.digest('SHA-256',bytes);
 return 'sha256:'+Array.from(new Uint8Array(buf),b=>b.toString(16).padStart(2,'0')).join('');
}
export async function inspectStoryRooms(packet){
 if(packet===null)return {accepted:false,state:'NO_STORY_PACKET',questions:[],sourceIds:[],planCandidates:[]};
 if(typeof packet==='string'){if(packet.length>60000)hold('SIZE');try{packet=JSON.parse(packet)}catch{hold('JSON');}}
 if(JSON.stringify(packet).length>60000)hold('SIZE');
 keys(packet,['schema','payload','digest']);
 if(packet.schema!=='jarvis.story-rooms-packet/v1')hold('SCHEMA');
 const p=packet.payload;
 keys(p,['schema','purpose','sourceReferences','branches','questions','planCandidates','suggestedActivity',
  'sourceMode','humanOutcomes','realWorldClaims','mediaEnginesExecuted','newStoryCanonDeclared',
  'sourceOwnerAdmission','externalAction','voqalApplicationSubmitted','rules','authority']);
 if(p.schema!=='jarvis.story-rooms-payload/v1'||!allowedPurpose.has(p.purpose)||
  p.sourceMode!=='PUBLIC_CREATIVE_SOURCE_DESCRIPTIONS_NO_MEDIA_COPIED'||
  p.humanOutcomes!==0||p.realWorldClaims!==false||p.mediaEnginesExecuted!==0||
  p.newStoryCanonDeclared!==false||p.sourceOwnerAdmission!==false||p.externalAction!==false||
  p.voqalApplicationSubmitted!==false||p.authority!=='NONE_REVIEW_HOLD')hold('STATUS');
 if(packet.digest!==await sha(p))hold('DIGEST');
 if(!Array.isArray(p.sourceReferences)||p.sourceReferences.length<2||p.sourceReferences.length>5||
    !Array.isArray(p.branches)||!Array.isArray(p.questions)||!Array.isArray(p.planCandidates)||
    !Array.isArray(p.rules)||!p.rules.includes('CANON_001_STAYS_FIXED')||
    !p.rules.includes('OCTOPUS_NOT_SCIENTIFIC_CLAIM')||
    !p.rules.includes('RENJI_NOT_AMNESIAC')||
    !p.rules.includes('NO_REAL_SENSITIVE_DATA'))hold('RULES');
 const refs=p.sourceReferences;
 const ids=refs.map(s=>s.id);
 if(new Set(ids).size!==ids.length||ids.some((id,i)=>i>0&&ids[i-1]>=id))hold('ORDER');
 for(const s of refs){
  keys(s,['id','title','medium','state','url','mechanic','boundary']);
  const entry=allow.get(s.id);
  if(!entry||s.url!==entry.url||s.state!==entry.state||s.medium!==entry.medium||
    typeof s.title!=='string'||s.title.length<5||s.title.length>140||
    typeof s.mechanic!=='string'||s.mechanic.length<30||s.mechanic.length>500||
    typeof s.boundary!=='string'||s.boundary.length<35||s.boundary.length>550)hold('SOURCE');
 }
 if(p.branches.length!==ids.length*(ids.length-1)/2||
   p.questions.length!==p.branches.length||p.planCandidates.length!==p.branches.length||
   typeof p.suggestedActivity!=='string'||p.suggestedActivity.length>600)hold('COUNT');
 let index=0;const questions=[],plans=[];
 for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){
  const pair=[ids[i],ids[j]],b=p.branches[index],c=p.planCandidates[index];
  if(!b||!c||!eq(b.parentIds,pair)||!eq(c.parentIds,pair)||
    b.status!=='CROSS_MEDIA_PROPOSAL_NOT_STORY_CANON'||
    c.status!=='PLANNING_CANDIDATE_ONLY'||c.executed!==false||c.ownerApproved!==false||
    c.rightsCleared!==false||c.realPeople!==0||c.question!==b.question||
    p.questions[index]!==b.question||!Array.isArray(b.cuts)||b.cuts.length!==4||
    !eq(b.cuts.map(x=>x.lensId),lensIds)||!eq(c.cuts,lensIds)||
    b.cuts.some(x=>x.state!=='FICTIONAL_LENS_HOLD')||
    typeof b.question!=='string'||b.question.length>1100||
    typeof c.smallestProof!=='string'||c.smallestProof.length>400||
    typeof c.falsifier!=='string'||c.falsifier.length>400)hold('CROSSING');
  questions.push(b.question);
  plans.push({id:c.id,parentIds:pair,question:c.question,status:'HELD_STORY_INSPIRED_PLAN_ONLY'});
  index++;
 }
 return {accepted:true,state:'LOCAL_CHECKSUM_AND_FIXED_CATALOG_ONLY',
  sourceIds:ids,questions,planCandidates:plans,sourceDigest:packet.digest,
  realWorldProof:false,permissionToPublish:false,fictionalCanonModified:false};
}
