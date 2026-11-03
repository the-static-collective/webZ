#!/usr/bin/env python3
"""Loopback-only operator GUI for converting traced physical plans to Minecraft datapacks."""
from __future__ import annotations
import argparse
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
import json
from pathlib import Path
from urllib.parse import urlsplit
from blueprint_engine import PlanError,compile_plan,manifest,make_datapack

HERE=Path(__file__).resolve().parent
STATIC={'/':'index.html','/editor.js':'editor.js','/style.css':'style.css','/sample_floorplan.png':'sample_floorplan.png'}
TYPES={'html':'text/html; charset=utf-8','js':'text/javascript; charset=utf-8','css':'text/css; charset=utf-8','png':'image/png'}
MAX_POST=64000

class Handler(BaseHTTPRequestHandler):
    server_version='AbundentBlueprint/0.1'
    def headers_start(self,status=200,mime='application/json; charset=utf-8',n=0,extra=None):
        self.send_response(status)
        self.send_header('Content-Type',mime)
        self.send_header('Content-Length',str(n))
        self.send_header('X-Content-Type-Options','nosniff')
        self.send_header('X-Frame-Options','DENY')
        self.send_header('Referrer-Policy','no-referrer')
        self.send_header('Cache-Control','no-store')
        self.send_header('Cross-Origin-Resource-Policy','same-origin')
        self.send_header('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'")
        if extra:
            for k,v in extra.items():self.send_header(k,v)
        self.end_headers()
    def result(self,status,obj):
        data=json.dumps(obj,separators=(',',':'),ensure_ascii=False).encode('utf-8')
        self.headers_start(status,n=len(data));self.wfile.write(data)
    def _allowed_host(self):
        host=self.headers.get('Host','').lower()
        return host in {'127.0.0.1:'+str(self.server.server_port),'localhost:'+str(self.server.server_port)}
    def _allowed_origin(self):
        origin=self.headers.get('Origin','')
        return origin in {'http://127.0.0.1:'+str(self.server.server_port),'http://localhost:'+str(self.server.server_port)}
    def do_GET(self):
        if not self._allowed_host():return self.result(403,{'error':'Invalid Host'})
        path=urlsplit(self.path).path
        if path=='/api/health':return self.result(200,{'ready':True,'loopback_only':True,'mode':'manual-measured-blueprint-to-minecraft','automated_game_writes':False})
        name=STATIC.get(path)
        if not name:return self.result(404,{'error':'Unknown resource'})
        source=HERE/name
        if not source.is_file():return self.result(404,{'error':'Missing installed resource'})
        data=source.read_bytes()
        self.headers_start(200,TYPES[source.suffix[1:]],len(data));self.wfile.write(data)
    def do_POST(self):
        if not self._allowed_host() or not self._allowed_origin():return self.result(403,{'error':'Request must originate from local Blueprint Foundry'})
        if self.path!='/api/build':return self.result(404,{'error':'Unknown endpoint'})
        ct=self.headers.get('Content-Type','').split(';')[0].strip()
        if ct!='application/json':return self.result(415,{'error':'JSON only'})
        try:
            length=int(self.headers.get('Content-Length','-1'))
            if not 1<=length<=MAX_POST:return self.result(413,{'error':'Plan JSON exceeds 64 KB or is empty'})
            parsed=json.loads(self.rfile.read(length).decode('utf-8'))
            plan=compile_plan(parsed)
            archive=make_datapack(plan)
        except (ValueError,TypeError,UnicodeDecodeError,json.JSONDecodeError,PlanError) as exc:
            return self.result(422,{'error':str(exc)[:240]})
        self.headers_start(200,'application/zip',len(archive),{
            'Content-Disposition':'attachment; filename="Abundent_Blueprint_Java_26.1.1.zip"',
            'X-Blueprint-Source-SHA256':plan.plan_hash,
            'X-Blueprint-Command-Count':str(len(plan.commands))})
        self.wfile.write(archive)
    def log_message(self,fmt,*args):
        # Do not log source blueprints, names or payload.
        print('[blueprint] '+fmt%(args))


def serve(port):
    assert 1024<=port<=65535
    httpd=ThreadingHTTPServer(('127.0.0.1',port),Handler)
    print('Blueprint Foundry listening only at http://127.0.0.1:%d/'%port,flush=True)
    try:httpd.serve_forever()
    except KeyboardInterrupt:pass
    finally:httpd.server_close()

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--port',type=int,default=8890)
    args=p.parse_args();serve(args.port)
