# webZ × GrO × GHoT — POSTAL PORCH 001

Status: source-hostable static experiment only; not a live HTTPS deployment, mail carrier service or payment system.

## Independent responsibilities

webZ provides a static postal porch at /postal/ and a bundled two-phone offline page at /postal/pocket/two-phones.html. webZ creates no sovereign world or backend.
GrO provides an independently authored local-only encounter, with notice/hold/refuse/leave-open choices. No public trace, Deed, PENNY units, or actual parcel moves.
GHoT remains the receipt verifier: only its separately pinned P-256 keys, original synthetic LemonPRESS source, nonce, expiry, and SQLite journal can admit a synthetic custody claim.

## Pinned donor evidence

GHoT POSTAL-CORPS-003 source commit 2a84276d3504bb4955b62e9ca56de110247e3eee.
Pocket core Git blob SHA-1: 51d2a1475a94523d858fae92e68e960d2942bc66.
Bundled Nayuki/Cyphrme MIT QR source Git blob SHA-1: b64f7cc2c3531abd74d74688efb7a600f86c1cdc, license included.
Original GHoT browser page Git blob SHA-1: 3a28ab66e9ef447fede8002340bcfb8804ddd41d.
To honor webZ's existing strict content-security policy, the original embedded JS and CSS were extracted to same-origin static files (two-phones-ui.js and two-phones.css).
GrO local encounter source Git blob SHA-1: 079b88e4a904dab39fcb01ec66f149191b2a6471.
Tests reject donor drift and prove independent P-256 signatures can be replayed into a held GrO choice.

## Run

  npm test
  npm run serve
  Open http://127.0.0.1:8080/postal/ on this same computer.

To try actual phones, configure a controlled HTTPS host for the webZ static files. This PR does not deploy hosting, authorize a carrier or make GitHub source pages into a live app. The two devices must independently create and enroll their P-256 public keys with a trusted GHoT operator before a signed route. Follow GHoT experiments/027-two-phones-one-parcel.md for the four QR transfers and separately trusted station reconciliation.

After the simulation, webZ Postal Porch can read a user-selected GHoT fictional fieldkit locally and replay signatures, route and history using the pinned source. The human explicitly chooses a local GrO disposition, then independently exports a minimized local artifact. Imported fingerprints are correlatable; do not publish them without informed consent. No original private keys, addresses or unredacted source fieldkit are transmitted.

Security limits: a verified public key is not a legally identified courier; offline phone clock values cannot prove the actual signing time; a signed claim is not proof of physical custody. GHoT station admission remains separate, and the import does not verify physical parcels or trusted human registration.

Normative: HOST != SOVEREIGN. HOLD != CUSTODY. ROUTE SIGNATURE != HUMAN IDENTITY. QR != POSTAGE. WEBZ WORLD != AUTOMATIC TRANSPORT. GHoT RECEIPT != PENNY PAYMENT.