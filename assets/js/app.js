const $=id=>document.getElementById(id);
let UNITS=[],BANK={},current="u01",showFull=false,practiceFilter="all",progress={};
let viewMode="chapter",lessonIndex=0,pendingFocus="";
const DEFAULT_PROGRESS={completed:{},correct:{},attempts:{},mistakes:{},challenge:{},todayLessons:{},xp:0,lastUnit:"u01",combo:0,comboBest:0,lifeCorrect:0,fixedMistakes:0,hintsUsed:0,daily:{date:"",correct:0,units:0}};
async function getJSON(p){const r=await fetch(p);if(!r.ok)throw new Error(p);return r.json()}
document.addEventListener("DOMContentLoaded",()=>init().catch(showBootError));
function showBootError(err){
 console.error(err);
 const main=document.getElementById("main");
 if(main)main.innerHTML=`<section class="questCard"><h2>⚠️ 內容載入失敗</h2><p>請重新整理頁面；若仍無法顯示，請確認 data 與 assets 檔案已完整上傳。</p><small>${String(err?.message||err)}</small></section>`;
}

function todayKey(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function normalizeProgress(p={}){
 const x={...DEFAULT_PROGRESS,...p};
 x.completed={...(p.completed||{})};x.correct={...(p.correct||{})};x.attempts={...(p.attempts||{})};x.mistakes={...(p.mistakes||{})};x.challenge={...(p.challenge||{})};x.todayLessons={...(p.todayLessons||{})};
 x.xp=Number(x.xp)||0;x.combo=Number(x.combo)||0;x.comboBest=Number(x.comboBest)||0;x.lifeCorrect=Number(x.lifeCorrect)||0;x.fixedMistakes=Number(x.fixedMistakes)||0;x.hintsUsed=Number(x.hintsUsed)||0;
 x.daily={date:p.daily?.date||"",correct:Number(p.daily?.correct)||0,units:Number(p.daily?.units)||0};
 if(x.daily.date!==todayKey())x.daily={date:todayKey(),correct:0,units:0};
 return x
}
async function init(){
 [UNITS,BANK]=await Promise.all([getJSON("data/units.json"),getJSON("data/practice.json")]);
 G5Account.boot({promptIfMissing:false});progress=normalizeProgress(G5Account.progress());
 const params=new URLSearchParams(window.location?.search||"");
 const requested=params.get("unit");
 current=(requested&&UNITS.some(u=>u.id===requested))?requested:(progress.lastUnit||"u01");
 if(!UNITS.some(u=>u.id===current))current=UNITS[0]?.id||"u01";
 viewMode=params.get("mode")==="today"?"today":"chapter";
 lessonIndex=Math.max(0,Number(params.get("lesson")||0)||0);
 pendingFocus=params.get("focus")||"";
 renderNav();renderUnit();bindShell();renderRewards();applyPendingFocus()
}
function bindShell(){
 $("menuBtn")?.addEventListener("click",()=>document.body.classList.toggle("menuOpen"));
 $("accountBtn")?.addEventListener("click",()=>G5Account.openPanel());
 window.addEventListener("g5-account-changed",()=>{progress=normalizeProgress(G5Account.progress());current=progress.lastUnit||"u01";renderNav();renderUnit()})
}
function save(){progress.lastUnit=current;G5Account.saveProgress(progress);renderRewards()}
function selectUnit(id,scroll=true,mode="chapter"){
 G5Voice?.stop?.();current=id;viewMode=mode;lessonIndex=0;progress.lastUnit=id;save();showFull=false;practiceFilter="all";
 renderNav();renderUnit();syncRoute();if(scroll)window.scrollTo({top:0,behavior:"smooth"});document.body.classList.remove("menuOpen")
}
function doneCount(){return Object.values(progress.completed).filter(Boolean).length}
function unitCorrect(uid){return Object.keys(progress.correct).filter(k=>k.startsWith(uid+"_")&&progress.correct[k]).length}
function unitStars(uid){if(!progress.completed[uid])return 0;const n=unitCorrect(uid);return 1+(n>=3?1:0)+(n>=6?1:0)}
function totalStars(){return UNITS.reduce((s,u)=>s+unitStars(u.id),0)}
function level(){return Math.floor(progress.xp/100)+1}
function unresolvedMistakes(uid=null){
 const ids=Object.keys(progress.mistakes||{}).filter(id=>(!uid||id.startsWith(uid+"_"))&&!progress.correct[id]&&progress.mistakes[id]>0);return ids.length
}
function chapterPractice(uid){const qs=BANK[uid]||[];if(practiceFilter==="life")return qs.filter(q=>q.type==="life");if(practiceFilter==="mistake")return qs.filter(q=>(progress.mistakes[q.id]||0)>0&&!progress.correct[q.id]);return qs}
function challengeDone(uid){return !!progress.challenge?.[uid]}
function badgeStates(){
 const done=doneCount(),stars=totalStars();
 return [
  {emoji:"🌟",name:"第一次過關",ok:done>=1,tip:"完成第一章"},
  {emoji:"🔥",name:"三連勝",ok:progress.comboBest>=3,tip:"連續答對 3 題"},
  {emoji:"🏙️",name:"生活解題家",ok:progress.lifeCorrect>=5,tip:"答對 5 題生活題"},
  {emoji:"🩹",name:"錯題修復師",ok:progress.fixedMistakes>=3,tip:"把 3 題曾答錯的題目修正答對"},
  {emoji:"👑",name:"Boss 挑戰者",ok:Object.keys(progress.challenge||{}).filter(k=>progress.challenge[k]).length>=3,tip:"完成 3 章 Boss 挑戰"},
  {emoji:"🚩",name:"半程勇者",ok:done>=5,tip:"完成 5 章"},
  {emoji:"⭐",name:"星星收藏家",ok:stars>=20,tip:"累積 20 顆星"},
  {emoji:"🏆",name:"五上全破",ok:done>=UNITS.length&&UNITS.length>0,tip:"完成全部章節"}
 ]
}
function renderRewards(){
 const d=doneCount(),stars=totalStars(),lv=level(),next=lv*100;
 if($("courseProgress"))$("courseProgress").textContent=`${d}/${UNITS.length||10}`;
 if($("courseBar"))$("courseBar").style.width=`${UNITS.length?d/UNITS.length*100:0}%`;
 if($("rewardLevel"))$("rewardLevel").textContent=`Lv.${lv}`;
 if($("rewardXp"))$("rewardXp").textContent=`${progress.xp} XP`;
 if($("rewardStars"))$("rewardStars").textContent=`${stars} ⭐`;
 if($("rewardCombo"))$("rewardCombo").textContent=`🔥 ${progress.comboBest}`;
 if($("rewardMistakes"))$("rewardMistakes").textContent=`🩹 ${unresolvedMistakes()}`;
 if($("xpBar"))$("xpBar").style.width=`${Math.min(100,(progress.xp%100))}%`;
 if($("xpNext"))$("xpNext").textContent=`距離 Lv.${lv+1} 還要 ${Math.max(0,next-progress.xp)} XP`;
 if($("dailyText"))$("dailyText").textContent=`今日：完成 ${progress.daily.units}/1 章・答對 ${progress.daily.correct}/3 題`;
 if($("dailyBar"))$("dailyBar").style.width=`${Math.min(100,((Math.min(progress.daily.units,1)+Math.min(progress.daily.correct,3)/3)/2)*100)}%`;
 if($("badgeMini"))$("badgeMini").innerHTML=badgeStates().map(b=>`<span class="miniBadge ${b.ok?"on":""}" title="${b.tip}">${b.emoji}</span>`).join("");
 if($("topReward"))$("topReward").textContent=`Lv.${lv}・${progress.xp} XP・${stars}⭐`;
 if($("unitStarStatus"))$("unitStarStatus").textContent=`${unitStars(current)}/3 星`;
 if($("chapterBadge")){const u=UNITS.find(x=>x.id===current),on=!!progress.completed[current];$("chapterBadge").classList.toggle("on",on);if($("chapterBadgeStatus"))$("chapterBadgeStatus").textContent=on?"已解鎖":"完成本章解鎖"}
}
function renderNav(){
 const nav=$("unitNav");if(!nav)return;
 nav.innerHTML=UNITS.map((u,i)=>{const s=unitStars(u.id);return `<button class="${u.id===current?"on":""}" onclick="selectUnit('${u.id}',true,'chapter')"><span>${u.emoji}</span><div><b>${i+1}. ${u.title}</b><small>${progress.completed[u.id]?`已過關 ${"⭐".repeat(s)}`:"先玩圖・解生活題"}</small></div></button>`}).join("");
 renderRewards()
}
function renderUnit(){
 const u=UNITS.find(x=>x.id===current),qs=chapterPractice(current),allQs=BANK[current]||[],stars=unitStars(current),wrongN=unresolvedMistakes(current);
 if(viewMode==="today"){renderToday(u);return}
 $("unitTitle").textContent=`${u.emoji} ${u.title}`;$("unitSub").textContent=`完整章節｜${u.hook}`;
 $("main").innerHTML=`
 <section class="questCard heroCard" data-voice>
  <div class="eyebrow">LEVEL ${UNITS.findIndex(x=>x.id===current)+1}・今天只懂一件事</div><h2>${u.hook}</h2><p>${u.draw_first}</p>
  <div class="keywordRow">${(u.keywords||[]).map(k=>`<span>${k}</span>`).join("")}</div>
 </section>
 <section class="questCard warmupCard">
  <div class="cardHead"><div><span class="step">⚡</span><h3>10 秒起點快問</h3></div><small>先想，不算分</small></div>
  <div class="diagnosticQ" data-voice><b>${u.warmup.q}</b></div><div class="choices compact">${u.warmup.options.map((o,i)=>`<button onclick="checkWarmup(${i})">${String.fromCharCode(65+i)}. ${o}</button>`).join("")}</div><div id="warmupFb" class="feedback"></div>
 </section>
 <section class="questCard storyCard" data-voice>
  <div class="cardHead"><div><span class="step">🎬</span><h3>先進入故事</h3></div><small>先知道為什麼要學</small></div>
  <p class="storyLead">${u.story}</p>
  <div class="missionBox"><b>${u.mission.title}</b><p>${u.mission.scene}</p><ol>${u.mission.steps.map(x=>`<li>${x}</li>`).join("")}</ol></div>
 </section>
 <section class="questCard">
  <div class="cardHead"><div><span class="step">1</span><h3>先玩圖，不背公式</h3></div><small>動手 30 秒</small></div><div class="labWrap">${mainLab(u.lab)}</div>
 </section>
 <section class="questCard coachCard" data-voice>
  <div class="cardHead"><div><span class="step">2</span><h3>用人話說一次</h3></div></div><p class="bigSay">${u.say}</p><p class="life">生活裡：${u.life}</p><div class="memoryStrip"><span>🧠 一句記住</span><b>${u.memory}</b></div>
 </section>
 <section class="questCard workedCard" data-voice>
  <div class="cardHead"><div><span class="step">3</span><h3>${u.worked.title}</h3></div><small>看懂每一步為什麼</small></div>
  <div class="workedProblem">${u.worked.problem}</div><div class="workedSteps">${u.worked.steps.map((x,i)=>`<div><span>${i+1}</span><p>${x}</p></div>`).join("")}</div><div class="reasonCheck"><b>🔎 合理性檢查</b><p>${u.worked.check}</p></div>
 </section>
 <section class="questCard">
  <div class="cardHead"><div><span class="step">4</span><h3>再玩一個小實驗</h3></div><small>換角度再看一次</small></div><div class="labWrap">${miniLab(u.mini)}</div>
 </section>
 ${deepChapterHtml(u)}
 <section class="questCard clinicCard">
  <div class="cardHead"><div><span class="step">🩺</span><h3>錯誤診療室</h3></div><small>看懂錯法，比抄答案重要</small></div>
  <p class="clinicRule">${u.error_clinic.rule}</p><div data-voice class="taskQ"><b>${u.error_clinic.q}</b></div><div class="choices compact">${u.error_clinic.options.map((o,i)=>`<button onclick="checkClinic(${i})">${String.fromCharCode(65+i)}. ${o}</button>`).join("")}</div><div id="clinicFb" class="feedback"></div>
 </section>
 <section class="questCard taskCard ${progress.completed[u.id]?"passed":""}">
  <div class="cardHead"><div><span class="step">5</span><h3>生活任務：答對就過關</h3></div><small>${progress.completed[u.id]?"✓ 已過關":"首次 +25 XP"}</small></div>${taskHtml(u)}
 </section>
 <section class="questCard rewardUnitCard">
  <div class="cardHead"><div><span class="step">🏅</span><h3>這章的獎勵</h3></div><small id="unitStarStatus">${stars}/3 星</small></div>
  <div class="unitRewardGrid"><div id="chapterBadge" class="chapterBadge ${progress.completed[u.id]?"on":""}"><span>${u.badge.emoji}</span><b>${u.badge.name}</b><small id="chapterBadgeStatus">${progress.completed[u.id]?"已解鎖":"完成本章解鎖"}</small></div><div><b>⭐ 星星規則</b><p>過關 1⭐・練習答對 3 題 2⭐・答對 6 題 3⭐</p><p class="mistakeStatus">🩹 本章待修錯題：${wrongN} 題</p></div></div>
 </section>
 <section class="questCard whyCard ${showFull?"":"hidden"}" id="fullLesson">
  <div class="cardHead"><div><span class="step">+</span><h3>完整學習與精熟區</h3></div><small>目標 → Boss → 分層練習</small></div>
  <div class="goalGrid">${(u.goals||[]).map((x,i)=>`<div><b>目標 ${i+1}</b><p>${x}</p></div>`).join("")}</div>
  <div class="trapBox" data-voice><b>⚠️ 最常掉進的坑</b><p>${u.pitfall}</p></div>
  <div class="whyGrid">${u.why.map((x,i)=>`<div data-voice><b>${["為什麼？","再看一層","最後連起來"][i]||"重點"}</b><p>${x}</p></div>`).join("")}</div>
  ${challengeHtml(u)}
  <div class="practiceHead"><div><h3 class="practiceTitle">${allQs.length} 題分層練習｜生活活用為主</h3><p class="practiceHint">先讀情境，圈出「已知、要找、單位」，再選數學工具；卡住可以看提示，不扣分。</p></div><div class="filterBtns"><button class="${practiceFilter==='all'?'on':''}" onclick="setPracticeFilter('all')">全部 ${allQs.length}</button><button class="${practiceFilter==='life'?'on':''}" onclick="setPracticeFilter('life')">🏙️ 生活題</button><button class="${practiceFilter==='mistake'?'on':''}" onclick="setPracticeFilter('mistake')">🩹 錯題 ${wrongN}</button></div></div>
  <div class="practiceList">${qs.length?qs.map((q,i)=>practiceHtml(q,i)).join(""):`<div class="emptyPractice">🎉 目前沒有待修錯題。遇到答錯的題目，會自動收進這裡。</div>`}</div>
 </section>
 <button class="fullToggle" onclick="toggleFull()">${showFull?"收起完整內容":"📚 展開精熟練習｜Boss 挑戰＋錯題修復"}</button>
 <section class="achievementPanel"><h3>冒險徽章櫃</h3><div class="badgeGrid">${badgeStates().map(b=>`<div class="achievement ${b.ok?"on":""}"><span>${b.emoji}</span><b>${b.name}</b><small>${b.ok?"已解鎖":b.tip}</small></div>`).join("")}</div></section>`;
 G5Voice?.enhance?.();renderRewards()
}

function syncRoute(){
 try{
  const q=new URLSearchParams();q.set("unit",current);q.set("mode",viewMode);if(viewMode==="today")q.set("lesson",lessonIndex);
  window.history?.replaceState?.({},"",`math.html?${q.toString()}`)
 }catch(e){}
}
function applyPendingFocus(){
 if(!pendingFocus)return;const f=pendingFocus;pendingFocus="";
 setTimeout(()=>{
  if(f==="practice"||f==="mistakes"||f==="boss"){showFull=true;if(f==="mistakes")practiceFilter="mistake";renderUnit();setTimeout(()=>document.querySelector(f==="boss"?".bossCard":".practiceHead")?.scrollIntoView({behavior:"smooth",block:"start"}),20)}
  else if(f==="rewards")document.querySelector(".rewardUnitCard")?.scrollIntoView({behavior:"smooth",block:"start"});
 },20)
}
function todayLessonsFor(u){
 if(u.today_lessons?.length)return u.today_lessons;
 return [{title:u.hook,definition:u.say||u.draw_first,focus:u.memory||u.draw_first,visual:"_main",q:u.warmup.q,options:u.warmup.options,answer:u.warmup.answer,explain:u.warmup.explain}]
}
function renderToday(u){
 const ls=todayLessonsFor(u);
 lessonIndex=Math.min(Math.max(0,lessonIndex),ls.length-1);const L=ls[lessonIndex],key=`${u.id}_${lessonIndex}`,done=!!progress.todayLessons?.[key];
 $("unitTitle").textContent=`🎯 今日任務｜${u.title}`;$("unitSub").textContent=`今天只學 1 個核心觀念・第 ${lessonIndex+1}/${ls.length} 張`;
 $("main").innerHTML=`
 <section class="todayModeBar"><div><b>今天不塞整章</b><span>一次只弄懂一個最重要觀念，完成再往下一張。</span></div><button onclick="openChapter()">📚 查看完整章節</button></section>
 <section class="todayPager">${ls.map((x,i)=>`<button class="${i===lessonIndex?'on':''} ${progress.todayLessons?.[`${u.id}_${i}`]?'done':''}" onclick="setTodayLesson(${i})"><span>${i+1}</span>${x.title}</button>`).join('')}</section>
 <section class="questCard todayConceptCard">
  <div class="eyebrow">TODAY CARD ${lessonIndex+1}/${ls.length}</div><h2>${L.title}</h2>
  <div class="definitionBox"><b>一句定義</b><p>${L.definition}</p></div>
  <div class="focusSentence"><b>今天最重要：</b>${L.focus}</div>
  <div class="labWrap deepVisual">${L.visual==="_main"?mainLab(u.lab):deepVisual(L.visual)}</div>
 </section>
 <section class="questCard todayCheckCard">
  <div class="cardHead"><div><span class="step">✓</span><h3>30 秒檢查：真的懂了嗎？</h3></div><small>${done?'已完成':'答對 +6 XP'}</small></div>
  <div class="taskQ"><b>${L.q}</b></div><div class="choices todayChoices">${L.options.map((o,i)=>`<button ${done?'disabled':''} onclick="checkTodayLesson(${i})">${String.fromCharCode(65+i)}. ${o}</button>`).join('')}</div><div id="todayFb" class="feedback ${done?'good':''}">${done?`✅ ${L.explain}`:''}</div>
 </section>
 <div class="todayNav"><button onclick="nextToday(-1)" ${lessonIndex===0?'disabled':''}>← 上一張</button><b>第 ${lessonIndex+1} 張／共 ${ls.length} 張</b><button class="primary" onclick="nextToday(1)">${lessonIndex===ls.length-1?'進完整章節 →':'下一張 →'}</button></div>`;
 G5Voice?.enhance?.();renderRewards();syncRoute()
}
function setTodayLesson(i){lessonIndex=i;renderUnit();syncRoute();window.scrollTo?.({top:0,behavior:"smooth"})}
function nextToday(d){const u=UNITS.find(x=>x.id===current),n=todayLessonsFor(u).length;if(d>0&&lessonIndex>=n-1){openChapter();return}lessonIndex=Math.min(n-1,Math.max(0,lessonIndex+d));renderUnit();syncRoute();window.scrollTo?.({top:0,behavior:"smooth"})}
function openChapter(){viewMode="chapter";showFull=false;renderNav();renderUnit();syncRoute();window.scrollTo?.({top:0,behavior:"smooth"})}
function checkTodayLesson(i){
 const u=UNITS.find(x=>x.id===current),L=todayLessonsFor(u)[lessonIndex],fb=$("todayFb");if(!L)return;const key=`${u.id}_${lessonIndex}`,already=!!progress.todayLessons?.[key];
 if(i===L.answer){let bonus=0;if(!already){progress.todayLessons[key]=true;bonus=rewardCorrect(6);save()}fb.className="feedback good";fb.textContent=`✅ ${L.explain}${already?'':`　+${6+bonus} XP`}`;if(!already)showRewardToast(`🎯 今日觀念完成！+${6+bonus} XP`)}else{rewardWrong();save();fb.className="feedback bad";fb.textContent=`再看一次「今天最重要」和圖解。提示：${L.definition}`}
}
function deepChapterHtml(u){
 const ls=u.today_lessons||[];if(!ls.length)return '';
 const cards=ls.map((L,i)=>`<section class="questCard conceptLesson" id="concept_${u.id}_${i}"><div class="conceptNo">核心觀念 ${i+1}</div><h3>${L.title}</h3><div class="definitionBox"><b>名詞／定義</b><p>${L.definition}</p></div><p class="focusSentence"><b>一定要會：</b>${L.focus}</p><div class="labWrap deepVisual">${deepVisual(L.visual)}</div></section>`).join('');
 const index=`<section class="questCard conceptIndex"><div class="cardHead"><div><span class="step">🗺️</span><h3>本章核心觀念地圖</h3></div><small>${ls.length} 張觀念卡</small></div><p>每一張只處理一個最重要觀念。看不懂時直接跳回那張，不必重讀整章。</p><div class="conceptJump">${ls.map((L,i)=>`<button onclick="document.getElementById('concept_${u.id}_${i}')?.scrollIntoView({behavior:'smooth',block:'start'})"><span>${i+1}</span>${L.title}</button>`).join('')}</div></section>`;
 return index+cards+(u.id==='u05'?angleGalleryHtml():'')
}
function deepVisual(type){
 const m={
  place_value:placeValueDeepLab,decimal_compare_deep:decimalCompareDeep,decimal_align:decimalAlignDeep,rounding_line:roundingDeep,decimal_life:decimalLifeDeep,
  factor_inverse:factorInverseDeep,divisibility:divisibilityDeep,factor_pairs:factorPairsDeepUnique,gcf_deep:gcfDeepUnique,gcf_life:gcfLifeDeep,
  multiple_inverse:multipleInverseDeep,infinite_multiples:infiniteMultiplesDeep,multiple_line:multipleLineDeepUnique,lcm_deep:lcmTimeDeepUnique,track_lcm:trackLcmDeepUnique,
  fraction_words:fractionWordsDeep,fraction_pie:fractionPieDeep,expand_fraction:expandFractionDeep,reduce_fraction:reduceFractionDeep,common_den_deep:commonDenLab,fraction_compare_rules:fractionCompareDeep,
  ngon:ngonDeep,regular_ngon:regularNgonDeep,triangle_inequality:triangleInequalityDeep,interior_sum:interiorSumDeep,special_triangles:specialTrianglesDeep,parallelogram_angles:parallelogramDeep,trapezoid_angles:trapezoidDeep,sector_deep:sectorDeepUnique,angle_mixed:angleMixedDeep
 };
 return m[type]?m[type]():`<div class="labError">圖解準備中：${type}</div>`
}
function toggleFull(){showFull=!showFull;renderUnit();if(showFull)setTimeout(()=>$("fullLesson")?.scrollIntoView({behavior:"smooth"}),30)}
function setPracticeFilter(f){practiceFilter=f;renderUnit();setTimeout(()=>document.querySelector(".practiceHead")?.scrollIntoView({behavior:"smooth",block:"start"}),30)}
function checkWarmup(i){const u=UNITS.find(x=>x.id===current),fb=$("warmupFb"),ok=i===u.warmup.answer;fb.className=`feedback ${ok?"good":"bad"}`;fb.textContent=`${ok?"✅":"💡"} ${u.warmup.explain}`}
function checkClinic(i){const u=UNITS.find(x=>x.id===current),fb=$("clinicFb"),ok=i===u.error_clinic.answer;fb.className=`feedback ${ok?"good":"bad"}`;fb.textContent=ok?`✅ 找到錯因！${u.error_clinic.explain}`:`再找「錯在哪個觀念」，不是只看答案大小。${u.error_clinic.rule}`}
function challengeHtml(u){const done=challengeDone(u.id);return `<div class="bossCard ${done?"done":""}"><div class="bossTitle"><span>👑 BOSS 題</span><small>${done?"✓ 已攻克":"首次答對 +12 XP"}</small></div><b>${u.challenge.q}</b><div class="choices compact">${u.challenge.options.map((o,i)=>`<button ${done?"disabled":""} onclick="checkChallenge(${i})">${String.fromCharCode(65+i)}. ${o}</button>`).join("")}</div><div class="hintLine"><button onclick="showChallengeHint()">💡 給我一點提示</button><span id="challengeHint"></span></div><div id="challengeFb" class="feedback">${done?`✓ ${u.challenge.explain}`:""}</div></div>`}
function showChallengeHint(){const u=UNITS.find(x=>x.id===current);if($("challengeHint"))$("challengeHint").textContent=u.challenge.hint}
function checkChallenge(i){const u=UNITS.find(x=>x.id===current),fb=$("challengeFb");if(challengeDone(current))return;if(i===u.challenge.answer){progress.challenge[current]=true;const bonus=rewardCorrect(12,{life:true});fb.className="feedback good";fb.textContent=`👑 攻克 Boss！${u.challenge.explain} +12 XP${bonus?`＋連勝 ${bonus} XP`:""}`;showRewardToast(`👑 Boss 完成！+${12+bonus} XP`)}else{rewardWrong();fb.className="feedback bad";fb.textContent=`還差一步。提示：${u.challenge.hint}`}save();renderNav()}
function taskHtml(u){return `<div data-voice class="taskQ"><b>${u.task.q}</b></div><div class="choices">${u.task.options.map((o,i)=>`<button onclick="checkTask(${i})">${String.fromCharCode(65+i)}. ${o}</button>`).join("")}</div><div id="taskFb" class="feedback">${progress.completed[u.id]?`已完成這關。再答一次可以複習，但 XP 不會重複計算。`:""}</div>`}
function rewardCorrect(base,{life=false,unit=false}={}){
 progress.combo=(progress.combo||0)+1;progress.comboBest=Math.max(progress.comboBest||0,progress.combo);const bonus=progress.combo>=3?2:0;progress.xp+=base+bonus;
 progress.daily.correct=(progress.daily.correct||0)+1;if(life)progress.lifeCorrect=(progress.lifeCorrect||0)+1;if(unit)progress.daily.units=(progress.daily.units||0)+1;
 return bonus
}
function rewardWrong(){progress.combo=0}
function showRewardToast(text){let t=document.querySelector('.rewardToast');if(t)t.remove();t=document.createElement('div');t.className='rewardToast';t.textContent=text;document.body.appendChild(t);setTimeout(()=>t.classList.add('show'),20);setTimeout(()=>t.remove(),1900)}
function checkTask(i){
 const u=UNITS.find(x=>x.id===current),fb=$("taskFb"),ok=i===u.task.answer;progress.attempts[current]=(progress.attempts[current]||0)+1;
 if(ok){let bonus=0,isNew=!progress.completed[current];if(isNew){progress.completed[current]=true;bonus=rewardCorrect(25,{life:true,unit:true})}
  fb.className="feedback good";fb.innerHTML=`✅ 任務完成！ ${u.task.explain}<br><b>${encourage()}</b>${isNew?`<br>+25 XP${bonus?` ＋連勝獎勵 ${bonus} XP`:""}・解鎖 ${u.badge.emoji}${u.badge.name}`:""}`;if(isNew)showRewardToast(`🎉 過關！+${25+bonus} XP・${u.badge.name}`)
 }else{rewardWrong();fb.className="feedback bad";fb.textContent=`先別急著算。回到情境想「要找什麼」：${u.task.explain}`}
 save();renderNav()
}
function encourage(){const done=doneCount();return done>=9?"差最後一章，準備全破！":done>=7?"已進入後段冒險，保持節奏。":done>=4?"開始把不同章節串起來了。":"先拿一個小成功，數學會越來越有手感。"}
function practiceHtml(q,i){
 const key=q.id,answered=progress.correct[key],wrong=progress.mistakes[key]||0;
 return `<article class="practiceQ ${q.type==='life'?"lifeQ":"conceptQ"} ${wrong&&!answered?"needsFix":""}"><div class="qMeta"><span>${q.type==='life'?"🏙️ 生活活用":"🧠 觀念檢查"}</span><span class="difficulty">${q.difficulty||"練習"}</span><small>${answered?"✓ 已答對":wrong?`🩹 待修・錯 ${wrong} 次`:"答對 +8 XP"}</small></div><b>${i+1}. ${q.text}</b><div>${q.options.map((o,j)=>`<button ${answered?"disabled":""} onclick="checkPractice('${key}',${j},this)">${String.fromCharCode(65+j)}. ${o}</button>`).join("")}</div><div class="hintLine"><button ${answered?"disabled":""} onclick="showHint('${key}')">💡 提示</button><span id="hint_${key}"></span></div><p id="fb_${key}" class="${answered?"goodText":""}">${answered?`✓ ${q.explain}${wrong?"　🩹 這題已修復！":""}`:""}</p></article>`
}
function showHint(id){const q=(BANK[current]||[]).find(x=>x.id===id);if(!q)return;const el=$("hint_"+id);if(el&&!el.textContent){el.textContent=q.hint||"先圈出題目要找什麼。";progress.hintsUsed=(progress.hintsUsed||0)+1;save()}}
function checkPractice(id,ans,btn){
 const q=(BANK[current]||[]).find(x=>x.id===id),fb=$("fb_"+id);if(!q||progress.correct[id])return;
 if(ans===q.answer){const hadWrong=(progress.mistakes[id]||0)>0;progress.correct[id]=true;if(hadWrong)progress.fixedMistakes=(progress.fixedMistakes||0)+1;const bonus=rewardCorrect(8,{life:q.type==='life'});fb.className="goodText";fb.textContent=`✓ ${q.explain} +8 XP${bonus?`＋連勝 ${bonus} XP`:""}${hadWrong?"　🩹 錯題修復成功！":""}`;btn.parentElement.querySelectorAll("button").forEach(b=>b.disabled=true);showRewardToast(hadWrong?`🩹 修復成功！+${8+bonus} XP`:`⭐ 答對！+${8+bonus} XP`)
 }else{progress.mistakes[id]=(progress.mistakes[id]||0)+1;rewardWrong();fb.className="badText";fb.textContent=`先不要抄正解。${q.wrong_tip||"重新找出題目要你求什麼。"} 可以按「提示」再想一次。`}
 save();renderNav()
}

/* ---------- lab routers ---------- */
function mainLab(type){
 const labs={
  decimal:decimalLab,factors:factorsLab,multiples:multiplesLab,fraction_equiv:fractionEqLab,polygon:polygonLab,
  fraction_add:fractionAddLab,symmetry:symmetryLab,operations:operationsLab,area:areaLab,solids:solidsLab
 };
 const fn=labs[type];
 return fn?fn():`<div class="labError">⚠️ 找不到互動圖：${type||"未設定"}</div>`
}
function miniLab(type){
 const labs={
  decimal_compare:decimalCompare,gcf:gcfLab,lcm:lcmLab,common_den:commonDenLab,sector:sectorLab,
  fraction_strip:fractionStripLab,mirror_point:mirrorPointLab,distributive:distributeLab,triangle_area:triangleAreaLab,net:netLab
 };
 const fn=labs[type];
 return fn?fn():`<div class="labError">⚠️ 找不到小實驗：${type||"未設定"}</div>`
}

/* ---------- labs ---------- */
function decimalLab(){return `<div class="labIntro"><b>🔢 小數點對齊＝把同一種位值排在同一欄</b><p>個位只能和個位相加，十分位只能和十分位相加。拖動兩個數，看位值表怎麼保持對齊。</p></div><div id="decimalBox">${decimalSvg(3.47,.8)}</div><div class="dual"><label>A＝<span id="dA">3.47</span><input id="dAR" type="range" min="0" max="9" step=".01" value="3.47" oninput="updateDecimal()"></label><label>B＝<span id="dB">0.80</span><input id="dBR" type="range" min="0" max="9" step=".01" value=".8" oninput="updateDecimal()"></label></div>`}
function decimalSvg(a,b){const s=(n)=>Number(n).toFixed(2).split(".");let A=s(a),B=s(b),C=s(Number(a)+Number(b));return `<svg viewBox="0 0 620 250"><text x="70" y="45" font-size="18" font-weight="800">小數點對齊＝同單位排在同一欄</text>${["個位","十分位","百分位"].map((t,i)=>`<rect x="${130+i*120}" y="75" width="120" height="42" fill="#eef4ff" stroke="#d5e1f3"/><text x="${165+i*120}" y="102" font-size="14">${t}</text>`).join("")}<text x="165" y="150" font-size="24">${A[0]}</text><text x="282" y="150" font-size="24">.</text><text x="310" y="150" font-size="24">${A[1][0]}</text><text x="430" y="150" font-size="24">${A[1][1]}</text><text x="165" y="185" font-size="24">${B[0]}</text><text x="282" y="185" font-size="24">.</text><text x="310" y="185" font-size="24">${B[1][0]}</text><text x="430" y="185" font-size="24">${B[1][1]}</text><line x1="135" y1="200" x2="500" y2="200" stroke="#687b99"/><text x="155" y="232" font-size="21">${Number(a).toFixed(2)} + ${Number(b).toFixed(2)} = ${Number(a+b).toFixed(2)}</text></svg>`}
window.updateDecimal=()=>{const a=Number($("dAR").value),b=Number($("dBR").value);$("dA").textContent=a.toFixed(2);$("dB").textContent=b.toFixed(2);$("decimalBox").innerHTML=decimalSvg(a,b)}
function decimalCompare(){return `<div class="labIntro"><b>⚖️ 比小數不要看「誰位數多」</b><p>比較 4.2 和 4.18 時，把 4.2 寫成 4.20；補 0 不改變大小，卻能讓位值一欄一欄比較。</p></div><div class="compareBig">4.20 &gt; 4.18</div>`}

function factorsLab(){
 return `<div class="labIntro"><b>🧩 因數＝剛好分完的分法</b><p>把一個數想成零用錢或積木。最細拆成每份 1；完全不拆就是 1 份全部。</p></div>
 <div id="factorBox">${factorPanel(12)}</div>
 <label>零用錢／物品總數 N＝<span id="fN">12</span><input id="fNR" type="range" min="6" max="30" step="1" value="12" oninput="updateFactor(this.value)"></label>`
}
function divisors(n){return Array.from({length:n},(_,i)=>i+1).filter(x=>n%x===0)}
function factorPanel(n){
 const ds=divisors(n),pairs=[];for(const d of ds){if(d<=n/d)pairs.push([d,n/d])}
 const cards=pairs.map(([a,b])=>`<div class="factorPair"><span>${a} 元/份</span><b>×</b><span>${b} 份</span><strong>= ${n} 元</strong></div>`).join("");
 return `<div class="factorExplain"><div><b>最細拆</b><span>${n} 份 × 1＝${n}</span><small>所以 1 一定是因數</small></div><div><b>完全不拆</b><span>1 份 × ${n}＝${n}</span><small>所以本身 ${n} 也一定是因數</small></div></div>
 <div class="factorPairs">${cards}</div>
 <div class="conceptCallout">可剛好分完的每份大小：<strong>${ds.join("、")}</strong></div>`
}
window.updateFactor=v=>{$("fN").textContent=v;$('factorBox').innerHTML=factorPanel(Number(v))}
function gcfLab(){
 return `<div class="labIntro"><b>🤝 公因數＝兩個總數都能用的共同分法</b><p>試著改變兩筆零用錢，看哪些「每包金額」兩邊都能剛好分完。</p></div>
 <div id="gcfBox">${gcfPanel(12,18)}</div><div class="dual"><label>A＝<span id="gA">12</span><input id="gAR" type="range" min="6" max="36" value="12" oninput="updateGcf()"></label><label>B＝<span id="gB">18</span><input id="gBR" type="range" min="6" max="36" value="18" oninput="updateGcf()"></label></div>`
}
function gcfPanel(a,b){const da=divisors(a),db=divisors(b),c=da.filter(x=>b%x===0),g=Math.max(...c);return `<div class="gcfGrid"><div><b>${a} 的因數</b><p>${da.join("、")}</p></div><div class="commonFactor"><b>共同分法</b><p>${c.join("、")}</p><strong>最大公因數＝${g}</strong></div><div><b>${b} 的因數</b><p>${db.join("、")}</p></div></div><p class="centerNote">「最多分成相同組而且不剩」時，就找最大的共同分法。</p>`}
window.updateGcf=()=>{const a=Number($('gAR').value),b=Number($('gBR').value);$('gA').textContent=a;$('gB').textContent=b;$('gcfBox').innerHTML=gcfPanel(a,b)}

function multiplesLab(){
 return `<div class="labIntro"><b>🏃 倍數＝固定步長的落點</b><p>兩人都從 0 出發。共同落點就是公倍數；第一個共同落點是最小公倍數。</p></div>
 <div id="multipleBox">${multipleSvg(2,3)}</div><div class="dual"><label>甲模型步長＝<span id="mA">2</span> 公尺<input id="mAR" type="range" min="1" max="10" value="2" oninput="updateMultiple()"></label><label>乙模型步長＝<span id="mB">3</span> 公尺<input id="mBR" type="range" min="1" max="10" value="3" oninput="updateMultiple()"></label></div>`
}
function gcd(a,b){while(b)[a,b]=[b,a%b];return a}
function lcm(a,b){return a/gcd(a,b)*b}
function multipleSvg(a,b){
 const first=lcm(a,b),second=first*2,max=Math.max(36,Math.min(60,second+6)),x0=55,x1=565,step=(x1-x0)/max;
 let ticks='',aDots='',bDots='',both='';
 for(let n=0;n<=max;n+=2){const x=x0+n*step;ticks+=`<line x1="${x}" y1="116" x2="${x}" y2="128" stroke="#9aa8bc"/><text x="${x-6}" y="148" font-size="10">${n}</text>`}
 for(let n=a;n<=max;n+=a){const x=x0+n*step;aDots+=`<circle cx="${x}" cy="82" r="7" fill="#4b73df"/>`}
 for(let n=b;n<=max;n+=b){const x=x0+n*step;bDots+=`<circle cx="${x}" cy="105" r="7" fill="#8c6ade"/>`}
 for(let n=first;n<=max;n+=first){const x=x0+n*step;both+=`<line x1="${x}" y1="61" x2="${x}" y2="132" stroke="#f0ad36" stroke-width="4"/><text x="${x-11}" y="52" font-size="12" font-weight="800" fill="#9a6412">${n}</text>`}
 return `<svg viewBox="0 0 620 235" class="wideDiagram"><text x="48" y="28" font-size="17" font-weight="800">數線：固定步長會落在哪裡？</text><text x="48" y="86" font-size="12" fill="#4b73df">甲</text><text x="48" y="109" font-size="12" fill="#7c59c7">乙</text><line x1="${x0}" y1="122" x2="${x1}" y2="122" stroke="#56677e" stroke-width="2"/>${ticks}${aDots}${bDots}${both}<text x="55" y="180" font-size="14">第一次共同落點：<tspan font-weight="900">${first} 公尺</tspan></text><text x="55" y="204" font-size="14">第二次共同落點：<tspan font-weight="900">${second} 公尺</tspan></text></svg>`
}
window.updateMultiple=()=>{const a=Number($('mAR').value),b=Number($('mBR').value);$('mA').textContent=a;$('mB').textContent=b;$('multipleBox').innerHTML=multipleSvg(a,b)}
function lcmLab(){
 return `<div class="labIntro"><b>🏟️ 把倍數換成操場時間</b><p>同時回到起點，代表兩人都剛好跑完整數圈。</p></div><div id="trackBox">${trackPanel(4,6,200)}</div><div class="triple"><label>甲每圈 <span id="lapA">4</span> 分<input id="lapAR" type="range" min="2" max="8" value="4" oninput="updateTrack()"></label><label>乙每圈 <span id="lapB">6</span> 分<input id="lapBR" type="range" min="2" max="8" value="6" oninput="updateTrack()"></label><label>跑道一圈 <span id="trackM">200</span> m<input id="trackMR" type="range" min="100" max="400" step="50" value="200" oninput="updateTrack()"></label></div>`
}
function trackPanel(a,b,m){const t=lcm(a,b),la=t/a,lb=t/b;return `<div class="trackScene"><svg viewBox="0 0 620 220"><ellipse cx="300" cy="108" rx="210" ry="72" fill="#eef8f2" stroke="#54a778" stroke-width="12"/><ellipse cx="300" cy="108" rx="155" ry="40" fill="#fff" stroke="#dbe8df" stroke-width="2"/><circle cx="90" cy="108" r="9" fill="#f0ad36"/><text x="62" y="94" font-size="13" font-weight="800">起點</text><text x="245" y="113" font-size="20" font-weight="900">${m} m / 圈</text></svg><div class="trackResult"><b>${t} 分鐘後第一次同時回起點</b><span>甲：${la} 圈＝${la*m} m</span><span>乙：${lb} 圈＝${lb*m} m</span></div></div>`}
window.updateTrack=()=>{const a=Number($('lapAR').value),b=Number($('lapBR').value),m=Number($('trackMR').value);$('lapA').textContent=a;$('lapB').textContent=b;$('trackM').textContent=m;$('trackBox').innerHTML=trackPanel(a,b,m)}

function fractionEqLab(){return `<div class="labIntro"><b>🍕 等值分數＝切法變，大小不變</b><p>拖動切法，觀察塗色面積保持一半。</p></div><div id="fracEq">${fractionEqSvg(4)}</div><label>把整體切成 <span id="fracDen">4</span> 等份<input type="range" min="2" max="12" step="2" value="4" oninput="updateFracEq(this.value)"></label>`}
function fractionEqSvg(den){const num=den/2,w=440/den;return `<svg viewBox="0 0 620 230"><text x="65" y="38" font-size="17" font-weight="800">1/2 = ${num}/${den}</text>${Array.from({length:den},(_,i)=>`<rect x="80" y="${75+i*0}" width="0" height="0"/>`).join('')}<rect x="80" y="78" width="440" height="72" rx="8" fill="#f3f5f9" stroke="#cfd9e8"/>${Array.from({length:den},(_,i)=>`<rect x="${80+i*w}" y="78" width="${w}" height="72" fill="${i<num?'#6f8deb':'transparent'}" stroke="#fff"/>`).join('')}<text x="80" y="190" font-size="14">分子、分母同乘同一個數，代表同一塊整體只是切得更細。</text></svg>`}
window.updateFracEq=v=>{$('fracDen').textContent=v;$('fracEq').innerHTML=fractionEqSvg(Number(v))}
function commonDenLab(){return `<div class="labIntro"><b>🧱 通分＝把小塊變成同樣大小</b><p>1/2 與 1/3 不能直接比「1 塊」，因為每塊大小不同；都切成 6 份後再比較。</p></div><div class="fractionRows"><div><b>1/2＝3/6</b><span class="bars six"><i style="width:50%"></i></span></div><div><b>1/3＝2/6</b><span class="bars six"><i style="width:33.333%"></i></span></div><p>共同分母 6，讓兩種分數使用同一種「小塊單位」。</p></div>`}

window.polyRegular=true;
function polygonLab(){window.polyRegular=true;return `<div class="labIntro"><b>🔷 邊長 vs 周長</b><p><strong>邊長</strong>是一條邊的長度；<strong>周長</strong>是沿著所有外框走一圈的總長。只有正多邊形才能直接用「邊數 × 每邊長」。</p></div><div class="modeBtns"><button class="on" id="polyRegBtn" onclick="showPolyMode(true)">正多邊形</button><button id="polyIrrBtn" onclick="showPolyMode(false)">不規則多邊形</button></div><div id="polyBox">${polygonSvg(5,4,true)}</div><div class="dual"><label>邊數＝<span id="polyN">5</span><input id="polyNR" type="range" min="3" max="8" value="5" oninput="updatePoly()"></label><label>基準邊長＝<span id="polyS">4</span> cm<input id="polySR" type="range" min="2" max="8" value="4" oninput="updatePoly()"></label></div>`}
function polygonSvg(n,s,regular){let pts=[],lens=[];for(let i=0;i<n;i++){let a=-Math.PI/2+i*2*Math.PI/n,r=regular?90:90+(i%3-1)*18;pts.push([225+r*Math.cos(a),135+r*Math.sin(a)]);lens.push(regular?s:Math.max(1,s+((i%3)-1)))}const per=lens.reduce((a,b)=>a+b,0);let labels='';for(let i=0;i<n;i++){const p=pts[i],q=pts[(i+1)%n],mx=(p[0]+q[0])/2,my=(p[1]+q[1])/2;labels+=`<text x="${mx-7}" y="${my-5}" font-size="11" font-weight="800" fill="#3157a7">${lens[i]}</text>`}return `<svg viewBox="0 0 620 285"><polygon points="${pts.map(p=>p.join(',')).join(' ')}" fill="#edf3ff" stroke="#5579df" stroke-width="4"/>${labels}<path d="M ${pts.map((p,i)=>(i?'L':'')+p.join(' ')).join(' ')} Z" fill="none" stroke="#f0ad36" stroke-width="8" stroke-linecap="round" opacity=".32"/><text x="365" y="78" font-size="19" font-weight="900">${regular?'正':''}${n}邊形</text><text x="365" y="112" font-size="14">邊長＝一條邊的長度</text><text x="365" y="140" font-size="14">周長＝${lens.join('＋')}＝<tspan font-weight="900">${per} cm</tspan></text><text x="365" y="178" font-size="13">${regular?`${n} 條邊都相等，所以 ${n}×${s}=${per}`:'每條邊不一定相等，要逐邊相加'}</text><text x="365" y="215" font-size="12" fill="#68778d">橘色粗線＝沿外框走完整一圈</text><text x="365" y="241" font-size="12" fill="#68778d">角度延伸：從一個頂點可切成 ${n-2} 個三角形</text><text x="365" y="263" font-size="10" fill="#8a96a7">圖形為示意；標示數字才是題目給的邊長。</text></svg>`}
window.showPolyMode=reg=>{window.polyRegular=reg;$('polyRegBtn')?.classList.toggle('on',reg);$('polyIrrBtn')?.classList.toggle('on',!reg);updatePoly()}
window.updatePoly=()=>{const n=Number($('polyNR').value),s=Number($('polySR').value);$('polyN').textContent=n;$('polyS').textContent=s;$('polyBox').innerHTML=polygonSvg(n,s,window.polyRegular)}
function sectorLab(){return `<div class="labIntro"><b>⭕ 圓沒有直線「邊長」；一整圈叫圓周長</b><p>圓周的一部分叫<strong>弧</strong>，那一段的長度叫<strong>弧長</strong>。扇形一定由兩條半徑和它們之間的一段弧圍成，兩條半徑交在圓心。</p></div><div id="sectorBox">${sectorPanel(90,4)}</div><div class="dual"><label>圓心角＝<span id="secA">90</span>°<input id="secAR" type="range" min="30" max="330" step="30" value="90" oninput="updateSector()"></label><label>半徑＝<span id="secR">4</span> cm<input id="secRR" type="range" min="2" max="8" value="4" oninput="updateSector()"></label></div>`}
function polar(cx,cy,r,deg){const a=(deg-90)*Math.PI/180;return [cx+r*Math.cos(a),cy+r*Math.sin(a)]}
function sectorPanel(angle,r){const cx=210,cy=140,pr=92,start=polar(cx,cy,pr,0),end=polar(cx,cy,pr,angle),large=angle>180?1:0,fracG=gcd(angle,360),num=angle/fracG,den=360/fracG,circ=(2*3.14*r),arc=circ*angle/360;return `<svg viewBox="0 0 620 300"><circle cx="${cx}" cy="${cy}" r="${pr}" fill="#f7f9fd" stroke="#6079c9" stroke-width="3"/><path d="M ${cx} ${cy} L ${start[0]} ${start[1]} A ${pr} ${pr} 0 ${large} 1 ${end[0]} ${end[1]} Z" fill="#dfe9ff" stroke="#4b73df" stroke-width="2"/><path d="M ${start[0]} ${start[1]} A ${pr} ${pr} 0 ${large} 1 ${end[0]} ${end[1]}" fill="none" stroke="#f0a83b" stroke-width="8" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="5" fill="#24395f"/><text x="${cx+8}" y="${cy+18}" font-size="13" font-weight="800">O 圓心</text><text x="365" y="64" font-size="17" font-weight="900">圓心角 ${angle}°</text><text x="365" y="96" font-size="14">占整圈：${angle}/360＝${num}/${den}</text><text x="365" y="128" font-size="14">圓周長 ≈ 2×3.14×${r}＝${circ.toFixed(2)} cm</text><text x="365" y="160" font-size="14">弧長 ≈ 圓周長×${num}/${den}</text><text x="365" y="188" font-size="16" font-weight="900">≈ ${arc.toFixed(2)} cm</text><text x="365" y="230" font-size="12">橘色彎線＝弧；藍色區域＝扇形</text><text x="365" y="253" font-size="12">兩條直線都從圓心 O 出發，所以它們是半徑。</text></svg>`}
window.updateSector=()=>{const a=Number($('secAR').value),r=Number($('secRR').value);$('secA').textContent=a;$('secR').textContent=r;$('sectorBox').innerHTML=sectorPanel(a,r)}

function fractionAddLab(){return `<div class="labIntro"><b>➕ 異分母不能直接加，是因為「每一塊」大小不同</b><p>先找共同分母，把兩種分數都改成相同大小的小塊，再數總共有幾塊。</p></div><div id="faBox">${fractionAddSvg(2,3)}</div><div class="dual"><label>分母 A＝<span id="faA">2</span><input id="faAR" type="range" min="2" max="8" value="2" oninput="updateFA()"></label><label>分母 B＝<span id="faB">3</span><input id="faBR" type="range" min="2" max="8" value="3" oninput="updateFA()"></label></div>`}
function fractionAddSvg(a,b){let d=lcm(a,b),na=d/a,nb=d/b;return `<svg viewBox="0 0 620 250"><text x="55" y="38" font-size="17" font-weight="800">1/${a} + 1/${b}：先把分數單位變成 1/${d}</text><rect x="60" y="75" width="220" height="48" rx="6" fill="#eef3fb" stroke="#cfd9e8"/><rect x="60" y="75" width="${220/a}" height="48" rx="6" fill="#6f8deb"/><text x="300" y="106" font-size="16">1/${a}＝${na}/${d}</text><rect x="60" y="145" width="220" height="48" rx="6" fill="#eef3fb" stroke="#cfd9e8"/><rect x="60" y="145" width="${220/b}" height="48" rx="6" fill="#8b72df"/><text x="300" y="176" font-size="16">1/${b}＝${nb}/${d}</text><text x="300" y="217" font-size="19" font-weight="900">${na}/${d}＋${nb}/${d}＝${na+nb}/${d}</text></svg>`}
window.updateFA=()=>{const a=Number($('faAR').value),b=Number($('faBR').value);$('faA').textContent=a;$('faB').textContent=b;$('faBox').innerHTML=fractionAddSvg(a,b)}
function fractionStripLab(){return `<div class="labIntro"><b>📏 用同一條長度檢查答案</b><p>分數條能幫你看到 1/2、1/3 和 5/6 的大小關係，而不是只盯著分子分母。</p></div><div class="fractionRows"><div><b>1/2</b><span class="bars"><i style="width:50%"></i></span></div><div><b>1/3</b><span class="bars"><i style="width:33.33%"></i></span></div><div><b>5/6</b><span class="bars"><i style="width:83.33%"></i></span></div></div>`}

window.symShape='square';
function symmetryLab(){window.symShape='square';return `<div class="labIntro"><b>🪞 對稱軸＝鏡面</b><p>A 和 A′ 是一對對稱點。A 到鏡面的最短距離，必須等於 A′ 到鏡面的最短距離；AA′ 還要和鏡面成 90°。</p></div><div id="symBox">${symmetrySvg(3,0)}</div><div class="dual"><label>A 到鏡面距離＝<span id="symD">3</span> 格<input id="symDR" type="range" min="1" max="5" value="3" oninput="updateSym()"></label><label>上下位置＝<span id="symY">0</span><input id="symYR" type="range" min="-3" max="3" value="0" oninput="updateSym()"></label></div><div class="symShapePicker"><b>哪些圖形有對稱軸？</b><div class="modeBtns"><button onclick="showSymShape('triangle')">正三角形</button><button class="on" onclick="showSymShape('square')">正方形</button><button onclick="showSymShape('pentagon')">正五邊形</button><button onclick="showSymShape('hexagon')">正六邊形</button><button onclick="showSymShape('circle')">圓</button></div><div id="symShapeBox">${symShapeSvg('square')}</div></div>`}
function symmetrySvg(d,y){const axis=300,x1=axis-d*42,x2=axis+d*42,yy=130+y*18;return `<svg viewBox="0 0 620 285"><rect x="288" y="25" width="24" height="220" rx="12" fill="#d8eef5"/><line x1="300" y1="25" x2="300" y2="245" stroke="#37677c" stroke-width="3" stroke-dasharray="8 6"/><text x="266" y="20" font-size="13" font-weight="800">鏡子／對稱軸</text><circle cx="${x1}" cy="${yy}" r="10" fill="#4c7bea"/><circle cx="${x2}" cy="${yy}" r="10" fill="#ff7295"/><text x="${x1-28}" y="${yy-14}" font-size="15" font-weight="900">A</text><text x="${x2+14}" y="${yy-14}" font-size="15" font-weight="900">A′</text><line x1="${x1}" y1="${yy}" x2="${x2}" y2="${yy}" stroke="#f0a33c" stroke-width="3"/><path d="M 300 ${yy} h 14 v -14" fill="none" stroke="#f0a33c" stroke-width="2"/><text x="${(x1+300)/2-22}" y="${yy-12}" font-size="12">${d} 格</text><text x="${(x2+300)/2-8}" y="${yy-12}" font-size="12">${d} 格</text><text x="115" y="255" font-size="14" font-weight="800">A ↔ A′ 對稱：同距離，而且 AA′ ⟂ 對稱軸</text></svg>`}
window.updateSym=()=>{const d=Number($('symDR').value),y=Number($('symYR').value);$('symD').textContent=d;$('symY').textContent=y;$('symBox').innerHTML=symmetrySvg(d,y)}
function regularPoints(n,cx,cy,r){return Array.from({length:n},(_,i)=>{const a=-Math.PI/2+i*2*Math.PI/n;return [cx+r*Math.cos(a),cy+r*Math.sin(a)]})}
function symShapeSvg(type){const names={triangle:['正三角形',3],square:['正方形',4],pentagon:['正五邊形',5],hexagon:['正六邊形',6]};if(type==='circle')return `<svg viewBox="0 0 620 220"><circle cx="220" cy="110" r="78" fill="#f4f7ff" stroke="#5579df" stroke-width="3"/><line x1="142" y1="110" x2="298" y2="110" stroke="#f0a33c" stroke-width="2" stroke-dasharray="6 4"/><line x1="220" y1="32" x2="220" y2="188" stroke="#f0a33c" stroke-width="2" stroke-dasharray="6 4"/><line x1="165" y1="55" x2="275" y2="165" stroke="#f0a33c" stroke-width="2" stroke-dasharray="6 4"/><text x="350" y="86" font-size="18" font-weight="900">圓</text><text x="350" y="120" font-size="14">任何通過圓心的直線都可作對稱軸</text><text x="350" y="151" font-size="16" font-weight="900">對稱軸：無限多條</text></svg>`;const [name,n]=names[type]||names.square,pts=regularPoints(n,220,110,78);let axes='';for(let i=0;i<n;i++){const a=-Math.PI/2+i*Math.PI/n,dx=88*Math.cos(a),dy=88*Math.sin(a);axes+=`<line x1="${220-dx}" y1="${110-dy}" x2="${220+dx}" y2="${110+dy}" stroke="#f0a33c" stroke-width="1.8" stroke-dasharray="5 4"/>`}return `<svg viewBox="0 0 620 220"><polygon points="${pts.map(p=>p.join(',')).join(' ')}" fill="#f4f7ff" stroke="#5579df" stroke-width="3"/>${axes}<text x="350" y="84" font-size="18" font-weight="900">${name}</text><text x="350" y="118" font-size="15">正 ${n} 邊形</text><text x="350" y="150" font-size="17" font-weight="900">有 ${n} 條對稱軸</text><text x="350" y="179" font-size="12">提醒：一般 ${n} 邊形不一定對稱。</text></svg>`}
window.showSymShape=t=>{window.symShape=t;$('symShapeBox').innerHTML=symShapeSvg(t);document.querySelectorAll('.symShapePicker .modeBtns button').forEach(b=>b.classList.toggle('on',b.textContent.includes(t==='triangle'?'三角':t==='square'?'方形':t==='pentagon'?'五邊':t==='hexagon'?'六邊':'圓')))}
function mirrorPointLab(){return `<div class="labIntro"><b>✏️ 畫對稱點的 3 步</b><p>① 從 A 向對稱軸作垂線。② 量 A 到軸的距離。③ 穿過軸後延長相同距離得到 A′。這時軸剛好垂直平分 AA′。</p></div><div class="mirrorSteps"><span>A</span><i>── 垂直距離 d ──</i><b>│ 對稱軸 │</b><i>── 同樣距離 d ──</i><span>A′</span></div>`}

function operationsLab(){return `<div class="labIntro"><b>🧭 四則運算先看「結構」</b><p>括號像先完成的小任務；乘除比加減先處理；同一級才從左往右。</p></div><div class="flowCalc"><div>20 − 4 × 3</div><span>先算乘法 4×3 ↓</span><div>20 − 12</div><span>再算減法 ↓</span><strong>8</strong></div>`}
function distributeLab(){return `<div class="labIntro"><b>📦 分配律＝把一大片拆成好算的兩塊</b><p>25×12 可以想成 25×(10+2)，也就是 25×10 + 25×2。</p></div><svg viewBox="0 0 620 210"><rect x="70" y="55" width="390" height="95" fill="#eef4ff" stroke="#5579df"/><line x1="395" y1="55" x2="395" y2="150" stroke="#f0a33c" stroke-width="3"/><text x="210" y="105" font-size="22" font-weight="900">25×10</text><text x="405" y="105" font-size="18" font-weight="900">25×2</text><text x="155" y="188" font-size="17">25×12＝250＋50＝300</text></svg>`}

window.areaShape='parallelogram';
function areaLab(){window.areaShape='parallelogram';return `<div class="labIntro"><b>📏 高到底是「誰」到「誰」？</b><p>先選底。高就是<strong>對面的頂點／平行邊</strong>到<strong>這條底所在直線</strong>的垂直距離。垂足落在圖形外時，要把底邊畫成延長線。</p></div><div class="modeBtns"><button class="on" id="areaP" onclick="showAreaType('parallelogram')">平行四邊形</button><button id="areaT" onclick="showAreaType('triangle')">三角形</button><button id="areaZ" onclick="showAreaType('trapezoid')">梯形</button></div><div id="areaBox">${areaSvg('parallelogram',8,5,5)}</div><div class="triple"><label>底／下底＝<span id="arB">8</span><input id="arBR" type="range" min="4" max="12" value="8" oninput="updateArea()"></label><label>高＝<span id="arH">5</span><input id="arHR" type="range" min="3" max="8" value="5" oninput="updateArea()"></label><label id="topBaseLabel" style="opacity:.35">上底（梯形才用）＝<span id="arT">5</span><input id="arTR" type="range" min="2" max="10" value="5" oninput="updateArea()"></label></div>`}
function areaSvg(type,b,h,t){const y=220,hy=y-h*22;if(type==='triangle'){const B=190,C=190+b*25,A=110;const area=b*h/2;return `<svg viewBox="0 0 650 330"><line x1="65" y1="${y}" x2="545" y2="${y}" stroke="#7f8da1" stroke-width="2" stroke-dasharray="8 5"/><text x="62" y="247" font-size="12">BC 所在直線（底的延長線）</text><polygon points="${A},${hy} ${B},${y} ${C},${y}" fill="#e7efff" stroke="#5579df" stroke-width="3"/><line x1="${A}" y1="${hy}" x2="${A}" y2="${y}" stroke="#ec8e3f" stroke-width="4"/><path d="M ${A} ${y-14} h 14 v 14" fill="none" stroke="#ec8e3f" stroke-width="2"/><text x="${A-24}" y="${hy-8}" font-size="14" font-weight="900">A</text><text x="${B-8}" y="${y+20}" font-size="14">B</text><text x="${C-4}" y="${y+20}" font-size="14">C</text><text x="${A-66}" y="${(hy+y)/2}" font-size="13" font-weight="800">高 ${h}</text><text x="${(B+C)/2-28}" y="${y-10}" font-size="13" font-weight="800">底 ${b}</text><text x="360" y="72" font-size="17" font-weight="900">A 到 BC 所在直線的垂直距離＝高</text><text x="360" y="106" font-size="14">垂足在 B 左邊，所以要延長 BC。</text><text x="360" y="148" font-size="18" font-weight="900">三角形面積＝底×高÷2</text><text x="360" y="180" font-size="17">${b}×${h}÷2＝${area}</text></svg>`}
if(type==='trapezoid'){const x1=130,x2=x1+b*25,tx1=190,tx2=tx1+t*25,area=(b+t)*h/2;return `<svg viewBox="0 0 650 330"><polygon points="${x1},${y} ${x2},${y} ${tx2},${hy} ${tx1},${hy}" fill="#e7efff" stroke="#5579df" stroke-width="3"/><line x1="${tx1}" y1="${hy}" x2="${tx1}" y2="${y}" stroke="#ec8e3f" stroke-width="4"/><path d="M ${tx1} ${y-14} h 14 v 14" fill="none" stroke="#ec8e3f" stroke-width="2"/><text x="${(tx1+tx2)/2-35}" y="${hy-10}" font-size="13" font-weight="800">上底 ${t}</text><text x="${(x1+x2)/2-35}" y="${y+22}" font-size="13" font-weight="800">下底 ${b}</text><text x="${tx1-54}" y="${(hy+y)/2}" font-size="13" font-weight="800">高 ${h}</text><text x="365" y="74" font-size="17" font-weight="900">高＝上底到下底的垂直距離</text><text x="365" y="108" font-size="14">兩底互相平行；斜腰不是高。</text><text x="365" y="150" font-size="18" font-weight="900">梯形面積＝(上底＋下底)×高÷2</text><text x="365" y="184" font-size="17">(${t}＋${b})×${h}÷2＝${area}</text></svg>`
}const B=175,C=B+b*25,A=105,D=C-70,area=b*h;return `<svg viewBox="0 0 650 330"><line x1="60" y1="${y}" x2="555" y2="${y}" stroke="#7f8da1" stroke-width="2" stroke-dasharray="8 5"/><text x="62" y="247" font-size="12">底所在直線（向左延長）</text><polygon points="${B},${y} ${C},${y} ${D},${hy} ${A},${hy}" fill="#e7efff" stroke="#5579df" stroke-width="3"/><line x1="${A}" y1="${hy}" x2="${A}" y2="${y}" stroke="#ec8e3f" stroke-width="4"/><path d="M ${A} ${y-14} h 14 v 14" fill="none" stroke="#ec8e3f" stroke-width="2"/><text x="${A-20}" y="${hy-8}" font-size="14" font-weight="900">A</text><text x="${B-8}" y="${y+20}" font-size="14">B</text><text x="${A-58}" y="${(hy+y)/2}" font-size="13" font-weight="800">高 ${h}</text><text x="${(B+C)/2-28}" y="${y-10}" font-size="13" font-weight="800">底 ${b}</text><text x="365" y="73" font-size="17" font-weight="900">A 到底 BC 所在直線的垂直距離＝高</text><text x="365" y="107" font-size="14">這裡垂足在圖形外，所以畫出延長線。</text><text x="365" y="151" font-size="18" font-weight="900">平行四邊形面積＝底×高</text><text x="365" y="184" font-size="17">${b}×${h}＝${area}</text></svg>`}
window.showAreaType=t=>{window.areaShape=t;['P','T','Z'].forEach(k=>$('area'+k)?.classList.remove('on'));$(t==='parallelogram'?'areaP':t==='triangle'?'areaT':'areaZ')?.classList.add('on');$('topBaseLabel').style.opacity=t==='trapezoid'?'1':'.35';updateArea()}
window.updateArea=()=>{const b=Number($('arBR').value),h=Number($('arHR').value),t=Number($('arTR').value);$('arB').textContent=b;$('arH').textContent=h;$('arT').textContent=t;$('areaBox').innerHTML=areaSvg(window.areaShape,b,h,t)}
function triangleAreaLab(){return `<div class="labIntro"><b>✂️ 為什麼三角形與梯形都會 ÷2？</b><p>兩個完全相同的三角形可拼成同底同高的平行四邊形；兩個相同梯形也可拼成一個平行四邊形。因此原圖形都是拼成後面積的一半。</p></div><div class="cutPaste"><div>△</div><span>＋ 同一個 △</span><div>▱</div><b>所以一個 △＝▱ 的 1/2</b></div>`}

window.solidType='prism';
function solidsLab(){window.solidType='prism';return `<div class="labIntro"><b>🧊 真的「看成立體」：轉視角、改高度、看標示</b><p>柱體、錐體、球不要只背名字。先找底面，再看側面是平面還是曲面，有沒有稜與頂點。</p></div><div class="modeBtns solidBtns"><button class="on" data-solid="prism" onclick="showSolid('prism')">角柱</button><button data-solid="cylinder" onclick="showSolid('cylinder')">圓柱</button><button data-solid="pyramid" onclick="showSolid('pyramid')">角錐</button><button data-solid="cone" onclick="showSolid('cone')">圓錐</button><button data-solid="sphere" onclick="showSolid('sphere')">球</button></div><div id="solidBox">${solidPanel('prism',5,5,0)}</div><div class="triple"><label>高度＝<span id="solidH">5</span><input id="solidHR" type="range" min="3" max="8" value="5" oninput="updateSolid()"></label><label>底面大小＝<span id="solidB">5</span><input id="solidBR" type="range" min="3" max="8" value="5" oninput="updateSolid()"></label><label>觀看角度＝<span id="solidV">0</span>°<input id="solidVR" type="range" min="-25" max="25" value="0" oninput="updateSolid()"></label></div>`}
function solidPanel(type,h,b,v){return `<div class="solidStage">${solidSvg(type,h,b,v)}<div class="solidFacts">${solidFacts(type)}</div></div>`}
function solidFacts(t){const m={prism:['角柱','2 個平行且全等的多邊形底面','側面是平面','有稜、有頂點'],cylinder:['圓柱','2 個平行且全等的圓形底面','側面是曲面','沒有頂點；圓形底面和曲面相接'],pyramid:['角錐','1 個多邊形底面','側面是三角形平面','側面收向 1 個頂點'],cone:['圓錐','1 個圓形底面','側面是曲面','有 1 個頂點；曲面收向這個頂點'],sphere:['球','沒有平面底面','整個表面是曲面','沒有稜、沒有頂點']}[t];return `<b>${m[0]}</b><span>底面：${m[1]}</span><span>側面：${m[2]}</span><span>${m[3]}</span>`}
function solidSvg(t,h,b,v){const cx=245,baseW=110+b*10,H=95+h*11,sk=v*0.8,topY=55,botY=topY+H;if(t==='sphere'){const r=62+b*4;return `<svg viewBox="0 0 620 330"><defs><radialGradient id="sg"><stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="#dce8ff"/><stop offset="1" stop-color="#6f86d8"/></radialGradient></defs><circle cx="${cx}" cy="155" r="${r}" fill="url(#sg)" stroke="#506bc4" stroke-width="3"/><ellipse cx="${cx}" cy="155" rx="${r}" ry="${Math.max(12,r*.26)}" fill="none" stroke="#8ea1df" stroke-width="2" stroke-dasharray="6 4"/><path d="M ${cx} ${155-r} C ${cx-r*.35} ${115} ${cx-r*.35} ${195} ${cx} ${155+r}" fill="none" stroke="#8ea1df" stroke-width="2" stroke-dasharray="6 4"/><text x="115" y="285" font-size="15" font-weight="900">球：只有曲面，沒有底面、稜、頂點</text></svg>`}
if(t==='cylinder'){const rx=baseW/2,ry=25+Math.abs(v)/4;return `<svg viewBox="0 0 620 330"><ellipse cx="${cx+sk}" cy="${topY+25}" rx="${rx}" ry="${ry}" fill="#dce8ff" stroke="#5579df" stroke-width="3"/><path d="M ${cx+sk-rx} ${topY+25} L ${cx-rx} ${botY} A ${rx} ${ry} 0 0 0 ${cx+rx} ${botY} L ${cx+sk+rx} ${topY+25}" fill="#edf3ff" stroke="#5579df" stroke-width="3"/><ellipse cx="${cx}" cy="${botY}" rx="${rx}" ry="${ry}" fill="#cadcff" stroke="#5579df" stroke-width="3"/><line x1="${cx+rx+30}" y1="${topY+25}" x2="${cx+rx+30}" y2="${botY}" stroke="#ec8e3f" stroke-width="3"/><text x="${cx+rx+38}" y="${(topY+botY)/2}" font-size="13">高</text><text x="115" y="295" font-size="14">上、下兩個圓形底面互相平行且全等</text></svg>`}
if(t==='cone'){const rx=baseW/2,ry=27;return `<svg viewBox="0 0 620 330"><path d="M ${cx+sk} ${topY} L ${cx-rx} ${botY} A ${rx} ${ry} 0 0 0 ${cx+rx} ${botY} Z" fill="#e7efff" stroke="#5579df" stroke-width="3"/><ellipse cx="${cx}" cy="${botY}" rx="${rx}" ry="${ry}" fill="#cadcff" stroke="#5579df" stroke-width="3"/><circle cx="${cx+sk}" cy="${topY}" r="6" fill="#ec8e3f"/><text x="${cx+sk+12}" y="${topY+5}" font-size="13" font-weight="900">頂點</text><line x1="${cx+rx+25}" y1="${topY}" x2="${cx+rx+25}" y2="${botY}" stroke="#ec8e3f" stroke-width="3"/><text x="115" y="295" font-size="14">一個圓形底面；曲面收向一個頂點</text></svg>`}
if(t==='pyramid'){const w=baseW,depth=45+v*.5,apx=cx+sk;return `<svg viewBox="0 0 620 330"><polygon points="${cx-w/2},${botY} ${cx+w/2},${botY} ${cx+w/2+depth},${botY-35} ${cx-w/2+depth},${botY-35}" fill="#cadcff" stroke="#5579df" stroke-width="3"/><polygon points="${apx},${topY} ${cx-w/2},${botY} ${cx+w/2},${botY}" fill="#e7efff" stroke="#5579df" stroke-width="3"/><polygon points="${apx},${topY} ${cx+w/2},${botY} ${cx+w/2+depth},${botY-35}" fill="#dbe5fb" stroke="#5579df" stroke-width="3"/><circle cx="${apx}" cy="${topY}" r="6" fill="#ec8e3f"/><text x="${apx+10}" y="${topY+5}" font-size="13" font-weight="900">頂點</text><text x="105" y="295" font-size="14">一個多邊形底面；三角形側面收向同一頂點</text></svg>`}
const w=baseW,d=48+v*.45,tx=cx-w/2+sk,ty=topY,bx=cx-w/2,by=botY;return `<svg viewBox="0 0 620 330"><polygon points="${tx},${ty} ${tx+w},${ty} ${tx+w+d},${ty-30} ${tx+d},${ty-30}" fill="#dce8ff" stroke="#5579df" stroke-width="3"/><polygon points="${bx},${by} ${bx+w},${by} ${bx+w+d},${by-30} ${bx+d},${by-30}" fill="#cadcff" stroke="#5579df" stroke-width="3"/><line x1="${tx}" y1="${ty}" x2="${bx}" y2="${by}" stroke="#5579df" stroke-width="3"/><line x1="${tx+w}" y1="${ty}" x2="${bx+w}" y2="${by}" stroke="#5579df" stroke-width="3"/><line x1="${tx+w+d}" y1="${ty-30}" x2="${bx+w+d}" y2="${by-30}" stroke="#5579df" stroke-width="3"/><line x1="${tx+d}" y1="${ty-30}" x2="${bx+d}" y2="${by-30}" stroke="#5579df" stroke-width="3"/><text x="105" y="295" font-size="14">兩個互相平行且全等的多邊形底面</text></svg>`}
window.showSolid=t=>{window.solidType=t;document.querySelectorAll('.solidBtns button').forEach(b=>b.classList.toggle('on',b.dataset.solid===t));updateSolid()}
window.updateSolid=()=>{const h=Number($('solidHR').value),b=Number($('solidBR').value),v=Number($('solidVR').value);$('solidH').textContent=h;$('solidB').textContent=b;$('solidV').textContent=v;$('solidBox').innerHTML=solidPanel(window.solidType,h,b,v)}
function netLab(){return `<div class="labIntro"><b>📦 展開圖＝把立體的「面」攤平</b><p>展開圖能幫你看見每一個平面從哪裡來；球的表面是曲面，不能像紙盒一樣展成幾個平面多邊形。</p></div><div class="netVisual"><div class="cubeNet"><i></i><i></i><i></i><i></i><i></i><i></i></div><div><b>長方體／角柱</b><p>平面可以攤開成展開圖。</p></div></div>`}

/* ---------- v0.5 first-five deep concept visuals ---------- */
function placeValueDeepLab(){
 const labels=['十萬位','萬位','千位','百位','十位','個位','十分位','百分位','千分位','萬分位'];
 const vals=[3,0,5,0,4,2,7,0,8,6];
 return `<div class="deepExplain"><b>位值不是背名稱，是看「這一格值多少」</b><p>下面每格都能改數字。觀察同一個 5 放在千位和百分位，代表的大小差很多。</p></div>
 <div class="placeValueGrid">${labels.map((x,i)=>`<label><span>${x}</span><input id="pv${i}" type="number" min="0" max="9" value="${vals[i]}" oninput="updatePlaceValueDeep()"><small>${['×100000','×10000','×1000','×100','×10','×1','×0.1','×0.01','×0.001','×0.0001'][i]}</small></label>`).join('')}</div>
 <div id="pvReadout">${placeValueReadout(vals)}</div>
 <div class="fillChallenge"><b>✍️ 你來填：305,042.7086</b><p>把每個位值的「數字」填進格子，不是填它代表的數值。</p><div class="placeValueFill">${labels.map((x,i)=>`<label><span>${x}</span><input id="pvC${i}" inputmode="numeric" maxlength="1" placeholder="?" oninput="this.value=this.value.replace(/\\D/g,'').slice(0,1)"></label>`).join('')}</div><button onclick="checkPlaceValueFill()">檢查每一位</button><div id="pvFillFb" class="feedback"></div></div>`
}
function placeValueReadout(d){
 const num=`${d[0]}${d[1]}${d[2]},${d[3]}${d[4]}${d[5]}.${d[6]}${d[7]}${d[8]}${d[9]}`;
 const weights=[100000,10000,1000,100,10,1,.1,.01,.001,.0001];
 const parts=d.map((x,i)=>x?`${x}×${weights[i]}`:'').filter(Boolean);
 return `<div class="numberBuild"><strong>${num}</strong><span>= ${parts.join(' ＋ ')||'0'}</span></div>`
}
window.updatePlaceValueDeep=()=>{const d=Array.from({length:10},(_,i)=>Math.max(0,Math.min(9,Number($(`pv${i}`)?.value)||0)));const box=$('pvReadout');if(box)box.innerHTML=placeValueReadout(d)};
window.checkPlaceValueFill=()=>{const target=[3,0,5,0,4,2,7,0,8,6],fb=$('pvFillFb');let ok=true;target.forEach((v,i)=>{const e=$(`pvC${i}`);const good=Number(e?.value)===v;e?.classList.toggle('ok',good);e?.classList.toggle('no',!good);if(!good)ok=false});fb.className=`feedback ${ok?'good':'bad'}`;fb.textContent=ok?'✅ 全部位值都放對了！':'再看上面的位值表：從十萬位一路數到萬分位。'};

function decimalCompareDeep(){return `<div class="deepExplain"><b>比較順序：整數部分 → 十分位 → 百分位 → 千分位…</b><p>末尾補 0 不改變大小。輸入兩個數，系統會補到同樣位數再逐位比較。</p></div><div class="dual"><label>A<input id="dcA" type="number" step="0.0001" value="4.205" oninput="updateDecimalCompareDeep()"></label><label>B<input id="dcB" type="number" step="0.0001" value="4.25" oninput="updateDecimalCompareDeep()"></label></div><div id="dcBox">${decimalComparePanel(4.205,4.25)}</div>`}
function decimalComparePanel(a,b){const A=Number(a),B=Number(b),fa=A.toFixed(4),fb=B.toFixed(4),sign=A>B?'＞':A<B?'＜':'＝';return `<div class="comparePanel"><div><span>補 0 後</span><b>${fa}</b></div><strong>${sign}</strong><div><span>補 0 後</span><b>${fb}</b></div><p>從左邊第一個不同位值開始判斷，不看「誰的小數位數比較多」。</p></div>`}
window.updateDecimalCompareDeep=()=>{const a=Number($('dcA')?.value||0),b=Number($('dcB')?.value||0);if($('dcBox'))$('dcBox').innerHTML=decimalComparePanel(a,b)};

function decimalAlignDeep(){return `<div class="deepExplain"><b>缺位補 0，只是補空格</b><p>例如 7.5＝7.500。加減時讓小數點垂直對齊，個位對個位、十分位對十分位。</p></div><div class="dual"><label>A<input id="daA" type="number" step="0.001" value="7.5" oninput="updateDecimalAlignDeep()"></label><label>B<input id="daB" type="number" step="0.001" value="0.268" oninput="updateDecimalAlignDeep()"></label></div><div class="modeBtns"><button id="daMinus" class="on" onclick="setDecimalOp('-')">減法</button><button id="daPlus" onclick="setDecimalOp('+')">加法</button></div><div id="daBox">${decimalAlignPanel(7.5,.268,'-')}</div>`}
window.decimalOp='-';
window.setDecimalOp=op=>{window.decimalOp=op;$('daMinus')?.classList.toggle('on',op==='-');$('daPlus')?.classList.toggle('on',op==='+');updateDecimalAlignDeep()};
function decimalAlignPanel(a,b,op){const A=Number(a),B=Number(b),ans=op==='+'?A+B:A-B;return `<div class="columnMath"><span>${A.toFixed(3)}</span><span>${op} ${B.toFixed(3)}</span><i></i><strong>${ans.toFixed(3)}</strong><small>小數點在同一條垂直線上</small></div>`}
window.updateDecimalAlignDeep=()=>{const a=Number($('daA')?.value||0),b=Number($('daB')?.value||0);if($('daBox'))$('daBox').innerHTML=decimalAlignPanel(a,b,window.decimalOp)};

function roundingDeep(){return `<div class="deepExplain"><b>四捨五入不是刪數字，是找最近的指定刻度</b><p>拖動原數，再切換要取到哪一位。數線會把左右兩個候選概數畫出來。</p></div><div class="dual"><label>原數＝<span id="rdV">12.347</span><input id="rdVR" type="range" min="10" max="15" step="0.001" value="12.347" oninput="updateRoundingDeep()"></label><label>取到<select id="rdPlace" onchange="updateRoundingDeep()"><option value="0">個位</option><option value="1">十分位</option><option value="2" selected>百分位</option></select></label></div><div id="rdBox">${roundingPanel(12.347,2)}</div>`}
function roundingPanel(v,p){const f=10**p,lo=Math.floor(v*f)/f,hi=lo+1/f,mid=(lo+hi)/2,r=Math.round(v*f)/f,pos=Math.max(0,Math.min(1,(v-lo)/(hi-lo))),fmt=n=>n.toFixed(p);return `<svg viewBox="0 0 680 230"><text x="55" y="36" font-size="18" font-weight="900">${Number(v).toFixed(3)} 取到 ${['個位','十分位','百分位'][p]} → ${fmt(r)}</text><line x1="90" y1="135" x2="590" y2="135" stroke="#52647d" stroke-width="4"/><line x1="90" y1="120" x2="90" y2="150" stroke="#52647d" stroke-width="3"/><line x1="340" y1="120" x2="340" y2="150" stroke="#f0a33c" stroke-width="3" stroke-dasharray="5 4"/><line x1="590" y1="120" x2="590" y2="150" stroke="#52647d" stroke-width="3"/><text x="72" y="178" font-size="15">${fmt(lo)}</text><text x="317" y="178" font-size="13">中點 ${fmt(mid)}</text><text x="572" y="178" font-size="15">${fmt(hi)}</text><circle cx="${90+500*pos}" cy="135" r="11" fill="#4b73df"/><text x="${Math.max(55,80+500*pos)}" y="105" font-size="14" font-weight="900">原數</text></svg><div class="roundRule">右邊第一位 ${Math.floor((v*f*10)%10)} ${Math.floor((v*f*10)%10)>=5?'≥ 5 → 進位':'< 5 → 捨去'}</div>`}
window.updateRoundingDeep=()=>{const v=Number($('rdVR')?.value||0),p=Number($('rdPlace')?.value||0);if($('rdV'))$('rdV').textContent=v.toFixed(3);if($('rdBox'))$('rdBox').innerHTML=roundingPanel(v,p)};
function decimalLifeDeep(){return `<div class="receiptVisual"><div><b>校園小市集</b><span>麵包　28.60 元</span><span>果汁　35.75 元</span><i></i><strong>合計　64.35 元</strong></div><aside><b>先估</b><span>29＋36≈65</span><b>再精算</b><span>28.60＋35.75＝64.35</span><small>估算不是取代精算，而是幫你抓出離譜答案。</small></aside></div>`}

function factorInverseDeep(){return `<div class="relationFamily"><div class="bigEquation">6 × 4 ＝ 24</div><div class="arrowDown">↕ 乘除互逆</div><div class="twoEq"><b>24 ÷ 6 ＝ 4</b><b>24 ÷ 4 ＝ 6</b></div><div class="relationWords"><span>6、4 是 24 的<strong>因數</strong></span><span>24 是 6、4 的<strong>倍數</strong></span></div></div>`}
function divisibilityDeep(){return `<div class="deepExplain"><b>整除只問一件事：餘數是不是 0？</b></div><div class="dual"><label>被除數 N＝<span id="dvN">24</span><input id="dvNR" type="range" min="6" max="60" value="24" oninput="updateDivisibility()"></label><label>除數 d＝<span id="dvD">6</span><input id="dvDR" type="range" min="2" max="12" value="6" oninput="updateDivisibility()"></label></div><div id="dvBox">${divisibilityPanel(24,6)}</div>`}
function divisibilityPanel(n,d){const q=Math.floor(n/d),r=n%d,ok=r===0;return `<div class="divisionCheck ${ok?'ok':'no'}"><b>${n} ÷ ${d} ＝ ${q}${r?` 餘 ${r}`:''}</b><strong>${ok?'✅ 沒有餘數：可以整除':'❌ 有餘數：不能整除'}</strong><p>${ok?`${d} 是 ${n} 的因數；${n} 是 ${d} 的倍數。`:`${d} 不是 ${n} 的因數。`}</p></div>`}
window.updateDivisibility=()=>{const n=Number($('dvNR')?.value||1),d=Number($('dvDR')?.value||1);$('dvN').textContent=n;$('dvD').textContent=d;$('dvBox').innerHTML=divisibilityPanel(n,d)};
function gcfLifeDeep(){return `<div class="packVisual"><div><b>24 張紅卡</b><span>● ● ● ● ● ● ● ● ● ● ● ●</span><span>● ● ● ● ● ● ● ● ● ● ● ●</span></div><div><b>36 張藍卡</b><span>● ● ● ● ● ● ● ● ● ● ● ●</span><span>● ● ● ● ● ● ● ● ● ● ● ●</span><span>● ● ● ● ● ● ● ● ● ● ● ●</span></div><strong>最多相同份 → gcd(24,36)=12 → 12 包</strong><p>每包 2 張紅卡、3 張藍卡，兩種都剛好分完。</p></div>`}

function multipleInverseDeep(){return `<div class="relationFamily"><div class="bigEquation">4 × 3 ＝ 12</div><div class="relationWords"><span>4 是 12 的<strong>因數</strong></span><span>12 是 4 的<strong>倍數</strong></span></div><p>同一個「可以整除」關係，從小數看叫因數，從大數看叫倍數。</p></div>`}
function infiniteMultiplesDeep(){return `<div class="infiniteLine"><b>6 的倍數</b><span>6</span><i>→</i><span>12</span><i>→</i><span>18</span><i>→</i><span>24</span><i>→</i><span>30</span><i>→</i><strong>……永遠還能 +6</strong></div><div class="conceptCallout">所以：有<strong>最小正倍數</strong>（本身），但沒有<strong>最大倍數</strong>；公倍數也同樣沒有最大值。</div>`}

function fractionWordsDeep(){return `<div class="wordCards"><div><b>擴分</b><strong>「擴」＝擴大份數</strong><p>分子、分母同乘一個數。用到<strong>倍數</strong>。</p></div><div><b>約分</b><strong>「約」＝約簡</strong><p>分子、分母同除公因數。用到<strong>公因數</strong>。</p></div><div><b>通分</b><strong>「通」＝通到同一刻度</strong><p>找共同分母。用到<strong>公倍數</strong>。</p></div></div>`}
function pieSvg(num,den,cx=90,cy=90,r=68){let paths='';for(let i=0;i<den;i++){const a0=-90+i*360/den,a1=-90+(i+1)*360/den,p0=polar(cx,cy,r,a0+90),p1=polar(cx,cy,r,a1+90),large=(360/den)>180?1:0;paths+=`<path d="M ${cx} ${cy} L ${p0[0]} ${p0[1]} A ${r} ${r} 0 ${large} 1 ${p1[0]} ${p1[1]} Z" fill="${i<num?'#6687e8':'#f2f5fa'}" stroke="#fff" stroke-width="2"/>`}return paths}
function fractionPieDeep(){return `<div class="pieCompare"><div><svg viewBox="0 0 180 180">${pieSvg(1,2)}</svg><b>1/2</b></div><span>＝</span><div><svg viewBox="0 0 180 180">${pieSvg(2,4)}</svg><b>2/4</b></div><span>＝</span><div><svg viewBox="0 0 180 180">${pieSvg(4,8)}</svg><b>4/8</b></div></div><p class="centerNote">切得更細，但藍色面積都是半個圓。</p>`}
function expandFractionDeep(){return `<div class="fractionFlow"><b>3/4</b><span>分子 ×5<br>分母 ×5</span><strong>15/20</strong></div><div class="conceptCallout">分母 4 要「擴」到 20，是找倍數：4×5＝20；分子也必須一起 ×5。</div>`}
function reduceFractionDeep(){return `<div class="fractionFlow"><b>18/24</b><span>分子 ÷6<br>分母 ÷6</span><strong>3/4</strong></div><div class="conceptCallout">18 和 24 的最大公因數是 6；同除 6 一次約到最簡。</div>`}
function fractionCompareDeep(){return `<div class="compareRules"><div><b>同分母</b><div class="fracBig">7/10 ＞ 6/10</div><p>每一份一樣大，拿 7 份當然比拿 6 份多。</p></div><div><b>同分子</b><div class="pieMini"><svg viewBox="0 0 180 180">${pieSvg(3,4)}</svg><span>3/4</span></div><div class="pieMini"><svg viewBox="0 0 180 180">${pieSvg(3,8)}</svg><span>3/8</span></div><p>都拿 3 份時，分成 4 份的每份比較大，所以 3/4＞3/8。</p></div></div>`}

function ngonDeep(){return `<div class="deepExplain"><b>n 邊形：名稱先告訴你邊數</b><p>拖動 n，圖形會跟著改變。頂點數與邊數相同。</p></div><div id="ngBox">${ngonPanel(5,false)}</div><label>n＝<span id="ngN">5</span><input id="ngNR" type="range" min="3" max="10" value="5" oninput="updateNgon()"></label>`}
function ngonPanel(n,regular){const pts=regularPoints(n,210,125,90),name=`${n} 邊形`;return `<svg viewBox="0 0 620 270"><polygon points="${pts.map(p=>p.join(',')).join(' ')}" fill="#eef3ff" stroke="#5579df" stroke-width="4"/>${pts.map((p,i)=>`<circle cx="${p[0]}" cy="${p[1]}" r="5" fill="#f0a33c"/><text x="${p[0]+7}" y="${p[1]-7}" font-size="11">${i+1}</text>`).join('')}<text x="350" y="90" font-size="23" font-weight="900">${name}</text><text x="350" y="130" font-size="16">${n} 條邊</text><text x="350" y="160" font-size="16">${n} 個頂點</text><text x="350" y="195" font-size="14">n 只是邊數，不代表一定是正多邊形。</text></svg>`}
window.updateNgon=()=>{const n=Number($('ngNR')?.value||3);$('ngN').textContent=n;$('ngBox').innerHTML=ngonPanel(n,false)};
function regularNgonDeep(){return `<div class="deepExplain"><b>正 n 邊形＝每邊等長＋每個內角相等</b><p>只有邊等長還不夠；「正」同時管邊和角。</p></div><div id="rngBox">${regularNgonPanel(5)}</div><label>正 n 邊形：n＝<span id="rngN">5</span><input id="rngNR" type="range" min="3" max="10" value="5" oninput="updateRegularNgon()"></label>`}
function regularNgonPanel(n){const pts=regularPoints(n,210,125,90);return `<svg viewBox="0 0 620 270"><polygon points="${pts.map(p=>p.join(',')).join(' ')}" fill="#eaf6ef" stroke="#3d9b69" stroke-width="4"/>${pts.map((p,i)=>{const q=pts[(i+1)%n],mx=(p[0]+q[0])/2,my=(p[1]+q[1])/2;return `<text x="${mx}" y="${my}" font-size="14" font-weight="900">＝</text>`}).join('')}<text x="350" y="85" font-size="22" font-weight="900">正 ${n} 邊形</text><text x="350" y="125" font-size="15">所有 ${n} 條邊等長</text><text x="350" y="157" font-size="15">所有 ${n} 個內角相等</text><text x="350" y="195" font-size="14">內角和＝(${n}−2)×180°＝${(n-2)*180}°</text><text x="350" y="225" font-size="14">每角＝${(((n-2)*180)/n).toFixed(n===3||n===4||n===5||n===6?0:1)}°</text></svg>`}
window.updateRegularNgon=()=>{const n=Number($('rngNR')?.value||3);$('rngN').textContent=n;$('rngBox').innerHTML=regularNgonPanel(n)};
function triangleInequalityDeep(){return `<div class="deepExplain"><b>把三根棒子首尾接起來：能不能合攏？</b><p>最重要先檢查「最短兩邊的和 > 最長邊」。</p></div><div id="tiBox">${triangleIneqPanel(4,6,9)}</div><div class="triple"><label>a＝<span id="tiA">4</span><input id="tiAR" type="range" min="1" max="12" value="4" oninput="updateTriangleIneq()"></label><label>b＝<span id="tiB">6</span><input id="tiBR" type="range" min="1" max="12" value="6" oninput="updateTriangleIneq()"></label><label>c＝<span id="tiC">9</span><input id="tiCR" type="range" min="1" max="12" value="9" oninput="updateTriangleIneq()"></label></div>`}
function triangleIneqPanel(a,b,c){const arr=[a,b,c].sort((x,y)=>x-y),ok=arr[0]+arr[1]>arr[2];return `<div class="stickCheck ${ok?'ok':'no'}"><svg viewBox="0 0 620 260">${ok?`<polygon points="120,205 ${120+a*25},205 ${170+b*16},${Math.max(45,205-c*14)}" fill="#eef4ff" stroke="#5579df" stroke-width="5"/><text x="125" y="235" font-size="14">a=${a}</text><text x="300" y="150" font-size="14">b=${b}</text><text x="150" y="115" font-size="14">c=${c}</text>`:`<line x1="80" y1="80" x2="${80+a*25}" y2="80" stroke="#5579df" stroke-width="8"/><line x1="80" y1="130" x2="${80+b*25}" y2="130" stroke="#7f6bdc" stroke-width="8"/><line x1="80" y1="180" x2="${80+c*25}" y2="180" stroke="#f09a4a" stroke-width="8"/>`}<text x="390" y="90" font-size="18" font-weight="900">${arr[0]}＋${arr[1]} ${ok?'＞':'≤'} ${arr[2]}</text><text x="390" y="130" font-size="17" font-weight="900">${ok?'✅ 可以形成三角形':'❌ 無法合攏'}</text><text x="390" y="175" font-size="13">另外兩組兩邊和也要大於第三邊。</text></svg></div>`}
window.updateTriangleIneq=()=>{const a=Number($('tiAR')?.value||1),b=Number($('tiBR')?.value||1),c=Number($('tiCR')?.value||1);$('tiA').textContent=a;$('tiB').textContent=b;$('tiC').textContent=c;$('tiBox').innerHTML=triangleIneqPanel(a,b,c)};
function interiorSumDeep(){return `<div class="deepExplain"><b>不要死背 (n−2)×180°，先看它從哪來</b><p>固定一個頂點，向所有不相鄰頂點畫線；每多一邊，就多拆出一個三角形。</p></div><div id="isBox">${interiorSumPanel(6)}</div><label>邊數 n＝<span id="isN">6</span><input id="isNR" type="range" min="3" max="10" value="6" oninput="updateInteriorSum()"></label>`}
function interiorSumPanel(n){const pts=regularPoints(n,210,130,92),origin=pts[0],diags=pts.slice(2,-1).map(p=>`<line x1="${origin[0]}" y1="${origin[1]}" x2="${p[0]}" y2="${p[1]}" stroke="#f0a33c" stroke-width="2" stroke-dasharray="6 4"/>`).join('');return `<svg viewBox="0 0 650 290"><polygon points="${pts.map(p=>p.join(',')).join(' ')}" fill="#eef3ff" stroke="#5579df" stroke-width="4"/>${diags}<text x="365" y="82" font-size="20" font-weight="900">${n} 邊形 → ${n-2} 個三角形</text><text x="365" y="125" font-size="16">內角和＝(${n}−2)×180°</text><text x="365" y="160" font-size="24" font-weight="900">＝${(n-2)*180}°</text><text x="365" y="205" font-size="13">橘色虛線就是拆三角形的對角線。</text></svg>`}
window.updateInteriorSum=()=>{const n=Number($('isNR')?.value||3);$('isN').textContent=n;$('isBox').innerHTML=interiorSumPanel(n)};
function specialTrianglesDeep(){return `<div class="modeBtns"><button id="stEq" class="on" onclick="showSpecialTri('equilateral')">正三角形</button><button id="stIso" onclick="showSpecialTri('isosceles')">等腰三角形</button></div><div id="stBox">${specialTriPanel('equilateral',40)}</div><label id="stAngleLabel" class="hidden">頂角＝<span id="stA">40</span>°<input id="stAR" type="range" min="20" max="140" value="40" oninput="updateSpecialTri()"></label>`}
window.specialTriType='equilateral';
function specialTriPanel(t,a){if(t==='equilateral')return `<svg viewBox="0 0 620 260"><polygon points="210,35 90,220 330,220" fill="#eef8f2" stroke="#3d9b69" stroke-width="4"/><text x="190" y="78" font-size="18" font-weight="900">60°</text><text x="112" y="205" font-size="18" font-weight="900">60°</text><text x="280" y="205" font-size="18" font-weight="900">60°</text><text x="390" y="105" font-size="18" font-weight="900">三邊相等</text><text x="390" y="145" font-size="18">→ 三角也相等</text><text x="390" y="185" font-size="20" font-weight="900">180÷3＝60°</text></svg>`;const base=(180-a)/2;return `<svg viewBox="0 0 620 260"><polygon points="210,35 90,220 330,220" fill="#eef3ff" stroke="#5579df" stroke-width="4"/><text x="190" y="82" font-size="18" font-weight="900">${a}°</text><text x="108" y="205" font-size="18" font-weight="900">${base}°</text><text x="280" y="205" font-size="18" font-weight="900">${base}°</text><text x="390" y="105" font-size="17" font-weight="900">兩腰相等 → 兩底角相等</text><text x="390" y="150" font-size="18">(180−${a})÷2</text><text x="390" y="185" font-size="22" font-weight="900">＝${base}°</text></svg>`}
window.showSpecialTri=t=>{window.specialTriType=t;$('stEq')?.classList.toggle('on',t==='equilateral');$('stIso')?.classList.toggle('on',t==='isosceles');$('stAngleLabel')?.classList.toggle('hidden',t!=='isosceles');updateSpecialTri()};
window.updateSpecialTri=()=>{const a=Number($('stAR')?.value||40);if($('stA'))$('stA').textContent=a;if($('stBox'))$('stBox').innerHTML=specialTriPanel(window.specialTriType,a)};
function parallelogramDeep(){return `<div class="deepExplain"><b>平行四邊形兩條角度規則</b><p>對角相等；鄰角和 180°。拖動一個角，看另外三角一起變。</p></div><div id="pgBox">${parallelogramPanel(70)}</div><label>左下角 A＝<span id="pgA">70</span>°<input id="pgAR" type="range" min="35" max="145" value="70" oninput="updateParallelogram()"></label>`}
function parallelogramPanel(a){const b=180-a;return `<svg viewBox="0 0 650 280"><polygon points="120,210 365,210 315,65 70,65" fill="#eef3ff" stroke="#5579df" stroke-width="4"/><text x="94" y="199" font-size="17" font-weight="900">A ${a}°</text><text x="317" y="199" font-size="17" font-weight="900">B ${b}°</text><text x="270" y="95" font-size="17" font-weight="900">C ${a}°</text><text x="80" y="95" font-size="17" font-weight="900">D ${b}°</text><text x="410" y="90" font-size="16">∠A＝∠C（對角）</text><text x="410" y="128" font-size="16">∠B＝∠D（對角）</text><text x="410" y="166" font-size="16">∠A＋∠B＝180°（鄰角）</text></svg>`}
window.updateParallelogram=()=>{const a=Number($('pgAR')?.value||70);$('pgA').textContent=a;$('pgBox').innerHTML=parallelogramPanel(a)};
function trapezoidDeep(){return `<div class="deepExplain"><b>一般梯形不要背「對角相等」</b><p>AB∥CD，因此同一腰 AD 上的 ∠A＋∠D＝180°；同一腰 BC 上也一樣。只有等腰梯形才多出「同一底的底角相等」。</p></div><div class="modeBtns"><button id="tzGen" class="on" onclick="setTrapType('general')">一般梯形</button><button id="tzIso" onclick="setTrapType('iso')">等腰梯形</button></div><div id="tzBox">${trapezoidPanel(72,'general')}</div><label>左下角 A＝<span id="tzA">72</span>°<input id="tzAR" type="range" min="35" max="145" value="72" oninput="updateTrapezoid()"></label>`}
window.trapType='general';
function trapezoidPanel(a,t){const d=180-a,b=t==='iso'?a:105,c=180-b;return `<svg viewBox="0 0 650 300"><polygon points="110,220 390,220 330,75 175,75" fill="#fff5df" stroke="#d9942e" stroke-width="4"/><line x1="190" y1="62" x2="315" y2="62" stroke="#5579df" stroke-width="3"/><line x1="160" y1="233" x2="340" y2="233" stroke="#5579df" stroke-width="3"/><text x="125" y="205" font-size="16" font-weight="900">A ${a}°</text><text x="330" y="205" font-size="16" font-weight="900">B ${b}°</text><text x="286" y="105" font-size="16" font-weight="900">C ${c}°</text><text x="175" y="105" font-size="16" font-weight="900">D ${d}°</text><text x="430" y="88" font-size="16">AB ∥ CD</text><text x="430" y="125" font-size="16">A＋D＝180°</text><text x="430" y="160" font-size="16">B＋C＝180°</text><text x="430" y="202" font-size="14" font-weight="900">${t==='iso'?'等腰梯形：A＝B，D＝C':'一般梯形：A、B 不必相等'}</text></svg>`}
window.setTrapType=t=>{window.trapType=t;$('tzGen')?.classList.toggle('on',t==='general');$('tzIso')?.classList.toggle('on',t==='iso');updateTrapezoid()};
window.updateTrapezoid=()=>{const a=Number($('tzAR')?.value||72);$('tzA').textContent=a;$('tzBox').innerHTML=trapezoidPanel(a,window.trapType)};
function angleMixedDeep(){return `<div class="deepExplain"><b>複合圖形的策略：不要找新公式</b><p>① 先標出對頂角／平角。② 再找每一個三角形的 180°。③ 若有平行線、等腰、平行四邊形或梯形，再套它們的性質。</p></div>${angleDiagram(4)}<div class="conceptCallout">下面完整章節還有 12 組不同的角度大雜燴圖。</div>`}
function angleGalleryHtml(){const qs=(BANK.u05||[]).slice(16,28);return `<section class="questCard angleGallery"><div class="cardHead"><div><span class="step">★</span><h3>角度大雜燴圖庫｜12 組</h3></div><small>交疊・星型・飛鏢型・四邊形</small></div><p>先看圖、口頭說出「第一步用哪個性質」，再按顯示解答。這些不是 12 個新公式，而是把舊規則重新組合。</p><div class="angleGrid">${qs.map((q,i)=>`<article><div class="anglePic">${angleDiagram(i)}</div><b>${q.text.replace(/【[^】]+】/,'')}</b><div class="angleAnswer hidden" id="angAns${i}">${q.explain}　答案：${q.options[q.answer]}</div><button onclick="toggleAngleAnswer(${i})">顯示／隱藏解答</button></article>`).join('')}</div></section>`}
window.toggleAngleAnswer=i=>$(`angAns${i}`)?.classList.toggle('hidden');
function angleDiagram(i){
 const n=i%12;
 if(n===0)return `<svg viewBox="0 0 360 210"><line x1="60" y1="35" x2="300" y2="180" stroke="#5579df" stroke-width="4"/><line x1="300" y1="35" x2="60" y2="180" stroke="#d17f3e" stroke-width="4"/><text x="170" y="82" font-size="18" font-weight="900">38°</text><text x="174" y="145" font-size="18">?</text></svg>`;
 if(n===1)return `<svg viewBox="0 0 360 210"><line x1="45" y1="120" x2="315" y2="120" stroke="#5579df" stroke-width="4"/><line x1="180" y1="120" x2="280" y2="45" stroke="#d17f3e" stroke-width="4"/><text x="205" y="105" font-size="18">125°</text><text x="115" y="105" font-size="18">?</text></svg>`;
 if(n===2)return `<svg viewBox="0 0 360 210"><polygon points="180,35 65,175 300,175" fill="#eef3ff" stroke="#5579df" stroke-width="4"/><text x="82" y="162" font-size="18">48°</text><text x="255" y="162" font-size="18">67°</text><text x="170" y="75" font-size="18">?</text></svg>`;
 if(n===3)return `<svg viewBox="0 0 360 210"><polygon points="180,30 70,175 290,175" fill="#eef8f2" stroke="#3d9b69" stroke-width="4"/><text x="78" y="162" font-size="18">68°</text><text x="258" y="162" font-size="18">68°</text><text x="170" y="70" font-size="18">?</text></svg>`;
 if(n===4||n===5||n===6)return `<svg viewBox="0 0 360 230"><polygon points="180,20 70,105 290,105" fill="#eef3ff" stroke="#5579df" stroke-width="4"/><polygon points="180,210 70,125 290,125" fill="#fff1e6" stroke="#d17f3e" stroke-width="4"/><line x1="70" y1="115" x2="290" y2="115" stroke="#59697e" stroke-width="2" stroke-dasharray="5 4"/><text x="82" y="92" font-size="16">${n===5?'61°':'52°'}</text><text x="250" y="92" font-size="16">${n===5?'47°':''}</text><text x="170" y="100" font-size="17">${n===4?'52°':'?'}</text><text x="170" y="145" font-size="18">?</text></svg>`;
 if(n===7)return `<svg viewBox="0 0 360 230"><polygon points="180,25 125,110 180,205 235,110" fill="#fff0e8" stroke="#d17f3e" stroke-width="4"/><line x1="70" y1="110" x2="290" y2="110" stroke="#5579df" stroke-width="4"/><text x="215" y="95" font-size="18">140°</text><text x="130" y="95" font-size="18">?</text></svg>`;
 if(n===8)return `<svg viewBox="0 0 360 220"><polygon points="95,175 275,175 235,45 55,45" fill="#eef3ff" stroke="#5579df" stroke-width="4"/><text x="72" y="78" font-size="18">105°</text><text x="228" y="78" font-size="18">?</text></svg>`;
 if(n===9)return `<svg viewBox="0 0 360 220"><polygon points="70,175 290,175 245,55 115,55" fill="#fff5df" stroke="#d9942e" stroke-width="4"/><text x="82" y="160" font-size="18">112°</text><text x="120" y="85" font-size="18">?</text><text x="55" y="205" font-size="13">等腰梯形</text></svg>`;
 if(n===10)return `<svg viewBox="0 0 360 230"><polygon points="180,25 55,190 305,190" fill="none" stroke="#5579df" stroke-width="4"/><line x1="90" y1="145" x2="270" y2="145" stroke="#d17f3e" stroke-width="4"/><text x="78" y="135" font-size="17">40°</text><text x="258" y="135" font-size="17">65°</text><text x="170" y="72" font-size="18">?</text></svg>`;
 return `<svg viewBox="0 0 360 230"><polygon points="180,25 70,190 180,145 290,190" fill="#f3efff" stroke="#7b68cc" stroke-width="4"/><text x="78" y="176" font-size="17">35°</text><text x="250" y="176" font-size="17">55°</text><text x="170" y="130" font-size="18">?</text><text x="138" y="215" font-size="13">飛鏢／凹四邊形示意</text></svg>`
}

/* v0.5 unique-id variants used inside full chapters (avoid duplicated controls). */
function factorPairsDeepUnique(){return `<div class="deepExplain"><b>用乘法配對，不漏掉任何因數</b><p>拖動 N。配對找到開始反過來重複時，就可以停止搜尋。</p></div><div id="fpBox">${factorPanel(24)}</div><label>N＝<span id="fpN">24</span><input id="fpNR" type="range" min="6" max="48" value="24" oninput="updateFactorPairsDeep()"></label>`}
window.updateFactorPairsDeep=()=>{const n=Number($('fpNR')?.value||1);$('fpN').textContent=n;$('fpBox').innerHTML=factorPanel(n)};
function gcfDeepUnique(){return `<div class="deepExplain"><b>兩邊都能整除的數，才是公因數</b><p>共同分法中最大的，就是最大公因數。</p></div><div id="gfdBox">${gcfPanel(18,24)}</div><div class="dual"><label>A＝<span id="gfdA">18</span><input id="gfdAR" type="range" min="6" max="48" value="18" oninput="updateGcfDeep()"></label><label>B＝<span id="gfdB">24</span><input id="gfdBR" type="range" min="6" max="48" value="24" oninput="updateGcfDeep()"></label></div>`}
window.updateGcfDeep=()=>{const a=Number($('gfdAR')?.value||1),b=Number($('gfdBR')?.value||1);$('gfdA').textContent=a;$('gfdB').textContent=b;$('gfdBox').innerHTML=gcfPanel(a,b)};
function multipleLineDeepUnique(){return `<div class="deepExplain"><b>共同落點＝公倍數</b><p>第一個正共同落點就是最小公倍數。</p></div><div id="mldBox">${multipleSvg(4,6)}</div><div class="dual"><label>甲步長＝<span id="mldA">4</span><input id="mldAR" type="range" min="1" max="10" value="4" oninput="updateMultipleLineDeep()"></label><label>乙步長＝<span id="mldB">6</span><input id="mldBR" type="range" min="1" max="10" value="6" oninput="updateMultipleLineDeep()"></label></div>`}
window.updateMultipleLineDeep=()=>{const a=Number($('mldAR')?.value||1),b=Number($('mldBR')?.value||1);$('mldA').textContent=a;$('mldB').textContent=b;$('mldBox').innerHTML=multipleSvg(a,b)};
function lcmTimeDeepUnique(){return `<div class="deepExplain"><b>週期題先找「第一次再次同時」</b><p>每 4 分鐘與每 6 分鐘回到起點，第一次再次同時是 12 分鐘。</p></div><div id="ltdBox">${trackPanel(4,6,200)}</div><div class="dual"><label>甲每圈＝<span id="ltdA">4</span> 分<input id="ltdAR" type="range" min="2" max="10" value="4" oninput="updateLcmTimeDeep()"></label><label>乙每圈＝<span id="ltdB">6</span> 分<input id="ltdBR" type="range" min="2" max="10" value="6" oninput="updateLcmTimeDeep()"></label></div>`}
window.updateLcmTimeDeep=()=>{const a=Number($('ltdAR')?.value||2),b=Number($('ltdBR')?.value||2);$('ltdA').textContent=a;$('ltdB').textContent=b;$('ltdBox').innerHTML=trackPanel(a,b,200)};
function trackLcmDeepUnique(){return `<div class="deepExplain"><b>同時回起點後，再把時間換成圈數與距離</b><p>這是生活題最常多問的一步。</p></div><div id="tldBox">${trackPanel(5,8,300)}</div><div class="triple"><label>甲每圈＝<span id="tldA">5</span> 分<input id="tldAR" type="range" min="2" max="10" value="5" oninput="updateTrackLcmDeep()"></label><label>乙每圈＝<span id="tldB">8</span> 分<input id="tldBR" type="range" min="2" max="10" value="8" oninput="updateTrackLcmDeep()"></label><label>跑道＝<span id="tldM">300</span> m<input id="tldMR" type="range" min="100" max="500" step="50" value="300" oninput="updateTrackLcmDeep()"></label></div>`}
window.updateTrackLcmDeep=()=>{const a=Number($('tldAR')?.value||2),b=Number($('tldBR')?.value||2),m=Number($('tldMR')?.value||100);$('tldA').textContent=a;$('tldB').textContent=b;$('tldM').textContent=m;$('tldBox').innerHTML=trackPanel(a,b,m)};
function sectorDeepUnique(){return `<div class="deepExplain"><b>圓心角決定弧占整個圓周的比例</b><p>兩條直線都必須是半徑，且在圓心相遇，和中間那段弧一起才圍成扇形。</p></div><div id="sduBox">${sectorPanel(120,5)}</div><div class="dual"><label>圓心角＝<span id="sduA">120</span>°<input id="sduAR" type="range" min="30" max="330" step="30" value="120" oninput="updateSectorDeep()"></label><label>半徑＝<span id="sduR">5</span> cm<input id="sduRR" type="range" min="2" max="8" value="5" oninput="updateSectorDeep()"></label></div>`}
window.updateSectorDeep=()=>{const a=Number($('sduAR')?.value||30),r=Number($('sduRR')?.value||2);$('sduA').textContent=a;$('sduR').textContent=r;$('sduBox').innerHTML=sectorPanel(a,r)};
