import io
import json
import sys
import unittest
import zipfile
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from blueprint_engine import SCHEMA,PlanError,compile_plan,make_datapack,voxel_line,manifest


def sample():
 return {'schema':SCHEMA,'name':'12m by 8m illustrative workshop', 'pixels_per_meter':32,
 'wall_height_blocks':3,'wall_block':'minecraft:stone_bricks','floor_block':'minecraft:oak_planks','roof_block':'none',
 'walls':[{'a':[100,90],'b':[484,90]},{'a':[484,90],'b':[484,346]},{'a':[484,346],'b':[100,346]},
          {'a':[100,346],'b':[100,90]},{'a':[292,90],'b':[292,346]},{'a':[100,218],'b':[292,218]}],
 'openings':[{'type':'door','at':[292,280],'width_m':1},{'type':'door','at':[290,90],'width_m':1},{'type':'window','at':[484,218],'width_m':2}]}

class Blueprint(unittest.TestCase):
 def test_bresenham_is_inclusive_and_two_directional(self):
  self.assertEqual(voxel_line(1,2,4,2),[(1,2),(2,2),(3,2),(4,2)])
  self.assertEqual(voxel_line(4,2,1,2),[(4,2),(3,2),(2,2),(1,2)])
  self.assertEqual(voxel_line(1,2,1,4),[(1,2),(1,3),(1,4)])
 def test_sample_physical_scale_and_voxelization(self):
  c=compile_plan(sample())
  self.assertEqual(c.dimensions_m,(12.,8.))
  self.assertEqual(c.extent,(15,11))
  self.assertGreater(len(c.wall_cells),30)
  self.assertEqual(len(c.door_cells),2)
  self.assertEqual(len(c.window_cells),2)
  self.assertTrue(c.door_cells.issubset(c.wall_cells))
  self.assertTrue(c.window_cells.issubset(c.wall_cells))
  self.assertIn('fill ~0 ~0 ~0 ~14 ~0 ~10 minecraft:oak_planks',c.commands)
 def test_datapack_is_inspectable_java_2611_and_not_autoexecuted(self):
  c=compile_plan(sample())
  with zipfile.ZipFile(io.BytesIO(make_datapack(c))) as z:
   self.assertIn('pack.mcmeta',z.namelist())
   self.assertIn('data/abundent_blueprint/function/build.mcfunction',z.namelist())
   self.assertNotIn('data/minecraft/tags/function/load.json',z.namelist())
   self.assertNotIn('data/minecraft/tags/function/tick.json',z.namelist())
   pack=json.loads(z.read('pack.mcmeta'));self.assertEqual(pack['pack']['min_format'],[101,0])
   self.assertEqual(pack['pack']['max_format'],[101,0])
   commands=z.read('data/abundent_blueprint/function/build.mcfunction').decode()
   self.assertTrue(commands.endswith('\n'))
   self.assertIn('minecraft:air',commands)
   self.assertIn('minecraft:glass',commands)
   self.assertNotIn('forceload',commands)
   self.assertNotIn('setblock ~0 ~0 ~0',commands)
   self.assertEqual(json.loads(z.read('SOURCE_PLAN.json'))['name'],sample()['name'])
   self.assertIn('svg',z.read('PREVIEW.svg').decode())
 def test_varying_height_and_roof(self):
  s=sample();s['wall_height_blocks']=5;s['roof_block']='minecraft:spruce_planks'
  c=compile_plan(s)
  self.assertIn('fill ~0 ~6 ~0 ~14 ~6 ~10 minecraft:spruce_planks',c.commands)
  self.assertTrue(any(' ~5 ' in v and v.startswith('fill ~') for v in c.commands))
 def test_tampered_or_injected_material_is_refused(self):
  for key in ['wall_block','floor_block','roof_block']:
   s=sample();s[key]='minecraft:stone /say hacked'
   with self.assertRaises(PlanError):compile_plan(s)
 def test_traces_not_raster_interpretation(self):
  s=sample();s['walls']=[]
  with self.assertRaises(PlanError):compile_plan(s)
 def test_bad_scale_or_nonfinite_is_refused(self):
  for value in [0,1,1e20,float('nan'),True,'32']:
   s=sample();s['pixels_per_meter']=value
   with self.assertRaises(PlanError):compile_plan(s)
 def test_outside_door_is_rejected(self):
  s=sample();s['openings']=[{'type':'door','at':[400,180],'width_m':1}]
  with self.assertRaises(PlanError):compile_plan(s)
 def test_huge_footprint_refused(self):
  s=sample();s['pixels_per_meter']=2
  with self.assertRaises(PlanError):compile_plan(s)
 def test_reuse_report_makes_no_real_world_claim(self):
  m=manifest(compile_plan(sample()))
  self.assertEqual(m['disposition'],'GAME_ONLY_REHEARSAL')
  self.assertFalse(m['real_world_authority'])
 def test_control_characters_in_name_refused(self):
  s=sample();s['name']='test\r\n/say bad'
  with self.assertRaises(PlanError):compile_plan(s)
 def test_void_oversized_input_rejected(self):
  s=sample();s['walls']=s['walls']*40
  with self.assertRaises(PlanError):compile_plan(s)
 def test_repeated_exports_are_byte_predictable_source_commands(self):
  x=compile_plan(sample());y=compile_plan(sample())
  self.assertEqual(x.commands,y.commands);self.assertEqual(x.plan_hash,y.plan_hash)

if __name__=='__main__':unittest.main()
