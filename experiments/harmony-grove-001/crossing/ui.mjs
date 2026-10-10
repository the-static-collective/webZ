import {inspectGift} from '../gift.mjs';
import {DIALS,composeCrossing,inspectCrossing,wrapCrossing} from './contract.mjs';
const $=id=>document.getElementById(id);
const node=(tag,text)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;return el;};
let imported=null,crossing=null,newGift=null;
const clearWrap=()=>{newGift=null;$('wrap').disabled=!crossing||!$('gift-consent').checked;$('download-gift').disabled=true;$('wrap-status').textContent='No exported gift prepared.';};
const clearCross=()=>{crossing=null;$('download-crossing').disabled=true;$('evidence').textContent='No evidence yet.';$('panels').replaceChildren(node('p','Nothing composed yet.'));$('result-status').textContent='No crossing prepared.';clearWrap();};
const canCompose=()=>{$('compose').disabled=!(imported?.canRemix&&$('contribution').value.trim());};
const save=(value,name)=>{const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)+'\n'],{type:'application/json'}));const a=node('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),4000);};
for(const d of DIALS){
 const wrap=node('div');wrap.className='knob';const label=node('label');label.htmlFor='dial-'+d.key;
 const name=node('span',d.name),out=node('output','5');out.id='value-'+d.key;label.append(name,out);
 const input=node('input');input.type='range';input.id='dial-'+d.key;input.name=d.key;input.min='0';input.max='10';input.step='1';input.value='5';input.addEventListener('input',()=>{out.textContent=input.value;clearCross();});
 const hint=node('p',d.hint);hint.className='hint';wrap.append(label,input,hint);$('rack').append(wrap);
}
$('gift-file').addEventListener('change',async()=>{
 imported=null;clearCross();canCompose();$('gift-detail').replaceChildren();const f=$('gift-file').files?.[0];
 if(!f){$('import-status').textContent='No gift selected.';return;}
 if(f.size>32768){$('import-status').textContent='HOLD · file exceeds 32 KiB.';return;}
 try{const candidate=JSON.parse(await f.text());const observed=await inspectGift(candidate);
  imported={...observed,bundle:candidate};
  for(const [name,value] of Object.entries({'Title':observed.gift.seedPacket.seed.title,'From':observed.gift.creator,'Gift hash':observed.giftSha256,'Parent gift':observed.gift.parentGiftSha256||'(root)','Remix invitation':observed.gift.permission,'Source declaration':observed.gift.originAuthority,'Content':observed.gift.seedPacket.seed.origin.fragment})){
   $('gift-detail').append(node('dt',name),node('dd',String(value)));
  }
  $('import-status').textContent=observed.canRemix?'Hash checked locally; remix was invited by declaration, not externally authenticated.':'VIEW ONLY · no creative crossing permitted. Sender invitation/provenance does not authorize remixing.';
 }catch(e){$('import-status').textContent='HOLD · '+e.message;}
 canCompose();
});
for(const id of ['title','contribution'])$(id).addEventListener('input',()=>{clearCross();canCompose();});
$('gift-consent').addEventListener('change',clearWrap);
for(const id of ['creator','message','permission'])$(id).addEventListener('input',clearWrap);
$('cross-form').addEventListener('submit',async e=>{
 e.preventDefault();if(!imported?.canRemix)return;clearCross();$('compose-status').textContent='Composing and verifying locally…';
 try{const dials=Object.fromEntries(DIALS.map(d=>[d.key,Number($('dial-'+d.key).value)]));
  crossing=await composeCrossing(imported.bundle,{title:$('title').value,contribution:$('contribution').value,dials});
  const result=await inspectCrossing(crossing);
  $('panels').replaceChildren(...result.seed.panels.map((p,i)=>{
   const box=node('article');box.className='cross-panel';box.append(node('h3',`${i+1}. ${p.beat}`),node('p',p.caption),node('small',p.direction));return box;
  }));
  $('evidence').textContent=JSON.stringify({profile:crossing.body.profile,sourceGiftSha256:crossing.body.sourceGiftSha256,childSha256:crossing.body.child.receipt.seedSha256,localCrossingHash:result.hash,disposition:result.disposition,claims:{signed:false,rightsVerified:false,receiverAdmitted:false,published:false}},null,2);
  $('download-crossing').disabled=false;$('compose-status').textContent='New local descendant prepared.';
  $('result-status').textContent='Replayed and verified locally. A source snapshot, contribution and 11-control instrument are bound to the descendant; no remote effect.';
  clearWrap();
 }catch(err){$('compose-status').textContent='HOLD · '+err.message;clearCross();}
});
$('download-crossing').addEventListener('click',()=>{if(crossing)save(crossing,'abundent-local-crossing.json');});
$('wrap').addEventListener('click',async()=>{
 if(!crossing||!$('gift-consent').checked)return;clearWrap();
 try{const result=await wrapCrossing(crossing,{creator:$('creator').value,message:$('message').value,permission:$('permission').value});
  newGift=result.gift;$('download-gift').disabled=false;
  $('wrap-status').textContent='Local descendant gift prepared. Source references are included. Download remains a distinct choice; publication requires separate human review.';
 }catch(e){$('wrap-status').textContent='HOLD · '+e.message;}
});
$('download-gift').addEventListener('click',()=>{if(newGift)save(newGift,'abundent-descendant-gift.json');});
