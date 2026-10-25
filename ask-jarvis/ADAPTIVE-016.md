# ADAPTIVE-016 — One question, one considered response

The original JAR question card now remains available while an optional preview-only model pass adds a direct answer, one useful next action, and a copy-ready draft. The visitor doesn't need to upload context or open a second experiment.

The preview server draws from inspected public source snippets plus relevant Commons and GRAFT editorial summaries. The browser checks content integrity, source pins, Commons release, and GRAFT publication snapshot before presenting the generated answer. The model may propose connections, not certify people, permissions, partnership agreements or completed work.

Automatic reasoning is gated to Vercel Preview with JARVIS_ADAPTIVE_ENABLED, JARVIS_AI_ENABLED, JARVIS_FREE_COMPUTE_ENABLED, and an individually enabled free Groq or Gemini provider. At most one model is called for this added answer. There is no automatic paid provider fallback, remote action, automatic publication, or persistence of a visitor's question. Production remains deterministic.

Test from ask-jarvis/: npm test, node scripts/build-town-graph.mjs, node scripts/build-reviewed-return-graph.mjs. The new test/adaptive.test.mjs covers source context, unrelated questions, output validation, one-call routing and production refusal.

Remaining before a public release: manual mobile field review, real provider smoke test, distributed quotas, abuse prevention and independent publication stewardship. This branch does not change abundent.org or the production alias.
