"""Runs exclusively against a separate REAL Mojang Java server in GitHub CI.

Do not run against a populated world: stage() mutates ten fixed positions.
"""
from __future__ import annotations
import hashlib
import json
import os
import sys
import time
from pathlib import Path
HERE=Path(__file__).resolve().parent
APP=HERE.parent
sys.path.insert(0,str(APP))
from minecraft_foundry import VanillaRcon,blueprint,stage,observe,celebrate,witness_text,RconError
from ghot_local_server import checked_ghot_directory,execute_native_hash

password=os.environ['ABUNDENT_MC_RCON_PASSWORD']
repo=checked_ghot_directory(os.environ['GHOT_REPO'])
home=Path(os.environ.get('GHOT_HOME','/tmp/circuit-mc-ghot'))
plan=blueprint(0,70,0)
with VanillaRcon(password,25575) as world:
    # A fresh connection to the ACTUAL, officially downloaded vanilla server.
    st=stage(world.command,plan,authorized=True)
    assert st['blocks_changed']==10, st
    before=observe(world.command,plan)
    assert before['game_state']=='WAITING_FOR_HARBORS',before
    # Native Minecraft redstone physics; no fake block map. RCON sets the
    # lever state, game ticks must light the actual redstone lamps.
    la=next(v for v in plan['anchors'] if v['name']=='lever_a')
    lb=next(v for v in plan['anchors'] if v['name']=='lever_b')
    for idx,anchor in enumerate((la,lb)):
        xyz=' '.join(map(str,anchor['xyz']))
        out=world.command('setblock '+xyz+' minecraft:lever[face=floor,facing=north,powered=true] replace')
        assert 'Changed the block' in out,('Could not flip native lever',out)
        time.sleep(1.0)
        observed=observe(world.command,plan)
        if idx==0:
            assert observed['lamp_a_lit'] is True and observed['lamp_b_lit'] is False,observed
        else:
            assert observed['game_state']=='BOTH_HARBOR_LAMPS_LIT',observed
    final=celebrate(world.command,plan,authorized=True)
    assert final['game_state']=='FESTIVAL_LIT_IN_GAME',final
    try:
        stage(world.command,plan,authorized=True)
    except RconError as error:
        assert 'not empty' in str(error)
    else:
        raise AssertionError('Replay staging failed to refuse occupied native terrain.')

text=witness_text(final)
verified=execute_native_hash(repo,home,text)
receipt=verified['receipt']
assert receipt['output']['sha256']==hashlib.sha256(text.encode()).hexdigest(),receipt
assert receipt['capability']=='system.hash' and verified['nativeGHoT'] is True
assert list((home/'records').glob('*.json')), 'GHoT native donor records absent'

out={'schema':'abundent.minecraft-ci.native-circuit/v0',
     'server':'official Mojang 26.1.1 Java, verified jar via SHA1 in CI',
     'stage':st,'initial':before,'final':final,
     'native_ghot_receipt':receipt,
     'actual_minecraft_server':True,'actual_native_ghot':True,
     'world_operators_independent':False,
     'real_world_effect':False,'full_measure_deed':False,
     'return_disposition':'HOLD'}
path=Path(os.environ.get('MC_PROOF_OUT','work/circuit004-proof.json'))
path.parent.mkdir(parents=True,exist_ok=True)
path.write_text(json.dumps(out,indent=2)+'\n')
print('PASS: OFFICIAL MOJANG 26.1.1 RCON → 10 verified blocks → two actual powered levers/lamps → festival sea lantern → genuine GHoT system.hash native receipt → HOLD')
print('Minecraft world hash:',final['observed_state_sha256'])
print('Native GHoT receipt:',receipt['receipt_id'])
