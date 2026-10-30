#!/usr/bin/env python3
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
units=json.loads((ROOT/'data/units.json').read_text(encoding='utf-8'))
exams=json.loads((ROOT/'data/exams.json').read_text(encoding='utf-8'))
assert len(units)==10
assert set(exams)=={'midterm','final'}
for cp, info in exams.items():
    assert info['minutes']==40, (cp,info['minutes'])
    assert set(info['papers'])=={'A','B'}
    for paper,qs in info['papers'].items():
        assert len(qs)==15,(cp,paper,len(qs))
        assert sum(q['points'] for q in qs)==100
        assert sum(q['points'] for q in qs if q['type']=='choice')==20
        assert sum(q['points'] for q in qs if q['type']=='fill')==20
        assert sum(q['points'] for q in qs if q['type']=='calc')==24
        assert sum(q['points'] for q in qs if q['type']=='application')==36
        ids=[q['id'] for q in qs]
        assert len(ids)==len(set(ids))
        for q in qs:
            assert q.get('prompt') and q.get('visual') and q.get('explain')
            if q['type']=='choice':
                assert len(q.get('options',[]))>=3 and isinstance(q.get('answer'),int)
            else:
                assert q.get('answers')
js=(ROOT/'assets/js/app.js').read_text(encoding='utf-8')
for token in ["selectCheckpoint('midterm')","selectCheckpoint('final')",'期中魔王檢核','期末魔王檢核','可預覽','examFormatRibbon','examRewardTarget','魔王星','warn10','warn5','warn1']:
    assert token in js, token
assert '🔒 先玩上一級' not in js
assert re.search(r'function levelUnlocked\(uid,l\)\{return true\}',js)
css=(ROOT/'assets/css/app.css').read_text(encoding='utf-8')
for token in ['challengeStage>.cardHead','color:#fffaf0','examCheckpointHero','examSectionTitle','scratchBox']:
    assert token in css,token
print('V08 CONTENT OK: 12-station map, unlocked A-D previews, 40-minute 100-point midterm/final A/B boss exams')
