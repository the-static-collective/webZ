/* MUSIC FIELD 003 browser panel, optional local server only.
 * Google credentials never enter this page or browser IndexedDB.
 */
const $=id=>document.getElementById(id);
const text=(id,value)=>$(id).textContent=value;
const origin=window.location.origin;
async function request(path,{method='GET',body=null}={}){
 const headers={'accept':'application/json'};
 if(body!==null)headers['content-type']='application/json';
 if(method==='POST')headers['x-music-field-action']='003';
 const response=await fetch(path,{method,body:body===null?undefined:JSON.stringify(body),credentials:'same-origin',mode:'same-origin',cache:'no-store',headers,
   redirect:'error',referrerPolicy:'no-referrer'});
 let result;try{result=await response.json()}catch{throw Error('LOCAL_BRIDGE_UNAVAILABLE')}
 if(!response.ok)throw Error(result.error||'LOCAL_BRIDGE_HOLD');
 return result;
}
export function installYoutubeBridge({onImport}){
 let pending=null,connected=false,configured=false;
 const say=s=>text('youtube-state',s);
 function controls(){
  $('yt-connect').disabled=!configured;
  $('yt-playlists').disabled=!connected;
  $('yt-link-review').disabled=!connected;
  $('yt-disconnect').disabled=!connected;
  $('yt-select').disabled=!connected||!$('yt-choose').value;
  $('yt-import').disabled=!pending||!pending.rows?.length;
 }
 async function status(){
  try{
   const info=await request('/api/youtube/status');
   if(info.schema!=='webz/music-field-youtube-status/v0')throw Error('BRIDGE_SCHEMA_MISMATCH');
   configured=info.configured;connected=info.connected;
   say(connected?'YouTube connected on this computer. Select playlists deliberately; nothing has been imported.':
    configured?'Local Google OAuth configured, but not connected. Explicit consent is required.':
     'Set a Google Desktop OAuth client ID and launch the local bridge to enable YouTube.');
  }catch{
   configured=false;connected=false;
   say('Static preview: YouTube live connection unavailable. CSV/JSON imports remain available.');
  }
  controls();
 }
 $('yt-connect').addEventListener('click',async()=>{
  try{
   const result=await request('/api/youtube/connect',{method:'POST'});
   if(typeof result.authorization_url!=='string'||!result.authorization_url.startsWith('https://accounts.google.com/o/oauth2/v2/auth?'))
    throw Error('OAUTH_DESTINATION_REFUSED');
   say('Opening Google consent. No account password is collected by Music Field.');
   window.location.assign(result.authorization_url);
  }catch(e){say('HOLD: '+e.message)}
 });
 $('yt-playlists').addEventListener('click',async()=>{
  try{
   pending=null;$('yt-choose').replaceChildren();$('yt-preview').replaceChildren();
   controls();say('Reading your available YouTube playlist names (user initiated).');
   const response=await request('/api/youtube/playlists');
   if(response.schema!=='webz/music-field-playlist-selection/v0'||!Array.isArray(response.playlists))
    throw Error('PLAYLIST_RESPONSE_INVALID');
   const placeholder=document.createElement('option');placeholder.value='';placeholder.textContent='Select one playlist';$('yt-choose').append(placeholder);
   for(const p of response.playlists){
    const opt=document.createElement('option');opt.value=p.id;
    opt.textContent=p.title+' ('+p.count+' listed items)';
    $('yt-choose').append(opt);
   }
   say(response.playlists.length+' authorized playlists listed.'+
    (response.truncated?' This first pass is capped at 100 playlists.':'')+
    ' Choose one to preview; no import has occurred.');
   controls();
  }catch(e){say('HOLD: '+e.message);await status()}
 });

 $('yt-link-review').addEventListener('click',async()=>{
  pending=null;$('yt-preview').replaceChildren();controls();
  const url=$('yt-link').value.trim();
  try{
   if(!url)throw Error('PASTE_PLAYLIST_URL_FIRST');
   say('Checking the exact shared playlist using the official YouTube API; no import.');
   const response=await request('/api/youtube/playlist-link',{method:'POST',body:{url}});
   if(response.schema!=='webz/music-field-link-review/v0'||!response.playlist?.id)
    throw Error('PLAYLIST_RESPONSE_INVALID');
   const id=response.playlist.id;
   let option=[...$('yt-choose').options].find(x=>x.value===id);
   if(!option){
    option=document.createElement('option');option.value=id;
    $('yt-choose').append(option);
   }
   option.textContent=response.playlist.title+' ('+response.playlist.count+' items)';
   $('yt-choose').value=id;
   $('yt-link').value=response.canonical_url; // drops YouTube "si" share tracking
   say('Verified playlist metadata: '+response.playlist.title+'. Click Preview selected playlist, then choose Import.');
   controls();
  }catch(e){say('HOLD: '+e.message+'. No content imported.');controls()}
 });
 $('yt-choose').addEventListener('change',()=>{
  pending=null;$('yt-preview').replaceChildren();controls();
 });
 $('yt-select').addEventListener('click',async()=>{
  const id=$('yt-choose').value;
  if(!id)return;
  try{
   say('Previewing a bounded selection; no data saved.');
   const result=await request('/api/youtube/playlist-items?id='+encodeURIComponent(id));
   if(result.schema!=='webz/music-field-youtube-selected/v0'||result.playlist.id!==id||!Array.isArray(result.rows))
    throw Error('PLAYLIST_PREVIEW_INVALID');
   pending=result;
   const label=document.createElement('p');
   label.textContent=result.rows.length+' eligible video entries from '+result.playlist.title+
     (result.truncated?' (truncated after 150 entries)':'');
   $('yt-preview').replaceChildren(label);
   const list=document.createElement('ul');list.className='preview-list';
   for(const row of result.rows.slice(0,12)){
    const li=document.createElement('li');li.textContent=row.title+' — '+row.artist;list.append(li);
   }
   $('yt-preview').append(list);
   say('Private preview loaded. Click Import selected playlist to add these records to your local graph.');
   controls();
  }catch(e){pending=null;say('HOLD: '+e.message);controls()}
 });
 $('yt-import').addEventListener('click',()=>{
  if(!pending)return;
  try{
   onImport(pending.rows);
   say('Selected YouTube metadata added to the in-memory Music Field. Save snapshot only if you choose.');
   pending=null;$('yt-preview').replaceChildren();controls();
  }catch(e){say('HOLD: '+e.message+'. Existing catalog preserved.')}
 });
 $('yt-disconnect').addEventListener('click',async()=>{
  // Always clear private preview; there is no automatic saved music deletion.
  pending=null;$('yt-preview').replaceChildren();$('yt-choose').replaceChildren();
  try{
   const response=await request('/api/youtube/disconnect',{method:'POST'});
   connected=false;controls();
   say(response.remotelyRevoked?
    'Local Google session cleared and Google confirmed token revocation. Imported metadata remains until you clear it.':
    'Local session cleared; Google revocation NOT confirmed. Revoke Music Field access in Google Account connections if needed. Existing imported metadata remains.');
  }catch(e){connected=false;controls();say('HOLD: '+e.message+'. Local server connection unavailable. Restart to clear its in-memory tokens.')}
 });
 status();
}
