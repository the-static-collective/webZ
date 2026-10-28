# Fuel Commons 006 — resource banks, processing banks, fuel banks, energy banks

**2026-10-28 | PUBLIC RESEARCH-ONLY**. No inventory, material, partner, fuel deliveries, generator, processing capacity, heating appliance, or site authorization verified. This proposal adds an account-free educational resource-routing desk at `jubilee/wood/fuels/` with nine input lanes and an unsent local research slip. Data: `jubilee/wood/fuels/data.mjs`. Test: `tests/fuel-banks.test.mjs`.

## The useful abstraction

Instead of treating "stuff people have" as interchangeable fuel, account for **ownership, condition, output specification, qualified processor, receiver authority, local permission, environmental/health impact, and energy accounting**.

```text
SOURCE (food/wood/oil/manure/solar/plastic)
  -> owner consent + reuse priority
  -> appropriate independently operated PROCESSOR (or food recipient)
  -> verified OUTPUT (food, compost, qualified fuel, electricity, digestate, recycled polymer)
  -> independently compatible RECEIVER
  -> evidence of actual delivery and use
  -> optional GHoT thermal / electrical accounting
```

A food bank, a fuel bank and a materials-recovery bank may interoperate, but their rules and governance are distinct. **Fuel only after processing/verification; energy only after actual generation or energy measurements**.

### Nine lanes

1. **Edible surplus:** rescue/donate to people FIRST; never divert wholesome food simply because an energy system asks for feedstock.
2. **Inedible food waste:** composting or qualified anaerobic digestion. Actual digester gas is variable, includes methane and potentially toxic H2S. No DIY gas storage or mixing into home appliances; digestion is slower than urgent winter heating needs.
3. **Used cooking oil/yellow grease:** owner-authorized collection and legitimate biodiesel/refining or other reuse; raw oil is not biodiesel. Biodiesel production involves industrial chemicals and QA; no household production procedures are specified.
4. **Manure and agricultural organics:** qualified digestion, permitting, gas conditioning, permitted digestate handling. Current facility availability and acceptance are unverified.
5. **Clean dry wood:** only safe legal movement/seasoning, qualified fuel quality and appropriate appliance. Must obey MDA invasive pest rules.
6. **Sawmill/crop residues:** quality-specified, professionally processed biomass fuel where legally acceptable and the appliance is approved; cannot assume all lumber offcuts are clean.
7. **Plastic bags:** materials reduction, reuse, retailer film collection where accepted, recycler. Industrial pyrolysis is a regulated industrial research possibility, NOT a domestic fuel option; do not burn, pyrolyze or heat bags in community/home equipment.
8. **Used motor/industrial oil:** distinct regulated waste, no mixing with cooking grease. Recycle through authorized handlers, energy recovery only in specifically permissible industrial/approved equipment.
9. **Metered solar surplus:** already energy, not a fuel bank. Route safely through rated controller to battery/thermal storage and nonessential GHoT loads, without claiming present solar energy.

### Ownership and readiness

A local steward can maintain a list of *unverified research leads*, then collect owner permission, site conditions, qualified processor permit, endpoint compatibility and human acceptance **in a separate independently governed receiver**. The public page has no enrollment or intake. reLATTE would carry signed offers and receipts only after a future actual consent-based integration; a route suggestion cannot become an acceptance or delivery.

### Operationally interesting crossings

- **Garden / community grocery + restaurant:** rescue edible food first; route unusable organics to permitted compost/digestion partners; used cooking oil to an independent properly licensed refiner (not directly to a heater).
- **Winter Warmth:** immediately available certified/appropriately seasoned wood, or heating assistance from an authorized fuel vendor. Do not make a family depend on experimental digester gas or DIY biodiesel.
- **Farm / campus / congregation:** independent processing-site steward reviews organics handling or equipment feasibility. Farm operators and campuses do not become enrolled by being mentioned.
- **GHoT / Thermal Domino:** measure only outputs that actually arrive at a qualified heat/electrical conversion stage, then route useful heat through separately approved storage/distribution. Distinguish hypothetical power offers from measured consumption, and no heater safety actuation.

### Relevant primary references

- US EPA food priority: https://www.epa.gov/sustainable-management-food/wasted-food-scale
- US EPA digestion: https://www.epa.gov/anaerobic-digestion/basic-information-about-anaerobic-digestion and https://www.epa.gov/anaerobic-digestion/frequent-questions-about-anaerobic-digestion
- DOE/AFDC cooking oil to biodiesel distinction: https://afdc.energy.gov/fuels/biodiesel-production
- Minnesota MPCA digester rules: https://www.pca.state.mn.us/sites/default/files/wq-f8-54.pdf
- EPA plastic industrial conversion research: https://www.epa.gov/plastics/advanced-recycling-plastics
- Minnesota open-burning restrictions on plastic: https://www.revisor.mn.gov/statutes/cite/88.171
- Minnesota used motor oil: https://www.revisor.mn.gov/rules/7045.0845/
- Minnesota forest-pest and firewood laws: https://www.mda.state.mn.us/plants-insects/firewood-information

**New laws:** `RESOURCE != READY FUEL`, `FUEL != ENERGY`, `WASTE != FREE INPUT`, `PLASTICS != DOMESTIC COMBUSTION`, `FOOD FIRST`, `PERMISSION PRECEDES COLLECTION`, `CERTIFICATION PRECEDES APPLIANCE USE`, `OFFER != RECEIPT`.
