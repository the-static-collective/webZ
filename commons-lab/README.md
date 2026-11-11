# LIVING COMMONS SOLO LAB 001
A **single-operator, offline, no-server rehearsal** for a multi-party Commons exchange.

Open `/commons-lab/` through webZ's static server. Pick fictional fish, guitar, bike or distant ride scenarios. Step through invitation → category/radius match proposal → fictional acceptance → imaginary handoff → separate fictional reports → **unreviewed method candidate**. Or decline or expire it.

The fixture consumes the real `invites/engine.mjs` contract (`makeInvite`, `makeResponse`) but **does not** call the live Invitation Network, Supabase, reLATTE receiver, Garden or Jubilee. No actor authentication, custody, independent review, network delivery, real sign-off, publication, payment or credit. The first and second role are **scripts**, not two humans. This is not proof of a physical exchange.

**Exit criterion for this milestone:** reproducible script-only paths for successful, declined, out-of-range and expired cases, with no false authority promotion. `node --test tests/commons_lab.test.mjs`.

**Next engineering seam:** separate the route proposal from the simulated actor adapter, so a future consented human receiver can supply independent, authenticated responses; never silently treat exported simulations as real receipts.
