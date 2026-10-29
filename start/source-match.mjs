// FIRST-INCH-003: lexical discovery over a source-identified, reviewed PUBLIC editorial catalog.
// Ranking measures token overlap, not partnership, availability, consent or feasibility.
const STOP = new Set(["a","an","and","are","as","at","be","build","can","do","for","from","get","help","how","i","in","into","is","it","make","my","need","of","on","or","our","some","start","the","to","want","we","what","with","would","you"]);
const ALIASES = Object.freeze({
  groceries:"grocery",grocers:"grocery",farmers:"farm",farms:"farm",
  growers:"grower",shelters:"shelter",festivals:"festival",
  musicians:"music",songs:"song",bands:"band",churches:"church",
  volunteers:"volunteer",students:"students",newsletter:"newsletter",
  makers:"maker",printing:"print",printers:"printer",websites:"website",
  nonprofit:"organization",nonprofits:"organization",
  homelessness:"homelessness",housing:"housing",foodbank:"food",
  foodbanks:"food",worshipping:"worship"
});
function tokens(value) {
  const parts = String(value).normalize("NFKC").toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
  return [...new Set(parts.map(t=>ALIASES[t]||t).filter(t=>t.length>=3&&!STOP.has(t)))];
}
function validCatalog(catalog) {
  if(catalog?.schema!=="abundent/first-inch-public-doors/v1" ||
      catalog?.source?.authority!=="PUBLIC_EDITORIAL_SOURCE_NOT_PARTNER_AUTHORITY" ||
      !/^[0-9a-f]{40}$/.test(catalog?.source?.gitBlobSha||"") ||
      !Array.isArray(catalog.entries)||catalog.entries.length<1||catalog.entries.length>100) return false;
  const seen = new Set();
  return catalog.entries.every(entry=>{
    if(!entry || typeof entry.id!=="string"||seen.has(entry.id)||!Array.isArray(entry.tags)||
       entry.tags.length>60||!entry.tags.every(t=>typeof t==="string"&&t.length<=50)||
       !["RESEARCH_PROPOSAL","PUBLIC_PROTOTYPE","DOCUMENTED_IMPLEMENTATION","DOCUMENTED_PROTOCOL","LOCAL_OPERATOR_PROTOTYPE"].includes(entry.state)||
       typeof entry.title!=="string"||typeof entry.firstCheck!=="string"||
       entry.firstCheck.length>700||entry.title.length>250||
       !/^https:\/\/github\.com\/the-static-collective\/[a-zA-Z0-9._-]+\/blob\/[a-f0-9]{40}\//.test(entry.source||"")) return false;
    seen.add(entry.id);
    return true;
  });
}
export function rankPublicDoors(goal, catalog, limit=4) {
  if(!validCatalog(catalog)) throw new TypeError("Unrecognized public editorial catalog.");
  if(typeof goal!=="string"||goal.trim().length<10||goal.length>600) throw new RangeError("Goal out of bounds.");
  if(!Number.isSafeInteger(limit)||limit<1||limit>10)throw new RangeError("Result limit out of bounds.");
  const query=tokens(goal).slice(0,60);
  const ranked=catalog.entries.map(entry=>{
    const tagset = new Set(entry.tags.flatMap(tokens));
    const title = new Set(tokens(entry.title));
    const matched=query.filter(t=>tagset.has(t)||title.has(t));
    const score=matched.reduce((n,t)=>n+(tagset.has(t)?3:0)+(title.has(t)?1:0),0);
    return {id:entry.id,title:entry.title,state:entry.state,firstCheck:entry.firstCheck,
      source:entry.source,matched,score,disposition:"PUBLIC EDITORIAL POINTER — NOT A RESOURCE OR PARTNER MATCH"};
  }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||b.matched.length-a.matched.length||a.id.localeCompare(b.id));
  return {schema:"abundent/first-inch-source-suggestions/v1",catalogRelease:catalog.source.release,
    sourceBlob:catalog.source.gitBlobSha,
    queryTokens:query,results:ranked.slice(0,limit),totalMatches:ranked.length,
    interpretation:"Exact lexical overlap in a dated public catalog only. No model inference, partner verification or resource availability."};
}
