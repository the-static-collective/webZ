"""NATIVE-009 private, fixed-commit download bridge for protected Vercel previews.

It deliberately supplies only Python owner modules to a subordinate Python
process with no project/model secrets in its environment. No arbitrary repo,
file URL, code path, or source-controlled execution choice accepts user input.
"""
from __future__ import annotations

import io
import os
from pathlib import Path, PurePosixPath
import stat
import subprocess
import sys
import tempfile
import urllib.request
import zipfile

from .triad_kernel import PINS

MAX_DOWNLOAD = 3_000_000
MAX_TOTAL_EXTRACT = 5_000_000
CACHE_ROOT = Path(tempfile.gettempdir()) / "jarvis-native-009-fixed-owner-pins"

def _allowed(name: str, relative: PurePosixPath) -> bool:
    parts=relative.parts
    if name == "alex":
        return len(parts)==2 and parts[0]=="alex_runtime" and parts[1].endswith(".py")
    if name == "rdi":
        return len(parts)>=4 and parts[:3]==("skills","3rdi","scripts") and (
            (len(parts)==4 and parts[-1].endswith(".py")) or
            (len(parts)==5 and parts[3]=="three_rdi" and parts[-1].endswith(".py")))
    if name == "loadout":
        return len(parts)>=3 and parts[0]=="src" and parts[1]=="loadout" and parts[-1].endswith(".py")
    return False

def _extract(name: str, target: Path) -> None:
    repo, commit = PINS[name]
    url=f"https://codeload.github.com/the-static-collective/{repo}/zip/{commit}"
    req=urllib.request.Request(url,headers={"Accept":"application/zip","User-Agent":"JARVIS-native-preview/009"})
    with urllib.request.urlopen(req,timeout=9) as response:
        if response.status != 200: raise RuntimeError("OWNER_FETCH_UNAVAILABLE")
        raw=response.read(MAX_DOWNLOAD+1)
        if len(raw)>MAX_DOWNLOAD:raise RuntimeError("OWNER_BUNDLE_TOO_LARGE")
    z=zipfile.ZipFile(io.BytesIO(raw))
    entries=[]; total=0
    for item in z.infolist():
        p=PurePosixPath(item.filename)
        if len(p.parts)<2:continue
        if p.parts[0]!=repo+"-"+commit:raise RuntimeError("OWNER_ARCHIVE_WRONG_PIN")
        rel=PurePosixPath(*p.parts[1:])
        if ".." in rel.parts or rel.is_absolute():raise RuntimeError("OWNER_ARCHIVE_PATH_REFUSED")
        if not _allowed(name,rel):continue
        if item.is_dir():continue
        mode=(item.external_attr >> 16) & 0o170000
        if mode not in (0,stat.S_IFREG):raise RuntimeError("OWNER_ARCHIVE_SPECIAL_FILE")
        total+=item.file_size
        if item.file_size>400_000 or total>MAX_TOTAL_EXTRACT:raise RuntimeError("OWNER_BUNDLE_EXPANSION_LIMIT")
        entries.append((item,rel))
    if not entries:raise RuntimeError("OWNER_BUNDLE_NO_NATIVE_CODE")
    for info,rel in entries:
        final=target.joinpath(*rel.parts)
        final.parent.mkdir(parents=True,exist_ok=True)
        blob=z.read(info)
        if len(blob)!=info.file_size:raise RuntimeError("OWNER_ARCHIVE_LENGTH_MISMATCH")
        final.write_bytes(blob)

def pinned_roots() -> dict[str,Path]:
    # Preview cache stores only exact pinned owner module copies. A failed fetch
    # never marks a partial tree as ready.
    roots={}
    for name,(_,commit) in PINS.items():
        target=CACHE_ROOT / (name+"-"+commit)
        complete=target/".native009-ready"
        if not complete.exists():
            target.mkdir(parents=True,exist_ok=True)
            _extract(name,target)
            complete.write_text(commit,encoding="ascii")
        roots[name]=target
    return roots

def execute_native(payload: str) -> tuple[int,str]:
    roots=pinned_roots()
    args=[sys.executable, "-B", str(Path(__file__).parent / "triad_kernel.py"),
          "--alex",str(roots["alex"]),"--rdi",str(roots["rdi"]),"--loadout",str(roots["loadout"])]
    # Intentionally withhold NVIDIA_API_KEY, gateway tokens, Vercel OIDC,
    # host credentials, arbitrary PATH, HOME and all inherited environment.
    safe_env={"PATH":"/usr/bin:/bin","LANG":"C.UTF-8",
              "PYTHONDONTWRITEBYTECODE":"1","PYTHONNOUSERSITE":"1"}
    def restrict():
        try:
            import resource
            resource.setrlimit(resource.RLIMIT_CPU,(7,7))
            resource.setrlimit(resource.RLIMIT_FSIZE,(1_000_000,1_000_000))
        except (OSError,ValueError):pass
    p=subprocess.run(args,input=payload,text=True,capture_output=True,timeout=13,
                     env=safe_env,cwd=str(CACHE_ROOT),check=False,preexec_fn=restrict)
    if len(p.stdout)>14_000:raise RuntimeError("OWNER_RECEIPT_TOO_LARGE")
    return p.returncode,p.stdout
