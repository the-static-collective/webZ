#!/usr/bin/env python3
"""Circuit 005: manual, dimension-calibrated floorplan -> Minecraft Java 26.1.1 datapack.

Pure Python 3.10+ standard library. No raster interpretation or structural claims.
No RCON and no automatic game-world modifications.
"""
from __future__ import annotations

from dataclasses import dataclass
import hashlib
import html
import io
import json
import math
import re
import zipfile
from typing import Any

SCHEMA = 'abundent.blueprint.measured-plan/v1'
PACK_FORMAT = 101  # Minecraft Java Edition 26.1.1
ALLOWED_WALL = {'minecraft:stone_bricks','minecraft:oak_planks','minecraft:white_concrete','minecraft:bricks','minecraft:sandstone'}
ALLOWED_FLOOR = {'minecraft:oak_planks','minecraft:stone_bricks','minecraft:smooth_stone','minecraft:spruce_planks'}
ALLOWED_ROOF = {'minecraft:spruce_planks','minecraft:stone_bricks','minecraft:white_concrete','none'}
NAMESPACE = 'abundent_blueprint'

class PlanError(ValueError):
    pass


def expect(ok: bool, msg: str):
    if not ok:
        raise PlanError(msg)


def numeric(v: Any, name: str, low: float = 0.0, high: float = 10000.0) -> float:
    expect(type(v) in (int,float), f'{name}: finite number required')
    v=float(v)
    expect(math.isfinite(v) and low <= v <= high, f'{name}: value outside {low}..{high}')
    return v


def point(obj: Any, path: str) -> tuple[float,float]:
    expect(isinstance(obj,list) and len(obj)==2, f'{path}: [x,y] point required')
    return numeric(obj[0],path+' x'), numeric(obj[1],path+' y')


def voxel_line(x0:int,z0:int,x1:int,z1:int) -> list[tuple[int,int]]:
    """Bresenham, any octant, inclusive endpoints."""
    coords=[];dx=abs(x1-x0);dz=abs(z1-z0)
    sx=1 if x0<x1 else -1; sz=1 if z0<z1 else -1
    err=dx-dz
    while True:
        coords.append((x0,z0))
        if x0==x1 and z0==z1: return coords
        e2=2*err
        if e2>-dz: err-=dz;x0+=sx
        if e2<dx: err+=dx;z0+=sz

@dataclass(frozen=True)
class Compiled:
    name: str
    source: dict
    extent: tuple[int,int]
    dimensions_m: tuple[float,float]
    floor_level: int
    height: int
    wall_cells: frozenset[tuple[int,int]]
    door_cells: frozenset[tuple[int,int]]
    window_cells: frozenset[tuple[int,int]]
    commands: tuple[str,...]
    plan_hash: str


def compile_plan(raw: Any) -> Compiled:
    expect(isinstance(raw,dict) and raw.get('schema')==SCHEMA, 'Unknown measured-plan schema')
    name=raw.get('name','Untitled measured plan')
    expect(isinstance(name,str) and 1<=len(name.strip())<=80 and not re.search(r'[\x00-\x1f]',name), 'Plan name required (max 80 chars)')
    scale=numeric(raw.get('pixels_per_meter'),'pixels_per_meter',2,2000)
    height=raw.get('wall_height_blocks',3)
    expect(type(height) is int and 3 <= height <= 12,'Wall height: whole blocks from 3 to 12')
    wall_mat=raw.get('wall_block','minecraft:stone_bricks')
    floor_mat=raw.get('floor_block','minecraft:oak_planks')
    roof_mat=raw.get('roof_block','none')
    expect(wall_mat in ALLOWED_WALL,'Unsupported wall block')
    expect(floor_mat in ALLOWED_FLOOR,'Unsupported floor block')
    expect(roof_mat in ALLOWED_ROOF,'Unsupported roof block')
    walls=raw.get('walls')
    expect(isinstance(walls,list) and 1<=len(walls)<=200,'1–200 wall segments required')
    openings=raw.get('openings',[])
    expect(isinstance(openings,list) and len(openings)<=100,'Max 100 openings')
    parsed=[]
    for i,w in enumerate(walls):
        expect(isinstance(w,dict),'Invalid wall segment')
        a=point(w.get('a'),f'walls[{i}].a')
        b=point(w.get('b'),f'walls[{i}].b')
        expect(math.dist(a,b)>=0.2*scale,f'Wall {i} shorter than 0.2 m')
        parsed.append((a,b))
    minx=min(min(a[0],b[0]) for a,b in parsed)
    maxx=max(max(a[0],b[0]) for a,b in parsed)
    minz=min(min(a[1],b[1]) for a,b in parsed)
    maxz=max(max(a[1],b[1]) for a,b in parsed)
    # Physical scale intentionally 1 block per meter; round to nearest whole block.
    width_m=(maxx-minx)/scale; depth_m=(maxz-minz)/scale
    width=math.floor(width_m+0.5)+3; depth=math.floor(depth_m+0.5)+3
    expect(width<=128 and depth<=128,'Footprint exceeds 128 x 128 blocks (choose a smaller blueprint)')
    expect(width>=4 and depth>=4,'Footprint too small for a useful shell')
    to_cell=lambda p:(math.floor((p[0]-minx)/scale+0.5)+1, math.floor((p[1]-minz)/scale+0.5)+1)
    segments=[]; wall=set()
    for a,b in parsed:
        cells=voxel_line(*to_cell(a),*to_cell(b))
        segments.append(cells)
        wall.update(cells)
    doors=set();windows=set()
    for i,o in enumerate(openings):
        expect(isinstance(o,dict),'Invalid opening')
        kind=o.get('type')
        expect(kind in ('door','window'),f'openings[{i}] must be door or window')
        where=to_cell(point(o.get('at'),f'openings[{i}].at'))
        width_open=o.get('width_m',1 if kind=='door' else 2)
        width_open=numeric(width_open,'opening width (m)',1,3)
        # Find closest wall segment, then open consecutive blocks along its original trace.
        candidates=[]
        for si,cells in enumerate(segments):
            for j,cell in enumerate(cells):
                distance=(cell[0]-where[0])**2+(cell[1]-where[1])**2
                candidates.append((distance,si,j))
        distance,si,j=min(candidates)
        expect(distance<=2,'Opening must be placed ON a traced wall (within ~1 meter)')
        count=int(math.floor(width_open+0.5))
        cells=segments[si]
        start=max(0,min(j-count//2,len(cells)-count))
        gap=cells[start:start+count]
        expect(len(gap)==count,'Opening wider than its wall')
        (doors if kind=='door' else windows).update(gap)
    expect(not (doors & windows),'A block cannot be both door and window')
    floor_y=0
    cmds=[
        '# Generated from a manually traced, dimension-calibrated 2D plan.',
        '# EXACT floor origin is relative to the command execution position.',
        '# DO NOT run in an occupied world; build overwrites blocks.',
        'fill ~0 ~0 ~0 ~%d ~0 ~%d %s' %(width-1,depth-1,floor_mat),
    ]
    for x,z in sorted(wall):
        cmds.append(f'fill ~{x} ~1 ~{z} ~{x} ~{height} ~{z} {wall_mat}')
    for x,z in sorted(doors):
        cmds.append(f'fill ~{x} ~1 ~{z} ~{x} ~2 ~{z} minecraft:air')
    for x,z in sorted(windows):
        # Transparent window at y=2, never removing load-bearing assumptions from real plans.
        cmds.append(f'setblock ~{x} ~2 ~{z} minecraft:glass')
    if roof_mat!='none':
        cmds.append(f'fill ~0 ~{height+1} ~0 ~{width-1} ~{height+1} ~{depth-1} {roof_mat}')
    expect(len(cmds)<=40000,'Too many Minecraft commands')
    source={
        'schema':SCHEMA,'name':name.strip(),'pixels_per_meter':scale,
        'wall_height_blocks':height,'wall_block':wall_mat,'floor_block':floor_mat,'roof_block':roof_mat,
        'walls':[{'a':list(a),'b':list(b)} for a,b in parsed],
        'openings':[{'type':o['type'],'at':list(point(o['at'],'opening.at')),'width_m':float(o.get('width_m',1 if o['type']=='door' else 2))} for o in openings]
    }
    content=json.dumps(source,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode('utf-8')
    return Compiled(name.strip(),source,(width,depth),(round(width_m,3),round(depth_m,3)),floor_y,height,frozenset(wall),frozenset(doors),frozenset(windows),tuple(cmds),hashlib.sha256(content).hexdigest())


def preview_svg(c:Compiled) -> str:
    w,h=c.extent;unit=14
    head=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w*unit+20} {h*unit+75}" width="{w*unit+20}" height="{h*unit+75}">'
    pieces=[head,'<rect width="100%" height="100%" fill="#f8f6ee"/>',
            '<text x="10" y="20" font-family="sans-serif" font-size="14" fill="#143044">'+html.escape(c.name)+'</text>',
            '<text x="10" y="40" font-family="sans-serif" font-size="11" fill="#394c50">'+f'{c.dimensions_m[0]}m × {c.dimensions_m[1]}m · approx 1 block = 1 meter'+'</text>']
    for x in range(w):
        for z in range(h):
            color='#ffffff' if (x,z) not in c.wall_cells else '#31475c'
            if (x,z) in c.door_cells: color='#fc9234'
            if (x,z) in c.window_cells:color='#63c5db'
            pieces.append(f'<rect x="{10+x*unit}" y="{55+z*unit}" width="{unit-1}" height="{unit-1}" fill="{color}" stroke="#ddd" stroke-width="0.5"/>')
    pieces.extend(['<text x="10" y="'+str(65+h*unit)+'" font-family="sans-serif" font-size="10" fill="#31475c">Navy wall · Orange opening · Blue window</text>','</svg>'])
    return ''.join(pieces)


def make_datapack(c:Compiled)->bytes:
    buf=io.BytesIO()
    with zipfile.ZipFile(buf,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
        fmt={'pack':{'description':'Abundent Blueprint Foundry 005 — user-approved rehearsal shell',
                     'min_format':[PACK_FORMAT,0],'max_format':[PACK_FORMAT,0]}}
        z.writestr('pack.mcmeta',json.dumps(fmt,indent=2)+'\n')
        z.writestr(f'data/{NAMESPACE}/function/build.mcfunction','\n'.join(c.commands)+'\n')
        z.writestr('SOURCE_PLAN.json',json.dumps(c.source,indent=2,ensure_ascii=False)+'\n')
        z.writestr('PREVIEW.svg',preview_svg(c))
        z.writestr('README.txt',f'''ABUNDENT BLUEPRINT FOUNDRY 005 — REHEARSAL ONLY

Plan: {c.name}
Source SHA-256: {c.plan_hash}
Original traced wall segments: {len(c.source['walls'])}
Walls: {len(c.wall_cells)} blocks; doors: {len(c.door_cells)}; windows: {len(c.window_cells)}
Footprint: {c.extent[0]} x {c.extent[1]} blocks, height {c.height+1} blocks (if roof enabled)
Scale: 1 Minecraft block = approx 1 real meter. Position of every opening is approximate.

HOW TO USE — Minecraft Java 26.1.1 ONLY
1. Make a brand-new FLAT CREATIVE TEST WORLD, and back it up. Do NOT install into
   your main, populated, public, survival, or shared world.
2. Put the WHOLE ZIP into that world's datapacks folder (do not unzip it).
3. Reopen the world / use /reload. Verify /datapack list recognizes it.
4. Ensure a completely EMPTY area at the target coordinates. The game commands
   overwrite blocks with floor, walls, openings and optional roof.
5. As the server/world operator, run a command such as:
      /execute positioned 0 80 0 run function {NAMESPACE}:build
   This places the west-north floor corner at X=0, Y=80, Z=0, and stretches
   +X eastward and +Z southward. Adjust these three numbers yourself.
6. Inspect the result. It is a geometric preview, NOT a legally suitable plan.

IMPORTANT:
- The image pixels are only references; wall traces and scaling are entered by
  the human operator. The original image is NOT transferred or included.
- Straight wall segments only, with snapped 1m voxel resolution. Height is
  your chosen placeholder, not inferred from the blueprint.
- No structural loads, foundations, electrical, plumbing, fire/egress code,
  occupancy, accessibility, land rights, venue permission, or budget confirmed.
- No restoration/undo is generated because the previous world state is unknown.
- No GHoT task, Full Measure Deed or reLATTE admission is inferred here.
''')
    return buf.getvalue()


def manifest(c:Compiled)->dict:
    return {'schema':'abundent.blueprint.compilation-report/v1',
            'source_sha256':c.plan_hash,'name':c.name,'physical_extent_m':c.dimensions_m,
            'minecraft_footprint_blocks':c.extent,'height_blocks':c.height,
            'wall_cells':len(c.wall_cells),'door_cells':len(c.door_cells),'window_cells':len(c.window_cells),
            'minecraft_commands':len(c.commands),
            'disposition':'GAME_ONLY_REHEARSAL','real_world_authority':False}
