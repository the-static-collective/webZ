import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MAX_FILE_BYTES,
  PRESS_ADDRESS,
  RETURN_KINDS,
  prepareFileParticular,
  preparePressingProposal,
  prepareTextParticular,
} from '../app/press.mjs';

test('public text becomes a bounded pressing particular without retaining source text', async () => {
  const particular = await prepareTextParticular({
    text: 'one small seed',
    publicLabel: 'seed note',
  });

  assert.equal(particular.kind, 'public-text');
  assert.equal(particular.public_label, 'seed note');
  assert.equal(particular.media_type, 'text/plain;charset=utf-8');
  assert.equal(particular.byte_length, 14);
  assert.match(particular.sha256, /^sha256:[a-f0-9]{64}$/);
  assert.equal('text' in particular, false);
  assert.equal('content' in particular, false);
});

test('local file becomes hash plus bounded metadata only', async () => {
  const bytes = new TextEncoder().encode('private local bytes');
  const particular = await prepareFileParticular({
    bytes,
    publicLabel: 'demo audio',
    mediaType: 'audio/mpeg',
  });

  assert.equal(particular.kind, 'local-file');
  assert.equal(particular.public_label, 'demo audio');
  assert.equal(particular.media_type, 'audio/mpeg');
  assert.equal(particular.byte_length, bytes.byteLength);
  assert.match(particular.sha256, /^sha256:[a-f0-9]{64}$/);
  assert.equal('filename' in particular, false);
  assert.equal('bytes' in particular, false);
  assert.equal('content' in particular, false);
});

test('file hashing is deterministic for the same bytes', async () => {
  const bytes = new Uint8Array([0, 1, 2, 3, 255]);
  const a = await prepareFileParticular({ bytes, publicLabel: 'a', mediaType: 'application/octet-stream' });
  const b = await prepareFileParticular({ bytes, publicLabel: 'b', mediaType: 'application/octet-stream' });

  assert.equal(a.sha256, b.sha256);
});

test('file bytes never require fetch or network access', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('NETWORK_USED'); };
  try {
    const bytes = new TextEncoder().encode('offline');
    await assert.doesNotReject(() =>
      prepareFileParticular({ bytes, publicLabel: 'offline seed', mediaType: 'text/plain' }),
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('empty and oversized local files fail closed', async () => {
  await assert.rejects(
    () => prepareFileParticular({
      bytes: new Uint8Array(),
      publicLabel: 'empty',
      mediaType: 'application/octet-stream',
    }),
    /FILE_BYTES_REQUIRED/,
  );

  await assert.rejects(
    () => prepareFileParticular({
      bytes: new Uint8Array(MAX_FILE_BYTES + 1),
      publicLabel: 'too large',
      mediaType: 'application/octet-stream',
    }),
    /FILE_LIMIT/,
  );
});

test('public text and public labels reject likely secrets', async () => {
  await assert.rejects(
    () => prepareTextParticular({
      text: 'api_key=should-not-be-public',
      publicLabel: 'seed',
    }),
    /PUBLIC_METADATA_ONLY/,
  );
  await assert.rejects(
    () => prepareFileParticular({
      bytes: new Uint8Array([1]),
      publicLabel: 'password=hunter2',
      mediaType: 'application/octet-stream',
    }),
    /PUBLIC_METADATA_ONLY/,
  );
});

test('proposal is webZ-native but cannot masquerade as a crossing or receipt', async () => {
  const particular = await prepareTextParticular({
    text: 'make this strange',
    publicLabel: 'strange seed',
  });
  const proposal = preparePressingProposal({
    particular,
    returnKind: 'MANGA_CARD',
  });

  assert.equal(proposal.schema, 'webz/static-pressing-proposal/v0');
  assert.equal(proposal.webz_address, PRESS_ADDRESS);
  assert.equal(proposal.authority, 'browser-local-proposal');
  assert.equal(proposal.delivery, 'not-issued');
  assert.equal(proposal.payment, 'not-issued');
  assert.equal(proposal.reuse_license, 'none-implied');
  assert.equal(proposal.requested_return_kind, 'MANGA_CARD');
  assert.equal('crossing_id' in proposal, false);
  assert.equal('receipt_id' in proposal, false);
  assert.equal('decision' in proposal, false);
  assert.equal('signature' in proposal, false);
});

test('only declared return kinds are accepted', async () => {
  const particular = await prepareTextParticular({
    text: 'seed',
    publicLabel: 'seed',
  });

  for (const returnKind of RETURN_KINDS) {
    assert.doesNotThrow(() => preparePressingProposal({ particular, returnKind }));
  }
  assert.throws(
    () => preparePressingProposal({ particular, returnKind: 'FULL_ALBUM' }),
    /INVALID_RETURN_KIND/,
  );
});
