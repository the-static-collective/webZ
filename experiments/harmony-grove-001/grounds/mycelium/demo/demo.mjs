// Deterministic, fictional, read-only grounds. No participant data and no network requests.
import {makeDemoForest,buildGraph} from '../../../forest/contract.mjs';
import {proposeFootpath,composeGrounds,shortestWalk} from '../../contract.mjs';
const $=id=>document.getElementById(id),NS='http://www.w3.org/2000/svg';
const make=(tag,text)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;return el;};
let graph,paths=[],chosen=null,mode='untended',left,right;
const digest=s=>s.slice(0,22)+'…';
const select=id=>{chosen=id;draw();};
function draw(){
 const selected=mode==='untended'?[]:[paths[0]];
 const grounds=composeGrounds(graph,selected),map=$('map'),list=$('places');
 map.replaceChildren();list.replaceChildren();map.style.width=grounds.width+'px';map.style.height=grounds.height+'px';
 const svg=document.createElementNS(NS,'svg');svg.setAttribute('viewBox',`0 0 ${grounds.width} ${grounds.height}`);svg.setAttribute('aria-hidden','true');svg.classList.add('forest-lines');
 for(const edge of grounds.edges){const a=grounds.positions.get(edge.from),b=grounds.positions.get(edge.to),p=document.createElementNS(NS,'path');p.setAttribute('d',`M ${a.x} ${a.y} Q ${(a.x+b.x)/2} ${(a.y+b.y)/2-60} ${b.x} ${b.y}`);p.setAttribute('class',edge.kind==='LOCAL_PARENT_MATCH'?'lineage':'proposed');svg.append(p);}
 map.append(svg);
 for(const n of graph.nodes){const position=grounds.positions.get(n.id),b=make('button',n.title);b.type='button';b.className='forest-node'+(n.id===chosen?' selected':'');b.style.left=(position.x-110)+'px';b.style.top=(position.y-39)+'px';b.setAttribute('aria-pressed',String(n.id===chosen));b.addEventListener('click',()=>select(n.id));b.append(make('small',n.creator+' · '+n.permission));map.append(b);
  const item=make('button',n.title+' — '+n.creator);item.className='list-node';item.addEventListener('click',()=>select(n.id));list.append(item);}
 const before=shortestWalk(composeGrounds(graph),left.id,right.id).length-1,after=shortestWalk(grounds,left.id,right.id).length-1;
 $('comparison').textContent=mode==='untended'?`These sibling works are ${before} lineage crossings apart.`:mode==='tended'?`A steward's proposed path changes ${before} crossings to ${after}. This does not change ancestry.`:`Two distinct reasons can be recorded for the same pair, but the route remains ${after} crossing. Attention is not a vote.`;
 for(const id of ['untended','tended','plural'])$(id).setAttribute('aria-pressed',String(mode===id));
 const n=graph.index.get(chosen),detail=$('detail');detail.replaceChildren();if(!n)return;
 detail.append(make('h3',n.title),make('p',n.fragment),make('p','Creator: '+n.creator+' (fictional) · Permission: '+n.permission),make('p','Original gift: '+digest(n.id)),make('p','Parent: '+(n.parentRef?digest(n.parentRef):'root')));
}
for(const id of ['untended','tended','plural'])$(id).addEventListener('click',()=>{mode=id;draw();});
try{const {forest}=await makeDemoForest();graph=buildGraph(forest);left=graph.nodes.find(n=>n.title==='The blue plate');right=graph.nodes.find(n=>n.title==='The room hears back');
 paths=[await proposeFootpath(graph,{a:left.id,b:right.id,kind:'RESONANCE',note:'Two different makers noticed the antenna from different rooms.',keeper:'Fictional steward'}),
 await proposeFootpath(graph,{a:left.id,b:right.id,kind:'CONTRAST',note:'One story listens while the other tries to repair the signal.',keeper:'Fictional steward'})];
 chosen=graph.roots[0];draw();
}catch(error){$('comparison').textContent='This fictional walkthrough could not be assembled locally: '+error.message;}
