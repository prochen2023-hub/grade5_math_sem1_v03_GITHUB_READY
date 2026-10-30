#!/usr/bin/env node
/* Browser-light smoke test for v0.7: story flow, five-question levels, AI rest, exam lobby. */
const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
const elems=new Map();
function el(id){if(!elems.has(id)) elems.set(id,{id,textContent:'',innerHTML:'',style:{},classList:{add(){},remove(){},toggle(){},contains(){return false}},addEventListener(){},scrollIntoView(){}});return elems.get(id)}
let domReady;
const document={getElementById:el,addEventListener:(n,fn)=>{if(n==='DOMContentLoaded')domReady=fn},querySelector:()=>null,querySelectorAll:()=>[],body:{classList:{add(){},remove(){},toggle(){}},appendChild(){}},createElement:()=>({className:'',textContent:'',classList:{add(){},remove(){}},remove(){}})};
const windowObj={addEventListener(){},scrollTo(){},scrollY:0,dispatchEvent(){},location:{search:''},history:{replaceState(){}}};
const account={boot(){},progress(){return {completed:{},correct:{},attempts:{},mistakes:{},challenge:{},todayLessons:{},examAwards:{},xp:0,lastUnit:'u01',daily:{date:'',correct:0,units:0}}},saveProgress(){},openPanel(){}};
const voice={stop(){},enhance(){}};
const ctx={console,document,window:windowObj,G5Account:account,G5Voice:voice,setTimeout:(fn)=>{fn();return 1},clearTimeout(){},setInterval:()=>1,clearInterval(){},CustomEvent:function(){},URLSearchParams,Date,Math,Number,String,Object,Array,JSON,Error};
windowObj.G5Account=account;windowObj.G5Voice=voice;
ctx.fetch=async rel=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(path.join(ROOT,rel),'utf8'))});
vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(ROOT,'assets/js/app.js'),'utf8'),ctx,{filename:'assets/js/app.js'});
(async()=>{
 if(typeof domReady!=='function') throw new Error('DOMContentLoaded init 未註冊');
 await domReady(); await new Promise(r=>setImmediate(r));
 for(let i=1;i<=10;i++){
  const id='u'+String(i).padStart(2,'0');ctx.selectUnit(id,false);
  let html=el('main').innerHTML;
  for(const marker of ['先進入場景','挑戰關卡 1','故事任務','AI 休息站','冒險收穫']) if(!html.includes(marker)) throw new Error(`${id} 缺少區塊：${marker}`);
  if(html.includes('核心觀念地圖')||html.includes('錯誤診療室')||html.includes('題分層練習')) throw new Error(`${id} 還殘留舊式教材用語`);
  vm.runInContext('showFull=true;masteryLevel="A";renderUnit();',ctx); html=el('main').innerHTML;
  if(!html.includes('加碼冒險區')||!html.includes('月考 A 卷')||!html.includes('月考 B 卷')) throw new Error(`${id} 精熟/考場入口缺失`);
  const pq=(html.match(/class="practiceQ pictureQuestion/g)||[]).length;if(pq!==5) throw new Error(`${id} A級不是 5 題，而是 ${pq}`);
  const pics=(html.match(/class="qPicture"/g)||[]).length;if(pics<5) throw new Error(`${id} 題目圖像不足 ${pics}`);
  if(!html.includes('故事完結篇')) throw new Error(`${id} 缺少故事收尾`);
 }
 vm.runInContext("viewMode='today';current='u01';lessonIndex=0;renderUnit();",ctx); const today=el('main').innerHTML;
 if(!today.includes('今天只玩一小關')||!today.includes('TODAY LEVEL 1/5')) throw new Error('今日任務未改成關卡語言');
 console.log('SMOKE OK: v0.7 story flow + 5-question levels + AI rest + A/B exam lobby');
})().catch(e=>{console.error('SMOKE FAILED:',e.stack||e);process.exit(1)});
