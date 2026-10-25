# FIELD-RETURN-013 · RESULTS WITHOUT INVENTED RESULTS

**Status:** protected-preview candidate stacked on IGNITION-012. Not merged, not promoted to public production, not a human evidence platform.

## The missing inch

IGNITION-012 makes something printable in 15 minutes and proposes a 24-hour crossing. **FIELD-RETURN-013 gives the same browser a return path** after the person takes the card into the world.

The user chooses one honest outcome: no contact, declined, reviewed, corrected, or action self-reported. They can record a private, public-safe note (no names, contact information, links, addresses or secrets). Nothing submits automatically. The UI creates two distinct artifacts and a proposed next question.

1. **Private original receipt**: local downloadable JSON with the person's exact note and what they say happened. Not authenticated, signed, or third-party verified. Do not put it into public Git.
2. **Free Graph CANDIDATE**: independently hashed, contract-compatible \`free-graph.packet/v0\`. It references the existing Town Desk editorial seed and privately retained note by digest only; it carries the selected outcome **as unresolved self-report**, never as locally adopted work. All links are proposed, authority none, and no \`tests\`, \`bears-on\` or \`constitutes\` occurs on an unresolved cut. It does NOT contain the raw private note.
3. **Next question**: generated from the kind of actual return selected. In particular, a decline suggests a non-coercive alternative; a self-report of action requests independent verification rather than calling it a win. Choosing **MAKE A FOLLOW-UP KIT** launches the next local, printable IGNITION card with no network action.

This is a true round trip **within the visitor's browser**. It is not yet an automatically persisted or independently verified network outcome.

## Real launch boundary

The private JSON stays with its writer until they explicitly share it with a responsible steward. The public-safe candidate graph is exportable to an authorized reviewer who can validate IDs, inspect supporting material privately, seek agreement for attribution and make an independent owner-local publication decision. There is **no automatic upload, submission or public Free Graph merge** in this version. A successful hash says the bytes stayed internally consistent, not that an action happened or someone agreed.

**Do not call a self-reported completed action "verified", "a successful task" or "a partner commitment".** Evidence must originate from the person who actually did or observed the work, and downstream adoption belongs to the relevant owner. Future reviewer tooling should accept or refuse a *source* and separately record independent field confirmation.

## Review / tests

- Node 22+ \`node --test test/field-return.test.mjs\`.
- Native Free Graph owner: \`node scripts/build-return-specimen.mjs\` then \`python3 scripts/fg.py validate /tmp/ignition-013-free-graph-candidate.json\` with the exact owner source checkout. CI checks this as a **synthetic** specimen, not field evidence.
- Check browser return form, no automatic POST, and TXT/JSON downloads and 24-hour follow-up on a phone. Vercel Preview only. No domain aliases should be reassigned.
- A later network phase needs separately owned private intake, reviewed sources, withdrawal, explicit human publication gates and a durable read projection. Do not silently write private field notes into \`town/catalog.json\`.

**Growth metric:** not invitations generated. Verified acts, useful corrections, respected declines, and new independent participants who freely choose the next crossing.
