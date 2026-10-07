import { sensitive } from './model.mjs';

export const PRESS_ADDRESS = 'webz:the-static-collective/static-pressing-001';
export const MAX_TEXT_BYTES = 16 * 1024;
export const MAX_FILE_BYTES = 32 * 1024 * 1024;
export const MAX_LABEL_BYTES = 160;
export const RETURN_KINDS = Object.freeze([
  'MANGA_CARD',
  'MICRO_ZINE',
  'LYRIC_OBJECT',
  'MACHINE_READABLE_PAGE',
  'SURPRISE_ME',
]);

function byteLength(value) {
  return new TextEncoder().encode(value).byteLength;
}

function validatePublicLabel(value) {
  if (typeof value !== 'string' || !value.trim()) throw Error('PUBLIC_LABEL_REQUIRED');
  if (byteLength(value) > MAX_LABEL_BYTES) throw Error('PUBLIC_LABEL_LIMIT');
  if (sensitive(value)) throw Error('PUBLIC_METADATA_ONLY');
  return value.trim();
}

function validateMediaType(value) {
  const mediaType = value || 'application/octet-stream';
  if (
    typeof mediaType !== 'string'
    || mediaType.length > 128
    || /[\r\n\0]/.test(mediaType)
  ) throw Error('INVALID_MEDIA_TYPE');
  return mediaType;
}

async function sha256Bytes(bytes) {
  const view = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', view);
  return 'sha256:' + Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('');
}

export async function prepareTextParticular({ text, publicLabel }) {
  if (typeof text !== 'string' || !text.trim()) throw Error('PUBLIC_TEXT_REQUIRED');
  if (sensitive(text)) throw Error('PUBLIC_METADATA_ONLY');
  const bytes = new TextEncoder().encode(text);
  if (bytes.byteLength > MAX_TEXT_BYTES) throw Error('TEXT_LIMIT');
  return Object.freeze({
    kind: 'public-text',
    public_label: validatePublicLabel(publicLabel),
    media_type: 'text/plain;charset=utf-8',
    byte_length: bytes.byteLength,
    sha256: await sha256Bytes(bytes),
  });
}

export async function prepareFileParticular({ bytes, publicLabel, mediaType }) {
  if (!(bytes instanceof Uint8Array) || bytes.byteLength < 1) {
    throw Error('FILE_BYTES_REQUIRED');
  }
  if (bytes.byteLength > MAX_FILE_BYTES) throw Error('FILE_LIMIT');
  return Object.freeze({
    kind: 'local-file',
    public_label: validatePublicLabel(publicLabel),
    media_type: validateMediaType(mediaType),
    byte_length: bytes.byteLength,
    sha256: await sha256Bytes(bytes),
  });
}

export function preparePressingProposal({ particular, returnKind }) {
  if (
    !particular
    || typeof particular !== 'object'
    || !['public-text', 'local-file'].includes(particular.kind)
    || typeof particular.public_label !== 'string'
    || !/^sha256:[a-f0-9]{64}$/.test(particular.sha256)
    || !Number.isInteger(particular.byte_length)
    || particular.byte_length < 1
  ) throw Error('INVALID_PARTICULAR');
  if (!RETURN_KINDS.includes(returnKind)) throw Error('INVALID_RETURN_KIND');

  return Object.freeze({
    schema: 'webz/static-pressing-proposal/v0',
    webz_address: PRESS_ADDRESS,
    authority: 'browser-local-proposal',
    delivery: 'not-issued',
    payment: 'not-issued',
    reuse_license: 'none-implied',
    requested_return_kind: returnKind,
    particular: Object.freeze({ ...particular }),
  });
}

if (typeof document !== 'undefined' && document.body?.dataset.page === 'press') {
  const base = new URL('../', import.meta.url);
  const $ = (id) => document.getElementById(id);
  const status = (id, value) => { if ($(id)) $(id).textContent = value; };
  const sourceKind = $('source-kind');
  const textPanel = $('text-source');
  const filePanel = $('file-source');
  const sourceText = $('source-text');
  const sourceFile = $('source-file');
  const publicLabel = $('public-label');
  const returnKind = $('return-kind');
  const preview = $('pressing-preview');
  let generation = 0;

  status('press-address', PRESS_ADDRESS + ' · owner-declared local surface');
  status('file-status', 'No local file selected.');

  function invalidate(message = 'Not prepared. Source or requested return changed.') {
    generation += 1;
    preview.textContent = '';
    preview.hidden = true;
    status('pressing-status', message);
  }

  function setMode() {
    const fileMode = sourceKind.value === 'local-file';
    textPanel.hidden = fileMode;
    filePanel.hidden = !fileMode;
    invalidate('Not prepared. Choose one particular.');
  }

  sourceKind.onchange = setMode;
  sourceText.oninput = () => invalidate();
  publicLabel.oninput = () => invalidate();
  returnKind.onchange = () => invalidate();
  sourceFile.onchange = () => {
    invalidate();
    const file = sourceFile.files?.[0];
    status(
      'file-status',
      file
        ? `Selected locally · ${file.size} bytes · ${file.type || 'application/octet-stream'} · filename excluded from proposal`
        : 'No local file selected.',
    );
  };

  $('prepare-pressing').onclick = async () => {
    const run = ++generation;
    preview.textContent = '';
    preview.hidden = true;
    status('pressing-status', 'Preparing locally… no delivery.');

    try {
      let particular;
      if (sourceKind.value === 'public-text') {
        particular = await prepareTextParticular({
          text: sourceText.value,
          publicLabel: publicLabel.value,
        });
      } else {
        const file = sourceFile.files?.[0];
        if (!file) throw Error('FILE_REQUIRED');
        if (file.size > MAX_FILE_BYTES) throw Error('FILE_LIMIT');
        const bytes = new Uint8Array(await file.arrayBuffer());
        if (run !== generation) return;
        particular = await prepareFileParticular({
          bytes,
          publicLabel: publicLabel.value,
          mediaType: file.type,
        });
      }

      if (run !== generation) return;
      const prepared = preparePressingProposal({
        particular,
        returnKind: returnKind.value,
      });
      preview.textContent = JSON.stringify(prepared, null, 2);
      preview.hidden = false;
      status(
        'pressing-status',
        `PREPARED LOCALLY · ${particular.byte_length} bytes · ${particular.sha256} · delivery/payment unissued`,
      );
    } catch (error) {
      if (run !== generation) return;
      status('pressing-status', `NOT PREPARED · ${error.message}. Nothing was delivered.`);
    }
  };

  setMode();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register(new URL('sw.js', base), { scope: base.pathname })
      .then(() => navigator.serviceWorker.ready)
      .then(() => {
        document.documentElement.dataset.offlineReady = 'true';
        status('offline-state', navigator.onLine ? 'OFFLINE READY' : 'OFFLINE');
      })
      .catch(() => status('offline-state', 'CACHE UNAVAILABLE'));
    window.addEventListener('offline', () => status('offline-state', 'OFFLINE'));
    window.addEventListener('online', () => status('offline-state', 'OFFLINE READY'));
  }
}
