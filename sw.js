// Cache only the fixed public portal, never imports, proposals, APIs or arbitrary requests.
const root=new URL('./',self.location.href),name='webz-offline-001:'+root.pathname;
const paths=['','index.html','worlds/sanctuary/','worlds/orchard/','porch/','proof/','app/ui.mjs','app/model.mjs','app/proof.mjs','app/style.css','evidence/public-simulation.json'];
const urls=paths.map(p=>new URL(p,root).href);
self.addEventListener('install',event=>event.waitUntil(caches.open(name).then(c=>c.addAll(urls)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||!urls.includes(event.request.url))return;
 event.respondWith(fetch(event.request).catch(()=>caches.open(name).then(c=>c.match(event.request))));
});
