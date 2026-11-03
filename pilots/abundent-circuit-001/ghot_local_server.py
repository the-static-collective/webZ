#!/usr/bin/env python3
"""Abundent Circuit -> actual GHoT reference_node.py, on loopback only.

No remote execution, no shell, no CORS, no arbitrary capabilities, no credentials.
GHoT independently owns and persists its native gh​ot.task/ghot.receipt records.

Usage: python3 ghot_local_server.py --ghot /path/to/GHoT --port 8878
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

APP_DIR = Path(__file__).resolve().parent
HASH_RE = re.compile(r"^[0-9a-f]{64}$")
MAX_BODY = 2300
MAX_INPUT = 1000


def checked_ghot_directory(value: str | Path) -> Path:
    repo = Path(value).expanduser().resolve()
    entrypoint = repo / 'ghot' / 'reference_node.py'
    if not entrypoint.is_file() or not (repo / 'ghot' / 'executor_pantry.py').is_file():
        raise ValueError('A GHoT repository checkout is required (ghot/reference_node.py missing).')
    return repo


def execute_native_hash(repo: Path, ghot_home: Path, text: str) -> dict:
    """Call the original donor runtime, not a reimplementation."""
    if not isinstance(text, str) or not text.strip() or len(text) > MAX_INPUT:
        raise ValueError('Text must be 1–1000 characters.')
    if any(ord(ch) < 32 and ch not in ('\n', '\r', '\t') for ch in text):
        raise ValueError('Control characters refused.')
    ghot_home.mkdir(parents=True, exist_ok=True, mode=0o700)
    env = dict(os.environ)
    env['GHOT_HOME'] = str(ghot_home.resolve())
    try:
        completed = subprocess.run(
            [sys.executable, str(repo / 'ghot' / 'reference_node.py'), 'hash', text],
            cwd=str(repo), env=env, capture_output=True, text=True, timeout=15,
            check=False,
        )
    except subprocess.TimeoutExpired as exc:
        raise RuntimeError('GHoT native task timed out.') from exc
    if completed.returncode != 0:
        raise RuntimeError('Native GHoT task failed; check the local operator terminal.')
    try:
        receipt = json.loads(completed.stdout)
    except (ValueError, TypeError) as exc:
        raise RuntimeError('GHoT did not return a valid native JSON receipt.') from exc
    expected = hashlib.sha256(text.encode('utf-8')).hexdigest()
    valid = (isinstance(receipt, dict) and receipt.get('kind') == 'ghot.receipt'
             and receipt.get('version') == '0'
             and receipt.get('capability') == 'system.hash'
             and receipt.get('status') == 'ok'
             and isinstance(receipt.get('receipt_id'), str)
             and receipt['receipt_id'].startswith('receipt-')
             and isinstance(receipt.get('task_id'), str)
             and receipt['task_id'].startswith('task-')
             and isinstance(receipt.get('executor_node_id'), str)
             and receipt.get('output') == {'sha256': expected}
             and isinstance(receipt.get('output_sha256'), str)
             and bool(HASH_RE.fullmatch(receipt.get('output_sha256'))))
    if not valid:
        raise RuntimeError('Native GHoT receipt failed the local bridge checks.')
    # Native records under GHOT_HOME/records remain owned by GHoT and are not
    # transmitted to the hosted demo. This is a checked, unsigned receipt.
    return {
        'nativeGHoT': True,
        'source': 'GHoT/ghot/reference_node.py',
        'transport': 'loopback_only',
        'receipt': {k: receipt[k] for k in (
            'kind', 'version', 'receipt_id', 'task_id', 'executor_node_id',
            'capability', 'status', 'output', 'output_sha256', 'finished_at')},
    }


class Handler(SimpleHTTPRequestHandler):
    server_version = 'AbundentCircuitLocal/002'

    def __init__(self, *args, directory: str | None = None, **kwargs):
        super().__init__(*args, directory=directory, **kwargs)

    def _json(self, status: int, value: dict) -> None:
        b = json.dumps(value, separators=(',', ':'), ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Content-Length', str(len(b)))
        self.end_headers()
        self.wfile.write(b)

    def end_headers(self) -> None:
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Referrer-Policy', 'no-referrer')
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def _allow_host(self) -> bool:
        # DNS rebinding mitigation: refuse unknown Host values even on loopback.
        host = self.headers.get('Host', '')
        expected = {'127.0.0.1:' + str(self.server.server_port),
                    'localhost:' + str(self.server.server_port)}
        return host in expected

    def do_GET(self) -> None:
        if not self._allow_host():
            return self._json(403, {'error': 'Invalid host.'})
        if urlsplit(self.path).path == '/api/ghot/status':
            return self._json(200, {'nativeGHoT': True,
                                    'source': 'GHoT/ghot/reference_node.py',
                                    'transport': 'loopback_only',
                                    'capabilities': ['system.hash'],
                                    'state': 'donor_detected_not_yet_executed'})
        if urlsplit(self.path).path.startswith('/api/'):
            return self._json(404, {'error': 'Unknown API route.'})
        # index.html is an AUTHORING template; always serve the built single-file app.
        if urlsplit(self.path).path in ('/', '/index.html'):
            self.path = '/Abundent_Circuit_001_Offline.html'
        return super().do_GET()

    def do_POST(self) -> None:
        if not self._allow_host():
            return self._json(403, {'error': 'Invalid host.'})
        if self.path != '/api/ghot/hash':
            return self._json(404, {'error': 'Unknown API route.'})
        # Browsers visiting a malicious remote site cannot issue an effective
        # cross-origin POST; no CORS, exact same-origin and application/json.
        origin = self.headers.get('Origin', '')
        if origin not in {
            'http://127.0.0.1:' + str(self.server.server_port),
            'http://localhost:' + str(self.server.server_port),
        }:
            return self._json(403, {'error': 'Same-origin browser request required.'})
        if self.headers.get('Content-Type', '').split(';')[0].strip() != 'application/json':
            return self._json(415, {'error': 'JSON requests only.'})
        try:
            length = int(self.headers.get('Content-Length', '-1'))
        except ValueError:
            length = -1
        if length < 2 or length > MAX_BODY:
            return self._json(413, {'error': 'Request body limit exceeded.'})
        try:
            body = json.loads(self.rfile.read(length).decode('utf-8'))
            if not isinstance(body, dict) or set(body) != {'text'}:
                raise ValueError('Only the text field is accepted.')
            result = execute_native_hash(self.server.ghot_repo, self.server.ghot_home, body['text'])
        except (ValueError, UnicodeDecodeError, json.JSONDecodeError) as exc:
            return self._json(400, {'error': str(exc)[:150]})
        except Exception:
            self.log_error('Native GHoT task failed; inspect GHoT HOME records / local operator logs')
            return self._json(502, {'error': 'Native GHoT execution failed or receipt was rejected.'})
        return self._json(200, result)

    def log_message(self, fmt: str, *args) -> None:
        # Do not log the submitted text or request body.
        super().log_message(fmt, *args)


def serve(repo: Path, *, port: int = 8878, home: Path | None = None) -> None:
    if port < 1024 or port > 65535:
        raise ValueError('Port must be between 1024 and 65535.')
    if home is None:
        home = Path.home() / '.abundent-circuit' / 'ghot-home'
    home = home.expanduser().resolve()
    # Never serve GHoT's private records as static files.
    if home == APP_DIR or APP_DIR in home.parents:
        raise ValueError('GHoT private state must be outside the served app folder.')
    server = ThreadingHTTPServer(('127.0.0.1', port), partial(Handler, directory=str(APP_DIR)))
    server.ghot_repo = checked_ghot_directory(repo)
    server.ghot_home = home
    print('Abundent Circuit 002 + native GHoT (local only)')
    print('Open: http://127.0.0.1:%d/' % port)
    print('Donor:', str(server.ghot_repo))
    print('GHoT receipts stay in:', str(home))
    print('Press Ctrl+C to stop; no LAN / internet listener is opened.')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


def cli() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--ghot', required=True, help='Path to existing checkout of the GHoT repository')
    parser.add_argument('--port', type=int, default=8878)
    parser.add_argument('--ghot-home', help='Private location to store native GHoT records')
    args = parser.parse_args()
    serve(checked_ghot_directory(args.ghot), port=args.port,
          home=Path(args.ghot_home) if args.ghot_home else None)
    return 0


if __name__ == '__main__':
    raise SystemExit(cli())
