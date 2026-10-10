import {compose,receipt,exportPacket} from './engine.mjs';
const $=id=>document.getElementById(id);
let packet=null;
for(const n of ['weather','distance','roughness'])$(n).addEventListener('input',()=>{$(n+'-value').textContent=$(n).value;});
const panel=(beat,number,direction,caption)=>{
 const article=document.createElement('article');article.className='panel illustrated';
 const badge=document.createElement('span');badge.textContent=number+' / '+beat;
 const scene=document.createElement('div');scene.className='scene';scene.setAttribute('aria-hidden','true');
 const captionNode=document.createElement('p');captionNode.textContent=caption;
 const directionNode=document.createElement('small');directionNode.textContent=direction;
 article.append(badge,scene,captionNode,directionNode);return article;
};
$('seed-form').addEventListener('submit',async event=>{
 event.preventDefault();$('status').textContent='Composing on this device…';$('download').disabled=true;packet=null;
 const form=new FormData(event.currentTarget);const seed=compose(Object.fromEntries(form.entries()));
 $('panels').replaceChildren(...seed.panels.map((p,i)=>panel(p.beat,['Ⅰ','Ⅱ','Ⅲ'][i],p.direction,p.caption)));
 $('result-title').textContent=seed.title;$('result-subtitle').textContent=seed.treatment.sky+' · '+seed.treatment.shot+' · '+seed.treatment.texture;
 try{
  const r=await receipt(seed);packet=exportPacket(seed,r);$('receipt').textContent=JSON.stringify(r,null,2);$('receipt-wrap').hidden=false;$('download').disabled=false;$('stamp').textContent='LOCAL SEED';$('status').textContent='Composed locally. No server received the source. The receipt records a hash, not verified ownership, delivery, or publication.';
 }catch(e){$('stamp').textContent='NO RECEIPT';$('receipt-wrap').hidden=true;$('status').textContent='Seed composed; receipt on HOLD because SHA-256 is unavailable in this browser context. Open the page over HTTPS or localhost to export.';}
});
$('download').addEventListener('click',()=>{
 if(!packet)return;
 const blob=new Blob([JSON.stringify(packet,null,2)+'\n'],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='abundent-manga-seed.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),4000);
 $('status').textContent='Local JSON packet prepared. Its presence on your device does not publish it to anyone else.';
});
$('reset').addEventListener('click',()=>{
 packet=null;$('download').disabled=true;$('receipt-wrap').hidden=true;$('stamp').textContent='WAITING';
 $('panels').replaceChildren(...['Arrival','Encounter','Return'].map((name,i)=>{const a=document.createElement('article');a.className='panel waiting';const s=document.createElement('span');s.textContent=['Ⅰ','Ⅱ','Ⅲ'][i];const p=document.createElement('p');p.textContent=name;a.append(s,p);return a;}));
 $('result-title').textContent='An unfinished invitation.';$('result-subtitle').textContent='Choose Compose to receive a three-panel manga storyboard seed here.';$('status').textContent='Local result cleared. No remote effects.';
});