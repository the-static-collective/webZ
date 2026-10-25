# GHoT × MSyoU — Energy Commons 002

**Status:** independent opt-in compute federation proposal and runnable **synthetic resource planner**, not a campus computing system or GHoT runtime integration.

## The real idea

A community partner proposes one useful, legitimate task. Owners of ordinary computers may voluntarily offer bounded spare capabilities, time, power and energy. A planner can ask which offered machine can reasonably do the work. The owner always decides whether to accept. The system must also be allowed to answer **HOLD** when capacity, power, consent or evidence is missing.

The local demonstration at [resources/](../resources/index.html) uses invented computers and invented jobs, and returns either `CANDIDATE_ONLY` or `HOLD`. It does **not** discover devices, run workloads, collect live measurements, transmit files, or create resource leases.

## The existing GHoT organs

- [Executor Pantry](https://github.com/the-static-collective/GHoT/blob/main/docs/EXECUTOR-PANTRY.md) inventories explicitly bounded local capabilities, not general-purpose commands from a remote caller.
- [Power Field](https://github.com/the-static-collective/GHoT/blob/main/docs/POWER-FIELD.md) distinguishes installed capability from momentary willingness; thermal and battery pressure withdraw available work.
- [Energy-Aware Scheduling](https://github.com/the-static-collective/GHoT/blob/main/docs/ENERGY-AWARE-SCHEDULING.md) supports run-here, run-there and hold decisions, including deferring background heavy jobs. Numeric preferences are policy, not measured energy use.
- [Work Leases](https://github.com/the-static-collective/GHoT/blob/main/docs/WORK-LEASES.md) scopes recoverable exclusive claims to one shared local queue. It is not cross-network exactly-once execution.
- [Spare-compute experiment](https://github.com/the-static-collective/GHoT/tree/experiment/radio-house-002-spare-compute) and [signed-work experiment](https://github.com/the-static-collective/GHoT/tree/experiment/radio-house-003-signed-work) are research branches, not institution-approved grid services.
- [reLATTE](https://github.com/the-static-collective/reLATTE) offers separate provenance and crossing concepts; a receipt must not be confused with real-world truth.

## Actual local demo

`src/resource-router.mjs` reads fictional explicit offers, checks opt-in, liveness, advertised capability, battery reserve, temperature and declared watt/Wh budgets. It produces one ranked candidate or HOLD, with each rejection reason visible. The budget values are examples; they are not energy measurements or evidence of cost savings. The UI stores temporary choices in browser memory only.

```text
Community need -> consented bounded capability request
                -> owner-declared OFFER
                -> power / budget / data rights review
                -> CANDIDATE or HOLD
                -> [future: fresh owner approval + native GHoT checks]
                -> [future: isolated execution + separately verified return]
```

No cross-device scheduler, sensor, job executor, network client, authentication, energy billing, or direct GHoT adapter is installed by this change.

## Real-world deployment gates

1. **Hardware owner permission:** separate voluntary device enrollment and a stop/withdrawal method. Never infer owner consent from IP visibility or available CPU cycles.
2. **Institutional authorization:** any use of MSU devices, network, energy or data requires relevant MSU administrative and security approval. A conversation with Bryan does not supply it.
3. **Legitimate workloads:** explicit public/synthetic data rights, narrowly approved job types, independent verification and bounded processing. Private student, research, patient or organizational records are excluded until a separately approved, secure protocol exists.
4. **Native execution limits:** true GHoT capability inventory, fresh energy/thermal probes, allowlisted job adapters, signed and expiring permissions as appropriate, local resource quotas and revocation before dispatch.
5. **Measurement and cost:** actual metering when available, wall-clock duration, power draw, thermal pressure, bandwidth/cooling overhead, security and maintenance costs. Never equate a routing score with real kilowatt-hours.
6. **Field proof:** start with two devices owned by willing volunteers on an isolated LAN, using harmless synthetic inputs. Record explicit refusal/withdrawal cases and test a stopped worker before wider proposals.

## Potential useful work

Public environmental observations, community accessibility transformations of licensed media, metadata analysis of openly licensed data, or reproducible student-designed computational exercises—all only with actual stakeholder permission.

**NON-COLLAPSE:** OFFER ≠ COMMAND. ENERGY HINT ≠ METER. CAPABILITY ≠ CONSENT. CANDIDATE ≠ EXECUTION. CAMPUS INTEREST ≠ CAMPUS AUTHORITY.
