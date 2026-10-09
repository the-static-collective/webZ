// Generated fixed public shell. Run npm run field:build after any cached asset change.
const root=new URL('./',self.location.href),prefix='webz-static:'+root.pathname+':',name=prefix+'761c5d6e67e76d194e5189a1b2fd02eebbb500c4e0a73f28ea0f832febd8ad3c';
const paths=["","index.html","404.html","manifest.webmanifest","worlds/sanctuary/","worlds/orchard/","porch/","press/","proof/","field/","field/public-field.json","field/public-field.schema.json","field/source-observations.json","field/public-field-receipt.json","app/ui.mjs","app/model.mjs","app/press.mjs","app/proof.mjs","app/shell.mjs","app/style.css","app/icon.svg","app/icon-192.png","app/icon-512.png","evidence/public-simulation.json"];
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
 if(event.request.method!=='GET'||!urls.includes(event.request.url))return;
 event.respondWith(caches.open(name).then(cache=>cache.match(event.request)).then(cached=>cached||fetch(event.request)));
});
