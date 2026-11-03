# Circuit 005 — Living Witness

Draft experimental crossing of source-backed Revival OSHB Genesis 1:1–3 into native GHoT computing and signed reLATTE review-only file transport.

## Executable sequence

1. The original Revival corpus CLI compiles pinned Hebrew sources with their original witness receipts and source attribution.
2. The original GHoT runtime performs a bounded native hash and returns a computation receipt.
3. The original reLATTE runtime signs an opaque organ review candidate and file transport frame with a generated test key.
4. Two separately initialized local receivers verify the signed candidate and independently choose HOLD or REFUSE. Each writes native signed receipts, independently checks source bytes, and passes cold-replay verification.
5. HOLD retains source bytes in quarantine. REFUSE does not retain them. Neither permits project adoption or approval.

## Source commits

- Revival af1e00c24e3d7c6eb6b1ac39ef59bf894e2385fd
- GHoT 9748a0772c4a13135421c4fa84a9991e0a51e05f
- reLATTE d69a863943e071346527eafc79a63ef332d524af

## Trust distinctions

The signing key is generated for this experiment, not an enrolled human identity. The workflow uses a synthetic expected public key; a real user must verify the source identity independently. Original Revival textual provenance is retained, including separately attributed OSHB text and annotation records. No preferred translation, theological authority, church endorsement, actual gathering, human witnessing, physical machines, financial records, native Full Measure writes or production deployment is asserted.

**Do not publish local receiver state directories.** They contain experimental private signing material. The workflow exports only source candidate, signed public carrier, public test key and redacted receiver reports.

## Reproduction

Use the GitHub Actions workflow at .github/workflows/abundent-circuit-living-witness.yml for the fully pinned test. Local execution requires Python 3.11+, Node 22, Git, the three donor repositories checked out at the exact SHAs above, and the dependencies installed from the native reLATTE package manifest. Mac Mojave compatibility and a physically independent two-device field test are not yet established.

## Next gate

A real user-directed two-device demonstration with separate source identity enrollment, human-controlled HOLD/REFUSE, and human review of whether the optional method should be adopted.
