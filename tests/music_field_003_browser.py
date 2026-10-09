"""Chromium: mocked OAuth consent; no real Google account or YouTube API used."""
import html,json,subprocess,urllib.parse,pathlib
from playwright.sync_api import sync_playwright
root=pathlib.Path(__file__).resolve().parents[1]
mock=r"""
import {createBridge} from './scripts/music-field-003-server.mjs';
import {SCOPE} from './scripts/music-field-003-core.mjs';
const upstream=async(raw)=>{
 const u=new URL(raw);
 if(u.hostname==='oauth2.googleapis.com'&&u.pathname==='/token')
  return Response.json({access_token:'fixture-only-test-token',token_type:'Bearer',scope:SCOPE,expires_in:3600});
 if(u.hostname==='oauth2.googleapis.com'&&u.pathname==='/revoke')return new Response('',{status:200});
 if(u.hostname==='www.googleapis.com'&&u.pathname.endsWith('/playlists'))
  return Response.json({items:[{id:u.searchParams.get('id')||'PL12345678901',snippet:{title:'Synthetic Music'},contentDetails:{itemCount:1}}]});
 if(u.hostname==='www.googleapis.com'&&u.pathname.endsWith('/playlistItems'))
  return Response.json({items:[{snippet:{title:'Witness Sound',videoOwnerChannelTitle:'Mock Artist',description:'DO_NOT_IMPORT'},
   contentDetails:{videoId:'abcDEF12345',videoPublishedAt:'2026-10-09T00:00:00Z'}}]});
 throw Error('FORBIDDEN_UPSTREAM');
};
const server=createBridge({clientId:'music-field-test-123456.apps.googleusercontent.com',fetchImpl:upstream});
console.log(await server.listen());
"""
node=subprocess.Popen(['node','--input-type=module','-e',mock],cwd=root,
 stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
url=node.stdout.readline().strip()
assert url.startswith('http://127.0.0.1:'),url
bad=[];unexpected=[];consents=[]
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True)
  page=browser.new_page(viewport={'width':390,'height':844})
  def google(route):
   u=urllib.parse.urlparse(route.request.url);q=urllib.parse.parse_qs(u.query)
   assert u.hostname=='accounts.google.com'
   assert q['scope'][0]=='https://www.googleapis.com/auth/youtube.readonly'
   assert q['code_challenge_method'][0]=='S256'
   consents.append(q['state'][0])
   callback=q['redirect_uri'][0]+'?'+urllib.parse.urlencode({'code':'FAKE_VALID_CODE','state':q['state'][0]})
   route.fulfill(status=200,content_type='text/html',body=
    '<h1>SIMULATED GOOGLE CONSENT</h1><a id="approve" href="'+html.escape(callback)+'">Approve mock only</a>')
  page.route('https://accounts.google.com/**',google)
  page.on('pageerror',lambda err:bad.append(str(err)))
  site=url.split('/worlds/music-field/')[0]
  page.on('request',lambda req:unexpected.append(req.url) if not (
   req.url.startswith(site) or req.url.startswith('blob:') or
   req.url.startswith('https://accounts.google.com/')) else None)
  page.goto(url)
  page.wait_for_function("()=>document.querySelector('#youtube-state').textContent.includes('Local Google OAuth configured')")
  assert page.locator('#count-all').inner_text()=='0'
  assert page.locator('#yt-playlists').is_disabled()
  page.locator('#yt-connect').click()
  page.get_by_role('heading',name='SIMULATED GOOGLE CONSENT').wait_for()
  page.locator('#approve').click()
  page.wait_for_url('**/worlds/music-field/#youtube=connected')
  page.wait_for_function("()=>document.querySelector('#youtube-state').textContent.includes('YouTube connected')")
  assert page.locator('#count-all').inner_text()=='0'
  page.locator('#yt-link').fill('https://youtube.com/playlist?list=PLmock-direct1&si=SHARE_TRACKER')
  page.locator('#yt-link-review').click()
  page.wait_for_function("()=>document.querySelector('#yt-choose').value==='PLmock-direct1'")
  assert page.locator('#yt-link').input_value()=='https://www.youtube.com/playlist?list=PLmock-direct1'
  assert page.locator('#count-all').inner_text()=='0'
  page.locator('#yt-select').click()
  page.wait_for_function("()=>document.querySelector('#yt-preview').textContent.includes('Witness Sound')")
  assert page.locator('#count-all').inner_text()=='0'
  page.locator('#yt-playlists').click()
  page.wait_for_function("()=>document.querySelectorAll('#yt-choose option').length===2")
  page.locator('#yt-choose').select_option('PL12345678901')
  page.locator('#yt-select').click()
  page.wait_for_function("()=>document.querySelector('#yt-preview').textContent.includes('Witness Sound')")
  assert 'DO_NOT_IMPORT' not in page.locator('#yt-preview').inner_text()
  assert page.locator('#count-all').inner_text()=='0'
  page.locator('#yt-import').click()
  page.wait_for_function("()=>document.querySelector('#count-youtube').textContent==='1'")
  assert page.locator('#count-all').inner_text()=='1'
  assert page.locator('#timeline svg').count()==1
  assert page.locator('#graph svg').count()==1
  assert page.locator('#snapshots option').count()==1
  page.locator('#yt-disconnect').click()
  page.wait_for_function("()=>document.querySelector('#youtube-state').textContent.includes('Google confirmed token revocation')")
  assert page.locator('#count-all').inner_text()=='1'
  assert page.locator('#yt-playlists').is_disabled()
  assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
  page.reload()
  assert page.locator('#count-all').inner_text()=='0'
  page.wait_for_function("()=>document.querySelector('#youtube-state').textContent.includes('Local Google OAuth configured')")
  assert len(consents)==1 and not bad and not unexpected,(consents,bad,unexpected)
  out=root/'evidence/browser';out.mkdir(parents=True,exist_ok=True)
  page.screenshot(path=str(out/'music-field-003-mobile.png'),full_page=True)
  print(json.dumps({'schema':'webz/music-field-003-browser/v0','mocked_google':True,
   'real_account_requests':0,'explicit_pkce':True,'playlist_selection':True,
   'preview_before_import':True,'pasted_share_link_verified':True,'share_tracking_discarded':True,'imported_records':1,'auto_saved':False,
   'disconnect_and_revocation':True,'reload_without_autoload':True,
   'mobile_390':True,'errors':bad},indent=2))
  browser.close()
finally:
 node.terminate()
 try:node.wait(timeout=5)
 except subprocess.TimeoutExpired:node.kill();node.wait()
