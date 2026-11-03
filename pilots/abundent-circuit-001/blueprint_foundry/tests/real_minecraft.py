"""CI-only readback of a freshly generated datapack in the official vanilla server."""
import json
import sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT))
from minecraft_foundry import VanillaRcon,test_block

password='blueprint-ci-only-not-production'
with VanillaRcon(password,25575,'127.0.0.1') as r:
    # We execute only in a new flat test world with no other players/builds.
    result=r.command('execute positioned 0 80 0 run function abundent_blueprint:build')
    print('function:',result[:200])
    if 'unknown' in result.lower() or 'not found' in result.lower() or 'error' in result.lower():
        raise AssertionError('Minecraft did not execute datapack function')
    def check(x,y,z,block):
        if not test_block(r.command,(x,y,z),block):
            raise AssertionError(f'expected {block} at {(x,y,z)}, server returned unexpected state')
    check(0,80,0,'minecraft:oak_planks')
    check(1,81,1,'minecraft:stone_bricks')
    check(1,83,1,'minecraft:stone_bricks')
    check(7,81,1,'minecraft:air')
    check(7,82,1,'minecraft:air')
    check(13,82,4,'minecraft:glass')
    check(13,81,4,'minecraft:stone_bricks')
    check(14,81,10,'minecraft:air')
    check(0,84,0,'minecraft:air')
    print('PASS: official Mojang Java 26.1.1 loaded exported measured-plan datapack, executed /function, read back wall / door / window / floor / no-roof.')
