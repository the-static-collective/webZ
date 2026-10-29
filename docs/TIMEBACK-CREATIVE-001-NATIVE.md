# TIMEBACK-CREATIVE-001 — The card crosses into source-owned creation

**Status:** Draft, stacked on FINITE-DELIGHT-001 (#205) and USE-FIRST-001 (#204). Neither source owner has been changed, no new person or organization has been enrolled, and this code is not deployed.

## One minute → something you can keep

1. Visit the existing, bounded Three Bells arcade. Choose a topic (or none), read a finite local card and keep it or leave.
2. Open **Make something bigger from this card** only if interested. This is optional, never a mandatory next step to complete the episode.
3. Click **Prepare a tiny book edition** to download a canonical `lemonPRESS` forming/pending work packet, or **Prepare a PlayDeck video job** for a source-pinned native execution request.
4. The person can stop immediately. No upload, contact, account, email, rendering or publishing happens in the browser. This is a *carry*, not an effect.
5. When using an operator computer, explicit local commands can turn an approved source packet into an actual privately printable HTML edition, or compose a real PlayDeck plan from user-supplied images and audio.

## Actual source contracts

| Owner | Exact source | What genuinely executes | Never claimed |
|---|---|---|---|
| lemonPRESS | `the-static-collective/lemonPRESS` commit `02feb4454240d482a5e0e03258f24f8b5cc0b9f5`; original `schemas/work-manifest.schema.json` blob SHA `44f2f764e272c7a3e2591d6154a8d1daa3394f2d` | A visitor-specific work packet shaped to the original schema, then **validated against that unmodified original schema in CI**. A separate webZ-side operator adapter produces a private print-ready 6×9 HTML proof, source Markdown, the unchanged native manifest and explicit WRENCH preparation notes. | LemonPRESS source runtime publication, admission, distribution or human editorial approval. The HTML production adapter is in webZ and does not claim to be original LemonPRESS production code. |
| PlayDeck | `the-static-collective/playdeck` commit `a7cf718421e767fd382a01894063c3eeba3d2930`; real `packages/cli/bin/playdeck.mjs` | An explicit local adapter validates a canonical browser packet, requires user-given images and audio and executes the **original source-owned PlayDeck CLI**. On default `--no-render`, emits original `deck.json`, `track.json`, `world-rule.json`, `plan.json` and `receipt.projected.json` plus a separate webZ provenance note. CI runs this path with original synthetic fixture media. | No MP4, no render receipt, and no inherited creative work in no-render mode. Optional `--render` is a real original CLI invocation but must be separately tested on actual supported hardware. |
| Haunted Toaster | Official published Windows portable/installer release `v0.5.0-alpha.8` and developer source, with unmerged beta PR `#275` kept distinct | Direct deliberate navigation to the original published application so a person can use the native desktop renderer, with their own rights-cleared song. | Three Bells does not control an installed Toaster, render videos on its behalf, or represent its unmerged beta as a released binary. |

A downloaded packet contains visitor text **locally**, and they choose whether to share or upload it anywhere else. It is not hashed as a signed authority. Any human permission, third-party resource, rights to use song and images, or publication rights remain external human responsibilities.

### Direct user-facing output: private tiny print edition

The first use can stop at an immediate printable text card already in Three Bells. For a source-aligned private HTML edition on an operator computer:

```sh
node tools/timeback-press-edition.mjs \
  --packet /path/three-bells-wonder-lemonpress-draft.json \
  --out /empty/folder/you/choose
# Open edition.html locally, or print to PDF through the web browser.
```

It writes `work-manifest.json` (native schema-shaped, `status=forming`, `admission=pending`), `source.md`, `edition.html`, and `wrench-preparation.json`. It refuses to overwrite an existing edition or proceed with an altered packet.

### Actual PlayDeck source owner, no-render first

First install Node 22+, FFmpeg and ffprobe, and the original PlayDeck dependencies. Checkout the exact commit, then from the parent directory:

```sh
git clone https://github.com/the-static-collective/playdeck.git playdeck
git -C playdeck checkout a7cf718421e767fd382a01894063c3eeba3d2930
(cd playdeck && npm install)
node tools/timeback-native-playdeck.mjs \
  --packet /path/three-bells-wonder-playdeck-draft.json \
  --playdeck /path/to/playdeck \
  --images /path/to/your/allowed-pictures \
  --audio /path/to/your/allowed-song.wav \
  --out /empty/folder/you/choose
```

This executes the original PlayDeck CLI with **`--no-render`**. The contents of the card are not silently used to invent media; the original compositor uses the *actual user-supplied images and audio*, while the card supplies the title, the admitted intent, and a separate provenance note.

For a **separate explicit** normal render request, a local operator can append `--render`. That option is passed through to the actual PlayDeck CLI and requires a proper Remotion/FFmpeg-capable machine. This PR's CI only proves the faster no-render composition and expressly does **not** certify a completed video.

No browser button runs the operator commands, and nothing is automatically submitted to a remote host. No actual beta Toaster invocation exists in this PR.

## CI and falsifiability

- `tests/timeback-source.test.mjs` rejects modified owner/source, changed content, and falsely promoted manifests.
- `tests/timeback-press.test.mjs` executes the local printable HTML production adapter and checks escape safety and pending status.
- `tests/arcade_browser.py` tests human-directed exports from real mobile Chromium and verifies no outgoing requests.
- `.github/workflows/timeback-creative.yml` checks out exact pinned original PlayDeck and LemonPRESS source revisions in separate working directories, runs original PlayDeck with **synthetic** WAV and its own supplied image sample folder, and validates the source-owned LemonPRESS work manifest with the original Draft 2020-12 JSON schema. Receipt and plan artifacts are retained for audit.
- Tests, builds, and code provenance are not proof of human adoption, savings of minutes, satisfaction, or actual external publication.

## Next crossing, not implied today

An opt-in machine-local native Toaster media submission using a supported, released API and a user-owned song would enable a second truly rendered media lane. A separately source-authorized LemonPRESS publishing action could turn a private forming edition into admitted work. Do **not** weaken these gates to make the orchestration appear complete.

The success test remains **a person receives something they value, with an easy exit and no demand to return**.
