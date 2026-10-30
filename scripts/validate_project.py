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
    min_q={'u01':18,'u02':16,'u03':16,'u04':16,'u05':32,'u06':18,'u07':18,'u08':18,'u09':18,'u10':18}.get(uid,16)
    if len(qs)<min_q: errors.append(f'{uid}: 練習題至少 {min_q} 題，實際 {len(qs)}')
    life=sum(q.get('type')=='life' for q in qs)
    if life < 5: errors.append(f'{uid}: 生活題少於 5 題')
    if uid in {'u01','u02','u03','u04','u05','u06','u07','u08','u09','u10'}:
        ls=u.get('today_lessons',[])
        if len(ls)<5: errors.append(f'{uid}: 今日核心觀念卡少於 5 張')
        for j,L in enumerate(ls):
            for k in ('title','definition','focus','visual','q','options','answer','explain'):
                if k not in L: errors.append(f'{uid}.today_lessons[{j}]: 缺少 {k}')
            if isinstance(L.get('options'),list) and (not isinstance(L.get('answer'),int) or not 0<=L.get('answer',-1)<len(L.get('options',[]))):
                errors.append(f'{uid}.today_lessons[{j}]: answer 超出範圍')
    if uid=='u04':
        for skill in ('擴分','約分','通分'):
            calc=sum(q.get('skill')==skill and q.get('type')=='concept' for q in qs)
            life_skill=sum(q.get('skill')==skill and q.get('type')=='life' for q in qs)
            if calc<2 or life_skill<2: errors.append(f'u04: {skill} 需至少 2 題計算＋2 題生活題，實際 {calc}+{life_skill}')
    if uid=='u05':
        mixed=sum(q.get('skill') in ('複合角度','星型/交疊','飛鏢型') for q in qs)
        if mixed<10: errors.append(f'u05: 複合角度組合題少於 10 題，實際 {mixed}')
    for q in qs:
        qid=q.get('id','?')
        if qid in seen: errors.append(f'題目 ID 重複: {qid}')
        seen.add(qid)
        for k in ('type','text','options','answer','explain','skill','difficulty','hint','wrong_tip'):
            if k not in q: errors.append(f'{qid}: 缺少 {k}')
        if q.get('type') not in ('life','concept'): errors.append(f'{qid}: type 不合法')
        opts=q.get('options',[]); ans=q.get('answer')
        if not isinstance(ans,int) or not isinstance(opts,list) or not (0 <= ans < len(opts)): errors.append(f'{qid}: answer 超出範圍')


# v0.8 exam data validation.
exams=load_json('data/exams.json') or {}
if set(exams.keys()) != {'midterm','final'}:
    errors.append(f'exams.json: 預期 midterm/final，實際 {sorted(exams.keys())}')
exam_ids=set()
for cp,info in exams.items():
    if info.get('minutes') != 40: errors.append(f'{cp}: 考試時間應為 40 分鐘')
    papers=info.get('papers',{})
    if set(papers.keys()) != {'A','B'}: errors.append(f'{cp}: 需有 A/B 兩卷')
    for paper,qs in papers.items():
        if len(qs)!=15: errors.append(f'{cp}{paper}: 預期 15 題，實際 {len(qs)}')
        if sum(q.get('points',0) for q in qs)!=100: errors.append(f'{cp}{paper}: 配分不是 100')
        expected={'choice':20,'fill':20,'calc':24,'application':36}
        for typ,pts in expected.items():
            got=sum(q.get('points',0) for q in qs if q.get('type')==typ)
            if got!=pts: errors.append(f'{cp}{paper}: {typ} 配分 {got}，預期 {pts}')
        for q in qs:
            qid=q.get('id','?')
            if qid in exam_ids: errors.append(f'考卷題號重複: {qid}')
            exam_ids.add(qid)
            for k in ('type','points','unit','prompt','visual','explain'):
                if k not in q: errors.append(f'{qid}: 缺少 {k}')
            if q.get('type')=='choice':
                opts=q.get('options',[]);ans=q.get('answer')
                if not isinstance(ans,int) or not (0<=ans<len(opts)): errors.append(f'{qid}: 選擇題答案無效')
            elif not q.get('answers'):
                errors.append(f'{qid}: 非選擇題缺少 answers')

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
