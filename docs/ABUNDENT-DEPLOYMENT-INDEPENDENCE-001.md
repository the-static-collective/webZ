# ABUNDENT DEPLOYMENT INDEPENDENCE — release engineering 001

**Observed 2026-10-27**. No purchase, team/account splitting, access-control weakening, DNS migration or external provider authorization is part of this change.

## Diagnosis: code workflow, not just a Vercel billing problem

Vercel Hobby officially caps deployments **100 per rolling 24 hours** and builds **32 per hour** (limits updated Feb 3, 2026). Its API rejected first publication of the new Abundent Switchboard with `HTTP 402 / api-deployments-free-per-day`. This is a platform quota, not a bug fixed by changing a DNS record or using a different API method. Git-based previews also count against deployment volume.

The connected team held **100 latest deployments** in the first page of a read-only inventory query. Within that slice:
- `webz-field-porch`: **27** deployments
- `reality2-waseca-001`: **33** deployments
- `farm-post-office`: **20** deployments

This is a **slice of the latest 100**, not an exact full 24-hour total. It shows preview fan-out clearly: source changes in `webZ`'s new `apps/` folder triggered deployments of **two unrelated Vercel projects**. The Reality 2.0 project repeatedly produced failed preview deployments on the `feat/abundent-apps-switchboard-001` branch. A single machine-authored file-at-a-time PR had multiple commits, and each commit caused additional unrelated Vercel deployment attempts. We burned deployment quota without shipping a matching project change.

Vercel documentation:
- https://vercel.com/docs/limits
- https://vercel.com/docs/monorepos
- https://vercel.com/docs/project-configuration/git-configuration

## Engineering policy effective immediately

1. **BATCH**: For projects connected to Vercel, prepare all related files locally, validate together, and publish **one atomic Git commit** per deliberate preview/release. When using the GitHub API connector, use create_blob → create_tree(base_tree) → create_commit → update_ref, rather than `create_file` in a loop. The latter triggered one remote build per file.
2. **REVIEW WITHOUT REMOTE DEPLOYS**: Use GitHub Actions test + build + downloadable static artifact for ordinary PR review. Avoid API deployments on each edit. Never retry 402 in a loop.
3. **KEEP SERVER WORK ON VERCEL**: Only applications actually requiring Vercel functions, execution or dynamic platform services should depend on Vercel production deployments. Use a stable release cadence, not unbounded generation. Do not replace any real provider-held secrets or backend authority.
4. **STATIC WORK IS PORTABLE**: Publish the static Switchboard as a self-contained artifact from `webZ/apps`, with **no Vercel SDK, environment secrets, runtime DB, or hostname assumption**. It can be hosted on GitHub Pages, Cloudflare Pages, static object storage or Vercel. GitHub Pages is a potential fully independent target, not yet activated.
5. **GUARD PREVIEW FANS**: Vercel project API accepted `previewDeploymentsDisabled: true` on `webz-field-porch` and `reality2-waseca-001` (two top fan-out culprits); this is not a claim of tested delivery under a new push. Existing production deployments and DNS were not changed. Keep essential preview ability only on apps actually being actively reviewed.
6. **PREFER NATIVE SKIP**: Vercel monorepo's `Skip deployment` feature is superior to ignored build steps because an ignored build can still consume a deployment count. But automatic affected-workspace detection requires a **real npm/yarn/pnpm/Bun workspaces monorepo**. Do not simply flip `enableAffectedProjectsDeployments` across a non-workspace repository and assume it will work. Design each package/root deliberately.
7. **NO LIMIT EVASION**: No unauthorized multi-account quota sharding, domain reassignment, credential hopping or pretending 100/day is lifted. Upgrading to Pro would increase quota, but is not required for static portable hosting and needs the human owner's billing approval.

## Two lanes, one Abundent

```
GitHub source  (inspectable, reviewed)
       |
       +-- Actions: test / build / artifact  --------> static provider (e.g. GitHub Pages)
       |                                                apps.abundent.org (when configured)
       |
       +-- explicit release  -------------------------> Vercel dynamic applications
                                                        dedicated *.abundent.org
```

Keep current DNS endpoints stable. A readable switchboard is a **link directory**, not an authentication, storage, or service integration. This approach avoids making the public front door depend on deployment budget from every experiment.

## Alternate static provider activation — one-time, human-approved

GitHub Pages is available for public repositories on GitHub Free. Its custom-domain operation is separate from Vercel.

1. In `the-static-collective/webZ`, go to **Settings → Pages** and set **Build and deployment → Source: GitHub Actions**.
2. Invoke the prebuilt **Abundent portable static release** workflow from the Actions tab with `publish_to_pages: true`. This workflow only uses reviewed repository content and GitHub Pages' short-lived token, not a secret-bearing Vercel API key.
3. Confirm the resulting `https://the-static-collective.github.io/webZ/` page actually renders, or the Pages-assigned URL if different. Note: the static index uses relative local assets and absolute destination links. Check it before announcing.
4. In Pages settings, set custom domain **`apps.abundent.org`** and satisfy GitHub verification where required.
5. **Only after Pages reports the domain correctly configured**, modify the authoritative Cloudflare `apps` CNAME **from Vercel to GitHub's documented Pages hostname**. Keep DNS-only. Confirm HTTPS and source, then remove the obsolete custom domain from the unused Vercel Switchboard project if necessary. **Do not change DNS early; risk of outage or domain takeover.**
6. Add an actual Switchboard link to the independently hosted `abundent.org/doors/` source when that source is identified and reviewed. Do not overwrite or redirect the apex.

The workflow is **manual-only for Pages** until enabled; the regular push job merely publishes an Actions artifact. No GitHub Pages activation, custom-domain cutover, or DNS move has yet occurred.

## What success looks like

- An ordinary idea/worktree edit produces **zero Vercel deployments** until a deliberate app release.
- An atomic release for one app produces **one planned production deployment**, not dozens of unrelated previews.
- The public app directory remains updateable even during Vercel quota exhaustion, via a verified second static provider.
- Evidence distinguishes `build passed`, `artifact available`, `public URL responding`, `partner accepted`, and `real-world work completed`.

**Reference implementation:** `.github/workflows/abundent-portable-static.yml` and `apps/` static source. Connected Vercel preview settings require ongoing observation; they are not an unlimited-deploy guarantee.
