import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {hash} from "../bridge/suitcase/protocol.mjs";
import {PATTERN} from "../bridge/first/relational-inheritance.mjs";
import {FESTIVAL_STAGES,STATIONS,TIME_OPTIONS,LOCATION_OPTIONS,COMMON_GATES,stationCard,forkFestival} from "../bridge/first/festival-forks.mjs";
import {FINALE,TOTAL} from "../bridge/first/commons-circuit.mjs";

test("Original WebZ method is actually source-hashed, never venue or human consent",async()=>{
 const result=await forkFestival({venue:"both_independent",stations:["road-stage","fork","welcome"],time:"2_hours"});
 assert.equal(result.status,"PROPOSAL_HOLD_UNFUNDED_NOT_BOOKED");
 assert.equal(result.originalWebzMethodDigest,await hash(PATTERN));
 assert.equal(result.branches.length,2);
 assert.deepEqual(result.branches.map(x=>x.venueOption),["harmony_park","another_venue"]);
 assert.equal(result.branches[0].methodDigest,result.branches[1].methodDigest);
 assert.equal(result.currentFellowshipBudgetUSD,TOTAL);
 assert.equal(TOTAL,30000);
 assert.equal(result.fullHarmonyFestivalBooked,false);
 assert.equal(FINALE.venueBooked,false);
 assert.equal(result.successorMustRaiseOwnResources,true);
 for(const b of result.branches){
   for(const field of ["fundedByVoqal","actualOctoberFestival","authorizedByHarmonyPark","authorizedByOtherVenue","voqalInvitationOrPresence","independentlyFunded","operatorIdentified","realHumanAgreement","announced"]) assert.equal(b[field],false,field);
   for(const field of ["siteDecision","productionDecision","safetyDecision","publicLaunch"])assert.equal(b[field],"HOLD",field);
   assert.equal(b.locallyChangeableRules,true);
   assert.equal(b.separateOwnerRequired,true);
   assert.equal(b.independentBudgetRequired,true);
 }
 for(const [field,v] of Object.entries(result.sideEffects))assert.equal(v,false,field);
 for(const card of result.chosenPublicStations){
   assert.equal(card.stage,"LOCAL_PREFERENCE_ONLY");
   assert.equal(card.availableTime,"2_hours");
   for(const field of ["signup","confirmedShift","venuePermission","participantContact","consentToPublish","realWorkCompleted"])assert.equal(card[field],false,field);
   assert.equal(card.personIdentity,"NOT_COLLECTED");
 }
});

test("All proposed culture stages are distinct, correctly sequenced and unbooked",()=>{
 assert.deepEqual(FESTIVAL_STAGES.map(x=>x.id),["road","courthouse","harmony","october"]);
 assert.equal(FESTIVAL_STAGES[1].status,"UNSCHEDULED");
 assert.match(FESTIVAL_STAGES[1].scope,/October 17–18 2026/);
 assert.match(FESTIVAL_STAGES[2].status,/UNBOOKED/);
 assert.equal(FESTIVAL_STAGES[3].status,"UNAUTHORIZED");
 assert.equal(STATIONS.length,10);
 assert.equal(new Set(STATIONS.map(x=>x.id)).size,10);
 assert.ok(STATIONS.some(x=>x.id==="fork"&&/independent/i.test(x.required)));
 assert.ok(STATIONS.some(x=>x.id==="road-stage"&&/voluntary religious/.test(x.required)));
 assert.ok(STATIONS.some(x=>x.id==="welcome"&&/guardian/.test(x.required)));
 assert.ok(COMMON_GATES.some(x=>/OCTOBER_FESTIVAL_FUNDED/.test(x)));
});

test("Invalid or duplicated station, forged location or time choices fail before making a proposal",async()=>{
 for(const input of [
   {venue:"we-own-park",stations:["fork"]},
   {venue:"both_independent",stations:["fork","fork"]},
   {venue:"undecided",stations:["private-survivor-intake"]},
   {venue:"harmony_park",stations:["fork"],time:"forever-committed"},
   {venue:3,stations:[]},
   {venue:"both_independent",stations:"fork"}
 ])await assert.rejects(()=>forkFestival(input),RangeError);
 assert.throws(()=>stationCard({stationId:"not-real"}),RangeError);
 assert.throws(()=>stationCard({stationId:"fork",time:"automatic-signup"}),RangeError);
 const empty=await forkFestival();
 assert.deepEqual(empty.chosenPublicStations,[]);
 assert.equal(empty.branches.length,1);
 assert.equal(empty.branches[0].venueOption,"undecided");
 assert.equal(empty.branches[0].publicLaunch,"HOLD");
 assert.ok(TIME_OPTIONS.includes("not_yet_sure"));
 assert.ok(LOCATION_OPTIONS.includes("both_independent"));
});

test("Public-only workshop UI is local-first and never claims booked or approved events",()=>{
 const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
 const html=read("bridge/first/festival-forks.html");
 const ui=read("bridge/first/festival-forks-ui.mjs");
 const first=read("bridge/first/index.html");
 const doc=read("docs/FESTIVAL-FORK-NETWORK-011.md");
 assert.match(first,/festival-forks\.html/);
 assert.match(html,/connect-src 'none'/);
 assert.match(html,/FESTIVAL-FORK-011/);
 assert.match(html,/Harmony Park/);
 assert.match(html,/Courthouse Park/);
 assert.match(html,/religious activity is always opt-in/i);
 assert.match(html,/not booked/i);
 assert.match(html,/No work assigned, booked, funded or sent/i);
 assert.doesNotMatch(ui,/\bfetch\s*\(|\bsendBeacon\s*\(|\blocalStorage\b|\bsessionStorage\b/i);
 assert.match(ui,/forkFestival/);
 assert.match(doc,/October 2027/);
 assert.match(doc,/already past/);
 assert.match(doc,/507-571-0886/);
 assert.match(doc,/no.*inherited.*permit/i);
});
