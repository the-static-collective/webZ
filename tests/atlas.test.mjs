import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const atlas=JSON.parse(readFileSync(new URL("../bridge/atlas/atlas.json",import.meta.url),"utf8"));
test("dated public map preserved all 89 source addresses and observed branch counts",()=>{
 assert.equal(atlas.schema,"abundent/bridge-atlas-v1");
 assert.equal(atlas.totals.publicRepositories,89);
 assert.equal(atlas.repositories.length,89);
 assert.equal(new Set(atlas.repositories.map(r=>r.name)).size,89);
 assert.equal(atlas.repositories.reduce((a,r)=>a+r.refsObserved,0),atlas.totals.branchRefs);
 assert.equal(atlas.repositories.reduce((a,r)=>a+r.prsObserved,0),atlas.totals.openPullRequests);
 assert.match(atlas.observation.captured,/^2026-10-28T/);
 assert.match(atlas.observation.interpretation,/NOT_LIVE/);
});
test("declared relations and proposed paths cannot silently become live integration",()=>{
 assert.ok(atlas.relations.length>=5);
 for(const e of atlas.relations){assert.equal(e.type,"SOURCE_DECLARED");assert.match(e.source,/^https:\/\/github.com\/the-static-collective\//)}
 for(const p of atlas.paths){assert.equal(p.status,"CANDIDATE_COMPOSITION");assert.ok(p.gate);assert.ok(p.nodes.length>=4);for(const n of p.nodes)assert.ok(atlas.repositories.some(r=>r.name===n),n)}
 assert.ok(atlas.boundaries.includes("MAIN != CANON"));
 assert.ok(atlas.boundaries.includes("OPEN_PR != ACCEPTED"));
});
test("source notes are clearly labeled proposals or map-only hypotheses",()=>{
 for(const r of atlas.repositories){assert.match(r.url,/^https:\/\/github.com\/the-static-collective\//);assert.ok(r.shelf);assert.ok(r.defaultRef);if(r.role){assert.ok(r.role.nextGate);assert.ok(["READ_ME_OR_PROJECT_DOCUMENTED","MAP_ORIENTATION_HYPOTHESIS"].includes(r.role.sourceStatus))}}
 const g=atlas.repositories.find(r=>r.name==="GHoT");assert.equal(g.role.role,"energy");assert.match(g.notableOpenPr,/github.com\/the-static-collective\/GHoT\/pull\/131/);
});
test("browser reader is an entirely local review projection",()=>{
 const html=readFileSync(new URL("../bridge/atlas/index.html",import.meta.url),"utf8");
 const js=readFileSync(new URL("../bridge/atlas/app.mjs",import.meta.url),"utf8");
 assert.match(html,/connect-src 'none'/);
 assert.match(js,/CANDIDATE_ONLY_NOT_APPROVED/);
 assert.doesNotMatch(js,/\bfetch\s*\(|\blocalStorage\b|\bsessionStorage\b/);
});
