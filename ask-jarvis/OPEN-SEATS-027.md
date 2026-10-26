# OPEN-SEATS-027 · When work is blocked, invite the missing capability

> A bottleneck is not a stopping point. It is a question about what help, verification, authorization, or stewardship would make the next small step possible. Make that specific role discussable and voluntarily explorable. **Interest does not grant authority.**

## The engine we are growing

**Conversation → opportunity → first useful move → named bottleneck → open seat → voluntary interest / ambassador → permissioned, reversible trial → documented return → stronger shared memory → next open seat.**

We should not recruit primarily for a generic organization or a committee. Recruit for a **particular bounded action** and let people shape its role. If a challenge appears, the next default JAR;VIS question becomes:

**"What exact capability or consent is missing? Could a willing person help with its smallest reversible piece?"**

The architecture distinguishes:

- `blocked because no one has volunteered` (an opportunity to invite) from `blocked because nobody has approved` (an authority boundary).
- `interested in shaping this role` from `appointed to that role`.
- `approved to review a fictional sample` from `allowed to see private pending contributions`.
- `reviewed public statement` from `verified factual outcome`.
- `asked a person` from `the person agreed`.

The first concrete recruiting point is **the Workboard's own review-steward gap**. The private human-moderation queue is functioning, but the public preview still lacks a dedicated authenticated moderator console and no person is automatically appointed by using it. The first safe task is not to ask a stranger to enter the database. It is to **help draft and test a fair publication/refusal/redaction rubric on fictional material**. Actual reviewer access requires a separate authorization and safeguarding decision by the independent Abundent operator.

## What ships in this pull request

- Six first-class, source-labeled open-seat definitions in `public/board/open-seats.mjs`:
  **Review Steward, Permission Connector, Question Verifier, Small-Work Builder, Invitation Weaver, Return Witness.**
- Each seat names a particular missing capability, a short **first safe trial**, what a useful return would look like, who must authorize subsequent actions, and what remains outside the volunteer's authority.
- A prominent **review-steward spotlight** and a general **"What step is stuck?"** classifier in `public/board/open-seats-ui.mjs` and `public/board/index.html`.
- Explicit **I might be able to help**, **Invite someone**, **Ask an ambassador**, and **Print invitation** controls. The interest button opens the existing independent private Abundent contact desk, where the interested person must separately consent and submit their own details. The Workboard itself never collects private contact information.
- Every actionable memory card can now open its suggested missing capability through **Find the missing helper**.
- An anonymous helper can safely *explore* the role; no account or appointed office is required for the first trial. People are allowed to decline, refer an ambassador with consent, or stop.
- Fully local, deterministic capability generation; no AI credentials, chat data, private submissions, external database read, mass outreach, hidden submission, or site-owner/partner permission inference.

## Stewardship and recruitment lifecycle

1. **Observed blocker** (or clearly editorial hypothetical): preserve its evidence or label it "possible," never claim an official vacancy.
2. **Capability required:** separate actual permission or legal authority from tasks a willing helper may perform without it.
3. **Publish optional invitation:** bounded trial, explicit limits, no named people or invented organizations.
4. **Receive private opt-in interest** at the existing Abundent contact desk. The person chooses whether to send, and contact permission controls follow-up.
5. **A responsible human reviews fit and grants narrowly scoped access only if appropriate.** Interest is not an appointment or accepted task. Sensitive moderation must have confidentiality, escalation and correction policies before real private data access.
6. **Perform a reversible trial; optionally document a self-report.** Verify claims before representing them as completed outcomes.
7. **Return learning to the reviewed Workboard.** A new blocker may open another seat. A refusal or failed trial is still useful context.

## Not represented as complete

There is no self-service authenticated moderator console, recruitment roster, automatic handoff into partner groups, self-assigning permissions, public contact directory, or auto-approval of contributions. No role card claims a current applicant, official vacancy, reviewer authorization, or successful match. No claim that any grocery, Coalition, church, event, or park granted authority.

Any eventual community-operational launch must independently test consent, moderation, disputes, participant protection, reversible permissions, and deletion/retention. The draft PR is stacked on MEMORY-026 → WORKBOARD-025 → CAMPFIRE and must not be merged alone.

**Arc principle:** When you encounter a wall, reveal the missing door. Let a willing person help *make the door possible*. Never let a door pretend to be an authorization.
