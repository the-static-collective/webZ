#!/usr/bin/env python3
"""Offline CLI alternative: JSON source plan -> inspectable Minecraft datapack ZIP."""
from __future__ import annotations
import argparse
import json
from pathlib import Path
from blueprint_engine import compile_plan,make_datapack,manifest

def main():
    p=argparse.ArgumentParser(description='Convert traced dimensioned floorplan into Java 26.1.1 datapack. Does not modify game world.')
    p.add_argument('input',type=Path,help='measured-plan/v1 JSON')
    p.add_argument('--output',type=Path,default=Path('Abundent_Blueprint_Java_26.1.1.zip'))
    a=p.parse_args()
    if a.input.stat().st_size>64000:raise ValueError('Plan JSON must be <=64 KB')
    c=compile_plan(json.loads(a.input.read_text(encoding='utf-8')))
    a.output.write_bytes(make_datapack(c))
    print(json.dumps({'archive':str(a.output),**manifest(c)},indent=2))
if __name__=='__main__':main()
