import { BUTTONDOWN_USERNAME } from './provider.mjs';

// Public username only; never construct an endpoint from visitor-controlled input.
export function embedEndpoint(username) {
  if (typeof username !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_-]{1,63}$/.test(username)) return null;
  return 'https://buttondown.com/api/emails/embed-subscribe/' + encodeURIComponent(username);
}

if (typeof document !== 'undefined') {
  const form = document.getElementById('subscribe');
  const waiting = document.getElementById('waiting');
  const status = document.getElementById('post-office-status');
  const provider = document.getElementById('provider-link');
  const endpoint = embedEndpoint(BUTTONDOWN_USERNAME);

  if (endpoint && form && waiting && status && provider) {
    form.action = endpoint;
    form.hidden = false;
    form.querySelector('input[name="email"]').disabled = false;
    form.querySelector('button[type="submit"]').disabled = false;
    waiting.hidden = true;
    status.textContent = 'SUBSCRIPTIONS OPEN · CONFIRMATION BY EMAIL';
    provider.href = 'https://buttondown.com/' + encodeURIComponent(BUTTONDOWN_USERNAME);
    provider.hidden = false;
  } else if (status) {
    status.textContent = 'HOLD · DELIVERY ADDRESS NOT CONNECTED';
  }
}
