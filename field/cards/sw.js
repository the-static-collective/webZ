const CACHE="abundent-field-002-v1";
const FILES=["./","./index.html","./style.css","./seed.mjs","./core.mjs","./app.mjs","./vendor/qrcode.min.js"];
self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting()));});
self.addEventListener("activate",event=>{event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith("abundent-field-")&&key!==CACHE).map(key=>caches.delete(key)))),self.clients.claim()]));});
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const url=new URL(event.request.url);if(url.origin!==self.location.origin||!url.pathname.startsWith(new URL(self.registration.scope).pathname))return;
  if(event.request.mode==="navigate")event.respondWith(fetch(event.request).catch(()=>caches.match("./index.html")));
  else event.respondWith(caches.match(event.request,{ignoreSearch:true}).then(hit=>hit||fetch(event.request)));
});
