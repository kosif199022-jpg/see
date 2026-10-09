"""Secure render-job selector: commit message pins one exact JSON manifest."""
import json,os,re,subprocess
from pathlib import Path

DEFAULT={"scene":"ocean-shark-day","seconds":3,"fps":24,"width":480,"height":270}
MSG_RE=re.compile(r"^renderjob: (render_jobs/[a-z0-9_-]{1,64}\.json)$")

def load_event(event_file):
    event=json.loads(Path(event_file).read_text())
    msg=str(event.get("head_commit",{}).get("message") or "").strip()
    if not msg:
        msg=subprocess.check_output(["git","log","-1","--pretty=%s"],text=True).strip()
    m=MSG_RE.fullmatch(msg)
    if not m:
        return DEFAULT
    path=Path(m.group(1))
    if not path.is_file() or path.is_symlink():
        raise ValueError("Expected job manifest absent or unsafe")
    d=json.loads(path.read_text())
    if not isinstance(d,dict) or set(d)-{"scene","seconds","fps","width","height"}:
        raise ValueError("Invalid job shape")
    scene=d.get("scene","ocean-shark-day")
    sec=d.get("seconds",3)
    fps=d.get("fps",24)
    w=d.get("width",480)
    h=d.get("height",270)
    if scene!="ocean-shark-day":
        raise ValueError("Unsupported scene")
    if type(sec) not in (int,float) or not 1<=sec<=30:
        raise ValueError("Invalid duration")
    if type(fps) is not int or not 12<=fps<=30:
        raise ValueError("Invalid fps")
    if type(w) is not int or w%2 or not 160<=w<=1280:
        raise ValueError("Invalid width")
    if type(h) is not int or h%2 or not 90<=h<=720:
        raise ValueError("Invalid height")
    return {"scene":scene,"seconds":sec,"fps":fps,"width":w,"height":h}

if __name__=="__main__":
    spec=load_event(os.environ["GITHUB_EVENT_PATH"])
    with open(os.environ["GITHUB_ENV"],"a") as fp:
        fp.write("\n".join(f"KOSIF_{k.upper()}={v}" for k,v in spec.items())+"\n")
    print("Validated KOSIF render request: "+json.dumps(spec))
