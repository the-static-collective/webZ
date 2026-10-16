import {buildGraph,compose,parseAddress,address,relations,find,MODES} from './model.mjs';
const $=id=>document.getElementById(id);
const make=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const marks={workbench:'✳',field:'❦',gallery:'◉',room:'♫',album:'◉',letter:'✉',song:'♪',porch:'⌂',world:'◇',instrument:'◎',witness:'✎'};
let graph=null,current={id:'garden',mode:'porch',closer:5},trail=[];
function safeLink(url){
 const root=new URL('../',import.meta.url);
 return url.startsWith('/')?new URL(url.slice(1),root).href:url;
}
function move(id,options={}){
 if(!graph?.nodes.has(id))return;
 if(current.id!==id)trail.push(current.id);
 current={...current,id,...options};
 history.pushState(null,'',address(current));
 $('find').value='';$('matches').replaceChildren();render();
}
function patch(p){
 current={...current,...p};
 history.pushState(null,'',address(current));render();
}
function showSearch(){
 $('matches').replaceChildren();
 const q=$('find').value;
 if(!q.trim())return;
 const found=find(graph,q);
 const caption=make('div','search-caption',found.length?found.length+' matching particulars':'No matching particulars in these committed catalogs');
 $('matches').append(caption);
 for(const n of found){
  const b=make('button','result');
  b.type='button';
  b.append(make('span',null,(marks[n.kind]||'✳')+'  '+n.label),make('small',null,n.kind));
  b.addEventListener('click',()=>move(n.id));
  $('matches').append(b);
 }
}
function drawThreads(view,points){
 const svg=$('threads');svg.replaceChildren();
 if(view.visible.length>8)return;
 const NS='http://www.w3.org/2000/svg';
 const pointById=new Map([[view.center.id,{x:500,y:325}],...points.map(p=>[p.node.id,p])]);
 for(const e of view.links){
  const a=pointById.get(e.a),b=pointById.get(e.b);if(!a||!b)continue;
  const line=document.createElementNS(NS,'path');
  const mx=(a.x+b.x)/2,my=(a.y+b.y)/2-18;
  line.setAttribute('d','M '+a.x+' '+a.y+' Q '+mx+' '+my+' '+b.x+' '+b.y);
  line.setAttribute('class',e.a===view.center.id||e.b===view.center.id?'first-link':'second-link');
  svg.append(line);
 }
}
function drawBoard(view){
 $('board').dataset.mode=current.mode;
 const selected=graph.nodes.get(current.id);
 const center=$('center');
 center.dataset.particularId=selected.id;
 center.dataset.particularKind=selected.kind;
 center.dataset.particularLabel=selected.label;
 center.dataset.particularOwner=selected.owner;
 center.dataset.particularSource=selected.source;
 center.dataset.particularUrl=selected.url;
 document.dispatchEvent(new CustomEvent('abundent:particular-selected',{detail:{id:selected.id,kind:selected.kind,label:selected.label,owner:selected.owner,source:selected.source,url:selected.url}}));
 $('board').dataset.dense=String(view.visible.length>8);
 const c=$('center');c.replaceChildren();
 c.append(make('span','center-mark',marks[view.center.kind]||'✳'),
  make('span','center-kicker','THE PARTICULAR / '+view.center.kind.toUpperCase()),
  make('strong',null,view.center.label),
  make('span','center-hint','Choose a neighbor to recompose this table'));
 const holder=$('objects');holder.replaceChildren();
 const n=view.visible.length;
 const positions=[];
 for(let i=0;i<n;i++){
  const item=view.visible[i],angle=-Math.PI/2+2*Math.PI*i/n;
  const x=500+376*Math.cos(angle),y=325+240*Math.sin(angle);
  positions.push({node:item.node,x,y});
  const card=make('button','object');card.type='button';
  card.dataset.kind=item.node.kind;
  card.style.setProperty('--x',(x/10)+'%');
  card.style.setProperty('--y',(y/6.5)+'%');
  card.setAttribute('aria-label','Follow '+item.node.label+'; '+item.distance+' relationship'+(item.distance===1?'':'s')+' away');
  const pin=make('span','object-symbol',marks[item.node.kind]||'✳');
  const body=make('span','object-body');body.append(make('small',null,item.node.kind+' · '+item.distance+' hop'+(item.distance===1?'':'s')),make('strong',null,item.node.label));
  if(current.closer>=6)body.append(make('em',null,item.node.owner));
  card.append(pin,body);
  card.addEventListener('click',()=>move(item.node.id));
  holder.append(card);
 }
 drawThreads(view,positions);
}
function renderInspector(view){
 const n=view.center;
 $('inspector-kind').textContent='SELECTED PARTICULAR / '+n.kind.toUpperCase();
 $('inspector-title').textContent=n.label;
 $('inspector-description').textContent=n.description;
 $('owner').textContent=n.owner;
 $('evidence').textContent=n.evidence;
 $('source').textContent=n.source;
 $('claim').textContent=n.claim;
 const link=$('door-link');link.href=safeLink(n.url);link.target=n.url.startsWith('http')?'_blank':'_self';link.rel='noopener noreferrer';
 link.textContent=n.url.startsWith('http')?'Open original source ↗':'Enter this door ↗';
 const holder=$('relations');holder.replaceChildren();
 for(const r of relations(graph,n.id)){
  const peer=graph.nodes.get(r.neighbor);
  const b=make('button','relation');b.type='button';
  b.append(make('span','relation-title',peer.label),make('small',null,r.kind+' · '+r.evidence));
  b.addEventListener('click',()=>move(peer.id));holder.append(b);
 }
 if(!holder.children.length)holder.append(make('p','quiet','No observed neighbors for this particular.'));
}
function render(){
 if(!graph)return;
 const view=compose(graph,current.id,current.mode,current.closer);
 $('closer').value=current.closer;
 $('closer-value').textContent=current.closer;
 $('back').disabled=trail.length===0;
 document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===current.mode)));
 drawBoard(view);renderInspector(view);
 $('count').textContent=view.visible.length+' in view · '+view.totalReachable+' within three hops · '+graph.nodes.size+' addressable particulars';
 $('status').textContent='A composed view of committed observations. No remote effects, uploads, accounts or automatic crossings.';
}
async function boot(){
 try{
  const urls=['../field/public-field.json','../music/rooms/catalog.json'].map(p=>new URL(p,import.meta.url));
  const responses=await Promise.all(urls.map(u=>fetch(u,{credentials:'omit',redirect:'error'})));
  if(responses.some(r=>!r.ok))throw Error('SOURCE_UNAVAILABLE');
  const [field,music]=await Promise.all(responses.map(r=>r.json()));
  graph=buildGraph(field,music);
  current=parseAddress(location.hash,graph);
  render();
  $('find').addEventListener('input',showSearch);
  $('find').addEventListener('keydown',e=>{
   if(e.key==='Escape'){$('find').value='';$('matches').replaceChildren();}
   if(e.key==='Enter'){const first=find(graph,$('find').value,1)[0];if(first){e.preventDefault();move(first.id);}}
  });
  document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>patch({mode:b.dataset.mode})));
  $('closer').addEventListener('input',()=>{current.closer=Number($('closer').value);render()});
  $('closer').addEventListener('change',()=>history.pushState(null,'',address(current)));
  $('root').addEventListener('click',()=>move('garden'));
  $('back').addEventListener('click',()=>{
   const id=trail.pop();if(!id)return;
   current={...current,id};history.pushState(null,'',address(current));render();
  });
  $('surprise').addEventListener('click',()=>{
   const options=relations(graph,current.id);
   if(options.length)move(options[Math.floor(Math.random()*options.length)].neighbor);
  });
  $('copy').addEventListener('click',async()=>{
   const url=location.href.split('#')[0]+address(current);
   try{await navigator.clipboard.writeText(url);$('status').textContent='This particular view is copied. No private content included.';}
   catch{$('status').textContent='This view address: '+url;}
  });
  const restore=()=>{current=parseAddress(location.hash,graph);render()};
  addEventListener('popstate',restore);addEventListener('hashchange',restore);
 }catch(e){
  $('status').textContent='The public catalogs could not be opened. The existing field and listening rooms remain available.';
  const container=$('objects');container.replaceChildren();
  for(const [name,url] of [['Public field','../field/'],['Listening rooms','../music/rooms/'],['A week together','../week/']]){
   const a=make('a','fallback',name+' ↗');a.href=url;container.append(a);
  }
  $('center').textContent='Catalog unavailable';$('door-link').href='../';
  $('back').disabled=true;$('surprise').disabled=true;$('copy').disabled=true;
 }
}
boot();
