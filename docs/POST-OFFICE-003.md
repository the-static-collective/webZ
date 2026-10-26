# Post Office 003: outbound self-test endpoint

Status: code is staged for Vercel `webz-field-porch` via GitHub; **no send is triggered by deployment.**

## What exists

`POST /api/post-office/proof` on the Vercel deployment is a fixed-purpose owner-to-owner test (no arbitrary recipients, message injection, newsletter broadcasting, contacts or scheduling). It requires an operator bearer token. The recipient is provided only by a server-side environment variable, not the request. The sender is always `The Static Collective <us@abundent.org>` and Reply-To is `us@abundent.org`. It logs no token or recipient. A response of `PROVIDER_ACCEPTED` is **not** proof of delivery.

The endpoint always fails closed if the key, operator secret or intended owner recipient is missing. CORS is not enabled. It uses a deterministic Resend idempotency key to make retries safer within the provider's supported window; it is **not** a durable outbox and does not guarantee never sending again after that window.

## Required private production variables

Add through **Vercel project settings or Resend Marketplace integration**, not GitHub:

- `RESEND_API_KEY`: server-side sending token provisioned by Resend for this Vercel project.
- `POST_OFFICE_OPERATOR_TOKEN`: freshly generated strong random secret of at least 32 characters, never committed to the repo or shared in public logs.
- `POST_OFFICE_TEST_TO`: the owner's privately held receiving inbox, **not** embedded in public source.

**DNS and authentication:** verify `abundent.org` inside Resend first. Add only provider-issued DKIM and sending return-path records through live Cloudflare DNS. Preserve Porkbun's apex MX forwarding to Proton. We deliberately do not hardcode hypothetical DNS records or alter existing apex SPF.

**Operator invocation** (only after domain is VERIFIED and variables are present; do not include tokens in browser query strings):

```sh
curl -i -X POST https://webz-field-porch-theotherlucasv-1250s-projects.vercel.app/api/post-office/proof \
  -H "Authorization: Bearer ${POST_OFFICE_OPERATOR_TOKEN}"
```

The operator must obtain a server-side secret through an approved secure channel; if the integration is not project-attached, this remains a dry runway. Request fails HOLD until all guards pass. Verify actual email arrival and reply manually before enabling individualized outreach through JAR;VIS Post Office 001.

**No email has been sent by creating this endpoint.** This artifact is a controlled ability, not exercise of that ability.

## Actual route verification — 2026-10-26

Vercel production deploy `df2b48cbe02b6f6f60f290269c0c99ed7fc8488b` is READY. A GET on `https://webz-field-porch-theotherlucasv-1250s-projects.vercel.app/api/post-office/proof` returned HTTP 405 — correct for the POST-only sender. The bare `https://abundent.org/api/post-office/proof` returned 404, and `https://abundent.org/` presently renders the distinct Ask JAR;VIS site, rather than webZ's root landing page. Therefore **use the specific webZ Vercel hostname for this endpoint**, not the apex. Do not change apex DNS or misrepresent the public site's routing to make the proof pass. A root-domain integration is a separate, scoped, owner-approved change.

The operator token and private test recipient have been provisioned in the production environment, with redacted names-only readback. The Resend API key and verified sending-domain DNS are **not** yet observed on this project. No outbound dispatch performed.
