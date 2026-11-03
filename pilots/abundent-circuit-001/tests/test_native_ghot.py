"""Local bridge contract tests + optional native-GHoT end-to-end smoke.

Without GHOT_REPO, uses a source-path-shaped fixture ONLY for HTTP/security tests.
With GHOT_REPO (CI), tests the ACTUAL independent GHoT reference_node.py.
"""
from __future__ import annotations

import hashlib
import json
import os
import sys
import tempfile
import threading
import unittest
from functools import partial
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

HERE = Path(__file__).resolve().parent
APP = HERE.parent
sys.path.insert(0, str(APP))
from ghot_local_server import Handler, checked_ghot_directory, execute_native_hash  # noqa: E402


class Bridge(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix='abundent-native-ghot-')
        self.home = Path(self.tmp.name) / 'records-home'
        ghot = os.environ.get('GHOT_REPO') or str(HERE / 'fixtures' / 'fake_ghot')
        self.repo = checked_ghot_directory(ghot)
        self.server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Handler, directory=str(APP)))
        self.server.ghot_repo = self.repo
        self.server.ghot_home = self.home
        self.port = self.server.server_port
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.root = f'http://127.0.0.1:{self.port}'

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=3)
        self.tmp.cleanup()

    def request(self, route, value=None, *, origin=True, content_type='application/json', host=None):
        headers = {'Content-Type': content_type}
        if origin:
            headers['Origin'] = self.root
        if host:
            headers['Host'] = host
        data = json.dumps(value).encode('utf-8') if value is not None else None
        request = Request(self.root + route, data=data, headers=headers,
                          method='POST' if data is not None else 'GET')
        try:
            with urlopen(request, timeout=20) as response:
                return response.status, json.loads(response.read())
        except HTTPError as err:
            return err.code, json.loads(err.read())

    def test_status_only_local_capability(self):
        code, msg = self.request('/api/ghot/status')
        self.assertEqual(code, 200)
        self.assertEqual(msg['capabilities'], ['system.hash'])
        self.assertTrue(msg['nativeGHoT'])
        self.assertEqual(msg['state'], 'donor_detected_not_yet_executed')

    def test_actual_entrypoint_and_receipt(self):
        code, msg = self.request('/api/ghot/hash', {'text': 'ONE TABLE → ONE HARBOR'})
        self.assertEqual(code, 200, msg)
        self.assertEqual(msg['source'], 'GHoT/ghot/reference_node.py')
        self.assertTrue(msg['nativeGHoT'])
        rec = msg['receipt']
        self.assertEqual(rec['kind'], 'ghot.receipt')
        self.assertEqual(rec['capability'], 'system.hash')
        self.assertEqual(rec['output']['sha256'], hashlib.sha256('ONE TABLE → ONE HARBOR'.encode()).hexdigest())
        native_dir = self.home / 'records'
        self.assertTrue(list(native_dir.glob('*.json')), 'Native GHoT records must be persisted')
        # The real donor writes two records; the local fixture writes one.
        if os.environ.get('GHOT_REPO'):
            records = [json.loads(x.read_text()) for x in native_dir.glob('*.json')]
            self.assertIn('ghot.task', [r.get('kind') for r in records])
            self.assertIn('ghot.receipt', [r.get('kind') for r in records])
            self.assertTrue(any(r.get('receipt_id') == rec['receipt_id'] for r in records))

    def test_browser_origin_required_and_unknown_capability_refused(self):
        code, _ = self.request('/api/ghot/hash', {'text': 'hi'}, origin=False)
        self.assertEqual(code, 403)
        code, _ = self.request('/api/ghot/hash', {'text': 'hi'}, content_type='text/plain')
        self.assertEqual(code, 415)
        code, _ = self.request('/api/ghot/run', {'capability': 'shell.exec', 'input': 'ls'})
        self.assertEqual(code, 404)
        code, _ = self.request('/api/ghot/hash', {'text': 'a'*1001})
        self.assertEqual(code, 400)
        code, _ = self.request('/api/ghot/hash', {'text': 'hi', 'cmd': 'shell.exec'})
        self.assertEqual(code, 400)

    def test_static_app_serves_and_private_records_not_exposed(self):
        with urlopen(self.root + '/index.html', timeout=8) as res:
            page = res.read().decode()
        self.assertIn('Native GHoT', page)
        code, _ = self.request('/api/ghot/secret')
        self.assertEqual(code, 404)
        status, _ = self.request('/api/ghot/status', host='evil.example')
        self.assertEqual(status, 403)


if __name__ == '__main__':
    unittest.main()
