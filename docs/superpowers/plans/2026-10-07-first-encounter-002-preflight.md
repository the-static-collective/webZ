# FIRST-ENCOUNTER-002 Preflight Implementation Plan

Goal: begin the network chapter with executable signed-invitation and independent return acceptance, leaving public delivery behind a separate reviewed edge gate.
Architecture: verify-only pure ESM plus pinned public fixtures emitted by unmodified native reLATTE modules; separate trust/clock input; read-only preflight page; isolated-origin browser and fresh-process replay. No endpoint, signing key, capability, world journal or MAXHINAL change in the portal.
Spec: ../specs/2026-10-07-first-encounter-002-design.md. Base: merged offline main b6b9897.

1. Write native-provenance public fixtures and failing tests for exact text/signature/world/key/receipt binding, expiry/revocation and independent pin trust; implement the bounded invitation/return verifier; run all unit tests.
2. Write failing browser test for isolated origins, explicit inspection, no delivery/storage, untrusted/forged inputs and deterministic Node/browser replay; build the separate read-only encounter page; rerun the entire offline/browser suites.
3. Document fixture scope, native provenance, separate security/deployment gates and actual participant witness runbook; get fresh branch review and fix material findings with regressions; publish a new draft PR against main. No public listener or field/LIVE claim.

Review focus: self-pinned counterfeit worlds; valid signatures with wrong scope/particular/content; stale invitation vs historical return; receipt-chain laundering; JSON resource limits; unsafe origins/keys/DOM; time/revocation provenance; evidence inflating isolated browsers into actual independent devices/people; secret or world-state persistence; accidental alteration of merged offline baselines or MAXHINAL.
