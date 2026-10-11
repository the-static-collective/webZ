// Client-side postcard: no fetch, address-book access, storage, telemetry, or automatic send.
const song = document.getElementById('song');
const note = document.getElementById('note');
const sms = document.getElementById('sms');
const email = document.getElementById('email');
const status = document.getElementById('share-status');
const chosen = new URLSearchParams(location.search).get('song');
if (chosen && Array.from(song.options).some(option => option.value === chosen)) song.value = chosen;
function compose() {
  const label = song.selectedOptions[0].textContent.trim();
  const personal = note.value.trim();
  return (personal || 'Thought you might like this song.') +
    '\n\n' + label + ' — The Static Collective\nhttps://suno.com/song/' + song.value +
    '\n\nFrom a week together: https://abundent.org/week/';
}
function update() {
  sms.href = 'sms:?body=' + encodeURIComponent(compose());
  email.href = 'mailto:?subject=' + encodeURIComponent('A song for you: ' + song.selectedOptions[0].textContent.trim()) +
    '&body=' + encodeURIComponent(compose());
}
song.addEventListener('change', () => {
  const url = new URL(location.href);
  url.searchParams.set('song', song.value);
  history.replaceState(null, '', url.pathname + url.search + url.hash);
  status.textContent = '';
  update();
});
note.addEventListener('input', () => { status.textContent = ''; update(); });
document.getElementById('copy').addEventListener('click', async () => {
  try {
    if (!navigator.clipboard?.writeText) throw Error('Clipboard unavailable');
    await navigator.clipboard.writeText(compose());
    status.textContent = 'Copied. You decide where to send it.';
  } catch { status.textContent = 'Copy unavailable. Try Text it or Email it.'; }
});
document.getElementById('native').addEventListener('click', async () => {
  if (!navigator.share) { status.textContent = 'Share sheet unavailable. Try Text it or Email it.'; return; }
  try {
    await navigator.share({title:'A song for you',text:compose()});
    status.textContent = 'Your device handled the share.';
  } catch(e) { if(e?.name !== 'AbortError') status.textContent = 'Share unavailable. Try Text it or Email it.'; }
});
update();
// Context doorways are derived from exact published song IDs, leaving Suno and postcards intact.
for (const anchor of document.querySelectorAll('.day ol li > a[href^="https://suno.com/song/"]')) {
  const id = anchor.href.split('/').at(-1);
  if (!/^[a-f0-9-]{36}$/.test(id)) continue;
  const door = document.createElement('a');
  door.className = 'context-door';
  door.href = '/music/rooms/?song=' + encodeURIComponent(id) + '&lens=2&close=8#instrument';
  door.textContent = 'Look closer · 11 lenses ↗';
  door.setAttribute('aria-label', 'Look closer at ' + anchor.textContent.replace('↗','').trim() + ' in the eleven-lens instrument');
  anchor.parentElement.append(door);
}
