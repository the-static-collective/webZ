// Jubilee Field Kit 004 — completed local work, not another invitation to write a plan.
export const FIELD_KIT_ROLES=Object.freeze(["song","food","host","crew","tech","steward","translate"]);
const titles=Object.freeze({song:"20-minute music corner",food:"One-pot community soup · eight bowls",host:"45-minute field table",crew:"15-minute sound and room preflight",tech:"15-minute equipment triage table",steward:"30-minute useful-work circle",translate:"12-minute skill-sharing session"});
const clean=(v,max)=>{
 if(typeof v!=="string")throw new Error("Expected a short public idea.");
 const x=v.replace(/[\u0000-\u001f\u007f]/g," ").replace(/\s+/g," ").trim();
 if(x.length>max)throw new Error("Public idea is too long.");
 if(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(x)||/(?:\+?\d[\s().-]*){9,}/.test(x)||
    /(?:guest name|client name|shelter address|street address|apartment number)\s*:/i.test(x))throw new Error("Remove private contact or identifying details first.");
 return x;
};
const kits=Object.freeze({
 song:"RUN SHEET (20 MIN)\n00–02: Welcome: 'You can listen, sing, or simply be here.'\n02–07: One voluntary opening song or instrumental chosen by the performer.\n07–09: Invite an optional spoken response; silence counts as participation.\n09–14: One repeat or second original/permitted tune.\n14–17: Invite a reflection: 'What could make our next gathering easier?'\n17–20: Thank everyone, distinguish offers from commitments, and close.\nCUES: sound-check before doors, no forced participation or unlicensed recordings.",
 food:"RECIPE: TOMATO–BEAN SOUP (APPROX. EIGHT BOWLS)\nINGREDIENTS: four 15-oz cans of cooked beans, drained; two 28-oz cans diced tomatoes; four cups broth/water; one diced onion; two tablespoons oil; optional mild seasoning. Check ingredients and allergens before serving.\nMETHOD: In a large pot soften onion in oil. Add beans, tomatoes and broth. Bring to a simmer and cook about 20 minutes, stirring; season to taste. Heat thoroughly, follow food safety rules and divide into eight bowls.\nSERVICE: Ingredient labels and kitchen authorization are required.",
 host:"READY-TO-RUN AGENDA (45 MIN)\n00–05: Welcome, state that everything is voluntary.\n05–10: One consented song, story or practical demonstration.\n10–15: Ask 'What could we finish with the people and things actually here?'\n15–30: Perform one reversible small task or paper simulation.\n30–40: State what is completed versus merely proposed; list needed approvals.\n40–45: Tidy the place and close. Preserve only consented notes.\nPREFLIGHT: actual venue permission, accessibility, fire/food rules and cleanup remain host-owned.",
 crew:"SMALL EVENT PREFLIGHT (15 MIN)\n00–03: Get equipment permission; check room exits and trip hazards.\n03–06: Check unpowered cables and visible damage. Do not energize unsafe gear.\n06–09: Authorized operator tests one speaking microphone at comfortable level.\n09–12: Test instrument input without feedback; agree a stop signal.\n12–15: Check sightlines, seating and volume, then record outstanding needs.\nCUE: 'Sound is ready for a test; no broadcast or recording has been authorized.'",
 tech:"EQUIPMENT TRIAGE (15 MIN; OBSERVATION ONLY)\n00–03: Ask the owner for device, symptom and expected behavior, without collecting private histories.\n03–06: With gear off, inspect visible cable or label; stop for heat, water, swelling or damaged wiring.\n06–10: Identify model and manufacturer-approved external checks. Do not open enclosures.\n10–13: Write an exact observed symptom and uncertainty.\n13–15: Return device with status observed, unresolved, referred or safely tested.\nDo not claim a repair or electrical certification.",
 steward:"30-MINUTE FACILITATOR SCRIPT\n00–03: 'No one must volunteer, donate, perform or share private experiences.'\n03–08: Ask 'Which small need could this group realistically address?'\n08–12: Choose ONE safe task possible without assuming external help.\n12–22: Do the task or produce one complete usable artifact in the room.\n22–27: Distinguish completed work, promised future action and refusals.\n27–30: Invite feedback; verify any external result separately.\nAttendance, faith, testimony and offers are never treated as blanket consent.",
 translate:"12-MINUTE TEACHING SCRIPT\n00–02: 'You can pass; we will use a non-private example.'\n02–04: Demonstrate three steps of a skill you actually know, keeping safety warnings intact.\n04–07: Invite a plain-language explanation of the process.\n07–09: Identify one ambiguity and correct the instruction.\n09–11: Create a three-line card with verb, needed materials and stop condition.\n11–12: Offer the card voluntarily without requiring names or recording.\nThis is a runnable lesson structure, NOT a performed translation."
});
const limits=Object.freeze({
 song:"Performer chooses permitted music. No artist, recording or event is confirmed.",
 food:"Illustrative recipe. Check dietary restrictions, kitchen permission and local food-safety requirements.",
 host:"Agenda only. No venue or gathering is booked.",
 crew:"Only authorized, competent personnel operate powered equipment. No gear has been tested.",
 tech:"Observations only. No live repairs, unsafe probing or custody claims.",
 steward:"Offers do not equal commitments; the local group owns decisions.",
 translate:"No translation performed or teaching session scheduled. Respect source permissions."
});
export function makeFieldKit(role,focus=""){
 const idea=clean(focus,240);
 if(role==="open"){
  if(idea.length<12)throw new Error("Tell us one public idea in a sentence.");
  const body="15-MINUTE PAPER REHEARSAL\nFOCUS: "+idea+
  "\n00–03: Name one visible, reversible change that would count as progress.\n03–07: Simulate the first action on paper, noting the needed resource.\n07–11: Remove one resource (money, time, equipment); find one still-doable step.\n11–15: Record what actually changed and what remains untested.\nSCRIPT: 'We tested a small version on paper, not a live event.'";
  return {role,title:"15-minute first rehearsal",body,status:"LOCAL_PLAYABLE_KIT",limit:"A ready script, not a performed event or verified outcome."};
 }
 if(!FIELD_KIT_ROLES.includes(role))throw new Error("Choose an available role.");
 const body=kits[role]+(idea?"\nYOUR FOCUS: "+idea:"")+"\nBOUNDARY: "+limits[role];
 return {role,title:titles[role],body,status:"LOCAL_READY_KIT",limit:limits[role]};
}
export function auditFieldKit(kit){
 if(!kit||!["LOCAL_READY_KIT","LOCAL_PLAYABLE_KIT"].includes(kit.status)||
   typeof kit.body!=="string"||kit.body.length<250||
   typeof kit.title!=="string"||!kit.title.trim())return {pass:false,reason:"MISSING_PREPARED_WORK"};
 if(/^\s*(make|prepare|write)\s+(an?\s+)?(?:simple\s+)?(?:invitation|card|plan)\.?\s*$/i.test(kit.body))
   return {pass:false,reason:"EMPTY_HANDOFF"};
 return {pass:true,reason:"STRUCTURAL_WORK_READY_NOT_FIELD_PROOF"};
}
