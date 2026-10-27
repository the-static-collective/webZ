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
