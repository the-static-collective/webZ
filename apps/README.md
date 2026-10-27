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

## Status vocabulary

- **Web door configured:** a project/domain association was created or already existed. The directory does not continuously verify availability.
- **Preview · may require access:** the project has a READY deployment but normal Vercel preview protection may still apply. Link does not bypass protection.
- **Needs repair:** latest deployment status was ERROR, so no active invite is offered.

A link never proves that a program serves clients or that any proposed partnership exists.

**Inventory date:** 2026-10-27, account: `theotherlucasv-1250s-projects`.
