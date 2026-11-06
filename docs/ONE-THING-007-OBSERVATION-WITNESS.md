# ONE THING 007 — Consented Observation Bridge

**Status:** experimental GitHub branch / review required. This addition is deliberately **disabled by default**, and is not proof that anything is being collected. The independent One Thing 006 local quest remains usable with the checkbox off.

## One narrow purpose

Answer a falsifiable product question: **Of the voluntary, anonymous quest journeys that were prepared with explicit tracking opt-in, what proportion also prepared a self-reported return in that same journey?**

This is *not* a measure of actual useful work, human identity, participant count, verified impact, matches, deliveries, or causal improvement. A person can start multiple anonymous journeys and can report outcomes inaccurately. Non-consenting journeys are intentionally invisible to analytics; the denominator is therefore not all visitors or all quests.

## Boundary contract

```
participant checks opt-in (default OFF, not persisted)
  -> same-origin GET /api/one-thing/observe: returns enabled/disabled only
  -> participant creates a NEW local quest
  -> browser POST {event:"quest_prepared",journey_id:<random UUID>}
  -> participant creates a LOCAL honest field return
  -> browser POST {event:"return_prepared",journey_id:<same UUID>} ONLY if first POST accepted
  -> operator-controlled server forwards allowlisted event to PostHog
  -> PostHog aggregates two-step unique-distinct-ID funnel
  -> operator reviews source query and supplies AGGREGATE counts to MOTIF-015
  -> MOTIF returns HOLD or advisory review; no autonomous actuation
```

Default page load: **no request to the observation endpoint** and no third-party analytics. Site has no automatic session replay, pageview capture, autocapture, SDK install, cookies, persistent observer ID, or typed-text logging from this feature. The browser sends the 2-field payload to the **same origin** only after consent. No notes, resource descriptions, phone numbers, URLs, outcome labels, geographic locations, category, or IP address fields are forwarded to PostHog. The hosting provider necessarily sees connection metadata. `$geoip_disable` is requested and no PostHog person profile is requested, but the provider's processing and retention remain subject to its policies. Previously transmitted events cannot be revoked by turning off the checkbox; turning it off aborts outstanding browser requests when possible and blocks future event capture.

The relay is restricted to two event names, one valid version-4 UUID, allowlisted HTTPS browser origins, configured regional PostHog ingestion hosts, and bodies of at most 300 bytes. This mitigates incidental leakage, but not forged telemetry, repeated synthetic journeys, spoofed origins from scripts, or untrusted clients. **Do not use collected counts as authoritative evidence of distinct humans or real-world results.** Rate limiting/abuse protection should be reviewed before enabling the public endpoint.

## Provisioning — operator only, never in GitHub

This branch adds `api/one-thing/observe.js` but does not provision credentials or change any Vercel project. Configure the deployment **only after privacy/abuse review**:

```
POSTHOG_OBSERVATION_ENABLED=1
POSTHOG_OBSERVATION_TOKEN=<PostHog PROJECT token, not a personal API key>
POSTHOG_OBSERVATION_HOST=https://us.i.posthog.com
OBSERVATION_ALLOWED_ORIGINS=https://abundent.org,https://webz.abundent.org
```

Use the real active PostHog project host; EU projects need `https://eu.i.posthog.com`. Do not include preview domains by default. `GET /api/one-thing/observe` should report `enabled:false` until fully provisioned. Never put a personal API key in a browser bundle, GitHub file, query parameter, or user-facing response. The project token stays on the server even though PostHog treats its client-side project token as public.

## PostHog → MOTIF-015 inspectable handoff

Once real opt-in events have been observed, compare a **fixed future window** and a prediction frozen *before* that window. Use PostHog's native ordered two-step **unique-journey-ID funnel** (not independent event totals):

1. `one_thing_quest_prepared` as entry.
2. `one_thing_return_prepared` as completion, with the same `distinct_id`, after entry, within the agreed conversion window. Use project timezone and explicit timestamps.
3. Inspect event properties and counts. Validate that events are genuine, in-window, and not duplications or automated tests. Include failures, blocked consent, and sample-size limitations in the review.
4. Carry **only the two aggregate counts**, query reference and window to `MOTIF/experiments/015/observer.py`. Use metric `self_report_preparation_rate` after it is added to MOTIF's allowlist. The MOTIF-015 source field `unique_actors` means unique *anonymous journey IDs* in this application, **not unique human beings**.
5. Set `source_reviewed:true` only after a human has checked the actual PostHog funnel and the above caveats. A tool response or HTTP 202 is not sufficient. Keep `personal_data_in_packet:false` only when the exported aggregate packet contains no IDs or free text.

Never calculate or claim completion rates before any real, consented events exist. Use a known synthetic fixture to test the connection but keep synthetic data out of the live PostHog project.

## Verification

```sh
node --test tests/observation-bridge.test.mjs tests/one-thing.test.mjs
npm test
python tests/one_thing_browser.py
```

Independently check in a browser: (1) no observation requests before consent, including restored local quests; (2) rejecting consent does not prevent any local activity; (3) disabled server means no upstream capture; (4) an opted-in prepared quest and return yield exactly the two specified payloads, and the browser body never contains local text or notes; (5) turning off stops further sends; (6) browser mobile/nested paths still work. Production activation and human field confirmation require separate approval.
