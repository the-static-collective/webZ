#!/usr/bin/env python3
"""Living Witness 005: prepare or independently rederive an OSHB-backed proposal.
No human witness, preferred translation, institutional consent or native credit.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile

HERE = Path(__file__).resolve().parent
CIRCUIT = HERE.parent
REVIVAL_COMMIT = "af1e00c24e3d7c6eb6b1ac39ef59bf894e2385fd"
GHOT_COMMIT = "9748a0772c4a13135421c4fa84a9991e0a51e05f"
CORPUS = "corpora/oshb-v2.2-genesis-opening.json"


def sha256(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def canonical(value: object) -> bytes:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")


def exact_checkout(root: Path, sha: str, marker: str) -> Path:
    root = root.expanduser().resolve()
    if not (root / marker).is_file():
        raise ValueError("Donor missing mandatory source: " + marker)
    run = subprocess.run(["git", "-C", str(root), "rev-parse", "HEAD"],
                         capture_output=True, text=True, check=True, timeout=8)
    if run.stdout.strip() != sha:
        raise ValueError("Source commit differs from required immutable pin: " + sha)
    return root


def original_corpus(revival: Path) -> dict:
    run = subprocess.run(
        [sys.executable, "-m", "revival.corpus", str(revival / CORPUS), "--root", str(revival)],
        cwd=revival, env={**os.environ, "PYTHONPATH": str(revival / "src")},
        capture_output=True, text=True, timeout=25,
    )
    if run.returncode:
        raise RuntimeError("Pinned Revival corpus source failed: " + run.stderr[:200])
    corpus = json.loads(run.stdout)
    core = {k: corpus[k] for k in ("id", "description", "recipe_id", "witnesses", "lemma_index")}
    if sha256(canonical(core)) != corpus.get("corpus_sha256"):
        raise RuntimeError("Native Revival public corpus identity did not re-derive.")
    if (corpus["id"] != "oshb-v2.2-genesis-opening"
        or corpus["recipe_id"] != "surface"
        or [w["locator"] for w in corpus["witnesses"]] != ["Gen.1.1", "Gen.1.2", "Gen.1.3"]
        or not corpus["lemma_index"].get("430")):
        raise RuntimeError("Pinned OSHB corpus contents changed unexpectedly.")
    return corpus


def source_manifest(revival: Path) -> dict:
    manifest = json.loads((revival / "sources/oshb-v2.2/source.json").read_text(encoding="utf-8"))
    required = ("source_id", "upstream_commit", "upstream_path", "upstream_blob_sha", "fixture_sha256", "license")
    if any(key not in manifest for key in required):
        raise RuntimeError("OSHB attribution fields missing.")
    if not all(manifest["license"].get(key) for key in ("text", "annotations", "attribution")):
        raise RuntimeError("OSHB required license attribution missing.")
    return manifest


def core_payload(revival: Path) -> dict:
    corpus = original_corpus(revival)
    manifest = source_manifest(revival)
    return {
        "schema": "abundent.living-witness.candidate/v0",
        "purpose": "OPTIONAL_SOURCE_BACKED_READING_TABLE_METHOD_PROPOSAL",
        "status": "UNVERIFIED_METHOD_CANDIDATE",
        "source": {
            "repo": "the-static-collective/revival",
            "revision": REVIVAL_COMMIT,
            "native_entrypoint": "python -m revival.corpus",
            "manifest_path": CORPUS,
            "corpus": corpus,
            "oshb_source": manifest,
            "boundary": "OSHB source-backed Hebrew surface; not translation or theological authority.",
        },
        "method": {
            "title": "Optional Genesis source curiosity table",
            "steps": [
                "Invite participation without enrollment or obligation.",
                "Display the attributed Genesis 1:1-3 source Hebrew alongside relevant license terms.",
                "Let participants inspect lemma 430 occurrences and source provenance without asserting identical meaning.",
                "Invite individual interpretation and permission-specific discussion; decline is always available.",
                "Any actual gathering, publication or method adoption requires independent human approval.",
            ],
            "topic": "voluntary community learning",
            "reusable_only_as": "NEW_PROPOSED_UNAPPROVED_PROJECT",
            "license_context": "Preserve source text and OSHB annotation attribution when publishing.",
        },
        "social_context": {
            "scene": "FICTIONAL_FELLOWSHIP_TABLE",
            "real_people_present": False,
            "event_occurred": False,
            "independent_human_review": False,
        },
        "nonclaims": [
            "No event consent, human authority, live service or church endorsement",
            "No translation authority, doctrine, compulsory participation or Scripture preference",
            "No payment, Jubilee token, native Full Measure or GrO write",
            "Signed artifact bytes do not authenticate real-world owner identity",
        ],
    }


def donor_hash(ghot: Path, text: str) -> dict:
    ghot = exact_checkout(ghot, GHOT_COMMIT, "ghot/reference_node.py")
    sys.path.insert(0, str(CIRCUIT))
    from ghot_local_server import execute_native_hash
    with tempfile.TemporaryDirectory(prefix="living-witness-005-") as home:
        checked = execute_native_hash(ghot, Path(home), text)
    return {
        "repository": "the-static-collective/GHoT",
        "commit": GHOT_COMMIT,
        "execution": checked,
        "scope": "native system.hash in temporary local runner; unsigned, not human observation",
    }


def validate_candidate(payload: dict, revival: Path) -> None:
    expected = core_payload(revival)
    # Compare every schema-limited non-compute field to rederived pinned Revival input.
    copy = dict(payload)
    compute = copy.pop("bounded_compute", None)
    if copy != expected:
        raise ValueError("Candidate differs from independently rederived Revival corpus or method.")
    if not isinstance(compute, dict) or compute.get("commit") != GHOT_COMMIT:
        raise ValueError("Native GHoT donor claim missing.")
    evidence = compute.get("execution") or {}
    receipt = evidence.get("receipt") or {}
    text = expected["source"]["corpus"]["witnesses"][0]["compiled_text"]
    digest = sha256(text.encode("utf-8"))
    output_digest = sha256(canonical({"sha256": digest}))
    if (evidence.get("nativeGHoT") is not True or evidence.get("transport") != "loopback_only"
        or evidence.get("source") != "GHoT/ghot/reference_node.py"
        or receipt.get("kind") != "ghot.receipt" or receipt.get("version") != "0"
        or receipt.get("status") != "ok" or receipt.get("capability") != "system.hash"
        or receipt.get("output") != {"sha256": digest}
        or receipt.get("output_sha256") != output_digest):
        raise ValueError("Unsigned GHoT receipt claim is malformed or inconsistent.")
    # The returned donor receipt is not proof of who actually ran the task.


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--revival", required=True)
    parser.add_argument("--ghot", help="Exact GHoT checkout, for --prepare")
    action = parser.add_mutually_exclusive_group(required=True)
    action.add_argument("--prepare", help="Create a new candidate JSON path")
    action.add_argument("--check", help="Re-derive and check an existing candidate JSON")
    args = parser.parse_args()
    revival = exact_checkout(Path(args.revival), REVIVAL_COMMIT, "src/revival/corpus.py")
    if args.prepare:
        if not args.ghot:
            parser.error("--ghot is mandatory for --prepare")
        payload = core_payload(revival)
        text = payload["source"]["corpus"]["witnesses"][0]["compiled_text"]
        payload["bounded_compute"] = donor_hash(Path(args.ghot), text)
        validate_candidate(payload, revival)
        out = Path(args.prepare)
        with out.open("x", encoding="utf-8") as file:
            json.dump(payload, file, ensure_ascii=False, sort_keys=True, indent=2)
            file.write("\n")
        print("PASS: actual pinned OSHB corpus and native GHoT candidate prepared; unsigned file.")
    else:
        raw = Path(args.check).read_bytes()
        if not (0 < len(raw) <= 65536):
            raise ValueError("Candidate too large for receiver quarantine.")
        validate_candidate(json.loads(raw), revival)
        print("PASS: independently re-derived exact OSHB corpus and checked claimed GHoT receipt shape.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, RuntimeError, ValueError, subprocess.SubprocessError, KeyError) as error:
        print("LIVING WITNESS 005 REFUSED: " + str(error), file=sys.stderr)
        raise SystemExit(1)
