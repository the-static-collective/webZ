import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {COMMONS_STORY,COMMONS_BUDGET,FINALE,TOTAL,DRAFT_750,WEEKLY_CADENCE,PHASES,STOP_RULES,planningPacket} from "../bridge/first/commons-circuit.mjs";
import {ALLOCATION,PROJECT,DRAFTS,budgetTotal,PROSPECTS,publicStatus} from "../bridge/first/model.mjs";

test("All $30,000 support people, meals, accessible culture, steward listening, fieldwork or safe events",()=>{
 assert.equal(TOTAL,30000);
 assert.equal(COMMONS_BUDGET.length,10);
 for(const line of COMMONS_BUDGET){
   assert.equal(line.usd,line.units*line.usdPerUnit,line.id);
   assert.ok(line.usd>0);assert.ok(line.notes.length>30);
 }
 assert.equal(COMMONS_BUDGET.reduce((s,l)=>s+l.usd,0),30000);
 assert.equal(ALLOCATION.reduce((s,x)=>s+x[1],0),TOTAL);
 assert.equal(budgetTotal(),TOTAL);
 assert.ok(COMMONS_BUDGET.some(x=>x.id==="steward-meetings"&&x.units===24));
 assert.ok(COMMONS_BUDGET.some(x=>x.id==="founder-fieldwork"));
 assert.ok(COMMONS_BUDGET.some(x=>x.id==="paid-co-facilitators"));
 assert.match(PROJECT,/Commons Circuit/);
});

test("Unsubmitted 750-character copy explicitly prioritizes real human and local stewardship",()=>{
 assert.ok(DRAFT_750.length<=750,"description too long: "+DRAFT_750.length);
 assert.ok(DRAFT_750.length>=500);
 for(const term of ["potluck","festival","Harmony Park","September 2027","staff","independent circles","founder's authority"])
   assert.ok(DRAFT_750.includes(term),term);
 assert.equal(DRAFTS[0].value,DRAFT_750);
 assert.equal(PROSPECTS[0].state,"APPLICATION_NOT_SUBMITTED");
 assert.equal(publicStatus().applicationSubmitted,false);
});
test("Plan describes real relation formation, not a fake calendar or partner grant",()=>{
 assert.equal(COMMONS_STORY.stage,"APPLICANT_REVIEW_NOT_SUBMITTED");
 assert.match(COMMONS_STORY.hosting,/NO_SITES_PARTNERS_/);
 assert.equal(WEEKLY_CADENCE.length,4);
 assert.deepEqual(PHASES.map(x=>x.months),["April","May–June","July–August","September"]);
 assert.ok(STOP_RULES.includes("NO_PAID_ACCESS_OR_INDUCEMENTS_TO_PUBLIC_OFFICIALS"));
 assert.ok(STOP_RULES.includes("NO_SURVIVOR_TESTIMONY_OR_PERSONAL_SAFETY_DETAILS_AT_PUBLIC_EVENTS"));
 assert.ok(STOP_RULES.includes("NO_PUBLIC_EVENT_WITHOUT_SITE_PERMISSION_AND_ADEQUATE_SAFETY_COVERAGE"));
 const p=planningPacket();
 assert.equal(p.budgetUSD,30000);
 assert.equal(p.claimedHosts,0);
 assert.equal(p.scheduledMeetings,0);
 assert.equal(p.completedFestivals,0);
 assert.equal(p.externalConsent,false);
 assert.equal(p.verifiedEconomicReturns,0);
 assert.equal(p.applicantApproved,false);
 assert.equal(p.applicationSubmitted,false);
 assert.equal(p.realCommunityRelationshipsMeasured,false);
 assert.equal(FINALE.initialSeedUSD,5000);
 assert.equal(FINALE.seedIsFullFestivalBudget,false);
 for(const name of ["venueBooked","quoteReceived","operatorPermission","promoterContracted","fullyFinanced","voqalInvitationsSent","voqalAttendanceConfirmed","artistOrVendorContracted","miniFestivalAuthorized","familySafeguardingReviewed"])assert.equal(p.finale[name],false,name);
 assert.ok(STOP_RULES.includes("NO_FULL_SCALE_FESTIVAL_CLAIM_FROM_FIVE_THOUSAND_DOLLAR_SEED"));
 assert.equal(COMMONS_BUDGET.find(x=>x.id==="mini-festivals").units,1);
 assert.equal(COMMONS_BUDGET.find(x=>x.id==="harmony-finale-seed").usd,5000);
});
test("Public doorway makes human-first work and distinct safeguarding clear, without intake",()=>{
 const page=readFileSync(new URL("../bridge/first/index.html",import.meta.url),"utf8");
 const doc=readFileSync(new URL("../docs/VOQAL-COMMONS-CIRCUIT-009.md",import.meta.url),"utf8");
 assert.match(page,/one open community table plus one legitimate resource-steward listening meeting every week/i);
 assert.match(page,/one legitimate resource-steward listening meeting/i);
 assert.match(page,/NOT SUBMITTED/);
 assert.match(page,/no confirmed hosts, partners, festivals/i);
 assert.match(page,/Public culture gatherings never replace confidential safeguarding/i);
 assert.doesNotMatch(page,/<form/i);
 assert.match(page,/Harmony Park/i);
 const grand=readFileSync(new URL("../docs/VOQAL-HARMONY-PARK-FINALE-010.md",import.meta.url),"utf8");
 assert.match(grand,/No venue inquiry/i);
 assert.match(grand,/Harmony Family Campout 2027/);
 assert.match(grand,/Groove Productions/);
 assert.match(grand,/Voqal/i);
 assert.match(grand,/seed\/producer\/venue reserve/);
 assert.match(grand,/September 2027/);
 for(const phrase of ["Inherit","inherited founder authority","falsifier","NO REAL EVENTS","$30,000","Festival","No specific new exchange"])
   assert.ok(doc.toLowerCase().includes(phrase.toLowerCase()),phrase);
});
