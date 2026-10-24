// Manual transcription of organization/group labels from an October 24, 2026 CONNECT! board photograph.
// NOT an official Coalition roster. Topic labels are editorial discovery prompts, not verified programs.
// No edges are claimed: crossing marker lines in the photo are not reliably attributable to endpoints.
export const SOURCE = Object.freeze({
  observed: "2026-10-24", title: "CONNECT! gathering board",
  caution: "Names are transcribed from a photograph; spellings, identities, affiliations and activity remain unverified. Individuals' sticky notes are not published."
});
export const TOPICS = Object.freeze({
  "food-land": "Food & land", "environment": "Environment & energy",
  "community": "Community & care", "arts": "Arts & culture",
  "learning": "Learning & youth", "civic": "Civic life",
  "faith": "Faith & gathering", "housing": "Housing & basic needs"
});
const rows = [
  ["mankato-zero-waste","Mankato Area Zero Waste",["environment","community"]],
  ["blue-earth-project","Blue Earth Project",["environment","community"]],
  ["healthcare-for-all","Healthcare for All – MN / Greater Mankato Area",["community","civic"],"Reading may need confirmation"],
  ["martial-arts","Martial Arts",["community"],"Generic board label; not a verified organization name"],
  ["good-counsel-learning","Good Counsel Learning Center",["learning","community"]],
  ["kato-cnm","Kato CNM",["community"],"Abbreviation as written; identity not verified"],
  ["south-central-clean-energy","South Central Clean Energy Council",["environment"]],
  ["prairie-enthusiasts","The Prairie Enthusiasts",["environment","food-land"]],
  ["mankato-fair-trade","Mankato Fair Trade",["community","civic"]],
  ["mankato-welcoming","Mankato Welcoming Committee",["community","civic"]],
  ["copal","COPAL",["community","civic"]],
  ["cada","CADA",["community"]],
  ["mankato-diversity","Greater Mankato Diversity Council",["community","civic"]],
  ["living-earth-center","Living Earth Center",["food-land","environment","community"]],
  ["county-fostering","County Fostering",["community"],"Descriptive board label; organization not identified"],
  ["uu-mankato","Unitarian Universalist Fellowship of Mankato",["faith","community"]],
  ["lec-garden","LEC Community Garden",["food-land","community"],"Potential project, not necessarily a separate organization"],
  ["b-the-light","B the Light",["faith","community"]],
  ["mnsu-alumni","MNSU Mankato & Mankato East HS alumni",["learning","community"],"Informal group description"],
  ["indivisible","Indivisible",["civic","community"],"Local chapter unspecified"],
  ["static-collective","The Static Collective",["arts","community","learning"],"Independent Abundent organizer; presence on board does not imply endorsement"],
  ["real-life-church","Real Life Church",["faith","community"]],
  ["mnsu-environmental","MSU Environmental Committee",["environment","learning"],"Abbreviation preserved from board"],
  ["front-yard-forums","Front Yard Forums",["community","civic"]],
  ["greater-mankato-growth","Greater Mankato Growth",["community","civic"]],
  ["carnegie-art-center","Carnegie Art Center",["arts","community"]],
  ["finnish-american","Finnish American Association",["arts","community"]],
  ["public-health","Public Health",["community"],"General board label, not a specific agency"],
  ["many-rivers","Many Rivers Network",["community","civic"]],
  ["southwest-housing","Southwest Minnesota Housing Partnership",["housing","community"]],
  ["ssnd-laudato-si","SSND / Laudato Si' Chapter of Minnesota",["faith","environment"],"Handwritten wording partly uncertain"],
  ["dfl","DFL",["civic"],"Generic political organization label; no local chapter verified"],
  ["msu","MSU",["learning"],"Abbreviation as written"],
  ["msu-water","MSU Water Resources Team",["environment","learning"]],
  ["new-creation","New Creation",["faith","community"],"Identity not verified"],
  ["isatah","ISATAH",["environment","community"],"As written on the board"],
  ["merely-players","Merely Players",["arts","community"]],
  ["minneopa-friends","Friends of Minneopa State Park",["environment","community"]],
  ["mankato-stewardship","Mankato Stewardship Team",["environment","community"]],
  ["multitudes","Multitudes @ Carnegie Art Center",["arts","community"],"Program/group label as written"]
];
export const ORGANIZATIONS = Object.freeze(rows.map(([id,name,topics,note]) =>
  Object.freeze({id,name,topics:Object.freeze(topics),note:note||"",status:"observed-name-only"})
));
export const byId = id => ORGANIZATIONS.find(o=>o.id===id);
export const sharedTopics = (a,b) => a.topics.filter(t=>b.topics.includes(t));
export const candidateNeighbors = (id,limit=6) => {
  const one=byId(id); if(!one)return [];
  return ORGANIZATIONS.filter(o=>o.id!==id).map(o=>({organization:o,shared:sharedTopics(one,o)}))
    .filter(c=>c.shared.length).sort((a,b)=>b.shared.length-a.shared.length||a.organization.name.localeCompare(b.organization.name)).slice(0,limit);
};
export const pairLink = (page,ids) => {
  const valid=[...new Set(ids)].filter(id=>byId(id)).slice(0,2);
  if(valid.length!==2)throw Error("Select two visible organizations.");
  const url=new URL(page);url.search="";url.hash="";url.searchParams.set("pair",valid.join(","));
  return url.toString();
};
