# Cloudflare Worker first deployment smoke check

Branch: `feature/jarvis-cloudflare-modal-canary-019`
Worker name: `jarvis-compute-lab`
Production site: `abundent.org` remains unchanged; this is a `workers.dev` canary.

This commit deliberately triggers a GitHub-integrated Cloudflare production-branch build if the operator has selected this branch. It does not change DNS or Cloudflare application configuration.

1. In Cloudflare **Workers & Pages → jarvis-compute-lab → Deployments**, verify that the latest build deploys from this exact branch and its status is **Success**.
2. On that worker, open its `workers.dev` URL at `/api/health`: expect JSON with `ok:true`, `provider:cloudflare-worker`, `modalEnabled:false`, and `sharedQuotaConfigured:false` until encrypted secrets are installed.
3. Open `/field-kit-lab.html`: the separate UI should render. It will hold on submit until shared quota is bound and Modal enabled. A HOLD is deliberate, not proof Modal already ran.
4. If deployment fails, inspect the Build log, particularly whether the build and deploy commands run from the correct `ask-jarvis` directory and use `wrangler.edge-modal.jsonc`.
5. Configure `JARVIS_RATE_HASH_SECRET` as an **encrypted Worker runtime secret** using a secure channel; its value must match the HMAC secret in existing Supabase `jarvis_guard.settings`, not an invented new secret. Never put this value in git, URL or chat. Modal stays disabled until the user's separate Modal setup succeeds.
6. After the quota is bound, first exercise `/api/ask` with a public-safe question, then inspect source and 429 behavior; only then bind Modal proxy credentials and activate the separate field-kit route.

No Cloudflare Worker deployment or Modal run is claimed by this source file.
