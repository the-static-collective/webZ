// Shared static shell registration. No visitor input enters the asset cache.
const base=new URL('../',import.meta.url);
const status=value=>{const el=document.getElementById('offline-state');if(el)el.textContent=value;};
if('serviceWorker' in navigator){
 navigator.serviceWorker.getRegistration(base.href)
  .then(existing=>existing&&!navigator.onLine?existing:navigator.serviceWorker.register(new URL('sw.js',base),{scope:base.pathname,updateViaCache:'none'}).catch(error=>{if(existing?.active)return existing;throw error;}))
  .then(()=>navigator.serviceWorker.ready).then(()=>{
   document.documentElement.dataset.offlineReady='true';status(navigator.onLine?'OFFLINE READY':'OFFLINE');
  }).catch(()=>status('CACHE UNAVAILABLE'));
 window.addEventListener('offline',()=>status('OFFLINE'));window.addEventListener('online',()=>status('OFFLINE READY'));
}
