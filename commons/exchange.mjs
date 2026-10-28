
/** Porchlight Commons 001: browser-only organizational draft and route comparison.
 * Nothing here is authenticated, signed, dispatched, admitted, or fulfilled.
 */
export const CATEGORIES = Object.freeze(["food","energy","communication","transport","tools","shelter-support","practice"]);
export const UNITS = Object.freeze(["parcels","kg","meals","items","hours","kWh","sessions"]);
export const ROUTES = Object.freeze(["local-purchase","remote-donation","knowledge-transfer"]);
const unsafe = /(?:[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?:\+?\d[\d\s().-]{7,}\d)|\b(?:guest|client|resident|patient)\s*(?:name|id|address)\b|\b(?:street address|shelter address|exact location)\b)/i;
function safeText(value,field,max){
  const s=String(value??"").trim().replace(/\s+/g," ");
  if(!s || s.length>max)throw Error(field+" is required, maximum "+max+" characters.");
  if(unsafe.test(s))throw Error("Remove contact information, personal case details, and exact locations before exporting.");
  return s;
}
export function draftNeed(input){
  const category=String(input.category??"");
  const unit=String(input.unit??"");
  const quantity=Number(input.quantity);
  if(!CATEGORIES.includes(category))throw Error("Choose a supported category.");
  if(!UNITS.includes(unit))throw Error("Choose a supported unit.");
  if(!Number.isSafeInteger(quantity)||quantity<1||quantity>100000)throw Error("Quantity must be a whole number between 1 and 100,000.");
  const window=String(input.window??"");
  if(!["7-days","30-days","exploratory"].includes(window))throw Error("Choose a time window.");
  return {
    schema:"porchlight-commons/organizational-need/v0",
    status:"HOLD",
    source_kind:"UNVERIFIED_OPERATOR_DRAFT",
    public_scope:"ORGANIZATION_LEVEL_ONLY",
    origin_region:safeText(input.region,"Region",80),
    category,
    requirement:{summary:safeText(input.summary,"Need",160),quantity,unit,window},
    local_operator_authorized:false,
    responder_accepted:false,
    receiver_confirmed:false,
    people:[],
    precise_sites:[],
    evidence:[],
    notice:"Not a request from a verified provider. No guest data, service availability, permission, commitment, dispatch, or fulfillment is established."
  };
}
export function compareRoutes(offers){
  if(!Array.isArray(offers)||offers.length!==3)throw Error("Compare three specified paths.");
  const assessed=ROUTES.map((route,i)=>{
    const row=offers[i]??{};
    if(row.route!==route)throw Error("Route order or type invalid.");
    const raw=row.estimatedUSD;
    const estimatedUSD=(raw==null||String(raw).trim()==="")?null:Number(raw);
    if(estimatedUSD!==null&&(!Number.isFinite(estimatedUSD)||estimatedUSD<0||estimatedUSD>100000000))
      throw Error("Use a valid nonnegative estimated total cost.");
    const eligible=row.reviewed===true && (route!=="remote-donation" || row.importCleared===true);
    return {route,estimatedUSD,eligible,missing:estimatedUSD===null?"cost estimate":(!row.reviewed?"local suitability review":route==="remote-donation"&&!row.importCleared?"import / shipping clearance":null)};
  });
  const candidates=assessed.filter(x=>x.eligible&&x.estimatedUSD!==null);
  const ranked=[...candidates].sort((a,b)=>a.estimatedUSD-b.estimatedUSD);
  return {
    routes:assessed,
    lowestStatedEligible:ranked.length?ranked[0].route:null,
    savingsAgainstNextEligible:ranked.length>=2?Number((ranked[1].estimatedUSD-ranked[0].estimatedUSD).toFixed(2)):null,
    caveat:"Illustrative estimates only. USD totals must include freight, taxes, maintenance, labor, time, suitability, permits and local opportunity costs. Lowest stated estimate is not an approval or a verified price."
  };
}
export function draftPacket(need,comparison){
  if(need?.schema!=="porchlight-commons/organizational-need/v0"||need.status!=="HOLD")
    throw Error("Only an unapproved HOLD card can be exported.");
  return {
    schema:"porchlight-commons/exchange-packet/v0",
    visibility:"REVIEW_BEFORE_SHARING",
    dispatch:"DISABLED",
    need,
    possible_routes:comparison,
    handoff:{
      originating_provider:"NOT_ESTABLISHED",
      local_steward:"NOT_VERIFIED",
      independent_lived_experience_review:"PENDING",
      resource_offer:"NOT_ACCEPTED",
      recipient_confirmation:"NOT_RECEIVED",
      partner_agreement:"NOT_SIGNED"
    },
    transition_law:"proposal != partner authorization; donor report != recipient confirmation; match != delivery; lower price != adequate or lawful supply"
  };
}
