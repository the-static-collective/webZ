# MUSIC FIELD 002 — Three Music Worlds, One Eleven-Dial Browser

Experimental first-party WebZ world, **stacked on Suno Atlas 001 PR #20**. This is a cross-platform music METADATA explorer, not an integrated commercial music client, auth broker, web scraper, track downloader or audio player. Original WebZ Sanctuary and Orchard remain unchanged.

## Run locally

Node.js 22+; from the experiment branch run:

    npm test
    npm run serve

Open http://127.0.0.1:8080/worlds/music-field/ on that same computer. The WebZ portal links to Music Field; Suno Atlas 001 still exists beside it. Click Load fictional demo to explore without private data.

## Three source adapters

- SUNO — Import your voluntarily provided CSV/JSON song metadata, or a prior Suno Atlas portable JSON. No credential or browser-session harvesting. Suno's September 2026 terms restrict automated extraction. Supported original links are public HTTPS suno.com/song/{id} and suno.com/s/{id}.
- BANDCAMP — Import artist/album/track CSV or JSON you have permission to use. Original links must be HTTPS Bandcamp track/album paths, on bandcamp.com or subdomains like artist.bandcamp.com. Bandcamp's official API requires a registered client for eligible labels/fulfillment operators; having a password isn't API access. Source: https://bandcamp.com/developer
- YOUTUBE — Import manually prepared metadata CSV/JSON, or documented YouTube Data API playlistItems.list/videos.list JSON. The adapter uses the original video ID, not an unrelated playlist-item ID. Private user information requires Google OAuth 2.0 and authorized YouTube Data API access; 002 does not connect to Google accounts. Sources: https://developers.google.com/youtube/v3/docs and https://developers.google.com/youtube/v3/guides/authentication

Each import is chosen from files by the operator; up to 8 files at once and 6 MB each. No source is silently auto-discovered. The CSV format accepts fields title, id, artist, album, created_at, duration, tags, model and source_url. Unsupported fields such as lyrics, unneeded prompts, tokens, cookies, financial data and account credentials are dropped rather than indexed.

## One source-neutral record grammar

Tracks, releases and videos have separate source-qualified identities: suno:clip0123, bandcamp:track0001, youtube:abcDEF12345. Source IDs never silently merge across providers. If an original ID is missing, a reproducible but clearly LOCAL_DERIVED identifier is used; that is not an authenticated provider ID.

An optional user-supplied related array of source-qualified IDs creates USER_DECLARED_RELATION links. A matching title, shared style, or visual proximity never proves two sources are the same song, work, master recording or copyright. Source URLs open on explicit user click only, never autoplay or iframe embed.

## Eleven dials and actual source counts

Vertical tuning: 1 = all matching records; 2–11 = up to ten actually occurring tags in the chosen source scope. Empty dial positions remain empty. Horizontal granularity: 11×2^(dial-1) visible records and year/quarter/month/week timeline grouping. ENTER commits a child 11-dial pair; RISE restores its parent; ROOT clears navigation to all sources. Platform filter ALL, SUNO, BANDCAMP or YOUTUBE is independently controllable.

World addresses begin MF2/mf-... and contain the data fingerprint, source filter and exact nested dials. Fingerprints are deterministic navigation checks, not cryptographic provenance signatures. Changed datasets cause old address refusal rather than silently redirecting.

Graphs derive from imported platform counts, real dates and supplied tags. Explicit cross-source links are counted separately and never derived from names, likes, views, listener analytics or musical similarity.

## Manual local custody

Save/Load/Delete is optional, explicit browser IndexedDB local storage in its own Music Field database; nothing auto-reopens on reload. JSON portable backup preserves source-qualified IDs for reimport, suitable for use across browsers if you handle your private music metadata carefully. IndexedDB is not encrypted cloud backup and browser history retains nonsecret dial addresses only. No remote upload.

## Future authorized account connectors

1. YouTube first: a properly registered Google OAuth client, user-consented narrow youtube.readonly scope, secure redirect/PKCE as appropriate, quotas, pagination, refresh-token security, privacy review and disconnect flows before any account sync.
2. Bandcamp second: seek documented API client approval for a permitted artist/label workflow, or continue with local exports. Do not reuse session cookies as API credentials.
3. Suno: evaluate supported library APIs or explicit export mechanisms if the provider authorizes them. Do not scrape undocumented endpoints with a browser session.

Any future authenticated integration must preserve explicit source scope, revocation, owner permissions, audit receipts, and distinct source rights. It must never assume that user account access grants redistribution rights over audio.

**CREDENTIAL != AUTHORIZATION TO SCRAPE. SAME TITLE != SAME TRACK. DIAL != PLAY. VIEW != PUBLISH. SOURCE IDENTITY != LICENSE.**
