from pathlib import Path
p=Path(__file__).parent
s=(p/'editor_template.html').read_text()
core=(p/'blueprint_core.js').read_text().replace('</script','<\\/script')
app=(p/'editor_app.js').read_text().replace('</script','<\\/script')
image='data:image/png;base64,'+(p/'samples/demo-blueprint.base64').read_text().strip()
s=s.replace('<script>/* CORE_BEGIN */</script>','<script>\n'+core+'\n</script>')
s=s.replace('<script>/* APP_BEGIN */</script>','<script>\nwindow.BLUEPRINT_SAMPLE_DATA="'+image+'";\n'+app+'\n</script>')
assert '/* CORE_BEGIN */' not in s and '/* APP_BEGIN */' not in s
(p/'Blueprint_Bridge_005_Offline.html').write_text(s)
print('Built standalone:',len(s),'bytes')
