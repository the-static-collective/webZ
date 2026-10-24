import {SOURCE,TOPICS,ORGANIZATIONS,byId,sharedTopics,pairLink} from './data.mjs';
const $=selector=>document.querySelector(selector);
const board=$('#board'),count=$('#count'),filters=$('#filters'),search=$('#search');
let topic='all',selection=[];
const make=(tag,klass,value)=>{const e=document.createElement(tag);if(klass)e.className=klass;if(value!==undefined)e.textContent=value;return e;};
const label = id => TOPICS[id]||id;
const selected=()=>selection.map(byId).filter(Boolean);
function visible(){
 const q=search.value.trim().toLocaleLowerCase();
 return ORGANIZATIONS.filter(o=>(topic==='all'||o.topics.includes(topic)) && (!q||(o.name+' '+o.topics.map(label).join(' ')).toLocaleLowerCase().includes(q)));
}
function drawFilters(){
 filters.replaceChildren();
 for(const [key,title] of [['all','All notes'],...Object.entries(TOPICS)]){
  const b=make('button','',title);b.type='button';b.className=key===topic?'active':'';b.setAttribute('aria-pressed',String(key===topic));
  b.addEventListener('click',()=>{topic=key;drawFilters();drawBoard();});filters.append(b);
 }
}
function pick(id){
 if(selection.includes(id)){selection=selection.filter(x=>x!==id);}
 else if(selection.length<2){selection.push(id);}
 else {selection=[selection[1],id];}
 drawBoard();drawBridge();
}
function drawBoard(){
 const rows=visible();count.textContent=String(rows.length);$('#empty').hidden=rows.length>0;
 const fragment=document.createDocumentFragment();
 for(const o of rows){
  const card=make('button','note c'+(ORGANIZATIONS.indexOf(o)%6));card.type='button';
  card.setAttribute('aria-pressed',String(selection.includes(o.id)));
  card.setAttribute('aria-label',o.name+' — '+o.topics.map(label).join(', ')+'. '+(selection.includes(o.id)?'Selected. Activate to remove.':'Activate to select.'));
  card.append(make('span','num','CONNECT! / '+String(ORGANIZATIONS.indexOf(o)+1).padStart(2,'0')));
  card.append(make('span','name',o.name));
  card.append(make('span','tags',o.topics.map(label).join(' • ')));
  if(selection.includes(o.id))card.append(make('span','dot','✳'));
  card.addEventListener('click',()=>pick(o.id));fragment.append(card);
 }
 board.replaceChildren(fragment);
}
function questionFor(a,b,common){
 const pair=a.name+' and '+b.name;
 if(!common.length)return 'What is one small thing '+pair+' might be curious enough to explore together?';
 if(common.length===1)return 'In the area of '+label(common[0]).toLowerCase()+', what could '+pair+' make easier for neighbors by sharing a single table?';
 return 'What would become possible if '+pair+' compared their offers and needs around '+common.slice(0,2).map(x=>label(x).toLowerCase()).join(' and ')+'?';
}
function cardText(a,b,common,question){
 return [
  'CONNECT! / TWO-CHAIR CONVERSATION CARD',
  'Observed as handwritten group labels on a 24 October 2026 gathering board.',
  '', 'Chair one: '+a.name,'Chair two: '+b.name,
  'Possible shared topics: '+(common.length?common.map(label).join(' / '):'None obvious from provisional categories'),
  '', 'Question: '+question,
  '', 'ASK, DO NOT ASSUME:',
  'OFFER — What could you share?',
  'NEED — What help would matter?',
  'CONNECT — Who would you willingly introduce?',
  'GATHER — Where and when could people meet?',
  '', 'NEXT STEP: Ask both sides whether a conversation is welcome. If so, consider a Seventh Table invitation.',
  'Provenance: '+SOURCE.title+' photo, '+SOURCE.observed+'. Names and topic tags unverified.',
  'This is an independent Abundent draft. No connection, endorsement, organizational membership, contact or consent is claimed.',
  'https://abundent.org/connections/'
 ].join('\n');
}
function drawBridge(){
 const [a,b]=selected();
 $('#first').textContent=a?a.name:'Choose an organization';
 $('#second').textContent=b?b.name:'Choose another';
 $('#unselected').hidden=Boolean(a&&b);$('#comparison').hidden=!(a&&b);$('#status').textContent='';
 if(!a||!b)return;
 const common=sharedTopics(a,b),question=questionFor(a,b,common);
 $('#shared').textContent=common.length?'POSSIBLE SHARED THEMES: '+common.map(label).join(' • '):'No shared tags so far. That can itself be a good conversation starter.';
 $('#question').textContent=question;
 $('#share').value=pairLink(window.location.href,[a.id,b.id]);
 $('#print-pair').textContent=a.name+' × '+b.name;
 $('#print-topic').textContent=common.length?common.map(label).join(' • '):'A curious introduction, without assumed overlap';
 $('#print-question').textContent=question;
}
async function copy(textValue,field){
 try{if(!navigator.clipboard?.writeText)throw Error('unavailable');await navigator.clipboard.writeText(textValue);$('#status').textContent='Copied. You decide whether and to whom to pass it.';}
 catch{$('#status').textContent=field?'Select and copy the link above. No message was sent.':'Clipboard unavailable here. Use Print card, or a different browser.';if(field){field.focus();field.select();}}
}
$('#copy-link').addEventListener('click',()=>{if(selection.length===2)void copy($('#share').value,$('#share'));});
$('#copy-card').addEventListener('click',()=>{
 const [a,b]=selected();if(!a||!b)return;
 void copy(cardText(a,b,sharedTopics(a,b),$('#question').textContent),null);
});
$('#print-card').addEventListener('click',()=>{if(selection.length===2)window.print();});
$('#clear').addEventListener('click',()=>{selection=[];drawBoard();drawBridge();});
search.addEventListener('input',drawBoard);
const incoming=new URLSearchParams(window.location.search).get('pair');
if(incoming){const ids=incoming.split(',');if(ids.length===2&&ids[0]!==ids[1]&&ids.every(id=>byId(id)))selection=ids;}
drawFilters();drawBoard();drawBridge();
