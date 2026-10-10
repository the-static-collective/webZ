import {emptyForest,inspectArrivals,inspectForest,buildGraph,makeDemoForest,MAX_GIFT_BYTES,MAX_FOREST_BYTES} from '../forest/contract.mjs';
import {proposeFootpath,combineFootpaths,composeGrounds,shortestWalk,exportAttendance,inspectAttendance,MAX_ATLAS_BYTES} from './contract.mjs';
const $=id=>document.getElementById(id);
const element=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
const SVG='http://www.w3.org/2000/svg';
let forest=emptyForest(),paths=[],selected=null,lastPair=null,fictional=false;
const label=id=>{const n=buildGraph(forest).index.get(id);return n?n.title:id?.slice(0,21)+'…';};
const status=message=>{$('grounds-status').textContent=message;};
function download(value,name){const blob=new Blob([JSON.stringify(value,null,2)+'\n'],{type:'application/json'});
 const u=URL.createObjectURL(blob),a=element('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),3000);
}
function btn(caption,fn,cls=''){const b=element('button',caption,cls);b.type='button';b.addEventListener('click',fn);return b;}
function options(id,graph){const field=$(id),old=field.value;field.replaceChildren();
 for(const n of graph.nodes){const opt=element('option',n.title+' — '+n.creator);opt.value=n.id;field.append(opt);}
 if(graph.index.has(old))field.value=old;
}
function routeText(grounds,from,to){
 const route=shortestWalk(grounds,from,to);
 if(!route)return 'There is no observed route between these works in the current clearing.';
 return `${route.length-1} crossing(s): `+route.map((step,i)=>`${i?step.via==='PROPOSED_STEWARDSHIP'?'[stewarded] ':'[lineage] ':''}${label(step.id)}`).join(' → ');
}
function details(graph,grounds){
 const node=graph.index.get(selected),panel=$('site-detail'),neighbors=$('neighbors');panel.replaceChildren();neighbors.replaceChildren();
 $('carry-gift').disabled=!node;$('find-route').disabled=!node||graph.nodes.length<2;
 if(!node){panel.append(element('p','Choose a particular from the map or list. A location never proves its creator or rights.'));return;}
 panel.append(element('h3',node.title));const facts=element('dl',undefined,'inspector-facts');
 for(const [name,value] of Object.entries({'Offered by':node.creator,'Source text':node.fragment,'Original gift hash':node.id,'Original seed hash':node.seedHash,'Declared remix permission':node.permission,'Ancestry status':node.parentStatus,'Parent reference':node.parentRef||'(none)','Attribution':'Self-declared; not an authenticated human','Public status':'Unknown; locally imported, not public evidence'})){
  const f=element('div',undefined,'fact');f.append(element('dt',name),element('dd',String(value)));facts.append(f);
 }panel.append(facts);
 for(const trail of grounds.trails.get(selected)){
  const target=graph.index.get(trail.to),kind=trail.kind==='PROPOSED_STEWARDSHIP'?'Visitor footpath':'Parent/child trail';
  neighbors.append(btn(`Walk ${kind}: ${target.title}`,()=>{selected=target.id;render();$('inspection').scrollIntoView({block:'start',behavior:'auto'});}));
 }
 if(!grounds.trails.get(selected).length)neighbors.append(element('p','No observed outgoing route. This does not prove no relationships exist.','hint'));
}
function draw(grounds,graph){
 const map=$('grounds-map'),list=$('site-list');map.replaceChildren();list.replaceChildren();
 if(!grounds.sites.length){map.style.width='';map.style.height='';map.append(element('div','The clearing is waiting for a particular.','empty-forest'));list.append(element('p','No sites loaded.'));return;}
 map.style.width=grounds.width+'px';map.style.height=grounds.height+'px';
 const lines=document.createElementNS(SVG,'svg');lines.setAttribute('viewBox',`0 0 ${grounds.width} ${grounds.height}`);lines.classList.add('forest-lines');lines.setAttribute('aria-hidden','true');
 for(const edge of grounds.edges){const a=grounds.positions.get(edge.from),b=grounds.positions.get(edge.to),path=document.createElementNS(SVG,'path');
  const parent=edge.kind==='LOCAL_PARENT_MATCH';
  path.setAttribute('d',parent?`M${a.x} ${a.y+37} C${a.x} ${a.y+110},${b.x} ${b.y-105},${b.x} ${b.y-40}`:
    `M${a.x} ${a.y} Q${(a.x+b.x)/2} ${(a.y+b.y)/2-62} ${b.x} ${b.y}`);
  path.setAttribute('class',parent?'verified-parent-route':'proposed-route');lines.append(path);
 }map.append(lines);
 for(const site of grounds.sites){const pos=grounds.positions.get(site.id),n=graph.index.get(site.id);
  const classes='forest-node ground-place '+(n.parentStatus==='ROOT'?'root':n.parentId?'connected':'unresolved')+(site.permission==='VIEW_ONLY'?' view-only':'')+(selected===site.id?' selected':'');
  const b=btn(site.title,()=>{selected=site.id;render();},classes);
  b.style.left=(pos.x-110)+'px';b.style.top=(pos.y-41)+'px';b.setAttribute('aria-pressed',String(selected===site.id));
  b.setAttribute('aria-label',`${site.title}. ${site.creator}. ${n.parentStatus.replaceAll('_',' ')}. ${site.permission}`);
  b.prepend(element('span',n.parentStatus==='ROOT'?'FIRST RING':n.parentId?'DESCENDANT':'UNRESOLVED','node-tag'));
  b.append(element('small',site.creator+' · '+(site.permission==='VIEW_ONLY'?'View only':'Remix invited (claim)')));map.append(b);
  const li=btn(site.title+' — '+site.creator+' · '+n.parentStatus.replaceAll('_',' ').toLowerCase(),()=>{selected=site.id;render();$('inspection').scrollIntoView({block:'start',behavior:'auto'});},'list-node');
  li.setAttribute('aria-pressed',String(selected===site.id));list.append(li);
 }
}
function pathList(graph,grounds){const box=$('path-list');box.replaceChildren();
 if(!paths.length){box.append(element('p','No deliberate connections added. Looking alone does not change the land.','hint'));return;}
 for(const path of paths){const linked=grounds.active.some(e=>e.id===path.id),reason=grounds.held.find(e=>e.id===path.id)?.reason;
  const card=element('article',undefined,'path-entry'+(linked?'':' path-held'));
  card.append(element('strong',`${label(path.a)} ⇄ ${label(path.b)}`));
  card.append(element('p',`${path.kind.replaceAll('_',' ').toLowerCase()} · ${path.keeper} (self-declared)`));
  card.append(element('p',path.note));
  card.append(element('p',linked?'Active in this local map — proposal, not verified relation.':'HOLD: '+reason));
  card.append(btn('Remove this path locally',()=>{paths=paths.filter(p=>p.id!==path.id);if(lastPair?.id===path.id)lastPair=null;render();status('Removed a local connection. The original gift and its history remain unchanged.');}));box.append(card);
 }
}
function render(){
 const graph=buildGraph(forest),grounds=composeGrounds(graph,paths);
 if(selected&&!graph.index.has(selected))selected=null;
 if(!selected&&graph.nodes.length)selected=graph.roots[0]||graph.nodes[0].id;
 draw(grounds,graph);
 for(const s of ['from','to','destination'])options(s,graph);
 if(graph.nodes.length>1&&$('from').value===$('to').value)$('to').selectedIndex=1;
 if(graph.nodes.length>1&&$('destination').value===selected)$('destination').selectedIndex=graph.nodes[0].id===selected?1:0;
 $('tend').disabled=graph.nodes.length<2;
 $('export-attendance').disabled=paths.length===0||!$('export-consent').checked;
 details(graph,grounds);pathList(graph,grounds);
 if(lastPair){const pure=composeGrounds(graph),a=graph.index.has(lastPair.a),b=graph.index.has(lastPair.b);
  if(a&&b){const original=shortestWalk(pure,lastPair.a,lastPair.b),now=shortestWalk(grounds,lastPair.a,lastPair.b);
   $('comparison').textContent=`${label(lastPair.a)} ↔ ${label(lastPair.b)}: before ${original?original.length-1:'no observed route'} crossing(s), after ${now?now.length-1:'no observed route'} crossing(s). Parentage and original permissions stay unchanged.`;
  }else $('comparison').textContent='A tended path references a work not presently in this forest. It is on HOLD.';
 }else $('comparison').textContent='No recent footpath selected. Select two works and propose a meaningful reason to see their walking distance change.';
 return {graph,grounds};
}
async function addBundles(values){const result=await inspectArrivals(values,forest);forest=result.forest;render();const graph=buildGraph(forest);
 status(`${result.added.length} new inspected gift(s). ${graph.nodes.length} landmarks · ${graph.edges.length} locally matched lineage trails. ${fictional?'Fictional demo present. ':''}No automatic transport or publication.`);
}
$('demo').addEventListener('click',async()=>{try{const demo=await makeDemoForest();fictional=true;await addBundles([...demo.forest.values()].map(x=>x.bundle));}catch(e){status('HOLD · '+e.message);}});
$('gift-files').addEventListener('change',async event=>{const files=[...event.target.files];event.target.value='';if(!files.length)return;
 if(files.some(f=>f.size>MAX_GIFT_BYTES)){status('HOLD: gift limit is 32 KiB.');return;}
 try{await addBundles(await Promise.all(files.map(async f=>JSON.parse(await f.text()))));}catch(e){status('HOLD · '+e.message+'. Earlier gifts retained.');}
});
$('forest-file').addEventListener('change',async event=>{const f=event.target.files?.[0];event.target.value='';if(!f)return;
 if(f.size>MAX_FOREST_BYTES){status('HOLD: collection too large.');return;}
 try{const result=await inspectForest(JSON.parse(await f.text()),forest);forest=result.forest;render();status(`${result.added.length} additional gifts joined this local clearing. Nothing was uploaded.`);}catch(e){status('HOLD · '+e.message+'. Earlier gifts retained.');}
});
$('attendance-file').addEventListener('change',async event=>{const f=event.target.files?.[0];event.target.value='';if(!f)return;
 if(f.size>MAX_ATLAS_BYTES){status('HOLD: stewardship notebook too large.');return;}
 try{const combined=await inspectAttendance(JSON.parse(await f.text()),paths);paths=combined;render();status(`${paths.length} checked local footpath proposal(s). Missing endpoints remain on HOLD; no public claim created.`);}catch(e){status('HOLD · '+e.message+'. Earlier paths retained.');}
});
$('path-form').addEventListener('submit',async event=>{event.preventDefault();const {graph}=render();const data=Object.fromEntries(new FormData(event.currentTarget).entries());
 try{const path=await proposeFootpath(graph,data);paths=await combineFootpaths(paths,[path]);lastPair={a:path.a,b:path.b,id:path.id};render();status('A proposed footpath joined your local walk. The originals and their authorship claims did not change.');
 }catch(e){status('HOLD · '+e.message);}
});
$('export-consent').addEventListener('change',render);
$('export-attendance').addEventListener('click',async()=>{
 if(!$('export-consent').checked)return;
 try{download(await exportAttendance(paths),'abundent-stewardship-notebook.json');status('Local notebook downloaded. Sharing it with another person is a separate action.');}catch(e){status('HOLD · '+e.message);}
});
$('find-route').addEventListener('click',()=>{const {grounds}=render();if(!selected||!$('destination').value)return;
 $('route-result').textContent=routeText(grounds,selected,$('destination').value);
});
$('carry-gift').addEventListener('click',()=>{const node=buildGraph(forest).index.get(selected);if(!node)return;
 download(node.sourceBundle,'abundent-original-gift.json');status('One original source parcel downloaded. No remote receiver was contacted.');
});
$('clear').addEventListener('click',()=>{forest=emptyForest();paths=[];selected=null;fictional=false;lastPair=null;$('export-consent').checked=false;render();status('Cleared this visit. No remote state existed to change.');});
render();
