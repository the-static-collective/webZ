// BRIDGE-NETWORK-003 · Public prospective institutional atlas.
// These are opportunities to ASK, not claims of existing relationships, awards, submissions, or access.
import {doors as originalDoors, proposal, invitationFor as originalInvitation, draftFor as originalDraft} from "../model.mjs";

export const capturedAt="2026-10-28";
export const organs=Object.freeze([
 {id:"jarvis",name:"JAR;VIS",role:"Operator-reviewed research and proposal preparation",url:"https://github.com/the-static-collective/JAR-VIS"},
 {id:"planz",name:"planZ",role:"Explicit blockers, sequencing and next human decision",url:"https://github.com/the-static-collective/planZ"},
 {id:"relatte",name:"reLATTE",role:"Source/receiver-owned, signed and permission-scoped crossings",url:"https://github.com/the-static-collective/reLATTE"},
 {id:"garden",name:"The Garden",role:"Locally stewarded food access / shared ownership field questions",url:"https://garden.abundent.org/"},
 {id:"porchlight",name:"Porchlight Commons",role:"Housing and mutual-assistance proposals, not shelter service",url:"https://github.com/the-static-collective/webZ/blob/main/docs/PORCHLIGHT-COMMONS-001.md"},
 {id:"jubilee",name:"Jubilee Circuit",role:"Music, gatherings, print kits and voluntary introductions",url:"https://github.com/the-static-collective/webZ/blob/main/docs/JUBILEE-CIRCUIT-001.md"},
 {id:"graft",name:"GRAFT",role:"Inspectable source-pinned working demonstration packets",url:"https://github.com/the-static-collective/GRAFT"},
 {id:"ghot",name:"GHoT",role:"Candidate owner-approved, energy-bounded compute demonstrations",url:"https://github.com/the-static-collective/GHoT"},
 {id:"inbox",name:"Living Inbox / Link Wallet",role:"Local-only draft custody; separate authenticated receiver for real communications",url:"https://github.com/the-static-collective/webZ/blob/main/docs/LINK-WALLET-001.md"}
]);

const earlier={
 "mit-solve":["innovation","PROTOTYPE",["jarvis","graft","porchlight"],"Demonstrate a working synthetic prototype, disclose remaining field gates."],
 "rochester-task-force":["food","MUNICIPAL",["garden","planz","inbox"],"Ask for one city-defined public-safe problem, not city endorsement."],
 "rochester-grant":["funding","LOCAL_HOST",["garden","jubilee","planz"],"Find a willing eligible Rochester host before budgeting."],
 "cities-deliver":["municipal","GOVERNMENT_PARTNER",["jarvis","relatte","graft"],"Only an eligible organization plus signed qualifying city letter can apply."],
 "code-for-america":["civic","DEMO",["jarvis","graft","inbox"],"Prepare a 60-second demo with known limitations."],
 "bloom":["civic","LOCAL_HOST",["jubilee","inbox","planz"],"Find a community-rooted organizer to host real deliberation."],
 "igh":["global","PRACTITIONER",["porchlight","relatte","graft"],"Request review of anonymized method; no vulnerable-person records."],
 "dpga":["standards","OPEN_STANDARD",["relatte","graft","inbox"],"Audit separable component against licensing, privacy and DPG Standard."],
 "umn-extension":["food","LEARNING",["garden","planz"],"Listen to one rural grocery operator before proposing software."]
};

// VERIFIED_ORIGINAL details remain owned by bridge/model.mjs.
export const addedDoors=Object.freeze([
 {id:"voqal",name:"Voqal Partners Fellowship",kind:"Individual fellowship",due:"October 31, 2026, 11:59 p.m. ET",deadline:"2026-10-31",url:"https://voqalpartners.org/fellowship/",category:"funding",entry:"INDIVIDUAL",organs:["jarvis","planz","relatte","graft"],alignment:"Six-month prototype of infrastructure between independent community organizations.",request:"Consider an individual founder-led six-month exploratory fellowship.",offered:"A bounded, evidence-conscious build-and-field-test plan with synthetic public demo.",gate:"Applicant must meet individual and community connection criteria; no fellowship application or award is established.",next:"Prepare the individual project story, six-month test plan and required budget."},
 {id:"arts-midwest",name:"Arts Midwest GIG Fund",kind:"Interstate touring grant",due:"November 4, 2026, noon CT (Phase 1)",deadline:"2026-11-04",url:"https://artsmidwest.org/get-support/gig-fund/",category:"culture",entry:"NONPROFIT_OR_TRIBAL",organs:["jubilee","garden","planz"],alignment:"Bring an out-of-state artist and an accessible community gathering to an underserved audience.",request:"An eligible nonprofit or Tribal organizer evaluates an out-of-state artist project.",offered:"Event kit, an accessible gathering format and honest participant-return methods.",gate:"Eligible organization, UEI and artist who lives outside its state; at least two activities, one public; phase 2 due November 17.",next:"Identify an eligible host, out-of-state professional artist and two accessible activities."},
 {id:"unitac",name:"UN-Habitat UNITAC Open Call",kind:"Government-led urban technology collaboration",due:"November 5, 2026",deadline:"2026-11-05",url:"https://unitac.un.org/en/open-call-2026",category:"global",entry:"GOVERNMENT_PARTNER",organs:["porchlight","planz","graft","ghot"],alignment:"Adapt one existing UNITAC digital tool to a government-defined urban challenge.",request:"Discuss an eligible government-led use of a named UNITAC tool.",offered:"Local-first workflow ideas, reviewable prototypes and a bounded evaluation design.",gate:"Government lead or formal municipal partner and evidence of authority required. UNITAC provides technical support, not direct grant money.",next:"Only proceed if a government partner chooses a named UNITAC tool and can support implementation."},
 {id:"nexus",name:"Nexus Community Wealth Building Cohort",kind:"Greater Minnesota learning cohort",due:"November 6, 2026, 5 p.m. CT",deadline:"2026-11-06",url:"https://nexuscp.org/apply-now-greater-mn-community-wealth-building-cohort/",category:"food",entry:"LOCAL_GROUP",organs:["garden","planz","jubilee","inbox"],alignment:"Support a genuine Greater Minnesota group exploring shared ownership and food access.",request:"Consider an actual locally constituted learning team for the cohort.",offered:"A reusable cooperative learning and community invitation demonstrator.",gate:"Must identify a real group able to participate in six sessions; applicant team consent is not established.",next:"Ask willing grocery/coalition participants whether they want to form the learning team."},
 {id:"foss-backstage",name:"FOSS Backstage 2027",kind:"Open-source governance conference CFP",due:"November 8, 2026, 23:59 CET",deadline:"2026-11-08",url:"https://program.foss-backstage.de/fossback27/cfp",category:"standards",entry:"SPEAKER",organs:["relatte","graft","planz"],alignment:"Explain independently owned receiver decisions and the limits of cross-project authority.",request:"Review a practical source-backed talk on open-source governance.",offered:"Real implementation pointers plus explicit refusals and no-adoption scenarios.",gate:"Speaker selection required; any travel or production commitments are separate.",next:"Prepare a talk outline on consent-preserving infrastructure and a reproducible demo."},
 {id:"ncoa",name:"National Council on Aging Digital Literacy",kind:"Older-adult digital literacy grant",due:"November 10, 2026, 11:59 p.m. ET",deadline:"2026-11-10",url:"https://www.ncoa.org/page/grant-opportunity-helping-older-adults-build-technology-skills-and-confidence/",category:"access",entry:"SERVICE_ORGANIZATION",organs:["inbox","jubilee","graft"],alignment:"Accessible, hands-on technology literacy for adults age 60+.",request:"Explore a modest workshop collaboration with a qualified service organization.",offered:"Account-free practice materials; honest privacy and online-safety teaching.",gate:"Only senior centers, eligible nonprofits and local governmental agencies serving older adults may apply; no partner named.",next:"Find a willing eligible older-adult service organization and review prescribed curriculum and participant minimums."},
 {id:"anderson",name:"Anderson Center Salzburg Exchange",kind:"Minnesota visual artist residency",due:"November 13, 2026, noon CT",deadline:"2026-11-13",url:"https://www.andersoncenter.org/residency-program/",category:"culture",entry:"INDIVIDUAL_ARTIST",organs:["jubilee","graft"],alignment:"Artistic exchange and portable explanations of community infrastructure.",request:"Evaluate a Minnesota visual artist's residency application.",offered:"An art-led exploration of portable community correspondence and public artifacts.",gate:"Visual artist residing in Minnesota; Salzburg travel is NOT funded. This is a creative option, not community infrastructure funding.",next:"Check artist fit, portfolio and travel feasibility before application."},
 {id:"state-net",name:"State of the Net Lightning Talks",kind:"Technology policy conference",due:"November 19 People's Choice; December 1 final, 2026",deadline:"2026-11-19",url:"https://www.stateofthenet.org/%E2%9A%A1lightning-talk-proposals-are-open-new-peoples-choice-awards-%F0%9F%94%A5/",category:"civic",entry:"SPEAKER",organs:["relatte","planz","jarvis"],alignment:"The public-policy case for independent institutions exchanging verified outcomes without a master identity system.",request:"Review a five-minute technical policy argument.",offered:"One precise architecture, a refusal example and reproducible public-safe evidence.",gate:"November 19 is optional People's Choice; final regular deadline December 1. Submission is not acceptance.",next:"Make one five-minute storyboard about receiver ownership and auditability."},
 {id:"levitt",name:"Levitt Family Foundation Festival Grants",kind:"Free outdoor festival grant",due:"November 20, 2026",deadline:"2026-11-20",url:"https://levitt.org/festivals/",category:"culture",entry:"NONPROFIT",organs:["jubilee","garden","inbox"],alignment:"A free, outdoor, live-music-centered food-and-community gathering.",request:"A qualified nonprofit considers presenting a real accessible public festival.",offered:"Cultural invitation kit, food access table proposal and accountability packet.",gate:"Applicant must be U.S. 501(c)(3), festival outdoors/free, paid professional musicians, at least four hours; no host or venue approved.",next:"Find an eligible nonprofit organizer and identify site, artists, schedule and funding match."},
 {id:"osm",name:"OpenStreetMap US Mapping USA",kind:"Open mapping conference CFP",due:"November 22, 2026, 11:59 p.m. ET",deadline:"2026-11-22",url:"https://openstreetmap.us/news/2026/10/Mapping-USA-2027/",category:"civic",entry:"SPEAKER",organs:["garden","porchlight","graft"],alignment:"How to map community service infrastructure without exposing vulnerable locations.",request:"Review a demonstration of map provenance and consent boundaries.",offered:"A transparent public-safe mapping prototype and documented exclusions.",gate:"Conference talk selection required; avoid publishing private shelter locations or unapproved data.",next:"Draft a public-safe cartography demo using synthetic resource points."},
 {id:"ocx",name:"Open Community Experience 2027",kind:"Open technology conference CFP",due:"December 6, 2026 (early Nov. 9)",deadline:"2026-12-06",url:"https://ocxconf.org/call-for-proposals/",category:"standards",entry:"SPEAKER",organs:["relatte","ghot","graft"],alignment:"Present bounded cross-project execution and infrastructure autonomy.",request:"Consider an implementation-led talk on digital autonomy and local permissions.",offered:"Actual source-limited tests and explicit non-integration cases.",gate:"Speaker acceptance is not assured; early submission Nov 9, final deadline Dec 6.",next:"Write one reproducible example of an authorized vs refused cross-system task."},
 {id:"mn-housing",name:"Minnesota Housing Capacity Building",kind:"Housing-systems capacity-building RFP",due:"December 10, 2026, noon CT",deadline:"2026-12-10",url:"https://www.mnhousing.gov/home/requests-proposals/capacity-building",category:"funding",entry:"ESTABLISHED_NONPROFIT_OR_TRIBAL",organs:["porchlight","planz","relatte","graft"],alignment:"Improve organizational capacity and coordination in Minnesota housing systems.",request:"Invite an eligible established nonprofit or Tribal lead to evaluate a capacity-building project.",offered:"Permitted training/research/accountability instruments for independent stewards.",gate:"Eligible 501(c)(3) or Tribal lead in operation for at least one calendar year; shelter planning/services excluded.",next:"Find a qualified lead and validate a systems-building scope (not direct shelter services)."},
 {id:"open-referral",name:"Open Referral",kind:"Human-service data standards community",due:"Open engagement; no confirmed deadline",deadline:null,url:"https://openreferral.org/faq/",category:"standards",entry:"OPEN_COMMUNITY",organs:["relatte","planz","graft"],alignment:"Test whether signed locally governed transport complements existing human-service directory data standards.",request:"Seek a standards review of a narrowly scoped interoperable handoff.",offered:"A proposed receiver-owned crossing and a refusal/non-disclosure test.",gate:"Participation in an open forum is not endorsement or adoption of our transport.",next:"Map one existing HSDS field to an explicitly authorized crossing, then ask for critique."},
 {id:"civic-alliance",name:"Alliance of Civic Technologists",kind:"Civic-tech collaboration network",due:"Open community; no confirmed deadline",deadline:null,url:"https://www.civictechnologists.org/join",category:"civic",entry:"OPEN_COMMUNITY",organs:["jarvis","graft","planz"],alignment:"Meet civic technologists who can challenge, improve and adapt independent public-service prototypes.",request:"Ask for technical feedback and local collaboration; don't assume organization membership.",offered:"A small working demonstration and one concrete question.",gate:"A public discussion/chat account does not convey institutional membership or permission.",next:"Join as an individual and ask for critique of one bounded demonstrator."}
]);

const dates={"mit-solve":"2026-11-06","rochester-grant":"2026-11-30","cities-deliver":"2026-11-29","code-for-america":"2026-11-12","bloom":"2026-11-20","umn-extension":"2026-11-11"};
export const allDoors=Object.freeze([...originalDoors.map(d=>({
 ...d,category:earlier[d.id][0],entry:earlier[d.id][1],organs:earlier[d.id][2],next:earlier[d.id][3],
 deadline:dates[d.id]||null,sourceEra:"BRIDGE_001_ORIGINAL"
})),...addedDoors.map(d=>({...d,sourceEra:"BRIDGE_NETWORK_003"}))]);
export const relations=Object.freeze(allDoors.flatMap(d=>d.organs.map(id=>({
 from:d.id,to:id,kind:"POTENTIAL_CAPABILITY_FIT",status:"PROPOSAL_NOT_RELATIONSHIP"
}))));
export function door(id){const found=allDoors.find(d=>d.id===id);if(!found)throw new RangeError("Unknown institutional door");return found}
export function neighbors(id){const d=door(id);return allDoors.filter(x=>x.id!==id).map(x=>{
 const overlap=x.organs.filter(o=>d.organs.includes(o));
 return {...x,overlap,routeReason:overlap.map(o=>organs.find(p=>p.id===o).name).join(" + ")};
 }).filter(x=>x.overlap.length).sort((a,b)=>b.overlap.length-a.overlap.length||a.name.localeCompare(b.name)).slice(0,5)}
export function invitationFor(id){if(originalDoors.some(d=>d.id===id))return originalInvitation(id);
 const d=door(id);return {schema:"abundent/bridge-invitation-v0",proposalId:proposal.id,version:"BRIDGE-NETWORK-003",target:d.name,
 classification:"DRAFT_NOT_SENT",relationship:"PROSPECTIVE_ONLY",purpose:d.alignment,specificRequest:d.request,
 whatWeCanBring:d.offered,requiredHumanGate:d.gate,demonstration:proposal.pilot,
 sourceProposal:"https://github.com/the-static-collective/webZ/blob/main/docs/BRIDGE-NETWORK-003.md",
 noPersonalData:true,authority:"Receiving institution alone chooses to review, decline, or authorize anything."}}
export function draftFor(id){if(originalDoors.some(d=>d.id===id))return originalDraft(id);
 const d=door(id);return `Subject: Between Rooms — a bounded proposal for ${d.name}

Hello,

I'm developing Between Rooms, a public, community-governed prototype for coordinating independently owned work.

Why this may be relevant to your work: ${d.alignment}

We can bring: ${d.offered}

My specific request: ${d.request}

No partnership, submission or funding is implied by this draft. We would seek separate local permission for any real activity and respect your right to decline.

Who would be an appropriate person to ask for review?

The Static Collective / Abundent`}
export function dossierFor(id){const d=door(id);return {
 schema:"abundent/bridge-institutional-dossier-v1",classification:"UNSENT_REVIEW_DRAFT",observed:capture(),institution:d,
 proposedOrgans:d.organs.map(id=>organs.find(o=>o.id===id)),proposedRelations:relations.filter(r=>r.from===id),
 adjacentProspects:neighbors(id).map(n=>({id:n.id,name:n.name,overlap:n.overlap,classification:"HYPOTHESIS_NOT_INTRODUCTION"})),
 invitation:invitationFor(id),draftMessage:draftFor(id),
 tasks:[{step:"VERIFY",state:"NOT_PERFORMED",next:"Check official current conditions, deadlines and eligibility"},
 {step:"AUTHORIZE",state:"NOT_PERFORMED",next:d.gate},
 {step:"PREPARE",state:"NOT_PERFORMED",next:d.next},
 {step:"SEND",state:"NOT_PERFORMED",next:"Human review, recipient choice, and separate outbound approval"},
 {step:"DISPOSITION",state:"UNKNOWN",next:"Record any actual receiver decision only on receiver-owned evidence"}],
 application:"NOT_SUBMITTED",partner:"NOT_ESTABLISHED",award:"NOT_GRANTED",fieldResult:"NOT_VERIFIED"}}
function capture(){return {snapshot:capturedAt,liveFeed:false,reviewOfficialBeforeActing:true}}
export function exportAtlas(){return {schema:"abundent/bridge-institutional-atlas-v1",status:"CANDIDATE_NETWORK_NOT_PARTNERS",...capture(),origins:{original:originalDoors.length,added:addedDoors.length},
 organs,doors:allDoors,relations,linksRepresent:"PROPOSED_CAPABILITY_FIT_ONLY",
 submissionCountClaimed:0,partnerCountClaimed:0,verifiedOutcomeCountClaimed:0}}
