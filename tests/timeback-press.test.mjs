import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,writeFileSync,readFileSync,existsSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import {makeCreativeCarry} from "../apps/arcade/source-carry.mjs";

const exe=fileURLToPath(new URL("../tools/timeback-press-edition.mjs",import.meta.url));
test("original-schema-shaped content becomes actual private printer-ready edition and WRENCH notes",()=>{
 const dir=mkdtempSync(join(tmpdir(),"timeback-test-"));
 try{
  const packet=join(dir,"source.json"),out=join(dir,"local-edition");
  writeFileSync(packet,JSON.stringify(makeCreativeCarry("<script>alert('no')</script> A tiny zine",0,"lemonpress")));
  const p=spawnSync("node",[exe,"--packet",packet,"--out",out],{encoding:"utf8",shell:false});
  assert.equal(p.status,0,p.stderr);
  const html=readFileSync(join(out,"edition.html"),"utf8");
  const manifest=JSON.parse(readFileSync(join(out,"work-manifest.json"),"utf8"));
  const receipt=JSON.parse(readFileSync(join(out,"wrench-preparation.json"),"utf8"));
  assert.match(html,/PRIVATE PRINT PROOF \/ NOT PUBLISHED/);
  assert.match(html,/&lt;script&gt;/);
  assert.doesNotMatch(html,/<script>|<img|<iframe/);
  assert.match(html,/@page\{size:6in 9in/);
  assert.equal(manifest.status,"forming");
  assert.equal(manifest.admission.state,"pending");
  assert.equal(manifest.admission.receipt,null);
  assert.equal(receipt.published,false);
  assert.equal(receipt.rightsEstablished,false);
  assert.ok(existsSync(join(out,"source.md")));
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test("altered claimed admission cannot produce an edition",()=>{
 const dir=mkdtempSync(join(tmpdir(),"timeback-test-"));
 try{
  const packet=join(dir,"source.json"),out=join(dir,"no-edition");
  const value=makeCreativeCarry("Write one safe note",0,"lemonpress");
  value.nativeContract.admission.state="admitted";
  writeFileSync(packet,JSON.stringify(value));
  const p=spawnSync("node",[exe,"--packet",packet,"--out",out],{encoding:"utf8",shell:false});
  assert.notEqual(p.status,0);
  assert.equal(existsSync(join(out,"work-manifest.json")),false);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
