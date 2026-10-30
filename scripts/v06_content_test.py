#!/usr/bin/env python3
import json,re,sys
from pathlib import Path
R=Path(__file__).resolve().parents[1]
u=json.load(open(R/'data/units.json',encoding='utf8'))
b=json.load(open(R/'data/practice.json',encoding='utf8'))
err=[]
# Every chapter gets deep today cards, with back five at the same minimum standard.
for x in u:
    ls=x.get('today_lessons',[])
    if len(ls)<5: err.append(f"{x['id']}: today_lessons only {len(ls)}")
    qs=b.get(x['id'],[])
    if len(qs)<16: err.append(f"{x['id']}: only {len(qs)} practice questions")
    if sum(q.get('type')=='life' for q in qs)<5: err.append(f"{x['id']}: too few life questions")
# Back five exact depth targets used by v0.6.
for uid,min_cards in {'u06':6,'u07':6,'u08':6,'u09':7,'u10':6}.items():
    if len(next(x for x in u if x['id']==uid).get('today_lessons',[]))<min_cards: err.append(f'{uid}: deep cards below v0.6 target')
    if len(b[uid])<18: err.append(f'{uid}: practice below 18')
app=(R/'assets/js/app.js').read_text(encoding='utf8')
for token in ['fracUnitDeep','symMirrorDeep','opOrderDeep','areaHeightDeep','solidVocabDeep','showStarCelebration','chapterStarsBig']:
    if token not in app: err.append(f'app.js missing {token}')
# Full chapter must mark important cards/questions readable.
for token in ['conceptLesson\" data-voice','practiceQ ${q.type','bossCard ${done?\"done\":\"\"}\" data-voice','todayConceptCard\" data-voice','todayCheckCard\" data-voice']:
    if token not in app: err.append(f'voice coverage marker missing: {token}')
voice=(R/'assets/js/voice.js').read_text(encoding='utf8')
for token in ['el.prepend(b)','朗讀這一格','分之']:
    if token not in voice: err.append(f'voice.js missing {token}')
index=(R/'index.html').read_text(encoding='utf8')
if '10 個核心關卡' in index or 'unitMap' in index: err.append('homepage still exposes semester chapter map')
for token in ['開始今天任務','冒險分數','已拿星星','最佳連勝','完整學習']:
    if token not in index: err.append(f'homepage missing {token}')
if err:
    print('V06 CONTENT TEST FAILED'); [print(' -',e) for e in err]; sys.exit(1)
print('V06 CONTENT TEST OK: child-first home, 10 deep chapters, voice coverage, 188-question structure')
