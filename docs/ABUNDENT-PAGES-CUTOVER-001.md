# ABUNDENT PAGES CUTOVER 001 — remove Vercel as static front door
**Audit:** October 28, 2026. This is a release checklist, **not a DNS change**.

## Verified diagnosis
- Vercel Hobby caps deployment creation to **100 per 24 hours**: https://vercel.com/docs/limits . The Abundent project returned **HTTP 402 `api-deployments-free-per-day`** on a reviewed production deploy attempt on October 28. Repeated attempts will not increase this quota.
- The Vercel production `abundent-switchboard` remains on source SHA **`fbcaedbfe9890f008c00a32d92c6180fbedd998d`** (observed in Vercel deployment query), older than the Outbox revision. The public URL `https://apps.abundent.org/bridge/outbox/` returned HTTP 404 in independent probing. A successful GitHub build is not proof that this route is live.
- The **portable build runs without Vercel** via `.github/workflows/abundent-portable-static.yml`. GitHub Actions run **40782026251** built and deployed the complete public tree, including `bridge/outbox/index.html`, directly to GitHub Pages. The Pages job independently read the GitHub API and confirmed **`cname = apps.abundent.org`**. The default github.io address redirects to the registered custom domain; it is not a second independent web URL while the custom domain is attached.
- At the registrar, the domain's authoritative nameservers are **`damien.ns.cloudflare.com`** and **`lilith.ns.cloudflare.com`**. **Porkbun's DNS editor is not the live zone controller**. The DNS CNAME must be modified at Cloudflare (or through an authorized Cloudflare API/connector), not through a non-authoritative registrar record.
- The root bug in our independent publishing workflow was that it watched **only `apps/**`**, although the static build copies `bridge/**`, `commons/**`, and `jubilee/**` from outside that directory. OUTBOX-001 updates those path filters, validates the outbox assets, and publishes to Pages automatically for changes in the rooms. The workflow uses a concurrency cancellation gate so only current work can win.
- The Vercel project `abundent-switchboard` was updated with **`previewDeploymentsDisabled=true`**. This reduces preview fanout but does not eliminate the 100/day production limit, and is not a cross-project Vercel fix.

## One-record DNS release, **not yet performed**
Precondition: GitHub Pages published `apps/dist` from the desired review commit; its repo custom hostname is `apps.abundent.org`; outbox assets built and operator browser tests passed.
1. In the **Cloudflare DNS** zone for `abundent.org`, record the *existing* `apps` CNAME target and proxied/TLL settings for rollback. Do not assume an older target is still current.
2. Change **only** the single `apps` CNAME target to **`the-static-collective.github.io`**. Prefer DNS-only until HTTPS certificate/redirects work. Do not edit nameservers or any email records.
3. Verify `https://apps.abundent.org/`, `/bridge/outbox/`, `/bridge/outbox/app.mjs`, `/bridge/outbox/catalog.mjs`, `/bridge/atlas/`, and `/bridge/network/` all return the intended new content over HTTPS. Check mobile Chromium, actual encrypted vault, reloaded drafts and that no backend sends are triggered.
4. If verification fails, restore the exact `apps` CNAME and proxy state recorded in step 1. This migration must leave all other subdomains, apex and MX/TXT/DKIM/SPF untouched.

## What must *not* be migrated by simply flipping CNAME
GitHub Pages is **static only**. The existing `webz-field-porch` Resend-backed `/api/post-office/*` is server-side, authenticated and separately owned. GitHub Pages cannot serve it, nor can it run Ask JAR;VIS or other serverless APIs. Keep those routes on their already working backend until an independently authorized Cloudflare Worker, Supabase Edge Function, or other server host is implemented and tested. Moving `apps.abundent.org` does **not** migrate `abundent.org`, `webz.abundent.org`, or any other project.

## Smoke proof
- Vercel creation cap reproduced in an explicit single production deployment call.
- Complete static ZIP archived by GitHub Actions with OUTBOX files.
- GitHub Pages custom domain binding observed via CI rather than assumed from UI.
- No Cloudflare DNS write tool or authenticated live Cloudflare zone has been used here. **Do not claim the migration happened.**
