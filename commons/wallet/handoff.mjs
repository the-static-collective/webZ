// Link Wallet 002: explicit, transient same-origin window-to-window handoff.
// NO bearer URL in path, query, fragment, clipboard, storage or network.
import {createEntry} from "./crypto.mjs";
const VERSION="abundent.wallet-handoff/v1",LIFETIME=60000;
export function offerLinkToWallet(draft,walletPath){
  // Validate before any window is opened.
  const verified=createEntry(draft);
  const url=new URL(walletPath,location.href);
  if(url.origin!==location.origin||!url.pathname.endsWith("/commons/wallet/")||
     url.search||url.hash)throw Error("Wallet handoff requires the local trusted wallet page.");
  url.search="?handoff=1"; // marker only, no capability or private link.
  const popup=window.open(url.href,"_blank");
  if(!popup||popup.closed)throw Error("Wallet popup blocked. Open the wallet separately and paste your link yourself.");
  const nonce=Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,"0")).join("");
  const until=Date.now()+LIFETIME;
  let sent=false;
  const entry={title:verified.title,url:verified.url,scope:verified.scope,group:verified.group,note:verified.note};
  const cleanup=()=>{
    clearInterval(timer);window.removeEventListener("message",listener);
    // drop the only callback retaining the private URL
  };
  const listener=event=>{
    if(event.origin!==location.origin||event.source!==popup||
       Date.now()>until||!event.data||event.data.schema!==VERSION)return;
    if(event.data.kind==="READY"&&!sent&&/^[a-f0-9]{32}$/.test(event.data.challenge||"")){
      sent=true;
      popup.postMessage({schema:VERSION,kind:"OFFER",challenge:event.data.challenge,
        nonce,entry},location.origin);
    }else if(event.data.kind==="RECEIVED"&&event.data.nonce===nonce){
      cleanup();
    }
  };
  window.addEventListener("message",listener);
  const timer=setInterval(()=>{if(Date.now()>until||popup.closed)cleanup()},1000);
  return {opened:true,expiresInSeconds:60};
}
