"""Circuit 004 / Minecraft game-world semantics and local HTTP consent gates.
These use a deterministic FakeRCON; separate GitHub CI MUST execute actual Mojang.
"""
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
from urllib.request import Request,urlopen

HERE=Path(__file__).resolve().parent
APP=HERE.parent
sys.path.insert(0,str(APP))
from minecraft_foundry import blueprint,stage,observe,celebrate,witness_text,RconError,VanillaRcon
from ghot_local_server import Handler,checked_ghot_directory


class FakeMinecraft:
    """Not a real Minecraft runtime. Explicit fake, for fail-closed tests."""
    def __init__(self):
        self.blocks={}
        self.calls=[]
        self.fault=None
    def get(self, xyz):return self.blocks.get(tuple(xyz),'minecraft:air')
    def command(self, text):
        self.calls.append(text)
        t=text.split()
        if text.startswith('forceload '):return 'done'
        if text.startswith('execute if block '):
            xyz=tuple(map(int,t[3:6]));want=t[6]
            actual=self.get(xyz)
            match=(actual==want or (want=='minecraft:redstone_lamp' and actual.startswith('minecraft:redstone_lamp')))
            return 'Seed: [381654729]' if match else 'Test failed'
        if text.startswith('setblock '):
            xyz=tuple(map(int,t[1:4]));want=t[4]
            self.blocks[xyz]='minecraft:redstone_lamp[lit=false]' if want == 'minecraft:redstone_lamp' else want
            return 'Changed the block at '+','.join(map(str,xyz))
        raise AssertionError('unsupported fake Minecraft command: '+text)
    def lever(self, plan, side):
        l=next(x for x in plan['anchors'] if x['name']=='lever_'+side)
        lamp=next(x for x in plan['anchors'] if x['name']=='lamp_'+side)
        self.blocks[tuple(l['xyz'])]='minecraft:lever[face=floor,facing=north,powered=true]'
        self.blocks[tuple(lamp['xyz'])]='minecraft:redstone_lamp[lit=true]'


class MinecraftRules(unittest.TestCase):
    def setUp(self):self.mc=FakeMinecraft();self.plan=blueprint()
    def test_plan_bounded_and_fixed(self):
        self.assertEqual(len(self.plan['anchors']),10)
        self.assertEqual(self.plan['prompts'],['OFFER','NEED','BUILD','QUESTION'])
        with self.assertRaises(ValueError):blueprint(15000,70,0)
        with self.assertRaises(ValueError):blueprint(0,70.25,0)
        with self.assertRaises(ValueError):blueprint(0,30,0)
    def test_no_mutation_without_authorization(self):
        with self.assertRaises(PermissionError):stage(self.mc.command,self.plan)
        self.assertFalse(self.mc.calls)
        with self.assertRaises(PermissionError):celebrate(self.mc.command,self.plan)
        self.assertFalse(self.mc.calls)
    def test_preflight_rejects_occupied_ground_before_any_setblock(self):
        a=self.plan['anchors'][3]
        self.mc.blocks[tuple(a['xyz'])]='minecraft:diamond_block'
        with self.assertRaisesRegex(RconError,'not empty'):
            stage(self.mc.command,self.plan,authorized=True)
        self.assertFalse(any(c.startswith('setblock') for c in self.mc.calls))
        self.assertEqual(self.mc.get(a['xyz']),'minecraft:diamond_block')
    def test_real_world_grammar_two_levers_one_center(self):
        s=stage(self.mc.command,self.plan,authorized=True)
        self.assertEqual(s['blocks_changed'],10)
        self.assertEqual(observe(self.mc.command,self.plan)['game_state'],'WAITING_FOR_HARBORS')
        self.assertFalse(observe(self.mc.command,self.plan)['festival_center_lit'])
        with self.assertRaisesRegex(RconError,'Both'):
            celebrate(self.mc.command,self.plan,authorized=True)
        self.mc.lever(self.plan,'a')
        self.assertEqual(observe(self.mc.command,self.plan)['game_state'],'WAITING_FOR_HARBORS')
        self.mc.lever(self.plan,'b')
        ready=observe(self.mc.command,self.plan)
        self.assertEqual(ready['game_state'],'BOTH_HARBOR_LAMPS_LIT')
        self.assertFalse(ready['real_world_result'])
        finished=celebrate(self.mc.command,self.plan,authorized=True)
        self.assertEqual(finished['game_state'],'FESTIVAL_LIT_IN_GAME')
        self.assertEqual(finished['destination_disposition'],'HOLD')
        self.assertFalse(finished['project_deed_effect'])
        self.assertLess(len(witness_text(finished).encode()),1000)
        with self.assertRaisesRegex(RconError,'Both'):
            celebrate(self.mc.command,self.plan,authorized=True)
    def test_missing_blocks_and_forged_seal_never_become_game_success(self):
        stage(self.mc.command,self.plan,authorized=True)
        self.mc.blocks[tuple(self.plan['seal']['xyz'])]='minecraft:sea_lantern'
        self.assertEqual(observe(self.mc.command,self.plan)['game_state'],'HOLD_SEAL_WITHOUT_TWO_SIGNALS')
        self.mc.blocks[tuple(self.plan['anchors'][0]['xyz'])]='minecraft:bedrock'
        self.assertEqual(observe(self.mc.command,self.plan)['game_state'],'HOLD_INCOMPLETE_GAME_WORLD')
    def test_exact_game_input_can_be_hashed_by_donor(self):
        stage(self.mc.command,self.plan,authorized=True)
        o=observe(self.mc.command,self.plan)
        text=witness_text(o)
        self.assertEqual(hashlib.sha256(text.encode()).hexdigest(),hashlib.sha256(text.encode()).hexdigest())
        self.assertNotIn('real-human',text)
    def test_rcon_restricts_nonlocal_operator_and_unknown_password(self):
        with self.assertRaisesRegex(RconError,'loopback'):
            VanillaRcon('password',host='192.168.1.2')
        with self.assertRaisesRegex(RconError,'password'):
            VanillaRcon('')


class HttpBridge(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.srv=ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,directory=str(APP)))
        self.srv.ghot_repo=checked_ghot_directory(os.environ.get('GHOT_REPO') or HERE/'fixtures'/'fake_ghot')
        self.srv.ghot_home=Path(self.temp.name)/'donor'
        self.srv.peer_lock=threading.Lock(); self.srv.peer_binding=None
        self.srv.minecraft_enabled=False
        self.srv.minecraft_lock=threading.Lock()
        self.srv.minecraft_plan=blueprint()
        self.srv.minecraft_rcon_password='test-only-not-persisted'
        self.srv.minecraft_rcon_port=25575
        self.t=threading.Thread(target=self.srv.serve_forever,daemon=True);self.t.start()
        self.url='http://127.0.0.1:'+str(self.srv.server_port)
    def tearDown(self):
        self.srv.shutdown();self.srv.server_close();self.t.join(timeout=3);self.temp.cleanup()
    def post(self,route,data,origin=True):
        hdr={'Content-Type':'application/json'}
        if origin:hdr['Origin']=self.url
        request=Request(self.url+route,json.dumps(data).encode(),hdr,method='POST')
        try:
            with urlopen(request,timeout=5) as response:return response.status,json.load(response)
        except HTTPError as error:return error.code,json.loads(error.read())
    def test_default_disabled_and_authorization_gate(self):
        with urlopen(self.url+'/api/minecraft/status') as response:
            self.assertFalse(json.load(response)['enabled'])
        code,_=self.post('/api/minecraft/stage',{'confirm':'I AUTHORIZE TEST WORLD STAGING'})
        self.assertEqual(code,400)
        self.srv.minecraft_enabled=True
        code,_=self.post('/api/minecraft/stage',{})
        self.assertEqual(code,400)
        code,_=self.post('/api/minecraft/celebrate',{'confirm':'do it'})
        self.assertEqual(code,400)
        code,_=self.post('/api/minecraft/observe',{'command':'op @a'})
        self.assertEqual(code,400)
    def test_origin_and_host_checks_hold(self):
        code,_=self.post('/api/minecraft/observe',{},origin=False)
        self.assertEqual(code,403)
        req=Request(self.url+'/api/minecraft/status',headers={'Host':'evil.example'})
        with self.assertRaises(HTTPError) as error:urlopen(req)
        self.assertEqual(error.exception.code,403)

if __name__=='__main__':unittest.main()
