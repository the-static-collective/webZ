"""Regression witnesses: explicit Remain and Erase prevail over delayed async work."""
import pathlib, threading, unittest
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[1]
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kw):super().__init__(*args,directory=str(ROOT),**kw)
 def log_message(self,*args):pass
class Races(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.server=ThreadingHTTPServer(('127.0.0.1',0),Handler);threading.Thread(target=cls.server.serve_forever,daemon=True).start()
  cls.base=f'http://127.0.0.1:{cls.server.server_port}/';cls.p=sync_playwright().start();cls.browser=cls.p.chromium.launch()
 @classmethod
 def tearDownClass(cls):cls.browser.close();cls.p.stop();cls.server.shutdown();cls.server.server_close()
 def setUp(self):
  self.context=self.browser.new_context(service_workers='block');self.page=self.context.new_page();self.page.goto(self.base+'worlds/sanctuary/')
  self.page.get_by_label('Keep this non-sensitive local trace').check()
 def tearDown(self):self.context.close()
 def test_remain_cancels_delayed_crossing(self):
  page=self.page
  page.evaluate('''()=>{const original=window.fetch;window.fetch=async(...args)=>{await new Promise(resolve=>window.releaseFetch=resolve);const r=await original(...args);window.fetchSettled=true;return r;};}''')
  page.get_by_role('button',name='Inspect door').click();page.get_by_role('button',name='Cross to Orchard').click()
  page.wait_for_function('()=>typeof window.releaseFetch === "function"')
  page.get_by_role('button',name='Remain here').click()
  page.evaluate('()=>window.releaseFetch()')
  page.wait_for_function("()=>window.fetchSettled === true || location.pathname.endsWith('/orchard/')",timeout=3000)
  self.assertTrue(page.url.endswith('/sanctuary/'), 'Remain must prevent delayed navigation')
  # If the continuation incorrectly navigates, this cancellation message never exists.
  page.wait_for_function('()=>document.querySelector("#door-status")?.textContent.includes("cancelled")',timeout=2000)
  self.assertTrue(page.url.endswith('/sanctuary/'))
  projection=page.evaluate('''async()=>{const {project}=await import('/app/model.mjs');return project(JSON.parse(localStorage.getItem('webz.observations.v0')))}''')
  self.assertEqual(projection['arrivals'],0);self.assertIsNone(projection['pending_departure'])
 def test_erase_invalidates_pending_export(self):
  page=self.page;page.get_by_role('button',name='Inspect door').click()
  page.evaluate('''()=>{const original=crypto.subtle.digest.bind(crypto.subtle);crypto.subtle.digest=async(...args)=>{await new Promise(resolve=>window.releaseDigest=resolve);const result=await original(...args);window.digestSettled=true;return result;};}''')
  page.get_by_role('button',name='Review trace export').click();page.wait_for_function('()=>typeof window.releaseDigest === "function"')
  page.get_by_role('button',name='Erase local trace').click();page.evaluate('()=>window.releaseDigest()')
  page.wait_for_function('()=>window.digestSettled === true')
  self.assertTrue(page.locator('#export-preview').is_hidden());self.assertTrue(page.locator('#download-trace').is_hidden())
  self.assertIsNone(page.evaluate("localStorage.getItem('webz.observations.v0')"))
 def test_erase_invalidates_pending_import(self):
  page=self.page
  page.evaluate('''()=>{const original=crypto.subtle.digest.bind(crypto.subtle);crypto.subtle.digest=async(...args)=>{await new Promise(resolve=>window.releaseDigest=resolve);const result=await original(...args);window.digestSettled=true;return result;};}''')
  page.locator('#trace-file').set_input_files(str(ROOT/'evidence/browser/voyage.frozen.json'))
  page.wait_for_function('()=>typeof window.releaseDigest === "function"')
  page.get_by_role('button',name='Erase local trace').click();page.evaluate('()=>window.releaseDigest()')
  page.wait_for_function('()=>window.digestSettled === true')
  self.assertTrue(page.locator('#import-preview').is_hidden());self.assertTrue(page.locator('#restore-trace').is_hidden())
if __name__=='__main__':unittest.main(verbosity=2)
