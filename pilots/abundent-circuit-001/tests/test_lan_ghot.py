"""Circuit 003: two independent Python servers, paired HMAC, actual native donor in CI.

Local fixture is explicitly NOT GHoT; CI sets GHOT_REPO to an independent,
pinned actual GHoT checkout and checks persisted gh​ot.task / gh​ot.receipt.
"""
from __future__ import annotations

import hashlib
import json
import os
import secrets
import sys
import tempfile
import threading
import unittest
from functools import partial
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

HERE=Path(__file__).resolve().parent
APP=HERE.parent
sys.path.insert(0,str(APP))
from ghot_lan_worker import WorkerHandler, WorkerServer  # noqa
from ghot_lan_protocol import (auth_mac, key_from_string, post_signed, private_peer_url, response_mac)
from ghot_local_server import Handler, checked_ghot_directory  # noqa


class TwoProcesses(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory(prefix='abundent-peer-test-')
        self.root=Path(self.tmp.name)
        self.repo=checked_ghot_directory(os.environ.get('GHOT_REPO') or HERE/'fixtures'/'fake_ghot')
        self.secret=secrets.token_hex(32)
        self.remote=WorkerServer(('127.0.0.1',0),WorkerHandler,self.repo,self.root/'ghot-worker',self.secret)
        self.remote_url=f'http://127.0.0.1:{self.remote.server_port}'
        self.local=ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,directory=str(APP)))
        self.local.ghot_repo=self.repo
        self.local.ghot_home=self.root/'ghot-local'
        self.local.peer_lock=threading.Lock()
        self.local.peer_binding=None
        self.local_url=f'http://127.0.0.1:{self.local.server_port}'
        self.threads=[]
        for srv in (self.remote,self.local):
            thread=threading.Thread(target=srv.serve_forever,daemon=True)
            thread.start()
            self.threads.append(thread)

    def tearDown(self):
        for srv,thread in zip((self.remote,self.local),self.threads):
            srv.shutdown();srv.server_close();thread.join(timeout=4)
        self.tmp.cleanup()

    def post(self,path,body):
        data=json.dumps(body).encode()
        req=Request(self.local_url+path,data,{'Content-Type':'application/json','Origin':self.local_url},method='POST')
        try:
            with urlopen(req,timeout=30) as rsp:
                return rsp.status,json.loads(rsp.read())
        except HTTPError as e:
            return e.code,json.loads(e.read())

    def pair(self):
        code,reply=self.post('/api/ghot/peer/pair',{'url':self.remote_url,'key':self.secret})
        self.assertEqual(code,200,reply)
        self.assertTrue(reply['paired'])
        self.assertEqual(reply['workerNodeId'],self.remote.identity['nodeId'])
        self.assertTrue(reply['loopbackTest'])
        return reply

    def test_real_native_remote_hash_and_separate_donor_state(self):
        self.pair()
        code,res=self.post('/api/ghot/peer/hash',{'text':'TWO HARBORS · ONE REAL GHoT TASK'})
        self.assertEqual(code,200,res)
        self.assertTrue(res['bridgeVerified'])
        self.assertEqual(res['transport'],'lan_hmac_v1')
        self.assertEqual(res['workerNodeId'],self.remote.identity['nodeId'])
        self.assertEqual(res['receipt']['executor_node_id'],self.remote.identity['nodeId'])
        self.assertEqual(res['receipt']['output']['sha256'],hashlib.sha256('TWO HARBORS · ONE REAL GHoT TASK'.encode()).hexdigest())
        self.assertFalse(list((self.local.ghot_home/'records').glob('*')) if (self.local.ghot_home/'records').exists() else False)
        record_files=list((self.remote.home/'records').glob('*.json'))
        self.assertTrue(record_files)
        records=[json.loads(p.read_text()) for p in record_files]
        self.assertTrue(any(r.get('kind')=='ghot.receipt' and r.get('receipt_id')==res['receipt']['receipt_id'] for r in records))
        self.assertTrue(any(r.get('kind')=='ghot.task' for r in records))

    def test_sender_refuses_unpaired_task_and_origin_protection(self):
        code,res=self.post('/api/ghot/peer/hash',{'text':'Please do not execute'})
        self.assertEqual(code,400,res)
        data=b'{}'
        req=Request(self.local_url+'/api/ghot/peer/unpair',data,{'Content-Type':'application/json'},method='POST')
        with self.assertRaises(HTTPError) as err:
            urlopen(req)
        self.assertEqual(err.exception.code,403)

    def test_no_secret_wire_replay_or_unsigned_tasks(self):
        path='/v1/pair'; body=b'{"purpose":"pair-native-ghot"}'; ts=str(int(__import__('time').time()));nonce=secrets.token_hex(16)
        mac=auth_mac(key_from_string(self.secret),'POST',path,ts,nonce,body)
        headers={'Content-Type':'application/json','X-Circuit-Timestamp':ts,'X-Circuit-Nonce':nonce,'X-Circuit-Mac':mac}
        req=lambda: Request(self.remote_url+path,body,headers,method='POST')
        with urlopen(req(),timeout=8) as r:
            response=r.read()
            self.assertEqual(r.headers.get('X-Circuit-Response-Mac'),response_mac(key_from_string(self.secret),path,nonce,response))
        with self.assertRaises(HTTPError) as e:
            urlopen(req(),timeout=8)
        self.assertEqual(e.exception.code,403)
        with self.assertRaises(HTTPError) as e:
            urlopen(Request(self.remote_url+path,body,{'Content-Type':'application/json'},method='POST'),timeout=8)
        self.assertEqual(e.exception.code,403)
        self.assertNotIn(bytes.fromhex(self.secret),response)

    def test_wrong_key_and_unavailable_capability(self):
        with self.assertRaises(RuntimeError):
            post_signed(self.remote_url,bytes.fromhex('a'*64),'/v1/pair',{'purpose':'pair-native-ghot'})
        self.pair()
        code,_=self.post('/api/ghot/peer/hash',{'capability':'shell','text':'echo no'})
        self.assertEqual(code,400)
        code,_=self.post('/api/ghot/peer/hash',{'text':'X'*1001})
        self.assertEqual(code,400)
        code,_=self.post('/api/ghot/peer/hash',{'text':'abc\x00'})
        self.assertEqual(code,400)
        code,_=self.post('/api/ghot/peer/hash',{'text':'one safe request'})
        self.assertEqual(code,200)
        self.assertEqual(set(x.name for x in (self.remote.home/'records').glob('*.json')) != set(), True)

    def test_unpair_removes_in_memory_permission(self):
        self.pair()
        code,response=self.post('/api/ghot/peer/unpair',{})
        self.assertEqual(code,200);self.assertEqual(response['paired'],False)
        code,response=self.post('/api/ghot/peer/hash',{'text':'after unpair'})
        self.assertEqual(code,400)
        self.assertIsNone(self.local.peer_binding)

    def test_ssrf_refuses_dns_public_or_credentials(self):
        for url in ('http://example.com:7789','http://8.8.8.8:7789','http://10.0.0.4:22',
                    'https://192.168.0.2:7789','http://alice:pwd@192.168.0.2:7789',
                    'http://192.168.0.2:7789/admin','http://192.168.0.2:7789?x=1'):
            with self.subTest(url=url),self.assertRaises(ValueError):
                private_peer_url(url)
        self.assertEqual(private_peer_url('http://192.168.1.2:7789'),'http://192.168.1.2:7789')


if __name__=='__main__':unittest.main()
