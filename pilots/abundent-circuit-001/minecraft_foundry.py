#!/usr/bin/env python3
"""Circuit 004: small *native* Java Minecraft RCON rehearsal; Python stdlib only.

Two fictional harbors, four prompts, and two in-world player-operated levers.
A fresh server readback decides whether both actual redstone lamps are lit.
One explicitly authorized optional celebration places a sea lantern only after
both powered signals are observed. No real human/financial authority or property.

All mutations are bounded to an opt-in EMPTY TEST WORLD only. Never use on
someone else's server, an existing world, or a multiplayer server without all
relevant operators' permission. This module does not open a server port.
"""
from __future__ import annotations

import hashlib
import json
import re
import secrets
import socket
import struct
from dataclasses import dataclass
from typing import Callable

SCHEMA = 'abundent.minecraft.game-observation/v0'
HASH = re.compile(r'^[a-f0-9]{64}$')
SEED_REPLY = re.compile(r'(?i)seed\s*:\s*\[?-?\d+\]?')


def _digest(value: object) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=False).encode('utf-8')).hexdigest()


class RconError(RuntimeError):
    pass


class VanillaRcon:
    """Minimal Microsoft/Mojang Source RCON client: single synchronous response.

    No logging of password or commands. The connection stays on loopback and
    is created fresh for each world operation; no third-party packages.
    """
    def __init__(self, password: str, port: int = 25575, host: str = '127.0.0.1'):
        if host not in ('127.0.0.1', '::1'):
            raise RconError('Minecraft RCON must remain on loopback.')
        if not password or len(password) > 128:
            raise RconError('RCON password missing or over limit.')
        if not isinstance(port, int) or port < 1024 or port > 65535:
            raise RconError('Invalid RCON port.')
        self.password, self.port, self.host = password, port, host
        self.sock = None
        self.req_id = secrets.randbelow(1000000) + 50

    def __enter__(self):
        self.sock = socket.create_connection((self.host, self.port), timeout=6)
        self.sock.settimeout(6)
        self._send(3, self.password)
        # Servers can emit an empty response value before AUTH_RESPONSE.
        for _ in range(4):
            rid, kind, _ = self._recv()
            if rid == -1:
                raise RconError('Minecraft RCON authentication refused.')
            if rid == self.req_id and kind == 2:
                return self
        raise RconError('Minecraft RCON authentication response missing.')

    def __exit__(self, *_):
        if self.sock:
            self.sock.close()
            self.sock = None

    def _read(self, n):
        buf = b''
        while len(buf) < n:
            data = self.sock.recv(n - len(buf))
            if not data:
                raise RconError('RCON connection closed before full response.')
            buf += data
        return buf

    def _send(self, kind, value):
        payload = value.encode('utf-8')
        if len(payload) > 1300:
            raise RconError('RCON request too large.')
        body = struct.pack('<ii', self.req_id, kind) + payload + b'\0\0'
        self.sock.sendall(struct.pack('<i', len(body)) + body)

    def _recv(self):
        n = struct.unpack('<i', self._read(4))[0]
        if not 10 <= n <= 8192:
            raise RconError('Malformed Minecraft RCON response length.')
        payload = self._read(n)
        rid, kind = struct.unpack('<ii', payload[:8])
        if payload[-2:] != b'\0\0':
            raise RconError('Malformed RCON response terminator.')
        return rid, kind, payload[8:-2].decode('utf-8', errors='replace')

    def command(self, command: str) -> str:
        if not self.sock:
            raise RconError('RCON is not connected.')
        if not isinstance(command, str) or len(command) > 1300 or '\n' in command or '\r' in command:
            raise RconError('Invalid bounded command.')
        self.req_id += 1
        self._send(2, command)
        rid, _, response = self._recv()
        if rid != self.req_id:
            raise RconError('RCON returned an unrelated command result.')
        return response


@dataclass(frozen=True)
class Anchor:
    label: str
    xyz: tuple[int, int, int]
    block: str


def blueprint(x: int = 0, y: int = 70, z: int = 0) -> dict:
    if not all(isinstance(v, int) and not isinstance(v, bool) for v in (x, y, z)):
        raise ValueError('Coordinates must be integer operators.')
    if not (-10000 <= x <= 10000 and -10000 <= z <= 10000 and 66 <= y <= 240):
        raise ValueError('Operator origin outside bounded test-world limits.')
    def a(label, dx, dy, dz, block):
        return Anchor(label, (x+dx, y+dy, z+dz), 'minecraft:'+block)
    anchors = [
        a('harbor_a', -8, 0, 0, 'blue_wool'),
        a('lamp_a', -6, 0, 0, 'redstone_lamp'),
        a('lever_a', -6, 1, 0, 'lever[face=floor,facing=north,powered=false]'),
        a('harbor_b', 8, 0, 0, 'lime_wool'),
        a('lamp_b', 6, 0, 0, 'redstone_lamp'),
        a('lever_b', 6, 1, 0, 'lever[face=floor,facing=north,powered=false]'),
        a('offer', -3, 0, 5, 'gold_block'),
        a('need', -1, 0, 5, 'emerald_block'),
        a('build', 1, 0, 5, 'crafting_table'),
        a('question', 3, 0, 5, 'amethyst_block'),
    ]
    seal = a('festival_center', 0, 0, 0, 'sea_lantern')
    return {'schema':'abundent.minecraft.rehearsal-plan/v0',
            'origin':[x,y,z], 'anchors':[{'name':v.label,'xyz':list(v.xyz),'block':v.block} for v in anchors],
            'seal':{'name':seal.label,'xyz':list(seal.xyz),'block':seal.block},
            'bounds':{'dx':[-8,8],'dy':[0,1],'dz':[0,5]},
            'prompts':['OFFER','NEED','BUILD','QUESTION'],
            'nonclaims':['Dedicated rehearsal world required','Not a social/real-world consent mechanism',
                         'Game lamps cannot award Full Measure Deeds','A GHoT hash is not evidence of human identity']}


def _coord(xyz):
    return ' '.join(str(v) for v in xyz)


def test_block(cmd: Callable[[str], str], xyz, block) -> bool:
    # `seed` is a read-only vanilla command; it only runs when IF BLOCK passes.
    output = cmd('execute if block '+_coord(xyz)+' '+block+' run seed')
    return bool(SEED_REPLY.search(output))


def check_marker(cmd, xyz, block):
    return test_block(cmd, xyz, block)


def _keep_loaded(cmd, plan):
    x, _, z = plan['origin']
    # One bounded chunk at each endpoint, for isolated empty test servers.
    # Forced chunks are removed in the finally block, even on refused actions.
    for dx in (-8,0,8):
        cmd(f'forceload add {x+dx} {z}')


def _unload(cmd, plan):
    x, _, z = plan['origin']
    for dx in (-8,0,8):
        try:
            cmd(f'forceload remove {x+dx} {z}')
        except Exception:
            pass


def _set(cmd, xyz, block):
    response = cmd('setblock '+_coord(xyz)+' '+block+' replace')
    # Fail closed on nonstandard messages instead of trusting command issuance.
    if not re.search(r'(?i)changed\s+the\s+block', response):
        raise RconError('Minecraft refused a requested block change.')


def stage(cmd: Callable[[str], str], plan: dict, *, authorized: bool = False) -> dict:
    if not authorized:
        raise PermissionError('Explicit dedicated-world permission required.')
    _keep_loaded(cmd, plan)
    try:
        entries = plan['anchors'] + [plan['seal']]
        occupied = [v['name'] for v in entries if not test_block(cmd, v['xyz'], 'minecraft:air')]
        if occupied:
            raise RconError('Test ground not empty; world unchanged: '+', '.join(occupied))
        for v in plan['anchors']:
            _set(cmd, v['xyz'], v['block'])
            # Levers' in-game placement is validated below, and later live readback.
            if not test_block(cmd, v['xyz'], v['block']):
                raise RconError('Block did not materialize: '+v['name'])
        # Do not place the festival seal; it requires both independent signals.
        return {'state':'STAGED', 'blocks_changed':len(plan['anchors']), 'plan_digest':_digest(plan),
                'scope':'native_minecraft_only','human_authority':False}
    finally:
        _unload(cmd, plan)


def _lever_state(cmd, xyz):
    for setting in (False, True):
        block='minecraft:lever[face=floor,facing=north,powered='+str(setting).lower()+']'
        if test_block(cmd, xyz, block):
            return setting
    return None


def _lamp_state(cmd, xyz):
    for value in (False, True):
        if test_block(cmd, xyz, 'minecraft:redstone_lamp[lit='+str(value).lower()+']'):
            return value
    return None


def observe(cmd, plan):
    _keep_loaded(cmd, plan)
    try:
        anchors = {x['name']:x for x in plan['anchors']}
        static = [x for x in plan['anchors'] if not x['name'].startswith(('lamp_', 'lever_'))]
        missing = [x['name'] for x in static if not test_block(cmd,x['xyz'],x['block'])]
        lamps={k:_lamp_state(cmd,anchors['lamp_'+k]['xyz']) for k in ('a','b')}
        levers={k:_lever_state(cmd,anchors['lever_'+k]['xyz']) for k in ('a','b')}
        if any(v is None for v in lamps.values()):missing.append('lamp')
        if any(v is None for v in levers.values()):missing.append('lever')
        celebration = test_block(cmd,plan['seal']['xyz'],plan['seal']['block'])
        center_empty = test_block(cmd,plan['seal']['xyz'],'minecraft:air')
        if not center_empty and not celebration:missing.append('festival_center_occupied')
        if missing:
            state='HOLD_INCOMPLETE_GAME_WORLD'
        elif celebration and all(lamps.values()):
            state='FESTIVAL_LIT_IN_GAME'
        elif celebration:
            state='HOLD_SEAL_WITHOUT_TWO_SIGNALS'
        elif all(lamps.values()):
            state='BOTH_HARBOR_LAMPS_LIT'
        else:
            state='WAITING_FOR_HARBORS'
        raw = {'schema':SCHEMA, 'plan_digest':_digest(plan),
               'game_state':state, 'lamp_a_lit':lamps['a'], 'lamp_b_lit':lamps['b'],
               'lever_a_powered':levers['a'], 'lever_b_powered':levers['b'],
               'festival_center_lit':celebration, 'missing':missing,
               'observer':'fresh_minecraft_rcon_readback', 'same_operator_boundary':True,
               'real_world_result':False, 'human_independence_verified':False,
               'economy_effect':False, 'project_deed_effect':False, 'destination_disposition':'HOLD'}
        raw['observed_state_sha256']=_digest(raw)
        return raw
    finally:
        _unload(cmd, plan)


def celebrate(cmd, plan, *, authorized: bool = False):
    if not authorized: raise PermissionError('Explicit game-world mutation permission required.')
    result=observe(cmd,plan)
    if result['game_state'] != 'BOTH_HARBOR_LAMPS_LIT':
        raise RconError('Both genuine in-game redstone lamp signals must be lit first.')
    _keep_loaded(cmd,plan)
    try:
        if not test_block(cmd,plan['seal']['xyz'],'minecraft:air'):
            raise RconError('Festival center was changed before approval.')
        _set(cmd,plan['seal']['xyz'],plan['seal']['block'])
        if not test_block(cmd,plan['seal']['xyz'],plan['seal']['block']):
            raise RconError('Festival center write not observed.')
    finally:
        _unload(cmd,plan)
    final=observe(cmd,plan)
    if final['game_state'] != 'FESTIVAL_LIT_IN_GAME':
        raise RconError('Minecraft final world observation failed.')
    return final


def witness_text(observation: dict) -> str:
    # Compact audited input to GHoT; GHoT hashes exactly these bytes. The
    # carrier hashes game-world evidence and grants no real-world authority.
    keep=('schema','plan_digest','observed_state_sha256','game_state','lamp_a_lit','lamp_b_lit',
          'festival_center_lit','destination_disposition')
    text=json.dumps({k:observation[k] for k in keep},sort_keys=True,separators=(',',':'))
    if len(text.encode('utf-8'))>1000:
        raise ValueError('Observation exceeds native GHoT hash limit.')
    return text
