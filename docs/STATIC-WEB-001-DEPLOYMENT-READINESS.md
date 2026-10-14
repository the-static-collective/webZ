# STATIC-WEB-001 — deployment readiness

webZ is an ordinary static directory, prepared for a future host. No domain is selected, no DNS is changed, and nothing is deployed. `DEPLOYABLE != DEPLOYED`. The Node preview is loopback tooling, not a production server or receiving service.

## What can be hosted

The homepage remains a porch. `/field/` is a generated, JavaScript-independent map of 11 founding worlds with explicit local/external doors, intentional HOLD, ownership, next gates and expandable pinned provenance. `/porch/`, `/press/`, `/proof/`, Sanctuary and Orchard retain their local semantics. The installation manifest uses relative `id`, `start_url`, `scope` and first-party 192/512 PNG icons. Installation depends on browser support and HTTPS; platform install prompts are not promised.

The founding `webz/public-field/v0` profile is **inspection-only-001**. Its vocabulary includes LIVE, but this profile refuses every LIVE claim and every available REMOTE_EFFECT door: no reviewed public-service deployment evidence exists here. Adopting a future public-service evidence policy requires a separately reviewed profile change, not a PR URL, green test, editable boolean or invented production domain.

`field/public-field.schema.json` describes the structural contract. `npm run field:verify` applies the dependency-free validator, compares source pins against committed observations, checks unique IDs, scoped relation targets, owners, door/effect combinations, HOLD reasoning and local routes, cold-hashes the canonical manifest, and checks generated HTML, receipt and cache version. The source-observation inventory also commits exact reviewed document hashes. It is an attributed human review snapshot, not cryptographic proof that claims are true or current. Cold replay never fetches GitHub.

## Host-neutral requirements

| Concern | Required host behavior / review |
| --- | --- |
| HTTPS | Use trusted HTTPS for the eventual public origin. Service workers and file hashing need a secure context. Loopback HTTP is sufficient for local tests only. |
| Root hosting | Serve this directory with `/` as base; directory URLs must have trailing slashes and serve their `index.html`. The service worker is `/sw.js`, scoped to `/`. Do not share a root scope with another application. |
| Nested hosting | Serve the same bytes below a path such as `/collective/webZ/`. Every runtime asset/route, manifest URL and installation scope is relative. Worker scope comes from its own script URL. Host should redirect directory requests without trailing slashes. No broad `Service-Worker-Allowed` header is required. |
| Service-worker scope | Use a dedicated origin or dedicated subpath. First-party worlds share that origin and are not isolated tenants. Worker cleanup is limited to its exact path scope and the inherited legacy cache for that scope. |
| Cache behavior | Run `npm run field:build` after changing any fixed asset, then `npm run field:verify`. Worker version is SHA-256 over the worker contract and every fixed path and its bytes, including the field manifest, schema, provenance, receipt, HTML, modules, CSS, icons and public simulation. Cache-first reads use one coherent installed snapshot. |
| HTTP freshness | Revalidate `sw.js`, HTML, manifests and unversioned assets (`Cache-Control: no-cache` is recommended). Do not pin unversioned files forever in a CDN. Registration uses `updateViaCache: none`; installation fetches with reload, omitted credentials and refused redirects. |
| Update / failure | All fixed files must install successfully before activation. Failed bootstrap removes its partial cache and leaves an existing worker usable. Successful activation removes incompatible same-scope caches and claims clients. An already open page may retain old in-memory text until reload; do not interpret that text as current service authority. Other tabs may finish local work before reloading. |
| MIME types | `.html`: `text/html`; `.mjs`/`.js`: `text/javascript`; `.css`: `text/css`; `.json`: `application/json`; `.webmanifest`: `application/manifest+json`; `.svg`: `image/svg+xml`; `.png`: `image/png`. Enable `X-Content-Type-Options: nosniff`. Modules must never receive an HTML fallback. |
| CSP | HTML commits `default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'`. No inline script/style, remote font/media or third-party resource is needed. Where response headers are supported, also send this policy with `frame-ancestors 'none'` (that directive cannot be enforced by a meta tag). Installation manifest and icons are first-party. |
| Privacy | HTML sets `Referrer-Policy` via meta; send `Referrer-Policy: no-referrer` as a header too. External links are plain user-clicked navigations with `noreferrer noopener`. No preview, prefetch, polling, embedding or browser GitHub API requests. |
| 404 | Serve `404.html` with real HTTP **404**, never a 200 homepage rewrite for arbitrary URLs. Its asset-free message works under unknown nested paths and points to browser Back / the saved porch address. Missing routes remain unavailable offline; the worker does not convert arbitrary URLs into successful navigation. The preview demonstrates a real 404. |
| Rollback | Restore the complete previously verified release directory atomically, including its matching worker, manifest and generated page. Its byte-derived older version installs as another snapshot and removes the later cache at activation. Revalidate CDN/HTTP caches; verify online reload and offline routes again. Do not roll back only a JSON file. |
| Asset integrity | `field:verify` fails if rendered page, canonical receipt or worker version drift. Serve an atomic complete directory; capture its Git head and CI artifacts. HTTPS protects transport. Field hashes are unsigned integrity observations, not owner authentication; no SRI claim is made for the host itself. |
| No secrets | Public directory and all committed fixtures must contain no keys, credentials, tokens, personal source files, operator configuration or source proposal bytes. Publish only required static assets; exclude `.git`, tests, tooling and private/untracked operator directories from a host upload. No account, backend, payment or telemetry configuration is needed. |
| Offline bootstrap | A new device needs one successful online load and complete fixed-cache installation. A cold offline visit cannot install the site. Thereafter the fixed routes and field provenance work offline; external owner/GitHub sites still need their own connectivity. No proposal/file/import or third-party media is cached. |

## Local review commands

```sh
npm run field:build
npm run field:verify
npm test
npm run test:browser
npm run replay -- evidence/browser/voyage.frozen.json
npm run serve
```

The browser witness covers `/`, `/field/`, `/porch/`, `/press/`, `/proof/` under both root and nested scopes, 320 CSS pixels, touch, keyboard/native details without JavaScript, reduced motion, a 400% zoom-equivalent layout and larger text, slow bootstrap/reload, offline navigation, file privacy, passive CSP/network discipline and a real worker update in a scratch copy. It tests Chromium, not every browser or a physical cheap Android device. It is software evidence, not a public deployment or real-human service encounter.

## Still unavailable

No authenticated invitation delivery, Static Press return producer/upload/publication/payment, in-webZ radio playback/broadcast, listener tracking, remote compute dispatch, public WASM service, printer or robot actuation, camera capture, real arcade commissioning, treasury backing/issuance, external institutional adoption or Constellation Rack unlock. Each card describes the separate owner and evidence gate; no hosting step would grant any of them.

## The aperture after entering as a human

Follow **Listen** from the porch: the field introduces a world, then offers two independent owner sites and an inspectable source. This exposes a wayfinding question: can a first-time visitor tell the difference between opening an owner’s existing site and entering a Static Live world that is still a local experiment? The next aperture is an independently consented human use of the porch and its HOLD explanations, with no tracking, to find which door and which missing gate they actually understand or need. Deployment is one possible later action, not the preselected answer.
