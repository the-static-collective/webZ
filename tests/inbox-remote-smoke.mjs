// One-off public Edge HTTP proof. All data is explicitly synthetic; credentials never logged.
// Runs on CI to prove server-side permission separation and full lifecycle.
import assert from "node:assert/strict";
import {draftNeed,compareRoutes,draftPacket} from "../commons/exchange.mjs";
const URL="https://kbhqacsdvjsstzyplqij.supabase.co/functions/v1/commons-inbox";
const origin="https://apps.abundent.org";
async function call(body,expected=200){
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),12000);
 try{
  const response=await fetch(URL,{method:"POST",headers:{"content-type":"application/json","origin":origin},
    body:JSON.stringify(body),signal:controller.signal,cache:"no-store"});
  const json=await response.json();
  assert.equal(response.status,expected,
    body.action+" returned HTTP "+response.status+" / "+(json.error||"unknown"));
  assert.equal(response.headers.get("access-control-allow-origin"),origin);
  return json;
 }finally{clearTimeout(timeout)}
}
let roomId=null,owner=null,reviewer=null,submitter=null;
try{
 const created=await call({action:"create",title:"SYNTHETIC CI TEST ROOM - NOT A PARTNER",region:"Fictional Waseca test"});
 roomId=created.room.id;({owner,reviewer,submitter}=created.keys);
 assert.ok(owner!==reviewer && reviewer!==submitter && owner!==submitter);
 const key=(role)=>({roomId,token:role});
 const subView=await call({action:"open",...key(submitter)});
 assert.equal(subView.role,"submitter");
 assert.deepEqual(subView.items,[]);
 const need=draftNeed({region:"Fictional test region",category:"food",
    summary:"Twenty hypothetical community food parcels",quantity:20,unit:"parcels",window:"7-days"});
 const comparison=compareRoutes([
  {route:"local-purchase",estimatedUSD:25,reviewed:false},
  {route:"remote-donation",estimatedUSD:"",reviewed:false,importCleared:false},
  {route:"knowledge-transfer",estimatedUSD:"",reviewed:false}
 ]);
 const sent=await call({action:"submit",...key(submitter),packet:draftPacket(need,comparison)});
 assert.equal(sent.acceptedAs,"UNVERIFIED_SOURCE_CARD");
 const itemId=sent.item.id;
 const ownerView=await call({action:"open",...key(owner)});
 assert.equal(ownerView.items.length,1);
 const reviewerView=await call({action:"open",...key(reviewer)});
 assert.equal(reviewerView.items.length,1);
 await call({action:"decide",...key(submitter),itemId,
   decision:"ACCEPT_FOR_LOCAL_REVIEW",reason:"Synthetic check only; no field act."},403);
 await call({action:"report",...key(reviewer),itemId,status:"REPORTED_COMPLETE",
   summary:"No action was performed in this purely synthetic test room.",quantity:1,unit:"parcels"},409);
 await call({action:"decide",...key(reviewer),itemId,
   decision:"ACCEPT_FOR_LOCAL_REVIEW",reason:"Only a simulated approval to examine an example."});
 const outcome=await call({action:"report",...key(reviewer),itemId,
   status:"REPORTED_PARTIAL",summary:"One entirely fictional parcel counted solely for test.",quantity:1,unit:"parcels"});
 assert.equal(outcome.verified,false);assert.equal(outcome.recipientConfirmed,false);
 const refreshed=await call({action:"open",...key(reviewer)});
 assert.ok(refreshed.events.some(x=>x.event_kind==="REPORTED_PARTIAL"));
 const rotated=await call({action:"rotate",...key(owner),role:"submitter"});
 assert.equal(rotated.oldCapabilityRevoked,true);
 await call({action:"open",...key(submitter)},404);
 const newSub=await call({action:"open",...key(rotated.key)});
 assert.equal(newSub.role,"submitter");
 await call({action:"close",...key(owner)});
 await call({action:"submit",...key(rotated.key),packet:draftPacket(need,comparison)},409);
 console.log("LIVING-INBOX-002 HTTP PROOF: create, scoped read, source submit, role refusal, review, unverified report, key rotation, close — PASS. All records synthetic.");
}finally{
 if(roomId&&owner){
  try{
   await call({action:"delete",roomId,token:owner});
   await call({action:"open",roomId,token:owner},404);
   console.log("SYNTHETIC INBOX DELETION: PASS");
  }catch(err){
   console.error("SYNTHETIC CLEANUP NEEDS MANUAL REVIEW; private tokens were not logged.");
   throw err;
  }
 }
}
