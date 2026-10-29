#!/usr/bin/env python3
"""Rights-safe synthetic song for CI: four simple generated tones, no outside media."""
import math
from pathlib import Path
import struct
import sys
import wave
out=Path(sys.argv[1] if len(sys.argv)>1 else "synthetic-timeback.wav")
out.parent.mkdir(parents=True,exist_ok=True)
rate=16000
seconds=6
with wave.open(str(out),"wb") as song:
    song.setnchannels(1)
    song.setsampwidth(2)
    song.setframerate(rate)
    buf=bytearray()
    for i in range(rate*seconds):
        t=i/rate
        amp=.16+.06*math.sin(2*math.pi*1.2*t)
        x=amp*math.sin(2*math.pi*110*t)+.08*math.sin(2*math.pi*330*t)
        buf+=struct.pack("<h",int(32767*max(-1,min(1,x))))
    song.writeframes(bytes(buf))
print(out)
