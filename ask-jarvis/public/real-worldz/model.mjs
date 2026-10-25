// REAL WORLDZ 001 • safe, source-bounded local proposals and private notes.
// This bridge carries fictional preference signals, never achievements, Deeds, grants or field results.
import {PLACE_BY_ID,PLACES,WAY_BY_ID,SOURCE_CARDS,SNAPSHOT_COMMIT,SNAPSHOT_DATE} from './places.mjs';
import {importSimulation} from '../labs/living-watershed/world.mjs';
const pathRoles={
  'willow-first-look':'Observer','willow-storykeeper':'Storykeeper',
  'willow-connector':'Connector','willow-caretaker':'Caretaker',
  'willow-steward':'Steward','willow-researcher':'Researcher'
};
const MAX_NOTE=800;
export function geography(){
 const bounds={minLat:44.150,maxLat:44.185,minLon:-94.055,maxLon:-93.985};
 return PLACES.map(p=>({
  id:p.id,lat:p.latitude,lon:p.longitude,
  left:((p.longitude-bounds.minLon)/(bounds.maxLon-bounds.minLon))*100,
  top:((bounds.maxLat-p.latitude)/(bounds.maxLat-bounds.minLat))*100
 }));
}
export function findPlace(id){
 if(!Object.hasOwn(PLACE_BY_ID,id))throw Error('UNKNOWN_PLACE');
 return PLACE_BY_ID[id];
}
export function findWay(id){
 if(!Object.hasOwn(WAY_BY_ID,id))throw Error('UNKNOWN_PARTICIPATION_WAY');
 return WAY_BY_ID[id];
}
export function mapLink(id){
 const p=findPlace(id);
 const lat=p.latitude.toFixed(5),lon=p.longitude.toFixed(5);
 return 'https://www.openstreetmap.org/?mlat='+lat+'&mlon='+lon+'#map=15/'+lat+'/'+lon;
}
export function draftPublicQuest(placeId,wayId){
 const p=findPlace(placeId),w=findWay(wayId);
 return {
  schema:'real-worldz.source-only-invitation/v0',
  status:'HOLD_UNPUBLISHED',
  source_snapshot_commit:SNAPSHOT_COMMIT,
  source_snapshot_date:SNAPSHOT_DATE,
  place_reference:{id:p.id,name:p.name,approx_latitude:p.latitude,approx_longitude:p.longitude,
     geocode_precision:'APPROXIMATE_NOT_ENTRANCE_OR_VERIFIED_CONDITION',source_url:p.source.url},
  path:{id:w.id,kind:w.type,public_question:p.prompt},
  owner_authorized:false,site_permission_obtained:false,actual_work_performed:false,
  separately_witnessed:false,measured_pollution:false,proven_impact:false,
  full_measure_deed:'NOT_AWARDED',gro_action:'NOT_PERFORMED',
  recipient:null,person_identifiers:[],report_values:[],user_note_included:false,
  next:'Human source-owner, land steward and safety review would be needed before a real task. This JSON is a held question, not a request or enrollment.'
 };
}
export function verifyDraft(raw){
 if(!raw||raw.schema!=='real-worldz.source-only-invitation/v0'||!raw.place_reference||!raw.path)
 throw Error('INVALID_DRAFT');
 const expected=draftPublicQuest(raw.place_reference.id,raw.path.id);
 if(JSON.stringify(raw)!==JSON.stringify(expected))throw Error('CHANGED_DRAFT');
 return expected;
}
export function privateFieldNote(placeId,wayId,text,deviceTime=new Date().toISOString()){
 const p=findPlace(placeId),w=findWay(wayId);
 if(typeof text!=='string'||!text.trim()||text.length>MAX_NOTE)throw Error('INVALID_NOTE_TEXT');
 if(typeof deviceTime!=='string'||deviceTime.length>45||!Number.isFinite(Date.parse(deviceTime)))
 throw Error('INVALID_DEVICE_TIME');
 return {
 schema:'real-worldz.private-note/v0',storage:'LOCAL_DOWNLOAD_ONLY',publication:'NONE',
 selected_place:p.name,place_reference:p.id,path:w.id,
 device_clock_time_unverified:deviceTime,
 observation:text.trim(),
 evidence_state:'UNVERIFIED_SELF_REPORT_OR_REFLECTION',geo_precision:'APPROXIMATE_PARK',
 source_snapshot_commit:SNAPSHOT_COMMIT,
 full_measure_deed:'NOT_AWARDED',gro_action:'NONE',environmental_verdict:'NONE',
 note:'Not an environmental measurement, safety assessment, sourced observation, partner report or completed volunteer assignment.'
 };
}
export function importedFiction(file){
 const world=importSimulation(file);
 const counts=Object.fromEntries(Object.values(pathRoles).map(role=>[role,0]));
 for(const e of world.events)if(e.choice==='SIMULATE'&&Object.hasOwn(pathRoles,e.quest_id))
 counts[pathRoles[e.quest_id]]++;
 const entries=Object.entries(counts).sort((a,b)=>b[1]-a[1]);
 const preferred=entries[0][1]>0?entries[0][0]:null;
 return {source:'FICTION_ONLY',fictional_turns:world.events.length,
  favorite_fictional_path:preferred,counts,actual_service_credit:0,
  real_world_permission:false,environmental_result:false,
  suggestion:preferred?('Your fictional '+preferred+' route was the most explored. That is a preference hint, not proof of real-world participation.'):
  'You can start anywhere. Your fictional save gives no real-world credit.'};
}
export function sourceLinks(id){
 const p=findPlace(id);
 return [p.source,SOURCE_CARDS.bridge,SOURCE_CARDS.opening,SOURCE_CARDS.dnr,
 SOURCE_CARDS.explorer,SOURCE_CARDS.mpca,SOURCE_CARDS.river,SOURCE_CARDS.eco,SOURCE_CARDS.adopt];
}
