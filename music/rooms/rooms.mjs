// Observational zoom: same recording in multiple contexts. No remix inference or network telemetry.
const $=id=>document.getElementById(id);
const sourceBase='https://suno.com/song/';
const lensNames=['Particular','Week','Neighbors','Other rooms','2DAY cycle','Playlist order','Sound labels','Other takes','Story & motif','Doorways','Witness'];
const pad=n=>String(n).padStart(2,'0');
const node=(tag,text,cls)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;};
const ext=(label,href)=>{const a=node('a',label);a.href=href;a.target='_blank';a.rel='noopener noreferrer';return a;};
const local=(label,href)=>{const a=node('a',label);a.href=href;return a;};
const valid=id=>/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(id);
const duration=s=>pad(Math.floor(s/60))+':'+pad(s%60);
let catalog,cycle,chosen='',lens=1,close=5,weekTracks=[],allTracks=[];
const members=(id)=>catalog.rooms.flatMap(room=>room.tracks.flatMap((t,i)=>t.id===id?[{room,track:t,position:i+1}]:[]));
const dayMembers=(id)=>cycle.albums.flatMap(a=>a.tracks.filter(t=>t.suno_song_id===id).map(t=>({album:a,track:t})));
const weekMember=(id)=>weekTracks.find(t=>t.id===id);
function sourceList(id){return [...members(id).map(x=>({label:x.room.title+' · source playlist',href:x.room.suno_url})),...dayMembers(id).map(x=>({label:x.album.title+' · 2DAY shelf',href:'/music/2day/#'+x.album.id.split(':').at(-1)}))];}
function neighborPair(seq,pos){const before=pos>0?seq[pos-1]:null,after=pos<seq.length-1?seq[pos+1]:null;return {before,after};}
const fact=(heading,text,href,label)=>({heading,text,href,label});
function viewFor(track,id){
 const w=weekMember(id),r=members(id),d=dayMembers(id),found=allTracks.filter(t=>t.id===id);
 const allKnown=[...catalog.rooms.flatMap(x=>x.tracks),...cycle.albums.flatMap(x=>x.tracks.map(t=>({id:t.suno_song_id,title:t.title,url:t.suno_song_url}))),...weekTracks];
 const alt=[...new Map(allKnown.filter(t=>t.title.toLowerCase()===track.title.toLowerCase()&&t.id!==id).map(t=>[t.id,t])).values()];
 const weekSequence=weekTracks.findIndex(t=>t.id===id);
 const weekAdjacent=weekSequence>=0?neighborPair(weekTracks,weekSequence):null;
 const slots=r.map(x=>x.room.title+' #'+pad(x.position)).concat(d.map(x=>x.album.title+' #'+pad(x.track.occurrence)));
 const interpretations=r.map(x=>x.room.subtitle);
 const views=[
 {title:'The particular recording',summary:'A single Suno song ID is the smallest identity we can independently point to here.',facts:[
 fact('Recording',track.title),fact('Exact ID',id),fact('Known appearances',pad((w?1:0)+r.length+d.length)+' observed collection placement(s)'),fact('Source','The recording itself is linked by its original Suno identifier.',sourceBase+id,'Open original on Suno ↗')]},
 {title:'Its place in a week together',summary:w?'This recording sits inside letter '+pad(w.letter.number)+' of the 14-song album.':'No exact-ID placement in the fourteen-song album was found in this bounded snapshot.',facts:w?[
 fact('Letter',pad(w.letter.number)+' · '+w.letter.title),fact('Why these two?',w.letter.framing),fact('Question at the door',w.letter.question),fact('Open the letter','See its pair and the original listening invitation.','/week/#letter-'+w.letter.number,'Open letter ↗')]:[
 fact('Scope','Membership is decided by exact song ID, not similar title.'),fact('Observed sources',r.length+' new-room occurrence(s), '+d.length+' 2DAY occurrence(s).'),fact('What this does not say','A missing album entry is not proof the song never belonged elsewhere.'),fact('The compilation','Inspect the full fourteen-song selection.','/week/','Open a week together ↗')]},
 {title:'The songs beside it',summary:w?'A sequence is a relationship: this recording has a position among the fourteen.':'The observed playlist neighbors remain useful even when this recording is outside the compilation.',facts:[
 fact('In the week',weekAdjacent?((weekAdjacent.before?.title||'Start')+' ← '+track.title+' → '+(weekAdjacent.after?.title||'End')):'Not observed within the fourteen-song sequence.'),
 fact('In these rooms',r.map(x=>{const i=x.position-1,p=neighborPair(x.room.tracks,i);return x.room.title+': '+(p.before?.title||'Start')+' ← ['+track.title+'] → '+(p.after?.title||'End');}).join(' | ')||'No room-neighbor pair documented.'),
 fact('The pair',w?'Its letter pairs it with '+w.letter.songs.find(s=>s.id!==id)?.title+'.':'Only songs recorded in the same known sequence are called neighbors.'),
 fact('Boundary','Adjacency is a sequence observation, not an assertion about composition or inspiration.')]},
 {title:'Other listening rooms',summary:r.length?'This exact recording also appears in a public playlist we made into an Abundent room.':'The two newly observed rooms do not contain this particular recording ID.',facts:[
 fact('Documented rooms',r.map(x=>x.room.title).join(' · ')||'No exact-ID match in either room.'),
 fact('Where it sits',r.map(x=>x.room.title+' · track '+x.position+' of '+x.room.tracks.length).join(' | ')||'No source playlist slot documented.'),
 fact('What the room suggests',interpretations.join(' | ')||'No thematic room reading is attached to this exact ID.'),
 fact('Listen by source',r.length?'Each room preserves the observed playlist order and links back to the original.':'Visit the two rooms to explore their independent track selections.','#records','See room sequences ↓')]},
 {title:'The four 2DAY records',summary:d.length?'The ID also appears on a source playlist in the existing 2DAY album universe.':'No exact-ID occurrence was found among the four published 2DAY playlists.',facts:[
 fact('Album universe',d.map(x=>x.album.title).join(' · ')||'Not observed in the four-record cycle.'),
 fact('Source positions',d.map(x=>x.album.title+' · track '+x.track.occurrence).join(' | ')||'No 2DAY position in the bounded manifest.'),
 fact('Compilation relation',d.some(x=>x.track.selected_for_compilation)?'This recording was explicitly selected from the 2DAY cycle into a week together.':'No 2DAY selection flag for this exact ID.'),
 fact('Return to the day','The four source playlists remain individually addressable.','/music/2day/','Open 2DAY ↗')]},
 {title:'The position in the playlist',summary:slots.length?'A recording can have several positions without changing identity.':'The original Suno recording is known; playlist placement is incomplete in this snapshot.',facts:[
 fact('Recorded positions',slots.join(' | ')||'No additional slot in these six observed collections.'),
 fact('Two new playlists',r.map(x=>x.room.title+' · '+x.position+'/'+x.room.tracks.length).join(' | ')||'Not observed in open window cruise or cupsz.'),
 fact('Four earlier playlists',d.map(x=>x.album.title+' · '+x.track.occurrence+'/'+x.album.tracks.length).join(' | ')||'Not observed in 2DAY.'),
 fact('Boundary','Source playlists can change later. These positions were inspected on October 11, 2026.')]},
 {title:'The visible sound labels',summary:r.length?'Suno exposed an abbreviated style label for this playlist occurrence.':'We have not imported an exact Suno style label for this recording in the new rooms.',facts:[
 fact('Observed style',r.map(x=>x.track.style||'No style label shown').join(' | ')||'Not imported for this song.'),
 fact('Generation label',r.map(x=>x.track.model||'Unknown').join(' | ')||'Not independently imported here.'),
 fact('What a tag tells us','It is source metadata, not a substitute for actually hearing the recording.'),
 fact('What remains','Full style prompts, detailed production parameters, and exact ancestry are not established by this public playlist snapshot.')]},
 {title:'Other takes, not assumed ancestors',summary:alt.length?'There are distinct song IDs with the same displayed title in this bounded selection.':'No same-title alternate ID was found in the collections inspected here.',facts:[
 fact('Same-title recordings',alt.map(x=>x.title+' · '+x.id.slice(0,8)).join(' | ')||'No documented same-title alternatives in this snapshot.'),
 fact('Exact identities',alt.map(x=>x.id).join(' | ')||'One ID here does not prove a lone creation history.'),
 fact('Important distinction','Shared titles do not establish cover, extension, remix, parent, or chosen-master relationships.'),
 fact('Ancestry','Not imported. Keep this unknown until source metadata supplies lineage.')]},
 {title:'Story, imagery, and interpretation',summary:w?'This recording has a place within an authored listening letter. The letter is interpretation, not raw song metadata.':'The two new rooms have editorial readings, but no week letter is assigned to this song.',facts:[
 fact('Letter or room',w?w.letter.title:(r.map(x=>x.room.title).join(' · ')||'Unassigned')),
 fact('Authored framing',w?w.letter.framing:(interpretations.join(' | ')||'No local editorial framing recorded.')),
 fact('Listener question',w?w.letter.question:'What new meaning appears when the same particular travels between listening rooms?'),
 fact('Epistemic label','This is curated context, not a lyrical transcript or a verified account of authorial intent.')]},
 {title:'The doors this recording opens',summary:'You can follow the exact recording, its room, its week, or its documented 2DAY source without mixing up those different kinds of address.',facts:[
 fact('Song door',sourceBase+id),fact('Week door',w?'/week/#letter-'+w.letter.number:'No exact week placement'),fact('Other room doors',r.map(x=>x.room.suno_url).join(' | ')||'No new room membership'),fact('2DAY door',d.length?'/music/2day/':'No exact 2DAY occurrence')]},
 {title:'The witness and the remainder',summary:'Evidence has a boundary. What this instrument does not know should remain unknown.',facts:[
 fact('Observations',catalog.observed_on+' · public Suno playlist pages; the published week; the 2DAY bridge'),
 fact('Positive matches','Track IDs only; playlist occurrence and album selection are not song ancestry.'),
 fact('What we have not verified','Full prompts, stems, creation ancestry, historical revision sequence, and other private tracks.'),
 fact('Canonical sources','Suno owns the original track/playlist objects. Abundent owns this editorial room and observation snapshot.')]}
 ];
 return views[lens-1];
}
function current(){const w=weekMember(chosen),r=members(chosen),d=dayMembers(chosen);const t=w||r[0]?.track||d[0]?.track||allTracks.find(t=>t.id===chosen);return t?{...t,id:chosen}:null;}
function navigate(update=true){
 const track=current();if(!track)return;
 const v=viewFor(track,chosen);
 const reading=$('reading');reading.replaceChildren();
 reading.append(node('p','THE VIEWFINDER / '+pad(lens)+' · '+pad(close),'eyebrow'),node('h3',v.title),node('p',track.title+' · '+chosen.slice(0,8),'readout'),node('p',v.summary,'description'));
 const facts=node('div',undefined,'facts');const exposed=Math.min(v.facts.length,Math.max(1,Math.ceil(close/3)));
 for(const row of v.facts.slice(0,exposed)){
   const el=node('section',undefined,'fact');el.append(node('h4',row.heading),node('p',row.text));
   if(row.href){const linkWrap=node('p');linkWrap.append(row.href.startsWith('#')||row.href.startsWith('/')?local(row.label,row.href):ext(row.label,row.href));el.append(linkWrap);}
   facts.append(el);
 }
 reading.append(facts);
 const sources=node('div',undefined,'source-list');sources.append(ext('Exact song on Suno ↗',sourceBase+chosen));
 if(weekMember(chosen))sources.append(local('Its week letter ↗','/week/#letter-'+weekMember(chosen).letter.number));
 const unique=new Set();for(const x of sourceList(chosen)){if(unique.has(x.href))continue;unique.add(x.href);sources.append(x.href.startsWith('/')?local(x.label,x.href):ext(x.label+' ↗',x.href));}
 reading.append(sources);
 $('song-select').value=chosen;$('lens-value').textContent=pad(lens)+' / 11';$('closer-value').textContent=pad(close)+' / 11';$('closer-dial').value=close;
 for(const [i,button] of [...$('lens-rack').querySelectorAll('button')].entries())button.setAttribute('aria-pressed',String(i+1===lens));
 $('rise').disabled=lens===1;
 if(update){const u=new URL(location.href);u.search='';u.searchParams.set('song',chosen);u.searchParams.set('lens',String(lens));u.searchParams.set('close',String(close));history.replaceState(null,'',u.pathname+u.search+u.hash);}
}
function choose(id,scroll=false){if(!valid(id)||!allTracks.some(t=>t.id===id))return;chosen=id;close=Math.max(close,6);navigate();if(scroll)$('instrument').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}
function populate(){
 const select=$('song-select');select.replaceChildren();
 const weekIds=new Set(weekTracks.map(t=>t.id));
 for(const [group,tracks] of [['a week together',weekTracks],['Other recordings in the two new rooms',allTracks.filter(t=>!weekIds.has(t.id))]]){
 const opt=document.createElement('optgroup');opt.label=group;
 for(const track of tracks){const option=node('option',track.title);option.value=track.id;opt.append(option);}select.append(opt);
 }
 for(const [i,name] of lensNames.entries()){
   const b=node('button',undefined,'knob');b.type='button';b.setAttribute('aria-pressed','false');b.setAttribute('aria-label','Lens '+pad(i+1)+': '+name);b.append(node('small',pad(i+1)),node('span',name));
   b.addEventListener('click',()=>{lens=i+1;navigate();});$('lens-rack').append(b);
 }
 for(const [i,r] of catalog.rooms.entries()){
   const ol=$(i===0?'cruise-tracks':'cupsz-tracks');ol.replaceChildren();
   for(const track of r.tracks){const li=node('li'),button=node('button',undefined,'track-open');button.type='button';button.append(node('span',track.title),node('small',(track.style||'style not shown')+' · '+duration(track.duration_seconds)));button.addEventListener('click',()=>choose(track.id,true));li.append(button,ext('Suno ↗',track.url));ol.append(li);}
 }
 const q=new URLSearchParams(location.search);
 const id=q.get('song'),l=Number(q.get('lens')),c=Number(q.get('close'));
 chosen=valid(id||'')&&allTracks.some(t=>t.id===id)?id:weekTracks[10].id;
 lens=Number.isInteger(l)&&l>=1&&l<=11?l:1;
 close=Number.isInteger(c)&&c>=1&&c<=11?c:5;
 select.addEventListener('change',()=>choose(select.value));
 $('closer-dial').addEventListener('input',e=>{close=Number(e.target.value);navigate();});
 $('rise').addEventListener('click',()=>{lens=1;navigate();});
 $('root').addEventListener('click',()=>{chosen=weekTracks[0].id;lens=1;close=1;navigate();});
 $('copy-address').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(location.href);$('copy-status').textContent='Address copied. The song and dial positions travel together.';}catch{$('copy-status').textContent='Copy not available. Use the page address in your browser.';}});
 window.addEventListener('popstate',()=>{const p=new URLSearchParams(location.search),id=p.get('song'),l=Number(p.get('lens')),c=Number(p.get('close'));if(valid(id||'')&&allTracks.some(t=>t.id===id))chosen=id;if(l>=1&&l<=11)lens=l;if(c>=1&&c<=11)close=c;navigate(false);});
 navigate();
}
try{
 const [a,b]=await Promise.all([fetch('./catalog.json'),fetch('../2day/albums.json')]);if(!a.ok||!b.ok)throw Error('source missing');
 [catalog,cycle]=await Promise.all([a.json(),b.json()]);
 if(catalog.schema!=='abundent/music-rooms/v0'||cycle.schema!=='abundent/album-playlist-bridge/v0'||catalog.week.letters.length!==7||catalog.rooms.length!==2)throw Error('source schema unexpected');
 weekTracks=catalog.week.letters.flatMap(letter=>letter.songs.map(track=>({...track,letter})));
 const trackMap=new Map([...weekTracks,...catalog.rooms.flatMap(room=>room.tracks)].map(track=>[track.id,track]));
 allTracks=[...new Map([...weekTracks,...catalog.rooms.flatMap(room=>room.tracks)].map(track=>[track.id,trackMap.get(track.id)])).values()];
 if(weekTracks.length!==14||catalog.rooms.map(x=>x.tracks.length).join(',')!=='8,6'||!allTracks.every(x=>valid(x.id)))throw Error('source counts unexpected');
 populate();
}catch(error){$('reading').replaceChildren(node('h3','The listening index could not be opened.'),node('p','The public playlists and a week together are still reachable through the links on this page.'));$('copy-status').textContent='The contextual index is unavailable; no source relationships have been inferred.';}
