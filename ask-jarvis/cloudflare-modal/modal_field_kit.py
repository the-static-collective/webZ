"""A bounded, human-reviewed real compute experiment for JAR;VIS.

Deployed with: modal deploy cloudflare-modal/modal_field_kit.py
Modal proxy auth happens before container startup; the secondary HMAC binds the
exact request payload to a short-lived Cloudflare Worker authorization.
This is deterministic Python, NOT an LLM service or an executed field outcome.
"""
import hashlib
import hmac
import html
import json
import os
import time
from typing import Any

import modal

app = modal.App("jarvis-field-kit")
image = modal.Image.debian_slim().pip_install("fastapi[standard]")

def _safe_dict(body: Any) -> dict[str, Any]:
    if not isinstance(body, dict) or set(body) != {
        "schema", "question", "context", "sourcePins", "sourceStatus"
    }:
        raise ValueError("INVALID_FIELDS")
    q = body.get("question")
    if body.get("schema") != "jarvis/modal-input-v1" or not isinstance(q, str):
        raise ValueError("INVALID_SCHEMA")
    if len(q) < 8 or len(q) > 360 or any(ord(ch) < 32 for ch in q):
        raise ValueError("INVALID_QUESTION")
    ctx = body.get("context")
    if not isinstance(ctx, dict) or set(ctx) != {"relation", "goal", "editorialFirstMove"}:
        raise ValueError("INVALID_CONTEXT")
    if any(not isinstance(v, str) or len(v) > 250 for v in ctx.values()):
        raise ValueError("INVALID_CONTEXT")
    pins = body.get("sourcePins")
    if not isinstance(pins, list) or len(pins) > 3:
        raise ValueError("INVALID_SOURCE_PINS")
    for pin in pins:
        if not isinstance(pin, dict) or set(pin) != {
            "id", "name", "commit", "sha256", "document", "status"
        }:
            raise ValueError("INVALID_SOURCE_PIN")
        if pin["status"] != "INSPECTED" or not all(
            isinstance(value, str) and len(value) < 250 for value in pin.values()
        ):
            raise ValueError("INVALID_SOURCE_PIN")
        if not isinstance(pin["sha256"], str) or len(pin["sha256"]) != 64 or not all(
            x in "0123456789abcdef" for x in pin["sha256"]
        ):
            raise ValueError("INVALID_SOURCE_PIN")
    if body["sourceStatus"] != "INSPECTED_DOCUMENT_NOT_FIELD_OUTCOME":
        raise ValueError("INVALID_SOURCE_STATUS")
    return body


def build_field_kit(body: Any) -> dict[str, Any]:
    """Build an actual print-ready HTML artifact, without models or side effects."""
    d = _safe_dict(body)
    q = d["question"]
    ctx = d["context"]
    independent = ctx["relation"] == "INDEPENDENT_QUESTION"
    sample = q.lower()
    if any(word in sample for word in ("grocery", "food", "garden", "produce", "tomatoes")):
        focus, test = "Food-access conversation", "Ask one willing organizer to review one possible handoff and its safety questions."
    elif any(word in sample for word in ("music", "song", "choir", "church")):
        focus, test = "Song-sharing invitation", "Ask the relevant music coordinator whether a short, optional song-sharing conversation would be welcome."
    elif any(word in sample for word in ("park", "cleanup", "trash", "conservation")):
        focus, test = "Shared stewardship test", "Ask the site steward what a safe 30-minute volunteer trial could involve."
    elif any(word in sample for word in ("artist", "mural", "gallery", "art")):
        focus, test = "Artist-led gathering", "Invite one artist to propose a time and permission-respecting meeting format."
    else:
        focus, test = "A useful first experiment", "Ask one willing person to review the question and suggest the smallest reversible next step."
    if independent:
        test = "Verify any current facts from their original source before proposing a local action."
    first = ctx["editorialFirstMove"].strip()
    if len(first) < 18 or independent:
        first = test
    steps = [
        "Ask the relevant person whether they want to review this idea.",
        first,
        "Write down one concrete response, including any concerns or refusal.",
        "Only announce an event, service, or partnership after its steward confirms it."
    ]
    print_steps = "".join("<li>" + html.escape(step) + "</li>" for step in steps)
    sources = "".join(
        "<li>" + html.escape(pin["name"]) + " — inspected project document; "
        + html.escape(pin["id"]) + "</li>"
        for pin in d["sourcePins"]
    )
    if not sources:
        sources = "<li>No public project document was confirmed in this source cut.</li>"
    page = f"""<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Field kit · {html.escape(focus)}</title>
<style>
@page {{size:letter;margin:0.65in}}
body{{font:17px/1.5 system-ui,Arial;color:#19332d;max-width:720px;margin:30px auto;padding:15px}}
h1{{font-size:2rem}} h2{{margin-top:1.5rem}}.note{{border-left:5px solid #6a9785;padding:1em;background:#eff6f1}}
small{{color:#47695e}}li{{margin:.55em 0}}@media print{{body{{margin:0;padding:0}}}}
</style></head><body><h1>{html.escape(focus)}</h1>
<div class="note"><b>A draft invitation, not an announced program.</b>
<p>Could we take 15 minutes to explore a small useful step? No commitment, RSVP or account is required to consider the idea.</p></div>
<h2>The question</h2><p>{html.escape(q)}</p>
<h2>One practical test</h2><ol>{print_steps}</ol>
<h2>Notes for a willing reviewer</h2><p>What would you change? __________________________________________</p>
<p>Who, if anyone, owns the next decision? ________________________________</p>
<p>Next voluntary check-in (only if agreed): _________________________________</p>
<h2>Source context (not proof of participation)</h2><ul>{sources}</ul>
<small>Prepared by JAR;VIS × Modal compute. Proposal only. No person was contacted, no event was booked, no permission established, and no real-world action was performed.</small>
</body></html>"""
    if len(page) > 12000:
        raise ValueError("OUTPUT_TOO_LARGE")
    return {
        "schema": "jarvis/modal-field-kit-v1",
        "status": "DRAFT_ONLY",
        "title": focus,
        "steps": steps,
        "printableHtml": page,
        "sourceCount": len(d["sourcePins"]),
        "modelInvoked": False,
        "executedActions": False,
        "authority": "NONE"
    }


@app.function(
    image=image,
    secrets=[modal.Secret.from_name("jarvis-modal-bridge")],
    cpu=0.125,
    memory=128,
    max_containers=2,
    min_containers=0,
    scaledown_window=5,
    timeout=30,
    retries=0,
)
@modal.asgi_app(requires_proxy_auth=True)
def endpoint():
    from fastapi import FastAPI, Request
    from fastapi.responses import JSONResponse
    api = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)

    @api.post("/")
    async def field_kit(request: Request):
        raw = await request.body()
        if len(raw) > 4500:
            return JSONResponse({"status": "HOLD", "reason": "BODY_TOO_LARGE"}, status_code=413)
        ts = request.headers.get("x-jarvis-timestamp", "")
        sig = request.headers.get("x-jarvis-signature", "")
        try:
            stamp = int(ts)
        except (ValueError, TypeError):
            return JSONResponse({"status": "HOLD", "reason": "AUTH_REQUIRED"}, status_code=403)
        if abs(stamp - int(time.time() * 1000)) > 60000:
            return JSONResponse({"status": "HOLD", "reason": "STALE_REQUEST"}, status_code=403)
        secret = os.getenv("JARVIS_MODAL_BRIDGE_SECRET", "")
        if len(secret) < 32 or len(sig) != 64:
            return JSONResponse({"status": "HOLD", "reason": "AUTH_REQUIRED"}, status_code=403)
        expected = hmac.new(secret.encode(), ts.encode() + b"." + raw, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected):
            return JSONResponse({"status": "HOLD", "reason": "AUTH_REQUIRED"}, status_code=403)
        try:
            result = build_field_kit(json.loads(raw))
            return JSONResponse(result, headers={"Cache-Control": "no-store", "X-Content-Type-Options": "nosniff"})
        except (ValueError, TypeError, json.JSONDecodeError):
            return JSONResponse({"status": "HOLD", "reason": "INVALID_PUBLIC_INPUT"}, status_code=422)

    return api
