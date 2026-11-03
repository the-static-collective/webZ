from pathlib import Path
from playwright.sync_api import sync_playwright
page_url="http://127.0.0.1:8877/Abundent_Circuit_001_Offline.html"
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1280,'height':900},accept_downloads=True)
    errors=[]
    page.on('pageerror',lambda e: errors.append(str(e)))
    page.set_content(Path(__file__).parents[1].joinpath("Abundent_Circuit_001_Offline.html").read_text(), wait_until="load")
    page.get_by_role('button',name='Load fictional two-harbor demo').click()
    assert 'Fictional Fellowship Harbor' in page.locator('#nodeSelect').inner_text()
    page.get_by_role('tab',name='03 · Build & Grow').click()
    # Fill project acceptance
    page.locator('form[data-act=accept]').first.locator('[name=actor]').fill('Alice')
    page.locator('form[data-act=accept]').first.locator('[name=scope]').fill('One permitted fictional rehearsal with no money')
    page.locator('form[data-act=accept]').first.get_by_role('button').click()
    assert page.get_by_text('ACCEPTED').first.is_visible()
    # report
    page.locator('form[data-act=report]').first.locator('[name=actor]').fill('Alice')
    page.locator('form[data-act=report]').first.locator('[name=report]').fill('A fictional room was prepared, then restored')
    page.locator('form[data-act=report]').first.get_by_role('button').click()
    # confirm
    page.locator('form[data-act=confirm]').first.locator('[name=reviewer]').fill('Bob')
    page.locator('form[data-act=confirm]').first.locator('[name=capability]').fill('Reusable room setup checklist')
    page.locator('form[data-act=confirm]').first.get_by_role('button').click()
    assert page.get_by_text('Reusable room setup checklist').first.is_visible()
    # Crossing
    page.get_by_role('tab',name='04 · Crossings').click()
    page.locator('form[data-act=crossing] [name=note]').fill('Is your harbor interested in inspecting the plan?')
    page.locator('form[data-act=crossing]').get_by_role('button').click()
    page.get_by_role('button',name='Deliver in this browser (demo)').click()
    page.locator('#nodeSelect').select_option(label='Fictional Maker Workshop')
    print('INBOUND', page.locator('#inbound').inner_text(), 'NOTICE', page.locator('#notice').inner_text()); assert page.locator('#inbound .pill.held').first.is_visible()
    page.locator('form[data-act=decide] [name=reviewer]').fill('Maker review steward')
    page.locator('form[data-act=decide] [name=response]').fill('Can discuss, no commitment')
    page.locator('form[data-act=decide]').get_by_role('button').click()
    page.get_by_role('button',name='Return in this browser (demo)').click()
    page.locator('#nodeSelect').select_option(label='Fictional Fellowship Harbor')
    print('OUTBOUND',page.locator('#outbound').inner_text()); assert page.locator('#outbound .pill.done').first.is_visible()
    # Economy
    page.get_by_role('tab',name='05 · Economy').click()
    page.locator('#ecoType').select_option('money_out')
    page.locator('[name=description]').last.fill('Actual sample spending (fictional)')
    page.locator('#ecoAmount').fill('3.49')
    page.locator('form[data-act=economy]').get_by_role('button').click()
    assert page.get_by_text('$3.49').first.is_visible()
    # Real local compute
    page.get_by_role('tab',name='06 · Compute').click()
    page.locator('form[data-act=compute] textarea[name=input]').fill('one two three')
    page.locator('form[data-act=compute]').get_by_role('button').click()
    assert page.get_by_text('word count: 3').first.is_visible()
    # Cartridge
    page.get_by_role('tab',name='07 · Foundry').click()
    page.locator('form[data-act=cartridge] textarea[name=method]').fill('Ask permission; design a safe gathering; complete and debrief.')
    page.locator('form[data-act=cartridge] textarea[name=limitations]').fill('No venue, insurance, money or food safety inheres.')
    page.locator('form[data-act=cartridge]').get_by_role('button').click()
    assert page.get_by_text('Ask permission; design a safe gathering').first.is_visible()
    # screenshot artifact
    page.get_by_role('tab',name='01 · Dashboard').click()
    page.screenshot(path=str(Path(__file__).parents[1]/'preview.png'),full_page=True)
    assert not errors, errors
    print('PASS: browser full circuit, 7 navigation tabs, two harbors, review gates, crossings, money, local compute, cartridge; 0 JS errors')
    browser.close()
