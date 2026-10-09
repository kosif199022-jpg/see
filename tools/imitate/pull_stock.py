#!/usr/bin/env python3
"""KOSIF imitation skill: fetch licensed Pexels footage, create limited clips.
Only fixed Pexels video IDs; no arbitrary external URL execution.
"""
import json,os,re,subprocess,sys,tempfile
from pathlib import Path
from urllib.parse import urlsplit
import requests
IDS=[8943207,7302971,35729265,35742929,20570351,31154474,8165467,5929430,13643577,35729239]
def ff(cmd):
 p=subprocess.run(cmd,capture_output=True,text=True,timeout=220)
 if p.returncode:raise RuntimeError(p.stderr[-500:])
def main():
 out=Path('output/stock');out.mkdir(parents=True,exist_ok=True)
 report=[]
 for idx,vid in enumerate(IDS):
  item={'id':vid,'url':f'https://www.pexels.com/video/{vid}/','license':'https://www.pexels.com/license/'}
  print(f'CLIP {idx+1}/{len(IDS)} Pexels {vid}',flush=True)
  try:
   with tempfile.TemporaryDirectory(prefix='pexels_') as tmp:
    raw=Path(tmp)/'input.mp4'
    url=f'https://www.pexels.com/download/video/{vid}/'
    with requests.get(url,headers={'User-Agent':'Mozilla/5.0 KOSIF-Research-Editor/1.0'},stream=True,timeout=30) as r:
     r.raise_for_status()
     host=urlsplit(r.url).hostname or ''
     if host not in ('videos.pexels.com','www.pexels.com'):
      raise ValueError(f'Redirect to untrusted domain {host}')
     total=0
     with raw.open('wb') as f:
      for chunk in r.iter_content(1024*256):
       if chunk:
        total+=len(chunk)
        if total>140*1024*1024:raise ValueError('Source exceeds 140 MB')
        f.write(chunk)
    target=out/f'pexels_{vid}.mp4'
    ff(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',str(raw),
      '-t','3.4','-an','-vf','scale=540:960:force_original_aspect_ratio=increase,crop=540:960,fps=24',
      '-c:v','libx264','-crf','26','-preset','veryfast','-pix_fmt','yuv420p','-movflags','+faststart',str(target)])
    if not target.exists() or target.stat().st_size<3000:raise ValueError('No encoded media')
    item.update({'status':'ok','bytes':target.stat().st_size,'file':target.name,'download_host':host})
   print('OK',item['file'],item['bytes'],flush=True)
  except Exception as e:
   item.update({'status':'failed','error':str(e)[:200]})
   print('FAILED',vid,repr(e)[:300],flush=True)
  report.append(item)
 (out/'sources.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
 n=sum(x['status']=='ok' for x in report)
 print('SUCCESS',n,'of',len(IDS),flush=True)
 if n<3:sys.exit('Not enough licensed clips downloaded')
if __name__=='__main__':main()
