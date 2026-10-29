"""TIMEBACK FILM 001: deterministic, public-safe illustrated scene vocabulary.

The visual vocabulary originated in a user-provided offline film experiment.
No reference audio, photographs, private data, or finished music video is distributed.
"""
import math
import numpy as np
import cv2

PALETTES = {
    "blue-dawn": ((9, 23, 34), (37, 83, 102), (167, 191, 185)),
    "amber-dawn": ((28, 30, 42), (89, 94, 103), (217, 180, 137)),
    "violet-evening": ((32, 21, 53), (80, 67, 107), (168, 151, 184)),
}

def _line(img, a, b, col, width=2):
    cv2.line(img, tuple(map(int, a)), tuple(map(int, b)), col, width, cv2.LINE_AA)

def _circle(img, p, r, col, thickness=-1):
    cv2.circle(img, tuple(map(int, p)), max(1, int(r)), col, thickness, cv2.LINE_AA)

def _ellipse(img, p, a, color, thickness=-1):
    cv2.ellipse(img, tuple(map(int, p)), tuple(map(int, a)), 0, 0, 360,
                color, thickness, cv2.LINE_AA)

def _poly(img, points, col):
    cv2.fillPoly(img, [np.array(points, dtype=np.int32)], col)

def _base(width, height, palette, rng):
    colors = PALETTES[palette]
    yy = np.linspace(0, 1, height, dtype=np.float32)[:, None, None]
    xx = np.linspace(-1, 1, width, dtype=np.float32)[None, :, None]
    top = np.array(colors[0], dtype=np.float32)[None, None, :]
    bottom = np.array(colors[1], dtype=np.float32)[None, None, :]
    glow = np.array(colors[2], dtype=np.float32)[None, None, :]
    diff = np.maximum(0, 1 - np.sqrt((xx*.85-.2)**2 + (yy-.28)**2))
    base = top*(1-yy) + bottom*yy + glow*diff*.30
    base = np.broadcast_to(base, (height,width,3)).copy()
    vignette = .68 + .32*np.maximum(0, 1 - xx[:,:,0]**2*.35 - (yy[:,:,0]-.4)**2)
    base *= vignette[:,:,None]
    grain = rng.normal(0, 2.8, (height,width,1))
    return np.uint8(np.clip(base+grain,0,255))[:,:,::-1].copy()

def _roof(img, w, h, rng):
    _poly(img, [(0,int(h*.67)),(int(w*.88),int(h*.38)),(w,int(h*.47)),(w,h),(0,h)], (45,63,77))
    for k in range(-8, 38):
        x=k*w/28
        _line(img,(x,h*.67-x*.32),(x+w*.2,h),(100,125,127),2)
    _line(img,(0,h*.66),(w*.88,h*.38),(158,182,178),5)
    for _ in range(45):
        x=int(rng.integers(0,w))
        y=int(rng.integers(0,max(1,int(h*.7))))
        _line(img,(x,y),(x-w*.006,y+h*.06),(121,157,165),1)

def _window(img, w, h, rng):
    a,b,c,d=int(w*.25),int(h*.08),int(w*.75),int(h*.88)
    cv2.rectangle(img,(a,b),(c,d),(19,31,40),-1)
    cv2.rectangle(img,(a+12,b+12),(c-12,d-12),(112,142,151),-1)
    treeline=[(a+12,d-70),(a+int(w*.06),d-97),(a+int(w*.12),d-84),
              (a+int(w*.18),d-108),(a+int(w*.24),d-87),(a+int(w*.31),d-105),
              (c-12,d-84),(c-12,d-12),(a+12,d-12)]
    _poly(img,treeline,(46,80,81))
    for _ in range(50):
        x=int(rng.integers(a+16,c-16));y=int(rng.integers(b+14,d-18))
        _line(img,(x,y),(x-4,y+int(rng.integers(8,32))),(185,201,192),1)
    cv2.rectangle(img,(a,b),(c,d),(26,36,40),max(6,w//95))
    cv2.rectangle(img,(int(w*.49),b),(int(w*.51),d),(25,43,48),-1)
    cv2.rectangle(img,(a,int(h*.49)),(c,int(h*.52)),(29,45,49),-1)
    for i in range(7):
        y=b+int(h*(.10+i*.07))
        _line(img,(a+18,y),(int(w*.49),y-9),(77,122,135),max(2,w//130))
        _line(img,(int(w*.52),y-8),(c-18,y-16),(78,125,133),max(2,w//130))

def _coffee(img,w,h,rng):
    cv2.rectangle(img,(0,int(h*.60)),(w,h),(50,65,77),-1)
    for i in range(22):
        y=int(h*(.62+.016*i))
        _line(img,(0,y),(w,y+3*math.sin(i)),(61,79,89),2)
    _ellipse(img,(w*.67,h*.78),(w*.15,h*.065),(31,45,54))
    _ellipse(img,(w*.67,h*.61),(w*.115,h*.16),(132,159,164))
    _ellipse(img,(w*.67,h*.60),(w*.095,h*.13),(191,198,184))
    _ellipse(img,(w*.67,h*.59),(w*.08,h*.105),(55,75,89))
    cv2.ellipse(img,(int(w*.38),int(h*.82)),(int(w*.11),int(h*.04)),0,0,290,(107,153,164),3,cv2.LINE_AA)
    _poly(img,[(w*.11,h*.58),(w*.18,h*.43),(w*.27,h*.47),(w*.31,h*.58),
               (w*.28,h*.69),(w*.29,h*.85),(w*.16,h*.86),(w*.15,h*.69)],(123,155,157))

def _hands(img,w,h,rng):
    _window(img,w,h,rng)
    _poly(img,[(0,h),(0,h*.79),(w*.20,h*.73),(w*.33,h*.81),
               (w*.49,h*.88),(w*.46,h*.94),(w*.28,h*.88),(w*.20,h)],(33,50,65))
    _poly(img,[(w,h),(w,h*.76),(w*.78,h*.73),(w*.64,h*.81),
               (w*.51,h*.88),(w*.54,h*.94),(w*.70,h*.89),(w*.77,h)],(34,54,70))
    _ellipse(img,(w*.50,h*.90),(w*.075,h*.038),(119,148,159))

def _rings(img,w,h,rng):
    for i in range(13):
        rx=w*(.08+i*.032);ry=h*(.04+i*.018)
        _ellipse(img,(w*.5,h*.5),(rx,ry),(67+i*3,95+i*4,110+i*4),1)
    for k in range(10):
        x=w*(.22+k*.063)
        _circle(img,(x,h*(.49+.07*math.sin(k*.86))),max(2,w//250),(146,175,181))

def _notes(img,w,h,rng):
    for i in range(5):
        y=h*(.41+i*.065)
        _line(img,(w*.08,y),(w*.93,y),(101,138,148),max(1,w//400))
    for k in range(15):
        x=w*(.10+k*.056)
        y=h*(.43+.04*math.sin(k*.83))
        _ellipse(img,(x,y),(w*.012,h*.013),(189,211,208))
        _line(img,(x+w*.01,y),(x+w*.01,y-h*.10),(189,211,208),2)

KINDS = {"roof":_roof,"window":_window,"coffee":_coffee,
         "hands":_hands,"rings":_rings,"notes":_notes}

def scene_image(kind, size, palette="blue-dawn", seed=0):
    if kind not in KINDS:
        raise ValueError("Unknown scene: "+str(kind))
    if palette not in PALETTES:
        raise ValueError("Unknown palette: "+str(palette))
    width,height=size
    if width<160 or height<90 or width>1920 or height>1080:
        raise ValueError("Resolution is outside safe limits")
    rng=np.random.default_rng(seed)
    img=_base(width,height,palette,rng)
    KINDS[kind](img,width,height,rng)
    return img
