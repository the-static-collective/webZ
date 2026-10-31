// POKE-001 · Account-free, content-free radio check.
// Deployed as an isolated Supabase Edge Function, source-owned by webZ.
// verify_jwt=false is intentional: public creation, unguessable per-side bearer links
// for subsequent actions. All authorization is performed in this handler/SQL.
const HTML = "<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n<meta name=\"theme-color\" content=\"#101f30\">\n<title>You've been poked! · Abundent</title>\n<style>\n  :root { color-scheme: dark; font-family: system-ui, -apple-system, sans-serif; background: #101f30; color: #f3f3e7; }\n  * { box-sizing: border-box; }\n  body { margin:0; min-height:100svh; display:grid; place-items:center; padding:22px; background:repeating-linear-gradient(0deg,#101f30 0px,#101f30 5px,#12243a 6px); }\n  main { width:min(100%,510px); border:2px solid #b9d0bd; background:#182d3e; box-shadow:8px 8px 0 #080f18; padding:clamp(20px,5vw,36px); }\n  header { letter-spacing:.17em; text-transform:uppercase; font:700 .72rem ui-monospace,monospace; color:#b3e0bf; }\n  .finger { font-size:3.5rem; line-height:1.2; margin:22px 0 0; }\n  h1 { font:800 clamp(1.9rem,7vw,2.65rem)/1.12 system-ui,sans-serif; letter-spacing:-.045em; margin:12px 0 16px; }\n  p { line-height:1.55; color:#e0e8e4; }\n  .sub { color:#aec4c1; font-size:.91rem; }\n  .buttons { display:grid; gap:11px; margin-top:25px; }\n  button { font:800 1rem system-ui,sans-serif; min-height:52px; cursor:pointer; color:#112132; background:#c6ffac; border:2px solid #c6ffac; padding:12px 14px; border-radius:3px; }\n  button:hover { filter:brightness(1.09); }\n  button:focus-visible, input:focus-visible { outline:3px solid #ffe394; outline-offset:3px; }\n  button.secondary { background:transparent; color:#e2f3e3; border-color:#668c91; }\n  button.quiet { background:transparent; color:#b4c8c8; border-color:transparent; font-size:.91rem; min-height:36px; }\n  button:disabled { opacity:.5; cursor:wait; }\n  .share { margin-top:20px; border-top:1px dashed #809799; padding-top:16px; }\n  label { display:block; font-weight:700; margin:8px 0; }\n  input { display:block; width:100%; padding:11px; font: .8rem ui-monospace,monospace; border:2px solid #829da4; background:#0d1722; color:#e6ffe2; }\n  .share button { margin-top:12px; width:100%; }\n  #feedback { min-height:1.3em; color:#ffe394; font-size:.95rem; }\n  footer { border-top:1px solid #3b5a63; margin-top:25px; padding-top:14px; font-size:.83rem; color:#acc0c3; line-height:1.5; }\n  details { margin-top:15px; color:#b3c9c8; font-size:.85rem; }\n  summary { cursor:pointer; }\n</style>\n</head>\n<body>\n<main>\n  <header>ABUNDENT / POKE-001 / RADIO CHECK</header>\n  <div class=\"finger\" aria-hidden=\"true\">👉</div>\n  <h1 id=\"headline\">A little digital smoke signal.</h1>\n  <p id=\"explanation\">No message. No explanation. Just a poke.</p>\n  <p class=\"sub\" id=\"state\"></p>\n  <div id=\"buttons\" class=\"buttons\"></div>\n  <div id=\"share\" class=\"share\" hidden>\n    <label for=\"invite\">Send this invitation link to one person:</label>\n    <input id=\"invite\" type=\"text\" readonly aria-label=\"Invitation link\">\n    <button id=\"copy\" type=\"button\">Copy invitation link</button>\n    <p class=\"sub\">Keep your own link in your bookmarks. This invitation is shown only until you leave this page. Anyone with the invitation can poke back; don't post it publicly.</p>\n  </div>\n  <p id=\"feedback\" role=\"status\" aria-live=\"polite\"></p>\n  <footer>\n    Poking back is not agreement to talk, share anything, or do any work. No names, accounts, messages, or automatic notifications. The invitation travels only when you share its link. It expires after 7 days.\n    <details><summary>How does it work?</summary><p>Each side receives a different private link. When one side pokes, the other can poke back. One poke per turn. Either side can end it. The server stores only random link fingerprints, counts, and timestamps. There is no public directory.</p></details>\n  </footer>\n</main>\n<script>\n(() => {\n  'use strict';\n  const byId = (id) => document.getElementById(id);\n  const h = byId('headline'), e = byId('explanation'), s = byId('state');\n  const buttons = byId('buttons'), share = byId('share'), feedback = byId('feedback'), invite = byId('invite');\n  let key = '', invitation = '', current = null, busy = false, ticker = null;\n  const endpoint = window.location.pathname;\n  const make = (label, action, variant) => {\n    const b = document.createElement('button');\n    b.type = 'button'; b.textContent = label; b.className = variant || '';\n    b.addEventListener('click', action); buttons.append(b);\n    return b;\n  };\n  const clear = () => { buttons.replaceChildren(); share.hidden = true; feedback.textContent = ''; };\n  const note = (msg) => { feedback.textContent = msg; };\n  async function api(action, token) {\n    const response = await fetch(endpoint, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action, token})});\n    const data = await response.json();\n    if (!response.ok) throw new Error(data.error || 'Could not reach the other end.');\n    return data;\n  }\n  const link = (role, token) => {\n    const u = new URL(window.location.href); u.hash = role + '=' + token; return u.href;\n  };\n  function home() {\n    key = ''; current = null; invitation = ''; if(ticker) clearInterval(ticker);\n    clear(); h.textContent = 'A little digital smoke signal.';\n    e.textContent = 'Poke someone. They can poke back. That can be the whole conversation.';\n    s.textContent = 'No signup. No message. No obligation.';\n    make('👉 START A POKE', create);\n  }\n  async function create() {\n    if (busy) return;\n    busy = true; note('Preparing your poke…');\n    try {\n      const d = await api('create');\n      key = d.sender_token;\n      invitation = link('r', d.recipient_token);\n      history.replaceState(null, '', '#s=' + key);\n      await refresh();\n    } catch (err) { note(err.message); } finally { busy = false; }\n  }\n  async function refresh() {\n    if (!key) return;\n    try { current = await api('status', key); render(); }\n    catch (err) {\n      clear(); h.textContent = \"That poke can't be opened.\";\n      e.textContent = 'The link may have expired or been mistyped.';\n      s.textContent = err.message;\n      make('Start a new poke', () => { history.replaceState(null, '', window.location.pathname); home(); });\n    }\n  }\n  function render() {\n    clear();\n    if (!current) return;\n    if (current.ended || current.expired || current.maxed) {\n      h.textContent = current.expired ? 'This poke expired.' : (current.maxed ? 'That was a lot of pokes.' : 'Poke ended.');\n      e.textContent = 'No one owes anyone another poke.';\n      s.textContent = 'This exchange is closed.';\n    } else if (current.can_poke) {\n      h.textContent = \"You've been poked!\";\n      e.textContent = 'Poke back?';\n      s.textContent = 'It means whatever you want it to mean.';\n      make('👉 POKE BACK!', () => send('poke'));\n    } else {\n      h.textContent = current.role === 'sender' && current.received === 0 ? 'Your poke is ready.' : 'You poked back.';\n      e.textContent = current.role === 'sender' && current.received === 0\n        ? 'Share the invitation link so someone can receive it.' : 'Awaiting another poke. Or not. Either is fine.';\n      s.textContent = 'No reply required.';\n    }\n    if (invitation && current.role === 'sender' && !current.ended) {\n      share.hidden = false; invite.value = invitation;\n    }\n    make('Refresh', refresh, 'secondary');\n    if (!current.ended && !current.expired && !current.maxed) {\n      make('End this poke for both sides', () => {\n        if (window.confirm('End this poke? Neither side can poke again with these links.')) send('close');\n      }, 'quiet');\n    }\n    make('Not now', () => { history.replaceState(null, '', window.location.pathname); home(); }, 'quiet');\n  }\n  async function send(action) {\n    if (busy) return;\n    busy = true; note('Sending signal…');\n    try {\n      current = await api(action, key);\n      render();\n      if (action === 'poke') note('Poked. That is the whole message.');\n    } catch (err) { note(err.message); await refresh(); } finally { busy = false; }\n  }\n  byId('copy').addEventListener('click', async () => {\n    try {\n      if (navigator.clipboard && window.isSecureContext) {\n        await navigator.clipboard.writeText(invitation);\n        note('Invitation copied. Send it yourself, wherever you want.');\n      } else { invite.focus(); invite.select(); note('Selected. Copy the link and send it yourself.'); }\n    } catch (_) { invite.focus(); invite.select(); note('Select and copy this link to share it.'); }\n  });\n  const params = new URLSearchParams(window.location.hash.slice(1));\n  const supplied = params.get('s') || params.get('r');\n  if (supplied && /^[0-9a-f]{64}$/.test(supplied)) {\n    key = supplied; refresh();\n    ticker = window.setInterval(() => { if (key && !document.hidden && !busy) refresh(); }, 15000);\n  } else { home(); }\n})();\n</script>\n</body>\n</html>";
const PROJECT = Deno.env.get('SUPABASE_URL');
const SECRET = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const securityHeaders = {
  'Cache-Control': 'no-store, max-age=0',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'Content-Security-Policy': "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'",
};
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {status, headers:{...securityHeaders,'Content-Type':'application/json; charset=utf-8'}});
}
function hex(bytes: Uint8Array) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2,'0')).join('');
}
function randomToken() { const bytes = new Uint8Array(32); crypto.getRandomValues(bytes); return hex(bytes); }
async function fingerprint(token: string) {
  if (!/^[0-9a-f]{64}$/.test(token)) throw new Error('INVALID_LINK');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return hex(new Uint8Array(digest));
}
async function rpc(name: string, input: Record<string, string>) {
  if (!PROJECT || !SECRET) throw new Error('SERVER_NOT_CONFIGURED');
  const response = await fetch(PROJECT + '/rest/v1/rpc/' + name, {
    method: 'POST',
    headers: {apikey:SECRET, Authorization:'Bearer ' + SECRET,'Content-Type':'application/json'},
    body:JSON.stringify(input),
  });
  if (!response.ok) {
    const raw = await response.text();
    const known = ['PILOT_FULL','INVALID_TOKENS','INVALID_REQUEST','UNKNOWN_LINK','EXPIRED','ENDED','WAIT_FOR_REPLY','LIMIT_REACHED'];
    const code = known.find((tag) => raw.includes(tag));
    throw new Error(code || 'UNAVAILABLE');
  }
  return response.json();
}
Deno.serve(async (request: Request) => {
  if (request.method === 'GET') {
    return new Response(HTML, {status:200,headers:{...securityHeaders,'Content-Type':'text/html; charset=utf-8'}});
  }
  if (request.method !== 'POST') return json({error:'Method not allowed'},405);
  try {
    const raw = await request.text();
    if (raw.length > 1024) return json({error:'Request too large'},413);
    const body = JSON.parse(raw);
    if (!body || typeof body !== 'object') return json({error:'Invalid request'},400);
    const action = body.action;
    if (action === 'create') {
      const sender_token = randomToken(), recipient_token = randomToken();
      await rpc('poke_v1_create', {
        p_sender_hash:await fingerprint(sender_token),
        p_recipient_hash:await fingerprint(recipient_token),
      });
      return json({sender_token,recipient_token});
    }
    if (!['status','poke','close'].includes(action) || typeof body.token !== 'string') {
      return json({error:'Invalid request'},400);
    }
    const result = await rpc('poke_v1_exchange',{p_key_hash:await fingerprint(body.token),p_action:action});
    return json(result);
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'UNAVAILABLE';
    const responseCodes: Record<string, [number,string]> = {
      INVALID_LINK:[400,'This link is invalid.'],
      INVALID_TOKENS:[400,'Invalid tokens.'],
      INVALID_REQUEST:[400,'Invalid request.'],
      UNKNOWN_LINK:[404,'No matching poke was found.'],
      PILOT_FULL:[429,'Today’s small pilot is full. Try another day.'],
      EXPIRED:[410,'This poke has expired.'],
      ENDED:[410,'This poke has ended.'],
      WAIT_FOR_REPLY:[409,'You already poked. It is their turn.'],
      LIMIT_REACHED:[409,'This poke reached its 40-signal limit.'],
    };
    const [code,message] = responseCodes[reason] || [503,'This poke is temporarily unavailable.'];
    return json({error:message},code);
  }
});