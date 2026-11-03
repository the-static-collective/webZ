# Circuit 004 — Revival × Fellowship Commons crossing

**Draft experimental source proof, not a live event or verified community.** This is a runnable composition from optional, source-backed Scripture learning into bounded local compute, invitation, review-only crossing, fictional review, and reusable independent method. Source repositories are not modified.

## Executable path

1. **Native Revival** compiles its pinned Genesis 1:1 *demonstration* witness with its own reader-demo recipe. An operator chooses either default God or explicit Elohim profile. The underlying witness remains the same; the projection receipt changes. This is an illustrative source-backed text, **not** a preferred translation or ministerial authority.
2. **Native GHoT** hashes the exact compiled text via the original Circuit 002 Python bridge and native GHoT reference node, producing a genuine donor task/receipt. This is a local compute execution, not distributed scheduling.
3. **Original Circuit core** creates a fictional local invitation and project, records GHoT without granting a Deed, prepares a review-only packet, receives it on HOLD in a separately initialized local notebook, records an independent ADMIT_FOR_REVIEW disposition and returns it. The return does not complete the proposal.
4. Fictional actor and separate fictional reviewer names exercise the Circuit state machine. A method cartridge includes exact Revival witness and projection hashes, then becomes a NEW PROPOSED project at the receiving harbor, with **no inherited permission or capacity**.
5. The exported JSON proof includes donor results, native GHoT receipt, both notebooks, crossing, return, cartridge, explicit fictional status and an unsigned SHA-256 integrity checksum. Verify mode detects corruption and protocol escalation; no origin authentication is implied.

## Source pins

- Revival: the-static-collective/revival at af1e00c24e3d7c6eb6b1ac39ef59bf894e2385fd
- GHoT: the-static-collective/GHoT at 9748a0772c4a13135421c4fa84a9991e0a51e05f
- Composition: the unmodified Circuit 001 core.js stacked on webZ Circuit 003 (draft).

Both independent donors must be checked out at the **exact commit**. Python refuses an unpinned or substituted checkout.

## Reproduce

Requires Git, Python 3.11+, Node.js 20+. Obtain separate repository checkouts:

~~~sh
git clone https://github.com/the-static-collective/revival.git
git -C revival checkout af1e00c24e3d7c6eb6b1ac39ef59bf894e2385fd
git clone https://github.com/the-static-collective/GHoT.git
git -C GHoT checkout 9748a0772c4a13135421c4fa84a9991e0a51e05f
~~~

With the webZ Circuit 004 branch checked out and both donors placed alongside it (adjust paths as appropriate):

~~~sh
python3 pilots/abundent-circuit-001/crossing-004/run_004.py --revival ../revival --ghot ../GHoT --choice default --output circuit-004-default.json
python3 pilots/abundent-circuit-001/crossing-004/run_004.py --revival ../revival --ghot ../GHoT --choice elohim --output circuit-004-elohim.json
python3 pilots/abundent-circuit-001/crossing-004/run_004.py --verify circuit-004-default.json
node --test pilots/abundent-circuit-001/crossing-004/tests/crossing.test.mjs
~~~

Output is local private experiment data. The runner refuses to overwrite an existing proof; native GHoT records reside in disposable private temporary storage. The model stores a checked reference receipt, not a Full Measure Deed.

**Mojave caveat:** This code proof is validated on CI Ubuntu, not a one-click Mojave installer. The user's 2012 Mac must first have compatible Python/Node runtimes. Existing Circuit 003 launcher is a separate feature.

## Authority and provenance limits

- SOURCE TEXT is not DOCTRINE; preference is not an assertion that the source changed.
- A fictional reviewed-confirmed project is not a real gathering or authenticated human witness.
- A review-only ADMIT is not approval of a venue, expenditure, physical work, or publication.
- A local SHA-256 self-check is not a signature or proof of who authored a JSON file.
- Circuit Full Measure/GrO values are projections only: native databases are not changed.
- No real contact data, money, tokens, equipment, donor identities, live deployment, signed reLATTE crossing or event participation.

## Next meaningful gate

Take two actual independently operated devices, exchange one non-sensitive proposed opportunity, record human-chosen HOLD and disposition, and return the packet. Confirm a real useful practice only through appropriately authorized human evidence; then reproduce it at a second independent group. A later code stage can add **native signed reLATTE** delivery and independently verified receiver custody without borrowing the donor's or the church's authority.
