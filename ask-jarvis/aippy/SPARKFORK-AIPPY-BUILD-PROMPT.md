# SPARKFORK · Aippy first-build prompt
Copy everything below the divider into Aippy's create prompt as a NEW app. No proprietary keys, private contacts, account details, organization membership records or unpublished source are required.

---

Create a delightful, very replayable, mobile-first 45–75 second interactive microgame called **SPARKFORK: Pass the Fire**.

CENTRAL IDEA: People can start a useful little experiment without first finding an existing leader. A single player lights a symbolic campfire with things they actually have, chooses how close they want to stand, receives a small real-world mission proposal, and can pass the experience to someone else to remix. The play itself is the invitation. Make this first release fully self-contained in the browser with no accounts, databases, API calls, backend, login, form submission, tracking, leaderboard or real-world action.

VISUAL DIRECTION: Irresistibly tactile pocket-sized arcade toy. Hand-drawn storybook map meets cozy nighttime indie game, warm ember/orange against indigo pine-green, luminous concentric rings, chunky touch targets, pleasantly squishy little objects, gentle ember trails, textured paper field cards, occasional magical glow and warm sound if supported. NOT a corporate civic dashboard. The UI should be readable on a cheap Android phone, with big obvious tap targets, useful contrast, no flashing animations and reduced-motion handling. One screen at a time, very fast opening.

ACTUAL GAMEPLAY — FOUR BEAUTIFUL STEPS:
1. OPENING: Show a dark grove, a little campfire waiting for its first log, and one giant action "GIVE IT A SPARK." On first touch, fire flickers alive. Overlay: "A fire needs a question. Not a committee."
2. OFFERINGS: Show ten cute objects floating around the fire: tomato (extra food), little printer, clock (time), guitar/music, pair of willing hands, wrench/tools, painting brush/art, porch (space), old laptop/tech, bicycle/truck (transport). Let the player TAP or DRAG two distinct offerings into the fire. Every item should feel physical. If drag doesn't work on touch, tapping must. Optional change/undo. Ask "What have you got?" not "What job do you want?" Make chosen object labels clear for screen readers.
3. THE RINGS: Four concentric glowing spots around the fire, each equally welcome. Let the player choose one, or freely change:
 - Curious: "I want to understand."
 - Helper: "I could contribute one useful thing."
 - Starter: "I'd try something small."
 - Gatherer: "I'd help bring willing people together."
 These describe self-chosen interest, never actual status, seniority, or authority. No rankings, points, streaks, public usernames or status claims.
4. THE SPARK CARD: A satisfying "whoosh" when the offerings combine. Reveal one unexpectedly charming, concrete seven-day mission PROPOSAL, based on the two items plus ring. It must have a whimsical 2–5 word name, one useful action possible today, one human question to ask, one relevant real-world safety/permission boundary, and the statement "This is a proposal. No person or organization has agreed." Provide buttons "Try another mix", "Copy the invitation", "Share this little game" (using native Share when available, otherwise text copy), and "Take it into town" (a link to https://abundent.org/ only, without sending private data). Keep the card visually delightful and fit on mobile. Copy text contains a voluntary question, not a command to others.

GENERATIVE FEEL BUT DETERMINISTIC LOGIC: Do NOT require an LLM at runtime. Implement a small transparent local mission composer using tokens and canned mission templates with thoughtful combination rules. Some examples:
 - tomato + printer => "The Tomato Telegraph": draft a three-line offer for someone knowledgeable about safe food sharing to REVIEW, not a distribution promise. A person can explore the open Food Bridge starter role without already having the title. Food safety, storage and real distribution require qualified review.
 - guitar + porch => "Porchlight Chorus": sketch one pressure-free fifteen-minute listening invitation, and ask a willing musician or host for feedback. No booked venue.
 - gloves/hands + time => "The Tiny Trail Quest": draft a thirty-minute permitted cleanup plan, and ask the relevant land steward about authorization and disposal first. Never imply automatic access.
 - laptop + printer => "Paper Portal": make one tiny page or flyer about a public-safe question and ask one person whether it helps.
 - wrench + art => "Repairing the Rainbow": propose a harmless art/repair demo with permission, excluding mains electricity and dangerous gear.
 - transport + tomato => "The Unpromised Delivery": sketch a paper-only route and check whether there is a real need and qualified food handling before moving anything.
 Handle all other combinations gracefully, recombining the nearest templates and the player-chosen role into a specific first draft or question. Randomly vary warm, playful card titles WITHOUT claiming a real-world match. Each play generates new visuals and a small artifact, not a fake completed mission.

REMIX DNA — MOST IMPORTANT: This app must be easy to fork and remix with Aippy's REAL PLATFORM REMIX function (do not fake a Remix backend or imply in-app editing is connected to Aippy if that isn't exposed). Organize data into clear editable sections: THEME, WORLD_NAME, OFFERINGS, MISSION_RECIPES, RINGS, COLOR_PALETTE, and INVITATION_COPY. Make it easy to change one world or swap assets without rewriting the logic. Add a tiny optional "A little spark from Abundent · remix the fire your way" credit in the information screen, while respecting Aippy's actual native creator-credit/remix behavior. Let the game's own share action invoke the native share sheet for the APP link if available; otherwise show a compact copyable invitation. When the platform share link isn't available, don't fabricate one.

PLAYFUL SOCIAL PAYOFF: End the round with a tiny spark-creature rolling an ember toward the edge of the screen and the question, "Who might carry this next?" Player can replay, explicitly share the game, or use Aippy's platform Remix on the published project. Do not claim someone accepted, downloaded, remixed or volunteered.

PERMISSIONS, INTEGRITY AND PRIVACY:
- No personal data entry: no names, street addresses, phone, private stories, location permission, camera/mic, financial data, or signups. No hidden collection of responses.
- No automatic sending invitations, enrolling volunteers, booking events, authorizing parks, distributing food, forming official coalitions, or claiming partner approval.
- The four rings are flexible per project, not a leadership scoring system.
- Curiosity and refusal are meaningful; users can walk away.
- Any outward movement into a real community project requires a willing human and, for consequential actions, the responsible owner's approval.
- Stay fully playable if the phone is offline after loading and if all external links are unavailable.

BUILD PRIORITIES: #1 working mobile gameplay, #2 tangible satisfying visual interactions, #3 credible specific proposal cards, #4 copy/share and replay, #5 clear remixable structure. No over-engineered platform. If any feature fails, preserve the first four steps. Optimize for one very memorable original that others want to remix.

DELIVERABLE: A playable published-ready Aippy experience. Do NOT claim to have published it, contacted anyone, connected to Abundent APIs, or verified community data. The owner will test and enable native Remix when publishing.
