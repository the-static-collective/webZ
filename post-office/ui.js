// Browser-only operator UI: no token, code or email body goes into localStorage, URLs, or analytics.
const api='/api/post-office/panel';
const byId=id=>document.getElementById(id);
const status=byId('status');
const request=byId('request'),verify=byId('verify'),code=byId('code');
const lock=byId('lock'),desk=byId('desk'),queue=byId('queue'),logout=byId('logout');
let csrf='',sending=false;
function announce(msg){status.textContent=msg}
async function post(body,extra={}){
  const res=await fetch(api,{method:'POST',credentials:'same-origin',
    headers:{'Content-Type':'application/json',...extra},
    cache:'no-store',body:JSON.stringify(body)});
  let payload;try{payload=await res.json()}catch{throw Error('No usable response from Post Office.')}
  return {ok:res.ok,status:res.status,...payload};
}
async function refresh(){
  const res=await fetch(api,{credentials:'same-origin',cache:'no-store'});
  if(res.status===401){csrf='';lock.hidden=false;desk.hidden=true;queue.replaceChildren();return}
  if(!res.ok){announce('HOLD: operator desk unavailable ('+res.status+').');return}
  const data=await res.json();csrf=data.csrf;
  if(data.state!=='AUTHORIZED'||!Array.isArray(data.messages)){announce('HOLD: unexpected desk response.');return}
  lock.hidden=true;desk.hidden=false;queue.replaceChildren();
  for(const message of data.messages){
    const card=document.createElement('article');card.className='letter';
    const head=document.createElement('h3');head.textContent='Reviewed letter · '+message.messageId;card.append(head);
    const dl=document.createElement('dl');
    for(const [label,value] of [['From',message.from],['To',message.to],['Subject',message.subject]]){
      const dt=document.createElement('dt');dt.textContent=label;
      const dd=document.createElement('dd');dd.textContent=value;dl.append(dt,dd);
    }
    card.append(dl);
    const copy=document.createElement('div');copy.className='copy';copy.textContent=message.text;card.append(copy);
    const check=document.createElement('label');check.className='confirm';
    const box=document.createElement('input');box.type='checkbox';box.autocomplete='off';
    const txt=document.createElement('span');
    txt.textContent='I have reviewed the exact recipient and letter. I authorize this one external send.';
    check.append(box,txt);card.append(check);
    const sendBtn=document.createElement('button');sendBtn.type='button';sendBtn.className='send';
    sendBtn.textContent='Send this approved letter';sendBtn.disabled=true;
    box.addEventListener('change',()=>{sendBtn.disabled=!box.checked||sending});
    sendBtn.addEventListener('click',async()=>{
      if(!box.checked||sending)return;
      sending=true;sendBtn.disabled=true;box.disabled=true;announce('Sending request to provider…');
      try{
        const result=await post({action:'send',confirm:'SEND',messageId:message.messageId},{'X-Post-Office-CSRF':csrf});
        if(result.state==='PROVIDER_ACCEPTED'){
          announce('PROVIDER ACCEPTED · Receipt '+result.providerId+'. Delivery NOT confirmed. Do not retry without checking provider history.');
          sendBtn.textContent='Provider accepted — inspect receipt';
        }else{
          announce('HOLD · '+(result.reason||'Unconfirmed send')+'. Inspect provider history before any retry.');
          sendBtn.textContent='HOLD — inspect provider history';
        }
      }catch{announce('HOLD · Network result unknown. Inspect provider history before retry.');sendBtn.textContent='HOLD — check provider';}
      // Deliberately leave button locked for the current tab after any attempted dispatch.
      sending=false;
    });
    card.append(sendBtn);queue.append(card);
  }
  announce('Authorized. Review each letter before sending. Nothing has been sent by signing in.');
}
request.addEventListener('click',async()=>{
  request.disabled=true;announce('Requesting private owner access code…');
  try{
    const r=await post({action:'request-code'});
    announce(r.state==='CODE_PROVIDER_ACCEPTED'
      ? 'Code accepted by mail provider (not confirmed delivered). Check the existing owner inbox.'
      : 'HOLD · '+(r.reason||'Code request was not accepted')+'.');
  }catch{announce('HOLD · Unable to request code.')}
  request.disabled=false;
});
verify.addEventListener('click',async()=>{
  const pin=code.value.trim();
  if(!/^[0-9]{12}$/.test(pin)){announce('Enter the 12-digit code from your owner inbox.');return}
  verify.disabled=true;
  try{
    const r=await post({action:'verify-code',code:pin});code.value='';
    if(r.state==='SIGNED_IN'){await refresh()}else{announce('HOLD · '+(r.reason||'Unable to authenticate'))}
  }catch{announce('HOLD · Unable to authenticate.');code.value=''}
  verify.disabled=false;
});
logout.addEventListener('click',async()=>{
  logout.disabled=true;
  try{
    const r=await post({action:'logout'},{'X-Post-Office-CSRF':csrf});
    if(r.state==='SIGNED_OUT'){csrf='';queue.replaceChildren();await refresh();announce('Signed out.')}
    else announce('HOLD · Unable to sign out. Close the browser tab.');
  }catch{announce('HOLD · Sign-out network error. Close the tab.')}
  logout.disabled=false;
});
refresh().catch(()=>announce('HOLD · Unable to reach Post Office.'));
