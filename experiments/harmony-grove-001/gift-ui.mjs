import {wrapGift,inspectGift,composeReturn} from './gift.mjs';
const $=id=>document.getElementById(id);
let currentPacket=null,exportBundle=null,imported=null;
const announce=(id,message)=>{$(id).textContent=message;};
const download=(value,name)=>{
  const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)+'\n'],{type:'application/json'}));
  const anchor=document.createElement('a');anchor.href=url;anchor.download=name;anchor.click();
  setTimeout(()=>URL.revokeObjectURL(url),3000);
};
const resetExport=()=>{exportBundle=null;$('export-gift').disabled=true;$('export-preview').hidden=true;};
document.addEventListener('grove:packet-cleared',()=>{currentPacket=null;resetExport();announce('gift-status','Compose a seed before wrapping a gift.');});
document.addEventListener('grove:packet-ready',event=>{
  currentPacket=event.detail.packet;resetExport();announce('gift-status','Seed ready. Choose whether it may be remixed, then explicitly prepare an export.');
});
$('gift-form').addEventListener('submit',async event=>{
  event.preventDefault();resetExport();
  if(!currentPacket){announce('gift-status','HOLD: compose a seed at the first station.');return;}
  if(!$('export-consent').checked){announce('gift-status','HOLD: approve the full-text export first.');return;}
  try{
    exportBundle=await wrapGift(currentPacket,Object.fromEntries(new FormData(event.currentTarget).entries()));
    $('export-preview').textContent=JSON.stringify({creator:exportBundle.gift.creator,message:exportBundle.gift.message,
      permission:exportBundle.gift.permission,sourceText:exportBundle.gift.seedPacket.seed.origin.fragment,
      origin:exportBundle.gift.seedPacket.seed.origin,checksum:exportBundle.checksum.value},null,2);
    $('export-preview').hidden=false;$('export-gift').disabled=false;
    announce('gift-status','Local parcel prepared. No one else has received it; download and hand it over yourself.');
  }catch(err){announce('gift-status','HOLD: '+err.message);}
});
$('export-gift').addEventListener('click',()=>{
  if(!exportBundle)return;
  download(exportBundle,'abundent-giving-tree-gift.json');
  announce('gift-status','Parcel downloaded. Sharing it with a person is a separate choice.');
});
$('pickup-file').addEventListener('change',async event=>{
  imported=null;$('remix-submit').disabled=true;$('gift-inspection').hidden=true;
  const file=event.currentTarget.files?.[0];if(!file){announce('pickup-status','Choose a local gift parcel to inspect.');return;}
  if(file.size>32768){announce('pickup-status','HOLD: parcel exceeds 32 KB.');return;}
  try{
    const raw=await file.text();imported=await inspectGift(JSON.parse(raw));
    const gift=imported.gift;
    $('gift-inspection').replaceChildren();
    for(const [name,value] of Object.entries({
      'Gift by':gift.creator,'Message':gift.message||'(no note)',
      'Seed':gift.seedPacket.seed.title,'Source fragment':gift.seedPacket.seed.origin.fragment,
      'Invitation':gift.permission,'Declared origin':gift.originAuthority,
      'Gift checksum':imported.giftSha256,'Prior gift':gift.parentGiftSha256||'(first gift)',
      'Status':'Local checksum matches. Identity and rights UNVERIFIED; no delivery inferred.'
    })){
      const term=document.createElement('dt');term.textContent=name;const description=document.createElement('dd');description.textContent=value;
      $('gift-inspection').append(term,description);
    }
    $('gift-inspection').hidden=false;$('remix-submit').disabled=!imported.canRemix;
    announce('pickup-status',imported.canRemix?'Locally intact; sender declares remix is invited. Add your own sentence to continue.':'Locally intact. This parcel is for viewing, not remixing; sender permission or provenance is insufficient.');
  }catch(err){imported=null;announce('pickup-status','HOLD: cannot trust this parcel as intact ('+err.message+').');}
});
$('remix-form').addEventListener('submit',event=>{
  event.preventDefault();
  try{
    if(!imported)throw Error('NO_INSPECTED_GIFT');
    const child=composeReturn(imported,Object.fromEntries(new FormData(event.currentTarget).entries()));
    document.dispatchEvent(new CustomEvent('grove:remix',{detail:{seed:child}}));
    announce('pickup-status','Your return seed is in the workbench above. Its lineage references the gift you inspected. Wrap it to pass it on; that step remains optional.');
    $('result').scrollIntoView({behavior:'auto',block:'start'});
  }catch(err){announce('pickup-status','HOLD: '+err.message);}
});
