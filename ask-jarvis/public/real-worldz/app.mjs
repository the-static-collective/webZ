import {PLACES,PLACE_BY_ID,WAYS,SOURCE_CARDS,REGION} from './places.mjs';
import {geography,mapLink,draftPublicQuest,verifyDraft,privateFieldNote,importedFiction,sourceLinks} from './model.mjs';

const $=id=>document.getElementById(id);
const say=(id,value)=>{$(id).textContent=String(value);};
let activePlace='sibley',activeWay='observe';
const stamp='2026-10-24';
const noteWarn='This is a personal, unverified note, not an environmental report. Do not include contact information or identifying details about other people.';
function sourceLink(info,description){
 const a=document.createElement('a');
 a.href=info.url;a.target='_blank';a.rel='noopener noreferrer';
 a.textContent=info.label+' ↗';
 if(description){const small=document.createElement('small');small.textContent=description;a.append(small)}
 return a;
}
function renderMap(){
 const completed=geography();
 const root=$('place-pins');root.replaceChildren();
 for(const marker of completed){
  const p=PLACE_BY_ID[marker.id];
  const button=document.createElement('button');
  button.type='button';
  button.className='pin'+(p.id===activePlace?' selected':'');
  button.style.left=marker.left.toFixed(3)+'%';
  button.style.top=marker.top.toFixed(3)+'%';
  button.setAttribute('aria-pressed',String(p.id===activePlace));
  button.setAttribute('aria-label','Select '+p.name+', approximate public park location');
  button.title='Select '+p.name+' (approximate park reference)';
  const icon=document.createElement('span');icon.className='pin-symbol';icon.textContent=p.icon;
  const name=document.createElement('b');name.textContent=p.name.toUpperCase();
  const subtitle=document.createElement('small');subtitle.textContent='PUBLIC PARK';
  button.append(icon,name,subtitle);
  button.addEventListener('click',()=>{activePlace=p.id;render();say('entry-status','Geographic reference changed. No field action, invitation or report sent.');});
  root.append(button);
 }
}
function renderSources(){
 const p=PLACE_BY_ID[activePlace];
 const list=$('source-list');list.replaceChildren();
 const sources=[
 [p.source,'Original municipal place description'],
 [SOURCE_CARDS.bridge,'Official project update, not present access certification'],
 [SOURCE_CARDS.opening,'Historical announcement of planned opening, not a live status'],
 [SOURCE_CARDS.dnr,'Original public scientific framework; no measurements imported'],
 [SOURCE_CARDS.mpca,'Original watershed-program explanation; not a local result'],
 [SOURCE_CARDS.eco,'Independently operated original EcoMapper and stewardship system']
 ];
 for(const [info,description] of sources)list.append(sourceLink(info,description));
}
function renderWayButtons(){
 const root=$('way-options');root.replaceChildren();
 for(const way of WAYS){
  const button=document.createElement('button');button.className='way';button.type='button';
  button.setAttribute('aria-pressed',String(way.id===activeWay));
  const icon=document.createElement('span');icon.className='icon';icon.textContent=way.icon;
  const strong=document.createElement('strong');strong.textContent=way.name;
  const small=document.createElement('small');small.textContent=way.description;
  button.append(icon,strong,small);
  button.addEventListener('click',()=>{activeWay=way.id;render();say('entry-status','Optional path selected. Nothing has been submitted, performed or approved.');});
  root.append(button);
 }
}
function render(){
 const p=PLACE_BY_ID[activePlace],w=WAYS.find(x=>x.id===activeWay);
 renderMap();renderWayButtons();renderSources();
 const index=PLACES.findIndex(x=>x.id===p.id)+1;
 say('place-kind','PARK REFERENCE · '+String(index).padStart(2,'0')+'/03');
 say('place-icon',p.icon);say('place-name',p.name);say('place-sub',p.sub);
 say('place-summary',p.summary);
 say('coordinates',p.latitude.toFixed(6)+'° N · '+Math.abs(p.longitude).toFixed(6)+'° W');
 say('geocode-warning','BigGeo approximate named-park geocode — not a surveyed entrance, bridge or route.');
 say('place-location',p.areaLabel);
 $('osm').href=mapLink(activePlace);
 $('place-questions').replaceChildren();
 for(const q of p.questions){const li=document.createElement('li');li.textContent=q;$('place-questions').append(li)}
 say('place-gate',p.humanGate);
 say('chosen-way',w.icon+'  '+w.name+' / '+p.name.toUpperCase());
 say('fixed-question',p.prompt);
 say('way-description',w.description);
 say('way-boundary',w.disclaimer);
 say('print-place',p.name+' · '+w.name);
 say('print-question',p.prompt);
 say('print-source',p.source.url+' · reviewed as public source on '+stamp);
}
function saveJSON(name,data){
 const blob=new Blob([JSON.stringify(data,null,2)+'\n'],{type:'application/json;charset=utf-8'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1200);
}
$('draft-quest').addEventListener('click',()=>{
 try{
  const draft=verifyDraft(draftPublicQuest(activePlace,activeWay));
  saveJSON('river-gate-unpublished-public-question.json',draft);
  say('entry-status','HELD. Source-only learning question saved locally; no volunteer recruited, no external request or account created.');
 }catch(e){say('entry-status','Draft rejected: '+e.message);}
});
$('save-private').addEventListener('click',()=>{
 try{
  const field=privateFieldNote(activePlace,activeWay,$('note').value);
  saveJSON('river-gate-private-note.json',field);
  say('note-status','Private local file saved. Not shared, witnessed or sent. Keep it on your own device.');
 }catch(e){say('note-status','Note not saved: '+e.message+'. '+noteWarn);}
});
$('print-card').addEventListener('click',()=>{render();window.print();});
$('willow-save').addEventListener('change',async event=>{
 const file=event.target.files?.[0];if(!file)return;
 try{
  if(file.size>20_000)throw Error('FILE_TOO_LARGE');
  const parsed=JSON.parse(await file.text());
  const hint=importedFiction(parsed);
  say('fiction-return',String(hint.fictional_turns)+' fictional turns loaded. '+hint.suggestion+
   ' No environmental observations, ranks, Deeds, or permissions crossed into this site.');
  // Optional creative mapping: prefer a similar path if there is a clear active choice.
  if(hint.favorite_fictional_path==='Storykeeper')activeWay='return';
  else if(hint.favorite_fictional_path==='Connector')activeWay='connect';
  else if(hint.favorite_fictional_path==='Observer')activeWay='observe';
  render();
 }catch(e){say('fiction-return','Import refused: '+e.message+'. No real-world contribution was claimed.')}
 event.target.value='';
});
render();
say('entry-status','Map ready: three public reference places in '+REGION+'. Nothing tracked, published or automatically sourced.');
