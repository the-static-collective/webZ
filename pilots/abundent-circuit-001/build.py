from pathlib import Path
p=Path(__file__).parent
html=(p/'index.html').read_text()
core=(p/'core.js').read_text()
app=(p/'app.js').read_text()
assert '/* CORE_BEGIN */' in html and '/* APP_BEGIN */' in html
html=html.replace('<script>/* CORE_BEGIN */</script>', '<script>\n'+core.replace('</script','<\\/script')+'\n</script>')
html=html.replace('<script>/* APP_BEGIN */</script>', '<script>\n'+app.replace('</script','<\\/script')+'\n</script>')
(p/'Abundent_Circuit_001_Offline.html').write_text(html)
print('Generated standalone offline HTML:',len(html),'chars')
