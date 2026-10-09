"""KOSIF CPU Render: safe job-spec parser; not a code executor."""
import json,os,re,sys,subprocess
from pathlib import Path

def load_event(p):
    e=json.loads(Path(p).read_text())
    files=e.get("head_commit",{}).get("added",[])+e.get("head_commit",{}).get("modified",[])
    git_changed=subprocess.check_output(['git','show','--pretty=format:','--name-only','HEAD'],text=True).splitlines()
    files=[f for f in (git_changed if git_changed else files) if re.fullmatch(r"render_jobs/[a-z0-9_-]{1,64}\.json",f)]
    if not files:
        return {"scene":"ocean-shark-day","seconds":3,"fps":24,"width":480,"height":270}
    if len(files)!=1:
        raise ValueError("Only one render job may be introduced per commit")
    d=json.loads(Path(files[0]).read_text())
    if not isinstance(d,dict) or set(d)-{"scene","seconds","fps","width","height"}:
        raise ValueError("Unknown or invalid parameters")
    scene=d.get("scene","ocean-shark-day")
    if scene!="ocean-shark-day":raise ValueError("Only allowlisted scenes permitted")
    seconds=d.get("seconds",3); fps=d.get("fps",24);w=d.get("width",480);h=d.get("height",270)
    if not (type(seconds) in (int,float) and 1<=seconds<=30):raise ValueError("Invalid duration")
    if not(type(fps) is int and 12<=fps<=30):raise ValueError("Invalid fps")
    if not(type(w) is int and 160<=w<=1280 and w%2==0):raise ValueError("Invalid width")
    if not(type(h) is int and 90<=h<=720 and h%2==0):raise ValueError("Invalid height")
    if w*h*fps*seconds>1280*720*30*30:raise ValueError("CPU work budget exceeded")
    return {"scene":scene,"seconds":seconds,"fps":fps,"width":w,"height":h}

if __name__=="__main__":
    d=load_event(os.environ["GITHUB_EVENT_PATH"])
    lines=[f"KOSIF_{k.upper()}={v}" for k,v in d.items()]
    with open(os.environ["GITHUB_ENV"],"a") as f:f.write("\n".join(lines)+"\n")
    print("Validated KOSIF render request: "+json.dumps(d))
