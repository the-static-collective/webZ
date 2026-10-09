# MUSIC FIELD 003 — local consented YouTube account adapter

Status: experimental, code implemented and CI with MOCKED Google endpoints; NO ACTUAL USER ACCOUNT CONNECTED, no deployment, no production security assessment. Stacked on Music Field 002 draft PR #23. The existing 11-dial WebZ library and its file imports continue to work as before.

## Exact new behavior

Connect an OAuth-authorized YouTube account from a local desktop browser, using Google's installed/desktop OAuth 2.0 loopback flow with PKCE S256 and explicit youtube.readonly scope. A local Node server binds to 127.0.0.1 on a fresh random port. An operator must separately press Connect, List playlists, choose a playlist, Preview, and Import to bring metadata into the existing in-memory Music Field. Zero automatic metadata imports, polling, player/embed, uploads, Bandcamp logins or Suno scraping.

Tokens, PKCE verifier and consent state remain in Node server memory only and expire when the process exits; no refresh-token persistence, no browser localStorage, no metadata export of credentials, no direct provider credentials in browser code. The existing *manual* IndexedDB metadata snapshot is unaffected: it holds only the normalized imported records if the operator chooses to save.

## Prerequisites — separate consent required

1. A machine with Node.js 22 or newer, and an ordinary desktop browser on the **same computer**. This is a desktop OAuth loopback experiment. Google's mobile loopback support is deprecated; this is NOT a direct Android OAuth implementation.
2. Create/select a Google Cloud project, enable **YouTube Data API v3**, configure the OAuth consent screen and suitable test users if the app is in testing, then create an OAuth **Desktop app** client. Review Google's requirements for scopes and app verification.
3. The operator supplies that OAuth client ID through a local environment variable. For Google client configurations requiring an associated desktop client secret at exchange, pass the optional local secret environment variable. Never commit or paste either private field into a repo or conversation. A Desktop client secret cannot be treated as a strong confidential app identity.

Example on a local Unix shell:

    MUSIC_FIELD_GOOGLE_CLIENT_ID='YOUR_DESKTOP_CLIENT_ID.apps.googleusercontent.com' npm run music:live

If a Google Desktop client requires its accompanying client secret at token exchange:

    MUSIC_FIELD_GOOGLE_CLIENT_ID='YOUR_DESKTOP_CLIENT_ID.apps.googleusercontent.com' MUSIC_FIELD_GOOGLE_CLIENT_SECRET='YOUR_LOCAL_DESKTOP_CLIENT_SECRET' npm run music:live

The process prints a LOCAL URL such as http://127.0.0.1:<randomport>/worlds/music-field/ . Open this exact address in the browser on the same machine (not on a remote Android device). There is no public server deployment. The redirect URI is `http://127.0.0.1:<actualport>/oauth/youtube/callback` and uses a random available port as recommended for installed-app loopback flows. Browser access to Google uses an ordinary external browser tab/navigation, not an embedded webview.

### The operator click sequence

1. Click **Connect YouTube through Google**. A fresh PKCE state/challenge is constructed on the local server. Only a valid matching 5-minute state can exchange the one-time code. Google presents account consent; deny leaves the bridge disconnected.
2. After Google redirects locally, Music Field shows the local connected state. It has not imported anything.
3. Click **List my playlists**. The server requests playlists.list(mine=true,part=snippet,contentDetails,maxResults=50) from Google's documented API. At most 2 pages / 100 playlist names are returned per click.
4. **Alternatively paste a playlist share link** such as `https://youtube.com/playlist?list=PLexample-id123&si=share-tracker` into the direct link field, then click **Check pasted playlist**. The local bridge strips `si`, rejects lookalike/non-HTTPS origins and looks up that exact ID through the official `playlists.list?id=...` API under the already consented read-only Google session. If available to the signed-in account, this creates a locally selectable preview candidate; it does **not** establish playlist ownership, automatically read every item, save to IndexedDB, or transfer any audio. An inaccessible, deleted, or unsupported playlist explicitly HOLDs. A pasted URL alone does not bypass OAuth. This direct-link path was added specifically to support real shared playlist specimens without assuming the playlist belongs to the connected account.

5. Choose ONE checked or listed playlist, then click **Preview selected playlist**. The server requests playlistItems.list(part=snippet,contentDetails,maxResults=50), at most 3 pages / 150 entries. Unavailable entries with no video ID are omitted. Only video ID/title/video creator/selected playlist title/published date/official source URL are returned; descriptions and credentials are not retained.
6. Click **Import selected metadata into my graph**. Normalized records enter the existing Source-Qualified 11-dial index. If the same YouTube video ID conflicts with earlier imported metadata, the importer HOLDS rather than silently replacing it. Local snapshots are opt-in and require another explicit Save click.
7. Click **Disconnect / revoke**. The local token and selections are erased immediately. The server attempts Google's token revocation endpoint. If remote revocation is not confirmed, the UI explicitly says so; revoke access through Google Account connections if appropriate. Already imported local metadata stays until you clear it.

## Safety / limitations

- Hardcoded Google endpoints; no arbitrary proxy or user-defined upstream base URL in production. Browser origin/Host, session cookie, mutating request headers and PKCE state are checked. Only 127.0.0.1 listens; remote devices cannot reach it. Login callback consumes pending state exactly once.
- On an expired or revoked access token, return an explicit re-consent demand. No background refresh, token persistence, app daemon, analytics or account polling. Service closes when the Node process ends.
- The loopback source is single-user development software, NOT hardened against malicious programs already running under the same local OS user. Use a trusted desktop and browser profile; do not run untrusted local software or an Internet-facing reverse proxy around it.
- Google may apply scope verification and quota limits. Provider-specific 4xx, revocation and malformed responses fail closed. No real OAuth user consent can be validated by CI without an actual user and Cloud client; all tests mock the Google endpoints.
- Suno (September 2026 terms) disallows scraping or similar automated extraction; Music Field 003 does not harvest sessions or crawl its library. Bandcamp's official API is limited to approved client access; the Bandcamp importer remains manual until approved access is available.
- The YouTube playlists are account-related data: metadata import is for owner-local use and is not a license to publish/redistribute audio. The app never plays or downloads YouTube tracks.

### Official references

- https://developers.google.com/youtube/v3/guides/auth/installed-apps
- https://developers.google.com/youtube/v3/docs/playlists/list
- https://developers.google.com/youtube/v3/docs/playlistItems/list
- https://bandcamp.com/developer
- https://suno.com/terms/

**CREDENTIAL != AUTHORIZATION. OAUTH CONSENT != IMPORT SELECTION. IMPORT != LOCAL SAVE. VIEW != PLAY. TOKEN REVOKED != EXPORTED METADATA DELETED.**