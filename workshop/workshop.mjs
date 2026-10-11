// Read-only dated projection. No GitHub API, source execution or HTML injection.
const cards=document.getElementById('cards'),counter=document.getElementById('count'),select=document.getElementById('field');
const mk=(tag,text,cls)=>{const x=document.createElement(tag);if(text!==undefined)x.textContent=text;if(cls)x.className=cls;return x;};
const url=(repository,commit,path)=>'https://github.com/'+repository+'/blob/'+commit+'/'+path;
const addLink=(parent,label,href)=>{const x=mk('a',label);x.href=href;x.target='_blank';x.rel='noopener noreferrer';parent.append(x);};
function render(capabilities,filter){
 const visible=capabilities.filter(c=>filter==='all'||c.field===filter);
 cards.replaceChildren();counter.textContent=visible.length+' source-pinned capabilities';
 for(const c of visible){
   const a=mk('article');
   a.append(mk('div',c.field+' · '+c.runtime,'meta'),mk('h2',c.name),mk('p',c.summary));
   const links=mk('div',undefined,'links');
   addLink(links,'Read exact code ↗',url(c.repo,c.commit,c.path));
   addLink(links,'CI witness ↗',c.ci);
   a.append(links);
   const details=mk('details'),sum=mk('summary','Trace this branch');details.append(sum);
   details.append(mk('p','Repository: '+c.repo),mk('p','Branch hint: '+c.branch),mk('code','Commit: '+c.commit));
   details.append(mk('p','Remaining gate: '+c.gate,'gate'));
   a.append(details);cards.append(a);
 }
}
async function start(){
 try{
   const r=await fetch('./catalog.json',{cache:'no-cache'});if(!r.ok)throw Error('Unavailable');
   const data=await r.json();
   if(data.schema!=='abundent/branch-workshop-catalog/v0'||!Array.isArray(data.capabilities))throw Error('Unrecognized catalog');
   const rows=data.capabilities;
   if(!rows.every(c=>/^[0-9a-f]{40}$/.test(c.commit)&&/^[a-z0-9_.-]+\/[a-z0-9_.-]+$/i.test(c.repo)&&
      /^[a-z0-9_.\/-]+$/i.test(c.path)&&!c.path.split('/').includes('..')&&
      c.ci.startsWith('https://github.com/'+c.repo+'/actions/runs/')))throw Error('Unsafe catalog reference');
   document.getElementById('origin').textContent='Catalog observed '+data.snapshotDate+'. Source: '+data.source+'. Pinned sources are not a live branch status feed.';
   select.addEventListener('change',()=>render(rows,select.value));render(rows,select.value);
 }catch(e){counter.textContent='Catalog unavailable';cards.replaceChildren(mk('p','The catalog could not be read. No capabilities have been inferred. Visit the source repositories directly.'));}
}
start();
