// FESTIVAL-FORK-011 — real original WebZ source hash; offline, public-only,
// independent proposed stations. Not event staffing, tickets, permissions or booking.
import {hash} from "../suitcase/protocol.mjs";
import {PATTERN} from "./relational-inheritance.mjs";
import {FINALE,TOTAL} from "./commons-circuit.mjs";

export const FESTIVAL_STAGES=Object.freeze([
 {id:"road",name:"TABLE & ROAD",window:"May–September 2027",scope:"Optional consented weird/traveling worship nights: live music, food, public-service invitations and take-home next-table cards.",kind:"MOBILE_SMALL",gate:"Separate host/artist rights; faith activities are expressly optional; alternative nonreligious welcome and no coercive invitation.",status:"UNSCHEDULED"},
 {id:"courthouse",name:"FINAL FRUITS / PUBLIC HEARING",window:"July–August 2027 candidate rehearsal",scope:"Revisit the earlier proposed Courthouse Park Waseca event as ONE small mini-festival field rehearsal; prior October 17–18 2026 concept has passed and was not confirmed as held.",kind:"REHEARSAL_MINI",gate:"Waseca County caretaker/pavilion and permitted program/overnight, safety, food, amplification and capacity requirements; no claim 2026 happened.",status:"UNSCHEDULED"},
 {id:"harmony",name:"THE COMMONS HOMECOMING",window:"late summer / September 2027 preferred",scope:"Conditional full family Commons festival at Harmony Park: varied independent culture and resource stations, actual return of useful acts and a public festival-fork workshop.",kind:"FAMILY_FINALE",gate:"Signed venue agreement, qualified production and permits, actual additional financing, child safety/access, insurance and no date collision with Voqal convening.",status:"VENUE_UNBOOKED"},
 {id:"october",name:"THE NEXT FESTIVAL: INDEPENDENT BRANCH",window:"October 2027 suggested; seasonally conditional",scope:"At Harmony Park, a separately consenting site, or two separately organized sites; can be a small autumn relay when full production/seasonal capacity is not available.",kind:"SUCCESSOR_PROPOSAL",gate:"New independent stewardship, October site/date/weather, venue/permit, sound, financing and operator decisions; September invite is never permission for October.",status:"UNAUTHORIZED"}
]);
export const STATIONS=Object.freeze([
 {id:"road-stage",label:"Road music & optional worship",interests:["music","worship","performance"],contribution:"Offer a short consenting set, teach a song, or host a portable Road Night; publish only rights-cleared songs.",required:"Host, repertoire and performer approval; explicitly voluntary religious participation."},
 {id:"table",label:"Potluck & hospitality",interests:["food","hosting","care"],contribution:"Offer a safe accessible shared table and help seed an independently chosen next potluck.",required:"Food handling, venue approval, no disclosed recipient records, accessible alternatives."},
 {id:"place",label:"Land & place care",interests:["nature","cleanup","gardening"],contribution:"Support site cleanup, nature care or a locally permitted food-growing idea.",required:"Actual land steward approves; safety and restoration reviewed."},
 {id:"make",label:"Art, books & making",interests:["art","printing","craft"],contribution:"Create public-safe posters, zines, murals or repair demonstrations with consent and rights.",required:"No participant case data; rights clearance and trained supervision for tools."},
 {id:"build",label:"Useful work & repair",interests:["repair","engineering","skills"],contribution:"Identify a small real, reversible problem and offer expertise to an independently agreeing owner.",required:"No hazardous fabrication, unsupervised child labor or inferred permissions."},
 {id:"welcome",label:"Family welcome & accessibility",interests:["family","accessibility","translation"],contribution:"Co-design all-ages schedules, quiet space, child-safety and accessible participation.",required:"Qualified safeguarding, guardian and venue roles; participant privacy."},
 {id:"stewards",label:"Institutional stewards & resources",interests:["organizations","food","spaces"],contribution:"Talk with people authorized over actual buildings, budgets, land and programs about specific permissions.",required:"No partner/status until authorized; never buy privileged access."},
 {id:"production",label:"Festival production & safety",interests:["lighting","sound","logistics"],contribution:"Help prepare a real budget, stage/crew needs, weather, power, transport and emergency plans.",required:"Qualified production and licensed professionals as applicable; no self-authorization."},
 {id:"witness",label:"Return & reality desk",interests:["documentation","research","feedback"],contribution:"Compare proposed work against independently confirmed acts, refusals and permitted anonymous learning.",required:"Do not turn testimonials, photographs, names or signed claims into public human proof without actual consent."},
 {id:"fork",label:"NEXT FESTIVAL FOUND(R)Y",interests:["organizing","music","community"],contribution:"Choose an October 2027 or later venue option and draft a new group-owned celebration; rewrite the inherited plan.",required:"Separate organizer/key, local rules, venue/date permission, finances and group consent; no inherited festival permit."}
]);
export const TIME_OPTIONS=Object.freeze(["30_minutes","2_hours","day_shift","ongoing","not_yet_sure"]);
export const LOCATION_OPTIONS=Object.freeze(["harmony_park","another_venue","both_independent","undecided"]);
export const COMMON_GATES=Object.freeze([
 "PERSONAL_INTEREST_IS_NOT_ASSIGNMENT",
 "STATION_PREFERENCE_IS_NOT_VOLUNTEER_OR_VENUE_CONSENT",
 "NO_SHARED_PARTICIPANT_LIST_OR_PUBLIC_SENSITIVE_DISCLOSURE",
 "NO_AUTOMATIC_MEMBER_OR_WORSHIP_REQUIREMENT",
 "NO_FESTIVAL_WITHOUT_APPROVED_SITE_AND_PRODUCTION",
 "NO_FOOD_OR_CHILD_SUPPORT_WITHOUT_APPLICABLE_REQUIREMENTS",
 "NO_TRANSFER_OF_PREDECESSOR_PERMITS_OR_RESOURCE_CUSTODY",
 "NO_VOQAL_ATTENDANCE_OR_FINANCING_ASSUMPTION",
 "NO_OCTOBER_FESTIVAL_FUNDED_BY_2027_SEPTEMBER_FELLOWSHIP_BY_DEFAULT"
]);
const options=Object.freeze(Object.fromEntries(STATIONS.map(x=>[x.id,x])));
function choice(what,allowed){if(typeof what!=="string"||!allowed.includes(what))throw new RangeError("Unknown "+what);return what}
function normalizePlain(s,max=100){
 if(typeof s!=="string"||s.length>max||/[\x00-\x1f\x7f]/.test(s))throw new RangeError("Invalid public label");
 return s.trim();
}
// Local choice is deliberately NOT a booking, signup, commitment or stored private record.
export function stationCard({stationId,time="not_yet_sure"}={}){
 choice(stationId,STATIONS.map(s=>s.id));choice(time,TIME_OPTIONS);
 const s=options[stationId];
 return {schema:"abundent/festival-station-card-v1",stage:"LOCAL_PREFERENCE_ONLY",stationId:s.id,label:s.label,
  availableTime:time,proposedWork:s.contribution,requiredHumanGates:s.required,
  personIdentity:"NOT_COLLECTED",signup:false,confirmedShift:false,venuePermission:false,
  participantContact:false,consentToPublish:false,realWorkCompleted:false};
}
const branchOption={
 harmony_park:"Ask Harmony Park for a distinct October booking, independently priced and signed; a September festival reservation would not extend to October.",
 another_venue:"An independent local group selects a completely new permitted location and writes its own production conditions.",
 both_independent:"Two distinct proposals, organizers, landowner decisions, safety plans and budgets; no common inherited permit or shared authority.",
 undecided:"Keep the invitation as an open question; do not announce a date or venue."
};
const shared={source:"FESTIVAL-FORK-011",sourceEvent:"The Commons Homecoming (September 2027 aspirational, unbooked)",fundedByVoqal:false,actualOctoberFestival:false,authorizedByHarmonyPark:false,authorizedByOtherVenue:false,voqalInvitationOrPresence:false,independentlyFunded:false,operatorIdentified:false,realHumanAgreement:false,announced:false};
function newBranch(which,sourceMethodDigest){
 return {...shared,venueOption:which,proposal:branchOption[which],methodDigest:sourceMethodDigest,
  locallyChangeableRules:true,separateOwnerRequired:true,independentBudgetRequired:true,
  siteDecision:"HOLD",productionDecision:"HOLD",safetyDecision:"HOLD",publicLaunch:"HOLD"};
}
export async function forkFestival({venue="undecided",stations=[],time="not_yet_sure"}={}){
 choice(venue,LOCATION_OPTIONS);choice(time,TIME_OPTIONS);
 if(!Array.isArray(stations)||stations.length>STATIONS.length||new Set(stations).size!==stations.length)
  throw new RangeError("Stations must be distinct known public stations");
 for(const s of stations)choice(s,STATIONS.map(x=>x.id));
 const methodDigest=await hash(PATTERN); // actual original WebZ Suitcase hash code
 const forks=venue==="both_independent"?[
   newBranch("harmony_park",methodDigest),newBranch("another_venue",methodDigest)
  ]:[newBranch(venue,methodDigest)];
 return {schema:"abundent/festival-fork-plan-v1",version:"2026-10-29",
  status:"PROPOSAL_HOLD_UNFUNDED_NOT_BOOKED",originalWebzMethodDigest:methodDigest,
  relationToSignedExperiment:"Follows RELATIONAL-INHERITANCE-008; source hash proves bytes only, not people, venues, authority or actual independent organizations.",
  path:FESTIVAL_STAGES.map(p=>({...p})),chosenPublicStations:stations.map(stationId=>stationCard({stationId,time})),
  branches:forks,sideEffects:{calendarWrite:false,emailSent:false,volunteerEnrolled:false,ticketsSold:false,
   venueBooked:false,permitIssued:false,financialTransaction:false,survivorIntake:false},
  currentFellowshipBudgetUSD:TOTAL,fullHarmonyFestivalBooked:FINALE.venueBooked,
  successorMustRaiseOwnResources:true,stopRules:[...COMMON_GATES]};
}
