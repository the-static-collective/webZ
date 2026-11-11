# POST OFFICE 005 — Quiet by default, useful when attributable

This is an owner-only, deterministic **proactive correspondence** pipeline, not ChatGPT spontaneously acting between turns. Vercel Cron + Resend sends an owner-directed email only when a narrowly defined **verified signal** occurs. No bulk mail, visitor recipients, newsletters, or private survivor data.

## Trigger and selection
At 15:00 UTC each day (9 AM CST / 10 AM CDT; Vercel Hobby timing may vary) Vercel requests `GET /api/post-office/useful-letter` with a Bearer `CRON_SECRET`. The handler checks public GitHub source evidence from `the-static-collective/webZ`, `JAR-VIS`, and `GRAFT` for the previous completed UTC day:

- Published GitHub release (not draft or prerelease);
- Public GitHub issue explicitly labelled `post-office-letter`, updated that day;
- Current public webZ landing page failing two successive HTTP checks.

No matching signal means `QUIET`: no email. Do not put personal material in publicly labelled issue titles; sanitized titles and exact source links may appear in owner emails. No issue bodies, private docs, or contact lists are forwarded.

## Safety and limitations
- Sends only to owner-controlled private `POST_OFFICE_TEST_TO` environment recipient, from `us@abundent.org`.
- `CRON_SECRET` must be a secret at least 32 characters long. `USEFUL_LETTER_ENABLED=1` enables sending. `0` pauses it.
- Reuses `RESEND_API_KEY` configured on the same Vercel project. Never check any secret into GitHub.
- One scheduled daily run, at most one owner email per run. Resend date-based idempotency guards immediate retries within provider window. **No durable outbox or exactly-once guarantee.**
- Provider acceptance is not proof of delivery. A missed cron can mean a missed daily signal, with no automatic catch-up.
- Contributors with permission to label public issues can request attention, but cannot give instructions to the system.
- Not for urgent alerts, confidential records, legal/medical correspondence, or high-risk safety decisions.

## Install / operation
1. Add `api/post-office/useful-letter.js`, `post-office/useful-letter.mjs`, tests, docs, and merge the daily `crons` property in `vercel.json`.
2. Run `npm test`; inspect preview deployment.
3. In **Vercel webz-field-porch / Production** set `CRON_SECRET` and `USEFUL_LETTER_ENABLED=1`; confirm `RESEND_API_KEY` and `POST_OFFICE_TEST_TO` exist. Redeploy.
4. Inspect cron registration and function logs. GET without the Vercel-provided secret must return HTTP 401 and never send.
5. To pause emails: set `USEFUL_LETTER_ENABLED=0`, redeploy, or disable Vercel cron in project settings.

The address `abundent.org` is spelled **with an e**; do not replace it with `abundant.org`.
