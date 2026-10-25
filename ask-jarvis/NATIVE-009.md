# NATIVE-009 — Three actual owner Python kernels behind the human gate

**Status:** working in the separately protected Vercel **Preview** branch; not merged into production. A separate manually triggered *Run Three Owner Kernels* button becomes visible after the TRIAD-008 source lens inspects ALEX.2, 3rdi and LOADOUT.

## Real kernel execution (not method analogies)

| Owner and exact immutable commit | Native Python code actually called | Honest consequence |
| --- | --- | --- |
| [ALEX.2](https://github.com/the-static-collective/ALEX.2) `7d116b716df82ee2379b399d90936d2fc01b7b16` | `alex_runtime.derivation.evaluate_relation_case` | A public project document does **not** establish a local food-access need. The native derivation evaluator returns `INSUFFICIENT_TO_TEST / NO_ATTRIBUTABLE_SUPPORT_PATH`. |
| [3rdi](https://github.com/the-static-collective/3rdi) `e631167a04c6bd1bf95c62cbe5a415994ebb8134` | `three_rdi.compile_cut` | The native compiler creates an observer-local `3rdi.projection-receipt/v0` for the synthetic observation **that this question arrived**. It does not infer the occurrence time of external events. |
| [LOADOUT](https://github.com/the-static-collective/Loadout) `1adcb3d82f736f3ca8329c3c1d0d9eba398d49ee` | `loadout.compile.compile_loadout` | A no-effect public read is available; `steward.contact` is *unavailable* and its external-contact effect *refused* without required owner authorization. |

**A successful native execution is not a successful field experiment.** Native kernels are limited to one synthetic, locally generated observation and do not connect to a trusted food-access dataset or consenting local steward. Nothing contacts a participant, modifies a repository, sends a message, books a venue, or submits a public report.

## Where it runs

`api/native.py` is a genuine Vercel Python 3.12 Function. It requires both:
- `VERCEL_ENV=preview`, as determined by Vercel.
- `JARVIS_NATIVE_ENABLED=1`, stored as a Preview-only project environment variable.

The project preview itself requires Vercel Authentication. The endpoint accepts only bounded `POST {"question":"...","lens":"triad"}` requests and returns `HOLD` for invalid, oversized, private-contact, or unknown inputs. `GET` is unsupported. It does **not** use the NVIDIA model key, Vercel AI Gateway or paid tokens.

On demand the private Python bridge `native/bootstrap.py` retrieves only three fixed-owner, exact-SHA GitHub archive contents over HTTPS, rejects unexpected archives and large/special files, and extracts **Python modules only** into `/tmp`. No unpinned branch, user-selected URL or executable is admitted. It then spawns `native/triad_kernel.py` in a child process with a **scrubbed environment** (no NVIDIA, Vercel or host credentials passed), a bounded CPU/time and output limit and no writable project root. It returns a SHA-256 checksum over the unsigned native result. Browser validation independently checks the checksum, submitted question digest and three source-owner commit pins.

**Transport and trust qualification:** Fetching fixed GitHub owner code still executes the owner’s code and requires trusting those exact revisions and GitHub's HTTPS/archive delivery. This is a controlled Preview/developer experiment, not a general execution sandbox for untrusted software or evidence of a cryptographic code signature. Repeated cold starts can consume Vercel Function duration even if no AI tokens are spent. No claim of an independently enforced per-IP rate limit or a production cost budget is made.

## Exact owner-source CI conformance

`.github/workflows/ask-jarvis-native.yml` checks out each source repository at its exact 40-character commit, verifies each checked-out HEAD, and runs `native/triad_kernel.py` against an inert question specimen **using the actual owner Python modules**. It verifies the ALEX refusal, 3rdi projection receipt, LOADOUT denied effect, SHA-256 result checksum and refusal to ingest a private email address.

## Next proper integration level

This first native vertical slice proves execution and refuses evidence laundering. Connecting true attributed local needs/offer records, venue permissions, or a human-confirmed steward requires new consented source/admission interfaces. Native ALEX/3rdi/LOADOUT can then receive lawful records without allowing a convenient AI suggestion to impersonate a real-world fact or effect authorization. Keep `production` disabled until security review, native source vendoring/build-time pinning, network/retry limits and explicit release approval.
