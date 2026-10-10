# MUSIC FIELD 004 — The Listening Orchard (Audius public catalog)

**State:** stacked experimental branch on Music Field 003 (`experiment/music-field-003-youtube-oauth`). NOT merged into main; NOT published to abundent.org. No credential, audio, or account connection. Audius is an independent external territory, not an Abundent-owned catalog.

## First human song capsule — Let It Find Us

Operator supplied an MP3 and a Suno public-share address:
- `https://suno.com/s/G0cLbwecX7g0qFUB`
- Embedded MP3 title: `Let It Find Us`; embedded artist: `thestaticcollective`
- MP3 observed duration 186.504 seconds (~3:06.5), stereo, 48 kHz, audio stream MP3.
- SHA-256 of **uploaded source bytes**, not a provider-authenticated original: `59fb74c9553a310182f7542ff6cb4928f6fa5d09acceaa0723f72ba984342605`
- Filesystem bytes are not committed, redistributed, played or uploaded to the website. A hash witnesses the specific submitted bytes only, not authorship or rights.
- The [user-selected Suno import fixture](../examples/music-field-004-let-it-find-us.json) has an integer-second `seconds:186` because the existing Music Field model stores integer seconds. The three descriptive tags are **local editorial tags inferred from supplied lyrics**, not source-verified Suno metadata. Release date, album, Suno model and rights are UNKNOWN and intentionally absent.
- The seed's `source_id` comes from the user-provided Suno URL; it is not separately verified via Suno API.
- The source file remains the user's asset. This fixture grants **no permission to download, copy, remix, broadcast, publish or redistribute** it; those are separately decided.

## Audius source crossing: two operator decisions

1. **Look up public information** on a trusted Node 22+ device. Run either:

       npm run music:audius -- search "folk"
       npm run music:audius -- track D7KyD

   Or save a specific response to a local file (shell redirection is explicit):

       npm run music:audius -- search "folk" > audius-candidates.json

   The fixed HTTPS endpoint is `https://api.audius.co/v1/tracks/search` or `/tracks/{id}`. The command does a single explicit read-only request, without login, API key, followers, state-changing API, media download, proxy, redirect follow, telemetry or provider scraping. Network access and a working Audius public endpoint are required. External service terms, availability and rate limits apply.

2. **Admit selected metadata locally.** On WebZ Music Field 004, choose **Audius** from the source dropdown and select the JSON file you chose to retain. Records enter only the active in-memory local source-qualified 11×11 graph. They are not saved until an additional explicit Save. Alternatively click **Load “Let It Find Us”** in the Music Field source gates for an intentional, in-memory admission of the first Suno song capsule (no file chooser needed), or choose **Suno** and manually import `examples/music-field-004-let-it-find-us.json`. Both source branches coexist without implying identity or licensing connections.

## What actually changes

- Fourth source `AUDIUS` joins `SUNO`, `BANDCAMP`, `YOUTUBE`; source-qualified IDs use `audius:{id}`. All 11×11 addresses and local counts naturally include it; four nodes render within the existing graph.
- The model accepts only `https://audius.co/{artist}/{track}` canonical-style artist/track links (with an optional www). Lookalike origins, query tokens, fragments, arbitrary redirects and malformed paths HOLD.
- The Node adapter maps ONLY track ID, title, performer, date when parseable, integer seconds when present, some public genre/mood/tags and validated canonical source URL to the existing **whitelist**. It deliberately drops waveform streams, album art URLs, private URLs, wallets, user records, credentials, descriptions and any unknown fields.
- No external request is performed by the Music Field browser page. CSP continues `connect-src 'self'`, `media-src 'none'`. Audius entries use only deliberate outbound original-page links, with no automatic playback or embedding.
- Existing local user snapshots with three sources remain valid. Newly saved four-source catalogs naturally have a different fingerprint, and an old dataset address is not silently remapped.

## Tests and human boundary

Run `npm test` from the branch. `tests/music-field-004.test.mjs` uses **injected mock responses** to test official-host URLs, artist metadata shape, upload-secret exclusion, malformed rows, size guards, read-only request behavior, canonical URL refusal and Suno seed+Audius coexistence. CI never requires a real Audius connection; a successful real live request is **not yet evidenced** by these tests.

Run `npm run serve` to visit `http://127.0.0.1:8080/worlds/music-field/` and manually exercise both import fixtures. The YouTube 003 loopback bridge remains a separate operator-invoked mode and is not replaced.

**SOURCE ID != SONG IDENTITY. METADATA != LICENSE. LOOKUP != IMPORT. IMPORT != SAVE. VIEW != PLAY. HASH != AUTHORSHIP.**

Audius docs: https://docs.audius.co/api/ · https://docs.audius.co/sdk/tracks/
