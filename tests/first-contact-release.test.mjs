import test from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";

const base = new URL("../",import.meta.url);
const pinnedCannonSha = "2152730d1b300933ce484f455bbdb2da4ab09dd3";
const originalBlobDigests = Object.freeze({
 "field/first-contact/index.html":"895ba2d45758e3623bda3a1e8fc14faa044909b0",
 "field/first-contact/style.css":"5a6abce441aaf9ca99f211e92b1a490e882202ab",
 "field/first-contact/core.mjs":"f46ce7600387ad0ab7d120ebcecb07c4320bdba4",
 "field/first-contact/app.mjs":"3e63edef530f69ef0c04bd79b48814070383d52f",
 "field/first-contact/vendor/qrcode.min.js":"993e88f396640f881b69f98db7a4d17401ef83ca",
 "field/first-contact/vendor/LICENSE.qrcodejs.txt":"93c33233fa538ff9af27374eb13c6ea5147f7a3e"
});
const read=path=>readFileSync(new URL(path,base));
const gitBlob=bytes=>createHash("sha1").update("blob "+bytes.length+"\0").update(bytes).digest("hex");

test("public participant assets preserve each exact pinned original CANNON 028 Git object",()=>{
 assert.match(pinnedCannonSha,/^[0-9a-f]{40}$/);
 for(const [file,wanted] of Object.entries(originalBlobDigests)){
  assert.equal(gitBlob(read(file)),wanted,"review changed source / repin deliberately: "+file);
 }
});
test("all public route dependencies are in the immutable allowlist; test and private materials are not",()=>{
 const script=read("scripts/build-release.mjs").toString("utf8");
 for(const file of Object.keys(originalBlobDigests)){
   assert.ok(script.includes("'"+file+"'"),"not in release manifest: "+file);
 }
 assert.ok(!script.includes("'tests/first-contact-browser.py'"));
 assert.ok(!script.includes("'docs/FIRST-CONTACT-028-ABUNDENT-PREVIEW.md'"));
});
test("manual production controls and scoped QR CSP remain unchanged",()=>{
 const vercel=JSON.parse(read("vercel.json"));
 assert.equal(vercel.git.deploymentEnabled,false);
 assert.equal(vercel.outputDirectory,"dist");
 assert.equal(vercel.rewrites,undefined);
 const global=vercel.headers.find(x=>x.source==="/(.*)");
 const scoped=vercel.headers.find(x=>x.source==="/field/first-contact/(.*)");
 assert.ok(global&&scoped,"global security boundary and route exception needed");
 const csp=scoped.headers.find(x=>x.key==="Content-Security-Policy")?.value;
 assert.ok(csp&&csp.includes("script-src 'self'"));
 assert.ok(csp.includes("connect-src 'none'"));
 assert.ok(csp.includes("img-src 'self' data: blob:"));
 assert.ok(csp.includes("form-action 'none'"));
 assert.ok(csp.includes("frame-ancestors 'none'"));
 assert.equal(vercel.headers.filter(x=>x.source==="/field/first-contact/(.*)").length,1);
});
test("source site and existing field deck link to independent optional participant door",()=>{
 const home=read("index.html").toString("utf8");
 const cards=read("field/cards/index.html").toString("utf8");
 assert.ok(home.includes('./field/first-contact/'));
 assert.ok(cards.includes('../first-contact/'));
 assert.ok(home.includes('./circulation/'),"the prior #69 Circulation route must survive graft");
});
