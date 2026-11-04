# LIVE OFFER 001 — Jubilee now-first capability workbench

**Status:** no-account first-party browser application at `/jubilee/live/`, with proposed `relatte.live-offer-cartridge/v0` and deterministic JAR;VIS-style action generation. Adds a source-owned action path; does not replace Jubilee's event or participation pathways.

A visitor may say `I can play guitar for 20 minutes` and choose NOW (or LATER, SOON, or NOT SURE). The machine ranks consequences from a pinned declarative cartridge. Real now actions: device mic/camera recording after explicit browser permission, download audio/video, create a local typographic PNG, export a local catalog JSON, draft an announcement, create an .ics reminder, or send **only the deliberately reviewed text** to the already-existing Porch Receiver 009 private review backend. The page can check for reviewed replies or withdraw through receipt keys. No new Supabase tables or functions are deployed.

**No actual stream hosting**, AI image generation, media upload, automatic live posting, event booking, verified identity, signed reLATTE crossing, or guaranteed human response. A stream button builds a user-directed announcement for an existing HTTPS stream link. Media is held in tab memory until downloaded. Link data and typed text are not automatically uploaded. Local preference counts are only persisted if specifically opted in; raw words/media are not stored there. The remote submission cannot receive large media and has an existing sensitive-data filter/rate limits.

**Learning, accurately scoped:** a deterministic ranker with explicit (bounded) action-use weights, plus optional user-owned local preference persistence. It is not a continuously trained model or an autonomous executor. The cartridge declares permissible action edges; those edges are proposals and have no owner-local semantic effect in reLATTE until separate admission and appropriate human permission.

### Verification

`node --test tests/live_offer_router.test.mjs`, then `python tests/live_offer_browser.py` on a CI runner with Playwright Chromium installed. The browser test uses fake camera/mic hardware and mocked remote POST; **it does not send a real private offer**, test real video capture with a physical device, or establish live uptime of the receiving backend. It exercises generated PNG, JSON, audio WebM, and the consent boundary. The production domain runs the app via HTTPS, which is required for real device capture.

### Safety and authority

A person's offer is not permission to publish; a browser recording is not a transfer or automatic upload; a stored receipt is not booking acceptance. Unknown needs, questions and alternative time modes remain valid—this interface does not make a person classify themselves to be heard.
