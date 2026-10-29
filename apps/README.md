# The Switchboard · Abundent

**Status:** Public read-only navigational directory — separate from webZ's independently governed worlds.

Hosts the 24 inventoried Vercel projects at an Abundent-branded door (target: `https://apps.abundent.org`). Ten new subdomain bindings and four previously existing branded doors are included where applicable. Other tools appear as **restricted review snapshots** or **needs repair**. Routes are independent; no shared login, shared partner record, SSO bypass, automatic bridging, or consent grant is implied.

## Local

```sh
cd apps
npm test
npm run build
# dist/ contains self-contained static files
```

No accounts, cookies, contact collection, backend, analytics, embedding, iframe, or live health checker. The searchable directory operates entirely in browser memory. If a Vercel project fails or a subdomain changes, edit `manifest.mjs` and refresh the published copy after review; do not silently classify failed deployments as live.

The registered primary site `abundent.org` and its existing `/doors/` entry are independent of this app. The directory **does not replace the home page** or alter apex, MX, TXT, Resend or existing Cloudflare application records.

## Current field/deployment evidence (2026-10-27)

Source was merged as webZ PR #154 and GitHub Actions passed. The nine newly bound production Vercel custom hostnames resolved and rendered after Cloudflare propagation, but a content audit found **three wrong application landings**:

- `books.abundent.org` renders a generic Garden Workbench instead of Books for Computers.
- `firstyes.abundent.org` renders Ask JAR;VIS instead of First Yes.
- `webz.abundent.org` renders a generic Garden Workbench instead of Field Porch.

These are kept in the inventory as **Needs repair** and are **not** represented as correct application doors.

The `apps.abundent.org` domain is verified on the new `abundent-switchboard` Vercel project and its Cloudflare CNAME is installed, **but the project has no deployment**: the Vercel Hobby account returned HTTP 402 with `api-deployments-free-per-day` (100 API deployments/day). Do not tell visitors the directory is live until a production deployment is READY and the rendered page is verified. API retries without quota relief are not useful. The primary `abundent.org` page has not been changed.

## Status vocabulary

- **Web door configured:** a project/domain association was created or already existed. The directory does not continuously verify availability.
- **Preview · may require access:** the project has a READY deployment but normal Vercel preview protection may still apply. Link does not bypass protection.
- **Needs repair:** latest deployment status was ERROR, so no active invite is offered.

A link never proves that a program serves clients or that any proposed partnership exists.

**Inventory date:** 2026-10-27, account: `theotherlucasv-1250s-projects`.

## Independent static releases when Vercel is capped

The app also builds without Vercel. Our [portable static workflow](../.github/workflows/abundent-portable-static.yml) runs `npm test` + `npm run build` and uploads the exact static `dist/` tree as a GitHub Actions artifact whenever reviewed `apps/**` source lands on `main`. You can download and publish the bundle to a static host without a Vercel API request.

For a GitHub Pages release, a repo admin must first activate **Settings → Pages → Source: GitHub Actions**; then manually run **Abundent portable static release** with `publish_to_pages: true`. It intentionally does not move DNS or claim that Pages is already enabled. Custom domain cutover has a separate verification/approval gate. See [Deployment Independence 001](../docs/ABUNDENT-DEPLOYMENT-INDEPENDENCE-001.md).

Avoid commit-per-file publishing to this connected repository: create one reviewed atomic multi-file commit to prevent preview deployment fan-out.

## GitHub Pages custom-domain verification and controlled cutover

The Switchboard is available independently at `https://the-static-collective.github.io/webZ/`; it also remains available at `https://apps.abundent.org/` on Vercel.

**Operational rule:** a reported click on **Settings → Pages → Custom domain → Save** does not establish that GitHub stored the domain. The authoritative check is the repository's GitHub Pages API field `.cname`, read inside the `publish-pages` GitHub Actions job. We observed `.cname = null` during the previous attempted migration and restored Cloudflare's single `apps` CNAME to the Vercel target `cname.vercel-dns.com`.

A subsequent owner confirmation requires another read of the Pages API before changing authoritative Cloudflare DNS. If GitHub reports `apps.abundent.org`, change that one CNAME from `cname.vercel-dns.com` to `the-static-collective.github.io` (DNS only), then verify page, JavaScript, and HTTPS from the branded host. Preserve the Vercel domain binding for rollback until GitHub Pages is independently proven healthy. Never migrate the apex, email records, or other subdomains as part of this operation.

The portable release workflow emits the configured Pages hostname for audit. It warns but continues to update the independent `github.io` backup if no custom hostname is set; it rejects an unexpected third-party hostname. This avoids coupling backup publishing to an unfinished custom-domain migration.

## Porchlight Commons source-bundled room (October 28)

The static build now copies [`../commons/`](../commons/) into `apps/dist/commons/`, reachable as a local route **if the published bundle actually deploys**. It is an organizational HOLD-card and cost-comparison prototype only, not a provider matching service, a backend, a publicly verified Ghana pilot, or an authorized exchange. Source: [Commons protocol](../docs/PORCHLIGHT-COMMONS-001.md). No DNS or Vercel project setting is changed by this repository edit.

## Jubilee Circuit public room (October 28)

The build copies [../jubilee/](../jubilee/) into apps/dist/jubilee/ and the switchboard links to it. This is a print-ready two-hour host guide and a local-only invitation composer. Its voluntary music-to-useful-work protocol is at [../docs/JUBILEE-CIRCUIT-001.md](../docs/JUBILEE-CIRCUIT-001.md). This is not an enrollment, confirmed partner network, or donation intake. 

## BRIDGE-001 — Between Rooms (2026-10-28)

The static build includes `../bridge/` in `apps/dist/bridge/` and links from the Switchboard. It contains nine institution-specific **prospective** invitations, a machine-readable public-safe proposal manifest and a local synthetic HOLD/REFUSE rehearsal. It does **not** send invitations, enroll institutions, establish city cooperation or implement reLATTE receiver signatures. See [BRIDGE-001 source and acceptance gates](../docs/BRIDGE-001.md).


## Common Ground 001 — Church × College × School Bridge (October 28)

The Switchboard statically bundles `../jubilee/revival/campus/` and links it next to the 20-county Revival Atlas. The source-linked directory currently contains 24 educational research entries and 12 **unverified Waseca church directory leads**, not verified open ministries or accepted partners. It does not represent an invitation, enrollment, agreement, ongoing service, student participation, institutional endorsement or a verified contact.

The independent research review notebook at `/jubilee/revival/campus/#notebook` can make local, unsigned, public-source-only review observations; it holds entries in memory for the current tab, permits manual JSON import/export, and makes no network request. It is **not** a public record, authenticated audit, persistent backend, signed reLATTE receipt, partner register, school information system, or automatic outreach engine. Each organization independently approves proposed work. Public K–12 activity remains nonsectarian and governed by school policy, student privacy and safeguarding; private religious speech is separate and voluntary. Source: `../jubilee/revival/campus/data.mjs` and `review.mjs`; tests: `../tests/jubilee-campus.test.mjs` and `../tests/jubilee-review.test.mjs`.

Build note: `apps/build.mjs` already copies the complete `../jubilee/` directory; no extra hostname, project, secret, API connection or DNS change is needed for the room. The portable-static workflow remains independent of the Vercel API deployment quota.


## USE-FIRST-001 — Public capability shelf (draft)

The [human-first tool shelf](use/) starts with a direct official Haunted Toaster Windows alpha download, then gives explicit browser-only routes into Commons, Jubilee, Link Wallet and Living Receiver. Unlike the source atlas, it explains *what someone can make* and distinguishes a downloadable app from an experimental browser tool. The shelf is included in the existing static build. [Release/readiness and adoption protocol](../docs/USE-FIRST-001-DISTRIBUTION.md). No visitor analytics, new server, Vercel deployment, DNS change, outreach or licensing claim is introduced.
