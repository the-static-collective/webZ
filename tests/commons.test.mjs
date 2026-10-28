
import test from "node:test";import assert from "node:assert/strict";
import {draftNeed,compareRoutes,draftPacket} from "../commons/exchange.mjs";
const seed={region:"Nima / Accra, Ghana (proposed)",category:"food",summary:"Shelf-stable food parcels",quantity:30,unit:"parcels",window:"30-days"};
const paths=[
 {route:"local-purchase",estimatedUSD:120,reviewed:true},
 {route:"remote-donation",estimatedUSD:80,reviewed:true,importCleared:false},
 {route:"knowledge-transfer",estimatedUSD:"",reviewed:false}
];
test("organizational drafts are HOLD and never impersonate a partner or recipient",()=>{
 const a=draftNeed(seed);assert.equal(a.status,"HOLD");assert.equal(a.source_kind,"UNVERIFIED_OPERATOR_DRAFT");
 assert.equal(a.local_operator_authorized,false);assert.equal(a.receiver_confirmed,false);
 const pkt=draftPacket(a,compareRoutes(paths));assert.equal(pkt.dispatch,"DISABLED");
 assert.equal(pkt.handoff.recipient_confirmation,"NOT_RECEIVED");
 assert.equal(pkt.handoff.originating_provider,"NOT_ESTABLISHED");
});
test("no silent shipment preference when import is not cleared",()=>{
 const c=compareRoutes(paths);assert.equal(c.lowestStatedEligible,"local-purchase");
 assert.equal(c.routes[1].eligible,false);assert.equal(c.savingsAgainstNextEligible,null);
});
test("checked and fully costed alternatives can be compared, but not approved",()=>{
 const c=compareRoutes([
  {route:"local-purchase",estimatedUSD:120,reviewed:true},
  {route:"remote-donation",estimatedUSD:80,reviewed:true,importCleared:true},
  {route:"knowledge-transfer",estimatedUSD:110,reviewed:true}
 ]);assert.equal(c.lowestStatedEligible,"remote-donation");assert.equal(c.savingsAgainstNextEligible,30);
 assert.match(draftPacket(draftNeed(seed),c).transition_law,/match != delivery/);
});
test("unknown prices do not become zero cost",()=>{
 const c=compareRoutes(paths.map(x=>({...x,estimatedUSD:""})));
 assert.equal(c.lowestStatedEligible,null);assert.equal(c.routes[0].estimatedUSD,null);
});
test("no client personal details or contact coordinates in export input",()=>{
 for(const summary of ["Jane Doe jane@example.org", "guest name: Jane", "Call 612-555-1212", "Shelter address: 123 Main"])
  assert.throws(()=>draftNeed({...seed,summary}),/Remove contact information/);
});
test("invalid data and made-up verified cards are refused",()=>{
 assert.throws(()=>draftNeed({...seed,quantity:0}),/Quantity/);
 assert.throws(()=>draftNeed({...seed,category:"beds-open"}),/category/);
 assert.throws(()=>draftPacket({...draftNeed(seed),status:"CONFIRMED"},compareRoutes(paths)),/Only an unapproved/);
 assert.throws(()=>compareRoutes([{route:"remote-donation"}]),/three/);
});
