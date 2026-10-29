#!/usr/bin/env node
// Operator-only lemonPRESS schema-aligned draft edition. Never admits/publishes a work.
import {readFileSync,writeFileSync,mkdirSync,existsSync} from "node:fs";
import {resolve,join} from "node:path";
import {verifyCreativeCarry,OWNERS} from "../apps/arcade/source-carry.mjs";
const args=process.argv.slice(2);
if(args.length!==4||args[0]!=="--packet"||args[2]!=="--out"){
  console.error("Usage: node tools/timeback-press-edition.mjs --packet packet.json --out /chosen/output/dir");
  process.exit(2);
}
let p,source;
try{
  source=readFileSync(resolve(args[1]),"utf8");
  if(source.length>25000)throw Error("Too big");
  p=JSON.parse(source);
}catch{throw Error("HOLD: invalid local packet");}
if(!verifyCreativeCarry(p)||p.lane!=="lemonpress"||p.owner.commit!==OWNERS.lemonpress.commit)
  throw Error("HOLD: packet has changed or does not belong to this source owner.");
const out=resolve(args[3]);
mkdirSync(out,{recursive:true});
if(existsSync(join(out,"work-manifest.json"))||existsSync(join(out,"source.md"))||existsSync(join(out,"edition.html")))
  throw Error("HOLD: destination already contains a working edition; choose a fresh output folder.");
const text=p.createdFrom.artifact;
const escapeHtml=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
const html='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+
  escapeHtml(p.createdFrom.title)+'</title><style>body{font-family:Georgia,serif;max-width:720px;margin:60px auto;padding:0 32px;line-height:1.65;color:#222}h1{font-size:40px}pre{font:19px/1.75 Georgia,serif;white-space:pre-wrap;overflow-wrap:anywhere}footer{border-top:1px solid #999;margin-top:50px;font-size:12px}@page{size:6in 9in;margin:.7in}@media print{body{margin:0;padding:0}footer{break-inside:avoid}}</style></head><body>'+
  '<header><h1>'+escapeHtml(p.createdFrom.title)+'</h1><p>PRIVATE PRINT PROOF / NOT PUBLISHED</p></header><main><pre>'+escapeHtml(text)+'</pre></main>'+
  '<footer>Source: THREE BELLS · user-chosen draft · LemonPRESS admission pending · Rights to share must be reviewed.</footer></body></html>';
writeFileSync(join(out,"work-manifest.json"),JSON.stringify(p.nativeContract,null,2)+"\n");
writeFileSync(join(out,"source.md"),"# "+p.createdFrom.title+"\n\n"+text+"\n\n"+p.createdFrom.note+"\n");
writeFileSync(join(out,"edition.html"),html+"\n");
writeFileSync(join(out,"wrench-preparation.json"),JSON.stringify({
  schema:"abundent/timeback-press-preparation/v1",sourceOwner:OWNERS.lemonpress.repo,
  sourceCommit:OWNERS.lemonpress.commit,manifestStatus:"forming",admission:"pending",
  published:false,rightsEstablished:false,wrench:p.wrenched
},null,2)+"\n");
process.stdout.write(JSON.stringify({schema:"abundent/timeback-press-result/v1",
  result:"PRIVATE_PRINT_PROOF_ONLY",sourceOwner:OWNERS.lemonpress.repo,sourceCommit:OWNERS.lemonpress.commit,
  files:["work-manifest.json","source.md","edition.html","wrench-preparation.json"],
  published:false},null,2)+"\n");
