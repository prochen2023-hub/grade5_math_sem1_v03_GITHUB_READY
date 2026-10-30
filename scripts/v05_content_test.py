#!/usr/bin/env python3
import json, re, sys
from pathlib import Path
R=Path(__file__).resolve().parents[1]
units={u['id']:u for u in json.loads((R/'data/units.json').read_text(encoding='utf-8'))}
bank=json.loads((R/'data/practice.json').read_text(encoding='utf-8'))
errs=[]
expected={'u01':5,'u02':5,'u03':5,'u04':6,'u05':9}
for uid,n in expected.items():
    got=len(units[uid].get('today_lessons',[]))
    if got!=n: errs.append(f'{uid}: expected {n} concept cards, got {got}')
# Unit 4: 2 calc + 2 life for each of expand/reduce/common denominator.
for skill in ('擴分','約分','通分'):
    calc=sum(q['skill']==skill and q['type']=='concept' for q in bank['u04'])
    life=sum(q['skill']==skill and q['type']=='life' for q in bank['u04'])
    if calc<2 or life<2: errs.append(f'u04 {skill}: {calc} concept, {life} life')
# Unit 5: 10+ mixed-angle combinations and 5+ life questions.
mixed=sum(q['skill'] in ('複合角度','星型/交疊','飛鏢型') for q in bank['u05'])
if mixed<10: errs.append(f'u05 mixed angles only {mixed}')
if sum(q['type']=='life' for q in bank['u05'])<5: errs.append('u05 life questions < 5')
# Navigation must be real anchors.
idx=(R/'index.html').read_text(encoding='utf-8')
if idx.count('class="unitMap"')!=1 or idx.count('mode=chapter')<10: errs.append('semester map links missing')
if 'math.html?mode=today' not in idx: errs.append('today-task link missing')
if idx.count('focus=')<4: errs.append('feature shortcut links missing')
# App must include focused today mode and deep visuals.
app=(R/'assets/js/app.js').read_text(encoding='utf-8')
for token in ('renderToday','deepChapterHtml','placeValueDeepLab','roundingDeep','factorInverseDeep','infiniteMultiplesDeep','fractionWordsDeep','triangleInequalityDeep','interiorSumDeep','angleGalleryHtml'):
    if not re.search(rf'function\s+{token}\s*\(',app): errs.append(f'missing {token}()')
# Prevent known duplicate-control regressions from reused old lab functions.
for bad in ('factor_pairs:factorsLab','gcf_deep:gcfLab','multiple_line:multiplesLab','lcm_deep:lcmLab','sector_deep:sectorLab'):
    if bad in app: errs.append(f'duplicate-id router regression: {bad}')
if errs:
    print('V05 CONTENT TEST FAILED')
    for e in errs: print(' -',e)
    sys.exit(1)
print(f'V05 CONTENT TEST OK: 5 deep units, {sum(len(bank[u]) for u in expected)} first-five questions, {mixed} mixed-angle combinations')
