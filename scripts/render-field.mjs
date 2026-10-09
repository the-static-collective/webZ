import {createHash} from 'node:crypto';
export const escape = s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const e=escape;
const names={LIVE:'Public service evidenced',LOCAL_ONLY:'Local world',INSPECTABLE:'Inspection only',PROPOSAL_ONLY:'Proposal only',HOLD:'HOLD · intentional pause',NOT_CONNECTED:'Not connected',EXPERIMENTAL:'Experimental source'};
const effect={LOCAL_NAVIGATION:'Local navigation',LOCAL_COMPUTE:'Local computation',LOCAL_PROPOSAL:'Local proposal',PROOF_INSPECTION:'Proof inspection',EXTERNAL_NAVIGATION:'External navigation',REMOTE_EFFECT:'Remote effect · closed'};
function door(d){
 const available=d.availability==='AVAILABLE', external=d.effectClass==='EXTERNAL_NAVIGATION';
 const link=available?`<a class="button${external?' external':''}" href="${e(external?d.target:'../'+d.target)}"${external?' rel="noreferrer noopener"':''}>${e(d.label)}${external?' ↗':''}</a>`:`<h4>${e(d.label)}</h4><span class="door-state">${e(d.availability==='HOLD'?'HOLD · not available yet':d.availability.replace('_',' '))}</span>`;
 return `<li class="field-door ${available?'open-door':'held-door'}">${link}<p class="fine">${e(effect[d.effectClass])} · Owned by ${e(d.owner)}</p><p>${e(d.reason)}</p>${available?'':`<p><strong>Next authority:</strong> ${e(d.requiredNextAuthority)}</p>`}</li>`;
}
function source(s,observations){
 const o=observations.sources.find(x=>x.repository===s.repository&&x.exactCommit===s.exactCommit);
 return `<div class="source-pin"><h4>${e(o.experiment)}</h4><dl><dt>Repository</dt><dd>${e(s.repository)}</dd><dt>Observed from</dt><dd><a href="${e(o.url)}" rel="noreferrer noopener">PR #${o.pr} ↗</a> · ${e(s.ref)}</dd><dt>Exact commit</dt><dd class="hash">${e(s.exactCommit)}</dd><dt>Observed claim</dt><dd>${e(s.observedContract)}</dd><dt>Not claimed</dt><dd>${o.notClaimed.map(e).join(' · ')}</dd><dt>Read at this commit</dt><dd>${o.reviewedFiles.map(f=>`<a href="https://github.com/${e(s.repository)}/blob/${s.exactCommit}/${e(f.path)}" rel="noreferrer noopener">${e(f.path)} ↗</a>`).join('<br>')}</dd></dl></div>`;
}
export function renderField(field,observations,receipt){
 const cards=field.worlds.map(w=>`<article class="field-card" id="${e(w.id)}" aria-labelledby="${e(w.id)}-label"><div class="card-top"><span class="eyebrow">${e(w.category)}</span><span class="field-state">${e(names[w.state])}</span></div><h2 id="${e(w.id)}-label">${e(w.label)}</h2><p class="description">${e(w.shortDescription)}</p><dl class="card-facts"><dt>Owned by</dt><dd>${e(w.ownerSystem)}</dd><dt>Current</dt><dd>${e(w.current)}</dd></dl><h3>What you can do now</h3>${w.doors.some(d=>d.availability==='AVAILABLE')?`<ul class="field-doors">${w.doors.filter(d=>d.availability==='AVAILABLE').map(door).join('')}</ul>`:'<p>Read this observation. No action is available.</p>'}<h3>What stays closed</h3>${w.doors.some(d=>d.availability!=='AVAILABLE')?`<ul class="field-doors">${w.doors.filter(d=>d.availability!=='AVAILABLE').map(door).join('')}</ul>`:''}<p>${e(w.authoritySummary)}</p><p class="next-gate"><strong>Next gate:</strong> ${e(w.nextGate)}</p><details class="provenance"><summary>Where this claim came from</summary><p>${e(w.authoritySummary)}</p>${[w.source,...w.additionalSources].map(s=>source(s,observations)).join('')}<p class="fine">${w.laws.map(e).join('<br>')}</p></details></article>`).join('');
 const relations=field.relations.map(r=>`<li><a href="#${e(r.from)}">${e(field.worlds.find(w=>w.id===r.from).label)}</a> <span>${e(r.kind)}</span> <a href="#${e(r.to)}">${e(field.worlds.find(w=>w.id===r.to).label)}</a><p>${e(r.description)}</p></li>`).join('');
 return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#142523"><meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'"><title>The public field · webZ</title><link rel="manifest" href="../manifest.webmanifest"><link rel="icon" href="../app/icon.svg" type="image/svg+xml"><link rel="stylesheet" href="../app/style.css"><script type="module" src="../app/shell.mjs"></script></head>
<body data-page="field"><a class="skip" href="#main">Skip to content</a><header><a class="brand" href="../">web<span>Z</span><small>A WEB OF WORLDS</small></a><nav aria-label="Public surfaces"><a href="../">Porch home</a><a href="./" aria-current="page">Public field</a><a href="../press/">Bring one thing</a><span class="offline" id="offline-state">LOCAL FIRST</span></nav></header>
<main id="main"><section class="intro field-intro"><div class="eyebrow">THE STATIC COLLECTIVE / PUBLIC FIELD</div><h1>See what’s<br>growing.</h1><p class="lede">The web is a porch,<br>not the house.</p><p>A few worlds, their owners, and their doors. Some you can enter here. Some you can only inspect. Every closed door has a reason.</p><p>These are committed observations from ${e(field.observedOn)}, not a live availability monitor. No public service deployment is claimed.</p><nav class="field-index" aria-label="Find a world">${field.worlds.map(w=>`<a href="#${e(w.id)}">${e(w.label)}</a>`).join('')}</nav></section><aside class="field-key" aria-label="Understanding closed doors"><h2>A pause has a meaning.</h2><p><strong>HOLD</strong> — a required owner or evidence gate is missing. <strong>Not yet</strong> — a path is not implemented. <strong>Unknown</strong> — availability has not been established. <strong>No</strong> — a scoped refusal. None of these means the website is broken.</p><p>Visible door ≠ authority. A site link opens that owner’s site; it grants no integration rights.</p></aside><section class="field-grid" aria-label="Founding worlds">${cards}</section><section class="field-relations"><h2>Neighbors, not one house.</h2><p>CANNON can observe relationships. Each world keeps its own authority.</p><ul>${relations}</ul><details><summary>Founding laws & field integrity</summary><p>The receipt authorizes nothing. Its hash detects changes to this committed manifest; it authenticates neither operators nor machines.</p><p class="hash">Field hash: ${receipt.fieldHash}</p><p><a href="public-field.json">Read the manifest</a> · <a href="source-observations.json">Read the source observations</a> · <a href="public-field-receipt.json">Read the receipt</a></p><ul>${field.laws.map(l=>`<li>${e(l)}</li>`).join('')}</ul></details></section></main><footer><span>RELATION ≠ AUTHORITY. HOLD ≠ FAILURE.</span><span>webZ · STATIC-WEB-001 / DEPLOYABLE ≠ DEPLOYED</span></footer></body></html>
`;
}
export const STATIC_PATHS=['','index.html','404.html','manifest.webmanifest','worlds/sanctuary/','worlds/orchard/','porch/','press/','proof/','field/','field/public-field.json','field/public-field.schema.json','field/source-observations.json','field/public-field-receipt.json','app/ui.mjs','app/model.mjs','app/press.mjs','app/proof.mjs','app/shell.mjs','app/style.css','app/icon.svg','app/icon-192.png','app/icon-512.png','evidence/public-simulation.json'];
export function assetVersion(assets){
 const h=createHash('sha256');for(const [path,bytes] of assets){h.update(path+'\0');h.update(bytes);h.update('\0');}return h.digest('hex');
}
// Worker-contract changes also need a new cache: a failed new installation must
// never delete the cache still used by the old active worker.
export function workerVersion(assets){return assetVersion([...assets,['sw-contract',Buffer.from(renderWorker('contract'))]]);}
export function renderWorker(version){return `// Generated fixed public shell. Run npm run field:build after any cached asset change.
const root=new URL('./',self.location.href),prefix='webz-static:'+root.pathname+':',name=prefix+'${version}';
const paths=${JSON.stringify(STATIC_PATHS)};
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
`;}
