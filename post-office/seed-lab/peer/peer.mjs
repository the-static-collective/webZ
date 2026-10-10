import {verify} from '../seed.mjs';
import {SIGNAL_SCHEMA,WIRE_SCHEMA,MAX_WIRE_BYTES,randomSession,parseSignal,makeSignal,packSeed,parseSeedMessage,receipt,parseReceipt,pairingCode,gatherComplete} from './peer-core.mjs';
const $=id=>document.getElementById(id);
let pc=null,channel=null,role=null,offer=null,answer=null,verifiedSeed=null,accepted=false;
let crossingReceipt=null, sent=false, busy=false, readyCode='';
const text=(id,value)=>{$(id).textContent=value};
function state(value,bad=false){text('status',value);$('status').dataset.error=String(bad)}
function enabled(){
 const open=channel?.readyState==='open';
 $('send').disabled=!(role==='sender'&&open&&readyCode&&verifiedSeed&&!sent);
 $('accept').disabled=!(role==='receiver'&&readyCode&&!accepted);
 $('download').disabled=!verifiedSeed;
 $('receipt-download').disabled=!crossingReceipt;
}
function close(){
 accepted=false;sent=false;crossingReceipt=null;readyCode='';
 if(channel){try{channel.close()}catch{}channel=null}
 if(pc){try{pc.close()}catch{}pc=null}
 role=null;offer=null;answer=null;
 $('signal-out').value='';text('pairing','—');text('peer-state','NOT CONNECTED');
 enabled();
}
const fail=e=>state('HOLD · '+(e?.message||'UNKNOWN_ERROR'),true);
const run=async fn=>{if(busy)return;busy=true;try{await fn()}catch(e){fail(e)}finally{busy=false;enabled()}};
function createPeer(){
 const useStun=$('stun').checked;
 if(!globalThis.RTCPeerConnection)throw Error('WEBRTC_UNAVAILABLE');
 const fresh=new RTCPeerConnection({iceServers:useStun?[{urls:'stun:stun.l.google.com:19302'}]:[]});
 pc=fresh;
 fresh.addEventListener('connectionstatechange',()=>{
  if(pc!==fresh)return;
  text('peer-state',fresh.connectionState.toUpperCase());
  if(['failed','closed','disconnected'].includes(fresh.connectionState))state('HOLD · PEER_'+fresh.connectionState.toUpperCase(),true);
  enabled();
 });
 fresh.addEventListener('datachannel',ev=>{
  if(role!=='receiver'){ev.channel.close();return}
  bindChannel(ev.channel);
 });
}
function bindChannel(c){
 if(c.label!=='abundent-public-seed-v0'||c.protocol!=='abundent/seed/v0'){c.close();throw Error('UNEXPECTED_CHANNEL')}
 channel=c;channel.binaryType='arraybuffer';
 c.addEventListener('open',()=>{state('DIRECT DATA CHANNEL OPEN · COMPARE PAIRING CODE');enabled()});
 c.addEventListener('close',()=>{state('PEER DISCONNECTED');enabled()});
 c.addEventListener('error',()=>state('HOLD · CHANNEL_ERROR',true));
 c.addEventListener('message',async ev=>{
  try{
   if(typeof ev.data!=='string')throw Error('BINARY_NOT_ACCEPTED');
   if(role==='receiver'){
    if(!accepted)throw Error('RECEIVER_CONSENT_REQUIRED');
    const seed=parseSeedMessage(ev.data,offer.session,offer.digest);
    await verify(seed);
    // No cross-session overwrite before human acceptance.
    verifiedSeed=seed;crossingReceipt=receipt(offer.session,seed.digest);
    state('RECEIVED AND VERIFIED · UNSIGNED LOCAL RECEIPT');
    text('received-digest',seed.digest);enabled();
    c.send(JSON.stringify(crossingReceipt));
   }else if(role==='sender'){
    if(!sent)throw Error('UNEXPECTED_RECEIPT');
    crossingReceipt=parseReceipt(ev.data,offer.session,offer.digest);
    state('PEER ACKNOWLEDGED VERIFIED CONTENT · RECEIPT IS UNSIGNED');
   }
  }catch(e){fail(e)}finally{enabled()}
 });
}
async function establishCode(){
 readyCode=await pairingCode(offer,answer);
 text('pairing',readyCode);
 state('COMPARE THIS CODE ON BOTH DEVICES BEFORE APPROVING TRANSFER');
 enabled();
}
$('load').addEventListener('click',()=>run(async()=>{
 const r=await fetch('../seed-000.json',{cache:'no-store'});
 if(!r.ok)throw Error('SEED_000_UNAVAILABLE');
 const raw=await r.text();if(new TextEncoder().encode(raw).length>25000)throw Error('SEED_TOO_LARGE');
 const seed=JSON.parse(raw);await verify(seed);
 verifiedSeed=seed;text('received-digest',seed.digest);state('PUBLIC LETTER 000 VERIFIED · NOT YET SENT');
}));
$('seed-file').addEventListener('change',ev=>run(async()=>{
 const file=ev.target.files?.[0];if(!file)return;
 if(file.size>25000)throw Error('SEED_TOO_LARGE');
 const raw=await file.text();const seed=JSON.parse(raw);await verify(seed);
 verifiedSeed=seed;text('received-digest',seed.digest);state('LOCAL SEED VERIFIED · NOT YET SENT');
 ev.target.value='';
}));
$('offer').addEventListener('click',()=>run(async()=>{
 if(!verifiedSeed)throw Error('SELECT_VERIFIED_SEED_FIRST');
 close();role='sender';createPeer();
 const data=pc.createDataChannel('abundent-public-seed-v0',{ordered:true,protocol:'abundent/seed/v0'});bindChannel(data);
 const d=await pc.createOffer();await pc.setLocalDescription(d);await gatherComplete(pc);
 offer=makeSignal('offer',randomSession(),verifiedSeed.digest,pc.localDescription.sdp);
 $('signal-out').value=JSON.stringify(offer);
 state('OFFER READY · COPY TO RECEIVER BY AN EXPLICIT OUT-OF-BAND METHOD');
}));
$('answer').addEventListener('click',()=>run(async()=>{
 if(!$('receive-consent').checked)throw Error('RECEIVE_CONSENT_REQUIRED');
 const proposed=parseSignal($('signal-in').value.trim(),'offer');
 close();role='receiver';offer=proposed;createPeer();
 await pc.setRemoteDescription({type:'offer',sdp:offer.sdp});
 const d=await pc.createAnswer();await pc.setLocalDescription(d);await gatherComplete(pc);
 answer=makeSignal('answer',offer.session,offer.digest,pc.localDescription.sdp);
 $('signal-out').value=JSON.stringify(answer);
 await establishCode();
 state('ANSWER READY · COPY BACK TO SENDER, THEN COMPARE CODES');
}));
$('complete').addEventListener('click',()=>run(async()=>{
 if(role!=='sender'||!offer||!pc)throw Error('CREATE_OFFER_FIRST');
 const proposed=parseSignal($('signal-in').value.trim(),'answer');
 if(proposed.session!==offer.session||proposed.digest!==offer.digest)throw Error('ANSWER_SESSION_MISMATCH');
 await pc.setRemoteDescription({type:'answer',sdp:proposed.sdp});
 answer=proposed;await establishCode();
}));
$('accept').addEventListener('click',()=>{
 if(role!=='receiver'||!readyCode||!$('compare').checked){state('HOLD · PAIRING_CODE_CONFIRMATION_REQUIRED',true);return}
 accepted=true;state('RECEIVER READY · WAITING FOR ONE VERIFIED PUBLIC SEED');enabled();
});
$('send').addEventListener('click',()=>{
 if(role!=='sender'||!readyCode||!$('compare').checked||!$('send-consent').checked){
  state('HOLD · SEND_AND_CODE_CONSENT_REQUIRED',true);return;
 }
 if(channel?.readyState!=='open'||!verifiedSeed||sent){fail(Error('CHANNEL_NOT_READY'));return}
 try{
  const packet=packSeed(verifiedSeed,offer.session);
  if(new TextEncoder().encode(packet).length>MAX_WIRE_BYTES)throw Error('WIRE_TOO_LARGE');
  channel.send(packet);sent=true;state('SEED SENT DIRECTLY · WAITING FOR VERIFY RECEIPT');enabled();
 }catch(e){fail(e)}
});
$('disconnect').addEventListener('click',()=>{close();state('DISCONNECTED BY LOCAL CHOICE')});
$('download').addEventListener('click',()=>{if(verifiedSeed)download('abundent-verified-seed.json',JSON.stringify(verifiedSeed,null,2)+'\n')});
$('receipt-download').addEventListener('click',()=>{if(crossingReceipt)download('abundent-local-peer-receipt.json',JSON.stringify(crossingReceipt,null,2)+'\n')});
$('copy-out').addEventListener('click',async()=>{
 const raw=$('signal-out').value;if(!raw){fail(Error('NO_SIGNAL_TO_COPY'));return}
 try{await navigator.clipboard.writeText(raw);state('SIGNAL COPIED · SEND ONLY TO THE CHOSEN PEER')}
 catch{state('COPY UNAVAILABLE · SELECT AND MANUALLY COPY THE SIGNAL',true);$('signal-out').focus();$('signal-out').select()}
});
function download(name,content){
 const url=URL.createObjectURL(new Blob([content],{type:'application/json'})),a=document.createElement('a');
 a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),600);
}
addEventListener('pagehide',()=>{if(pc)pc.close()});
enabled();
