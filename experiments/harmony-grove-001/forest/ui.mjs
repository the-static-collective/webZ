import {emptyForest,inspectArrivals,buildGraph,layoutForest,exportForest,inspectForest,makeDemoForest,MAX_GIFT_BYTES,MAX_FOREST_BYTES} from './contract.mjs';
const $=id=>document.getElementById(id);
const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
const SVG='http://www.w3.org/2000/svg';
let forest=emptyForest(),selected=null,fictional=false;
const status=message=>{$('forest-status').textContent=message;};
function download(value,name){
 const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)+'\n'],{type:'application/json'}));
 const a=el('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);
}
const short=hash=>hash?.slice(0,19)+'…';
const hashFromURL=()=>{const s=location.hash.slice(1);return s.startsWith('gift=')?decodeURIComponent(s.slice(5)):null;};
function select(id){selected=id;location.hash='gift='+encodeURIComponent(id);render();}
function button(text,action,cls){const b=el('button',text,cls);b.type='button';b.addEventListener('click',action);return b;}
function row(label,value){const div=el('div',undefined,'fact');div.append(el('dt',label),el('dd',String(value)));return div;}
function inspectPanel(graph){
 const detail=$('selected-detail'),neighbors=$('neighbors');detail.replaceChildren();neighbors.replaceChildren();
 const node=graph.index.get(selected);
 $('download-gift').disabled=!node;
 if(!node){detail.append(el('p',selected?'HOLD: this address names a gift not present in this local forest. Import the original parcel to inspect it.':'No gift selected yet.'));return;}
 detail.append(el('h3',node.title));
 const dl=el('dl',undefined,'inspector-facts');
 for(const [name,value] of Object.entries({'Offered by':node.creator,'Accompanying note':node.message||'(none)','Source fragment':node.fragment,'Local gift hash':node.id,'Original seed hash':node.seedHash,'Invitation':node.permission,'Declared origin':node.originAuthority,'Parent state':node.parentStatus,'Parent address':node.parentRef||'(none)','Ancestral assertions':node.ancestralClaims+' (unverified)','Authority':'Self-declared; no signed origin or publication proof'}))dl.append(row(name,value));
 detail.append(dl);
 if(node.parentId)neighbors.append(button('Walk to parent ↖',()=>select(node.parentId)));
 if(node.parentRef&&!node.parentId)neighbors.append(el('p','Unresolved parent: '+short(node.parentRef)+' · '+node.parentStatus,'missing'));
 for(const child of node.children)neighbors.append(button('Follow descendant: '+graph.index.get(child).title,()=>select(child)));
 if(!node.children.length)neighbors.append(el('p','No descendant currently loaded. That is not evidence that none exists.','hint'));
}
function render(){
 const graph=buildGraph(forest),layout=layoutForest(graph),map=$('forest-map'),list=$('trail-list');
 map.replaceChildren();list.replaceChildren();
 $('save').disabled=!forest.size||!$('export-consent').checked;
 if(!forest.size){map.style.width='';map.style.height='';map.append(el('div','The clearing is empty. Plant a demo or import gifts.','empty-forest'));list.append(el('p','No works loaded.'));inspectPanel(graph);return;}
 map.style.width=layout.width+'px';map.style.height=layout.height+'px';
 const svg=document.createElementNS(SVG,'svg');svg.setAttribute('viewBox',`0 0 ${layout.width} ${layout.height}`);svg.setAttribute('aria-hidden','true');svg.classList.add('forest-lines');
 for(const edge of graph.edges){
  const p=layout.positions.get(edge.from),c=layout.positions.get(edge.to);
  const path=document.createElementNS(SVG,'path');path.setAttribute('d',`M${p.x} ${p.y+35} C${p.x} ${p.y+115},${c.x} ${c.y-115},${c.x} ${c.y-40}`);path.setAttribute('fill','none');path.setAttribute('stroke','#b1d0ab');path.setAttribute('stroke-width','3');svg.append(path);
 }
 map.append(svg);
 for(const n of graph.nodes){
  const pos=layout.positions.get(n.id);
  const b=button(n.title,()=>select(n.id),'forest-node '+(n.parentStatus==='ROOT'?'root ':n.parentId?'connected ':'unresolved ')+(selected===n.id?'selected':''));
  b.style.left=(pos.x-110)+'px';b.style.top=(pos.y-39)+'px';b.setAttribute('aria-pressed',String(selected===n.id));
  b.setAttribute('aria-label',`${n.title}, ${n.creator}, ${n.parentStatus.replaceAll('_',' ')}`);
  b.prepend(el('span',n.parentStatus==='ROOT'?'FIRST RING':n.parentId?'LINKED PATH':'UNRESOLVED PATH','node-tag'));
  b.append(el('small',n.creator+' · '+(n.permission==='REMIX_ALLOWED'?'Remix invited':'View only')));
  map.append(b);
  const li=button(n.title+' — '+n.creator+' ('+n.parentStatus.replaceAll('_',' ').toLowerCase()+')',()=>select(n.id),'list-node');li.setAttribute('aria-pressed',String(selected===n.id));list.append(li);
 }
 inspectPanel(graph);
}
function postLoad(next,added){forest=next;
 if(!selected||!forest.has(selected))selected=hashFromURL()||added[0]||buildGraph(forest).roots[0]||null;
 const graph=buildGraph(forest);render();
 status(`${added.length} new gift(s) loaded. ${forest.size} total · ${graph.edges.length} matching local parent path(s) · ${graph.warnings.length} unresolved or contradictory claim(s). ${fictional?'Fictional demo works are present.':''} No uploads or publication.`);
}
$('demo').addEventListener('click',async()=>{
 try{const demo=await makeDemoForest();const data=[...demo.forest.values()].map(x=>x.bundle);const result=await inspectArrivals(data,forest);fictional=true;postLoad(result.forest,result.added);}catch(e){status('HOLD · '+e.message);}
});
$('gifts').addEventListener('change',async event=>{
 const files=[...event.target.files];if(!files.length)return;
 if(files.some(f=>f.size>MAX_GIFT_BYTES)){status('HOLD · one or more gifts exceeds 32 KiB. No files were admitted.');event.target.value='';return;}
 try{const bundles=await Promise.all(files.map(async f=>JSON.parse(await f.text())));const result=await inspectArrivals(bundles,forest);postLoad(result.forest,result.added);}catch(e){status('HOLD · '+e.message+' · Previous forest preserved.');}
 event.target.value='';
});
$('forest-file').addEventListener('change',async event=>{
 const file=event.target.files?.[0];if(!file)return;
 if(file.size>MAX_FOREST_BYTES){status('HOLD · forest collection exceeds 1.5 MB.');event.target.value='';return;}
 try{const result=await inspectForest(JSON.parse(await file.text()),forest);postLoad(result.forest,result.added);}catch(e){status('HOLD · '+e.message+' · Previous forest preserved.');}
 event.target.value='';
});
$('export-consent').addEventListener('change',render);
$('save').addEventListener('click',async()=>{
 if(!$('export-consent').checked||!forest.size)return;
 try{download(await exportForest(forest),'abundent-local-forest.json');status('A local collection file was prepared. Sharing is your separate decision.');}catch(e){status('HOLD · '+e.message);}
});
$('download-gift').addEventListener('click',()=>{
 const node=buildGraph(forest).index.get(selected);if(!node)return;
 download(node.sourceBundle,'abundent-local-gift.json');
 status('One inspected gift was downloaded. Nothing was transmitted to the Crossing Tent.');
});
$('clear').addEventListener('click',()=>{
 forest=emptyForest();fictional=false;selected=null;history.replaceState(null,'',location.pathname+location.search);
 $('export-consent').checked=false;render();status('Cleared from this tab. Files you downloaded or shared remain outside this clearing.');
});
window.addEventListener('hashchange',()=>{selected=hashFromURL();render();});
selected=hashFromURL();render();
