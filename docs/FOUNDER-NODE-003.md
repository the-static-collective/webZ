# Founder Node 003 — an independently keyed world can begin

**Status:** runnable experimental key-custody software. Stacked on Wandering Lens 002, not merged into WebZ main, not deployed to a remote node and not recognized by the existing Sanctuary / Orchard sovereign world router.

## Purpose

A visitor-produced local WORLD_SKETCH can establish a new experimental namespace **only after** (a) a held original reflection and locally admitted world sketch, (b) a candidate-owned signed petition, (c) a separately keyed founder's explicit, scoped local admission and (d) the candidate's independently signed acceptance. The resulting two-key chain can be cold-verified with **separately obtained public key pins**. Candidate custody and founder sponsorship are distinguishable.

Cryptographic **Ed25519 public-key possession** does NOT verify legal name, independent human beings, copyright, church affiliation, public network presence or authority to enter a different owner's world. One person could control both private keys; the user should physically separate the files and real operators for a meaningful independent pilot. This prototype does not initiate a real reLATTE R3 crossing.

## From approved Wandering Lens 002 into a charter

1. In `worlds/wandering-lens/`, hold a reflection, propose a WORLD_SKETCH, click Inspect, then Admit to local annex. It will be distinguishable and user-local. Click Review annex export and explicitly download the private joined JSON. **That private file contains the visitor's free-form answers; do not upload it publicly or email it to strangers.**
2. On the candidate owner's Linux/macOS computer running Node.js 22+, separately create a private key. On the founder operator's distinct computer, create a different private key. Keys are exclusive-write, mode 0600; CLI rejects group/world-readable private keys. `init` writes a public `.pub.json` companion. Confirm pins over a channel that the candidate and founder trust.

Example paths are illustrative; do not use these commands with real-world sensitive material on a shared/public computer:

```sh
npm run founder:003 -- init --key ./private/candidate.pem
npm run founder:003 -- init --key ./private/founder.pem
```

3. Candidate makes a **redacted signed petition** from the private annex export. Its public output includes the proposed title/description, exact parent/child addresses and cryptographic references to the private record; it **does not contain the full original private visitor answer**:

```sh
npm run founder:003 -- petition --annex ./private/visitor-annex.json \
  --proposal wl2-001 --key ./private/candidate.pem --out ./papers/petition.json
```

4. Founder reviews the **petition and separately verified candidate public pin**. Only if the founder chooses to sponsor this **experimental namespace**, not a legal or existing WebZ sovereign world:

```sh
npm run founder:003 -- admit --petition ./papers/petition.json \
  --candidate-pin ./private/candidate.pem.pub.json \
  --key ./private/founder.pem --approve-local-world --out ./papers/admission.json
```

5. Candidate independently inspects the founder's public pin and admission, then signs owner acceptance:

```sh
npm run founder:003 -- accept --petition ./papers/petition.json \
  --admission ./papers/admission.json --founder-pin ./private/founder.pem.pub.json \
  --key ./private/candidate.pem --out ./papers/acceptance.json
```

6. Assemble and independently verify the public papers using BOTH pinned public keys:

```sh
npm run founder:003 -- bundle --petition ./papers/petition.json \
  --admission ./papers/admission.json --acceptance ./papers/acceptance.json \
  --out ./papers/charter.json
npm run founder:003 -- verify --bundle ./papers/charter.json \
  --candidate-pin ./private/candidate.pem.pub.json \
  --founder-pin ./private/founder.pem.pub.json
```

Successful output contains a stable `webz:founder-lab/...` world ID, namespace owner public key, exact nested MWF1 child address and explicit status `ACTIVE_LOCAL_EXPERIMENTAL`. It has no entry URL, no broadcasting/media rights, no cross-world access, no deployment and no source-owner verification. The existing WebZ `WORLDS` list remains exactly two entries.

### Owner withdrawal

```sh
npm run founder:003 -- withdraw --bundle ./papers/charter.json \
  --founder-pin ./private/founder.pem.pub.json --key ./private/candidate.pem \
  --out ./papers/withdrawal.json
npm run founder:003 -- verify --bundle ./papers/charter.json \
  --candidate-pin ./private/candidate.pem.pub.json \
  --founder-pin ./private/founder.pem.pub.json --withdrawal ./papers/withdrawal.json
```

Current projection becomes `OWNER_WITHDRAWN_LOCAL`. **Important:** a verifier holding only an old bundle cannot discover later withdrawal. Production needs an authenticated, monotonic current-state/revocation service or synchronized receipt inventory before relying on this as live governance. Never reuse an old `ACTIVE` projection as proof of current consent.

## Clickable signature inspector

Run `npm run serve`, open `http://127.0.0.1:8080/worlds/founder-node/` on that computer, and choose the **signed public charter bundle** and the two **independently verified public-key pin files**. Optionally select a signed owner withdrawal. Click Verify. In a compatible browser with WebCrypto Ed25519, the page validates exact signing envelopes, signature bytes, identity pins, authority scope and linked hashes without uploading files. If Ed25519 support is unavailable, the inspector fails closed; the Node CLI remains the reference verifier.

Do **not** load private `.pem` files into the browser, source journal or annex export into this public inspector. Browsers do not authenticate the human who brings each file; the pins must be independently established outside the page. The first-party offline service worker caches only public program code.

## Limits and threat model

- Signed paper authenticity is relative to independently trusted public keys. It is not a government legal deed, broadcaster license, ownership of intellectual property or evidence of independent human participation.
- The founder admission attests that a founder-controlled key deliberately supports an exact petition in its local experimental namespace. The founder does not control the candidate's separate private key, but this is not a service that independently enforces namespace governance.
- A candidate signs a redacted account of a locally approved sketch. The founder has **not** cryptographically verified that this private source really belonged to another human. Private source hash is an identifier, not proof of underlying historical facts.
- CLI files are created with exclusive flags; further filesystem hardening, file locking, atomic transaction bundles and a trusted secure key store are needed before handling valuable production identities. Avoid shared computers and insecure sync folders.
- The prototype does not include a live peer-to-peer node, discovery registry, ledger replication, active revocation lookup or independently authorized real WebZ crossing. It does not start OBS/GHoT, play audio or alter public hosting.

**KEY != PERSON. FOUNDER != OWNER. PETITION != ADMISSION. ADMISSION != ACCEPTANCE. EXPERIMENTAL NAMESPACE != REAL WORLD TITLE. HISTORICAL CHARTER != CURRENT CONSENT.**