# ABUNDENT-THRESHOLD-001 — plant one banana

Status: **staged experiment** on `feat/abundent-threshold-001`, based on the unmerged `feat/static-web-001-public-field` branch (which itself depends on the unmerged Static Press #5 branch). Neither a published root redesign nor a production capability claim.

## First human task

Someone arriving with no architectural vocabulary should be able to:
1. recognize a usable public entrance;
2. choose one of six concretely addressable destinations;
3. understand whether that destination is a local experiment, an inspector, or an existing external music site;
4. prepare one thing locally through Static Press without imagining it has been uploaded, purchased, published, or produced;
5. return to webZ's founding porch, Front Room, or source evidence voluntarily.

Try the new page at `/abundent/` **on a build of this branch**. Do not assume it is the content currently served by the production apex.

## Actual doors

| Label | Target | Precisely available now |
| --- | --- | --- |
| Explore | `../worlds/sanctuary/` | First-party local Sanctuary world, deliberate crossing to Orchard |
| Grow | `../field/` | Source-pinned, read-only founding world/door map; cannot issue authority |
| Listen | `https://thestaticcollective.bandcamp.com/` | Manual handoff to independently operated Bandcamp |
| Post | `../porch/` | Consent-based local draft and independent decision rehearsal; no remote receiver |
| Make | `../press/` | Static Press local file/text proposal and hash; **no** return production/delivery/payment |
| Witness | `../proof/` | Bounded inspection of sample/imported crossing reports, not world admission |

The ring illustration is design only, not activity data. All door entries are human-clicked anchors: no background fetch, third-party embeds, telemetry, script, account, form, or local storage on the new Abundent page. Linked existing world apps keep their own independently documented behavior.

## Local-first boundaries

- No new server, payment processor, customer ledger, donation capture, blockchain, mail delivery, media ingest, machine actuation, physical custody, secret key, source license, or cross-world authority.
- Every target retains its project/world authority. Crossings are choices; signs and hashes do not substitute for rights.
- Root `/` and its installed service-worker fixed shell remain unchanged in this experiment. New `/abundent/` is an online-accessible **branch preview**; it is **not** in the fixed offline cache. Do not claim full offline support for this route yet.
- External links use manual navigation and `rel="noreferrer noopener"`; the new document sets referrer, CSP and no-connection policy.
- Responsive text-first page works without JavaScript, respects reduced motion and keyboard focus, with actual navigation paths, not fictitious button actions.

## Verification

On this branch, run:

```sh
npm test
npm run field:verify
npm run test:browser
npm run serve
# Open http://127.0.0.1:8080/abundent/
```

Additional `tests/abundent.test.mjs` checks the six destinations and the existing target files, absence of automatic/network effects, honest capability labels, source links, small-screen styles, and preservation of the root homepage.

## Review and publication gate (NOT performed by this PR)

1. Review the stacked ancestry, source pins and branch CI — especially tests and intended frontend exposure of Static Press and the public field.
2. Load the actual branch preview over HTTPS at `/abundent/`; test keyboard, 320px viewport, mobile touch, links, and external navigation. Verify no passive external requests.
3. Decide whether the future public root should be an Abundent homepage, a link into the entrance, or a reversible redirect. Do not silently alias the new page over the working webZ root.
4. If promoted into the fixed shell, explicitly update shared navigation, regenerate `sw.js` via `npm run field:build`, run `npm run field:verify`, then repeat offline/update/rollback tests on exactly that release commit.
5. Only after owner review and a separate deployment decision, promote the tested production build/alias. Validate `abundent.org` after promotion. Do not assume GitHub branch green checks or Vercel preview READY means deployed to the apex.

`INVITATION != DELIVERY`; `PROPOSAL != PUBLICATION`; `ADDRESS != AUTHORITY`; `PREVIEW != PRODUCTION`.

## Human success criterion

A newcomer can truthfully say: **“I arrived, picked a door, and completed one local action. I knew what had and hadn't happened.”**
