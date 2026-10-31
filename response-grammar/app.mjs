import { ROOTS, makeCard, resolvePath, asPlainText } from './grammar.mjs';

const $ = (selector) => document.querySelector(selector);
const context = $('#context');
const note = $('#note');
const choices = $('#choices');
const back = $('#back');
const trail = $('#trail');
const preview = $('#preview');
const plainPreview = $('#plain-preview');
const exportJson = $('#download-json');
const copyText = $('#copy-text');
const reset = $('#reset');
const status = $('#status');
let path = [];
let currentCard = null;

function say(message) { status.textContent = message; }

function render() {
  const selected = path.length ? resolvePath(path) : null;
  const next = selected ? selected.next : ROOTS;
  trail.textContent = selected ? selected.labels.join('  →  ') : 'Start anywhere. Acknowledgment is enough.';
  choices.replaceChildren();
  for (const option of next) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'choice';
    button.textContent = option.label;
    button.addEventListener('click', () => { path = [...path, option.id]; render(); button.blur(); });
    choices.append(button);
  }
  if (selected && next.length) {
    const done = document.createElement('p');
    done.className = 'hint';
    done.textContent = 'Or stop here. You never have to explain more.';
    choices.append(done);
  }
  if (selected && next.length === 0) {
    const done = document.createElement('p');
    done.className = 'hint';
    done.textContent = 'That is specific enough. Your words can add detail below.';
    choices.append(done);
  }
  back.disabled = path.length === 0;
  try {
    currentCard = path.length ? makeCard({ context: context.value, path, note: note.value }) : null;
    preview.textContent = currentCard ? JSON.stringify(currentCard, null, 2) : 'Choose a response to preview a card.';
    plainPreview.textContent = currentCard ? asPlainText(currentCard) : '';
    exportJson.disabled = !currentCard;
    copyText.disabled = !currentCard;
    say(currentCard ? 'Local draft. Nothing has been sent.' : 'No selection yet.');
  } catch (error) {
    currentCard = null;
    preview.textContent = 'A valid card has not been prepared.';
    plainPreview.textContent = '';
    exportJson.disabled = true;
    copyText.disabled = true;
    say(error.message);
  }
}

context.addEventListener('input', render);
note.addEventListener('input', render);
back.addEventListener('click', () => { path = path.slice(0, -1); render(); });
reset.addEventListener('click', () => {
  path = [];
  context.value = '';
  note.value = '';
  render();
  context.focus();
});
copyText.addEventListener('click', async () => {
  if (!currentCard) return;
  const text = asPlainText(currentCard);
  try {
    if (!navigator.clipboard || !window.isSecureContext) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(text);
    say('Words copied. You decide where, whether, and to whom to send them.');
  } catch {
    // Never silently send or change the system clipboard; expose selectable text.
    plainPreview.focus();
    say('Clipboard unavailable. Select the visible words and copy them manually.');
  }
});
exportJson.addEventListener('click', () => {
  if (!currentCard) return;
  const blob = new Blob([JSON.stringify(currentCard, null, 2) + '\n'], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'my-response-draft.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  say('Saved to your device if the download completed. It has not been sent.');
});
render();
