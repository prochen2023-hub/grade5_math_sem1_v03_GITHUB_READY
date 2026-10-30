const $=id=>document.getElementById(id);
let UNITS=[],BANK={},current="u01",showFull=false,practiceFilter="all",progress={};
const DEFAULT_PROGRESS={completed:{},correct:{},attempts:{},mistakes:{},challenge:{},xp:0,lastUnit:"u01",combo:0,comboBest:0,lifeCorrect:0,fixedMistakes:0,hintsUsed:0,daily:{date:"",correct:0,units:0}};
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
 x.completed={...(p.completed||{})};x.correct={...(p.correct||{})};x.attempts={...(p.attempts||{})};x.mistakes={...(p.mistakes||{})};x.challenge={...(p.challenge||{})};
 x.xp=Number(x.xp)||0;x.combo=Number(x.combo)||0;x.comboBest=Number(x.comboBest)||0;x.lifeCorrect=Number(x.lifeCorrect)||0;x.fixedMistakes=Number(x.fixedMistakes)||0;x.hintsUsed=Number(x.hintsUsed)||0;
 x.daily={date:p.daily?.date||"",correct:Number(p.daily?.correct)||0,units:Number(p.daily?.units)||0};
 if(x.daily.date!==todayKey())x.daily={date:todayKey(),correct:0,units:0};
 return x
}
async function init(){
 [UNITS,BANK]=await Promise.all([getJSON("data/units.json"),getJSON("data/practice.json")]);
 G5Account.boot({promptIfMissing:false});progress=normalizeProgress(G5Account.progress());current=progress.lastUnit||"u01";
 if(!UNITS.some(u=>u.id===current))current=UNITS[0]?.id||"u01";
 renderNav();selectUnit(current,false);bindShell();renderRewards()
}
function bindShell(){
 $("menuBtn")?.addEventListener("click",()=>document.body.classList.toggle("menuOpen"));
 $("accountBtn")?.addEventListener("click",()=>G5Account.openPanel());
 window.addEventListener("g5-account-changed",()=>{progress=normalizeProgress(G5Account.progress());current=progress.lastUnit||"u01";renderNav();renderUnit()})
}
function save(){progress.lastUnit=current;G5Account.saveProgress(progress);renderRewards()}
function selectUnit(id,scroll=true){
 G5Voice?.stop?.();current=id;progress.lastUnit=id;save();showFull=false;practiceFilter="all";
 renderNav();renderUnit();if(scroll)window.scrollTo({top:0,behavior:"smooth"});document.body.classList.remove("menuOpen")
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
 nav.innerHTML=UNITS.map((u,i)=>{const s=unitStars(u.id);return `<button class="${u.id===current?"on":""}" onclick="selectUnit('${u.id}')"><span>${u.emoji}</span><div><b>${i+1}. ${u.title}</b><small>${progress.completed[u.id]?`已過關 ${"⭐".repeat(s)}`:"先玩圖・解生活題"}</small></div></button>`}).join("");
 renderRewards()
}
function renderUnit(){
 const u=UNITS.find(x=>x.id===current),qs=chapterPractice(current),allQs=BANK[current]||[],stars=unitStars(current),wrongN=unresolvedMistakes(current);
 $("unitTitle").textContent=`${u.emoji} ${u.title}`;$("unitSub").textContent=u.hook;
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
  <div class="practiceHead"><div><h3 class="practiceTitle">10 題分層練習｜生活活用為主</h3><p class="practiceHint">先讀情境，圈出「已知、要找、單位」，再選數學工具；卡住可以看提示，不扣分。</p></div><div class="filterBtns"><button class="${practiceFilter==='all'?'on':''}" onclick="setPracticeFilter('all')">全部 ${allQs.length}</button><button class="${practiceFilter==='life'?'on':''}" onclick="setPracticeFilter('life')">🏙️ 生活題</button><button class="${practiceFilter==='mistake'?'on':''}" onclick="setPracticeFilter('mistake')">🩹 錯題 ${wrongN}</button></div></div>
  <div class="practiceList">${qs.length?qs.map((q,i)=>practiceHtml(q,i)).join(""):`<div class="emptyPractice">🎉 目前沒有待修錯題。遇到答錯的題目，會自動收進這裡。</div>`}</div>
 </section>
 <button class="fullToggle" onclick="toggleFull()">${showFull?"收起完整內容":"📚 打開精熟區＋Boss 挑戰＋錯題修復"}</button>
 <section class="achievementPanel"><h3>冒險徽章櫃</h3><div class="badgeGrid">${badgeStates().map(b=>`<div class="achievement ${b.ok?"on":""}"><span>${b.emoji}</span><b>${b.name}</b><small>${b.ok?"已解鎖":b.tip}</small></div>`).join("")}</div></section>`;
 G5Voice?.enhance?.();renderRewards()
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
function decimalLab(){return `<div id="decimalBox">${decimalSvg(3.47,.8)}</div><div class="dual"><label>A=<span id="dA">3.47</span><input id="dAR" type="range" min="0" max="9" step=".01" value="3.47" oninput="updateDecimal()"></label><label>B=<span id="dB">0.80</span><input id="dBR" type="range" min="0" max="9" step=".01" value=".8" oninput="updateDecimal()"></label></div>`}
function decimalSvg(a,b){const s=(n)=>Number(n).toFixed(2).split(".");let A=s(a),B=s(b),C=s(Number(a)+Number(b));return `<svg viewBox="0 0 620 250"><text x="70" y="45" font-size="18" font-weight="800">小數點對齊＝同單位排在同一欄</text>${["個位","十分位","百分位"].map((t,i)=>`<rect x="${130+i*120}" y="75" width="120" height="42" fill="#eef4ff" stroke="#d5e1f3"/><text x="${165+i*120}" y="102" font-size="14">${t}</text>`).join("")}<text x="165" y="150" font-size="24">${A[0]}</text><text x="282" y="150" font-size="24">.</text><text x="310" y="150" font-size="24">${A[1][0]}</text><text x="430" y="150" font-size="24">${A[1][1]}</text><text x="165" y="185" font-size="24">${B[0]}</text><text x="282" y="185" font-size="24">.</text><text x="310" y="185" font-size="24">${B[1][0]}</text><text x="430" y="185" font-size="24">${B[1][1]}</text><line x1="135" y1="200" x2="500" y2="200" stroke="#687b99"/><text x="155" y="232" font-size="21">${Number(a).toFixed(2)} + ${Number(b).toFixed(2)} = ${Number(a+b).toFixed(2)}</text></svg>`}
window.updateDecimal=()=>{const a=Number($("dAR").value),b=Number($("dBR").value);$("dA").textContent=a.toFixed(2);$("dB").textContent=b.toFixed(2);$("decimalBox").innerHTML=decimalSvg(a,b)}
function decimalCompare(){return `<div class="miniGame" data-voice><b>小技巧：</b>比較 4.2 和 4.18 時，把 4.2 想成 4.20。<div class="compareBig">4.20 &gt; 4.18</div></div>`}

function factorsLab(){return `<div id="factorBox">${factorSvg(12)}</div><label>方塊總數 N=<span id="fN">12</span><input type="range" min="6" max="30" step="1" value="12" oninput="updateFactor(this.value)"></label>`}
function divisors(n){return Array.from({length:n},(_,i)=>i+1).filter(x=>n%x===0)}
function factorSvg(n){const ds=divisors(n);return `<svg viewBox="0 0 620 250"><text x="65" y="42" font-size="19" font-weight="800">${n} 可以剛好分成哪些大小？</text><text x="65" y="78" font-size="15">因數：${ds.join("、")}</text>${ds.slice(0,6).map((d,i)=>`<rect x="${70+i*85}" y="115" width="${60}" height="${Math.max(22,120/d)}" rx="8" fill="#dfeaff" stroke="#5b7fe1"/><text x="${82+i*85}" y="205" font-size="12">${d}×${n/d}</text>`).join("")}</svg>`}
window.updateFactor=v=>{$("fN").textContent=v;$("factorBox").innerHTML=factorSvg(Number(v))}
function gcfLab(){return `<div class="venn"><div><b>12 的因數</b><p>1,2,3,4,6,12</p></div><div class="over"><b>共同</b><p>1,2,3,6</p><strong>最大＝6</strong></div><div><b>18 的因數</b><p>1,2,3,6,9,18</p></div></div>`}

function multiplesLab(){return `<div id="multipleBox">${multipleSvg(3,4)}</div><div class="dual"><label>跳 A=<span id="mA">3</span><input id="mAR" type="range" min="2" max="10" value="3" oninput="updateMultiple()"></label><label>跳 B=<span id="mB">4</span><input id="mBR" type="range" min="2" max="10" value="4" oninput="updateMultiple()"></label></div>`}
function multipleSvg(a,b){let nums=Array.from({length:25},(_,i)=>i+1);return `<svg viewBox="0 0 620 260"><text x="55" y="40" font-size="18" font-weight="800">兩種節拍何時同時踩到？</text>${nums.map((n,i)=>{const x=55+(i%12)*43,y=80+Math.floor(i/12)*58,both=n%a===0&&n%b===0,ca=n%a===0,cb=n%b===0;return `<circle cx="${x}" cy="${y}" r="17" fill="${both?"#ffd76d":ca?"#dce9ff":cb?"#e8dcff":"#f5f7fa"}" stroke="#cdd7e5"/><text x="${x-7}" y="${y+5}" font-size="12">${n}</text>`}).join("")}<text x="55" y="232" font-size="14">黃色＝共同倍數；第一個黃色就是最小公倍數</text></svg>`}
window.updateMultiple=()=>{const a=Number($("mAR").value),b=Number($("mBR").value);$("mA").textContent=a;$("mB").textContent=b;$("multipleBox").innerHTML=multipleSvg(a,b)}
function lcmLab(){return `<div class="miniGame"><b>節拍題：</b><p>每4分鐘亮一次的燈＋每6分鐘響一次的鐘，從現在同時發生開始，<strong>12分鐘後</strong>會再次同時發生。</p></div>`}

function fractionEqLab(){return `<div id="fracEq">${fractionEqSvg(2,4)}</div><label>把 1/2 切成幾等份？<input type="range" min="2" max="10" step="2" value="4" oninput="updateFracEq(this.value)"><span id="fracDen">4</span></label>`}
function fractionEqSvg(a,den){const num=den/2,w=420/den;return `<svg viewBox="0 0 620 220"><text x="70" y="42" font-size="18" font-weight="800">1/2 換切法，大小沒有變</text>${Array.from({length:den},(_,i)=>`<rect x="${80+i*w}" y="80" width="${w}" height="70" fill="${i<num?"#6f8deb":"#f3f5f9"}" stroke="#fff"/>`).join("")}<text x="235" y="190" font-size="22">1/2 = ${num}/${den}</text></svg>`}
window.updateFracEq=v=>{$("fracDen").textContent=v;$("fracEq").innerHTML=fractionEqSvg(2,Number(v))}
function commonDenLab(){return `<div class="fractionRows"><div><b>1/2</b><span class="bars six"><i style="width:50%"></i></span></div><div><b>1/3</b><span class="bars six"><i style="width:33.333%"></i></span></div><p>都切成 6 份後：3/6 和 2/6，單位一樣了。</p></div>`}

function polygonLab(){return `<div id="polyBox">${polygonSvg(5)}</div><label>邊數=<span id="polyN">5</span><input type="range" min="3" max="8" value="5" oninput="updatePoly(this.value)"></label>`}
function polygonSvg(n){let pts=[];for(let i=0;i<n;i++){let a=-Math.PI/2+i*2*Math.PI/n;pts.push([260+95*Math.cos(a),130+95*Math.sin(a)])}return `<svg viewBox="0 0 620 270"><polygon points="${pts.map(p=>p.join(",")).join(" ")}" fill="#edf3ff" stroke="#5579df" stroke-width="4"/>${pts.slice(2,-1).map(p=>`<line x1="${pts[0][0]}" y1="${pts[0][1]}" x2="${p[0]}" y2="${p[1]}" stroke="#ff9b56" stroke-width="2" stroke-dasharray="5 4"/>`).join("")}<text x="390" y="95" font-size="19" font-weight="800">${n}邊形</text><text x="390" y="130" font-size="16">可切成 ${n-2} 個三角形</text><text x="390" y="162" font-size="14">所以很多角度性質都能拆回三角形</text></svg>`}
window.updatePoly=v=>{$("polyN").textContent=v;$("polyBox").innerHTML=polygonSvg(Number(v))}
function sectorLab(){return `<div class="miniGame"><b>扇形先看中心角：</b><div class="sectorIcon">90°</div><p>90° ÷ 360° = 1/4，所以這個扇形就是整個圓的四分之一。</p></div>`}

function fractionAddLab(){return `<div id="faBox">${fractionAddSvg(2,3)}</div><div class="dual"><label>分母 A=<span id="faA">2</span><input id="faAR" type="range" min="2" max="8" value="2" oninput="updateFA()"></label><label>分母 B=<span id="faB">3</span><input id="faBR" type="range" min="2" max="8" value="3" oninput="updateFA()"></label></div>`}
function gcd(a,b){while(b)[a,b]=[b,a%b];return a}
function lcm(a,b){return a/gcd(a,b)*b}
function fractionAddSvg(a,b){let d=lcm(a,b),na=d/a,nb=d/b;return `<svg viewBox="0 0 620 240"><text x="65" y="42" font-size="18" font-weight="800">1/${a} + 1/${b}：先把每一小塊變一樣大</text><text x="90" y="100" font-size="22">1/${a} = ${na}/${d}</text><text x="90" y="140" font-size="22">1/${b} = ${nb}/${d}</text><text x="330" y="120" font-size="28">${na}/${d} + ${nb}/${d} = ${na+nb}/${d}</text><text x="330" y="160" font-size="14">通分不是魔法，是把分數單位變相同</text></svg>`}
window.updateFA=()=>{const a=Number($("faAR").value),b=Number($("faBR").value);$("faA").textContent=a;$("faB").textContent=b;$("faBox").innerHTML=fractionAddSvg(a,b)}
function fractionStripLab(){return `<div class="fractionRows"><div><b>1/2</b><span class="bars"><i style="width:50%"></i></span></div><div><b>1/3</b><span class="bars"><i style="width:33.33%"></i></span></div><div><b>5/6</b><span class="bars"><i style="width:83.33%"></i></span></div></div>`}

function symmetryLab(){return `<div id="symBox">${symmetrySvg(2)}</div><label>左邊點距離軸=<span id="symD">2</span><input type="range" min="1" max="5" value="2" oninput="updateSym(this.value)"></label>`}
function symmetrySvg(d){let x1=300-d*45,x2=300+d*45;return `<svg viewBox="0 0 620 250"><line x1="300" y1="35" x2="300" y2="215" stroke="#6d7d95" stroke-width="3" stroke-dasharray="7 5"/><circle cx="${x1}" cy="125" r="9" fill="#4c7bea"/><circle cx="${x2}" cy="125" r="9" fill="#ff7295"/><line x1="${x1}" y1="125" x2="${x2}" y2="125" stroke="#f0a33c" stroke-width="3"/><rect x="292" y="117" width="16" height="16" fill="#fff" stroke="#f0a33c"/><text x="120" y="65" font-size="16">A</text><text x="470" y="65" font-size="16">A'</text><text x="175" y="195" font-size="15">同距離 + 連線垂直對稱軸</text></svg>`}
window.updateSym=v=>{$("symD").textContent=v;$("symBox").innerHTML=symmetrySvg(Number(v))}
function mirrorPointLab(){return `<div class="miniGame"><b>畫對稱點 2 步：</b><p>① 從原點向對稱軸畫垂線。② 穿過軸後延長相同距離。</p></div>`}

function operationsLab(){return `<div class="flowCalc"><div>20−4×3</div><span>先乘法 ↓</span><div>20−12</div><span>再減法 ↓</span><strong>8</strong></div>`}
function distributeLab(){return `<div class="miniGame"><b>分配律其實是拆面積：</b><p>25×12 = 25×(10+2) = 25×10 + 25×2 = 300</p></div>`}

function areaLab(){return `<div id="areaBox">${areaSvg(8,5)}</div><div class="dual"><label>底=<span id="arB">8</span><input id="arBR" type="range" min="2" max="12" value="8" oninput="updateArea()"></label><label>高=<span id="arH">5</span><input id="arHR" type="range" min="2" max="8" value="5" oninput="updateArea()"></label></div>`}
function areaSvg(b,h){return `<svg viewBox="0 0 620 270"><polygon points="100,200 ${100+b*35},200 ${65+b*35},${200-h*25} 65,${200-h*25}" fill="#dfeaff" stroke="#5278df" stroke-width="3"/><line x1="65" y1="${200-h*25}" x2="65" y2="200" stroke="#f49b4a" stroke-width="4"/><rect x="65" y="187" width="13" height="13" fill="#fff" stroke="#f49b4a"/><text x="180" y="232" font-size="15">底 ${b}</text><text x="20" y="${200-h*12}" font-size="15">高 ${h}</text><text x="390" y="100" font-size="20" font-weight="800">面積 = 底 × 高</text><text x="390" y="138" font-size="17">${b} × ${h} = ${b*h}</text><text x="390" y="175" font-size="13">高一定和底垂直，不是斜邊</text></svg>`}
window.updateArea=()=>{const b=Number($("arBR").value),h=Number($("arHR").value);$("arB").textContent=b;$("arH").textContent=h;$("areaBox").innerHTML=areaSvg(b,h)}
function triangleAreaLab(){return `<div class="miniGame"><b>為什麼三角形要 ÷2？</b><p>兩個完全一樣的三角形可以拼成一個平行四邊形，所以一個三角形只占一半。</p></div>`}

function solidsLab(){return `<div class="solidCards"><button onclick="showSolid('prism')">柱體</button><button onclick="showSolid('cone')">錐體</button><button onclick="showSolid('sphere')">球</button><div id="solidBox">${solidInfo("prism")}</div></div>`}
function solidInfo(t){return t==="prism"?`<div class="solidPic">▱</div><b>柱體</b><p>兩個平行、全等的底面；側面連接它們。</p>`:t==="cone"?`<div class="solidPic">△</div><b>錐體</b><p>一個底面，側面往一個頂點收起來。</p>`:`<div class="solidPic">●</div><b>球</b><p>沒有底面、沒有稜、沒有頂點。</p>`}
window.showSolid=t=>$("solidBox").innerHTML=solidInfo(t)
function netLab(){return `<div class="miniGame"><b>想像把盒子剪開：</b><p>立體展開成平面圖，能幫你看清楚每一個面從哪裡來。</p><div class="netShape">□ □ □ □<br>&nbsp;&nbsp;&nbsp;□<br>&nbsp;&nbsp;&nbsp;□</div></div>`}
