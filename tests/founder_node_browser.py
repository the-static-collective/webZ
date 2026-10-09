"""Founder Node 003 actual Chromium signature verification, nested base and no upload."""
import json
import pathlib
import subprocess
import threading
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[1]
JS=r"""
import {fresh,emptyJournal,holdReflection} from './worlds/wandering-lens/model.mjs';
import {emptyAnnex,proposeAnnex,inspectProposal,disposeProposal,exportAnnex} from './worlds/wandering-lens/annex.mjs';
import {newIdentity,candidatePetition,founderAdmission,ownerAcceptance,makeBundle,ownerWithdrawal,ACK} from './founder-node/founder.mjs';
const owner=newIdentity(),founder=newIdentity();
const j=holdReflection(emptyJournal(),fresh(),'A private answer withheld from all public founding papers.');
let l=await proposeAnnex(emptyAnnex(),j,1,'WORLD_SKETCH','First Friend World','An owner-directed visitor seed.');
l=await inspectProposal(l,j,'wl2-001');l=await disposeProposal(l,j,'wl2-001','ADMIT');
const exported=await exportAnnex(l,j);
const p=await candidatePetition(exported,'wl2-001',owner.privatePem);
const a=founderAdmission(p,owner.public,founder.privatePem,ACK);
const x=ownerAcceptance(p,a,owner.privatePem,founder.public);
const bundle=makeBundle(p,a,x);
const withdrawal=ownerWithdrawal(bundle,owner.privatePem,founder.public);
console.log(JSON.stringify({bundle,owner:owner.public,founder:founder.public,withdrawal}));
"""
proc=subprocess.run(['node','--input-type=module','-e',JS],cwd=ROOT,capture_output=True,text=True,timeout=12)
assert proc.returncode==0,proc.stderr
files=json.loads(proc.stdout)
assert 'private answer' not in json.dumps(files).lower()
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kw):super().__init__(*args,directory=str(ROOT),**kw)
 def do_GET(self):
  if self.path.startswith('/nested/webZ/'):self.path=self.path[len('/nested/webZ'):]
  super().do_GET()
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{server.server_port}/nested/webZ/worlds/founder-node/'
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True)
  page=browser.new_page(viewport={'width':390,'height':844})
  outside=[];errors=[]
  page.on('request',lambda r:outside.append(r.url) if not r.url.startswith(url.split('/worlds/founder-node/')[0]) else None)
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(url)
  page.get_by_role('heading',name='One seed. Its own keys.').wait_for()
  assert page.locator('#proof').is_hidden()
  def load(id,data):
   page.locator('#'+id).set_input_files({'name':id+'.json','mimeType':'application/json','buffer':json.dumps(data).encode()})
  for id,value in [('bundle',files['bundle']),('candidate',files['owner']),('founder',files['founder'])]:load(id,value)
  page.locator('#verify').click()
  page.wait_for_function("()=>document.querySelector('#message').textContent.includes('Verified key custody')")
  assert page.locator('#proof').is_visible()
  assert 'ACTIVE_LOCAL_EXPERIMENTAL' in page.locator('#disposition').inner_text()
  assert page.locator('#worldid').inner_text().startswith('webz:founder-lab/')
  assert 'First Friend World' in page.locator('#title').inner_text()
  assert page.evaluate('localStorage.length')==0
  load('withdrawal',files['withdrawal']);page.locator('#verify').click()
  page.wait_for_function("()=>document.querySelector('#disposition').textContent.includes('OWNER_WITHDRAWN_LOCAL')")
  page.locator('#clear').click()
  assert page.locator('#proof').is_hidden()
  load('bundle',files['bundle']);load('candidate',files['founder']);load('founder',files['owner'])
  page.locator('#verify').click()
  page.wait_for_function("()=>document.querySelector('#message').textContent.includes('HOLD')")
  assert page.locator('#proof').is_hidden()
  page.locator('#clear').click()
  forged=json.loads(json.dumps(files['bundle']))
  forged['petition']['body']['world']['title']='Forged title'
  load('bundle',forged);load('candidate',files['owner']);load('founder',files['founder'])
  page.locator('#verify').click()
  page.wait_for_function("()=>document.querySelector('#message').textContent.includes('HOLD')")
  assert page.locator('#proof').is_hidden()
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  assert not outside,outside
  assert not errors,errors
  print(json.dumps({'schema':'webz/founder-browser-witness/v0','local_crypto':'Ed25519',
   'active_chain_verified':True,'signed_owner_withdrawal':True,'wrong_pins_denied':True,
   'tampered_petition_denied':True,'media_or_remote_requests':0,'local_storage_items':0,
   'mobile_390px':True},indent=2))
  browser.close()
finally:server.shutdown()
