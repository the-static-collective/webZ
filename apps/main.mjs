import { DOORS } from './manifest.mjs';
const container = document.getElementById('results');
const search = document.getElementById('search');
const filters = document.getElementById('filters');
const counter = document.getElementById('visible-count');
const empty = document.getElementById('empty');
const categories = [['all','Everything'],['care','Care + food'],['community','Community'],['tools','Instruments'],['publishing','Publishing'],['creative','Music + art']];
const statusLabels = {open:'Web door configured',restricted:'Preview · may require access',repair:'Needs repair'};
let category = 'all';
function element(tag,className,textContent){
  const node=document.createElement(tag);
  if(className) node.className=className;
  if(textContent!==undefined) node.textContent=textContent;
  return node;
}
function renderFilters(){
  for(const [id,label] of categories){
    const btn=element('button','filter',label);
    btn.type='button';btn.dataset.category=id;btn.setAttribute('aria-pressed',String(category===id));
    btn.addEventListener('click',()=>{category=id;filters.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.category===id)));render()});
    filters.append(btn);
  }
}
function render(){
  const q=search.value.trim().toLocaleLowerCase();
  const selected=DOORS.filter(d=>(category==='all'||d.category===category) && (!q||[d.title,d.description,d.project,d.note].join(' ').toLocaleLowerCase().includes(q)));
  container.replaceChildren();
  counter.textContent=String(selected.length);
  empty.hidden=selected.length>0;
  for(const d of selected){
    const article=element('article','door');
    const upper=element('div','door-upper');
    upper.append(element('span','kind',d.category.replace(/^[a-z]/,c=>c.toUpperCase())));
    const badge=element('span','badge '+d.status,statusLabels[d.status]);
    upper.append(badge);
    article.append(upper);
    article.append(element('h3','',d.title));
    article.append(element('p','description',d.description));
    article.append(element('p','note',d.note));
    const bottom=element('div','door-bottom');
    if(d.status==='repair'){
      bottom.append(element('span','unavailable','Needs repair before public use'));
    } else {
      const a=element('a','go',d.status==='restricted'?'Inspect preview ↗':'Enter this door ↗');
      a.href=d.href; a.rel='noopener noreferrer'; a.target='_blank';
      a.setAttribute('aria-label',d.title+', '+statusLabels[d.status]+', opens in new tab');
      bottom.append(a);
    }
    bottom.append(element('code','project',d.project));
    article.append(bottom);container.append(article);
  }
}
renderFilters(); search.addEventListener('input',render);render();
