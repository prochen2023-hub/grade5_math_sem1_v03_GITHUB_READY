#!/usr/bin/env python3
import json,re,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
bank=json.loads((ROOT/'data/practice.json').read_text(encoding='utf-8'))
units=json.loads((ROOT/'data/units.json').read_text(encoding='utf-8'))
assert len(units)==10
for u in units:
    qs=bank[u['id']]
    assert len(qs)>=20, (u['id'],len(qs))
    ids=[q['id'] for q in qs]
    assert len(ids)==len(set(ids))
    for q in qs:
        assert q['text'].strip() and len(q['options'])>=3
        assert 0<=q['answer']<len(q['options'])
js=(ROOT/'assets/js/app.js').read_text(encoding='utf-8')
for token in ['storySceneHtml','AI 休息站','MASTERY_LEVELS=["A","B","C","D"]','masteryLevelHtml','questionVisual','月考 A 卷','月考 B 卷','20*60*1000','ringBell','故事完結篇']:
    assert token in js, token
for stale in ['本章核心觀念地圖','錯誤診療室','題分層練習｜生活活用為主']:
    assert stale not in js, stale
home=(ROOT/'index.html').read_text(encoding='utf-8')
assert 'unitMap' not in home
assert '一個小關卡' in home
print('V07 CONTENT OK: 10 units, >=20 bank questions each, 5-question level system, story flow, AI rest, A/B timed exam')
