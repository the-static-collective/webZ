import { prepareFieldQuestion, verifyFieldQuestion, FieldRefusal } from './packet.mjs';

const byId = id => document.getElementById(id);
const form = byId('field-form');
const inputs = [byId('kind'), byId('role'), byId('question'), byId('permission'), byId('privacy')];
let candidate = null;

function status(message, problem = false) {
  byId('message').textContent = message;
  byId('message').dataset.problem = problem ? 'yes' : 'no';
}
function discard() {
  candidate = null;
  byId('preview').hidden = true;
  byId('save').disabled = true;
  byId('preview-question').textContent = '';
  byId('preview-source').textContent = '';
  byId('preview-hash').textContent = '';
}
for (const input of inputs) {
  input.addEventListener('input', () => { discard(); status(''); });
  input.addEventListener('change', () => { discard(); status(''); });
}
form.addEventListener('submit', async event => {
  event.preventDefault();
  discard();
  try {
    const result = await prepareFieldQuestion({
      kind: byId('kind').value,
      text: byId('question').value,
      authorRole: byId('role').value,
      permissionReviewed: byId('permission').checked,
      privacyReviewed: byId('privacy').checked
    });
    await verifyFieldQuestion(result);
    candidate = result;
    byId('preview-question').textContent = result.public_question;
    byId('preview-source').textContent = result.source_role === 'AUTHOR'
      ? 'Operator says they authored this question'
      : 'Operator says exact public wording was permitted; not independently verified';
    byId('preview-hash').textContent = result.id;
    byId('preview').hidden = false;
    byId('save').disabled = false;
    status('Local candidate inspected. Nothing has been transmitted or published.');
    byId('preview').scrollIntoView({ block: 'start' });
  } catch (error) {
    status(error instanceof FieldRefusal ? error.message : 'A local validation error occurred.', true);
  }
});
byId('clear').addEventListener('click', () => {
  form.reset();
  byId('question').value = '';
  discard();
  status('Local draft cleared. No question was sent or saved by this page.');
  byId('question').focus();
});
byId('cancel-preview').addEventListener('click', () => {
  discard();
  status('Preview discarded. Nothing was shared.');
});
byId('save').addEventListener('click', async () => {
  if (!candidate || byId('save').disabled) return;
  try {
    await verifyFieldQuestion(candidate);
    const data = JSON.stringify(candidate, null, 2) + '\n';
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'circulation-003-unpublished-question-' + candidate.id.slice(-12) + '.json';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1200);
    status('Public-safe candidate file saved locally if your browser completed the download. No upload or receiving-world admission occurred.');
  } catch (error) {
    status(error instanceof Error ? error.message : 'Export refused.', true);
  }
});
byId('print-sheet').addEventListener('click', () => window.print());
