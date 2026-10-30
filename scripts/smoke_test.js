#!/usr/bin/env node
/* Browser-light smoke test: executes app.js with a minimal DOM and verifies all 10 units render. */
const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
const elems=new Map();
function el(id){
  if(!elems.has(id)) elems.set(id,{id,textContent:'',innerHTML:'',style:{},classList:{add(){},remove(){},toggle(){},contains(){return false}},addEventListener(){},scrollIntoView(){}});
  return elems.get(id);
}
let domReady;
const document={
  getElementById:el,
  addEventListener:(n,fn)=>{if(n==='DOMContentLoaded')domReady=fn},
  querySelector:()=>null, querySelectorAll:()=>[],
  body:{classList:{add(){},remove(){},toggle(){}},appendChild(){}},
  createElement:()=>({className:'',textContent:'',classList:{add(){},remove(){}},remove(){}})
};
const windowObj={addEventListener(){},scrollTo(){},dispatchEvent(){},location:{search:''},history:{replaceState(){}}};
const account={boot(){},progress(){return {completed:{},correct:{},attempts:{},mistakes:{},challenge:{},xp:0,lastUnit:'u01',daily:{date:'',correct:0,units:0}}},saveProgress(){},openPanel(){}};
const voice={stop(){},enhance(){}};
const ctx={console,document,window:windowObj,G5Account:account,G5Voice:voice,setTimeout:(fn)=>{fn();return 1},clearTimeout(){},CustomEvent:function(){},URLSearchParams,Date,Math,Number,String,Object,Array,JSON,Error};
windowObj.G5Account=account; windowObj.G5Voice=voice;
ctx.fetch=async rel=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(path.join(ROOT,rel),'utf8'))});
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT,'assets/js/app.js'),'utf8'),ctx,{filename:'assets/js/app.js'});
(async()=>{
  if(typeof domReady!=='function') throw new Error('DOMContentLoaded init 未註冊');
  await domReady();
  await new Promise(r=>setImmediate(r));
  if(el('unitNav').innerHTML.length<500) throw new Error('章節導覽未渲染');
  for(let i=1;i<=10;i++){
    const id='u'+String(i).padStart(2,'0');
    ctx.selectUnit(id,false);
    const html=el('main').innerHTML;
    if(html.length<5000) throw new Error(`${id} 主內容過短或未渲染 (${html.length})`);
    for(const marker of ['生活任務','錯誤診療室','BOSS 題','分層練習']){
      if(!html.includes(marker)) throw new Error(`${id} 缺少區塊：${marker}`);
    }
    if(html.includes('找不到互動圖')||html.includes('找不到小實驗')) throw new Error(`${id} 互動圖映射失敗`);
    if(i<=5 && !html.includes('本章核心觀念地圖')) throw new Error(`${id} 缺少 v0.5 核心觀念地圖`);
    const ids=[...html.matchAll(/\bid=\"([^\"]+)\"/g)].map(m=>m[1]); const dup=ids.filter((x,j)=>ids.indexOf(x)!==j); if(dup.length) throw new Error(`${id} 主要內容有重複 id: ${[...new Set(dup)].join(',')}`);
  }
  // Focused today mode: one concept only, not an entire chapter.
  vm.runInContext("viewMode='today'; current='u01'; lessonIndex=0; renderUnit();",ctx);
  const today=el('main').innerHTML;
  if(!today.includes('今天不塞整章')||!today.includes('TODAY CARD 1/5')) throw new Error('今日任務模式未正確渲染');
  if(today.includes('生活任務：答對就過關')||today.includes('錯誤診療室')) throw new Error('今日任務錯誤地塞入完整章節');
  vm.runInContext("viewMode='today'; current='u06'; lessonIndex=0; renderUnit();",ctx); const today6=el('main').innerHTML; if(!today6.includes('今天不塞整章')||today6.includes('生活任務：答對就過關')) throw new Error('第6-10章 fallback 今日任務不應載入整章');
  console.log('SMOKE OK: 10 chapters + focused today-task mode render correctly');
})().catch(e=>{console.error('SMOKE FAILED:',e.stack||e);process.exit(1)});
