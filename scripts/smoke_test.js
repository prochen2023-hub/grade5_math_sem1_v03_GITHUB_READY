#!/usr/bin/env node
/* Browser-light smoke test for v0.8: 10 story chapters + 2 independent exam checkpoints. */
const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..');const elems=new Map();
function el(id){if(!elems.has(id)) elems.set(id,{id,textContent:'',innerHTML:'',style:{},classList:{add(){},remove(){},toggle(){},contains(){return false}},addEventListener(){},scrollIntoView(){}});return elems.get(id)}
let domReady;
const document={getElementById:el,addEventListener:(n,fn)=>{if(n==='DOMContentLoaded')domReady=fn},querySelector:()=>null,querySelectorAll:()=>[],body:{classList:{add(){},remove(){},toggle(){}},appendChild(){}},createElement:()=>({className:'',textContent:'',classList:{add(){},remove(){}},remove(){}})};
const windowObj={addEventListener(){},scrollTo(){},scrollY:0,dispatchEvent(){},location:{search:''},history:{replaceState(){}}};
const account={boot(){},progress(){return {completed:{},correct:{},attempts:{},mistakes:{},challenge:{},todayLessons:{},examAwards:{},examScores:{},xp:0,lastUnit:'u01',daily:{date:'',correct:0,units:0}}},saveProgress(){},openPanel(){}};
const voice={stop(){},enhance(){}};
const ctx={console,document,window:windowObj,G5Account:account,G5Voice:voice,setTimeout:(fn)=>{fn();return 1},clearTimeout(){},setInterval:()=>1,clearInterval(){},CustomEvent:function(){},URLSearchParams,Date,Math,Number,String,Object,Array,JSON,Error};
ctx.fetch=async rel=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(path.join(ROOT,rel),'utf8'))});vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(ROOT,'assets/js/app.js'),'utf8'),ctx,{filename:'assets/js/app.js'});
(async()=>{if(typeof domReady!=='function') throw new Error('DOMContentLoaded init 未註冊');await domReady();await new Promise(r=>setImmediate(r));
 for(let i=1;i<=10;i++){const id='u'+String(i).padStart(2,'0');ctx.selectUnit(id,false);let html=el('main').innerHTML;for(const marker of ['先進入場景','挑戰關卡 1','故事任務','AI 休息站','冒險收穫'])if(!html.includes(marker))throw Error(`${id} 缺少區塊：${marker}`);ctx.showFull=true;ctx.masteryLevel='A';ctx.renderUnit();html=el('main').innerHTML;if(!html.includes('加碼冒險區')||!html.includes('A卷・新手村')||!html.includes('B卷・探險隊')||!html.includes('C卷・高手坡')||!html.includes('D卷・勇者塔'))throw Error(`${id} ABCD 預覽入口缺失`);if(html.includes('🔒'))throw Error(`${id} 還有鎖定文字`);const pq=(html.match(/class="practiceQ pictureQuestion/g)||[]).length;if(pq!==5)throw Error(`${id} 單級不是5題`);if(!html.includes('故事完結篇'))throw Error(`${id} 缺少故事收尾`)}
 ctx.selectCheckpoint('midterm',false);if(!el('main').innerHTML.includes('第一次模擬月考'))throw Error('第6站期中檢核無法渲染');ctx.selectCheckpoint('final',false);if(!el('main').innerHTML.includes('期末模擬考'))throw Error('第12站期末檢核無法渲染');
 const nav=el('unitNav').innerHTML;if(!nav.includes('6. 期中魔王檢核')||!nav.includes('12. 期末魔王檢核')||!nav.includes('7. 異分母分數的加減')||!nav.includes('11. 柱體、錐體和球'))throw Error('12站導覽編號錯誤');
 console.log('SMOKE OK: 10 story chapters + unlocked A-D five-question previews + station 6/12 exam checkpoints');
})().catch(e=>{console.error('SMOKE FAILED:',e.stack||e);process.exit(1)});
