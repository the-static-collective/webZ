// INFINITE-FABRICATOR-SUITCASE-001: a held physical-output port for Living Suitcase.
// This module makes proposal packets only. It does not contact, reserve, start,
// control, or certify any physical machine, material, user or other repository.
import {createHash} from "node:crypto";
import {proposeNextCapability} from "./capability-growth.mjs";

const SPECIMENS=Object.freeze({
  "field-card":{
    label:"A paper field invitation card",
    workshopGoal:"outreach",
    requiredTool:"paper_printer",
    expectedMaterial:"User-supplied ordinary paper and suitable ink; quantities unmeasured",
    design:"Blank public-safe invitation/QUESTION/OFFER card; no person's data or automatic QR destination",
    independentChecks:["Readable on an actual printed sample","No personal or sensitive information","Printed dimensions match local intended format","Second operator can reproduce a legible card with an independent printer"],
    safeManualAlternative:"Handwrite or manually print a blank card without the Suitcase"
  },
  "case-insert":{
    label:"A removable Suitcase electronics case insert",
    workshopGoal:"body",
    requiredTool:"fff_printer",
    expectedMaterial:"Appropriate owner-supplied filament; exact mass, profile and suitability unknown",
    design:"Generic, non-safety-critical enclosure insert; requires new real measurements, CAD and manufacturer-specific slicing",
    independentChecks:["Human measures the actual equipment and ventilation clearances","Qualified owner reviews electrical/fire and mounting constraints","Printed part is separately inspected for fit and safe removal","Independent second builder reproduces the declared function"],
    safeManualAlternative:"Use a commercially suitable, safely installed enclosure or removable organizer"
  },
  "alignment-jig":{
    label:"A simple printer alignment or measurement jig",
    workshopGoal:"printer",
    requiredTool:"fff_printer",
    expectedMaterial:"Owner-supplied calibrated filament and printer; actual compatibility unknown",
    design:"Non-load-bearing calibration jig; requires machine-specific profile, dimensions and material review",
    independentChecks:["Operator independently confirms tool/material compatibility","Machine owner authorizes one supervised job","Completed sample is measured and photographed only when permitted","Second operator independently reproduces its declared use"],
    safeManualAlternative:"Measure with ordinary nonprinted hand tools"
  }
});
const ALLOWED_TOOLS=Object.freeze(["paper_printer","fff_printer"]);
export const FABRICATOR_OBJECTS=Object.freeze(Object.keys(SPECIMENS));
export const FABRICATOR_TOOLS=ALLOWED_TOOLS;

export function proposeFabricatorObject(objectId,declaredTools=[]){
  if(typeof objectId!=="string" || !Object.hasOwn(SPECIMENS,objectId))
    throw new RangeError("Unsupported physical-output candidate: "+FABRICATOR_OBJECTS.join(", "));
  if(!Array.isArray(declaredTools) || declaredTools.length>ALLOWED_TOOLS.length ||
    declaredTools.some(t=>typeof t!=="string" || !ALLOWED_TOOLS.includes(t)) ||
    new Set(declaredTools).size!==declaredTools.length)
    throw new TypeError("Provide only distinct declared tool capabilities: "+ALLOWED_TOOLS.join(", "));
  const spec=SPECIMENS[objectId];
  const parent=proposeNextCapability(spec.workshopGoal); // Actual native held source module.
  const tools=[...declaredTools].sort();
  const declaredAvailable=tools.includes(spec.requiredTool);
  const packet={
    schema:"abundent/infinite-fabricator-suitcase-proposal-v1",
    version:"2026-11-01.1",
    origin:"MIT_LIVING_SUITCASE_BLUEPRINT_FOUNDRY_DRAFT",
    product_direction:"INFINITE_PHYSICAL_OUTPUT_PORT_PROPOSAL",
    object_id:objectId,
    label:spec.label,
    parent_workshop_goal:spec.workshopGoal,
    parent_workshop_content_sha256:parent.content_sha256_integrity_only,
    required_tool:spec.requiredTool,
    operator_declared_unverified_tools:tools,
    tool_observed_or_connected:false,
    material_declaration:spec.expectedMaterial,
    source_design_intent:spec.design,
    physical_design_generated:false,
    native_cad_or_slicer_executed_here:false,
    physical_machine_profile_verified:false,
    authorization_status:"NOT_REQUESTED",
    recipe_state:declaredAvailable?"HOLD_OWNER_AUTHORIZATION_AND_VERIFICATION":"HOLD_MISSING_DECLARED_TOOL",
    proposed_independent_checks:[...spec.independentChecks],
    manual_alternative:spec.safeManualAlternative,
    work_sequence:[
      "Owner identifies real need and verifies actual parts, materials and rights",
      "A qualified person creates/inspects exact geometry or print layout and machine profile",
      "Independent machine/material owner authorizes exactly one supervised job",
      "Operator completes physical fabrication with machine-local safeguards",
      "Separate observer inspects actual artifact, failed attempts, costs and function",
      "Independent second operator reproduces the declared function before blueprint promotion"
    ],
    references:[
      {role:"source_parent",url:"https://github.com/the-static-collective/webZ/pull/193"},
      {role:"design_slicing",url:"https://github.com/the-static-collective/static-os/pull/61"},
      {role:"printer_discovery",url:"https://github.com/the-static-collective/GHoT/pull/102"},
      {role:"owner_hold",url:"https://github.com/the-static-collective/GHoT/pull/105"},
      {role:"playable_participation_independent",url:"https://github.com/the-static-collective/full-measure-world-layer"},
      {role:"workstation_candidate",url:"https://github.com/the-static-collective/static-workbench"}
    ],
    evidence:{
      proposal_only:true,
      native_parent_proposal_invoked:true,
      physical_fixture_made:false,
      machine_authorized:false,
      actual_job_executed:false,
      qualified_inspection_observed:false,
      independent_second_build_verified:false,
      independent_human_witness_observed:false,
      economic_benefit_verified:false
    },
    effects:{
      printer_start:false,
      cnc_start:false,
      robot_actuation:false,
      material_reserved:false,
      value_issued:false,
      public_message_sent:false,
      world_credit_awarded:false
    },
    limits:"A declared capability is not a connected printer. A content hash is not identity, permission, physical inspection or reproducibility. A human may choose an entirely paper-first workflow. Tobacco/consumable manufacture is outside this prototype."
  };
  return {...packet,content_sha256_integrity_only:createHash("sha256").update(JSON.stringify(packet)).digest("hex")};
}
