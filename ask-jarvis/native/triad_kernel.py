#!/usr/bin/env python3
"""NATIVE-009: execute the three owner Python kernels against a tiny synthetic
question-observation specimen. No partner contacts, repository mutations,
authorization, or claims about real people. Repo paths supplied by a trusted host.

This is the *real* ALEX derivation evaluator, 3rdi compiler and LOADOUT compiler,
not a JavaScript simulation. An owner kernel can refuse; refusal is a result.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import sys
from datetime import datetime, timezone, timedelta

PINS = {
    "alex": ("ALEX.2", "7d116b716df82ee2379b399d90936d2fc01b7b16"),
    "rdi": ("3rdi", "e631167a04c6bd1bf95c62cbe5a415994ebb8134"),
    "loadout": ("Loadout", "1adcb3d82f736f3ca8329c3c1d0d9eba398d49ee"),
}

def sha(value: bytes) -> str:
    return "sha256:" + hashlib.sha256(value).hexdigest()

def run_native(roots: dict[str, Path], specimen: dict) -> dict:
    question = specimen.get("question")
    if not isinstance(question, str) or len(question) > 360 or len(question.strip()) < 8:
        raise ValueError("QUESTION_LENGTH")
    if any(ord(c) < 32 or ord(c) == 127 for c in question):
        raise ValueError("QUESTION_CONTROL")
    if __import__("re").search(r"[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|(?:\+?1[- .]?)?\(?\d{3}\)?[- .]?\d{3}[- .]?\d{4}", question):
        raise ValueError("PRIVATE_CONTACT")
    observed_at = specimen.get("observedAt")
    if not isinstance(observed_at, str) or not observed_at.endswith("Z"):
        raise ValueError("OBSERVATION_TIME_REQUIRED")
    instant = datetime.fromisoformat(observed_at[:-1] + "+00:00")
    if not 2020 <= instant.year <= 2100:
        raise ValueError("OBSERVATION_TIME_RANGE")
    moment = instant.replace(microsecond=0).isoformat().replace("+00:00", "Z")
    digest = sha(question.encode("utf-8"))
    for name, root in roots.items():
        if not root.is_dir():
            raise ValueError("OWNER_SOURCE_UNAVAILABLE:" + name)
    # Native owner implementations are imported from *separate pinned source roots*.
    sys.path[:0] = [
        str(roots["alex"]),
        str(roots["rdi"] / "skills/3rdi/scripts"),
        str(roots["loadout"] / "src"),
    ]
    from alex_runtime.derivation import evaluate_relation_case
    from three_rdi import compile_cut
    from loadout.compile import compile_loadout

    alex_case = {
        "case_id": "jarvis-attention-not-proof", "input_digest": digest,
        "operation_type": "relation_derivation",
        "rule_profile": "alex.runtime/derivation-m0",
        "given": {
            "records": [
                {"id": "public-document", "kind": "source"},
                {"id": "locally-verified-food-need", "kind": "claim"},
            ],
            "relations": [], "evidence_paths": [],
        },
        "attempt": {
            "evaluation_id": "alex-evaluation",
            "execution_step_id": "alex-one-bounded-evaluation",
            "relation_proposal": {
                "id": "needs-local-proof",
                "subject_id": "public-document",
                "predicate": "SUPPORTS",
                "object_id": "locally-verified-food-need",
                "scope": "local-field-reality",
                "basis_ids": ["public-document"],
            },
        },
    }
    alex_result = evaluate_relation_case(alex_case)
    evaluation = alex_result["evaluation"]

    # Occurrence = *this question was submitted to this synthetic exercise*,
    # NOT that a local need was observed or that a steward agreed.
    field = {
        "schema": "3rdi.field/v0", "field_id": "jarvis-observation-" + digest[7:19],
        "source_refs": ["jarvis-question-observation"],
        "occurrences": [
            {"id": "question-received", "occurred_at": moment,
             "locus_id": "jarvis-preview-question-desk",
             "source_refs": ["jarvis-question-observation"]},
        ],
        "exposures": [
            {"id": "question-visible-to-jarvis", "occurrence_id": "question-received",
             "observer": "jarvis-request", "layer": "public", "available_from": moment,
             "evidence_refs": ["jarvis-question-observation"]},
        ],
        "cuts": [
            {"id": "question-received-cut", "observer": "jarvis-request",
             "mode": "historical", "focus_at": moment, "known_at": moment,
             "audience_layers": ["public"], "location_scope": ["jarvis-preview-question-desk"],
             "focus_occurrence_ids": ["question-received"], "gate_ids": []},
        ],
    }
    rdi_receipt = compile_cut(field, "question-received-cut")

    issued = instant.replace(microsecond=0).isoformat()
    expires = (instant + timedelta(minutes=5)).replace(microsecond=0).isoformat()
    load_spec = {
        "compile_id": "jarvis-native-009-" + digest[7:19],
        "parent_compile_id": None, "issued_at": issued, "expires_at": expires,
        "world_cut_ref": "jarvis-question-observation:" + digest,
        "context_pack_ref": "owner-pinned-public-document-read-only",
        "compile_trace": {
            "id": "jarvis-native-009", "source_world_ref": "jarvis-preview",
            "operation": "bounded-compile",
            "preserved_invariants": ["no-authority-by-reading", "no-human-contact"],
            "declared_loss": ["no-private-field-observations", "no-external-project-execution"],
            "producer": "loadout.kernel/v0", "freshness": issued,
        },
        "capabilities": [
            {"capability": "public.source.read", "operation": "inspect",
             "reachable_effects": [], "parameters": {"owners": ["ALEX.2", "3rdi", "Loadout"]}},
            {"capability": "steward.contact", "operation": "intervene",
             "reachable_effects": ["external.contact"], "parameters": {"recipient": "UNSPECIFIED"}},
        ],
        "effect_fence": [], "effect_fence_ref": "no-side-effects",
        "effect_authorizations": {}, "owner_evidence_digest": digest,
        "egress_policy_ref": "no-egress",
    }
    load_result = compile_loadout(load_spec)

    receipt = {
        "schema": "ask-jarvis/native-owner-run/v1", "mode": "REAL_OWNER_KERNEL_INVOCATION",
        "questionDigest": digest, "observedAt": moment,
        "ownerCommits": {k: v[1] for k, v in PINS.items()},
        "alex": {
            "nativeSchema": "alex.runtime/derivation-m0",
            "disposition": evaluation["disposition"],
            "reasonCode": evaluation["reason_code"],
            "rulesetDigest": evaluation["ruleset_digest"],
            "survivors": evaluation["required_survivors"],
            "sourceSupportsLocalClaim": evaluation["disposition"] == "ACCEPT",
        },
        "rdi": {
            "nativeSchema": rdi_receipt["schema"],
            "projectionDigest": rdi_receipt["projection_digest"],
            "cutId": rdi_receipt["cut"]["id"],
            "observer": "jarvis-request",
            "historicalOccurrenceClaim": "QUESTION_ARRIVED_ONLY",
            "sourceHistoryTime": "UNKNOWN",
        },
        "loadout": {
            "nativeSchema": load_result["schema"],
            "compileDigest": load_result["compile_digest"],
            "capabilities": load_result["capability_bindings"],
            "effects": load_result["effective_effects"],
            "nativeAuthorityGranted": False,
        },
        "humanGate": "REQUIRED_BEFORE_REAL_WORLD_EFFECT",
        "effectsExecuted": [],
        "limits": "Synthetic per-question observation. No native finding of a food-access need, participating steward or venue permission. Owner code executed on attributed pinned source, no capability or authorization inherited.",
    }
    receipt["receiptHash"] = sha(json.dumps(receipt, ensure_ascii=False, separators=(",", ":")).encode())
    return receipt

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--alex", type=Path, required=True)
    parser.add_argument("--rdi", type=Path, required=True)
    parser.add_argument("--loadout", type=Path, required=True)
    args = parser.parse_args()
    try:
        request=json.load(sys.stdin)
        receipt=run_native({"alex":args.alex.resolve(),"rdi":args.rdi.resolve(),"loadout":args.loadout.resolve()},request)
        print(json.dumps(receipt,ensure_ascii=False,separators=(",", ":")))
    except Exception as error:
        # No traceback, question, path, or secret in the public response.
        code=type(error).__name__.upper()
        print(json.dumps({"schema":"ask-jarvis/native-owner-run/v1","status":"HOLD","reason":"NATIVE_RUNTIME_UNAVAILABLE_OR_REFUSED","exceptionType":code}))
        return 2
    return 0

if __name__=="__main__":
    raise SystemExit(main())
