import {composeMatterIdeaCraft,verifyMatterIdeaCraft,CRAFT_SOURCES} from './craft-economy.mjs';
const $=id=>document.getElementById(id);
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n};
const add=(parent,tag,text,cls)=>{const n=el(tag,text,cls);parent.append(n);return n};
let last=null,serial=0;
function card(title,items){
 const c=el('article',undefined,'card');add(c,'h3',title);const ul=add(c,'ul');
 for(const [label,value] of items){const li=add(ul,'li');add(li,'strong',label+': ');add(li,'span',String(value))}
 return c;
}
function display(d){
 $('results').replaceChildren(
  card('Physical WOOD (conserved, not verified)',[
   ['Claim',d.economicProjection.material.claimed],['Unsigned observation',d.economicProjection.material.observed],
   ['Recognized spendable',d.economicProjection.material.recognizedSpendable],['Consumed',d.actualEffects.woodBurned],
   ['Outcome','4→ash/heat is only a hypothetical transformation with unknown products'.replace('4',String(d.proposedCrafts[0].proposedInput.count))]]),
  card('Idea (non-rivalrous, may branch)',[
   ['Idea',d.inputs[1].sourceQuestion],['Chosen medium',d.proposedCrafts[1].medium],
   ['Created artifacts',d.economicProjection.cultural.finishedArtifacts],['Licensed uses',d.economicProjection.cultural.licensedUses],
   ['Source consumed','NO'],['Ownership / rights','NOT ESTABLISHED']]),
  card('Human work / PENNY',[
   ['Full Measure Deeds',d.lawfulCrossings.fullMeasure.deeds],['Confirmed capacity',d.lawfulCrossings.fullMeasure.capacity],
   ['PENNY issued',d.economicProjection.penny.issued],['PENNY backed',d.economicProjection.penny.backed],
   ['Review','HOLD – independent witness and custody required']]),
  card('reLATTE / BELT / economic crossing',[
   ['reLATTE',d.lawfulCrossings.reLATTE.status],['Foreign settlement',d.economicProjection.belt.stage],
   ['Automatic NFT mint','NONE'],['Asset use','Candidate only, no licensing or verified custody'],
   ['Content address',d.previewId.slice(0,24)+'…']])
 );
 const marker=add($('results'),'p','Source proposal hash: '+d.previewId,'small');marker.style.gridColumn='1 / -1';
}
async function compose(){
 const serialId=++serial;$('status').textContent='Creating local SHA-256 candidate…';$('export').disabled=true;last=null;
 try{
  const inputs={profileId:'food',topic:$('topic').value,claimedWood:Number($('claimed').value),
   observedWood:Number($('observed').value),proposedBurn:Number($('burn').value),expression:$('medium').value};
  for(const id of ['claimed','observed','burn'])if($(id).value.trim()==='')throw new RangeError('All counts are required');
  const output=await composeMatterIdeaCraft(inputs);
  if(serial!==serialId)return;
  if(!await verifyMatterIdeaCraft(output))throw Error('Unexpected source-address mismatch');
  last=output;display(output);$('export').disabled=false;$('status').textContent='LOCAL HOLD · integrity-addressed · no assets created';
 }catch(error){if(serial!==serialId)return;$('results').replaceChildren();$('status').textContent='HOLD: '+error.message;}
}
$('compose').addEventListener('click',compose);
$('export').addEventListener('click',()=>{
 if(!last)return;
 const blob=new Blob([JSON.stringify(last,null,2)+'\n'],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download='matter-idea-craft-held-proposal.json';
 document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
const labels={grO:'GrO MATTERCRAFT-001 (unmerged)',penny:'PENNY-014 (unmerged)',fullMeasure:'Full Measure',reLATTE:'reLATTE',belt:'THE BELT (economic candidate)',creative:'Harmony culture seeds'};
for(const [key,url] of Object.entries(CRAFT_SOURCES)){
 const c=add($('sources'),'article',undefined,'card');const a=add(c,'a',labels[key]+' ↗');a.href=url;a.rel='noopener noreferrer';a.target='_blank';
}
compose();
