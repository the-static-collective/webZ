import {COMMONS_ENTRIES,COMMONS_RELEASE,COMMONS_DISCLOSURE,selectCommons} from './commons.mjs';
const $=s=>document.querySelector(s);
const el=(tag,value)=>{const n=document.createElement(tag);if(value!==undefined)n.textContent=value;return n;};
const query=$('#commons-query'),status=$('#commons-count'),list=$('#commons-library');
$('#commons-disclosure').textContent=COMMONS_DISCLOSURE;
function render(rows,term='') {
  list.replaceChildren(...rows.map(item=>{
    const li=el('li');
    li.append(el('h3',item.lane.replace(/_/g,' ').toUpperCase()+' · '+item.status),
      el('p',item.observation),el('p','NEXT REAL-WORLD CHECK: '+item.firstCheck),
      el('small',item.id+' · owner-held source register key '+item.sourceId+' · not independent proof'));
    return li;
  }));
  status.textContent=rows.length+' of '+COMMONS_ENTRIES.length+' curated notes'+
    (term?' relevant to "'+term+'"':'')+' · snapshot '+COMMONS_RELEASE;
}
function search() {
  const text=query.value.trim().slice(0,360);
  if(!text){render(COMMONS_ENTRIES);return;}
  render(selectCommons(text,{limit:Math.min(15,COMMONS_ENTRIES.length)}),text);
}
$('#commons-search').addEventListener('click',search);
$('#commons-all').addEventListener('click',()=>{query.value='';render(COMMONS_ENTRIES)});
query.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();search()}});
render(COMMONS_ENTRIES);
