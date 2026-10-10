import {GATEWAY,TURNSTILE_SITE_KEY} from './config.mjs';
import {inspectGift} from '../gift.mjs';
import {GATE_SCHEMA} from './contract.mjs';
const $=id=>document.getElementById(id);
const node=(tag,text,cls)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;};
let proposed=null,withdrawReceipt=null,submissionReceipt=null,challengeToken='';
// Same-origin proxy avoids promoting a third-party receiver implicitly and preserves the existing WebZ CSP.
const endpoint=(()=>{if(!GATEWAY)return null;try{const u=new URL(GATEWAY,location.origin);return u.origin===location.origin?u:null;}catch{return null;}})();
$('gate-state').textContent=endpoint?'Public gate configured; server verification still controls access.':'HOLD — public gateway not configured. This experiment remains local.';
async function call(path,{method='GET',body}={}){
 if(!endpoint)throw Error('GATEWAY_NOT_CONFIGURED');
 const url=new URL(endpoint);url.pathname=url.pathname.replace(/\/$/,'')+path;
 const resp=await fetch(url,{method,headers:{'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
 const data=await resp.json();if(!resp.ok)throw Error(data.error||'GATEWAY_HOLD');return data;
}
$('browse').addEventListener('click',async()=>{
 $('board-status').textContent='Looking only for human-approved gifts…';$('gift-board').replaceChildren();
 try{const result=await call('/gifts');$('board-status').textContent=`${result.gifts.length} reviewed gift(s) on these branches. Permission and origin are self-declared.`;
  for(const g of result.gifts){const card=node('article',undefined,'gift-card');const title=node('h3',g.title);const attribution=node('p',`Offered by ${g.creator} · ${g.permission}`);const paragraph=node('p',g.bundle?.gift?.message||'No accompanying note.');const download=node('button','Carry local JSON');
   download.addEventListener('click',()=>{const blob=new Blob([JSON.stringify(g.bundle,null,2)+'\n'],{type:'application/json'});const href=URL.createObjectURL(blob);const a=node('a');a.href=href;a.download='giving-tree-approved-gift.json';a.click();setTimeout(()=>URL.revokeObjectURL(href),4000);});card.append(title,attribution,paragraph,download);$('gift-board').append(card);}
 }catch(e){$('board-status').textContent='HOLD — '+e.message;}
});
const ready=()=>{$('offer').disabled=!(proposed&&endpoint&&TURNSTILE_SITE_KEY&&challengeToken&&['consent-packet','consent-rights','consent-copies'].every(id=>$(id).checked));};
for(const id of ['consent-packet','consent-rights','consent-copies'])$(id).addEventListener('change',ready);
$('gift-file').addEventListener('change',async()=>{
 proposed=null;ready();const f=$('gift-file').files?.[0];if(!f){$('preview').textContent='No gift selected.';return;}
 if(f.size>32768){$('preview').textContent='HOLD — gift is larger than the 32 KiB boundary.';return;}
 try{const bundle=JSON.parse(await f.text());const proof=await inspectGift(bundle);
  if(proof.gift.originAuthority==='UNKNOWN')throw Error('Origin rights are unknown: review-only, not public publication.');
  proposed=bundle;$('preview').textContent=`${proof.gift.seedPacket.seed.title} · ${proof.gift.creator} · ${proof.gift.permission}. Gift hash ${proof.giftSha256}. Integrity matches; identity and rights have not been independently verified.`;
 }catch(e){$('preview').textContent='HOLD — '+e.message;}ready();
});
async function attachChallenge(){
 if(!endpoint||!TURNSTILE_SITE_KEY)return;
 const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;script.onload=()=>{
  if(!window.turnstile)return;
  $('challenge').replaceChildren();window.turnstile.render('#challenge',{sitekey:TURNSTILE_SITE_KEY,callback:token=>{challengeToken=token;ready();},'expired-callback':()=>{challengeToken='';ready();}});
 };script.onerror=()=>{$('challenge').textContent='HOLD — human verification could not load.';};document.head.append(script);
}
// Third-party challenge is initiated only when the participant chooses a public submission path.
$('gift-file').addEventListener('click',()=>{if(!$('challenge').dataset.attempted){$('challenge').dataset.attempted='1';attachChallenge();}});
$('offer').addEventListener('click',async()=>{
 if($('offer').disabled||!proposed)return;
 $('offer').disabled=true;$('offer-status').textContent='Submitting for private review…';
 try{const response=await call('/submit',{method:'POST',body:{schema:GATE_SCHEMA,bundle:proposed,consent:{publishFullPacket:$('consent-packet').checked,canPublishThisMaterial:$('consent-rights').checked,understandsPublicCopiesPersist:$('consent-copies').checked},challengeToken}});
  submissionReceipt={schema:'webz/giving-tree-withdrawal/v0',id:response.id,digest:response.digest,withdrawalToken:response.withdrawalToken};
  $('save-withdrawal').hidden=false;$('offer-status').textContent='Received for HUMAN REVIEW only. Save your private withdrawal receipt now; it will not be stored by this browser.';
 }catch(e){$('offer-status').textContent='HOLD — '+e.message;}challengeToken='';ready();
});
$('save-withdrawal').addEventListener('click',()=>{
 if(!submissionReceipt)return;const blob=new Blob([JSON.stringify(submissionReceipt,null,2)+'\n'],{type:'application/json'});const href=URL.createObjectURL(blob),a=node('a');a.href=href;a.download='giving-tree-private-withdrawal.json';a.click();setTimeout(()=>URL.revokeObjectURL(href),4000);
});
$('withdraw-file').addEventListener('change',async()=>{
 withdrawReceipt=null;$('withdraw').disabled=true;const f=$('withdraw-file').files?.[0];if(!f||f.size>4096)return;
 try{const data=JSON.parse(await f.text());if(data.schema!=='webz/giving-tree-withdrawal/v0'||!/^([0-9a-f-]{36})$/.test(data.id)||!/^[0-9a-f]{64}$/.test(data.withdrawalToken))throw Error('INVALID_RECEIPT');withdrawReceipt=data;$('withdraw').disabled=!endpoint;$('withdraw-status').textContent='Private withdrawal receipt loaded. No action taken yet.';}catch(e){$('withdraw-status').textContent='HOLD — '+e.message;}
});
$('withdraw').addEventListener('click',async()=>{if(!withdrawReceipt||!endpoint)return;$('withdraw').disabled=true;try{await call('/withdraw',{method:'POST',body:withdrawReceipt});$('withdraw-status').textContent='Removed from future display. Already downloaded copies cannot be recalled.';}catch(e){$('withdraw-status').textContent='HOLD — '+e.message;$('withdraw').disabled=false;}});
