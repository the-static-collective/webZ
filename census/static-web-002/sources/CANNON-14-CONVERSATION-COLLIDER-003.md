# CONVERSATION COLLIDER 003 — source-declared work, not imagined interoperability

**Experimental / read-only / draft.** Stack on CONVERSATION COLLIDER 002. This slice combines genuine original Git source bytes from three independent project-owned repositories and preserves the distinct meanings of capability: computing executor, human stage role, and physical printer technology.

## Pinned source objects

| Source | Exact commit | Path | Role |
|---|---|---|---|
| GHoT | `e35dd470384d864b7b0b629a68dad570875a7df0` | `ghot/executor_pantry.py` | Static declared executor registry, including `media.probe` requiring conditional ffprobe installation |
| GHoT | same | `ghot/reference_node.py` | Built-in local capabilities; presence does not mean network or remote shell permission |
| Static Live | `38e67b2930cea09c3e01a05447a6e92a67c2468f` | `fixtures/live-001/song.json` | Source-declared required human stage capabilities plus potential fallback audio file paths |
| STATIC OS | `7bc551610421bd60a8dbf624d93d7a6682ce3987` | `fixtures/printer-field-012/technology-registry.json` | 10 typed print-process families, zero verified physical printer capability |

All are read via CANNON 003's `readSource` exact SHA-1 Git commit/blob verifier with source witness hashes. The parser recognizes a **narrow bounded syntax** for original GHoT Python list literals; it does not import, execute or evaluate Python. A different source shape HOLDS rather than inferring a capability. The Static Live and STATIC OS donor JSON are parsed as data, not instructions. The commit origin check observes local Git configuration, not remote ownership attestation.

## Source-derived observations

1. **GHoT potential producer:** `media.probe` is advertised only if a local ffprobe executor exists at runtime, and remains independently removable by power/liveness policy. The collider verifies that this *declaration exists in source*, not that ffprobe is installed on any participating device.
2. **Static Live possible recipient:** LIVE-001's `stems/*.wav` are **path references**, not verified media files. A bounded candidate asks whether GHoT could *inspect* these audio files with `media.probe`, but never dispatches a task, reads stem contents, or asserts the files exist.
3. **Human capabilities:** `lead-vocal.live`, `drums.live`, etc. are not machine-executor requirements. GHoT must not be counted as a performer; the stage compiler's own explicit fallback rules remain sovereign.
4. **Physical printers:** STATIC OS's open-world registry declares 10 process families, no validated physical devices, no transport and zero machine-execution authority. A virtual PrusaSlicer reference means SOFTWARE_TOOLPATH_ONLY, not authorization to print.

## Run

Requires Node 24+ and exact source commits checked out on disk:

```json
{
  "the-static-collective/GHoT": "/absolute/checkout/GHoT",
  "the-static-collective/static-live": "/absolute/checkout/static-live",
  "the-static-collective/static-os": "/absolute/checkout/static-os"
}
```

Save this as an untracked `work/roots-003.json` and run:

```sh
node --test test/conversation-collider-work.test.mjs
node scripts/conversation-collider-work.mjs scan --plan examples/conversation-collider-003.sources.json --roots work/roots-003.json --out work/collider-003.json
node scripts/conversation-collider-work.mjs verify --plan examples/conversation-collider-003.sources.json --roots work/roots-003.json --out work/collider-003.json
```

Reports are content-addressed and exclusive-write only. Verification recomputes against all original immutable source objects in another process. CI independently checks out the exact three source commits, runs hostile tests, generates the report and cold-replays it. No mounted local printer, file execution, real source asset, hardware port, stage input or network service is accessed.

## Explicit unresolved doors

- Obtain independently permitted, original media file bytes, verify their relationship to the Static Live packet, and observe an opted-in GHoT ffprobe presence/power/liveness offer; only then consider a separately granted bounded media inspection.
- Connect a source-owned task protocol (typed `input`, `output` and version semantics), not merely a label, before claiming any cross-repo executing adapter.
- For printing, independently select a particular printer, verified model/firmware/material and safety profile, local machine owner permission, machine-specific driver and supervised physical acceptance. None is present here.
- Extend source adapters to additional donor file formats only after they earn bounded parsers and hostile tests; private chat history is not indexed in this experiment.

**DECLARED != PRESENT. PATH != FILE. FILE != RIGHTS. ROLE != EXECUTOR. PRINT PROCESS != PRINT HARDWARE. CANDIDATE != DISPATCH.**

Result is a reasoned **work proposal** with evidence and HOLD, not completion, machine or treasury authority.
