#!/usr/bin/env python3
"""KOSIF C: controlled public-video download from Cinema C V32 workflow ideas."""
import hashlib, ipaddress, json, os, re, socket, subprocess, sys, tempfile
from pathlib import Path
from urllib.parse import urlsplit

CAP=150*1024*1024
MAX_DURATION=900
def run(args, timeout=270):
    return subprocess.run(args, capture_output=True, text=True, timeout=timeout)
def check_public_url(url):
    if not isinstance(url,str) or not (12<=len(url)<=2048) or any(ord(c)<33 for c in url):
        raise ValueError('Malformed URL')
    u=urlsplit(url)
    if u.scheme!='https' or not u.hostname or u.username or u.password or u.port not in (None,443):
        raise ValueError('Only public HTTPS without credentials or custom port')
    host=u.hostname.lower().rstrip('.')
    if host=='localhost' or host.endswith(('.local','.internal','.localhost')):
        raise ValueError('Internal host')
    addresses={s[4][0] for s in socket.getaddrinfo(host,443,type=socket.SOCK_STREAM)}
    if not addresses or not all(ipaddress.ip_address(a).is_global for a in addresses):
        raise ValueError('Non-public network blocked')
    return url
def inspect(path):
    z=run(['ffprobe','-v','error','-show_entries','format=duration,size:stream=codec_type,codec_name','-of','json',str(path)],30)
    if z.returncode: raise RuntimeError('ffprobe failed')
    x=json.loads(z.stdout)
    if not any(s.get('codec_type')=='video' for s in x.get('streams',[])):raise ValueError('No video track')
    if not 0<float(x['format']['duration'])<=MAX_DURATION+1:raise ValueError('Duration too long')
    return x
def main():
    if len(sys.argv)!=2:raise ValueError('Expect one JSON job path')
    job=sys.argv[1]
    if not re.fullmatch(r'video_jobs/[a-z0-9_-]{1,64}\.json',job):raise ValueError('Invalid job path')
    data=json.loads(Path(job).read_text())
    if not isinstance(data,dict) or set(data)!={'url'}:raise ValueError('Only url is accepted')
    url=check_public_url(data['url'])
    Path('output').mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='kosif-c-') as tmp:
        work=Path(tmp)
        for i,fmt in enumerate(['bv*[height<=720]+ba/b[height<=720]/best[height<=720]','b[height<=720]/best']):
            for p in work.iterdir():
                if p.is_file():p.unlink()
            cmd=['yt-dlp','--ignore-config','--no-playlist','--no-progress','--socket-timeout','20',
                 '--retries','2','--fragment-retries','2','--extractor-retries','1','--max-filesize','150M',
                 '-f',fmt,'--merge-output-format','mp4','-o',str(work/'video.%(ext)s'),'--',url]
            try:p=run(cmd,250)
            except subprocess.TimeoutExpired:continue
            media=[x for x in work.iterdir() if x.suffix.lower() in ('.mp4','.mkv','.webm','.mov')]
            if p.returncode==0 and len(media)==1 and 0<media[0].stat().st_size<=CAP:break
            if p.returncode!=0:
                print('DOWNLOAD_DIAGNOSTIC attempt '+str(i+1)+' return '+str(p.returncode)+' '+p.stderr[-850:],flush=True)
        else:raise RuntimeError('Video unavailable, protected, oversized or unsupported')
        src=media[0]
        inspect(src)
        dst=Path('output/KOSIF-C-Video.mp4')
        ff=run(['ffmpeg','-hide_banner','-loglevel','error','-nostdin','-y','-i',str(src),
                '-map','0:v:0','-map','0:a:0?','-vf',"scale='min(1280,iw)':'min(720,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2",
                '-c:v','libx264','-pix_fmt','yuv420p','-crf','24','-preset','veryfast',
                '-c:a','aac','-b:a','128k','-movflags','+faststart',str(dst)],400)
        if ff.returncode:raise RuntimeError('FFmpeg failed: '+ff.stderr[-400:])
    info=inspect(dst)
    if dst.stat().st_size>CAP:raise RuntimeError('Output exceeds 150MB')
    receipt={'status':'verified','duration':float(info['format']['duration']),
             'bytes':dst.stat().st_size,'sha256':hashlib.sha256(dst.read_bytes()).hexdigest(),
             'video_codec':next(s['codec_name'] for s in info['streams'] if s['codec_type']=='video'),
             'source_host':urlsplit(url).hostname,'iPhone_compatible':True}
    Path('output/KOSIF-C-Video-receipt.json').write_text(json.dumps(receipt,indent=2))
    print('KOSIF C public-video download verified: '+json.dumps(receipt))
if __name__=='__main__':main()
