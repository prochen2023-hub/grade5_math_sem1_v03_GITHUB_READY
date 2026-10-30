#!/usr/bin/env python3
"""Lightweight repository validation for GitHub Actions. Standard library only."""
from __future__ import annotations
import json, re, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
errors=[]

def load_json(rel):
    try:
        return json.loads((ROOT/rel).read_text(encoding='utf-8'))
    except Exception as e:
        errors.append(f'{rel}: JSON 讀取失敗: {e}')
        return None

def check_mc(obj,label):
    for k in ('q','options','answer','explain'):
        if k not in obj: errors.append(f'{label}: 缺少 {k}')
    opts=obj.get('options',[]); ans=obj.get('answer')
    if not isinstance(opts,list) or len(opts)<2: errors.append(f'{label}: options 至少 2 個')
    if not isinstance(ans,int) or not (0 <= ans < len(opts)): errors.append(f'{label}: answer 超出 options 範圍')

units=load_json('data/units.json') or []
bank=load_json('data/practice.json') or {}
if len(units)!=10: errors.append(f'units.json: 預期 10 章，實際 {len(units)}')
seen=set()
required=('id','title','hook','draw_first','goals','keywords','story','mission','pitfall','why','say','badge','task','warmup','worked','error_clinic','memory','challenge','lab','mini')
for u in units:
    uid=u.get('id','?')
    for k in required:
        if k not in u: errors.append(f'{uid}: 缺少 {k}')
    check_mc(u.get('task',{}),f'{uid}.task')
    check_mc(u.get('warmup',{}),f'{uid}.warmup')
    check_mc(u.get('error_clinic',{}),f'{uid}.error_clinic')
    check_mc(u.get('challenge',{}),f'{uid}.challenge')
    if len(u.get('worked',{}).get('steps',[]))<3: errors.append(f'{uid}.worked: steps 至少 3 步')
    qs=bank.get(uid,[])
    if len(qs)!=10: errors.append(f'{uid}: 練習題預期 10 題，實際 {len(qs)}')
    life=sum(q.get('type')=='life' for q in qs)
    if life < 5: errors.append(f'{uid}: 生活題少於 5 題')
    for q in qs:
        qid=q.get('id','?')
        if qid in seen: errors.append(f'題目 ID 重複: {qid}')
        seen.add(qid)
        for k in ('type','text','options','answer','explain','skill','difficulty','hint','wrong_tip'):
            if k not in q: errors.append(f'{qid}: 缺少 {k}')
        if q.get('type') not in ('life','concept'): errors.append(f'{qid}: type 不合法')
        opts=q.get('options',[]); ans=q.get('answer')
        if not isinstance(ans,int) or not isinstance(opts,list) or not (0 <= ans < len(opts)): errors.append(f'{qid}: answer 超出範圍')

# Interactive lab routing and inline handler coverage.
app=(ROOT/'assets/js/app.js').read_text(encoding='utf-8')
main_labs={'decimal','factors','multiples','fraction_equiv','polygon','fraction_add','symmetry','operations','area','solids'}
mini_labs={'decimal_compare','gcf','lcm','common_den','sector','fraction_strip','mirror_point','distributive','triangle_area','net'}
for u in units:
    uid=u.get('id','?')
    if u.get('lab') not in main_labs: errors.append(f"{uid}: lab 未對應互動圖 {u.get('lab')}")
    if u.get('mini') not in mini_labs: errors.append(f"{uid}: mini 未對應小實驗 {u.get('mini')}")
for fn in ('mainLab','miniLab'):
    if not re.search(rf'function\s+{fn}\s*\(',app): errors.append(f'app.js: 缺少必要函式 {fn}()')
handlers=set(re.findall(r'on(?:click|input)=\"([A-Za-z_$][\w$]*)\s*\(',app))
for fn in sorted(handlers):
    declared=(re.search(rf'function\s+{re.escape(fn)}\s*\(',app) or re.search(rf'window\.{re.escape(fn)}\s*=',app))
    if not declared: errors.append(f'app.js: inline handler {fn}() 沒有定義')


# Version consistency.
try:
    version=(ROOT/'VERSION').read_text(encoding='utf-8').strip()
    cfg=load_json('data/config.json') or {}
    if cfg.get('version') != version: errors.append(f"VERSION {version} 與 config.json {cfg.get('version')} 不一致")
    for rel in ('index.html','math.html','admin-progress.html'):
        if version not in (ROOT/rel).read_text(encoding='utf-8'):
            errors.append(f'{rel}: 未顯示目前版本 {version}')
except Exception as e:
    errors.append(f'版本檢查失敗: {e}')

# Local HTML refs: ignore anchors, mailto, http(s), inline JS.
for rel in ('index.html','math.html','admin-progress.html','404.html'):
    text=(ROOT/rel).read_text(encoding='utf-8')
    for attr,target in re.findall(r'\b(src|href)=["\']([^"\']+)["\']',text):
        if target.startswith(('#','http://','https://','mailto:','javascript:')): continue
        clean=target.split('?',1)[0].split('#',1)[0]
        if clean and not (ROOT/clean).exists(): errors.append(f'{rel}: {attr} 指向不存在檔案 {target}')

if errors:
    print('VALIDATION FAILED')
    for e in errors: print(' -',e)
    sys.exit(1)
print(f'VALIDATION OK: {len(units)} units, {sum(len(v) for v in bank.values())} practice questions, {len(seen)} unique question IDs')
