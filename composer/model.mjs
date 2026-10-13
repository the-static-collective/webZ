// Abundent Door Composer 001: a portable, read-only relational navigation model.
// Observed membership is not ancestry; a link is not authority; HOLD is not absence.
export const MODES=['porch','field','trace'];
const anchors=[
 ['garden','The garden workbench','workbench','/','A little curiosity; the public workshop.','Abundent','Published site surface'],
 ['field','The public field','field','/field/','Eleven project observations, their owners, and open or held doors.','webZ','Committed field catalog'],
 ['navigator','The 11 × 11 navigator','instrument','/field/navigate/','Tune a bounded public field and choose a closer view.','webZ','Committed field navigator'],
 ['week','a week together','album','/week/','Fourteen recordings and seven listening letters.','The Static Collective','Published album presentation'],
 ['rooms','The listening rooms','room','/music/rooms/','Playlist rooms and exact recording identities.','The Static Collective','Observed playlist snapshot'],
 ['twoday','Before the compilation','album','/music/2day/','Four playlist-albums arranged across a returning day.','The Static Collective','Published editorial presentation'],
 ['welcome','The webZ porch','porch','/welcome/','The web is a porch, not the house.','webZ','Public informational threshold'],
 ['forage','Field Porch · GrO','field','/forage/','Review a held material encounter before offering a limited invitation.','webZ × GrO','Local proposal only'],
 ['glean','The remainder porch','field','/glean/','A steward-offered remainder; no automatic transfer.','webZ × GrO','Local proposal only'],
 ['frontroom','The Front Room','witness','https://the-static-collective.gitbook.io/the-static-collective-docs/','Orientation, source doors, and unresolved questions.','The Static Collective','Orientation, not source authority'],
];
const anchorEdges=[
 ['garden','field','opens'],['garden','week','opens'],['garden','welcome','opens'],['garden','rooms','opens'],
 ['field','navigator','tunes'],['field','forage','opens'],['field','glean','opens'],['field','welcome','opens'],
 ['week','rooms','invites'],['week','twoday','preserves context'],['week','garden','returns'],
 ['welcome','frontroom','orients'],['forage','glean','neighbors'],['rooms','twoday','neighbors']
];
const safeUrl=value=>typeof value==='string'&&((value.startsWith('/')&&!value.startsWith('//'))||/^https:\/\/[a-z0-9.-]+(?:\/|$)/i.test(value))&&!/[\u0000-\u001f]/.test(value);
const asText=value=>typeof value==='string'?value:'';
function assertRecords(field,music){
 if(!field||!Array.isArray(field.worlds)||!Array.isArray(field.relations))throw Error('FIELD_CATALOG_UNAVAILABLE');
 if(!music||!Array.isArray(music.week?.letters)||!Array.isArray(music.rooms))throw Error('MUSIC_CATALOG_UNAVAILABLE');
}
export function buildGraph(field,music){
 assertRecords(field,music);
 const nodes=new Map(),edges=[],edgeKeys=new Set();
 function add(n){
  if(!/^[a-z0-9:_-]{1,100}$/.test(n.id)||!safeUrl(n.url)||nodes.has(n.id))throw Error('INVALID_DOOR_NODE');
  nodes.set(n.id,Object.freeze(n));
 }
 function join(a,b,kind,evidence='curated navigation',source='Abundent Door Composer 001'){
  if(!nodes.has(a)||!nodes.has(b))throw Error('UNKNOWN_RELATION_ENDPOINT');
  const key=[a,b,kind].join('|');if(edgeKeys.has(key))return;
  edgeKeys.add(key);edges.push(Object.freeze({a,b,kind,evidence,source}));
 }
 for(const [id,label,kind,url,description,owner,evidence] of anchors){
  add({id,label,kind,url,description,owner,evidence,claim:'Navigation / observation only',source:'Published Abundent door'});
 }
 for(const [a,b,kind] of anchorEdges)join(a,b,kind);
 const targetMap=new Map(anchors.filter(a=>a[3].startsWith('/')).map(a=>[a[3],a[0]]));
 for(const w of field.worlds){
  if(!/^[a-z0-9-]{1,80}$/.test(w.id))throw Error('INVALID_WORLD_ID');
  const id='world:'+w.id;
  const surface=w.publicSurface?.target;
  const url=typeof surface==='string'&&safeUrl('/'+surface.replace(/^\/+/,''))?'/'+surface.replace(/^\/+/, ''):'/field/#'+encodeURIComponent(w.id);
  const src=w.source||{};
  add({id,label:asText(w.label),kind:'world',url,description:asText(w.shortDescription),owner:asText(w.ownerSystem),evidence:'Field observation · '+asText(field.observedOn),claim:asText(w.state)+' · '+asText(w.authoritySummary),source:asText(src.repository)+' @ '+asText(src.exactCommit)});
  join('field',id,'catalogs','observed field membership','field/public-field.json');
  for(const d of w.doors||[]){
   if(d.availability!=='AVAILABLE'||typeof d.target!=='string')continue;
   const dest=targetMap.get('/'+d.target.replace(/^\/+/,''));if(dest)join(id,dest,'offers link','available navigation only','field/public-field.json');
  }
 }
 for(const r of field.relations){
  const a='world:'+r.from,b='world:'+r.to;
  if(nodes.has(a)&&nodes.has(b))join(a,b,asText(r.kind)||'neighbor','observed field relation',asText(r.source?.repository)+' @ '+asText(r.source?.exactCommit));
 }
 const songs=new Set();
 const song=(item)=>{
  if(!/^[a-f0-9-]{36}$/.test(item?.id||''))return null;
  const id='song:'+item.id;
  if(!songs.has(id)){
   const uri='https://suno.com/song/'+item.id;
   add({id,label:asText(item.title)||'Untitled recording',kind:'song',url:uri,description:'A particular recording, identified by its exact Suno track ID.',owner:'Suno source / Static Collective catalog',evidence:'Bounded source catalog · '+asText(music.observed_on),claim:'Observed placement ≠ remix ancestry',source:'music/rooms/catalog.json · '+item.id});
   songs.add(id);
  }
  return id;
 };
 for(const letter of music.week.letters){
  if(!Number.isInteger(letter.number)||letter.number<1||letter.number>7)throw Error('INVALID_LETTER');
  const id='letter:'+letter.number;
  add({id,label:asText(letter.title),kind:'letter',url:'/week/#letters',description:asText(letter.framing),owner:'The Static Collective',evidence:'Published week letter',claim:asText(letter.question),source:'music/rooms/catalog.json · week letter '+letter.number});
  join('week',id,'contains letter','observed editorial sequence','music/rooms/catalog.json');
  for(const record of letter.songs||[]){const s=song(record);if(s)join(id,s,'presents recording','exact ID membership','music/rooms/catalog.json');}
 }
 for(const room of music.rooms){
  if(!/^[a-z0-9-]{1,90}$/.test(room.id))throw Error('INVALID_ROOM_ID');
  const id='room:'+room.id;
  add({id,label:asText(room.title),kind:'room',url:'/music/rooms/',description:asText(room.subtitle),owner:'The Static Collective',evidence:'Public Suno playlist snapshot · '+asText(room.created_date),claim:'Editorial room ≠ source album or remix parentage',source:'music/rooms/catalog.json · '+asText(room.suno_playlist_id)});
  join('rooms',id,'presents playlist','observed playlist reference','music/rooms/catalog.json');
  for(const record of room.tracks||[]){const s=song(record);if(s)join(id,s,'contains recording','exact ID membership','music/rooms/catalog.json');}
 }
 return {schema:'abundent/door-composer/v1',nodes,edges};
}
export function relations(graph,id){
 if(!graph.nodes.has(id))return [];
 return graph.edges.filter(e=>e.a===id||e.b===id).map(e=>({...e,neighbor:e.a===id?e.b:e.a}));
}
export function compose(graph,id='garden',mode='porch',closer=5){
 if(!graph.nodes.has(id)||!MODES.includes(mode)||!Number.isInteger(closer)||closer<0||closer>10)throw Error('INVALID_COMPOSITION');
 const reached=new Map([[id,0]]),queue=[id];
 while(queue.length){
  const current=queue.shift(),depth=reached.get(current);
  if(depth>=3)continue;
  for(const e of relations(graph,current))if(!reached.has(e.neighbor)){reached.set(e.neighbor,depth+1);queue.push(e.neighbor);}
 }
 const kindRank=(n)=>{
  if(mode==='porch')return ['porch','workbench','room','album','letter','song','field','world','instrument','witness'].indexOf(n.kind);
  if(mode==='field')return ['field','world','instrument','workbench','room','album','song','letter','porch','witness'].indexOf(n.kind);
  return ['witness','world','song','letter','instrument','room','field','album','porch','workbench'].indexOf(n.kind);
 };
 const limit=3+closer;
 const visible=[...reached].filter(([key])=>key!==id).map(([key,distance])=>({node:graph.nodes.get(key),distance}))
 .sort((a,b)=>a.distance-b.distance||kindRank(a.node)-kindRank(b.node)||a.node.label.localeCompare(b.node.label))
 .slice(0,limit);
 const visibleIDs=new Set([id,...visible.map(v=>v.node.id)]);
 return {center:graph.nodes.get(id),visible,links:graph.edges.filter(e=>visibleIDs.has(e.a)&&visibleIDs.has(e.b)),totalReachable:reached.size-1,limit,mode,closer};
}
export function parseAddress(hash,graph){
 const params=new URLSearchParams((hash||'').replace(/^#/,''));
 const id=params.get('door')||'garden',mode=params.get('way')||'porch',val=params.get('closer')??'5';
 const closer=/^(0|[1-9]|10)$/.test(val)?Number(val):5;
 return {id:graph.nodes.has(id)?id:'garden',mode:MODES.includes(mode)?mode:'porch',closer};
}
export function address({id,mode,closer}){
 const p=new URLSearchParams({door:id,way:mode,closer:String(closer)});
 return '#'+p.toString();
}
export function find(graph,query,limit=8){
 const q=asText(query).trim().toLowerCase();
 if(!q)return [];
 return [...graph.nodes.values()].filter(n=>(n.label+' '+n.description+' '+n.owner).toLowerCase().includes(q)).slice(0,limit);
}
