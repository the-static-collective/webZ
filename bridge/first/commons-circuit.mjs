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
 line("weekly-tables","24 weekly open tables / low-barrier hosted gatherings",24,200,"Food and room supplies, only when approved; six weeks allow scheduling gaps and fellowship travel."),
 line("potluck-chain","6 monthly relay potluck anchors",6,500,"Shared meals, portable materials and host reimbursement; invite a next table without pressure."),
 line("culture-nights","4 participatory music, story, art and commons nights",4,1000,"Small accessible events with consenting local performers, sound and venue."),
 line("mini-festivals","2 optional community mini-festivals or scaled-down gatherings",2,2000,"Conditional on site permission, event staff, adequate coverage, safe food and insurance."),
 line("steward-meetings","24 weekly stewardship conversations and site visits",24,75,"Real local transportation, accessible meeting costs and documented follow-up; NOT gifts or payments for official access."),
 line("paid-co-facilitators","15 paid resident-led facilitation / safeguarding review sessions",15,300,"Compensate residents and qualified reviewers; no unpaid extraction of personal history."),
 line("access-pool","12 accessibility and participation-support allocations",12,200,"Childcare, access formats, interpreters, participant transit or accommodations as needed."),
 line("founder-fieldwork","8 founder fieldwork support installments",8,500,"Limited support for organizing labor; if living needs are greater, adapt the unrestricted budget openly."),
 line("safety-permits","One flexible event permissions, insurance and contingency pool",1,1500,"If host/permit/insurance costs exceed this, scale down or cancel festivals rather than waive safety.")
]);
export const TOTAL=COMMONS_BUDGET.reduce((s,x)=>s+x.usd,0);
export const DRAFT_750="Still Here — The First Circle Foundry will invest six months in face-to-face relationships to seed a new, voluntary local culture and economy of care, creativity and reciprocal exchange. In southern Minnesota, we will host or join weekly community tables, potluck chains, music gatherings and small festivals, plus conversations with stewards of churches, campuses, farms, food programs, arts spaces and local services. Residents will decide what is useful; paid facilitators and independent reviewers will test inclusion, consent, refusal and local control. We will document whether encounters become completed acts of mutual aid and independent circles that can keep, change or reject the founding method without inheriting the founder's control.";

export const WEEKLY_CADENCE=Object.freeze([
 Object.freeze({day:"Week's open table",proposed:"Host or join one accessible table, meal, or community gathering; never a substitute for specialist support.",gate:"Independent host consent, participant comfort and a genuinely accessible nonreligious alternative."}),
 Object.freeze({day:"Week's steward conversation",proposed:"Seek one listening meeting with a real keeper of space, distribution, programming, facilities, equipment, or relationships.",gate:"No presumption of authority or partner enrollment; no payments or favors for access to public officials."}),
 Object.freeze({day:"Week's possible useful act",proposed:"If invited, co-design one small, reversible, lawful resource/service exchange (or conclude existing practice is better).",gate:"Every material owner and recipient independently authorizes and later verifies the actual return."}),
 Object.freeze({day:"Week's return",proposed:"Ask the receiving person whether the act was useful, record a private nonidentifying learning summary, and invite a successor table only if wanted.",gate:"No public beneficiary story, service claim, reputation metric or automatically inherited circle."})
]);
export const PHASES=Object.freeze([
 Object.freeze({months:"April",stage:"LISTEN / SAFETY",action:"Review safeguarding, access, host rules and prior local initiatives; seek permission for the first public-safe table; map local stewardship roles.",result:"Approved or refused first host and living questions, not partner tallies."}),
 Object.freeze({months:"May–June",stage:"START / RELAY",action:"Run conditional weekly gatherings, start participant-led potluck relay, consult space/resource stewards and test one small, optional useful return.",result:"Evidence of actual hosts' decisions, inclusion, missed meetings and independently checked outcomes."}),
 Object.freeze({months:"July–August",stage:"CELEBRATE / COOPERATE",action:"If earlier events were safe and useful, co-produce music/art gatherings and up to two mini-festivals with separate permissions; invite group-authored new rules.",result:"Whether a receiver-owned circle or cooperative exchange exists without the founder running it."}),
 Object.freeze({months:"September",stage:"HAND BACK / INHERIT",action:"Publish approved, paper-first reusable ritual, event and stewardship templates; invite unrelated reviewers to challenge them and document all refusal paths.",result:"Independent critique, rejected assumptions, costs and optional successor interest—not a claimed new economy."})
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
 "NO_LEGAL_PARTNERSHIP_FROM_AN_INVITATION_OR_HANDSHAKE"
]);
export function planningPacket(){
 return {schema:COMMONS_STORY.schema,status:COMMONS_STORY.stage,title:COMMONS_STORY.title,
  budgetUSD:TOTAL,lines:COMMONS_BUDGET.map(x=>({...x})),
  phases:PHASES.map(x=>({...x})),weekly:WEEKLY_CADENCE.map(x=>({...x})),stopRules:[...STOP_RULES],
  claimedHosts:0,scheduledMeetings:0,completedFestivals:0,externalConsent:false,
  formalOrganizationsCreated:0,verifiedEconomicReturns:0,realCommunityRelationshipsMeasured:false,
  applicantApproved:false,applicationSubmitted:false};
}
