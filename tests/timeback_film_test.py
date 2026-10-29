"""TIMEBACK-FILM-001 native small-machine replay on self-synthesized audio only."""
import hashlib
import json
import math
from pathlib import Path
import struct
import subprocess
import sys
import tempfile
import unittest
import wave

HERE=Path(__file__).resolve().parents[1]
FILM=HERE/"tools"/"timeback-film"
sys.path.insert(0,str(FILM))
from scenes import scene_image, KINDS, PALETTES
from render import validate, probe, SCHEMA

class MusicFilmTest(unittest.TestCase):
    def test_scene_replay_is_deterministic(self):
        import numpy as np
        for kind in KINDS:
            a=scene_image(kind,(320,180),"blue-dawn",20261029)
            b=scene_image(kind,(320,180),"blue-dawn",20261029)
            self.assertTrue(np.array_equal(a,b),kind)
            self.assertEqual(a.shape,(180,320,3))
    def test_manifest_holds_on_invalid_specs(self):
        good=json.loads((FILM/"recipes"/"short-synthetic.json").read_text())
        self.assertEqual(validate(good,6)[0:3],(640,360,12))
        for change in [
            {"schema":"wrong"},
            {"video":{"width":321,"height":180,"fps":12}},
            {"scenes":[{"start":0,"kind":"not-real"}]},
            {"scenes":[{"start":1,"kind":"roof"}]},
            {"scenes":[{"start":0,"kind":"roof"},{"start":0,"kind":"window"}]}
        ]:
            case=json.loads(json.dumps(good));case.update(change)
            with self.assertRaises(ValueError):
                validate(case,6)

    def test_end_to_end_real_mp4_and_receipt(self):
        with tempfile.TemporaryDirectory(prefix="timeback-film-") as td:
            base=Path(td); audio=base/"test-song.wav"; out=base/"result.mp4"
            rate=16000
            with wave.open(str(audio),"wb") as f:
                f.setnchannels(1);f.setsampwidth(2);f.setframerate(rate)
                samples=bytearray()
                for i in range(rate*6):
                    t=i/rate
                    y=0.22*math.sin(2*math.pi*110*t)+0.08*math.sin(2*math.pi*550*t)
                    samples+=struct.pack("<h",int(max(-1,min(1,y))*32767))
                f.writeframes(bytes(samples))
            proc=subprocess.run([sys.executable,str(FILM/"render.py"),
               "--audio",str(audio),"--recipe",str(FILM/"recipes"/"short-synthetic.json"),
               "--out",str(out),"--small"],capture_output=True,text=True,timeout=180)
            self.assertEqual(proc.returncode,0,proc.stderr)
            self.assertTrue(out.is_file())
            duration,streams=probe(out)
            self.assertTrue(5.5<=duration<=6.5)
            self.assertIn("h264",[s["codec_name"] for s in streams])
            self.assertIn("aac",[s["codec_name"] for s in streams])
            receipt=json.loads((base/"result.receipt.json").read_text())
            self.assertEqual(receipt["schema"],"abundent/timeback-offline-film-receipt/v1")
            self.assertEqual(receipt["video"]["sha256"],hashlib.sha256(out.read_bytes()).hexdigest())
            self.assertTrue((base/"result.contact.jpg").is_file())
            self.assertEqual(receipt["audio"]["name"],"test-song.wav")
            self.assertEqual(receipt["production"]["engine"],"TIMEBACK_FILM_001_PROCEDURAL_FFMPEG")
            self.assertEqual(receipt["production"]["scenes"],3)
            self.assertFalse(receipt["production"]["nativeHauntedToaster"])
            self.assertFalse(receipt["production"]["nativePlayDeck"])
            self.assertFalse(receipt["production"]["externalPublication"])
            self.assertFalse(receipt["production"]["previewOnly"])
            # Explicit preview is not mislabeled as a complete render.
            short=base/"short.mp4"
            proc=subprocess.run([sys.executable,str(FILM/"render.py"),
               "--audio",str(audio),"--recipe",str(FILM/"recipes"/"short-synthetic.json"),
               "--out",str(short),"--preview-seconds","2","--small"],
               capture_output=True,text=True,timeout=180)
            self.assertEqual(proc.returncode,0,proc.stderr)
            self.assertTrue(json.loads((base/"short.receipt.json").read_text())["production"]["previewOnly"])

if __name__=="__main__":
    unittest.main(verbosity=2)
