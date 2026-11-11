// Pure local projection rules; no generated story is claimed as original source.
export const SOURCE=Object.freeze({id:'010bc866-6eba-4b6b-8e2e-fdf64917d14c',sha256:'28ad7d77f0da36e41ca8fa6fe82a36e3a0ad5862f652ca237e3ae680f553d072'});
export const DIALS=Object.freeze([
{key:'world',title:'01 · World',options:['Source','Manga','Garden','Signal'],default:0,help:'Which kind of door?'},
{key:'distance',title:'02 · Distance',options:['Close','Room','Landscape'],default:1,help:'How far from the seed?'},
{key:'material',title:'03 · Material',options:['Moss','Paper','Neon'],default:0,help:'What surface carries it?'},
{key:'time',title:'04 · Time',options:['Origin','Becoming','Afterglow'],default:1,help:'Which part of the journey?'},
{key:'focus',title:'05 · Focus',options:['Voice','Circuit','Door'],default:2,help:'Where attention goes.'},
{key:'form',title:'06 · Form',options:['Lines','Panels','Constellation'],default:1,help:'How ideas are arranged.'},
{key:'density',title:'07 · Density',options:['Sparse','Balanced','Full'],default:1,help:'Number of frames.'},
{key:'grain',title:'08 · Grain',options:['Clean','Rough'],default:0,help:'A visual treatment.'},
{key:'motion',title:'09 · Motion',options:['Still','Breathe','Pulse'],default:0,help:'Respect reduced-motion settings.'},
{key:'witness',title:'10 · Witness',options:['Story','Source fields','Uncertainty'],default:0,help:'What is actually known?'},
{key:'growth',title:'11 · Growth',options:['Seed','Sprout','Canopy'],default:0,help:'A speculative scale, not a public state.'}
]);
const phrases={
 Source:['Midnight on the screen','One line turns to nine','New doors in the dark','Make it real'],
 Manga:['THE CURSOR STIRS','A CIRCUIT OPENS','THE KEY HOVERS','THE PAGE TURNS'],
 Garden:['a tiny spark','roots beneath the circuit','a door among the leaves','a place for another seed'],
 Signal:['source: 010bc866','carrier: music','packet: invitation','receiver: human choice']
};
export function project(values){
 const pick=d=>DIALS.find(x=>x.key===d).options[values[d]];
 const mode=pick('world'),material=pick('material'),grain=pick('grain'),motion=pick('motion');
 const count=[2,3,4][values.density];
 const titles={Source:'The little spark',Manga:'The code turns a page',Garden:'Plant a song',Signal:'A door is not a crossing'};
 const witnesses=['Interpretive text only, composed from themes in the song.','Track tag: thestaticcollective. Embedded creation tags disagree. SHA-256 fingerprint recorded.','Unresolved: no verified public landing deployment, no signed receipts, no remote contribution admission.'];
 const lead=phrases[mode].slice(0,count);
 const body='A '+pick('distance').toLowerCase()+' view in '+material.toLowerCase()+', attending to '+pick('focus').toLowerCase()+'. Time: '+pick('time').toLowerCase()+'. Layout: '+pick('form').toLowerCase()+'.';
 const growth=pick('growth');
 return {mode,material,grain,motion,title:titles[mode],body,tiles:lead,detail:witnesses[values.witness]+' Growth visualization: '+growth+'. This is a reversible projection, not the source artifact.'};
}
export function validateOffer(o){
 if(!o||typeof o!=='object'||Array.isArray(o))return {ok:false,reason:'Not an offer object.'};
 if(o.schema!=='webz/postcard-offer/v0'||o.source_id!==SOURCE.id)return {ok:false,reason:'Wrong schema or source song.'};
 if(typeof o.id!=='string'||!/^[-a-zA-Z0-9]{8,80}$/.test(o.id))return {ok:false,reason:'Invalid proposal ID.'};
 if(typeof o.alias!=='string'||o.alias.trim().length<1||o.alias.length>48)return {ok:false,reason:'Alias length must be 1–48.'};
 if(typeof o.note!=='string'||o.note.trim().length<1||o.note.length>400)return {ok:false,reason:'Note length must be 1–400.'};
 if(typeof o.created_at!=='string'||o.created_at.length>40||!Number.isFinite(Date.parse(o.created_at)))return {ok:false,reason:'Invalid proposal date.'};
 return {ok:true};
}
export function stringifyOffer(o){return JSON.stringify({schema:o.schema,id:o.id,source_id:o.source_id,alias:o.alias,note:o.note,created_at:o.created_at},null,2)+'\n';}