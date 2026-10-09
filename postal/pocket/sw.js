/* webZ postal pocket app-shell only. Never cache signed device artifacts. */
const CACHE="webz-postal-pocket-003-v3";
const ASSETS=["./two-phones.html","./two-phones.css","./two-phones-ui.js","./two-phone-core.js","./vendor/qrgen.min.js","./manifest.webmanifest"];
const scope=self.registration.scope;
const urls=new Set(ASSETS.map(path=>new URL(path,scope).href));
self.addEventListener("install",event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));
 self.skipWaiting();
});
self.addEventListener("activate",event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(
  keys.filter(key=>key.startsWith("webz-postal-pocket-")&&key!==CACHE)
    .map(key=>caches.delete(key))
 )).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",event=>{
 if(event.request.method!=="GET"||!urls.has(event.request.url))return;
 event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request)));
});
