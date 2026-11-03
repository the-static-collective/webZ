// Cache ONLY the fixed public wallet application. Never cache bearer links,
// exported backups, password forms, private content, or unlisted fetches.
const CACHE="abundent-wallet-public-v2";
const ASSETS=["./","./index.html","./app.mjs","./crypto.mjs","./store.mjs","./handoff.mjs","./wallet.css",\n  "./authority/","./authority/index.html","./authority/authority.css",\n  "./authority/app.mjs","./authority/core.mjs",\n  "./authority/delegation-core.mjs","./authority/store.mjs"];
const SAFE=new Set(ASSETS.map(path=>new URL(path,self.registration.scope).href));
self.addEventListener("install",event=>event.waitUntil(
 caches.open(CACHE).then(cache=>cache.addAll([...SAFE])).then(()=>self.skipWaiting())
));
self.addEventListener("activate",event=>event.waitUntil(self.clients.claim()));
self.addEventListener("fetch",event=>{
 const req=event.request;
 if(req.method!=="GET"||!SAFE.has(req.url))return;
 event.respondWith(fetch(req).catch(()=>caches.match(req)));
});
