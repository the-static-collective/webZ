// Application SHELL ONLY. Never cache email, private proposals, packets, APIs or cross-origin requests.
const CACHE="abundent-suitcase-shell-001";
const SHELL=["./","./index.html","./app.mjs","./protocol.mjs","./store.mjs","./nodes.mjs","./style.css","./manifest.webmanifest","./icon.svg"];
const urls=new Set(SHELL.map(s=>new URL(s,self.registration.scope).pathname));
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith("abundent-suitcase-shell-")&&key!==CACHE)await caches.delete(key);await self.clients.claim()})()));
self.addEventListener("fetch",event=>{const request=event.request,url=new URL(request.url);if(request.method!=="GET"||url.origin!==self.location.origin||!urls.has(url.pathname)||url.search)return;event.respondWith((async()=>{const cached=await caches.match(request,{ignoreSearch:false});if(cached)return cached;return fetch(request)})())});
