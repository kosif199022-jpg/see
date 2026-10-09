#!/usr/bin/env python3
"""KOSIF free hosted render: bounded safe presets only, no arbitrary user Python."""
import argparse, hashlib, json, math, subprocess
from pathlib import Path
from PIL import Image, ImageDraw

def frame(t,w,h,seconds):
    im=Image.new("RGB",(w,h));d=ImageDraw.Draw(im)
    for y in range(h):
        z=y/h
        d.line((0,y,w,y),fill=(round(11+7*(1-z)),round(82-50*z),round(153-80*z)))
    # daylight surface and moving rays
    for k in range(5):
        x=w*(.04+k*.16)+t*2.1
        d.polygon([(x,0),(x+w*.08,0),(x+w*.27,h*.77),(x+w*.09,h*.77)],fill=(30,103,150))
    d.polygon([(0,h*.87),(w*.4,h*.83),(w*.75,h*.88),(w,h*.85),(w,h),(0,h)],fill=(41,95,91))
    for j in range(22):
        x=w*(.1+.74*j/22)+w*.04*math.sin(t*.9+j*.4)
        y=h*(.24+(j%7)*.065)+h*.017*math.sin(t*2.5+j)
        rr=max(2,w*.013)
        c=[(254,200,102),(245,143,100),(124,214,196)][j%3]
        d.ellipse((x-rr*1.4,y-rr*.7,x+rr*1.4,y+rr*.7),fill=c)
        wag=math.sin(7*t+j)*rr*.4
        d.polygon([(x+rr,y),(x+rr*2,y-rr*.7+wag),(x+rr*2,y+rr*.7+wag)],fill=c)
        d.ellipse((x-rr,y-rr*.1,x-rr*.7,y+rr*.05),fill=(3,30,41))
    p=max(0,min(1,(t-seconds*.20)/(seconds*.66)))
    x=w*(1.22-.72*p);y=h*(.57+.04*math.sin(t*1.5));rr=w*.095
    d.ellipse((x-rr*1.6,y-rr*.4,x+rr*1.6,y+rr*.4),fill=(108,150,160))
    d.polygon([(x-rr*.2,y-rr*.2),(x+rr*.2,y-rr*.86),(x+rr*.55,y-rr*.2)],fill=(108,150,160))
    d.polygon([(x+rr*1.3,y),(x+rr*2.1,y-rr*.6+math.sin(t*4)*rr*.2),(x+rr*2.1,y+rr*.6+math.sin(t*4)*rr*.2)],fill=(108,150,160))
    d.ellipse((x-rr*.9,y-rr*.18,x-rr*.73,y-rr*.04),fill=(3,26,36))
    for i in range(30):
        xx=(i*83%w);yy=(i*57-int(t*(12+i%4*4)))%h
        d.ellipse((xx-2,yy-2,xx+2,yy+2),outline=(125,202,221))
    return im

def run():
    a=argparse.ArgumentParser()
    a.add_argument("--seconds",type=float,default=3)
    a.add_argument("--fps",type=int,default=24)
    a.add_argument("--width",type=int,default=480)
    a.add_argument("--height",type=int,default=270)
    a.add_argument("--scene",choices=["ocean-shark-day"],default="ocean-shark-day")
    a.add_argument("--output",default="output/kosif-demo.mp4")
    v=a.parse_args()
    if not (1<=v.seconds<=30 and 12<=v.fps<=30 and 160<=v.width<=1280 and 90<=v.height<=720 and v.width%2==0 and v.height%2==0):
        a.error("Invalid render limits")
    n=round(v.seconds*v.fps);duration=n/v.fps
    out=Path(v.output);out.parent.mkdir(parents=True,exist_ok=True)
    cmd=["ffmpeg","-hide_banner","-loglevel","error","-y","-f","rawvideo","-pixel_format","rgb24","-video_size",f"{v.width}x{v.height}","-framerate",str(v.fps),"-i","pipe:0","-f","lavfi","-i","sine=frequency=120:sample_rate=48000","-map","0:v","-map","1:a","-c:v","libx264","-pix_fmt","yuv420p","-preset","veryfast","-crf","23","-c:a","aac","-b:a","96k","-t",str(duration),"-movflags","+faststart",str(out)]
    p=subprocess.Popen(cmd,stdin=subprocess.PIPE,stderr=subprocess.PIPE)
    try:
        for i in range(n):
            p.stdin.write(frame(i/v.fps,v.width,v.height,duration).tobytes())
        p.stdin.close();err=p.stderr.read();p.wait()
        if p.returncode:raise RuntimeError(err.decode(errors="replace")[-1500:])
    except Exception:
        p.kill();p.wait();raise
    receipt={"status":"verified","scene":v.scene,"seconds":duration,"fps":v.fps,"frames":n,"resolution":[v.width,v.height],"sha256":hashlib.sha256(out.read_bytes()).hexdigest()}
    out.with_suffix(".json").write_text(json.dumps(receipt,indent=2))
    print(json.dumps(receipt))
if __name__=="__main__":run()
