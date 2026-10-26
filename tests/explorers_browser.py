"""WEBZ-035 — actual Chromium search, independent-source crossing, download and mobile witness."""
import json, os, pathlib, threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright, expect

ROOT=pathlib.Path(__file__).resolve().parents[1]
SITE=pathlib.Path(os.environ.get("WEBZ_TEST_SITE",ROOT))
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(SITE),**kwargs)
 def log_message(self,*args):pass

server=ThreadingHTTPServer(("127.0.0.1",0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
base=f"http://127.0.0.1:{server.server_port}"
results=[]
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True)
  for width in (1280,320):
   context=browser.new_context(viewport={"width":width,"height":880},accept_downloads=True,reduced_motion="reduce",service_workers="block")
   page=context.new_page()
   errors=[];requests=[]
   page.on("pageerror",lambda exc:errors.append(str(exc)))
   page.on("request",lambda req:requests.append(req.url))
   assert page.goto(base+"/becoming/").status==200
   expect(page.get_by_role("heading",level=1)).to_contain_text("An organization of organizations")
   assert page.evaluate("document.documentElement.scrollWidth<=innerWidth")
   assert page.goto(base+"/explore/").status==200
   expect(page.locator("#count")).to_contain_text("48 source doors")
   assert page.locator(".source-card").count()==48
   page.locator("#query").fill("cicada")
   expect(page.locator("#count")).to_contain_text("1 source door")
   page.locator("#query").fill("")
   page.locator("#lane").select_option("slice")
   expect(page.locator("#count")).to_contain_text("29 source doors")
   page.locator("#cards button").first.click()
   expect(page.locator("#selected-slice")).not_to_contain_text("Choose")
   page.locator("#lane").select_option("treasure")
   expect(page.locator("#count")).to_contain_text("19 source doors")
   page.locator("#cards button").first.click()
   expect(page.locator("#selected-treasure")).not_to_contain_text("Choose")
   page.locator("#lens").select_option("stewardship")
   page.locator("#generate").click()
   expect(page.locator("#proposal")).to_be_visible()
   expect(page.locator("#proposal-text")).to_contain_text("PROPOSAL != ADMISSION")
   expect(page.locator("#proposal-text")).to_contain_text("exact" if False else "Source (pinned)")
   with page.expect_download() as download:
    page.locator("#download").click()
   text=pathlib.Path(download.value.path()).read_text()
   assert "INVITATION" not in text or "Source (pinned)" in text
   assert "PROPOSED NEXT STEP" in text
   page.locator("#shuffle").click()
   expect(page.locator("#proposal")).to_be_visible()
   page.locator("#clear").click()
   expect(page.locator("#proposal")).to_be_hidden()
   assert page.evaluate("localStorage.length+sessionStorage.length")==0
   assert not errors,errors
   assert all(urlparse(u).netloc==urlparse(base).netloc for u in requests),requests
   assert page.evaluate("document.documentElement.scrollWidth<=innerWidth"),width
   assert page.goto(base+"/explore/slice/").status==200
   expect(page.locator("#count")).to_contain_text("29 source doors")
   assert page.goto(base+"/explore/treasure/").status==200
   expect(page.locator("#count")).to_contain_text("19 source doors")
   if (SITE/"for-computers/ideas/index.json").exists():
    assert page.goto(base+"/for-computers/ideas/index.json").status==200
    machine=json.loads(page.locator("body").inner_text())
    assert machine["editions"][0]["count"]==29
    assert machine["editions"][1]["count"]==19
   results.append({"width":width,"catalog":48,"localExport":True,"sourceEngines":2,"noRequestsOutsideHost":True})
   context.close()
  browser.close()
 print(json.dumps({"schema":"webz/idea-explorer-browser/v1","results":results},indent=2))
finally:
 server.shutdown()
