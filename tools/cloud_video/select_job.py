#!/usr/bin/env python3
"""Select exactly one newly committed job; reject stale jobs."""
import os
import pathlib
import re
import subprocess
head = subprocess.check_output(["git","rev-parse","HEAD"],text=True).strip()
expected = os.environ.get("GITHUB_SHA","")
if head != expected:
    raise SystemExit("Checkout must match triggering commit")
changed = subprocess.check_output(["git","diff-tree","--no-commit-id","--name-only","-r","HEAD"],text=True).splitlines()
jobs = [p for p in changed if re.fullmatch("video_jobs/[a-z0-9_-]{1,64}[.]json", p)]
if len(jobs)!=1 or not pathlib.Path(jobs[0]).is_file():
    raise SystemExit("Expected exactly one new job in triggering commit; found "+str(jobs))
with open(os.environ["GITHUB_ENV"],"a",encoding="utf8") as f:
    f.write("KOSIF_JOB_FILE="+jobs[0]+chr(10))
print("Validated job file:", jobs[0])
