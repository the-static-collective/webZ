#!/usr/bin/env python3
"""Circuit 004: run exact, pinned donor code and compose a fictional two-harbor proof.

No real church, human witness, gift, money, signature or deployment is claimed.
Python 3.11+ and Node 20+; donor source checkouts must be obtained separately.
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
REVIVAL_SHA = "af1e00c24e3d7c6eb6b1ac39ef59bf894e2385fd"
GHOT_SHA = "9748a0772c4a13135421c4fa84a9991e0a51e05f"


def sha_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha_json(obj: object) -> str:
    return sha_bytes(json.dumps(obj, sort_keys=True, separators=(",", ":"),
                                 ensure_ascii=False).encode("utf-8"))


def pinned_checkout(path: Path, sha: str, marker: str) -> Path:
    repo = path.expanduser().resolve()
    if not (repo / marker).is_file():
        raise ValueError(f"Donor checkout missing required file: {marker}")
    checked = subprocess.run(
        ["git", "-C", str(repo), "rev-parse", "HEAD"],
        capture_output=True, text=True, timeout=8, check=True
    ).stdout.strip()
    if checked != sha:
        raise ValueError(f"Donor checkout is not the pinned revision {sha}. Found {checked}.")
    return repo


def compile_native_revival(repo: Path, choice: str) -> dict:
    if choice not in {"default", "elohim"}:
        raise ValueError("Only default and elohim declared Revival variants are allowed.")
    specimen = repo / "specimens" / "genesis-1-1-linguistic.json"
    cmd = [sys.executable, "-m", "revival", str(specimen), "--recipe", "reader-demo"]
    if choice == "elohim":
        cmd += ["--profile", str(repo / "profiles" / "genesis-1-1-elohim.json")]
    env = dict(os.environ)
    env["PYTHONPATH"] = str(repo / "src")
    run = subprocess.run(cmd, cwd=repo, env=env, capture_output=True, text=True, timeout=20)
    if run.returncode:
        raise RuntimeError("Pinned native Revival CLI failed; see local error: " + run.stderr[:250])
    doc = json.loads(run.stdout)
    receipt = doc["receipt"]
    for section, key in (("witness", "witness_sha256"),
                         ("projection", "projection_sha256"),
                         ("delta", "delta_sha256")):
        if sha_json(doc[section]) != receipt[key]:
            raise RuntimeError("Native Revival receipt hash did not verify: " + section)
    text = doc["projection"]["content"]["text"]
    if (doc["witness"].get("locator") != "Gen.1.1"
        or doc["recipe"].get("id") != "reader-demo"
        or not isinstance(text, str) or not text or len(text) > 1000):
        raise RuntimeError("Unexpected native Revival projection.")
    return {
        "kind": "revival.native.projection/v1",
        "repo": "the-static-collective/revival",
        "commit": REVIVAL_SHA,
        "specimenSha256": sha_bytes(specimen.read_bytes()),
        "choice": choice,
        "compiledText": text,
        "nativeResult": doc,
        "attribution": "Revival demo-projection-only; not asserted as preferred or authoritative translation",
    }


def execute_native_ghot(repo: Path, text: str, private_home: Path) -> dict:
    # Import the *existing* independent-donor bridge, do not counterfeit a receipt.
    sys.path.insert(0, str(CIRCUIT))
    from ghot_local_server import execute_native_hash
    return execute_native_hash(repo, private_home, text)


def build(args: argparse.Namespace) -> None:
    revival = pinned_checkout(Path(args.revival), REVIVAL_SHA, "src/revival/__main__.py")
    ghot = pinned_checkout(Path(args.ghot), GHOT_SHA, "ghot/reference_node.py")
    native = compile_native_revival(revival, args.choice)
    with tempfile.TemporaryDirectory(prefix="circuit004-ghot-") as private_dir:
        ghot_proof = execute_native_ghot(ghot, native["compiledText"], Path(private_dir))
        evidence_input = {
            "schema": "abundent.revival.native-donors/v1",
            "revival": native,
            "ghot": ghot_proof,
            "ghotCommit": GHOT_SHA,
            "fictionalDemo": True,
            "humanObservation": False,
        }
        proc = subprocess.run(
            ["node", str(HERE / "commons_circuit.mjs"), "--compose", str(Path(args.output).resolve())],
            input=json.dumps(evidence_input, ensure_ascii=False),
            text=True, capture_output=True, timeout=25
        )
        if proc.returncode:
            raise RuntimeError("Circuit model rejected native donor evidence: " + proc.stderr[:2000])
    print(proc.stdout.strip())


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--revival", help="Path to pinned, separate Revival checkout")
    parser.add_argument("--ghot", help="Path to pinned, separate GHoT checkout")
    parser.add_argument("--choice", choices=("default", "elohim"), default="default")
    parser.add_argument("--output", default="circuit-004-proof.json")
    parser.add_argument("--verify", help="Verify an existing proof locally (no donors needed)")
    args = parser.parse_args()
    if args.verify:
        process = subprocess.run(["node", str(HERE / "commons_circuit.mjs"), "--verify",
                                  str(Path(args.verify).resolve())], check=False)
        return process.returncode
    if not args.revival or not args.ghot:
        parser.error("--revival and --ghot are both required for native composition")
    build(args)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (RuntimeError, ValueError, subprocess.SubprocessError) as error:
        print("Circuit 004 refused: " + str(error), file=sys.stderr)
        raise SystemExit(1)
