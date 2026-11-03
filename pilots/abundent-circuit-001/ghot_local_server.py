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
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
from ghot_lan_protocol import key_from_string, post_signed, private_peer_url
from minecraft_foundry import VanillaRcon, blueprint, observe as observe_minecraft, stage as stage_minecraft, celebrate as celebrate_minecraft, witness_text, RconError


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
    env.pop('ABUNDENT_MC_RCON_PASSWORD', None)
    env.pop('ABUNDENT_MC_WORLD_AUTHORIZATION', None)
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

    def _peer_status(self) -> dict:
        binding = getattr(self.server, 'peer_binding', None)
        if binding is None:
            return {'paired': False, 'capability': 'system.hash', 'scope': 'LAN_MANUAL_PAIRING_ONLY'}
        return {'paired': True, 'workerNodeId': binding['workerNodeId'],
                'workerParticular': binding['workerParticular'],
                'url': binding['url'], 'capability': 'system.hash',
                'scope': 'LAN_HMAC_INTEGRITY_ONLY', 'loopbackTest': binding['loopbackTest']}

    def _peer_action(self, action: str, body: dict) -> dict:
        # The local browser talks only to *its own* 127.0.0.1 bridge. The
        # operator voluntarily pairs this bridge to one trusted LAN worker.
        if action == 'pair':
            if set(body) != {'url', 'key'}:
                raise ValueError('A private worker IP and pairing key are required.')
            url = private_peer_url(body['url'])
            key = key_from_string(body['key'])
            result = post_signed(url, key, '/v1/pair', {'purpose': 'pair-native-ghot'})
            wid = result.get('workerNodeId')
            if (result.get('schema') != 'abundent.ghot.worker/v1' or
                result.get('capability') != 'system.hash' or
                not isinstance(wid, str) or not wid.startswith('node-') or len(wid) > 120):
                raise RuntimeError('Worker did not return a valid native GHoT identity.')
            bind = {'url': url, 'key': key, 'workerNodeId': wid,
                    'workerParticular': result.get('workerParticular'),
                    'loopbackTest': url.startswith('http://127.')}
            with self.server.peer_lock:
                self.server.peer_binding = bind
            return self._peer_status()
        if action == 'unpair':
            if body != {}:
                raise ValueError('Unpair accepts no other fields.')
            with self.server.peer_lock:
                self.server.peer_binding = None
            return self._peer_status()
        if action != 'hash' or set(body) != {'text'}:
            raise ValueError('Only system.hash is offered to the remote worker.')
        text = body['text']
        if (not isinstance(text, str) or not text.strip() or len(text) > MAX_INPUT or
            any(ord(ch) < 32 and ch not in '\n\r\t' for ch in text)):
            raise ValueError('Only 1–1000 characters of non-sensitive test text are allowed.')
        with self.server.peer_lock:
            binding = self.server.peer_binding
        if binding is None:
            raise ValueError('Pair a remote worker before requesting a task.')
        result = post_signed(binding['url'], binding['key'], '/v1/hash', {'text': text}, timeout=25)
        receipt = result.get('receipt') or {}
        expected = hashlib.sha256(text.encode('utf-8')).hexdigest()
        expected_output_digest = hashlib.sha256(json.dumps({'sha256': expected}, sort_keys=True, separators=(',', ':')).encode('utf-8')).hexdigest()
        valid = (result.get('schema') == 'abundent.ghot.execution/v1' and
                 result.get('capability') == 'system.hash' and
                 result.get('workerNodeId') == binding['workerNodeId'] and
                 receipt.get('kind') == 'ghot.receipt' and receipt.get('version') == '0' and
                 receipt.get('capability') == 'system.hash' and receipt.get('status') == 'ok' and
                 receipt.get('executor_node_id') == binding['workerNodeId'] and
                 isinstance(receipt.get('receipt_id'), str) and receipt['receipt_id'].startswith('receipt-') and
                 isinstance(receipt.get('task_id'), str) and receipt['task_id'].startswith('task-') and
                 receipt.get('output') == {'sha256': expected} and
                 receipt.get('output_sha256') == expected_output_digest)
        if not valid:
            raise RuntimeError('Remote donor receipt, executor, or input digest failed validation.')
        with self.server.peer_lock:
            if binding is not self.server.peer_binding:
                raise RuntimeError('Peer was changed while task was in progress.')
        return {'nativeGHoT': True, 'bridgeVerified': True, 'transport': 'lan_hmac_v1',
                'workerNodeId': binding['workerNodeId'],
                'loopbackTest': binding['loopbackTest'], 'receipt': receipt,
                'nonclaims': ['HMAC pairing does not prove physical machine identity',
                              'No distributed scheduler involved', 'No human witnessed work']}

    def _mc_state(self):
        plan = getattr(self.server, 'minecraft_plan', blueprint())
        enabled = bool(getattr(self.server, 'minecraft_enabled', False))
        return {'enabled':enabled, 'schema':'abundent.minecraft.bridge/v0',
                'game':'Minecraft Java vanilla (RCON)', 'operator':'loopback only',
                'origin':plan['origin'], 'plan_digest':hashlib.sha256(json.dumps(plan,sort_keys=True,separators=(',',':')).encode()).hexdigest(),
                'limits':['Dedicated empty rehearsal world only','No player identity proofs',
                          'No Full Measure Deed, money, permits, land, or remote actuation']}

    def _minecraft_action(self, action: str, body: dict) -> dict:
        if not getattr(self.server, 'minecraft_enabled', False):
            raise ValueError('Minecraft rehearsal was not explicitly enabled at local startup.')
        plan = self.server.minecraft_plan
        if action == 'stage' and body != {'confirm':'I AUTHORIZE TEST WORLD STAGING'}:
            raise ValueError('Explicit rehearsal-world stage confirmation required.')
        if action == 'celebrate' and body != {'confirm':'I AUTHORIZE GAME CELEBRATION'}:
            raise ValueError('Explicit in-game celebration confirmation required.')
        if action == 'observe' and body != {}:
            raise ValueError('Observation accepts no external arguments.')
        if action not in ('stage', 'observe','celebrate'):
            raise ValueError('Unrecognized Minecraft action.')
        # Serializes RCON action and readback; never uses browser-selected
        # addresses, coordinates, block identifiers, console commands, or paths.
        with self.server.minecraft_lock:
            with VanillaRcon(self.server.minecraft_rcon_password,port=self.server.minecraft_rcon_port) as conn:
                if action == 'stage':
                    result = stage_minecraft(conn.command,plan,authorized=True)
                    result['readback'] = observe_minecraft(conn.command,plan)
                    return result
                if action == 'observe':
                    observed = observe_minecraft(conn.command,plan)
                else:
                    observed = celebrate_minecraft(conn.command,plan,authorized=True)
            # Native GHoT is a *separate executable donor* that records one
            # hash task and a bounded checked receipt. Its hash is NOT a human
            # witness, cryptographic Minecraft signature, or social admission.
            payload = witness_text(observed)
            donor = execute_native_hash(self.server.ghot_repo,self.server.ghot_home,payload)
            return {'schema':'abundent.minecraft.ghot-return/v0', 'game':observed,
                    'nativeGHoT':donor, 'payload':payload,
                    'witnessClass':'same local RCON operator + independently executed GHoT hash',
                    'socialEffect':'NONE', 'receiverDisposition':'HOLD'}

    def do_GET(self) -> None:
        if not self._allow_host():
            return self._json(403, {'error': 'Invalid host.'})
        if urlsplit(self.path).path == '/api/minecraft/status':
            return self._json(200,self._mc_state())
        if urlsplit(self.path).path == '/api/minecraft/plan':
            return self._json(200,getattr(self.server,'minecraft_plan',blueprint()))
        if urlsplit(self.path).path == '/api/ghot/peer/status':
            return self._json(200, self._peer_status())
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
        allowed_routes = {'/api/ghot/hash': 'local', '/api/ghot/peer/pair': 'pair',
                          '/api/ghot/peer/hash': 'hash', '/api/ghot/peer/unpair': 'unpair',
                          '/api/minecraft/stage':'mc:stage', '/api/minecraft/observe':'mc:observe',
                          '/api/minecraft/celebrate':'mc:celebrate'}
        if self.path not in allowed_routes:
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
            if not isinstance(body, dict):
                raise ValueError('Expected a single JSON object.')
            if allowed_routes[self.path].startswith('mc:'):
                result = self._minecraft_action(allowed_routes[self.path][3:], body)
            elif allowed_routes[self.path] == 'local':
                if set(body) != {'text'}:
                    raise ValueError('Only the text field is accepted.')
                result = execute_native_hash(self.server.ghot_repo, self.server.ghot_home, body['text'])
            else:
                result = self._peer_action(allowed_routes[self.path], body)
        except (ValueError, PermissionError, RconError, UnicodeDecodeError, json.JSONDecodeError) as exc:
            return self._json(400, {'error': str(exc)[:150]})
        except Exception:
            self.log_error('Native GHoT peer/task failed; inspect the LOCAL operator terminal')
            return self._json(502, {'error': 'Native GHoT peer or receipt check failed. Check the local worker, IP, pairing, and clocks.'})
        return self._json(200, result)

    def log_message(self, fmt: str, *args) -> None:
        # Do not log the submitted text or request body.
        super().log_message(fmt, *args)


def serve(repo: Path, *, port: int = 8878, home: Path | None = None,
          mc_enabled: bool = False, mc_rcon_port: int = 25575, mc_origin: tuple = (0,70,0)) -> None:
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
    server.peer_lock = threading.Lock()
    server.peer_binding = None  # ephemeral, never written to disk
    server.minecraft_enabled = bool(mc_enabled)
    server.minecraft_plan = blueprint(*mc_origin)
    server.minecraft_lock = threading.Lock()
    server.minecraft_rcon_port = mc_rcon_port
    server.minecraft_rcon_password = os.environ.get('ABUNDENT_MC_RCON_PASSWORD','') if mc_enabled else ''
    if mc_enabled and (os.environ.get('ABUNDENT_MC_WORLD_AUTHORIZATION') != 'EMPTY_TEST_WORLD' or
                       not server.minecraft_rcon_password):
        server.server_close()
        raise ValueError('Minecraft requires ABUNDENT_MC_WORLD_AUTHORIZATION=EMPTY_TEST_WORLD and nonempty private RCON password.')
    print('Abundent Circuit 002 + native GHoT (local only)')
    print('Open: http://127.0.0.1:%d/' % port)
    print('Donor:', str(server.ghot_repo))
    print('GHoT receipts stay in:', str(home))
    print('This local bridge is loopback-only. A separate optional LAN worker may be paired from the browser.')
    print('Minecraft native world:', 'ENABLED on explicit empty demo world' if mc_enabled else 'DISABLED (safe default)')
    print('Press Ctrl+C to stop; this bridge never opens a public listener.')
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
    parser.add_argument('--minecraft-empty-demo-world', action='store_true',
                        help='Enable RCON only after explicitly authorizing your own dedicated empty Java test world')
    parser.add_argument('--minecraft-rcon-port', type=int, default=25575)
    parser.add_argument('--minecraft-origin-x', type=int, default=0)
    parser.add_argument('--minecraft-origin-y', type=int, default=70)
    parser.add_argument('--minecraft-origin-z', type=int, default=0)
    args = parser.parse_args()
    serve(checked_ghot_directory(args.ghot), port=args.port,
          home=Path(args.ghot_home) if args.ghot_home else None,
          mc_enabled=args.minecraft_empty_demo_world, mc_rcon_port=args.minecraft_rcon_port,
          mc_origin=(args.minecraft_origin_x,args.minecraft_origin_y,args.minecraft_origin_z))
    return 0


if __name__ == '__main__':
    raise SystemExit(cli())
