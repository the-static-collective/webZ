# ABUNDENT-LAUNCH-001

The issue owner authorizes publication of the verified first-party WebZ UI on `abundent.org`. This integration preserves the eleven founding cards, twenty-four contracts, original manifest hash and all existing Sanctuary/Orchard, FORAGE and GLEAN behavior. Publication makes the first-party browser surfaces reachable; it does not admit proposals, authorize remote effects, authenticate operators, establish donor availability or grant rights to neighboring projects.

## Exact source map

Observed on 2026-10-10 from live GitHub refs, including PR descriptions/comments and executable source. All six reference PRs remain open drafts at this observation; no GitHub approval review is asserted. The integration has its own Node and Chromium gates rather than inheriting a draft's release status.

| Source | Exact observed head | Treatment |
| --- | --- | --- |
| main | `e1c56b019286922b04cef59922ef071034c32790` | Integration parent, including merged FORAGE/GLEAN |
| PRESSING [#5](https://github.com/the-static-collective/webZ/pull/5) | `1ad3bfd5d2429ec36f843818ac6f5bbde401e177` | Preserved via #7 history; local file/text hash proposal only |
| PUBLIC FIELD [#7](https://github.com/the-static-collective/webZ/pull/7) | `b0ef20554df647edded47e2a9c20d8f7807598d4` | History-preserving integration merge, three conflicts reconciled |
| WANDERING LENS [#10](https://github.com/the-static-collective/webZ/pull/10) | `36a18117f31b7ade59148a3b82ac1fb9167b1d01` | Exact MWF1 navigation primitive extraction only |
| SUNO ATLAS [#20](https://github.com/the-static-collective/webZ/pull/20) | `c56b2298d992fb06ab6ed80c61c4bda579e4d1e0` | Source inspection; route and data absent |
| MUSIC FIELD [#23](https://github.com/the-static-collective/webZ/pull/23) | `fcdb6290090dd19f23f6502826d5760b80d90850` | Scoped-facet design reference; music/import/storage code absent |
| CENSUS [#25](https://github.com/the-static-collective/webZ/pull/25) | `118eb60f4d8b1c244a0b40ea71f229946940669e` | Fragment-only cache fix reused; census human admission remains pending, no candidate or synthetic fixture admitted |

Founding field identity: `sha256:d3fa28fa3e1e2d2e370287422242fc8eab3c0362e27b61f54d0392430f8e21d1`. Source observation identity: `sha256:3aa8ae883e46226e19a5c8d5a9f376c62de3a443df17866c1e8dd09799acf220`. These archival observations retain their original dates and non-claims. The separate release manifest records deployed code without rewriting archival door authority.

The merge retains both parents and original PR commits. Homepage links and every FORAGE/GLEAN cache asset are retained. Two existing cache-source assertions accept either quote style; the FORAGE private-receipt refusal is bounded to receipt paths rather than matching the new committed public-field receipt. The semantic privacy checks remain in the browser suites.

## Navigator contract

`/field/` remains complete ordinary HTML, readable without JavaScript. `/field/navigate/` is optional and linked from homepage and field. Vertical 0–10 selects the current scope's most frequent activity/state/owner facets, with position 0 retaining everything. It never maps the eleven founding cards one-to-one to eleven positions. Fewer facets produce truthful unused positions. Horizontal 0–10 reveals names, owners, descriptions, observations, states, contracts, reasons, next gates, source pins, laws and full provenance.

Enter narrows to the selected set and resets the local dials; Rise restores the exact parent pair; Root resets the catalog. An empty scope cannot Enter. Native sliders, a keyboard pad, touch swipes and a 121-button grid are functional. Normal page scrolling remains available outside the swipe pad; the grid can scroll horizontally on narrow displays to retain usable touch targets.

`WFN1/<full catalog SHA-256>/<MWF1 pairs>` pins exact catalog identity and preserves up to 96 ancestor pairs. Base-11 BigInt cells remain exact. Catalog IDs use `webz:founding/<world>/<door>`; no music, people, artwork or place equivalence is inferred. Browser history and cold browser replay reconstruct the same IDs. Invalid/stale links preserve the original URL, show HOLD and display no inferred result until explicit navigation. No address in browser storage, private inputs, autosave or remote actuation is added.

[`navigation-provenance.json`](../field/navigation-provenance.json) records both the upstream whole-file digest and extracted module digest. The worker fragment canonicalization and its regression are adapted from PR #25 at the exact head above; its separate census/admission code is absent. The extraction excludes the lens scene, numerical preview, private journal and local media controls. The founding snapshot does not import Music Field identities or metadata.

## Hosting and public boundary

Existing team: `theotherlucasv-1250s-projects` / `team_A6mP6EYc1iOBxsd7jYsniIox`. Existing project: `webz-field-porch` / `prj_eMffWbYyflZmlCcVU0SvadSOh0eq`. Verified baseline production: `dpl_Gk7fjb5mXeeJ9br74XRCYg3eMoDh`, SHA `e1c56b019286922b04cef59922ef071034c32790`, URL `https://webz-field-porch-d8xof4ea1-theotherlucasv-1250s-projects.vercel.app`.

On 2026-10-10 the Vercel domain API reported correct external Porkbun DNS, no conflicts and no misconfiguration. Apex A: `216.198.79.1`, `64.29.17.1`. Authoritative NS: `maceio`, `curitiba`, `salvador`, `fortaleza` under `ns.porkbun.com`. Existing `www.abundent.org` is verified and configured to redirect 308 to `abundent.org`. No DNS records are changed by this work.

Baseline public `curl` witnesses independently returned HTTPS 200 for apex and 308 `Location: https://abundent.org/` for www, with HSTS `max-age=63072000`. These are actual public HTTP responses through the workspace's outbound network, separate from control-plane verification. Final release witnesses below must repeat them and verify commit-bound bytes. An emulated Android-sized Chromium witness is not a physical Android PWA installation or an independent human usability test.

The public build exports only `STATIC_PATHS` and the generated worker, plus `release.json`. It excludes repository docs, tests, census inputs, labs, imported metadata, photos, private filenames, audio, credentials, tokens, `.git`, `.env` and `.vercel`. Unmerged `/worlds/wandering-lens/`, `/worlds/suno-atlas/`, `/worlds/music-field/` remain genuine 404. Root and nested-path browser witnesses have zero passive third-party requests. CSP permits first-party shell fetches only; individual FORAGE/GLEAN documents retain their stricter `connect-src 'none'` policies. User-initiated source/owner handoffs are explicit links.

`vercel.json` disables automatic Git deployments for this integration. A manual deployment uses this exact committed branch; drafts cannot auto-promote. Production must be staged with automatic custom-domain assignment disabled, validated on its deployment URL, then explicitly promoted. Production releases never follow a failed gate. The existing domain redirect remains attached.

Absent capabilities: account access, server receivers, uploads, pressing delivery/publication/payment, Music Field import/playback, radio playback/broadcast/control, printer/robot/camera actuation, remote execution, external adoption, synthetic human admission, custody/inventory/treasury issuance, and Constellation Rack unlocking.

## Reproducible release and checks

`npm run field:verify` rejects generated HTML/cache drift. `npm run build` exports committed public bytes, rejects dirty public assets, and deterministically emits `dist/release.json` with exact commit, Git tree, catalog identities, upstream provenance and SHA-256/length for every exported asset. It uses no build timestamp or runtime dependency. Gitless hosting archives require the exact Vercel commit SHA and independently verify all exported bytes against that immutable public Git tree via two build-time GitHub API reads. Failed/missing source verification refuses a release. Two builds of the same commit must be byte-identical. `node scripts/verify-release.mjs dist` and the equivalent HTTPS command verify every asset. The release manifest itself is not placed in the fixed offline cache, avoiding a hash cycle with the worker.

Required local commands:

```sh
npm test
npm run field:verify
npm run test:browser
npm run replay -- evidence/browser/voyage.frozen.json
npm run build
node scripts/verify-release.mjs dist
WEBZ_TEST_SITE=dist WEBZ_WITNESS_NAME=export python tests/navigator_browser.py
```

Browser witnesses cover routes `/`, `/field/`, `/field/navigate/`, `/press/`, `/forage/`, `/glean/`, Sanctuary and Orchard; 320px touch/1440px desktop, keyboard, all 121 controls, no-JS 11/24 field, Back/Forward, cold replay, stale/empty HOLD, offline reload, zero egress, cache migration, cache bootstrap failure, neighboring scope preservation and real HTTP 404. The inherited PRESSING browser witness verifies file preparation adds no requests and leaks no filename/bytes to proposal or storage. Screenshots and receipts are under `evidence/abundent-launch-001/`; inherited field/cache evidence is under `evidence/static-web-001/browser/`.

## Release gate and rollback

- Verify exact project/team/commit and untouched unrelated DNS before staging.
- Require green Node, complete Chromium, cold replay, generated-file and deterministic build checks.
- Require public-only export and matching deployed `release.json` plus every listed source hash.
- Smoke staged production with actual HTTPS, CSP, route/404, mobile, no-JS and offline checks.
- Confirm apex still serves the rollback baseline while staging; promote only the tested deployment.
- Repeat public byte/browser checks on apex, exact www redirect and TLS verification after promotion.
- If a release check fails, keep/restore baseline with `vercel rollback dpl_Gk7fjb5mXeeJ9br74XRCYg3eMoDh --scope theotherlucasv-1250s-projects` or the scoped Vercel rollback API. No build or PR merge is needed to restore that immutable deployment. The old HTML plus old worker contract have a different scope cache identity; the witnessed activation removes incompatible same-scope caches after a subsequent successful install.
- Keep this issue open for the PR's GitHub closing keyword; do not manually close it or merge the old stacks.

## Smoke-test witness

Local gates passed on 2026-10-10: Node 24.19.0, **94/94 tests**, full `npm run test:browser` including three async race regressions, fresh-process voyage replay, field generated-file verification, **43 exported assets** verified against their manifest, two identical builds, and root/nested Chromium export witness. Chromium 151.0.7922.34 / Playwright 1.62.0 reports zero external requests, page errors and CSP violations. The founding hash remains unchanged. Screenshots were visually inspected at 320px and desktop.

The first matrix witness mixed Playwright taps and a second CDP input controller on one mobile page. Independent input contexts fixed the harness conflict; every matrix button is actually tapped, and a separate real protocol touch swipe is verified. Offline fragment replay initially failed; the source-pinned worker fix and Node regression now pass both online and offline browser replay.

Baseline TLS: curl reports SSL verification result 0 and HTTP/2, but the workspace uses a TLS-inspecting outbound proxy whose observed certificate issuer is OpenAI. Direct non-proxy network access is unavailable. Thus no direct origin leaf-certificate fingerprint is asserted. An independent TinyFish fetch also witnessed the baseline HTTPS homepage and www final redirect destination without errors. Final HTTPS witnesses repeat these checks on the promoted release. Physical Android installation, independent human usability review and a direct origin certificate-chain capture remain unwitnessed.

Published verified production on 2026-10-10:

- Exact code commit: `7d68bfdc0f6347896c224f6f3fbcaa0243ed1159`; tree `3fa687ddab53536828f50704c5eff638b8601a3f`.
- Deployment: `dpl_Exwp65kuQtLTGFQMhFKhAQMiRa6f`, READY production, [immutable release URL](https://webz-field-porch-disi9zo6k-theotherlucasv-1250s-projects.vercel.app).
- [Public apex](https://abundent.org), [plain field](https://abundent.org/field/), [navigator](https://abundent.org/field/navigate/), [commit-bound release manifest](https://abundent.org/release.json).
- Release manifest SHA-256: `73c8eeccdba0505e900fa5b1bfd477109e38fde6c4449936733473396f93b1d6`.
- Both [push CI](https://github.com/the-static-collective/webZ/actions/runs/38019127305) and [PR CI](https://github.com/the-static-collective/webZ/actions/runs/38019178319) passed on the deployed commit. Local Node 24 and hosted Node 22 passed. No unresolved review threads were present at launch.
- Before promotion apex still resolved to baseline `dpl_Gk7fjb5mXeeJ9br74XRCYg3eMoDh`. The baseline immutable URL independently returned HTTPS 200 and homepage bytes exactly matching main; rollback homepage SHA-256 `893fe900a31ac46ce4abb0a885835bd026a6a2728bc1dca02bf76bd243f62d4f`.
- Staged and promoted deployments each passed every 43-asset hash check, full HTTPS navigator/browser witness and 22 HTTP/header observations, including absent labs, census, tests, docs and Git internals. Extensionless missing URLs receive Vercel's slash normalization before their genuine 404.
- Final `www` checks at `/`, `/field/`, `/field/navigate/` each returned 308 with the exact equivalent apex `Location`. TLS verification was enabled and returned 0. HSTS, CSP, nosniff and no-referrer headers were present. Production Chromium reports zero external requests, page errors and CSP violations, eleven no-JS cards and twenty-four doors.
- Independent TinyFish reads witnessed the new HTTPS homepage, www final apex URL and navigator title. This static fetch is not represented as a JavaScript functional check; Chromium supplies that witness.
- Vercel reported no runtime error clusters over the final one-hour window. This static surface adds no telemetry or monitoring of visitors.
- Project automatic custom-domain assignment was disabled before staging and again after explicit promotion; Git auto-deploy remains disabled in the branch config. No DNS mutation was performed.

[Release/rollback receipt](../evidence/abundent-launch-001/release-receipt.json) · [staged HTTPS/browser/byte evidence](../evidence/abundent-launch-001/staged-production/) · [final production HTTPS/browser/byte evidence](../evidence/abundent-launch-001/production/).

PR [#31](https://github.com/the-static-collective/webZ/pull/31) is a reviewable draft with `Closes #30`; main and the issue remain open for normal review/merge. Receipt-only follow-up commits append evidence without rebuilding or changing the verified production deployment. Physical Android installation and direct origin certificate capture remain the deviations named above.
