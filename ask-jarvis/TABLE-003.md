# Ask JAR;VIS / HOUSE-003 Invitation Table — SOURCE-ONLY PREVIEW

**Status:** DRAFT / HOLD. This adds a public-safe static browser surface to the already experimental Ask JAR;VIS 1999 release source. It **does not deploy** it, activate another API, run any models, collect questions, contact real people, or enroll GRAFT organs.

The first Ask JAR;VIS screen and its existing /api/ask behavior are not changed. The HOUSE-002 /table/ page gains a local link to /table/encounter/. This third page accepts an **already generated** native HOUSE-003 encounter JSON from the separate TABLElogic integration. The browser independently computes a local object digest, checks bounded non-authority claims and displays three possible doors per Workbench reading. It cannot independently verify native source cryptography, original donors or human identities. It offers local KEEP_AS_QUESTION / INVITE_LOCAL_REVIEW / DECLINE choices and a downloaded, unsigned review return that cannot grant anything.

An explicitly fictional demonstration is provided without any claims of donor execution. The source browser has strict CSP, no network requests, no localStorage, no upload endpoint or browser background syncing. Original public site was not modified; the draft is based on Ask JAR;VIS source branch plus HOUSE-002 draft, not the currently deployed Vercel immutable snapshot.

**Source of native receipts:** TABLElogic PR #3, genesis/003-question-to-invitation (unmerged). Original programs use SOURCE-PINNED local replay. The speculative pair between a question and a capability is a hypothetical review slot, not verified semantic matching, availability or an organization accepting an invitation.

Review gates: existing and new CI, keyboard/phone Chromium preview, output-directory verification, exact current Vercel release ancestry, release rollback and deliberate separate publication decision. Do not merge experimental webZ branches into main or reassign abundent.org by inference.

**Nothing is sent. The table has room for a question without deciding its owner or its outcome.**
