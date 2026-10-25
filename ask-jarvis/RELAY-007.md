# RELAY-007 — A question is not a completed investigation

**Status:** Account-free feature proposal built on VIS-006, not merged or promoted.

## Two distinctly different sharing states

**1. QUESTION PASSED:** The existing `#q=...&kind=...` URL contains *only* the user-approved question, prefills the input, and does not submit or contact anything.

**2. MODEL PROPOSAL SHARED:** After a successful, receipt-verified Nemotron investigation, a visitor can explicitly approve sharing the AI-generated text and make a `/relay/#r=...` link. The fragment carries an independently checksummed, bounded *unsigned* summary with the question, up to three ideas, proposed first test, up to three unresolved questions, and pinned inspected document links/hashes. It is not sent to the server, saved in a database, or automatically executed.

**3. FIELD VERIFIED (NOT IMPLEMENTED):** Neither kind of link implies a site steward consented, an organizer was recruited, or a grocery, cleanup, concert or other real-world event occurred. Future field claims need a separate consented witness/reconciliation process.

## Recipient behavior

The recipient sees a dedicated *Relay Desk* with an explicit "MODEL PROPOSAL RECEIVED / origin unverified" banner. The browser checks the embedded checksum for internal consistency and rejects corruption, unknown schemas, oversized fragments or unallowlisted source addresses. **Anyone can edit a payload and recompute its unsigned checksum**, so this is not proof of who generated it or that the model ran; the page says so. Its buttons let the recipient download the unsigned capsule or generate a *new question-only* link. Re-asking is always opt-in; no model request is made on arrival.

## Gates

No accounts or database, no automatic delivery, no third-party API calls from `/relay/`, no partner commitments, and a separate checkbox before sender-side copying. URL fragments are readable by recipients and anyone they forward them to; model output may contain personal information, so human review is required. Very large capsules are refused instead of silently truncated.

Read-only public sources are links, not endorsements. All receipts are unsigned, not authoritative attestations. NVIDIA free trial remains behind Vercel Preview protection; production route remains disabled.