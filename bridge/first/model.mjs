import {COMMONS_BUDGET,DRAFT_750,TOTAL} from "./commons-circuit.mjs";
// BRIDGE-006 · source-first, UNSENT first-crossing field kit.
// Published contacts and opportunity terms are source observations, not permission.
export const REVIEWED_AT="2026-10-29";
export const PROJECT="Still Here — The First Circle Foundry: The Commons Circuit (candidate, not submitted)";
export const PROSPECTS=Object.freeze([
 {id:"voqal",name:"Voqal Partners Fellowship 2027",kind:"INDIVIDUAL_APPLICATION",
  source:"https://voqalpartners.org/fellowship/",
  guide:"https://voqalpartners.org/wp-content/uploads/2026/08/FellowshipApplicationGuide_2026.pdf",
  due:"2026-10-31T22:59:00-05:00",dueDisplay:"Saturday October 31, 2026 · 10:59 p.m. Central / 11:59 p.m. Eastern",
  offer:"$30,000 six-month individual fellowship; April–September 2027; three required convenings",
  gate:"Applicant personally confirms U.S. eligibility, availability, truthful first-person history, portal registration and final submission.",
  state:"APPLICATION_NOT_SUBMITTED",contactStatus:"NO_INSTITUTIONAL_RELATIONSHIP",proposalStatus:"APPLICANT_UNAPPROVED_CANDIDATE"},
 {id:"wansc",name:"Waseca Area Neighborhood Service Center (WANSC)",kind:"LOCAL_STEWARD_INQUIRY",
  source:"https://www.wasecaareaneighborhoodservicecenter.com/food-shelf-programs",
  context:"https://www.givemn.org/organization/Waseca-Neighborhood-Service-Center",
  email:"director@wasecaservicecenter.org",due:null,dueDisplay:"No imposed institutional deadline",
  gate:"Ask an actual authorized steward what problem exists; obtain consent before any field activity, and respect a no.",
  state:"INQUIRY_NOT_SENT",contactStatus:"NOT_A_PARTNER"}
]);
export const ALLOCATION=Object.freeze(COMMONS_BUDGET.map(({title,usd})=>[title,usd]));
export function budgetTotal(){return TOTAL}
export const SOURCES=Object.freeze([
 {title:"Voqal program and deadline",href:PROSPECTS[0].source},
 {title:"Voqal 2027 — candidate First Circle Foundry, source-linked strategy",href:"https://github.com/the-static-collective/webZ/blob/proposal/voqal-first-circle-foundry-007/docs/VOQAL-FIRST-CIRCLE-FOUNDRY-007.md"},
 {title:"Voqal 010 — conditional Harmony Park family festival and current 30k review budget",href:"https://github.com/the-static-collective/webZ/blob/proposal/harmony-park-grand-finale-010/docs/VOQAL-HARMONY-PARK-FINALE-010.md"},
 {title:"Harmony Park official venue, stages, family amenities and booking inquiry",href:"https://harmonypark.com/contact/"},
 {title:"Harmony Family Campout 2027 existing independently organized all-ages event",href:"https://www.eventbrite.com/e/harmony-family-campout-2027-tickets-1998551837345"},
 {title:"Official fellowship application guide and character caps",href:PROSPECTS[0].guide},
 {title:"WANSC choice food shelf, hours and official contact",href:PROSPECTS[1].source},
 {title:"WANSC reported food-purchasing pressure (historical, not inventory)",href:PROSPECTS[1].context},
 {title:"Existing Waseca sourcing question and field boundaries",href:"https://github.com/the-static-collective/webZ/blob/main/docs/SHELF-LOCUS-001.md"}
]);
export const DRAFTS=Object.freeze([
 {id:"elevator",label:"Voqal · Applicant-unapproved Commons Circuit description (max 750 characters)",limit:750,
  value:DRAFT_750},
 {id:"wansc",label:"WANSC · One-question introduction · UNSENT",limit:null,
  value:"Subject: Waseca food shelf — one specific coordination question\n\nHello,\n\nI'm working on a small community-owned idea in Waseca and want to avoid building something that duplicates work or creates more work for the food shelf.\n\nI read your public materials about food assistance and sourcing pressure. Before proposing any technology or volunteer arrangement, may I ask whether there is one recurring step in accepting suitable food donations, finding suppliers, or coordinating a pickup that your team would genuinely like help with—or whether existing processes and financial donations already serve you better?\n\nIf there is a useful question, I could prepare a one-page, paper-friendly sketch for your review. Nothing would be implemented, published as your project, or offered on your behalf without the proper staff permission. It is also completely fine if this is not useful.\n\nThank you for the work your center already does.\n\n[Sender: add your name and reply contact privately before sending.]"}
]);
export const FOUNDER_GATES=Object.freeze([
 "Confirm individual U.S. eligibility and willingness to prioritize the project in April–September 2027.",
 "Verify availability for Voqal's three required in-person convenings.",
 "Approve or reject this revised systemic framing, and personally verify all lived experience, community ties, coaching history, and AI-use disclosure.",
 "Review the new full $30,000 Commons Circuit allocation: weekly tables, potluck chains, arts, optional festivals, steward meetings, paid co-facilitation, accessibility, founder fieldwork and event safety. Adjust unrestricted funds for actual living needs and permits.",
 "The September 2027 Harmony Park full festival is an aspirational finale, not booked, priced, fully financed or promised: applicant must confirm venue/operator availability, producer, insurance, safety and any separate funding; invite Voqal independently only if real.",
 "Create or sign into your own Foundant application account via Voqal's official APPLY TODAY link.",
 "Submit through Voqal's actual portal before deadline and preserve a real confirmation in private custody.",
 "Ask WANSC the one question via its published contact route only after separate human review and approval.",
 "No recipient records, beneficiary details, invented steward consent, or automatic pickups."
]);
export function publicStatus(){
 return {schema:"abundent.bridge006-first-crossing/v1",reviewedAt:REVIEWED_AT,
  sourceReviewed:true,applicationSubmitted:false,outboundInquirySent:false,
  localStewardOptedIn:false,fieldPilotAuthorized:false,independentFieldResult:false,
  relationshipStatus:"PROSPECTIVE_ONLY",autoSend:false,liveSubmissionTracking:false};
}
