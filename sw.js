// Generated fixed public shell. Run npm run field:build after any cached asset change.
const root=new URL('./',self.location.href),prefix='webz-static:'+root.pathname+':',name=prefix+'31a1adf069be275114a4f581765e88397d12bfa82a507f0631e92502e4d807ac';
const paths=["","index.html","404.html","manifest.webmanifest","worlds/sanctuary/","worlds/orchard/","porch/","press/","proof/","field/","field/public-field.json","field/public-field.schema.json","field/source-observations.json","field/public-field-receipt.json","app/ui.mjs","app/model.mjs","app/press.mjs","app/proof.mjs","app/shell.mjs","app/style.css","app/icon.svg","app/icon-192.png","app/icon-512.png","evidence/public-simulation.json","forage/","forage/index.html","forage/field.css","forage/ui.mjs","forage/bridge.mjs","forage/contracts/scout-core.mjs","forage/contracts/gro-hold.mjs","forage/contracts/stable.mjs","glean/","glean/index.html","glean/ui.mjs","glean/bridge.mjs","glean/contracts/glean-quest.mjs","glean/contracts/stable.mjs","field/navigate/","field/navigate/navigator.css","field/navigate/ui.mjs","field/navigation-provenance.json","app/field.mjs","app/dial.mjs","app/navigator.mjs"];
const urls=paths.map(p=>new URL(p,root).href);
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(name);
 try{for(const url of urls){const response=await fetch(new Request(url,{cache:'reload',credentials:'omit',redirect:'error'}));if(!response.ok)throw Error('STATIC_BOOTSTRAP_FAILED');await cache.put(url,response);}await self.skipWaiting();}
 catch(error){await caches.delete(name);throw error;}
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 for(const key of await caches.keys())if((key.startsWith(prefix)&&key!==name)||key==='webz-offline-001:'+root.pathname)await caches.delete(key);
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 const target=new URL(event.request.url);target.hash='';
 if(event.request.method!=='GET'||!urls.includes(target.href))return;
 event.respondWith(caches.open(name).then(cache=>cache.match(target.href)).then(cached=>cached||fetch(event.request)));
});
