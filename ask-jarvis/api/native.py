"""Preview-only HTTP gate for real ALEX, 3rdi and LOADOUT Python owners.

No NVIDIA model key is used; owner runtimes are executed in a separately
spawned, credential-scrubbed subprocess after a strict allowlisted source
fetch. No code execution or arbitrary repositories in request input.
"""
from __future__ import annotations

import json
import os
import re
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler

from native.bootstrap import execute_native

MAX_INPUT = 1200
CONTACT = re.compile(r"[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|(?:\+?1[- .]?)?\(?\d{3}\)?[- .]?\d{3}[- .]?\d{4}")

class handler(BaseHTTPRequestHandler):
    def _send(self, status, data):
        blob=json.dumps(data,ensure_ascii=False,separators=(",", ":")).encode()
        self.send_response(status)
        for k,v in [
            ("Content-Type","application/json; charset=utf-8"),
            ("Cache-Control","no-store"),
            ("X-Content-Type-Options","nosniff"),
            ("Referrer-Policy","no-referrer"),
        ]:self.send_header(k,v)
        self.send_header("Content-Length",str(len(blob)))
        self.end_headers()
        self.wfile.write(blob)

    def do_GET(self):
        self._send(405,{"error":"METHOD_NOT_ALLOWED"})

    def do_POST(self):
        if os.environ.get("VERCEL_ENV") != "preview" or os.environ.get("JARVIS_NATIVE_ENABLED") != "1":
            return self._send(503,{"schema":"ask-jarvis/native-owner-run/v1","status":"HOLD","reason":"NATIVE_PREVIEW_DISABLED"})
        try: length=int(self.headers.get("Content-Length","0"))
        except (ValueError,TypeError): length=0
        if not 1 <= length <= MAX_INPUT:
            return self._send(413,{"error":"REQUEST_SIZE_LIMIT"})
        try:
            data=json.loads(self.rfile.read(length))
            if not isinstance(data,dict) or set(data)!={"question","lens"} or data["lens"]!="triad":
                raise ValueError("BOUNDARY_SCHEMA")
            question=data["question"]
            if not isinstance(question,str) or not 8 <= len(question.strip()) <= 360 or CONTACT.search(question):
                raise ValueError("PRIVATE_OR_INVALID_QUESTION")
            if any(ord(c)<32 or ord(c)==127 for c in question):
                raise ValueError("CONTROL_CHARACTER")
        except (ValueError,UnicodeDecodeError,TypeError):
            return self._send(422,{"error":"INVALID_NATIVE_REQUEST"})
        payload=json.dumps({"question":question,"observedAt":datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00","Z")})
        try:
            code, output=execute_native(payload)
            result=json.loads(output)
            if code!=0 or result.get("schema")!="ask-jarvis/native-owner-run/v1" or result.get("mode")!="REAL_OWNER_KERNEL_INVOCATION":
                return self._send(503,{"schema":"ask-jarvis/native-owner-run/v1","status":"HOLD","reason":"NATIVE_KERNEL_REFUSED"})
            return self._send(200,result)
        except Exception:
            # Never leak private server file paths, credentials, host state
            # or unreviewed native stderr through a public endpoint.
            return self._send(503,{"schema":"ask-jarvis/native-owner-run/v1","status":"HOLD","reason":"NATIVE_RUNTIME_UNAVAILABLE"})
