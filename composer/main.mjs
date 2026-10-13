import {getNode,neighbors,relation,newSeed,makeScore,validate,invitation} from "./model.mjs";
const $=id=>document.getElementById(id);
const orbit=$("orbit"),center=$("center"),paths=$("paths");
const positions=[
  [18,21],[50,11],[80,22],[87,52],[77,83],[43,88],[13,63]
];
let walk=[], seeds=[], page=0, lastScore=null;
function part(tag,className,value){
  const el=document.createElement(tag);
  if(className)el.className=className;
  if(value!==undefined)el.textContent=value;
  return el;
}
function status(message){$("status").textContent=message;}
function selected(){return getNode(walk[walk.length-1],seeds);}
function startOver(){
  walk=[]; seeds=[]; page=0; lastScore=null;
  $("seed-form").reset(); $("visitor-note").value="";
  $("result").hidden=true; status("A new empty field. No account, storage, or remote action.");
  render();
}
function move(id){
  const from=walk.at(-1)||null;
  if(!relation(from,id,seeds)) {status("That crossing is not offered from here.");return;}
  if(walk.length>=64){status("This score has reached its 64-move limit. Fold it first.");return;}
  walk.push(id); page=0; lastScore=null;
  $("result").hidden=true; status("");
  render();
}
function lineTo(x,y,i){
  const path=document.createElementNS("http://www.w3.org/2000/svg","path");
  const tx=x*10,ty=y*6;
  const bend=((i%2)?1:-1)*70;
  path.setAttribute("d","M 500 300 Q "+(500+bend)+" "+((300+ty)/2)+" "+tx+" "+ty);
  paths.append(path);
}
function renderField(){
  orbit.replaceChildren();paths.replaceChildren();
  const current=selected();
  center.replaceChildren(
    part("span","center-ornament","✳"),
    part("span","center-kind",current?(current.kind==="seed"?"A NEW PARTICULAR":current.kind==="song"?"A RECORDING":"A LISTENING LETTER"):"AN OPEN FIELD"),
    part("strong","",current?current.title:"Where shall we arrive?"),
    part("span","center-aside",current?(current.kind==="seed"?"A little world you planted.":"Touch a nearby door. The line changes."):
      "Every arrival changes the score.")
  );
  const possible=neighbors(current?.id||null,seeds);
  const pageSize=current?6:7;
  const numPages=Math.ceil(possible.length/pageSize);
  if(page>=numPages)page=0;
  const view=possible.slice(page*pageSize,(page+1)*pageSize);
  view.forEach((id,i)=>{
    const n=getNode(id,seeds),[x,y]=positions[i];
    lineTo(x,y,i);
    const btn=part("button","satellite "+n.kind);
    btn.type="button";
    btn.style.setProperty("--x",x+"%");
    btn.style.setProperty("--y",y+"%");
    btn.style.setProperty("--delay",(-.7*i)+"s");
    btn.setAttribute("aria-label","Arrive at "+n.title+(n.kind==="song"?", recording":", "+n.kind));
    btn.append(part("span","satellite-index",n.kind==="letter"?"LETTER "+String(n.order).padStart(2,"0"):n.kind==="song"?"SONG / LISTEN":"NEW / YOURS"));
    btn.append(part("span","satellite-name",n.title));
    btn.addEventListener("click",()=>move(id));
    orbit.append(btn);
  });
  if(numPages>1){
    const [x,y]=positions[6];
    const btn=part("button","satellite cycle");
    btn.type="button";btn.style.setProperty("--x",x+"%");btn.style.setProperty("--y",y+"%");
    btn.append(part("span","satellite-index","OTHER NEARBY DOORS"));
    btn.append(part("span","satellite-name","Turn the field ↻"));
    btn.addEventListener("click",()=>{page=(page+1)%numPages;renderField();});
    orbit.append(btn);
  }
  $("field-state").textContent=current?"ARRIVED / "+current.kind.toUpperCase():"UNPLAYED";
  $("step-count").textContent=walk.length+" "+(walk.length===1?"move":"moves");
}
function renderParticular(){
  const n=selected(), plant=$("plant-panel"), link=$("source-link");
  plant.hidden=!n;
  if(!n){
    $("kind-label").textContent="NOTHING YET";
    $("selected-heading").textContent="A particular is waiting.";
    $("selected-question").textContent="You don't need an account or a destination. Begin with any listening letter.";
    $("source-description").textContent="The published songs are material. A new relationship is only a proposal until made.";
    link.href="https://abundent.org/week/"; link.textContent="Read the source letters ↗";link.hidden=false;
    return;
  }
  $("kind-label").textContent=n.kind.toUpperCase();
  $("selected-heading").textContent=n.title;
  const from=walk.length>1?walk[walk.length-2]:null;
  const arrived=relation(from,n.id,seeds);
  if(n.kind==="letter"){
    $("selected-question").textContent=n.question;
    $("source-description").textContent="SOURCE-REPORTED · Listening letter "+n.order+" of 7. The two songs shown nearby are its published pair. "+(arrived==="suggested-letter-walk"?"The walk from the previous letter is editorial navigation, not historical causation.":"");
    link.href=n.source;link.textContent="Read this listening letter ↗";link.hidden=false;
  }else if(n.kind==="song"){
    $("selected-question").textContent="Listen, or follow the line into the next particular.";
    $("source-description").textContent="SOURCE-REPORTED · Recording linked by its published listening letter. Paired membership is documented; any story beyond that remains an interpretation.";
    link.href=n.source;link.textContent="Hear this actual recording ↗";link.hidden=false;
  }else{
    $("selected-question").textContent=n.phrase||"You brought this particular into being.";
    $("source-description").textContent="VISITOR-AUTHORED · Born in this browser. Not verified, uploaded, published, or admitted into another world.";
    link.hidden=true;
  }
}
function renderTrail(){
  const list=$("trail");list.replaceChildren();
  if(!walk.length){list.append(part("li","empty-trail","Nothing carried yet. Touch the field."));return;}
  walk.forEach((id,i)=>{
    const n=getNode(id,seeds);
    const li=part("li",n.kind==="seed"?"seed-step":"",n.title);
    li.title=(i===0?"Chosen entry":relation(walk[i-1],id,seeds).replaceAll("-"," "));
    list.append(li);
  });
}
function render(){renderField();renderParticular();renderTrail();$("undo").disabled=!walk.length;}
function showScore(){
  try{
    lastScore=makeScore(walk,seeds,$("visitor-note").value);
    $("invitation").textContent=invitation(lastScore);
    $("result").hidden=false;
    status("An unsigned score was composed locally. Nothing has been sent or published.");
    $("result").scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth",block:"nearest"});
  }catch(e){status(e.message);}
}
$("seed-form").addEventListener("submit",event=>{
  event.preventDefault();
  try{
    if(!walk.length)throw Error("First arrive somewhere.");
    if(walk.length>=64)throw Error("Fold this score before adding more moves.");
    const seed=newSeed(walk.at(-1),$("seed-title").value,seeds,$("seed-phrase").value);
    seeds.push(seed);
    $("seed-form").reset();
    move(seed.id);
    status("You planted "+seed.title+". It belongs to your local score.");
  }catch(e){status(e.message);}
});
$("fold-button").addEventListener("click",showScore);
$("undo").addEventListener("click",()=>{
  if(!walk.length)return;
  walk.pop();page=0;lastScore=null;$("result").hidden=true;
  render();status("One move undone. Your planted particulars remain in this session.");
});
$("clear").addEventListener("click",startOver);
$("unplay").addEventListener("click",startOver);
$("visitor-note").addEventListener("input",()=>{lastScore=null;$("result").hidden=true;});
$("copy").addEventListener("click",async()=>{
  if(!lastScore){status("Fold the path again before copying.");return;}
  try{
    if(!navigator.clipboard?.writeText)throw Error("Clipboard unavailable");
    await navigator.clipboard.writeText(invitation(lastScore));
    status("Copied the invitation. Sending it is your choice.");
  }catch{status("Clipboard unavailable. You can select the invitation above and copy it manually.");}
});
$("download").addEventListener("click",()=>{
  if(!lastScore){status("Fold the path again before exporting.");return;}
  const blob=new Blob([JSON.stringify(lastScore,null,2)+"\n"],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;a.download="the-field-navigation-score.json";document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  status("Your device received an unsigned score export. The source songs were not copied.");
});
$("import").addEventListener("change",async event=>{
  const file=event.target.files?.[0];if(!file)return;
  try{
    if(file.size>32768)throw Error("Score file exceeds the 32 KB import limit.");
    const data=JSON.parse(await file.text());
    const imported=validate(data);
    walk=imported.path;seeds=imported.seeds;page=0;lastScore=null;
    $("visitor-note").value=imported.note;
    $("result").hidden=true;render();showScore();
    status("Unfolded a visitor's unsigned score. Built-in source links were reconstructed locally, not authenticated remotely.");
  }catch(e){status("Could not unfold that score: "+e.message);}
  finally{event.target.value="";}
});
render();