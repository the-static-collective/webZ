from pathlib import Path
from playwright.sync_api import sync_playwright
p=Path(__file__).resolve().parents[1]
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,args=['--no-sandbox'],**({} if Path(pw.chromium.executable_path).exists() else {'executable_path':'/usr/bin/chromium'}))
    page=browser.new_page(viewport={'width':1280,'height':900},accept_downloads=True)
    errs=[]
    page.on('pageerror',lambda err:errs.append(str(err)))
    page.set_content((p/'Blueprint_Bridge_005_Offline.html').read_text(),wait_until='load')
    page.locator('#demo').click()
    print('status after demo:',page.locator('#status').inner_text())
    page.locator('#translate').click()
    print('status after translate:',page.locator('#status').inner_text())
    print('summary:',page.locator('#summary').inner_text()[:500])
    assert 'Draft only' not in page.locator('#summary').inner_text()
    assert 'Floor: 273' in page.locator('#summary').inner_text(),page.locator('#summary').inner_text()
    with page.expect_download() as d:
        page.locator('#exportMC').click()
    download=d.value
    download.save_as(p/'samples/demo-output.mcfunction')
    result=(p/'samples/demo-output.mcfunction').read_text()
    assert 'fill 0 69 0 20 69 0 minecraft:oak_planks keep' in result,result[:1000]
    assert 'minecraft:glass replace minecraft:stone_bricks' in result
    with page.expect_download() as d:
        page.locator('#exportJSON').click()
    d.value.save_as(p/'samples/demo-cartridge.json')
    page.screenshot(path=str(p/'samples/editor_screenshot.png'),full_page=True)
    print('page errors:',errs)
    assert errs==[],errs
    phone=browser.new_page(viewport={'width':390,'height':844})
    phone.set_content((p/'Blueprint_Bridge_005_Offline.html').read_text(),wait_until='load')
    phone.locator('#demo').click();phone.locator('#translate').click()
    overflow=phone.evaluate('document.documentElement.scrollWidth > window.innerWidth')
    print('phone horizontal overflow?',overflow)
    assert overflow is False
    browser.close()
print('PASS')
