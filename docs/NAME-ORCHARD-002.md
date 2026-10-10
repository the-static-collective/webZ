# NAME ORCHARD 002 — SMS Postcards

Experimental SMS transport stacked on NAME ORCHARD 001 (PR #42). No merge, SMS gateway, or production deployment.

## Two transport modes

**One-text invitation:** A short, unsigned public link to "Let It Find Us". Needs Internet to visit Suno. Never call it a signed claim.

**Signed SMS postcard:** The operator explicitly selects a NAME ORCHARD 001 witness JSON. Only its FIRST Ed25519 signed song claim is transmitted in numbered ASCII parts. MP3 bytes, custody evidence, whole witness, signing secrets and lyrics are not included.

Frame grammar:

    NO2-<12 hex grouping tag>-<2-digit index>-<2-digit total>-<base64url payload>

- Each frame <= 140 ASCII characters, with up to 115 payload characters; at most 24 frames, 2048 unencoded claim bytes, at most 72 input lines (for exact duplicate arrival).
- Grouping tag = initial 12 characters of SHA-256 of assembled JSON bytes. This is a **non-authenticating transport corruption/assembly check**, not the Ed25519 signature.
- Receiver reconstructs content only after all parts are present. Missing parts HOLD and list their indices. Mixed tags/totals, conflicting duplicates, overflow, tampered packets, malformed Unicode or invalid signed claims all HOLD.
- Signed claim verification authenticates an *embedded ephemeral demo key*, not phone number, artist identity, permission, original copyright, source availability, or sender trust.
- No expiration, revocation or replay controls yet. A valid packet can be resent later.

## Operator commands (Node.js 22+)

    npm run name:demo -- > witness.json
    npm run name:sms -- postcard
    npm run name:sms -- pack witness.json > parts.txt
    npm run name:sms -- verify parts.txt
    npm run serve

Open http://127.0.0.1:8080/worlds/name-orchard/sms.html.

On a phone accessing this experimental page, select your witness JSON and copy/share each outgoing part deliberately. The optional 'Open SMS composer' link proposes a prefilled message but **never** selects a recipient or sends it. OS support for sms:?body= is inconsistent; copy/paste remains available.

For reception, paste each SMS part (one per line) into the recipient box, in any order, and press Verify. WebCrypto Ed25519 signature checking is local. It does not open media, save to browser storage, contact Suno, or grant acceptance authority.

## Safety, cost and permission boundaries

Traditional SMS isn't end-to-end encrypted. Carriers and recipients can see each signed claim's source URL, signing key, hash, and named song. Messages may incur carrier costs, filtering, delays, concatenation or truncation. Under no circumstance send secrets, signing private keys or sensitive identifiers with this scheme. We do not integrate Twilio, a carrier SMS API, Android SMS permission, automatic background delivery, or programmatic SMS sends.

The signed postcard is an **assertion**, not a reLATTE signed RECEIVE or custody receipt. No real phone-to-phone delivery has been verified here.

Test gate: npm test (missing/reordered/mixed/duplicate/forged/overlength), python tests/name_orchard_sms_browser.py (real Chromium mobile-width WebCrypto verification, HOLD, no passive external requests). Both included in the GitHub workflow. No physical SMS carrier test or hosted availability claim.

## Next crossing

Distinct persistent receiver keys, challenge/nonce exchange, optional SMS reply, verified receipt under local human control, and transport-neutral same-envelope carriage by Bluetooth/Wi-Fi/QR. The SMS road must never confer message authority on its own.

**SMS CARRIER != SIGNER. CLAIM != MEDIA. SIGNATURE != CREATOR. COPY != SEND. RECEIVE TEXT != ACCEPT.**
