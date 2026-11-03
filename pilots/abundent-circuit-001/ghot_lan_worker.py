#!/usr/bin/env python3
"""Circuit 003 worker: an opt-in remote GHoT system.hash executor on a trusted LAN.

Runs the *native* independent GHoT reference_node.py; never exposes a shell,
filesystem writes, general executor selection, or the native GHoT LAN /task API.
Pre-shared 256-bit secret is printed for explicit out-of-band pairing; requests
and responses are HMAC-authenticated with nonce+timestamp and replay refusal.
Transport is plain HTTP: do not send sensitive text on a shared/untrusted Wi-Fi.
"""
from __future__ import annotations

import argparse
import json
import secrets
import subprocess
import sys
import threading
import time
from functools import partial
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from ghot_lan_protocol import (MAX_PAYLOAD, digest, key_from_string, make_key,
                                response_mac, validate_request)
from ghot_local_server import checked_ghot_directory, execute_native_hash


def native_identity(repo: Path, home: Path) -> dict:
    home.mkdir(parents=True, exist_ok=True, mode=0o700)
    import os
    env = dict(os.environ, GHOT_HOME=str(home.resolve()))
    run = subprocess.run([sys.executable, str(repo / 'ghot' / 'reference_node.py'), 'probe'],
                         cwd=str(repo), env=env, capture_output=True, text=True, timeout=20)
    if run.returncode:
        raise RuntimeError('Native GHoT probe failed. Verify the GHoT checkout and Python environment.')
    probe = json.loads(run.stdout)
    if probe.get('kind') != 'ghot.body' or not isinstance(probe.get('node_id'), str):
        raise RuntimeError('Native GHoT probe did not return an actual GHoT body identity.')
    return {'nodeId': probe['node_id'], 'particular': (probe.get('identity') or {}).get('particular')}


class WorkerServer(ThreadingHTTPServer):
    daemon_threads = True
    def __init__(self, address, handler, repo: Path, home: Path, secret_hex: str):
        super().__init__(address, handler)
        self.repo = checked_ghot_directory(repo)
        self.home = home
        self.key = key_from_string(secret_hex)
        self.identity = native_identity(self.repo, self.home)
        self.nonces: dict[str, float] = {}
        self.nonce_lock = threading.Lock()

    def check_replay(self, nonce: str):
        with self.nonce_lock:
            stamp = time.monotonic()
            self.nonces = {k: v for k, v in self.nonces.items() if stamp - v < 300}
            if nonce in self.nonces:
                raise ValueError('Replay rejected.')
            self.nonces[nonce] = stamp


class WorkerHandler(BaseHTTPRequestHandler):
    server_version = 'AbundentRemoteHashWorker/003'

    def _reply(self, code: int, value: dict, *, path: str = '', nonce: str = ''):
        data = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Content-Length', str(len(data)))
        if path and nonce and code == 200:
            self.send_header('X-Circuit-Response-Mac', response_mac(self.server.key, path, nonce, data))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if self.path == '/health':
            self._reply(200, {'service': 'circuit.remote.hash/v1', 'state': 'awake',
                               'warning': 'Private, user-authorized LAN only; no sensitive tasks.'})
        else:
            self._reply(404, {'error': 'No general worker API.'})

    def do_POST(self):
        if self.path not in ('/v1/pair', '/v1/hash'):
            return self._reply(404, {'error': 'Capability refused.'})
        if self.headers.get('Content-Type', '').split(';', 1)[0].strip() != 'application/json':
            return self._reply(415, {'error': 'JSON only.'})
        try:
            n = int(self.headers.get('Content-Length', '0'))
            if not (1 <= n <= MAX_PAYLOAD):
                return self._reply(413, {'error': 'Request size refused.'})
            body = self.rfile.read(n)
            nonce = validate_request(self.server.key, 'POST', self.path, self.headers, body)
            self.server.check_replay(nonce)
            data = json.loads(body)
            if self.path == '/v1/pair':
                if not isinstance(data, dict) or data != {'purpose': 'pair-native-ghot'}:
                    raise ValueError('Only explicit pair is supported.')
                response = {'schema': 'abundent.ghot.worker/v1', 'requestNonce': nonce,
                            'workerNodeId': self.server.identity['nodeId'],
                            'workerParticular': self.server.identity['particular'],
                            'capability': 'system.hash', 'admission': 'REVIEW_ONLY'}
            else:
                if not isinstance(data, dict) or set(data) != {'text'}:
                    raise ValueError('system.hash text only.')
                receipt = execute_native_hash(self.server.repo, self.server.home, data['text'])['receipt']
                if receipt['executor_node_id'] != self.server.identity['nodeId']:
                    raise RuntimeError('Donor identity changed unexpectedly; task not accepted.')
                response = {'schema': 'abundent.ghot.execution/v1', 'requestNonce': nonce,
                            'workerNodeId': self.server.identity['nodeId'],
                            'receipt': receipt, 'capability': 'system.hash',
                            'scope': 'non-sensitive_text_only'}
            return self._reply(200, response, path=self.path, nonce=nonce)
        except (ValueError, UnicodeError, json.JSONDecodeError):
            return self._reply(403, {'error': 'Malformed or unauthenticated request.'})
        except Exception:
            self.log_error('Native donor operation failed; see local donor records.')
            return self._reply(502, {'error': 'Native GHoT donor execution failed.'})

    def log_message(self, message: str, *args):
        # Never print secret, payload or HMAC headers; addresses and paths only.
        print('[worker] ' + message % args, file=sys.stderr)


def serve(repo: Path, home: Path, *, port: int, allow_lan: bool, pairing_code: str | None = None):
    if not 1024 <= port <= 65535:
        raise ValueError('Port outside safe supported range.')
    secret = pairing_code or make_key()
    bind = '0.0.0.0' if allow_lan else '127.0.0.1'
    with WorkerServer((bind, port), WorkerHandler, repo, home, secret) as server:
        print('\nCIRCUIT 003 — Native GHoT Worker\n', flush=True)
        print('DONOR GHoT node:', server.identity['nodeId'], flush=True)
        print('Worker mode:', 'LAN / intentionally exposed' if allow_lan else 'LOCAL TEST ONLY', flush=True)
        print('Pairing key (copy to YOUR Abundent localhost app; never post publicly):', flush=True)
        print(secret, flush=True)
        print('Worker port:', port, flush=True)
        print('Only system.hash is accepted. No general remote shell or file API.', flush=True)
        print('Trust your Wi-Fi and send TEST TEXT ONLY. Press Ctrl+C to stop.\n', flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


def cli():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--ghot', required=True)
    parser.add_argument('--ghot-home', default=str(Path.home() / '.abundent-circuit' / 'ghot-worker'))
    parser.add_argument('--port', type=int, default=7789)
    parser.add_argument('--allow-lan', action='store_true', help='Explicitly bind the worker on all network interfaces')
    opts = parser.parse_args()
    serve(checked_ghot_directory(opts.ghot), Path(opts.ghot_home).expanduser().resolve(),
          port=opts.port, allow_lan=opts.allow_lan)


if __name__ == '__main__':
    cli()
