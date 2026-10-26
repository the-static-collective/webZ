'use strict';
import {timeline} from './app.mjs';
import {ghostCut,relayInvitation,helperReply} from './provenance.mjs';
const $=id=>document.getElementById(id);
const note=text=>{$('status').textContent=text;};
const privacyMessage="This is a private, user-controlled file. No browser upload occurred; verify who can access your downloads.";

async function copyString(content){
  try{
    if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');
    await navigator.clipboard.writeText(content);
    note('Copied on this device. Nothing was submitted.');
    return true;
  }catch{
    note('Clipboard unavailable. You can select text in the visible message manually.');
    return false;
  }
}
function downloadText(text,filename,mime){
  const blob=new Blob([text],{type:mime});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download=filename;
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),3000);
}
$('export-cut').addEventListener('click',()=>{
  if(!timeline.length){
    $('cut-status').textContent='Add at least one event in Stop repeating the story before preparing a cut.';
    return;
  }
  const cut=ghostCut(timeline);
  downloadText(JSON.stringify(cut,null,2)+'\n','still-here-ghost-cut.json','application/json;charset=utf-8');
  $('cut-status').textContent='Local source cut saved: '+cut.carriers.length+' time-labelled source(s), '+cut.withheld.length+' withheld. No raw allegation, original attachment, or event narrative was included. This cut has NOT yet been validated by Black Star. '+privacyMessage;
  note('Downloaded locally. Native validation must be run separately.');
});
$('copy-command').addEventListener('click',()=>copyString($('native-command').textContent));

function currentInvitation(){
  return relayInvitation($('relay-role').value,$('relay-window').value);
}
$('relay-compose').addEventListener('click',()=>{
  $('relay-output').textContent=currentInvitation();
  note('Private draft prepared, no invitation sent.');
});
$('relay-copy').addEventListener('click',()=>{
  const content=currentInvitation();
  $('relay-output').textContent=content;
  copyString(content);
});
$('relay-share').addEventListener('click',async()=>{
  const content=currentInvitation();
  $('relay-output').textContent=content;
  if(typeof navigator.share!=='function'){
    note('Your browser has no share sheet. Use Copy and choose one trusted recipient.');
    return;
  }
  try{
    await navigator.share({title:'A small request for help',text:content});
    note('Share sheet closed. This page cannot tell whether anybody received or accepted it.');
  }catch(error){
    note(error?.name==='AbortError'?'Share canceled; nothing sent by this page.':'Share failed; use Copy instead.');
  }
});
function currentReply(){return helperReply($('helper-kind').value);}
$('helper-compose').addEventListener('click',()=>{
  $('helper-output').textContent=currentReply();
  note('Reply drafted. No one was automatically recruited.');
});
$('helper-copy').addEventListener('click',()=>{
  const content=currentReply();
  $('helper-output').textContent=content;
  copyString(content);
});
