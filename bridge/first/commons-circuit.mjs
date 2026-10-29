// VOQAL-009 · THE COMMONS CIRCUIT
// Unapproved, unsent public-safe 2027 fellowship planning scenarios. NOT a live grant,
// calendar, invitation, institutional affiliation or commitment to spend.
export const COMMONS_STORY=Object.freeze({
 schema:"abundent/commons-circuit-planning-v1",
 stage:"APPLICANT_REVIEW_NOT_SUBMITTED",
 title:"Still Here — The First Circle Foundry: The Commons Circuit",
 purpose:"Use recurring, inclusive, in-person encounters to test whether isolated people and existing community stewards can voluntarily form independent circles of care, creativity, and locally useful cooperative exchange.",
 homeRegion:"Southern Minnesota (proposed, not a confirmed host site)",
 duration:"April–September 2027 (only if selected)",
 horizon:"A reproducible, non-extractive founding culture and locally governed economy that can be copied, revised or refused without inherited founder control.",
 immediateQuestion:"Can an optional table, potluck, art night or community-work encounter lead to a real, voluntarily completed, independently confirmed useful act—and a self-governed next circle?",
 hosting:"NO_SITES_PARTNERS_VOLUNTEERS_OR_EVENT_PERMISSIONS_CONFIRMED",
 spending:"ILLUSTRATIVE_PLANNING_NOT_COMMITTED",
 relationships:"NO_OUTBOUND_CONTACT_OR_MEETINGS_FROM_THIS_PROPOSAL",
 activities:"CONDITIONAL_ONLY",
 rights:"Original owners control spaces, resources, stories, safety and work; no account, fee, public testimony, ideology or religious participation required.",
 warning:"Mutual aid and resource exchange do not constitute a new licensed institution, financial settlement, verified inventory or government authorization."
});
const line=(id,title,units,usdPerUnit,notes)=>Object.freeze({id,title,units,usdPerUnit,usd:units*usdPerUnit,notes});
export const COMMONS_BUDGET=Object.freeze([
 line("weekly-tables","24 weekly open tables / low-barrier hosted gatherings",24,150,"Food and room supplies, only when approved; six weeks allow scheduling gaps and fellowship travel."),
 line("potluck-chain","6 monthly relay potluck anchors",6,400,"Shared meals, portable materials and host reimbursement; invite a next table without pressure."),
 line("culture-nights","3 participatory music, story, art and commons nights",3,800,"Small accessible events with consenting local performers, sound and venue."),
 line("mini-festivals","One conditional mini-festival as a production and accessibility rehearsal",1,2000,"A second is optional ONLY with separately approved funding/capacity; host permissions, safety, food rules and insurance required."),
 line("steward-meetings","24 weekly stewardship conversations and site visits",24,75,"Real local transportation, accessible meeting costs and documented follow-up; NOT gifts or payments for official access."),
 line("paid-co-facilitators","15 paid resident-led facilitation / safeguarding review sessions",15,300,"Compensate residents and qualified reviewers; no unpaid extraction of personal history."),
 line("access-pool","12 accessibility and participation-support allocations",12,200,"Childcare, access formats, interpreters, participant transit or accommodations as needed."),
 line("founder-fieldwork","8 founder fieldwork support installments",8,500,"Limited support for organizing labor; if living needs are greater, adapt the unrestricted budget openly."),
 line("safety-permits","One flexible event permissions, insurance and contingency pool",1,1900,"Venue, event and child-safety requirements remain separate; scale down rather than waive safety."),
 line("harmony-finale-seed","Conditional Harmony Park September family Commons festival SEED only",1,5000,"NOT a total production cost; no venue quote, booking, promoter, insurance, sponsors or Voqal attendance; full festival requires separate viable financing and production.")
]);
export const TOTAL=COMMONS_BUDGET.reduce((s,x)=>s+x.usd,0);
export const DRAFT_750="Still Here — The First Circle Foundry will invest six months in weekly community tables, potluck chains, music and practical exchange across southern Minnesota. We will seek conversations with local stewards of spaces, food systems, campuses, arts and existing services. After a small festival rehearsal, we aim to co-produce a full family-friendly closing Commons festival at Harmony Park in September 2027, only if the venue, production team and additional resources are secured. We would independently invite Voqal peers and staff, without assuming attendance. The experiment tests whether gatherings generate real, resident-confirmed cooperation and independent circles that can pass on founding practices without passing on the founder's authority.";

export const WEEKLY_CADENCE=Object.freeze([
 Object.freeze({day:"Week's open table",proposed:"Host or join one accessible table, meal, or community gathering; never a substitute for specialist support.",gate:"Independent host consent, participant comfort and a genuinely accessible nonreligious alternative."}),
 Object.freeze({day:"Week's steward conversation",proposed:"Seek one listening meeting with a real keeper of space, distribution, programming, facilities, equipment, or relationships.",gate:"No presumption of authority or partner enrollment; no payments or favors for access to public officials."}),
 Object.freeze({day:"Week's possible useful act",proposed:"If invited, co-design one small, reversible, lawful resource/service exchange (or conclude existing practice is better).",gate:"Every material owner and recipient independently authorizes and later verifies the actual return."}),
 Object.freeze({day:"Week's return",proposed:"Ask the receiving person whether the act was useful, record a private nonidentifying learning summary, and invite a successor table only if wanted.",gate:"No public beneficiary story, service claim, reputation metric or automatically inherited circle."})
]);
export const PHASES=Object.freeze([
 Object.freeze({months:"April",stage:"LISTEN / SAFETY",action:"Review safeguarding, access, host rules and prior local initiatives; seek permission for the first public-safe table; map local stewardship roles.",result:"Approved or refused first host and living questions, not partner tallies."}),
 Object.freeze({months:"May–June",stage:"START / RELAY",action:"Run conditional weekly gatherings, start participant-led potluck relay, consult space/resource stewards and test one small, optional useful return.",result:"Evidence of actual hosts' decisions, inclusion, missed meetings and independently checked outcomes."}),
 Object.freeze({months:"July–August",stage:"CELEBRATE / COOPERATE",action:"If earlier events were safe and useful, run one authorized mini-festival as a full production rehearsal, then seek Harmony Park availability, promoter and honest all-ages final festival quote. An optional second mini only if separately resourced.",result:"Whether a receiver-owned circle or cooperative exchange exists without the founder running it."}),
 Object.freeze({months:"September",stage:"HAND BACK / INHERIT",action:"If fully funded and authorized, co-produce a family-friendly full-fledged Commons festival at Harmony Park and invite Voqal staff/peers/alumni without presuming attendance. Otherwise hold a smaller permitted closing gathering; publish only independently approved public-safe methods.",result:"Independent critique, rejected assumptions, costs and optional successor interest—not a claimed new economy."})
]);
export const STOP_RULES=Object.freeze([
 "NO_PARTNER_UNTIL_EXPLICIT_PERMISSION",
 "NO_PAID_ACCESS_OR_INDUCEMENTS_TO_PUBLIC_OFFICIALS",
 "NO_SURVIVOR_TESTIMONY_OR_PERSONAL_SAFETY_DETAILS_AT_PUBLIC_EVENTS",
 "NO_EMERGENCY_SUPPORT_OR_PEER_MATCHING_WITHOUT_QUALIFIED_SAFEGUARDING",
 "NO_FOOD_TRANSFERS_WITHOUT_ADHERENCE_TO_HOST_AND_LOCAL_REQUIREMENTS",
 "NO_PUBLIC_EVENT_WITHOUT_SITE_PERMISSION_AND_ADEQUATE_SAFETY_COVERAGE",
 "NO_COERCED_MEMBERSHIP_RELIGIOUS_PARTICIPATION_OR_GLOBAL_IDENTITY",
 "NO_RESOURCE_OR_TOKEN_ISSUANCE_FROM_MERE_PROPOSALS",
 "NO_LEGAL_PARTNERSHIP_FROM_AN_INVITATION_OR_HANDSHAKE",
 "NO_HARMONY_PARK_EVENT_BOOKING_WITHOUT_VENUE_CONTRACT",
 "NO_VOQAL_STAFF_ATTENDANCE_OR_ENDORSEMENT_WITHOUT_EXPLICIT_RESPONSE",
 "NO_FULL_SCALE_FESTIVAL_CLAIM_FROM_FIVE_THOUSAND_DOLLAR_SEED"
]);
export const FINALE=Object.freeze({
 title:"The Commons Homecoming — working title for an all-ages Harmony Park finale",
 venue:"Harmony Park Music Garden, Clarks Grove MN",
 venueSource:"https://harmonypark.com/",
 bookingSource:"https://harmonypark.com/contact/",
 timePreference:"late summer/September 2027; exact date unconfirmed and must avoid Voqal September convening and existing park festivals",
 priorFamilyProof:"Separate Harmony Family Campout 2027 May 28–30, presented by Harmony Park and Groove Productions; not our event",
 desiredScale:"FULL_FAMILY_FESTIVAL_IF_SAFE_VIABLE_PRODUCTION_EXISTS",
 initialSeedUSD:5000,
 seedIsFullFestivalBudget:false,
 venueBooked:false,
 quoteReceived:false,
 operatorPermission:false,
 promoterContracted:false,
 fullyFinanced:false,
 voqalInvitationsSent:false,
 voqalAttendanceConfirmed:false,
 artistOrVendorContracted:false,
 miniFestivalAuthorized:false,
 familySafeguardingReviewed:false,
 fallback:"smaller separately permitted closing gathering elsewhere; no unsupported full-festival promise"
});
export function planningPacket(){
 return {schema:COMMONS_STORY.schema,status:COMMONS_STORY.stage,title:COMMONS_STORY.title,
  budgetUSD:TOTAL,lines:COMMONS_BUDGET.map(x=>({...x})),finale:{...FINALE},
  phases:PHASES.map(x=>({...x})),weekly:WEEKLY_CADENCE.map(x=>({...x})),stopRules:[...STOP_RULES],
  claimedHosts:0,scheduledMeetings:0,completedFestivals:0,externalConsent:false,
  formalOrganizationsCreated:0,verifiedEconomicReturns:0,realCommunityRelationshipsMeasured:false,
  applicantApproved:false,applicationSubmitted:false};
}
