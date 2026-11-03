# Abundent Circuit 002 — Native GHoT Bridge

Working slice: Circuit project harbors remain independent and a local human
operator can press **Run in native GHoT** to execute the original GHoT donor's
`system.hash` code on the **same** machine. The donor generates its own task and
receipt; the loopback bridge validates the output against the input, and the
browser independently hashes the input before recording a native receipt ID.

## Verification as of Nov 3, 2026

- Circuit core: **13/13 Node tests pass**.
- Local bridge: **4/4 Python HTTP/security tests pass with a clearly labeled
  test-only donor fixture**.
- Original seven-panel browser exercise still passes with zero JS exceptions.
- Browser navigation to local `127.0.0.1` is restricted in this authoring
  environment, so the full browser-to-native subprocess test **was not**
  independently completed locally. It is provided in CI to run against a
  pinned actual GHoT checkout.
- At the time this release note was written, the connected GitHub PR CI results
  have **not yet been checked**. Do not claim donor-native execution is verified
  until its CI job or real local run succeeds.

## Limits

No LAN or cloud GHoT execution, receipt signing, verified human witnessing,
funds, file conversion, fabrication or authenticated organization enrollment.
Native tasks are local, bounded and explicitly requested; GHoT private records
are outside the browser's served directory. This first live donor proves the
bridge, not the entire Abundent Commonwealth.
