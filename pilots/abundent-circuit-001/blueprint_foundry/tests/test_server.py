import io,json,sys,threading,unittest,urllib.error,urllib.request,zipfile
from http.server import ThreadingHTTPServer
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from server import Handler
from test_blueprint import sample

class Web(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
  cls.thread=threading.Thread(target=cls.server.serve_forever,daemon=True);cls.thread.start()
  cls.url='http://127.0.0.1:'+str(cls.server.server_port)
 @classmethod
 def tearDownClass(cls):cls.server.shutdown();cls.server.server_close();cls.thread.join(timeout=2)
 def api(self,body,origin=None,host=None):
  h={'Content-Type':'application/json','Origin':origin or self.url}
  if host:h['Host']=host
  req=urllib.request.Request(self.url+'/api/build',json.dumps(body).encode(),h,method='POST')
  try:
   with urllib.request.urlopen(req,timeout=3) as r:return r.status,r.read(),r.headers
  except urllib.error.HTTPError as e:return e.code,e.read(),e.headers
 def test_health(self):
  with urllib.request.urlopen(self.url+'/api/health') as res:
   self.assertTrue(json.loads(res.read())['loopback_only'])
 def test_export(self):
  status,data,h=self.api(sample());self.assertEqual(status,200)
  self.assertEqual(h['Content-Type'],'application/zip')
  with zipfile.ZipFile(io.BytesIO(data)) as z:self.assertIn('pack.mcmeta',z.namelist())
 def test_reject_cross_origin(self):
  status,data,_=self.api(sample(),origin='http://hostile.example');self.assertEqual(status,403)
 def test_reject_invalid_schema(self):
  data=sample();data['schema']='unknown'
  status,raw,_=self.api(data);self.assertEqual(status,422)
 def test_reject_untrusted_host(self):
  status,_,_=self.api(sample(),host='evil.site:1234');self.assertEqual(status,403)
 def test_reject_command_injection(self):
  data=sample();data['wall_block']='minecraft:stone_bricks\n/say injected'
  status,_,_=self.api(data);self.assertEqual(status,422)

if __name__=='__main__':unittest.main()
