# EARTH-INTAKE-001 · Data readiness, not a new EcoMapper

**Status:** source-only independent prototype. No collaborator endorsement, data-sharing agreement, public release or external submission.

**Purpose:** A local, zero-dependency browser workbench for inspecting unfamiliar exported field datasets before any import, API work, map overlay, or cross-network distribution is proposed.

The design was informed by publicly available examples of Minnesota environmental data collection, particularly Esri QuickCapture / ArcGIS embedded maps, volunteer storm-drain programs and public waterway cleanup reporting. **It is not a derivative, compatibility claim, endorsement, or partnership with any environmental organization.** This workspace contains no actual environmental or participant dataset.

## Working prototype

- Open `public/labs/earth-intake-001/index.html` under the existing Abundent development server or Vercel preview. The page is NOT linked from the real homepage and will not be assigned to the public production alias without separate approval.
- Choose a small CSV or flat JSON array **only if authorized**, or press **TRY FICTIONAL EXAMPLE**.
- The module `model.mjs` locally parses CSV (including properly quoted text), rejects malformed/oversized/ragged input and duplicate headers, counts missing values, flags obvious malformed dates/coordinates/numbers and potential duplicate record IDs, and distinguishes possible privacy-sensitive field names.
- `app.mjs` produces only a local aggregate report. No raw record, value or precise coordinate is included in the downloaded profile. All displayed user data goes through DOM `textContent`, not HTML injection. There are no network calls or storage.
- Observations with no metric/value are **not** treated as measurement failures: community litter reports and laboratory readings are different domains.
- Column guesses are only guesses. Esri `geometry` objects and projected coordinates require explicit schema mapping, not silent lat/lon assumptions. Unknown properties remain reported as unknown.

## Questions to ask before writing an integration

1. Is the new data-entry or ingestion application the same system as the public EcoMapper / Esri QuickCapture site, or a separate application?
2. What actually enters it: ArcGIS FeatureLayer, API, CSV, sensor files, manually recorded reports, photos, or a mixture? Can the owner provide an **approved synthetic sample**?
3. What is painful right now: import failures, field-level validation, duplicates, source custody, volunteer onboarding, presenting data to funders, or making an existing working app visible?
4. Who owns and can publish observations; how are sensitive coordinates, citizen reporter names, photographs, opt-outs and deletion handled?
5. What are the actual source repository, test instance, read-only API docs and release priorities? Is a contribution welcome?

## Plausible implementation seams

- **Field intake:** create reversible schema adapters, keep source receipts and distinguish unverified human reports from laboratory readings.
- **Quality checks:** no silent deletion, mass geolocation publication, guessed units or false threshold/safety claims.
- **Human review:** field records remain locally owned until consent and data permission are independently confirmed.
- **Communication:** from approved aggregated statistics, build a public data-story page on Abundent with independently attributed sources (subject to owner consent).
- **Continuity:** document data dictionary, operating runbook, versioned backups and maintainership options so a single creator need not sustain every part of the application.

## Safety rules

Never commit personal phone numbers, a stranger's health condition, secret tokens, volunteer identities, private sample files, unblurred exact locations or real participant records to this public repository. Do not write to any partner API, submit source-observation packets, represent yourself as a maintainer, or publish a partner-branded feature without permission.

**OBSERVATION ≠ VERIFIED MEASUREMENT. PUBLIC MAP ≠ PUBLIC DATASET LICENSE. SOURCE HASH ≠ PERMISSION.**

Test: `node --test ask-jarvis/test/earth-intake-001.test.mjs`.
