/* Suno Atlas: local metadata graph, 11×11 browsing, explicit opt-in IndexedDB.
 * Neither source scraping nor audio streaming is implemented.
 */
import {
 MAX_BYTES,emptyCatalog,validateCatalog,fromText,mergeCatalog,indexId,
 freshView,withDial,withSearch,enter,rise,address,parseAddress,choose,lanes,timeline,styleGraph
} from './model.mjs';
import {names,saveNamed,loadNamed,deleteNamed} from './storage.mjs';
const $=id=>document.getElementById(id),ns='http://www.w3.org/2000/svg';
let catalog=emptyCatalog(),view=freshView(),loadVersion=0,shownRows=30;
const tell=t=>$('status').textContent=t;
const node=(name,cls,value)=>{
 const el=document.createElement(name);if(cls)el.className=cls;
 if(value!==undefined)el.textContent=String(value);return el;
};
const svg=(name,attrs={})=>{
 const e=document.createElementNS(ns,name);
 for(const [key,value] of Object.entries(attrs))e.setAttribute(key,String(value));
 return e;
};
function provenance(){
 $('n-tracks').textContent=catalog.tracks.length.toLocaleString();
 $('n-tags').textContent=new Set(catalog.tracks.flatMap(x=>x.tags)).size.toLocaleString();
 const dated=catalog.tracks.map(t=>t.created_at).filter(Boolean).sort();
 $('date-range').textContent=dated.length?dated[0].slice(0,7)+' → '+dated.at(-1).slice(0,7):'unknown';
 $('fingerprint').textContent=indexId(catalog);
}
function route(write=true){
 const h='#view='+encodeURIComponent(address(catalog,view));
 if(write)history.replaceState(null,'',h);
}
function selection(){
 const v=choose(catalog,view);
 const ancestry=view.path.reduce((tracks,p)=>{
  const lane=lanes(tracks)[p.t-1];
  return lane?.tag?tracks.filter(t=>t.tags.includes(lane.tag)):lane?tracks:[];
 },catalog.tracks);
 const choices=lanes(ancestry);
 const lane=choices[view.tuning-1];
 return {v,lane:lane?.label||'Unassigned dial position'};
}
function move(next,reason=''){
 view=next;
 route();
 paint();
 if(reason)tell(reason);
}
function focus(t,g){
 const next=withDial(withDial(view,'tuning',Math.max(1,Math.min(11,t))),'granularity',Math.max(1,Math.min(11,g)));
 move(next);
}
function when(time){return time?time.slice(0,10):'Date unknown'}
function duration(s){
 if(s===null)return 'Duration unknown';
 return String(Math.floor(s/60))+':'+String(s%60).padStart(2,'0');
}
function drawTimeline(tracks){
 const box=$('timeline');box.replaceChildren();
 const result=timeline(tracks,view.granularity),series=result.bins;
 $('timeline-caption').textContent=series.length?result.resolution+' bins · '+result.total.toLocaleString()+' tracks (from indexed metadata)'+(result.truncated?' · showing last 70 bins':''):'No dated metadata yet.';
 if(!series.length){box.append(node('p','small muted','No track metadata to plot.'));return}
 const W=540,H=250,top=20,bottom=35,left=26,plotHeight=H-top-bottom;
 const graphic=svg('svg',{viewBox:'0 0 '+W+' '+H,role:'img','aria-label':'Metadata counts by '+result.resolution});
 const max=Math.max(...series.map(x=>x.count),1);
 const gap=series.length<=15?7:2,bw=Math.max(1,(W-left-10)/series.length-gap);
 series.forEach((b,i)=>{
  const x=left+i*(W-left-10)/series.length+gap/2,h=Math.max(2,(b.count/max)*plotHeight);
  const rect=svg('rect',{x,y:H-bottom-h,width:bw,height:h,rx:2,class:'bar'});
  const tip=svg('title');tip.textContent=b.bucket+': '+b.count+' tracks';rect.append(tip);graphic.append(rect);
  if(series.length<=14||i%Math.ceil(series.length/9)===0){
   const lab=svg('text',{x:x,y:H-15,class:'tick',transform:'rotate(-24 '+x+' '+(H-15)+')'});
   lab.textContent=b.bucket;graphic.append(lab);
  }
 });
 const label=svg('text',{x:5,y:12,class:'axis'});label.textContent='max '+max;graphic.append(label);
 box.append(graphic);
}
function drawGraph(tracks){
 const box=$('constellation');box.replaceChildren();
 const graph=styleGraph(tracks);if(!graph.nodes.length){
  box.append(node('p','small muted','Import tracks with style or tag metadata to see connections.'));return;
 }
 const W=540,H=260,cx=W/2,cy=H/2,r=91;
 const g=svg('svg',{viewBox:'0 0 '+W+' '+H,role:'img','aria-label':'Style co-occurrence network based on imported track tags'});
 const positions=new Map(),max=Math.max(...graph.nodes.map(x=>x.count));
 graph.nodes.forEach((n,i)=>{
  const a=(i/graph.nodes.length)*Math.PI*2-Math.PI/2;
  positions.set(n.id,{x:cx+Math.cos(a)*r,y:cy+Math.sin(a)*r});
 });
 for(const e of graph.edges){
  const a=positions.get(e.source),b=positions.get(e.target);
  if(!a||!b)continue;
  const l=svg('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,class:'edge','stroke-width':Math.min(5,1+Math.sqrt(e.count))});
  const tip=svg('title');tip.textContent=e.source+' + '+e.target+' · '+e.count+' shared track(s)';l.append(tip);g.append(l);
 }
 for(const n of graph.nodes){
  const p=positions.get(n.id),rr=5+Math.sqrt(n.count/max)*11;
  const circle=svg('circle',{cx:p.x,cy:p.y,r:rr,class:'node'});
  const tip=svg('title');tip.textContent=n.id+' · '+n.count+' track(s)';circle.append(tip);g.append(circle);
  const text=svg('text',{x:p.x+(p.x>=cx?rr+5:-(rr+5)),y:p.y+3,
   'text-anchor':p.x>=cx?'start':'end',class:'node-label'});
  text.textContent=n.id.length>18?n.id.slice(0,16)+'…':n.id;
  g.append(text);
 }
 box.append(g);
}
function renderTracks(v){
 const list=$('track-list');list.replaceChildren();
 const items=v.tracks.slice(0,shownRows);
 $('visible-count').textContent=v.total.toLocaleString()+' matched · '+v.shown.toLocaleString()+' at this granularity';
 for(const t of items){
  const row=node('article','track');
  const body=node('div'),heading=node('strong',null,t.title);
  body.append(heading);
  if(t.origin==='SYNTHETIC_DEMO')body.append(node('span','synthetic','FICTIONAL'));
  body.append(node('div','metadata',[when(t.created_at),duration(t.seconds),t.model||'Model unknown',t.album||'Unassigned',t.id].join(' · ')));
  if(t.style||t.tags.length)body.append(node('div','tagline',t.tags.slice(0,8).join(' / ')||t.style));
  row.append(body);
  if(t.source_url){
   const link=node('a',null,'Open in Suno ↗');link.href=t.source_url;link.target='_blank';link.rel='noopener noreferrer';link.referrerPolicy='no-referrer';row.append(link);
  }else row.append(node('span','small muted','No verified source link'));
  list.append(row);
 }
 if(!items.length)list.append(node('p','small muted',catalog.tracks.length?'No tracks match this tuned/search view.':'The Atlas is empty. Import CSV/JSON or load the synthetic demo.'));
 $('more').hidden=items.length>=v.tracks.length;
}
function paint(){
 provenance();
 const {v,lane}=selection();
 $('tuning').value=view.tuning;$('grain').value=view.granularity;
 $('t-value').textContent=String(view.tuning).padStart(2,'0')+'/11';
 $('g-value').textContent=String(view.granularity).padStart(2,'0')+'/11';
 $('t-label').textContent=lane;
 $('g-label').textContent='Up to '+Math.min(20000,11*2**(view.granularity-1)).toLocaleString()+' tracks';
 $('scope').textContent=lane.toUpperCase();
 $('depth').textContent='LEVEL '+view.path.length;
 $('rise').disabled=view.path.length===0;$('enter').disabled=view.path.length>=24;
 $('search').value=view.search;
 $('atlas-address').textContent=address(catalog,view);
 renderTracks(v);
 drawTimeline(v.all);drawGraph(v.all);
}
function setCatalog(c,reason){
 catalog=validateCatalog(c);view=freshView();shownRows=30;route();paint();tell(reason);
}
$('demo').addEventListener('click',()=>{
 const titles=['The Paper Orchard','Signal in the Porch','The Second Door','Garden Frequency',
 'Lighthouse in the Trees','A Longer Way Home','Little Receiver','Ridge Song',
 'Anatomy of a Radio','Moonlight in the Kitchen','Ghosts in the Machine'];
 const styles=['folk, acoustic','gospel, ambient','synthwave, electronic','jazz, tribal percussion',
 'hip hop, glitch','americana, indie','ambient, minimal','orchestral, cinematic'];
 const rows=Array.from({length:88},(_,i)=>({
  id:'demo-'+String(i+1).padStart(4,'0'),
  title:titles[i%titles.length]+' — '+String(Math.floor(i/titles.length)+1),
  created_at:new Date(Date.UTC(2025,Math.floor(i/7),Math.min(27,1+i%27))).toISOString(),
  duration:125+(i*17)%185,style:styles[i%styles.length],
  model:i%2?'illustrative-v5':'illustrative-v4',
  album:['Synthetic Season A','Synthetic Season B','Unassigned'][i%3]
 }));
 setCatalog(fromText(JSON.stringify(rows),'json','SYNTHETIC_DEMO'),
  '88 entirely fictional demo tracks loaded. These are not your Suno records.');
});
$('files').addEventListener('change',async e=>{
 const selected=[...(e.target.files||[])];e.target.value='';
 if(!selected.length)return;
 if(selected.some(x=>x.size>MAX_BYTES)||selected.length>8){tell('HOLD: maximum eight files, 6 MB each. Nothing imported.');return}
 const version=++loadVersion;
 try{
  let next=catalog;
  for(const file of selected){
   const format=file.name.toLowerCase().endsWith('.csv')?'csv':file.name.toLowerCase().endsWith('.json')?'json':'auto';
   next=mergeCatalog(next,fromText(await file.text(),format,'USER_SELECTED'));
  }
  if(version!==loadVersion)return;
  setCatalog(next,selected.length+' local file(s) imported. No network requests, audio or account access.');
 }catch(error){tell('HOLD: '+error.message+'. Existing library retained.')}
});
for(const [id,axis,step] of [['t-down','tuning',-1],['t-up','tuning',1],['g-down','granularity',-1],['g-up','granularity',1]]){
 $(id).addEventListener('click',()=>focus(axis==='tuning'?view.tuning+step:view.tuning,axis==='granularity'?view.granularity+step:view.granularity));
}
$('tuning').addEventListener('input',e=>focus(Number(e.target.value),view.granularity));
$('grain').addEventListener('input',e=>focus(view.tuning,Number(e.target.value)));
$('enter').addEventListener('click',()=>move(enter(view),'Entered a nested tuning context. Metadata remains unchanged; no audio plays.'));
$('rise').addEventListener('click',()=>move(rise(view),'Restored parent dials; no external consequence.'));
$('reset').addEventListener('click',()=>move(freshView(),'Back at the library root.'));
$('search').addEventListener('input',e=>{shownRows=30;move(withSearch(view,e.target.value))});
$('clear-search').addEventListener('click',()=>{shownRows=30;move(withSearch(view,''))});
$('copy').addEventListener('click',async()=>{
 try{await navigator.clipboard.writeText(location.href);tell('Copied catalog-bound 11-dial address. No media transferred.')}
 catch{tell('Bookmark address: '+location.href)}
});
$('more').addEventListener('click',()=>{shownRows+=40;renderTracks(selection().v)});
$('clear').addEventListener('click',()=>{loadVersion++;setCatalog(emptyCatalog(),'Current view cleared. Saved IndexedDB snapshots were not touched.')});
function recover(){
 const hash=location.hash;
 if(!hash.startsWith('#view=')){view=freshView();paint();return}
 try{view=parseAddress(catalog,decodeURIComponent(hash.slice(6)));paint();
  tell('Restored exact dials for this catalog. Search and private data are not encoded in URL.');
 }catch{view=freshView();route();paint();tell('HOLD: bookmark refers to different library data or malformed dials. Loaded safe root.')}
}
window.addEventListener('popstate',recover);window.addEventListener('hashchange',recover);
async function refreshSaves(){
 const all=await names(),sel=$('snapshots'),v=sel.value;sel.replaceChildren();
 const empty=node('option',null,'Choose a local snapshot');empty.value='';sel.append(empty);
 all.forEach(n=>{const o=node('option',null,n);o.value=n;sel.append(o)});
 if(all.includes(v))sel.value=v;
}
$('save').addEventListener('click',async()=>{
 try{const name=$('snapshot-name').value;await saveNamed(name,catalog);await refreshSaves();
  $('snapshots').value=name;tell('Saved '+catalog.tracks.length+' metadata records as "'+name+'" locally on this device. No Suno sync.');
 }catch(e){tell('HOLD: '+e.message)}
});
$('load').addEventListener('click',async()=>{
 try{const name=$('snapshots').value;
  setCatalog(await loadNamed(name),'Loaded local snapshot "'+name+'". No account contacted.');
 }catch(e){tell('HOLD: '+e.message)}
});
$('delete').addEventListener('click',async()=>{
 try{const name=$('snapshots').value;if(!name)throw Error('SELECT_SNAPSHOT');
  await deleteNamed(name);await refreshSaves();tell('Deleted local snapshot "'+name+'". Current in-memory view remains.');
 }catch(e){tell('HOLD: '+e.message)}
});
$('export').addEventListener('click',()=>{
 try{
  validateCatalog(catalog);
  const exportJson=JSON.stringify({schema:'webz/suno-atlas-portable/v0',
    catalog,notes:'User-selected or fictional metadata only. No lyrics/audio/account credentials.'},null,2);
  const url=URL.createObjectURL(new Blob([exportJson],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download='suno-atlas-metadata.json';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),2000);
  tell('Portable metadata JSON exported by explicit click. Keep it private if it contains private song names.');
 }catch(e){tell('HOLD: '+e.message)}
});
document.addEventListener('keydown',e=>{
 if(e.altKey||e.ctrlKey||e.metaKey||['INPUT','TEXTAREA','SELECT'].includes(e.target?.tagName))return;
 if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))return;
 e.preventDefault();
 if(e.key==='ArrowUp')focus(Math.min(11,view.tuning+1),view.granularity);
 if(e.key==='ArrowDown')focus(Math.max(1,view.tuning-1),view.granularity);
 if(e.key==='ArrowRight')focus(view.tuning,Math.min(11,view.granularity+1));
 if(e.key==='ArrowLeft')focus(view.tuning,Math.max(1,view.granularity-1));
});
paint();
refreshSaves().catch(()=>tell('Local snapshots unavailable in this browser. Import and JSON export remain available.'));

if('serviceWorker' in navigator && location.protocol!=='file:'){
 navigator.serviceWorker.register('../../sw.js',{scope:'../../'}).catch(()=>{});
}
