// BRIDGE-006 · source-first, UNSENT first-crossing field kit.
// Published contacts and opportunity terms are source observations, not permission.
export const REVIEWED_AT="2026-10-29";
export const PROJECT="Still Here — The First Circle Foundry (candidate, not submitted)";
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
export const ALLOCATION=Object.freeze([
 ["Six months of focused founder time",12000],
 ["Compensated local review and participation support",6000],
 ["Approved travel, meetings, bounded field logistics",3500],
 ["Access, interpretation, alternative formats",2500],
 ["Print outreach and low-tech materials",2000],
 ["Essential equipment and hosting",2000],
 ["Legal, insurance and safety consultation",2000]
]);
export function budgetTotal(){return ALLOCATION.reduce((n,[,v])=>n+v,0)}
export const SOURCES=Object.freeze([
 {title:"Voqal program and deadline",href:PROSPECTS[0].source},
 {title:"Voqal 2027 — candidate First Circle Foundry, source-linked strategy",href:"https://github.com/the-static-collective/webZ/blob/proposal/voqal-first-circle-foundry-007/docs/VOQAL-FIRST-CIRCLE-FOUNDRY-007.md"},
 {title:"Official fellowship application guide and character caps",href:PROSPECTS[0].guide},
 {title:"WANSC choice food shelf, hours and official contact",href:PROSPECTS[1].source},
 {title:"WANSC reported food-purchasing pressure (historical, not inventory)",href:PROSPECTS[1].context},
 {title:"Existing Waseca sourcing question and field boundaries",href:"https://github.com/the-static-collective/webZ/blob/main/docs/SHELF-LOCUS-001.md"}
]);
export const DRAFTS=Object.freeze([
 {id:"elevator",label:"Voqal · Project overview (max 750 characters)",limit:750,
  value:"Still Here — The First Circle Foundry asks how people cut off from trusted networks can form new, independently governed circles of practical support. Beginning with isolated adults, especially fathers affected by relationship abuse and family separation, we will co-design a need-first, testimony-optional first contact with paid survivor advisors and qualified safeguarding reviewers. Through paper, phone and optional offline tools, we will test voluntary introductions to existing resources, real refusal and withdrawal, and independently reviewed outcomes. The long-term goal is a reproducible founding method communities can own, change, and carry forward without our permission or dependence on a platform."},
 {id:"wansc",label:"WANSC · One-question introduction · UNSENT",limit:null,
  value:"Subject: Waseca food shelf — one specific coordination question\n\nHello,\n\nI'm working on a small community-owned idea in Waseca and want to avoid building something that duplicates work or creates more work for the food shelf.\n\nI read your public materials about food assistance and sourcing pressure. Before proposing any technology or volunteer arrangement, may I ask whether there is one recurring step in accepting suitable food donations, finding suppliers, or coordinating a pickup that your team would genuinely like help with—or whether existing processes and financial donations already serve you better?\n\nIf there is a useful question, I could prepare a one-page, paper-friendly sketch for your review. Nothing would be implemented, published as your project, or offered on your behalf without the proper staff permission. It is also completely fine if this is not useful.\n\nThank you for the work your center already does.\n\n[Sender: add your name and reply contact privately before sending.]"}
]);
export const FOUNDER_GATES=Object.freeze([
 "Confirm individual U.S. eligibility and willingness to prioritize the project in April–September 2027.",
 "Verify availability for Voqal's three required in-person convenings.",
 "Approve or reject this revised systemic framing, and personally verify all lived experience, community ties, coaching history, and AI-use disclosure.",
 "Review the earlier $30,000 illustrative allocation against the qualified safeguarding, accessibility and compensation needs of this candidate.",
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
