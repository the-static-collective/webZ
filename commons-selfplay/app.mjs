import {origin,seal,inspect,experiment,verifyPair,POLICIES,MODE} from './engine.mjs';
const $=id=>document.getElementById(id);
let shelf=[],last=null,busy=false;
function status(msg){$('status').textContent=msg;}
function choose(option){const o=document.createElement('option');o.value=String(shelf.length);o.textContent=option.label;$('parent').append(o);shelf.push(option);}
function reset(seed){
 shelf=[];last=null;$('parent').replaceChildren();$('compare').hidden=true;$('download').disabled=true;
 return seal(origin(seed)).then(packet=>{choose({label:'Origin · seed '+seed+' · day 0',packet});status('New fictional origin created. Choose the same starting world for two policy branches.');});
}
function tileMap(target,world){
 const grid=$(target);grid.replaceChildren();const locations=new Map();
 for(const actor of world.actors){const key=actor.y*8+actor.x;locations.set(key,[...(locations.get(key)||[]),actor]);}
 for(let index=0;index<64;index++){
   const cell=document.createElement('div'),found=locations.get(index)||[];
   cell.className='tile '+(found[0]?.role||'empty');
   cell.textContent=found.length?found.map(a=>a.id.slice(1)).join(','):'·';
   if(found.length)cell.title=found.map(a=>a.id+' '+a.role+' · food '+a.stock.food+' · '+(a.willing?'willing':'declines')).join(' | ');
   grid.append(cell);
 }
}
function metrics(id,score,w){
 const t=score;
 $(id).textContent='Daily rations met: '+t.fed+'\nUnmet rations: '+t.unmet+'\nUnused food spoiled: '+t.spoiled+
  '\nVoluntary food transfers: '+t.transfers+'\nRefusals: '+t.refusals+
  '\nShared bridges: '+t.structures+'\nCurrent bridge: '+(w.infrastructure.bridge?'built':'not built');
}
function trace(target,world){
 const node=$(target);node.replaceChildren();
 for(const event of world.trace.slice(-9).reverse()){
   const p=document.createElement('p');p.textContent='DAY '+event.day+' · '+event.type+' — '+event.detail;node.append(p);
 }
}
function render(pair){
 const {parent,isolated,commons,isolatedScore:a,commonsScore:b}=pair;
 $('compare').hidden=false;
 $('diff').textContent='Commons: '+(b.fed-a.fed>=0?'+':'')+(b.fed-a.fed)+' rations met vs isolated';
 for(const [id,packet,score] of [['a',isolated,a],['b',commons,b]]){
   tileMap('map-'+id,packet.world);
   metrics('stats-'+id,score,packet.world);
   $('hash-'+id).textContent='Snapshot SHA-256: '+packet.contentHash.slice(0,16)+'… · parent '+packet.world.parentHash.slice(0,16)+'… · day '+packet.world.day;
   trace('log-'+id,packet.world);
 }
 $('result').textContent='From parent '+parent.contentHash.slice(0,16)+'… at day '+parent.world.day+
   ', both worlds ran '+pair.days+' identical-duration scripted days. Policy A met '+a.fed+
   ' ration requests and policy B met '+b.fed+'. Under these fixed rules, this is a difference of '+
   (b.fed-a.fed)+' met rations. The director event '+pair.intervention+
   ' was applied to both branches. All twelve actors and every refusal are fictional.';
 $('download').disabled=false;
}
async function doRun(){
 if(busy)return;busy=true;$('simulate').disabled=true;
 try{
   const index=Number($('parent').value);
   const parent=shelf[index]?.packet;
   const days=Number($('days').value),event=$('event').value;
   if(!parent)throw Error('Choose a preserved world.');
   const pair=await experiment(parent,days,event);
   await verifyPair(pair);
   last=pair;render(pair);
   if(shelf.length<24){
     for(const [title,pkt] of [['Isolated',pair.isolated],['Commons',pair.commons]])
       choose({label:title+' · day '+pkt.world.day+' · '+pkt.contentHash.slice(0,10),packet:pkt});
   }
   status('Two immutable branches saved. Select either snapshot as the next parent, or download the fictional family.');
 }catch(err){status('Simulation could not proceed: '+err.message);}
 finally{busy=false;$('simulate').disabled=false;}
}
$('simulate').addEventListener('click',doRun);
$('new-world').addEventListener('click',async ()=>{
 if(busy)return;busy=true;
 try{await reset(Number($('seed').value));}catch(e){status('No new world: '+e.message);}
 finally{busy=false;}
});
$('download').addEventListener('click',()=>{
 if(!last)return;
 const data={kind:'FICTIONAL_WORLD_FAMILY_NOT_REAL_EVIDENCE',mode:MODE,version:1,
   note:'Hash-checked snapshots, NOT authenticated signatures or real human outcomes.',pair:last};
 const b=new Blob([JSON.stringify(data,null,2)+'\n'],{type:'application/json'});
 const u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='FAKE-WORLD-commons-selfplay.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);
});
$('import').addEventListener('change',async e=>{
 try{
   const file=e.target.files?.[0];if(!file)return;
   if(file.size>450000)throw Error('The file is too large for this toy world.');
   const data=JSON.parse(await file.text());
   if(data.kind!=='FICTIONAL_WORLD_FAMILY_NOT_REAL_EVIDENCE'||data.mode!==MODE)throw Error('Not a fictional family.');
   await verifyPair(data.pair);
   last=data.pair;render(last);
   for(const [label,pkt] of [['Imported parent',last.parent],['Imported isolated',last.isolated],['Imported commons',last.commons]]){
     if(shelf.length<24)choose({label:label+' · day '+pkt.world.day,packet:pkt});
   }
   status('Hash consistency checked. Imported content is UNTRUSTED and proves no real event. The family can be used as fictional branch input.');
 }catch(err){status('Import refused: '+err.message);}
 e.target.value='';
});
await reset(41);
