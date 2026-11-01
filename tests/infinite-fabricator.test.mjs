import test from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {FABRICATOR_OBJECTS,FABRICATOR_TOOLS,proposeFabricatorObject} from "../bridge/mit-solve/infinite-fabricator.mjs";
import {proposeNextCapability} from "../bridge/mit-solve/capability-growth.mjs";

test("three bounded real-world fabrication candidates extend existing HELD workshop cards",()=>{
  assert.deepEqual(FABRICATOR_OBJECTS,["field-card","case-insert","alignment-jig"]);
  assert.deepEqual(FABRICATOR_TOOLS,["paper_printer","fff_printer"]);
  for(const id of FABRICATOR_OBJECTS){
    const p=proposeFabricatorObject(id);
    assert.equal(p.parent_workshop_content_sha256,proposeNextCapability(p.parent_workshop_goal).content_sha256_integrity_only);
    assert.equal(p.recipe_state,"HOLD_MISSING_DECLARED_TOOL");
    assert.equal(p.tool_observed_or_connected,false);
    assert.equal(p.authorization_status,"NOT_REQUESTED");
    assert.equal(p.physical_design_generated,false);
    assert.equal(p.native_cad_or_slicer_executed_here,false);
    assert.equal(p.physical_machine_profile_verified,false);
    assert.ok(p.proposed_independent_checks.length>=4);
    assert.ok(p.work_sequence.some(s=>/second operator/.test(s)));
    for(const [k,v] of Object.entries(p.effects))assert.equal(v,false,"effect "+k);
    for(const [k,v] of Object.entries(p.evidence))
      if(k!=="proposal_only" && k!=="native_parent_proposal_invoked") assert.equal(v,false,"evidence "+k);
    const {content_sha256_integrity_only,...body}=p;
    assert.equal(content_sha256_integrity_only,createHash("sha256").update(JSON.stringify(body)).digest("hex"));
    assert.equal(proposeFabricatorObject(id).content_sha256_integrity_only,content_sha256_integrity_only);
  }
});

test("operator-declared available tool changes only the HOLD reason, never authorizes execution",()=>{
  const a=proposeFabricatorObject("field-card",["paper_printer"]);
  assert.equal(a.recipe_state,"HOLD_OWNER_AUTHORIZATION_AND_VERIFICATION");
  assert.equal(a.tool_observed_or_connected,false);
  assert.equal(a.effects.printer_start,false);
  assert.equal(a.evidence.physical_fixture_made,false);
  assert.notEqual(a.content_sha256_integrity_only,proposeFabricatorObject("field-card").content_sha256_integrity_only);
  const sorted=proposeFabricatorObject("case-insert",["fff_printer","paper_printer"]);
  assert.equal(sorted.content_sha256_integrity_only,proposeFabricatorObject("case-insert",["paper_printer","fff_printer"]).content_sha256_integrity_only);
});

test("unknown tools, hazardous requests, duplicates and coercive commands fail closed",()=>{
  for(const id of ["","cigarette","tobacco","weapon","robot","medical_device","print-now","../etc","field-card\\nstart",null,{},[]])
    assert.throws(()=>proposeFabricatorObject(id),RangeError);
  for(const tools of [["laser"],["fff_printer","fff_printer"],["paper_printer",0],["paper_printer","fff_printer","paper_printer"],"fff_printer",{},null])
    assert.throws(()=>proposeFabricatorObject("case-insert",tools),TypeError);
});

test("MIT doorway presents the optional physical-output port without a live printer claim",()=>{
  const doc=readFileSync(new URL("../docs/INFINITE-FABRICATOR-SUITCASE-001.md",import.meta.url),"utf8");
  const html=readFileSync(new URL("../bridge/mit-solve/fabricator.html",import.meta.url),"utf8");
  const landing=readFileSync(new URL("../bridge/mit-solve/index.html",import.meta.url),"utf8");
  const d=JSON.parse(readFileSync(new URL("../bridge/mit-solve/doorway.json",import.meta.url),"utf8"));
  assert.match(landing,/\.\/fabricator\.html/);
  assert.match(doc,/INFINITE-FABRICATOR-SUITCASE-001/);
  assert.match(doc,/RECIPE != PRINTED OBJECT/);
  assert.match(html,/physical part has not been manufactured/i);
  assert.match(html,/script-src 'none'/);
  assert.doesNotMatch(html,/<script|<form|<input|\\bfetch\\s*\\(/i);
  assert.equal(d.infinite_fabricator_candidate.status,"HELD_SOFTWARE_ONLY");
  assert.equal(d.infinite_fabricator_candidate.printer_connected,false);
  assert.equal(d.infinite_fabricator_candidate.physical_output_proven,false);
  assert.equal(d.application.state,"DRAFT_NOT_SUBMITTED");
});
