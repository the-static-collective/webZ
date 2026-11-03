(function () {
  'use strict';
  var C = window.AbundentCircuit; var STOREKEY = 'abundent-circuit001-local-v1';
  var st, activeTab = 'overview', noticeTimer, nativeAvailable = false, nativePending = false, peerAvailable = false, peerPending = false, minecraftEnabled = false, mcPending = false;
  try { var stored = JSON.parse(localStorage.getItem(STOREKEY) || 'null'); C.checkStore(stored); st = stored; }
  catch (_) { st = C.init(); }
  function $(q) { return document.querySelector(q); }
  function esc(v) { return String(v === null || v === undefined ? '' : v).replace(/[&<>"']/g, function (c) {
    return {'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c];
  }); }
  function empty(text) { return '<div class="empty">' + esc(text) + '</div>'; }
  function s(v) { return esc(v); }
  function notify(message) { var el = $('#notice'); el.textContent = message; el.className = 'on';
    clearTimeout(noticeTimer); noticeTimer = setTimeout(function () { el.className = ''; }, 4800); }
  function persist() { try { localStorage.setItem(STOREKEY, JSON.stringify(st)); } catch (_) { notify('Local storage unavailable. Export a backup before leaving.'); } }
  function data(form, key) { var field = form.elements.namedItem(key); return field ? String(field.value) : ''; }
  function button(act, text, id, style) { return '<button class="btn ' + (style || 'btn') + '" data-click="' + esc(act) + '" data-id="' + esc(id) + '">' + esc(text) + '</button>'; }
  function form(act, id, fields, label) { return '<form data-act="' + act + '" data-id="' + esc(id) + '"><div class="formfields">' + fields +
     '</div><button class="btn primary">' + esc(label) + '</button></form>'; }
  function input(name, placeholder, max, required) { return '<label>' + esc(placeholder) + '</label><input name="' + esc(name) + '" maxlength="' + max + '" ' + (required ? 'required ' : '') + 'placeholder="' + esc(placeholder) + '">'; }
  function textarea(name, label, max) { return '<label>' + esc(label) + '</label><textarea name="' + esc(name) + '" maxlength="' + max + '" required></textarea>'; }
  function current() { return st.active ? C.node(st, st.active) : null; }
  function safeRun(fn) { try { fn(); persist(); render(); } catch (err) { notify('Not completed: ' + err.message); } }
  function demo() { if (st.nodes.length && !confirm('Add two fictional demonstration harbors to the existing local notebook?')) return;
    var a = C.createNode(st, 'Fictional Fellowship Harbor', 'community gathering');
    var b = C.createNode(st, 'Fictional Maker Workshop', 'maker collective');
    C.invitation(st, a.id, 'Come to a pretend music-and-garden gathering', 'Bring a song, a question, or just yourself. This is a fictional test invitation.');
    C.createProject(st, a.id, 'Sample Lantern Festival', 'Practice a small, free festival; venue and people are fictional.', 'festival');
    C.createProject(st, b.id, 'Sample Workshop', 'Practice preparing a portable event flyer.', 'maker');
    st.active = a.id; persist(); render(); notify('Two fictional harbors loaded. Try the project and crossing flows.'); }
  function download(filename, content, mime) { var blob = new Blob([content], {type: mime || 'application/json'});
    var url = URL.createObjectURL(blob); var a = document.createElement('a'); a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.parentNode.removeChild(a); setTimeout(function () { URL.revokeObjectURL(url); }, 9000); }
  function asJson(obj, filename) { download(filename, JSON.stringify(obj, null, 2) + '\n', 'application/json'); }
  function readFile(file, done) { if (!file || file.size > 3000000) return notify('File missing or above 3 MB limit.');
    var r = new FileReader(); r.onload = function () { try { done(JSON.parse(r.result)); } catch (e) { notify('Import refused: ' + e.message); } };
    r.onerror = function () { notify('Could not read this file.'); }; r.readAsText(file); }
  function importObject(raw) { var schema = raw && raw.schema, n = current();
    if (schema === C.SCHEMA) { C.checkStore(raw); if (!confirm('Replace every local harbor and notebook entry with this unauthenticated backup?')) return; st = raw; }
    else if (schema === C.CROSSING) { if (!n) throw Error('Create a receiving harbor first.'); C.receive(st, n.id, raw); activeTab = 'crossings'; }
    else if (schema === C.RETURN) { if (!n) throw Error('Create a source harbor first.'); C.receiveReturn(st, n.id, raw); activeTab = 'crossings'; }
    else if (schema === C.CARTRIDGE) { if (!n) throw Error('Create an adopting harbor first.'); C.adopt(st, n.id, raw); activeTab = 'projects'; }
    else throw Error('Unsupported JSON schema.');
    persist(); render(); notify('Local import accepted for inspection; no external identity was authenticated.'); }
  function render() { var n = current(); $('#onboard').hidden = !!n; $('#workspace').hidden = !n;
    $('#nodeSelect').innerHTML = st.nodes.length ? st.nodes.map(function (x) { return '<option value="' + esc(x.id) + '"' + (x.id === st.active ? ' selected':'') + '>' + esc(x.label) + '</option>'; }).join('') : '<option>No harbor yet</option>';
    document.querySelectorAll('[data-tab]').forEach(function (b) { b.setAttribute('aria-selected', b.getAttribute('data-tab') === activeTab ? 'true' : 'false'); });
    document.querySelectorAll('.section').forEach(function (sec) { sec.className = 'section' + (sec.id === activeTab ? ' active' : ''); });
    if (!n) return;
    var view = C.projectView(st, n.id);
    $('#metrics').innerHTML = [['Harbors', st.nodes.length], ['Invitations (draft)', n.invites.length], ['Proposed / ongoing', view.quests],
      ['Reviewed-confirmed', view.deeds], ['Crossings on HOLD', n.inbox.filter(function (x) { return x.disposition === 'HOLD'; }).length], ['Transferable methods', n.cartridges.length]]
      .map(function (x) { return '<div class="card"><p class="tiny-head">' + esc(x[0]) + '</p><p class="metric">' + x[1] + '</p></div>'; }).join('');
    $('#harborInfo').innerHTML = '<p><strong>' + esc(n.label) + '</strong> · ' + esc(n.kind) + '</p><p class="micro">Public routing address (copy to an inviter on another device; not proof of identity): <code>' + esc(n.id) + '</code></p>';
    $('#journal').innerHTML = st.journal.length ? st.journal.slice(0, 8).map(function (e) { return '<p class="micro"><b>' + esc(e.kind.replace(/_/g, ' ')) + '</b> · ' + esc(e.node) + '<br>' + esc(e.at.slice(0, 16)) + '</p>'; }).join('') : empty('No local work recorded yet.');
    $('#invites').innerHTML = n.invites.length ? n.invites.map(function (v) { return '<article class="item"><span class="pill proposed">UNSENT DRAFT</span><h3>' + s(v.title) + '</h3><p>' + s(v.text) + '</p>' + button('download-invite', 'Download invitation', v.id, 'btn') + '</article>'; }).join('') : empty('No invitations drafted here yet.');
    $('#fullMeasure').innerHTML = '<div class="statrow">' + [['Seeds',view.seeds],['Quests',view.quests],['Deeds',view.deeds],['Harvests',view.harvests],['Gifts',view.gifts],['Witness labels',view.witness]].map(function (x) {
      return '<div class="stat"><strong>' + x[1] + '</strong><span class="micro">' + s(x[0]) + '</span></div>'; }).join('') + '</div>';
    $('#affordances').innerHTML = view.affordances.length ? view.affordances.map(function (a) {return '<div class="item"><strong>' + s(a.name) + '</strong><p class="micro">Source ' + s(a.from) + ' · Self-attested review; not verified identity</p></div>'; }).join('') : empty('An independently labeled review can open the first proposed affordance.');
    $('#projectsList').innerHTML = n.projects.length ? n.projects.map(function (p) {
      var pill = p.state === 'CONFIRMED' ? 'done' : p.state === 'DISPUTED' ? 'refuse' : p.state === 'PROPOSED' ? 'proposed' : 'held';
      var html = '<article class="item seed"><span class="pill ' + pill + '">' + s(p.state) + '</span><span class="micro"> · ' + s(p.id) + ' / ' + s(p.kind) + '</span><h3>' + s(p.title) + '</h3><p>' + s(p.purpose) + '</p>';
      if (p.parent) html += '<p class="lineage">Adapted from: ' + s(p.parent) + ' — no inherited authority.</p>';
      if (p.state === 'PROPOSED') html += form('accept', p.id, input('actor','Person actually accepting the task',80,true) + textarea('scope','Exact bounded scope + local permission',400), 'Record self-attested acceptance');
      if (p.state === 'ACCEPTED') html += '<p class="micro">Accepted by: ' + s(p.actor) + ' · Scope: ' + s(p.scope) + '</p>' + form('report', p.id, input('actor','Repeat accepting actor label',80,true) + textarea('report','Describe what was actually done',800),'Report work (not yet confirmed)');
      if (p.state === 'REPORTED') html += '<p><b>Reported by ' + s(p.actor) + ':</b> ' + s(p.report) + '</p>' + form('confirm',p.id,input('reviewer','Different reviewing person label',80,true) + '<label>Review</label><select name="result"><option value="CONFIRMED">Confirm</option><option value="DISPUTED">Dispute</option></select>' + '<label>Capability opened if confirmed</label><textarea name="capability" maxlength="140"></textarea>', 'Record separate reviewer disposition');
      if (p.state === 'CONFIRMED' || p.state === 'DISPUTED') html += '<p class="small"><b>' + s(p.reviewer) + '</b> entered ' + s(p.outcome) + '. ' + (p.capability ? 'Proposed new capacity: ' + s(p.capability) : '') + '</p>';
      return html + '</article>';
    }).join('') : empty('Plant a seed to begin. Nothing becomes a Deed without a separate reviewer label.');
    $('#crossProject').innerHTML = n.projects.map(function (p) { return '<option value="' + s(p.id) + '">' + s(p.title) + ' (' + s(p.state) + ')</option>'; }).join('') || '<option value="">Create a seed first</option>';
    $('#crossDest').innerHTML = st.nodes.filter(function (x) {return x.id !== n.id;}).map(function (x) {return '<option value="' + s(x.id) + '">' + s(x.label) + '</option>';}).join('') + '<option value="__external__">External harbor on another device (paste address below)</option>';
    $('#inbound').innerHTML = n.inbox.length ? n.inbox.map(function (x) {
      var html = '<article class="item blue"><span class="pill ' + (x.disposition === 'HOLD' ? 'held' : x.disposition === 'REFUSE' ? 'refuse' : 'done') + '">' + s(x.disposition) + '</span><h3>' + s(x.packet.proposal.title) + '</h3><p>' + s(x.packet.proposal.purpose) + '</p><p class="micro">From ' + s(x.packet.sourceLabel) + ' · ' + s(x.packet.id) + '</p>';
      if (x.disposition === 'HOLD') html += form('decide',x.id,'<label>Disposition</label><select name="decision"><option value="ADMIT_FOR_REVIEW">Admit for review only</option><option value="REFUSE">Refuse</option></select>' + input('reviewer','Receiving steward label',80,true) + textarea('response','Why this disposition / local constraints',350),'Record local decision');
      else html += '<p class="small">' + s(x.response) + '</p>' + button('download-return','Download return',x.id,'btn') +
          button('deliver-return', 'Return in this browser (demo)',x.id,'btn line');
      return html + '</article>';
    }).join('') : empty('No packets yet. Export a crossing from another harbor, switch here, and import.');
    $('#outbound').innerHTML = n.outbox.length ? n.outbox.map(function (x) {return '<article class="item"><span class="pill ' + (x.replies.length ? 'done' : 'proposed') + '">' + (x.replies.length ? 'RETURN RECEIVED' : 'NOT DELIVERED AUTOMATICALLY') + '</span><h3>' + s(x.packet.proposal.title) + '</h3><p class="micro">To ' + s(x.packet.destinationLabel) + '</p>' + button('download-cross','Download packet',x.id,'btn') + button('deliver-cross','Deliver in this browser (demo)',x.id,'btn line') + (x.replies.length ? '<p class="small">' + s(x.replies[0].decision) + ': ' + s(x.replies[0].note) + '</p>' : '') + '</article>'; }).join('') : empty('No outbound candidates.');
    var reported = n.economy.filter(function (e) {return e.status === 'SELF_REPORTED';});
    function sum(type) {return reported.filter(function (e) {return e.type === type;}).reduce(function (a,e) {return a+e.cents;},0)/100;}
    $('#ecoSummary').innerHTML = '<div class="statrow"><div class="stat"><strong>$' + sum('money_in').toFixed(2) + '</strong><span class="micro">Money in, self-reported</span></div><div class="stat"><strong>$' + sum('money_out').toFixed(2) + '</strong><span class="micro">Money out, self-reported</span></div><div class="stat"><strong>' + n.economy.filter(function (e) {return e.type !== 'money_in' && e.type !== 'money_out';}).length + '</strong><span class="micro">Noncash records</span></div></div><p class="small">Planned money is excluded. These are not bank or payment data.</p>';
    $('#ecoList').innerHTML = n.economy.length ? n.economy.map(function (e) {return '<article class="item"><span class="pill">' + s(e.type) + ' · ' + s(e.status) + '</span><p>' + s(e.description) + '</p>' + (e.cents ? '<p class="small">$' + (e.cents/100).toFixed(2) + ' (self-reported only)</p>' : '') + '</article>';}).join('') : empty('No economic records. Keep money and nonmoney distinct.');
    $('#computeList').innerHTML = n.compute.length ? n.compute.map(function (x) {
       var native = x.actualGHoT === true;
       var label = !native ? 'BROWSER EXECUTION' : x.transport === 'lan_hmac_v1' ?
         (x.status === 'GHOT_NATIVE_EXECUTED_PEER_LOOPBACK_TEST' ? 'NATIVE GHOT / PEER LOOPBACK TEST' : 'NATIVE GHOT / LAN WORKER') : 'NATIVE GHOT / LOCAL';
       return '<article class="item green"><span class="pill done">' + label + '</span><h3>' + s(x.task.replace(/_/g,' ')) + ': ' + s(x.output) + '</h3><p class="micro">' + s(x.id) + ' · executor: ' + s(native ? x.executor : 'this browser') + (native ? ' · native receipt: ' + s(x.nativeReceiptId) + '<br>Input digest only; ' + s(x.witnessClass || 'non-authoritative record') + '.' : ' (not GHoT)') + '</p></article>';
     }).join('') : empty('Run a small task on this device to create a real local execution receipt.');
    if($('#mcObservations')) $('#mcObservations').innerHTML = (n.minecraft || []).length ? (n.minecraft || []).map(function(x){
      return '<article class="item blue"><span class="pill held">GAME ONLY · HOLD</span><h3>'+esc(x.gameState.replace(/_/g,' '))+'</h3><p>Lamp A: '+s(x.lampA)+' · Lamp B: '+s(x.lampB)+' · Festival: '+s(x.festival)+'</p><p class="micro">Minecraft readback · Native GHoT '+s(x.nativeReceiptId)+' · no human/real-world deed</p></article>';
    }).join('') : empty('No native Minecraft observations in this harbor.');
    $('#cartridgeProject').innerHTML = n.projects.filter(function (p) {return p.state === 'CONFIRMED';}).map(function (p) {return '<option value="' + s(p.id) + '">' + s(p.title) + '</option>';}).join('') || '<option value="">A reviewed-confirmed seed is required</option>';
    $('#cartridgeList').innerHTML = n.cartridges.length ? n.cartridges.map(function (x) {return '<article class="item green"><h3>' + s(x.title) + '</h3><p>' + s(x.method) + '</p><p class="small"><b>Limits:</b> ' + s(x.knownLimits) + '</p>' + button('download-card', 'Download portable JSON', x.id, 'btn') + '</article>';}).join('') : empty('A confirmed useful act plus an intentionally authored method creates a cartridge.');
  }
  function nativeStatus(message, ready) {
    nativeAvailable = !!ready;
    var el = $('#ghotStatus'), run = $('#ghotRunButton');
    if (el) {el.textContent = message; el.className = ready ? 'banner' : 'warning';}
    if (run) run.disabled = !nativeAvailable || nativePending;
  }
  function checkNativeGhot() {
    if (location.protocol === 'file:') {
      nativeStatus('Offline file mode. Use ghot_local_server.py with an actual GHoT checkout to enable native execution.', false);
      return Promise.resolve();
    }
    return fetch('/api/ghot/status', {cache: 'no-store', credentials: 'omit'}).then(function (res) {
      if (!res.ok) throw Error('No local donor bridge'); return res.json();
    }).then(function (info) {
      if (info.nativeGHoT !== true || info.transport !== 'loopback_only' ||
        info.capabilities.indexOf('system.hash') === -1 || !/^(127\.0\.0\.1|localhost)$/.test(location.hostname))
        throw Error('Not an approved loopback native bridge.');
      nativeStatus('LOCAL GHOT DETECTED · Native task runs only when you press the button.', true);
    }).catch(function () {
      nativeStatus('No native GHoT on this page. The public preview is browser-only; run the localhost bridge to test the donor.', false);
    });
  }
  function runNativeGhot(form) {
    if (!nativeAvailable || nativePending) return notify('Native donor not ready.');
    var currentNode = current(); if (!currentNode) return notify('Create a harbor first.');
    var text = data(form, 'text');
    if (!text.trim() || text.length > 1000) return notify('Enter 1–1000 characters.');
    if (!window.crypto || !window.crypto.subtle || !window.TextEncoder)
      return notify('This browser lacks Web Crypto digest support; no native receipt can be admitted.');
    var nodeId = currentNode.id, bytes = new TextEncoder().encode(text), digest;
    if (bytes.length > 4000) return notify('Text exceeds bridge byte limit.');
    nativePending = true;
    nativeStatus('Native GHoT request in progress. The result will be checked before saving.', true);
    window.crypto.subtle.digest('SHA-256', bytes).then(function (buffer) {
      digest = Array.from(new Uint8Array(buffer)).map(function (b) {return ('0'+b.toString(16)).slice(-2);}).join('');
      return fetch('/api/ghot/hash', {method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({text:text}), credentials:'omit'});
    }).then(function (res) {if(!res.ok) throw Error('Native bridge refused request ('+res.status+').'); return res.json();})
      .then(function (answer) {
        if (!answer || answer.nativeGHoT !== true || answer.transport !== 'loopback_only' ||
            answer.source !== 'GHoT/ghot/reference_node.py') throw Error('Unexpected native bridge response.');
        safeRun(function () { C.nativeGhotRecord(st, nodeId, bytes.length, answer.receipt, digest); });
        nativeStatus('NATIVE GHOT RECEIPT CHECKED · recorded only in this browser notebook.', true);
      }).catch(function (err) {
        nativeStatus('Native GHoT not completed: '+err.message, true);
      }).finally(function () {nativePending=false; $('#ghotRunButton').disabled=!nativeAvailable;});
  }


  function peerStatus(message, ready) {
    peerAvailable = !!ready;
    var status = $('#peerStatus');
    if (status) { status.textContent = message; status.className = ready ? 'banner' : 'warning'; }
    if ($('#peerRunForm')) $('#peerRunForm').hidden = !peerAvailable;
    if ($('#peerUnpairButton')) $('#peerUnpairButton').hidden = !peerAvailable;
    if ($('#peerRunButton')) $('#peerRunButton').disabled = !peerAvailable || peerPending;
  }
  function checkPeer() {
    if (!nativeAvailable) return peerStatus('Local bridge required. Open the double-click Mac launcher to pair.', false);
    return fetch('/api/ghot/peer/status', {cache:'no-store', credentials:'omit'})
      .then(function(r) {if(!r.ok) throw Error('No LAN bridge');return r.json();})
      .then(function(d) {
        if (d.paired === true && d.capability === 'system.hash')
          peerStatus('PAIRED · '+d.workerNodeId+' · '+(d.loopbackTest?'loopback-only test':'private LAN address')+' · only manually requested hash tasks.',true);
        else peerStatus('No remote worker paired. On the second computer, start the worker and copy its private IP and pairing key here.',false);
      }).catch(function() {peerStatus('LAN pairing is not available on the public preview.',false);});
  }
  function localPost(route, body) {
    return fetch(route,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'omit',
      body:JSON.stringify(body)}).then(function(r){if(!r.ok)throw Error('Local bridge refused ('+r.status+').');return r.json();});
  }
  function pairRemoteGhot(form) {
    if (!nativeAvailable || peerPending) return notify('Start the LOCAL bridge before pairing.');
    var addr=data(form,'url').trim(), key=data(form,'key').trim().toLowerCase();
    if (!/^http:\/\/(?:10\.|172\.|192\.168\.|127\.)/.test(addr) || !/^[0-9a-f]{64}$/.test(key))
      return notify('Enter the worker private IPv4 http://IP:7789 and 64-character pairing key.');
    peerPending=true;
    peerStatus('Pairing: verifying your second computer and GHoT identity…',false);
    localPost('/api/ghot/peer/pair',{url:addr,key:key}).then(function(answer){
      form.elements.namedItem('key').value=''; // never persist the shared secret in the browser notebook
      if(!answer.paired)throw Error('Remote worker declined pairing.');
      return checkPeer();
    }).catch(function(e){peerStatus('Pairing failed. Verify that the worker is running and both machines share a trusted LAN.',false);notify(e.message);})
      .finally(function(){peerPending=false;if($('#peerRunButton'))$('#peerRunButton').disabled=!peerAvailable;});
  }
  function runRemoteGhot(form) {
    if (!peerAvailable || peerPending) return notify('Pair the remote worker first.');
    var n=current();if(!n)return notify('Create a harbor before running a task.');
    var text=data(form,'text'), bytes=new TextEncoder().encode(text), hash;
    if(!text.trim() || text.length>1000 || bytes.length>4000)return notify('Enter 1–1000 characters of test-only text.');
    if(!window.crypto || !window.crypto.subtle)return notify('WebCrypto not available.');
    peerPending=true;peerStatus('Crossing a bounded system.hash task to your paired GHoT worker…',true);
    window.crypto.subtle.digest('SHA-256',bytes).then(function(d){
      hash=Array.from(new Uint8Array(d)).map(function(v){return('0'+v.toString(16)).slice(-2);}).join('');
      return localPost('/api/ghot/peer/hash',{text:text});
    }).then(function(result){
      if(!result || result.bridgeVerified!==true || result.nativeGHoT!==true || result.transport!=='lan_hmac_v1')
        throw Error('Remote response was not checked by the local operator bridge.');
      C.remoteGhotRecord(st,n.id,bytes.length,result.receipt,hash,result);
      persist();render();
      peerStatus('NATIVE GHOT PEER RECEIPT CHECKED · task executed by '+result.workerNodeId+
        (result.loopbackTest?' (same-machine loopback test)':' (private LAN worker)'),true);
    }).catch(function(e){peerStatus('Remote task refused or failed; inspect the terminal. '+e.message,true);})
      .finally(function(){peerPending=false;$('#peerRunButton').disabled=!peerAvailable;});
  }
  function unpairRemote() {
    if(peerPending)return notify('Wait for the current task to finish.');
    localPost('/api/ghot/peer/unpair',{}).then(function(){peerStatus('Unpaired. No remote worker is currently authorized.',false);})
      .catch(function(e){notify(e.message);});
  }

  function mcNotice(text,enabled) {
    minecraftEnabled=!!enabled;
    var e=$('#mcStatus'); if(e){e.textContent=text;e.className=enabled?'banner':'warning';}
    ['mcStage','mcObserve','mcCelebrate'].forEach(function(id){var btn=$('#'+id); if(btn)btn.disabled=!enabled || mcPending;});
  }
  function mcStart() {
    fetch('/api/minecraft/status',{cache:'no-store',credentials:'omit'}).then(function(r){if(!r.ok)throw Error('No local Minecraft bridge');return r.json();}).then(function(status){
      if(!status.enabled)return mcNotice('Minecraft disabled. Use the separate empty-demo-world launcher on your own local Minecraft Java server.',false);
      return fetch('/api/minecraft/plan',{cache:'no-store',credentials:'omit'}).then(function(r){return r.json();}).then(function(plan){
        $('#mcPlan').textContent='Fixed rehearsal origin: '+plan.origin.join(', ')+' · '+plan.anchors.length+' staged blocks · two lamps/levers · one optional festival seal.';
        mcNotice('NATIVE MINECRAFT ARMED · RCON localhost only. Use ONLY your own completely empty rehearsal world. Server state has not been checked yet.',true);
      });
    }).catch(function(){mcNotice('Minecraft unavailable in the public/offline version. Open the locally configured Minecraft bridge to enable it.',false);});
  }
  function mcAction(route,confirmText) {
    if(!minecraftEnabled||mcPending)return notify('Native Minecraft bridge is not enabled or busy.');
    if(confirmText && !confirm('Only your own EMPTY, authorized, dedicated creative-world server. No existing builds nearby. Continue?'))return;
    mcPending=true;mcNotice('Sending bounded request to the actual vanilla Minecraft RCON server…',true);
    var active=current(), body=confirmText?{confirm:confirmText}:{};
    fetch('/api/minecraft/'+route,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'omit',body:JSON.stringify(body)})
      .then(function(r){return r.json().then(function(data){if(!r.ok)throw Error(data.error||'Minecraft request refused ('+r.status+').');return data;});})
      .then(function(answer){
        if(route==='stage'){
          if(answer.state!=='STAGED'||!answer.readback)throw Error('Minecraft staging was not confirmed.');
          $('#mcLive').textContent='Staged '+answer.blocks_changed+' real blocks. '+answer.readback.game_state+'. Enter the world and flip the TWO levers to cooperate.';
          return;
        }
        if(!answer.game || !answer.nativeGHoT || typeof answer.payload!=='string' || !window.crypto || !crypto.subtle)
          throw Error('Native Minecraft/GHoT evidence not complete; cannot record.');
        var data=new TextEncoder().encode(answer.payload);
        return crypto.subtle.digest('SHA-256',data).then(function(bits){
          var digest=Array.from(new Uint8Array(bits)).map(function(v){return('0'+v.toString(16)).slice(-2);}).join('');
          // The exact values covered by the native GHoT hash must match the separately
          // displayed game observation; a signed hash itself proves no human claim.
          var fromGame={schema:answer.game.schema,plan_digest:answer.game.plan_digest,
            observed_state_sha256:answer.game.observed_state_sha256,game_state:answer.game.game_state,
            lamp_a_lit:answer.game.lamp_a_lit,lamp_b_lit:answer.game.lamp_b_lit,
            festival_center_lit:answer.game.festival_center_lit,
            destination_disposition:answer.game.destination_disposition};
          var obj=JSON.parse(answer.payload);
          Object.keys(fromGame).forEach(function(k){if(obj[k]!==fromGame[k])throw Error('Game observation and GHoT hash disagree.');});
          C.minecraftRecord(st,active.id,answer,digest);persist();render();
          $('#mcLive').textContent='REAL MINECRAFT READBACK: '+answer.game.game_state+' · A '+answer.game.lamp_a_lit+' · B '+answer.game.lamp_b_lit+' · seal '+answer.game.festival_center_lit+' · GHoT receipt '+answer.nativeGHoT.receipt.receipt_id+' · HOLD only.';
        });
      }).then(function(){mcNotice('Minecraft last action completed; only game-world effects and local receipt references were recorded.',true);})
      .catch(function(e){mcNotice('Minecraft action refused or incomplete: '+e.message,true);})
      .finally(function(){mcPending=false;['mcStage','mcObserve','mcCelebrate'].forEach(function(id){var b=$('#'+id);if(b)b.disabled=!minecraftEnabled;});});
  }

  document.addEventListener('submit', function (ev) { var f = ev.target, action = f.getAttribute('data-act'); if (!action) return;
    ev.preventDefault(); if (action === 'ghot-native') { runNativeGhot(f); return; }
    if (action === 'ghot-peer-pair') { pairRemoteGhot(f); return; }
    if (action === 'ghot-peer-run') { runRemoteGhot(f); return; }
    safeRun(function () { var id = f.getAttribute('data-id'), n = current();
      if (action === 'create-node') C.createNode(st,data(f,'name'),data(f,'kind'));
      else if (action === 'invite') C.invitation(st,n.id,data(f,'title'),data(f,'description'));
      else if (action === 'project') C.createProject(st,n.id,data(f,'title'),data(f,'purpose'),data(f,'kind'));
      else if (action === 'accept') C.accept(st,n.id,id,data(f,'actor'),data(f,'scope'));
      else if (action === 'report') C.report(st,n.id,id,data(f,'actor'),data(f,'report'));
      else if (action === 'confirm') C.confirm(st,n.id,id,data(f,'reviewer'),data(f,'result'),data(f,'capability'));
      else if (action === 'crossing') { var dest=data(f,'destination'); if(dest === '__external__') dest=data(f,'externalId'); C.crossing(st,n.id,data(f,'projectId'),dest,data(f,'note')); }
      else if (action === 'economy') { var type=data(f,'type'), dollars=type==='money_in'||type==='money_out' ? Number(data(f,'dollars')) : 0;
        if (!Number.isFinite(dollars) || dollars < 0 || Math.round(dollars*100) / 100 !== dollars) throw Error('Enter nonnegative dollars and cents.');
        C.economy(st,n.id,type,data(f,'description'),Math.round(dollars*100),data(f,'status')); }
      else if (action === 'compute') C.compute(st,n.id,data(f,'task'),data(f,'input'));
      else if (action === 'decide') C.decide(st,n.id,id,data(f,'decision'),data(f,'reviewer'),data(f,'response'));
      else if (action === 'cartridge') C.cartridge(st,n.id,data(f,'projectId'),data(f,'method'),data(f,'limitations'));
      else throw Error('Unknown form.');
      notify('Saved locally. This is not an external or institutional action.');
    });
  });
  document.addEventListener('click', function (ev) {
    var tab = ev.target.closest('[data-tab]'); if (tab) { activeTab = tab.getAttribute('data-tab'); render(); window.scrollTo(0,0); return; }
    var b = ev.target.closest('[data-click]'); if (!b) return; var action = b.getAttribute('data-click'), id = b.getAttribute('data-id');
    safeRun(function () {var n=current(), item, other;
      if (action === 'download-invite') {item=n.invites.find(function (x) {return x.id===id;}); download('Abundent_Invitation_' + id + '.txt',item.title+'\nFrom: '+item.from+'\n'+item.text+'\n\nOptional invitation only; no auto-enrollment.\n','text/plain');}
      else if (action === 'download-cross' || action === 'deliver-cross') { item=n.outbox.find(function (x) {return x.id===id;}); if (action === 'download-cross') asJson(item.packet, 'Circuit_Crossing_' + id + '.json');
        else {other=C.node(st,item.packet.destination); C.receive(st,other.id,item.packet); notify('Delivered to ' + other.label + ' HOLD queue in same browser demo.');} }
      else if (action === 'download-return' || action === 'deliver-return') {item=C.makeReturn(st,n.id,id); if (action === 'download-return') asJson(item,'Circuit_Return_' + id + '.json');
        else {C.receiveReturn(st,item.destination,item); notify('Self-attested return delivered locally.');} }
      else if (action === 'download-card') {item=n.cartridges.find(function (x) {return x.id===id;}); asJson(item,'Circuit_Cartridge_' + id + '.json');}
      else throw Error('Unknown action.');
    });
  });
  document.querySelectorAll('[data-tab]').forEach(function (b) {b.setAttribute('type','button');});
  $('#nodeSelect').addEventListener('change',function () {st.active = this.value; persist(); render();});
  $('#newNodeBtn').addEventListener('click', function () {var label=prompt('Name of this independent harbor (no affiliation implied):');
    if (!label) return; safeRun(function () {C.createNode(st,label,'independent local group');});});
  $('#demoBtn').addEventListener('click',function () {safeRun(demo);});
  $('#backupBtn').addEventListener('click',function () {asJson(st,'Abundent_Circuit001_PRIVATE_Backup.json'); notify('Private local backup downloaded. Do not publish it.');});
  $('#importBtn').addEventListener('click',function () {$('#importFile').click();});
  $('#importFile').addEventListener('change',function (ev) {var f=this.files[0]; if(f) readFile(f,importObject);this.value='';});
  $('#resetBtn').addEventListener('click',function () {if(confirm('Delete all locally saved Circuit data? Export a private backup first if needed.')) {st=C.init();activeTab='overview';persist();render();notify('Local notebook cleared.');}});
  $('#peerUnpairButton').addEventListener('click',unpairRemote);
  $('#mcStage').addEventListener('click',function(){mcAction('stage','I AUTHORIZE TEST WORLD STAGING');});
  $('#mcObserve').addEventListener('click',function(){mcAction('observe',null);});
  $('#mcCelebrate').addEventListener('click',function(){mcAction('celebrate','I AUTHORIZE GAME CELEBRATION');});
  $('#ecoType').addEventListener('change',function () {$('#ecoAmount').disabled = !/money_in|money_out/.test(this.value);});
  render();
  checkNativeGhot().then(checkPeer).catch(function() {checkPeer();});
  mcStart();
}());
