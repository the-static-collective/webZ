// Cache only the fixed public portal, never imports, proposals, APIs or arbitrary requests.
const root=new URL('./',self.location.href),name='webz-offline-001:'+root.pathname;
const paths=['','index.html','worlds/sanctuary/','worlds/orchard/','porch/','proof/','app/ui.mjs','app/model.mjs','app/proof.mjs','app/style.css','evidence/public-simulation.json'];
const urls=paths.map(p=>new URL(p,root).href);
const labPaths=['labs/skymirror/','labs/skymirror/index.html','labs/skymirror/style.css',
  'labs/skymirror/app.mjs','labs/skymirror/protocol.mjs','labs/skymirror/webz-bridge.mjs',
  'app/optical-observation.mjs'];
const labUrls=labPaths.map(p=>new URL(p,root).href);
self.addEventListener('install',event=>event.waitUntil(caches.open(name).then(c=>c.addAll(urls)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 if(urls.includes(event.request.url)){
   event.respondWith(fetch(event.request).catch(()=>caches.open(name).then(c=>c.match(event.request))));
   return;
 }
 // Explicitly visited SKYMIRROR code becomes offline-capable without boot prefetch.
 // Only fixed, public, same-origin assets; no camera readings, observations, messages or file imports.
 if(!labUrls.includes(event.request.url))return;
 event.respondWith(fetch(event.request).then(response=>{
   if(response.ok){
     const copy=response.clone();
     event.waitUntil(caches.open(name).then(c=>c.put(event.request,copy)));
   }
   return response;
 }).catch(()=>caches.open(name).then(c=>c.match(event.request))));
});
