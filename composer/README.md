# Navigation Composer 001 — The Field Is the Instrument

> We play where we arrive.

This is **not a new menu for the existing website**. It is a small, independent instrument, hosted under \`/composer/\` as an experiment. The existing \`/week/\` page contributes **source material only** (the fourteen track locators and seven published listening-letter groupings). Its layout, postcard mechanics and navigation are not reused.

## The experiment

1. **Arrive** at a listening letter by touching a node in an open field.
2. **Walk** to a recording, its published pairing, or another letter. The drawn line and the accumulated trail are the composition.
3. **Listen** to an actual Suno recording, or **trace** a published letter back to its source, at any point in the walk.
4. **Plant a particular** — a visitor-authored name and optional fragment — as a new local node related to the selected one.
5. **Fold** the walk into a readable invitation and a portable, unsigned JSON score.
6. **Unfold** a saved score in a separate visit, reconstructing only bounded, source-known relations and locally authored nodes.

**No account, database, analytics, network fetch, hidden persistence, or automatic publication.** The composed artifact is in page memory until the visitor explicitly copies or downloads it. Source links open in a new tab; exported files contain references, not scraped or copied song audio.

## Provenance / ownership

- **Published observation:** the letter and its pair of songs as authored at <https://abundent.org/week/>.
- **Editorial suggestion:** the optional walk between consecutive letters. It is not a historical or causal assertion.
- **Visitor creation:** seeds and their attached fragments belong to the score. The instrument does not claim those seeds are source verified or authorized by the Collective.
- **Portable score:** \`static/navigation-score/v0\` is a local **unsigned composition**, not a reLATTE crossing or signed receipt, webZ world admission, identity grant, or STORYSHIP canon.

The export \`observations\` can be reconstructed from trusted built-in node IDs. Imports validate bounded local \`path\`, \`seeds\`, and \`note\`; they ignore potentially forged \`observations\` supplied by an imported file. The field is an aesthetic interface, not a certificate of source authority.

## Run

From repository root:

\`\`\`sh
npm run serve
# http://localhost:8080/composer/
npm test
\`\`\`

This is an isolated review slice. Adding a link from the production homepage, enabling persistence, remote sharing, direct media embedding, adding sovereign receiver contracts or deploying to a public domain are **separate decisions**, not implicit in landing this branch.

## Manual questions to explore

- Does exploring the field feel like **playing** instead of menu navigation?
- Does a visitor leave with a genuine particular that did not exist on arrival?
- Can the exported score be carried to a fresh browser and unfolded?
- Are published relationships, editorial bridges, and visitor-authored ones plainly distinguishable?
- Can the entire interaction be followed by keyboard and at narrow mobile widths?

If these fail, change the instrument — not the source world to fit the instrument.
