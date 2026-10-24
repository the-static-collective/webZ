// Abundent permission-first intake. Public Supabase publishable key only; RLS denies reads/updates/deletes.
const API = 'https://kbhqacsdvjsstzyplqij.supabase.co/rest/v1/abundent_interest';
const PUBLISHABLE_KEY = 'sb_publishable_Bv9JuOctSQTmnE3O1dP8RA_MKRNSD-o';
const form = document.querySelector('#contact-form');
const button = document.querySelector('#contact-submit');
const status = document.querySelector('#contact-status');
const source = new URLSearchParams(location.search).get('via') === 'coalition' ? 'coalition-oct-2026' : 'abundent-stay-in-touch';
let sending = false;
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (sending || !form.reportValidity()) return;
  // A bot trap; discard without submitting anything.
  if (form.elements.website.value.trim()) { status.textContent = 'Your note could not be confirmed. Please try again.'; return; }
  const payload = {
    name: form.elements.name.value.trim().slice(0, 100),
    email: form.elements.email.value.trim().toLowerCase().slice(0, 254),
    interest: form.elements.interest.value,
    note: form.elements.note.value.trim().slice(0, 1200),
    source,
    contact_consent: form.querySelector('#contact-consent').checked,
    notice_version: '2026-10-24'
  };
  if (!payload.contact_consent || !['grocery','potluck','volunteer','arts','technology','resources','general'].includes(payload.interest)) return;
  sending = true;
  button.disabled = true;
  button.textContent = 'SENDING YOUR NOTE…';
  status.className = 'status';
  status.textContent = 'Sending privately…';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(API, {
      method: 'POST',
      mode: 'cors',
      cache: 'no-store',
      headers: {
        'apikey': PUBLISHABLE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    if (!response.ok) throw Error('The contact service did not confirm receipt.');
    form.reset();
    status.className = 'status success';
    status.textContent = '✓ Saved. Thank you. Your note is privately on the Abundent follow-up list — not an official partner signup. We will only use it within the permission you gave.';
    button.textContent = 'NOTE RECEIVED ✓';
  } catch {
    status.className = 'status error';
    status.textContent = 'We could not confirm receipt. Your note may not have reached us. Please retry, or keep your words for later.';
    button.textContent = '✉ RETRY SENDING →';
  } finally {
    clearTimeout(timeout);
    sending = false;
    button.disabled = false;
  }
});
