"""Read-only public HTTP/TLS/header/404 witness. TLS checks remain enabled."""
import datetime,json,pathlib,subprocess,sys,tempfile
base=sys.argv[1].rstrip('/')
output=pathlib.Path(sys.argv[2]) if len(sys.argv)>2 else None
if not base.startswith('https://'):raise SystemExit('HTTPS_REQUIRED')
def inspect(path):
 with tempfile.TemporaryDirectory(prefix='webz-https-') as d:
  headers=pathlib.Path(d)/'headers';body=pathlib.Path(d)/'body'
  raw=subprocess.check_output(['curl','--proto','=https','--max-time','25','--silent','--show-error','--dump-header',str(headers),'--output',str(body),'--write-out','%{http_code} %{ssl_verify_result} %{http_version}',base+path],text=True)
  code,verified,version=raw.split();assert verified=='0',raw
  values={}
  for line in headers.read_text().splitlines():
   if ':' in line:
    key,value=line.split(':',1);values[key.lower()]=value.strip()
  return {'path':path,'status':int(code),'sslVerifyResult':int(verified),'httpVersion':version,'headers':{k:values[k] for k in ['content-type','content-security-policy','strict-transport-security','x-content-type-options','referrer-policy','cache-control','location'] if k in values}},body.read_bytes()
routes=[]
for route in ['/','/field/','/field/navigate/','/press/','/forage/','/glean/','/worlds/sanctuary/','/worlds/orchard/','/sw.js','/app/navigator.mjs','/release.json','/manifest.webmanifest']:
 r,_=inspect(route);assert r['status']==200,r
 assert r['headers'].get('x-content-type-options')=='nosniff',r
 assert r['headers'].get('referrer-policy')=='no-referrer',r
 csp=r['headers'].get('content-security-policy','');assert "connect-src 'self'" in csp and "object-src 'none'" in csp,r
 assert 'max-age=' in r['headers'].get('strict-transport-security',''),r
 routes.append(r)
for route in ['/unissued-release-route/','/worlds/music-field/','/worlds/suno-atlas/','/worlds/wandering-lens/','/census/static-web-002/inputs.json','/tests/fixtures/glean-orchard-example.json','/docs/ABUNDENT-LAUNCH-001.md','/.git/config','/vercel.json']:
 r,_=inspect(route)
 # Vercel normalizes extensionless paths before filesystem 404 handling.
 if r['status']==308:
  assert r['headers'].get('location')==route+'/',r;routes.append(r)
  r,_=inspect(route+'/')
 assert r['status']==404,r;routes.append(r)
manifest=json.loads(inspect('/release.json')[1])
result={'schema':'webz/public-https-witness/v0','at':datetime.datetime.now(datetime.UTC).isoformat(),'base':base,'sourceCommit':manifest['sourceCommit'],'tlsScope':'curl verified TLS through configured outbound trust/proxy; direct origin leaf certificate not captured','routes':routes}
if base=='https://abundent.org':
 base='https://www.abundent.org';redirects=[]
 for path in ['/','/field/','/field/navigate/']:
  r,_=inspect(path);assert r['status']==308 and r['headers'].get('location')=='https://abundent.org'+path,r;redirects.append(r)
 result['wwwRedirects']=redirects
if output:output.parent.mkdir(parents=True,exist_ok=True);output.write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'base':result['base'],'sourceCommit':result['sourceCommit'],'routes':len(routes),'sslVerifyResult':0,'wwwRedirects':len(result.get('wwwRedirects',[]))},indent=2))
