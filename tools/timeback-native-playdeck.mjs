#!/usr/bin/env node
// TIMEBACK-CREATIVE-001: human-explicit local source PlayDeck adapter.
// The browser never invokes this. The native command executes the ORIGINAL PlayDeck CLI.
import {readFileSync,writeFileSync,existsSync,mkdirSync} from "node:fs";
import {spawnSync} from "node:child_process";
import {createHash} from "node:crypto";
import {resolve,join} from "node:path";
import {verifyCreativeCarry,OWNERS} from "../apps/arcade/source-carry.mjs";

function refuse(message){console.error("HOLD — "+message);process.exit(1);}
function argumentsOf(argv){
  const o={render:false};
  for(let i=0;i<argv.length;i++){
    if(argv[i]==="--render"){o.render=true;continue;}
    if(["--packet","--playdeck","--images","--audio","--out"].includes(argv[i])){
      if(!argv[i+1]||argv[i+1].startsWith("--"))refuse("Missing value for "+argv[i]);
      o[argv[i].slice(2)]=argv[++i];continue;
    }
    refuse("Unknown argument "+argv[i]);
  }
  for(const k of ["packet","playdeck","images","audio","out"])if(!o[k])refuse("Missing explicit --"+k);
  return o;
}
const args=argumentsOf(process.argv.slice(2));
const playdeck=resolve(args.playdeck),out=resolve(args.out);
const images=resolve(args.images),audio=resolve(args.audio);
let raw,packet;
try{
  raw=readFileSync(resolve(args.packet),"utf8");
  if(raw.length>25000)refuse("Packet exceeds safe review bound.");
  packet=JSON.parse(raw);
}catch{refuse("Cannot read exact, well-formed packet.");}
if(!verifyCreativeCarry(packet)||packet.lane!=="playdeck")refuse("Packet is invalid, changed, or not a PlayDeck preparation.");
if(packet.owner.commit!==OWNERS.playdeck.commit)refuse("Source identity changed.");
if(!existsSync(images)||!existsSync(audio))refuse("Supply your own authorized image folder and audio file.");
if(out===playdeck||out===images||out===audio||out.startsWith(playdeck+"/packages/"))refuse("Output must be separate from source inputs.");
const git=spawnSync("git",["rev-parse","HEAD"],{cwd:playdeck,encoding:"utf8",timeout:15000,shell:false});
if(git.status!==0||git.stdout.trim()!==OWNERS.playdeck.commit)refuse("PlayDeck source must be checked out at the exact reviewed commit.");
const source=spawnSync("git",["status","--porcelain","--untracked-files=no","--","packages","package.json"],{cwd:playdeck,encoding:"utf8",timeout:15000,shell:false});
if(source.status!==0||source.stdout.trim())refuse("PlayDeck tracked source has uncommitted modifications (installed dependencies may be untracked).");
const bin=join(playdeck,"packages","cli","bin","playdeck.mjs");
if(!existsSync(bin)||!existsSync(join(playdeck,"node_modules",".bin","tsx")))
  refuse("Install PlayDeck dependencies locally first with npm install.");
mkdirSync(out,{recursive:true});
const id="timeback-"+packet.createdFrom.id;
const command=[bin,images,audio,"--id",id,"--out",out,"--title",packet.createdFrom.title,"--fps","24","--width","640","--height","360"];
if(!args.render)command.push("--no-render");
const done=spawnSync("node",command,{cwd:playdeck,encoding:"utf8",timeout:args.render?600000:120000,maxBuffer:5*1024*1024,shell:false});
if(done.error||done.status!==0){console.error(done.stderr?.slice(-3000)||done.error?.message||"PlayDeck source execution failed.");refuse("No successful source operator output.");}
for(const filename of ["deck.json","track.json","world-rule.json","plan.json","receipt.projected.json"]){
  if(!existsSync(join(out,filename)))refuse("Original PlayDeck did not produce "+filename);
}
const plan=JSON.parse(readFileSync(join(out,"plan.json"),"utf8"));
const projected=JSON.parse(readFileSync(join(out,"receipt.projected.json"),"utf8"));
if(!Array.isArray(plan.events)||!plan.events.length||!projected)refuse("Invalid source-owned plan or projected receipt.");
const renderedFile=join(out,"receipt.rendered.json"),videoFile=join(out,"final.mp4");
if(args.render ? (!existsSync(videoFile)||!existsSync(renderedFile)): (existsSync(videoFile)||existsSync(renderedFile)))
  refuse("Render-vs-projection contract mismatch.");
const trace={
  schema:"abundent/timeback-native-playdeck-result/v1",
  mode:args.render?"RENDERED_VIDEO_ON_OPERATOR_DEVICE":"NO_RENDER_ONLY_PROJECTION",
  sourceOwner:OWNERS.playdeck.repo,sourceCommit:OWNERS.playdeck.commit,
  packetSha256:createHash("sha256").update(raw).digest("hex"),
  sourceCard:packet.createdFrom.id,permission:"Human operator supplied their own assets; rights not independently verified.",
  planEvents:plan.events.length,
  outputFiles:args.render?["plan.json","receipt.projected.json","receipt.rendered.json","final.mp4"]:["plan.json","receipt.projected.json"],
  authoritativeReceipt:args.render?"receipt.rendered.json":"receipt.projected.json",
  caution:args.render?"Rendered video is not third-party publication or external consent.":"Projection is not a video and is not inheritable rendered evidence."
};
writeFileSync(join(out,"timeback-native-result.json"),JSON.stringify(trace,null,2)+"\n");
process.stdout.write(JSON.stringify(trace,null,2)+"\n");
