/* MUSIC FIELD 002: unified local metadata. No APIs, tokens, scraping or audio. */
import {
 PLATFORMS,PORTABLE,MAX_BYTES,empty,validate,importText,merge,scope,counts,relations,
 fingerprint,freshView,validView,setView,descend,ascend,address,parseAddress,lanes
} from './model.mjs';
import {names,save,load,remove} from './storage.mjs';
const $=id=>document.getElementById(id),bounds=x=>Math.max(1,Math.min(11,x));
let library=empty(),view=freshView(),visible=30,version=0;
const say=msg=>$('status').textContent=msg;
const element=(tag,cl,t)=>{
 const n=document.createElement(tag);if(cl)n.className=cl;if(t!==undefined)n.textContent=String(t);return n;
};
const NS='http://www.w3.org/2000/svg';
function svg(tag,attributes={}){
 const x=document.createElementNS(NS,tag);
 for(const [key,value] of Object.entries(attributes))x.setAttribute(key,String(value));
 return x;
}
function drawBars(box,bins){
 box.replaceChildren();
 if(!bins.length){box.append(element('p','small muted','No date metadata yet.'));return}
 const W=500,H=235,plot=170,left=20,start=H-32,max=Math.max(1,...bins.map(b=>b.count));
 const plotSvg=svg('svg',{viewBox:'0 0 '+W+' '+H,role:'img','aria-label':'Metadata timeline'});
 const gap=(W-left-10)/bins.length,width=Math.max(1,gap-(bins.length>20?2:7));
 for(let i=0;i<bins.length;i++){
  const b=bins[i],height=b.count/max*plot,x=left+i*gap;
  const bar=svg('rect',{x,y:start-height,width,height,rx:2});
  const title=svg('title');title.textContent=b.date+': '+b.count;bar.append(title);plotSvg.append(bar);
  if(bins.length<=12||i%Math.ceil(bins.length/9)===0){
   const t=svg('text',{x,y:H-13,transform:'rotate(-30 '+x+' '+(H-13)+')'});
   t.textContent=b.date;plotSvg.append(t);
  }
 }
 const t=svg('text',{x:7,y:15});t.textContent='Max '+max;plotSvg.append(t);
 box.append(plotSvg);
}
function drawGraph(box,records){
 box.replaceChildren();
 if(!records.length){box.append(element('p','small muted','Your sources and tags will appear here.'));return}
 const stats=counts(records,view),W=500,H=255,max=Math.max(1,...Object.values(stats.platforms));
 const plotSvg=svg('svg',{viewBox:'0 0 '+W+' '+H,role:'img','aria-label':'Counts by source and imported tags'});
 const ps=PLATFORMS.map((p,i)=>({name:p,count:stats.platforms[p],x:84+i*166,y:58}));
 for(const p of ps){
  const c=svg('circle',{cx:p.x,cy:p.y,r:11+Math.sqrt(p.count/max)*18,fill:'#abedd0',stroke:'#2f6865','stroke-width':2});
  const tip=svg('title');tip.textContent=p.name+' · '+p.count; c.append(tip);plotSvg.append(c);
  const t=svg('text',{x:p.x,y:p.y+43,'text-anchor':'middle'});t.textContent=p.name;plotSvg.append(t);
 }
 const tags=stats.tags.slice(0,9);
 tags.forEach((t,i)=>{
  const x=50+(i%5)*100,y=149+Math.floor(i/5)*62;
  const rect=svg('rect',{x:x-43,y:y-18,width:86,height:34,rx:9,fill:'#315360'});
  plotSvg.append(rect);
  const text=svg('text',{x,y:y+3,'text-anchor':'middle'});
  text.textContent=(t.tag.length>13?t.tag.slice(0,12)+'…':t.tag)+' '+t.count;plotSvg.append(text);
 });
 box.append(plotSvg);
}
function scopeBase(){
 let records=library.records.filter(r=>view.platform==='ALL'||view.platform===r.platform);
 for(const p of view.path){
  const l=lanes(records)[p.t-1];
  records=l?(l.tag?records.filter(r=>r.tags.includes(l.tag)):records):[];
 }
 return records;
}
function paint(){
 const sc=scope(library,view),metric=counts(sc.all,view),rel=relations(sc.all);
 $('count-all').textContent=library.records.length;
 for(const p of PLATFORMS)$('count-'+p.toLowerCase()).textContent=library.records.filter(x=>x.platform===p).length;
 $('platform').value=view.platform;
 $('tuning').value=view.tuning;$('grain').value=view.granularity;
 $('t-label').textContent=String(view.tuning).padStart(2,'0')+' / 11';
 $('g-label').textContent=String(view.granularity).padStart(2,'0')+' / 11';
 $('current-family').textContent=(sc.lane||'No family').toUpperCase();
 $('view-address').textContent=address(library,view);
 $('depth').textContent='LEVEL '+view.path.length;
 $('rise').disabled=!view.path.length;$('enter').disabled=view.path.length>=24;
 $('search').value=view.search;
 $('timeline-meta').textContent=metric.range.toUpperCase()+' · '+sc.total+' matching imported records';
 drawBars($('timeline'),metric.bins);drawGraph($('graph'),sc.all);
 $('relations').textContent=rel.edges.length+' user-declared relationship(s) between records in this view. No title-based equivalence inferred.';
 const records=$('records');records.replaceChildren();
 const shown=sc.visible.slice(0,visible);
 $('visible').textContent=sc.total+' matched · '+sc.visible.length+' shown at this granularity';
 for(const r of shown){
  const card=element('article','record'),body=element('div');
  body.append(element('span','badge',r.platform),element('strong',null,r.title));
  const bits=[r.artist||'Artist unknown',r.album||'No album',
   r.created_at?r.created_at.slice(0,10):'No date',r.seconds!==null?Math.floor(r.seconds/60)+':'+String(r.seconds%60).padStart(2,'0'):'No duration',r.key];
  body.append(element('div','sub',bits.join(' · ')));
  if(r.tags.length)body.append(element('div','relations',r.tags.slice(0,8).join(' / ')));
  if(r.origin==='SYNTHETIC_DEMO')body.append(element('div','relations','FICTIONAL EXAMPLE · not from any real account'));
  card.append(body);
  if(r.source_url){
   const link=element('a',null,'Original page ↗');
   link.href=r.source_url;link.target='_blank';link.rel='noopener noreferrer';link.referrerPolicy='no-referrer';
   card.append(link);
  }else card.append(element('span','small muted','No approved source link'));
  records.append(card);
 }
 if(!shown.length)records.append(element('p','small muted',library.records.length?'No records match this field.':'Import metadata or try fictional demo.'));
 $('more').hidden=visible>=sc.visible.length;
}
function url(write=true){
 const h='#field='+encodeURIComponent(address(library,view));
 if(write)history.replaceState(null,'',h);
}
function move(next,msg){
 view=validView(next);url();paint();
 if(msg)say(msg);
}
function dial(axis,x){move(setView(view,axis,bounds(x)))}
function catalog(next,msg){
 library=validate(next);view=freshView();visible=30;url();paint();say(msg);
}
function demo(){
 const samples=[];
 for(let i=0;i<36;i++){
  const platform=PLATFORMS[i%3],title=['Porch Frequency','Radio Orchard','A Question Machine','Signal House','Another Verse','Lantern Road'][i%6],
    tags=['folk, ambient','gospel, jazz','electronic, glitch','americana, folk'][i%4];
  const rid=platform==='YOUTUBE'?'demo'+String(i).padStart(7,'0'):('demo'+String(i).padStart(4,'0'));
  const d={source_id:rid,title:title+' / '+(i+1),artist:'Fictional Collective',
   album:'Demo season',date:new Date(Date.UTC(2026,1+Math.floor(i/8),i%25+1)).toISOString(),duration:180+i,style:tags};
  samples.push({platform,data:d});
 }
 let result=empty();
 for(const p of PLATFORMS){
  const rows=samples.filter(s=>s.platform===p).map(s=>s.data);
  result=merge(result,importText(JSON.stringify(rows),p,'json','SYNTHETIC_DEMO'));
 }
 catalog(result,'Loaded 36 FICTIONAL records across 3 platforms; no real music or accounts.');
}
$('demo').addEventListener('click',demo);
$('files').addEventListener('change',async e=>{
 const files=[...(e.target.files||[])],platform=$('import-platform').value;
 e.target.value='';if(!files.length)return;
 if(files.length>8||files.some(f=>f.size>MAX_BYTES)){say('HOLD: up to 8 local files, 6 MB each.');return}
 const current=++version;
 try{
  let combined=library;
  for(const f of files){
   const type=f.name.toLowerCase().endsWith('.csv')?'csv':'json';
   combined=merge(combined,importText(await f.text(),platform,type));
  }
  if(current!==version)return;
  catalog(combined,'Imported '+files.length+' local file(s) as '+platform+'. Nothing uploaded or streamed.');
 }catch(err){say('HOLD: '+err.message+'. Previous index retained.')}
});
$('clear').addEventListener('click',()=>{version++;catalog(empty(),'Current field cleared; saved local snapshots were not changed.')});
$('platform').addEventListener('change',e=>move(setView(view,'platform',e.target.value),'Changed source scope. No playback.'));
for(const [id,axis,change] of [['t-minus','tuning',-1],['t-plus','tuning',1],['g-minus','granularity',-1],['g-plus','granularity',1]]){
 $(id).addEventListener('click',()=>dial(axis,view[axis]+change));
}
$('tuning').addEventListener('input',e=>dial('tuning',Number(e.target.value)));
$('grain').addEventListener('input',e=>dial('granularity',Number(e.target.value)));
$('enter').addEventListener('click',()=>move(descend(view),'Entered deeper source context; no source record mutated.'));
$('rise').addEventListener('click',()=>move(ascend(view),'Parent dial pair reconstructed.'));
$('root').addEventListener('click',()=>move(freshView(),'Returned to all-source root.'));
$('search').addEventListener('input',e=>{visible=30;move(setView(view,'search',e.target.value))});
$('more').addEventListener('click',()=>{visible+=40;paint()});
$('copy').addEventListener('click',async()=>{
 try{await navigator.clipboard.writeText(location.href);say('Exact dataset-bound address copied. No music was played.')}
 catch{say('Manual bookmark: '+location.href)}
});
function restoreURL(){
 if(!location.hash.startsWith('#field=')){view=freshView();paint();return}
 try{view=parseAddress(library,decodeURIComponent(location.hash.slice(7)));paint();say('Recovered source-qualified address. Search text was not persisted.')}
 catch{view=freshView();url();paint();say('HOLD: address from a different dataset or malformed dials. Root selected.')}
}
window.addEventListener('popstate',restoreURL);
window.addEventListener('hashchange',restoreURL);
async function refresh(){
 const all=await names(),selector=$('snapshots'),selected=selector.value;selector.replaceChildren();
 const first=element('option',null,'Choose a local snapshot');first.value='';selector.append(first);
 for(const name of all){const option=element('option',null,name);option.value=name;selector.append(option)}
 if(all.includes(selected))selector.value=selected;
}
$('save').addEventListener('click',async()=>{
 try{const name=$('snapshot-name').value;await save(name,library);await refresh();
  $('snapshots').value=name;say('Saved '+library.records.length+' metadata records locally as '+name+'. No account connection.')}
 catch(e){say('HOLD: '+e.message)}
});
$('load').addEventListener('click',async()=>{
 try{const name=$('snapshots').value;catalog(await load(name),'Loaded snapshot '+name+' from browser storage.')}
 catch(e){say('HOLD: '+e.message)}
});
$('delete').addEventListener('click',async()=>{
 try{const name=$('snapshots').value;if(!name)throw Error('CHOOSE_SNAPSHOT');
  await remove(name);await refresh();say('Deleted '+name+' from browser storage; current view remains.')}
 catch(e){say('HOLD: '+e.message)}
});
$('export').addEventListener('click',()=>{
 try{
  validate(library);
  const text=JSON.stringify({schema:PORTABLE,scope:'USER_SELECTED_METADATA',catalog:library},null,2);
  const href=URL.createObjectURL(new Blob([text],{type:'application/json'}));
  const a=element('a');a.href=href;a.download='webz-music-field.json';a.click();setTimeout(()=>URL.revokeObjectURL(href),1500);
  say('Portable metadata backup exported. Retain privately if it contains private tracks.');
 }catch(e){say('HOLD: '+e.message)}
});
document.addEventListener('keydown',e=>{
 if(e.altKey||e.metaKey||e.ctrlKey||['INPUT','TEXTAREA','SELECT'].includes(e.target?.tagName))return;
 const d={ArrowUp:['tuning',1],ArrowDown:['tuning',-1],ArrowLeft:['granularity',-1],ArrowRight:['granularity',1]}[e.key];
 if(d){e.preventDefault();dial(d[0],view[d[0]]+d[1])}
});
paint();refresh().catch(()=>say('IndexedDB unavailable; in-memory import and explicit JSON export still work.'));
