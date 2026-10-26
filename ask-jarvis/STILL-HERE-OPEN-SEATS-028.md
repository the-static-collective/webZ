# STILL-HERE × OPEN-SEATS-028 · Build the missing support before asking people to disclose

**Status:** Independent early prototype / read-only review doorway. No staff, membership, private intake, survivor stories, appointed moderator, live peer matching, confidential case database, legal services or emergency response.

## The organizational arc

The new survivor-focused direction applies the Workboard's bottleneck-to-open-seat rule with stronger safety and privacy boundaries. The public mission begins with survivors of controlling or abusive relationships, especially fathers who are isolated or struggling to find informed practical support around co-parenting and legal processes. Participation is open to all genders. No diagnosis of others, adjudication of allegations or requirement to prove a story.

**Need → Specific blocker → Missing protective capability → Open design seat → Voluntary fictional/sample trial → Professional/operational review → Separate permission to handle real people or data → Human-confirmed small activity → Consent-filtered, de-identified learning.**

What makes this different from ordinary volunteer signups: **the project describes the missing capacity that would make the next survivor interaction safe**, offers a bounded first task that doesn't require access to survivors, and receives interest only through an explicit, independent opt-in desk for *potential builders*. Permission for a sensitive operational role is a **separate future decision**; a community website cannot grant it.

## First honest bottleneck

Not “we need more survivor stories.” We need qualified, accountable humans to establish privacy, confidentiality, moderation, responsible peer listening, accurate professional referral boundaries, incident handling, correction and withdrawal. The first recruiting request is for a **Privacy & Safety Steward** to critique a draft protocol on *fictional examples only*.

The first seven draft seats:
- **Privacy & Safety Steward** — monitor risk, data minimization, incident procedures.
- **Peer-Space Review Steward** — moderation rubric, fairness, de-escalation, refusal, withdrawal and appeal.
- **Peer Presence Designer** — short listening format with no demand for proof or disclosure.
- **Chronology & Documents Designer** — local-first observation/report/inference/questions template.
- **Qualified-Resource Pathfinder** — source-checked, jurisdiction-sensitive research, no legal advice by unlicensed volunteers.
- **Accessibility & Usability Tester** — keyboard/mobile/low-pressure flow, no testing on vulnerable strangers without review.
- **Private-Tools Builder** — fictional-only Still Here / possible BLACKSTAR/GRAFT prototypes, no raw case data.

Every public role remains **UNFILLED / DESIGN_ONLY**, not a personnel directory or a promise to offer real support. Actual reviewers require vetting, confidentiality training, supervision, appeals and a properly scoped access policy.

## What was built

- `public/still-here/index.html`: mobile-first page with a discreet `The Porch` tab title, monitored-device warning, simple next-step doors, seven work-generated open seats, editable-no-story content, copy/print voluntary invitations, and an explicitly separate builders-only contact desk.
- `public/still-here/model.mjs`: five generic initial survivor needs and seven roles, with specific first trials and prohibition/authority gates. No participant identity, stories, signed-up persons or imaginary completed work.
- `public/still-here/app.mjs`: local-only client interactions. No fetch, analytics, cookies, WebSocket, LocalStorage, IndexedDB, incident text fields, or submission forms.
- `test/still-here-open-seats.test.mjs`: strict checks for no data intake, local-only model, privacy and staff truth boundaries.
- `database/supabase/functions/porch-doors/index.ts`: wholly separate read-only Edge preview on the existing project. Denies POST, forbids scripts from making network connections, sends no-store/no-referrer/no-index page metadata and does not access databases.
- `scripts/build-still-here-edge-preview.mjs`: reproducible static asset packager.

**Preview:** https://kbhqacsdvjsstzyplqij.supabase.co/functions/v1/porch-doors

The preview is public but **not** a confidential service. Hosting providers can retain request metadata; a monitored device can expose history, clipboard and printed copies. The user controls each opt-in copy/share action.

### Immediate visitor experience

A person chooses a non-identifying need (listen; organize chronology; prepare professional questions; consider communication privacy; one manageable next step). The page shows a useful low-stakes first action and its limits, then explains **which protective capability the group still lacks**. It does **not** route a vulnerable person to an unvetted volunteer, solicit identifying facts, fabricate legal advice or claim a qualified person is available.

### Immediate volunteer experience

Potential builders browse concrete capability gaps. A person can copy a role invitation, prepare an ambassador invitation or print it. The generic Abundent contact desk is explicitly **not** for survivor case stories. It is for builders interested in discussing a voluntary design trial, and only with their separate consent.

### Blackstar, GRAFT, Still Here relationship

- STILL HERE: local-first “first door,” continuation, accurate chronology, private small steps.
- BLACKSTAR: candidate for private evidence organization once its concrete deployed interface and owner-approved access control are verified. No raw survivor records are routed from this public prototype.
- GRAFT: may eventually hold carefully de-identified, human-reviewed **process improvements**, never private incident or custody case records by default.
- JAR;VIS and OPEN SEATS: can discover missing **capabilities** and printable role invitations without needing personal stories.

## Before a live survivor group

1. Establish a responsible operator and documented policies for safeguarding, confidentiality, safety incident handling, records access, retention and deletion, correction/appeal and how requests outside project scope are handled.
2. Consult qualified local domestic-abuse and legal professionals about what nonprofessionals can and cannot offer, applicable reporting and confidentiality rules, and safe, verified referrals. No invented affiliations or resources.
3. Independently vet, orient and supervise human facilitators/reviewers before they interact with vulnerable people or case material. Use least-privilege access and test the withdrawal process.
4. Test only fictional or fully consented cases after these safeguards exist; no public survivor forum, raw testimony search index, automatic contact or open DMs.
5. Define metrics that reward useful outcomes, voluntary choice and safety (including ability to decline), not number of disclosed stories or members.
6. If participants freely share a lesson, separate a de-identified **process-learning candidate** from a case's records. Publish only after human review and permission.

**Invariant:** A person seeking help should not be required to recruit someone, prove an allegation, or expose private details. If the organization lacks a capability, *the organization* opens a bounded recruiting door for a willing helper. The survivor gets a manageable next step in the meantime.

**Do not mistake:** prototype ≠ staffed group; interest ≠ appointed peer; moderation policy ≠ reviewer credentials; information ≠ legal advice; narrative ≠ independently verified fact; visibility ≠ informed consent.
