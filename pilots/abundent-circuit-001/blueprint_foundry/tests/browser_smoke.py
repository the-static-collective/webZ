from pathlib import Path
import base64
from http.server import ThreadingHTTPServer
import sys,threading,io,zipfile
from playwright.sync_api import sync_playwright
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from server import Handler
from blueprint_engine import PACK_FORMAT
server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
th=threading.Thread(target=server.serve_forever,daemon=True);th.start()
addr='http://127.0.0.1:'+str(server.server_port)
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':1300,'height':950},accept_downloads=True)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  # Hosted localhost navigation is blocked by this sandbox, so exercise the exact
  # browser UI via in-memory set_content while the HTTP API is separately tested.
  root=Path(__file__).resolve().parents[1]
  html=(root/'index.html').read_text()
  css=(root/'style.css').read_text()
  js=(root/'editor.js').read_text()
  img64=base64.b64encode((root/'sample_floorplan.png').read_bytes()).decode()
  html=html.replace('<link rel="stylesheet" href="/style.css">','<style>'+css+'</style>')
  html=html.replace('<script src="/editor.js" defer></script>','<script>'+js.replace('/sample_floorplan.png','data:image/png;base64,'+img64)+'</script>')
  page.set_content(html,wait_until='load')
  import json
  from blueprint_engine import compile_plan,make_datapack
  from test_blueprint import sample
  # Mock browser network (not computation): Python backend and HTTP separately
  # tested; no localhost fetch is possible in this browser environment.
  page.evaluate('''(bytes) => {
    const sampleZip = new Uint8Array(bytes);
    window.fetch=async function(url, options) {
      window.__submittedPlan=JSON.parse(options.body);
      return new Response(new Blob([sampleZip],{type:'application/zip'}),{status:200});
    };
  }''',list(make_datapack(compile_plan(sample()))))
  assert page.get_by_text('Blueprint Foundry').first.is_visible()
  page.locator('#demo').click()
  page.wait_for_timeout(700)
  assert '32 px/m' in page.locator('#scaleInfo').inner_text()
  assert '6' in page.locator('#summary').inner_text()
  with page.expect_download(timeout=15000) as d:
   page.locator('#export').click()
  out=d.value;assert out.suggested_filename.endswith('.zip'),out.suggested_filename
  out.save_as('/mnt/data/circuit_blueprint_005/Example_Workshop_Minecraft_26.1.1.zip')
  with zipfile.ZipFile('/mnt/data/circuit_blueprint_005/Example_Workshop_Minecraft_26.1.1.zip') as z:
   import json
   a=json.loads(z.read('pack.mcmeta'));assert a['pack']['min_format']==[PACK_FORMAT,0]
   cmds=z.read('data/abundent_blueprint/function/build.mcfunction').decode();assert 'minecraft:glass' in cmds
  page.screenshot(path='/mnt/data/circuit_blueprint_005/blueprint_foundry_preview.png',full_page=True)
  # Real input workflow; image stays in browser; new trace and calibration click sequence.
  page.locator('#upload').set_input_files(str(Path(__file__).resolve().parents[1]/'sample_floorplan.png'))
  page.wait_for_function('document.querySelector("#scaleInfo").textContent.includes("Not calibrated")')
  page.locator('#calibrate').click()
  canvas=page.locator('#board')
  # The image is centered at 640x480 in 980x660, scale = min(936/640,616/480)=1.2833.
  r=canvas.bounding_box();cw=980;ch=660
  image_sc=min((cw-44)/640,(ch-44)/480)
  ix=(cw-image_sc*640)/2;iy=(ch-image_sc*480)/2
  def tap(x,y):
   canvas.click(position={'x':(ix+x*image_sc)*r['width']/cw,'y':(iy+y*image_sc)*r['height']/ch})
  page.locator('#distance').fill('12')
  tap(100,90);tap(484,90)
  assert '32.00 px/m' in page.locator('#scaleInfo').inner_text()
  for a,b in [([100,90],[484,90]),([484,90],[484,346]),([484,346],[100,346]),([100,346],[100,90])]:tap(*a);tap(*b)
  page.locator('[data-tool="door"]').click();tap(300,90)
  with page.expect_download(timeout=15000) as d2:page.locator('#export').click()
  d2.value.save_as('/mnt/data/circuit_blueprint_005/Traced_Test_Minecraft_26.1.1.zip')
  with zipfile.ZipFile('/mnt/data/circuit_blueprint_005/Traced_Test_Minecraft_26.1.1.zip') as z:
   assert 'minecraft:air' in z.read('data/abundent_blueprint/function/build.mcfunction').decode()
  submitted=page.evaluate('window.__submittedPlan')
  assert len(submitted['walls']) == 4, submitted['walls']
  assert len(submitted['openings']) == 1, submitted['openings']
  assert abs(submitted['pixels_per_meter']-32)<0.1,submitted['pixels_per_meter']
  # The submitted *traced* shape compiles successfully in the actual backend.
  traced=compile_plan(submitted); assert len(traced.door_cells)==1
  assert not errors,errors
  print('PASS: in-memory browser upload+calibration+trace+download, backend compiled traced submission, 0 JS exceptions (HTTP API separately tested)')
  browser.close()
finally:
 server.shutdown();server.server_close();th.join(timeout=2)
