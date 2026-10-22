import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  DOORS,PROJECT,PROJECT_ID,RETURN_SCHEMA,doorById,createLocalReturn,
  validateLocalReturn,publicDoorLink,printGate,readPublicDoor,paperCards
} from "./core.mjs";

test("four understandable options and deliberately fictional first-contact framing",()=>{
  assert.deepEqual(DOORS.map(x=>x.id),["help","question","create","browse"]);
  assert.equal(PROJECT.id,PROJECT_ID);
  assert.equal(PROJECT.service,"NOT_A_LIVE_HELP_NETWORK");
  assert.equal(PROJECT.ownerClaim,"NO_EXTERNAL_ORGANIZATION_APPROVAL");
  assert.equal(doorById("create").title,"I have an idea or song");
  assert.equal(doorById("recruiter"),null);
});
test("local choice cannot pretend to send a task, grant song rights or publish",()=>{
  const response=createLocalReturn({door:"help",note:"Perhaps carry chairs?",acknowledged:true});
  assert.equal(response.schema,RETURN_SCHEMA);
  assert.equal(response.disposition,"UNSENT_DEVICE_LOCAL_DRAFT");
  assert.equal(response.authority,"NONE");
  assert.equal(response.creatorLicense,"NOT_GRANTED");
  assert.equal(response.recipientConfirmation,"NONE");
  assert.equal(response.published,false);
  assert.equal(response.contactChannel,"NONE");
  assert.deepEqual(validateLocalReturn(JSON.parse(JSON.stringify(response))),response);
});
test("no obligation to type a note or even become interested",()=>{
  const draft=createLocalReturn({door:"browse",note:"",acknowledged:true});
  assert.equal(draft.note,"");
  assert.equal(draft.claim,"NOT_A_REQUEST_OR_OFFER_IN_A_LIVE_SYSTEM");
});
test("consent to local-only draft is an explicit gate",()=>{
  assert.throws(()=>createLocalReturn({door:"help",note:"",acknowledged:false}),/acknowledgment/);
  assert.throws(()=>createLocalReturn({door:"help",note:""}),/acknowledgment/);
});
test("improper fields including identity, location and unapproved authority fail closed",()=>{
  assert.throws(()=>createLocalReturn({door:"help",note:"",acknowledged:true,contact:"me"}),/unexpected/);
  assert.throws(()=>createLocalReturn({door:"help",note:"",acknowledged:true,externalApproved:true}),/unexpected/);
  assert.throws(()=>createLocalReturn({door:"help",note:"",acknowledged:true,address:"home"}),/unexpected/);
});
test("apparent phone, email, markup and oversized drafts are refused",()=>{
  for(const note of ["please email me at a@example.org","call 612-555-0102",
    "<img src=x onerror=alert(1)>","x".repeat(181)]){
    assert.throws(()=>createLocalReturn({door:"question",note,acknowledged:true}),/REFUSED/);
  }
});
test("a tampered return cannot claim sent, confirmed, an artistic license or adoption",()=>{
  const original=createLocalReturn({door:"create",note:"A porch concert?",acknowledged:true});
  for(const [field,value] of [
    ["authority","ORGANIZER"],["published",true],["creatorLicense","CC0"],
    ["recipientConfirmation","CONFIRMED"],["disposition","SENT"],["contactChannel","EMAIL"]]){
    assert.throws(()=>validateLocalReturn({...original,[field]:value}),/REFUSED/);
  }
  assert.throws(()=>validateLocalReturn({...original,source:"other"}),/REFUSED/);
});
test("public QR address contains only project and public choice, never private notes",()=>{
  const link=publicDoorLink("https://community.example/test-door/index.html","help");
  const u=new URL(link);
  assert.equal(u.origin,"https://community.example");
  assert.equal(u.pathname,"/test-door/index.html");
  assert.equal(u.search,"");
  assert.equal(readPublicDoor(u.hash),"help");
  assert.equal(u.hash.includes("name"),false);
  assert.equal(u.hash.includes("note"),false);
  assert.equal(u.hash.includes("phone"),false);
});
test("no data-bearing query strings, fragments, credentials, unsafe schemes or external HTTP on QR",()=>{
  for(const url of [
    "javascript:alert(1)","file:///tmp/test.html",
    "http://example.com/door/","https://bad:pass@example.com/door/",
    "https://example.com/door/?token=secret","https://example.com/door/#private"
  ])assert.throws(()=>publicDoorLink(url,"help"),/REFUSED/);
  assert.throws(()=>publicDoorLink("https://example.com/door/","not-a-choice"),/REFUSED/);
});
test("only intended private LAN HTTP is suitable for a supervised scan experiment",()=>{
  assert.equal(new URL(publicDoorLink("http://192.168.1.5:8000/field/","help")).hostname,"192.168.1.5");
  assert.equal(new URL(publicDoorLink("http://10.1.2.3:9090/","question")).hostname,"10.1.2.3");
  assert.throws(()=>publicDoorLink("http://8.8.8.8/field/","help"),/REFUSED/);
});
test("no QR without separate-phone operator attestation and same actual served address",()=>{
  const address="https://community.example/first-contact/";
  assert.equal(printGate(address,address,false).canPrintQR,false);
  assert.equal(printGate("https://other.example/first-contact/",address,true).canPrintQR,false);
  assert.equal(printGate("https://community.example/other/",address,true).canPrintQR,false);
  assert.equal(printGate(address,address,true).canPrintQR,true);
  assert.equal(printGate(address,address,true).stage,"OPERATOR_ATTESTED_HTTPS_PREVIEW");
  assert.equal(printGate("file:///tmp/card.html","file:///tmp/card.html",true).canPrintQR,false);
});
test("private local QR attestation cannot be mistaken for public deployment",()=>{
  const addr="http://192.168.0.5:8000/first-contact/";
  const gate=printGate(addr,addr,true);
  assert.equal(gate.canPrintQR,true);
  assert.equal(gate.stage,"PRIVATE_NETWORK_TEST_ONLY");
  assert.match(gate.label,/DO NOT DISTRIBUTE/);
});
test("fabricated or duplicate hash parameters are refused",()=>{
  assert.throws(()=>readPublicDoor("#project="+PROJECT_ID+"&door=help&other=value"),/REFUSED/);
  assert.throws(()=>readPublicDoor("#project="+PROJECT_ID+"&door=help&door=create"),/REFUSED/);
  assert.throws(()=>readPublicDoor("#project=other&door=help"),/REFUSED/);
  assert.throws(()=>readPublicDoor("#project="+PROJECT_ID+"&door=unknown"),/REFUSED/);
  assert.throws(()=>readPublicDoor("#project="+PROJECT_ID+"&door=help&n="+"x".repeat(300)),/REFUSED/);
});
test("the three printable seed doors never include a private return or participant details",()=>{
  const cards=paperCards();
  assert.equal(cards.length,3);
  assert.deepEqual(cards.map(x=>x.id),["help","question","create"]);
  for(const c of cards){
    assert.match(c.safeLabel,/NO ACCOUNT/);
    assert.equal(Object.hasOwn(c,"note"),false);
    assert.equal(Object.hasOwn(c,"email"),false);
  }
});
test("the document has true mobile, printable and account-free surfaces",()=>{
  const html=readFileSync(new URL("./index.html",import.meta.url),"utf8");
  const css=readFileSync(new URL("./style.css",import.meta.url),"utf8");
  const app=readFileSync(new URL("./app.mjs",import.meta.url),"utf8");
  const qr=readFileSync(new URL("./vendor/qrcode.min.js",import.meta.url),"utf8");
  const license=readFileSync(new URL("./vendor/LICENSE.qrcodejs.txt",import.meta.url),"utf8");
  assert.match(html,/<meta name="viewport"/);
  assert.match(html,/No account/);
  assert.match(html,/not a live help service/);
  assert.match(html,/data-door="help"/);
  assert.match(html,/data-door="create"/);
  assert.match(html,/id="operator-tested"/);
  assert.match(html,/qrcode.min.js/);
  assert.match(css,/@page\{size:letter/);
  assert.match(css,/layout-9/);
  assert.match(css,/layout-4/);
  assert.match(app,/printGate\(/);
  assert.match(app,/createLocalReturn\(/);
  assert.match(app,/URL.createObjectURL/);
  assert.doesNotMatch(app,/\bfetch\s*\(|sendBeacon|XMLHttpRequest|localStorage|sessionStorage/);
  assert.ok(qr.length>15000);
  assert.match(license,/MIT License/);
});
