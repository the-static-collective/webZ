"""Abundent navigation composer: browser witness in Chromium, no server-side effects."""
import json, os, pathlib, threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright, expect

ROOT=pathlib.Path(__file__).resolve().parents[1]
SITE=pathlib.Path(os.environ.get('WEBZ_TEST_SITE',ROOT))
OUT=ROOT/'evidence/abundent-launch-001/composer'
OUT.mkdir(parents=True,exist_ok=True)

class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(SITE),**kwargs)
 def do_GET(self):
  if self.path.startswith('/nested/webZ/'):self.path=self.path[len('/nested/webZ'):]
  super().do_GET()
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}/'

def overflow(page):assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),page.url
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True)
 results=[]
 for prefix,width in [('',1200),('nested/webZ/',320)]:
  ctx=browser.new_context(viewport={'width':width,'height':880},reduced_motion='reduce',service_workers='block')
  errors=[];requests=[]
  ctx.on('request',lambda r:requests.append(r.url))
  page=ctx.new_page()
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.add_init_script("window.cspWitness=[];document.addEventListener('securitypolicyviolation',e=>window.cspWitness.push(e.violatedDirective))")
  url=base+prefix+'composer/'
  assert page.goto(url).status==200
  expect(page.locator('#status')).to_contain_text('A composed view')
  expect(page.locator('#inspector-title')).to_have_text('The garden workbench')
  assert page.locator('.object').count()>=3
  assert page.locator('.relation').count()>=2
  overflow(page)
  # Human selection changes the rendered context and the URL, not a source.
  page.get_by_role('button',name='The field',exact=True).click()
  assert page.get_by_role('button',name='The field',exact=True).get_attribute('aria-pressed')=='true'
  assert 'way=field' in page.url
  page.locator('#closer').fill('10')
  expect(page.locator('#closer-value')).to_have_text('10')
  assert page.locator('.object').count()>=8
  # Search must find a particular song by exact curated catalog, not matching guessed titles.
  page.locator('#find').fill('Midnight Phonk Blues')
  assert page.locator('#matches .result').count()>=1
  page.locator('#matches .result').first.click()
  expect(page.locator('#inspector-title')).to_have_text('Midnight Phonk Blues')
  assert 'song%3A5195c966' in page.url
  assert page.locator('#relations').get_by_text('exact ID membership').count()>=2
  assert page.locator('#door-link').get_attribute('href').startswith('https://suno.com/song/')
  # Independent cold replay reconstructs exact address and selection.
  cold=browser.new_context(viewport={'width':width,'height':880},service_workers='block')
  cp=cold.new_page();assert cp.goto(page.url).status==200
  expect(cp.locator('#status')).to_contain_text('A composed view')
  expect(cp.locator('#inspector-title')).to_have_text('Midnight Phonk Blues')
  cold.close()
  page.locator('#root').click()
  expect(page.locator('#inspector-title')).to_have_text('The garden workbench')
  # Browser local state isn't used as evidence or a secret store.
  assert page.evaluate('localStorage.length + sessionStorage.length')==0
  assert not page.evaluate('window.cspWitness')
  assert not errors,errors
  external=[u for u in requests if urlparse(u).netloc!=urlparse(base).netloc]
  assert not external,external
  overflow(page)
  page.screenshot(path=str(OUT/('composer-mobile.png' if width==320 else 'composer-desktop.png')),full_page=True)
  results.append({'base':prefix or '/','width':width,'graph':True,'songExactId':True,'replay':True,'csp':True,'storage':'none'})
  ctx.close()
 browser.close()
print(json.dumps({'schema':'abundent/door-composer-browser-witness/v1','results':results},indent=2))
server.shutdown()
