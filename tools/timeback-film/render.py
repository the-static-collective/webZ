#!/usr/bin/env python3
"""TIMEBACK-FILM-001: source-agnostic, offline song-to-film procedural renderer.

A reusable extraction of the film grammar demonstrated with Metal Roof Morning.
Not the Haunted Toaster or PlayDeck native renderer; never calls a remote API.
"""
import argparse
import hashlib
import json
import math
import os
from pathlib import Path
import subprocess
import sys
import time

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scenes import KINDS, PALETTES, scene_image

SCHEMA="abundent/timeback-film-recipe/v1"
RECEIPT="abundent/timeback-offline-film-receipt/v1"

def sha256(path):
    h=hashlib.sha256()
    with open(path,"rb") as f:
        for block in iter(lambda:f.read(1024*1024),b""):
            h.update(block)
    return h.hexdigest()

def probe(filename):
    r=subprocess.run(["ffprobe","-v","error","-show_entries",
        "format=duration:stream=codec_name,codec_type","-of","json",str(filename)],
        text=True,capture_output=True,check=True,timeout=30)
    data=json.loads(r.stdout)
    return float(data["format"]["duration"]), data["streams"]

def validate(recipe, duration):
    if not isinstance(recipe,dict) or recipe.get("schema")!=SCHEMA:
        raise ValueError("Unknown or missing recipe schema")
    title=recipe.get("title")
    if not isinstance(title,str) or not title or len(title)>100:
        raise ValueError("Recipe title required (max 100 characters)")
    video=recipe.get("video")
    if not isinstance(video,dict):
        raise ValueError("Missing video settings")
    w=video.get("width");h=video.get("height");fps=video.get("fps")
    if not all(type(v) is int for v in (w,h,fps)):
        raise ValueError("Video sizes/fps must be integers")
    if w%2 or h%2 or not (320<=w<=1920 and 180<=h<=1080 and 8<=fps<=30):
        raise ValueError("Video dimensions must be even, and within supported limits")
    palette=recipe.get("palette","blue-dawn")
    if palette not in PALETTES:
        raise ValueError("Unsupported palette")
    scenes=recipe.get("scenes")
    if not isinstance(scenes,list) or not 1<=len(scenes)<=32:
        raise ValueError("Require 1–32 timed scenes")
    previous=-1
    for idx,s in enumerate(scenes):
        if not isinstance(s,dict) or s.get("kind") not in KINDS:
            raise ValueError("Scene has unsupported kind")
        start=s.get("start")
        if type(start) not in (float,int) or not math.isfinite(start) or start<0:
            raise ValueError("Scene start must be nonnegative finite seconds")
        if idx==0 and start!=0 or start<=previous:
            raise ValueError("Scene starts must begin at zero and strictly increase")
        previous=start
        if s.get("palette",palette) not in PALETTES:
            raise ValueError("Scene palette not supported")
        lines=s.get("lines",[])
        if not isinstance(lines,list) or len(lines)>2 or any(
            not isinstance(x,str) or len(x)>48 for x in lines):
            raise ValueError("Only two short optional caption lines allowed")
    if scenes[-1]["start"]>=duration:
        raise ValueError("Final scene begins after audio ends")
    return w,h,fps,palette,scenes

def sample_energy(audio,until):
    r=subprocess.run(["ffmpeg","-nostdin","-v","error","-i",str(audio),
       "-t",f"{until:.3f}","-vn","-ac","1","-ar","4000","-f","f32le","-"],
       capture_output=True,check=True,timeout=120)
    samples=np.frombuffer(r.stdout,dtype="<f4")
    if len(samples)<400:
        return np.zeros(2,dtype=float)
    energy=[]
    for i in range(0,len(samples),800):
        piece=samples[i:i+800]
        energy.append(float(np.sqrt(np.mean(piece*piece))) if len(piece) else 0)
    arr=np.array(energy)
    lo,hi=np.quantile(arr,[.10,.90])
    arr=np.clip((arr-lo)/(hi-lo+.001),0,1)
    return np.convolve(arr,np.ones(7)/7,mode="same")

def overlay_for(lines,w,h):
    image=Image.new("RGBA",(w,h))
    d=ImageDraw.Draw(image)
    try:
        main=ImageFont.truetype("DejaVuSans-Bold.ttf",max(16,w//18))
        sub=ImageFont.truetype("DejaVuSans.ttf",max(13,w//30))
        micro=ImageFont.truetype("DejaVuSans.ttf",max(10,w//76))
    except OSError:
        main=sub=micro=ImageFont.load_default()
    if lines:
        x=int(w*.07);y=int(h*.69)
        d.line((x,y-15,x+max(24,w//11),y-15),fill=(235,202,149,240),width=3)
        d.text((x,y),lines[0],font=main,fill=(245,242,230,245),
               stroke_width=max(0,w//480),stroke_fill=(18,27,39,175))
        if len(lines)>1:
            d.text((x,y+max(30,h//10)),lines[1],font=sub,fill=(244,236,218,230))
    return np.asarray(image)

def create_bases(scenes,w,h,palette,title):
    bases=[];text=[]
    for i,s in enumerate(scenes):
        stable=int(hashlib.sha256((title+str(i)+s["kind"]).encode()).hexdigest()[:8],16)
        bases.append(scene_image(s["kind"],(w,h),s.get("palette",palette),stable))
        text.append(overlay_for(s.get("lines",[]),w,h))
    return bases,text

def image_at(t,bases,overlays,scenes,energy,w,h,duration):
    pos=max(i for i,s in enumerate(scenes) if s["start"]<=t)
    onset=t-scenes[pos]["start"]
    img=bases[pos].copy()
    drift_x=int(w*.009*math.sin(t*.10+pos))
    drift_y=int(h*.009*math.sin(t*.07+pos))
    tr=np.float32([[1.023,0,-w*.012+drift_x],[0,1.023,-h*.01+drift_y]])
    img=cv2.warpAffine(img,tr,(w,h),flags=cv2.INTER_LINEAR,
                       borderMode=cv2.BORDER_REFLECT)
    amp=float(energy[min(len(energy)-1,int(t*5))])
    rain=img.copy()
    for k in range(34):
        x=int((k*w/34+t*(25+k%5))%w)
        y=int((k*53+t*(54+k%7*6))%(h+75)-35)
        cv2.line(rain,(x,y),(x-5,y+17),(153,176,177),1,cv2.LINE_AA)
    cv2.addWeighted(img,.91,rain,.09,0,img)
    for k in range(3):
        xs=np.arange(0,w,8,dtype=np.float32)
        ys=(h*(.27+.056*k)+h*.023*math.sin(t*.19+k)+
             h*(.008+.019*amp)*np.sin(xs/w*8+t*(.47+.10*k)+k)).astype(np.int32)
        points=np.stack((xs.astype(np.int32),ys),axis=1)
        cv2.polylines(img,[points],False,[(153,183,189),(104,154,167),(168,192,186)][k],1,cv2.LINE_AA)
    length=(scenes[pos+1]["start"] if pos<len(scenes)-1 else duration)-scenes[pos]["start"]
    alpha=max(0,min(1,onset/1.1,(length-onset)/1.1))
    o=overlays[pos]
    if alpha>0:
        a=(o[:,:,3].astype(np.float32)/255*alpha)[:,:,None]
        bgr=o[:,:,:3][:,:,::-1]
        img=np.uint8(np.clip(img*(1-a)+bgr*a,0,255))
    if pos and onset<.85:
        mix=max(0,1-onset/.85)
        img=cv2.addWeighted(img,1-mix,bases[pos-1],mix,0)
    fade=min(1,max(0,t/1.5),max(0,(duration-t)/2.2))
    if fade<1:img=np.uint8(img*fade)
    return img

def poster(bases,poster_path):
    thumbnails=[]
    take=np.linspace(0,len(bases)-1,min(9,len(bases)),dtype=int)
    for i in take:
        thumbnails.append(cv2.resize(bases[int(i)],(320,180)))
    while len(thumbnails)%3:
        thumbnails.append(np.zeros_like(thumbnails[0]))
    grid=np.vstack([np.hstack(thumbnails[i:i+3]) for i in range(0,len(thumbnails),3)])
    if not cv2.imwrite(str(poster_path),grid):
        raise RuntimeError("Could not write contact sheet")

def render(args):
    audio=Path(args.audio).resolve()
    recipe_file=Path(args.recipe).resolve()
    out=Path(args.out).resolve()
    if not audio.is_file() or not recipe_file.is_file():
        raise ValueError("Missing input audio or recipe")
    if out in (audio,recipe_file):
        raise ValueError("Output must not overwrite source input")
    if out.exists() and not args.force:
        raise ValueError("Output exists; use a different filename or --force")
    recipe=json.loads(recipe_file.read_text(encoding="utf8"))
    full,streams=probe(audio)
    if not any(s.get("codec_type")=="audio" for s in streams):
        raise ValueError("Input has no audible stream")
    seconds=min(full,args.preview_seconds) if args.preview_seconds else full
    w,h,fps,palette,scenes=validate(recipe,full)
    if args.small:
        w,h,fps=640,360,12
    active=[s for s in scenes if s["start"]<seconds]
    bases,overlays=create_bases(active,w,h,palette,recipe["title"])
    energy=sample_energy(audio,seconds)
    out.parent.mkdir(parents=True,exist_ok=True)
    poster_path=out.with_name(out.stem+".contact.jpg")
    poster(bases,poster_path)
    nframes=max(1,int(math.ceil(seconds*fps)))
    cmd=["ffmpeg","-nostdin","-y","-v","error","-f","rawvideo","-pix_fmt","bgr24",
         "-s",f"{w}x{h}","-r",str(fps),"-i","pipe:0",
         "-i",str(audio),"-t",f"{seconds:.3f}",
         "-map","0:v:0","-map","1:a:0","-c:v","libx264",
         "-preset","veryfast","-crf","23","-pix_fmt","yuv420p","-c:a","aac",
         "-b:a","160k","-movflags","+faststart","-shortest",
         "-metadata","title="+recipe["title"],str(out)]
    cv2.setNumThreads(2)
    started=time.monotonic()
    proc=subprocess.Popen(cmd,stdin=subprocess.PIPE,stdout=subprocess.DEVNULL,
                          stderr=subprocess.PIPE)
    try:
        for n in range(nframes):
            frame=image_at(n/fps,bases,overlays,active,energy,w,h,seconds)
            proc.stdin.write(frame.tobytes())
        proc.stdin.close()
        err=proc.stderr.read()
        code=proc.wait()
        if code:
            raise RuntimeError(err.decode(errors="replace")[-1600:])
    except Exception:
        proc.kill()
        proc.wait()
        raise
    output_duration,output_streams=probe(out)
    vc=[s["codec_name"] for s in output_streams if s.get("codec_type")=="video"]
    ac=[s["codec_name"] for s in output_streams if s.get("codec_type")=="audio"]
    if vc!=["h264"] or ac!=["aac"] or not (seconds-1.0<=output_duration<=seconds+1):
        raise RuntimeError("Rendered media did not pass codec or duration verification")
    receipt={
        "schema":RECEIPT,
        "recipe":{"name":recipe_file.name,"sha256":sha256(recipe_file)},
        "audio":{"name":audio.name,"sha256":sha256(audio)},
        "video":{"name":out.name,"sha256":sha256(out),"width":w,"height":h,
                 "fps":fps,"durationSeconds":round(output_duration,3),
                 "videoCodec":"h264","audioCodec":"aac","bytes":out.stat().st_size},
        "poster":{"name":poster_path.name,"sha256":sha256(poster_path)},
        "production":{"engine":"TIMEBACK_FILM_001_PROCEDURAL_FFMPEG",
                      "scenes":len(active),"previewOnly":bool(args.preview_seconds),
                      "nativeHauntedToaster":False,"nativePlayDeck":False,
                      "transcriptionPerformed":False,
                      "audioTransferredToServer":False,
                      "externalPublication":False,
                      "elapsedSeconds":round(time.monotonic()-started,2)}
    }
    receipt_path=out.with_name(out.stem+".receipt.json")
    receipt_path.write_text(json.dumps(receipt,indent=2)+"\n",encoding="utf8")
    print(json.dumps({"video":str(out),"poster":str(poster_path),
                      "receipt":str(receipt_path),"duration":output_duration,
                      "engine":receipt["production"]["engine"]}))
    return receipt

def main():
    parser=argparse.ArgumentParser(description="Offline, configurable song-to-film renderer")
    parser.add_argument("--audio",required=True,help="Local rights-cleared song or audio file")
    parser.add_argument("--recipe",required=True,help="Local JSON scene/timing recipe")
    parser.add_argument("--out",required=True,help="Target MP4 path")
    parser.add_argument("--preview-seconds",type=float,
                        help="Create an explicitly labeled short preview, not full song")
    parser.add_argument("--small",action="store_true",help="Run on small hardware at 640x360 12fps")
    parser.add_argument("--force",action="store_true",help="Allow replacing previous output")
    a=parser.parse_args()
    if a.preview_seconds is not None and not (1<=a.preview_seconds<=600):
        parser.error("Preview must be 1 to 600 seconds")
    try:render(a)
    except (ValueError,RuntimeError,subprocess.CalledProcessError) as e:
        parser.exit(1,"HOLD — "+str(e)+"\n")

if __name__=="__main__":
    main()
