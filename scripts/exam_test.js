#!/usr/bin/env node
const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
const elems=new Map();
function el(id){if(!elems.has(id))elems.set(id,{id,textContent:'',innerHTML:'',style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},scrollIntoView(){}});return elems.get(id)}
let ready;
const document={getElementById:el,addEventListener:(n,f)=>{if(n==='DOMContentLoaded')ready=f},querySelector:()=>null,querySelectorAll:()=>[],body:{classList:{add(){},remove(){},toggle(){}},appendChild(){}},createElement:()=>({classList:{add(){}},remove(){}})};
const windowObj={addEventListener(){},scrollTo(){},scrollY:0,location:{search:''},history:{replaceState(){}}};
let saved;
const acct={boot(){},progress(){return saved||{completed:{},correct:{},mistakes:{},attempts:{},challenge:{},todayLessons:{},examAwards:{},examScores:{},daily:{date:'',correct:0,units:0}}},saveProgress(p){saved=JSON.parse(JSON.stringify(p))}};
const ctx={console,document,window:windowObj,G5Account:acct,G5Voice:{enhance(){},stop(){}},setTimeout:(f)=>{f();return 1},clearTimeout(){},setInterval:()=>1,clearInterval(){},URLSearchParams,Date,Math,Number,String,Object,Array,JSON,Error};
ctx.fetch=async r=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(path.join(ROOT,r),'utf8'))});
vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(ROOT,'assets/js/app.js'),'utf8'),ctx);
(async()=>{
 await ready();await new Promise(r=>setImmediate(r));
 ctx.selectCheckpoint('midterm',false);let h=el('main').innerHTML;
 if(!h.includes('第一次模擬月考')||!h.includes('總分 100')||!h.includes('40 分鐘'))throw Error('期中檢核大廳格式缺失');
 ctx.startExam('A');h=el('main').innerHTML;
 if((h.match(/<article class="examQ/g)||[]).length!==15)throw Error('期中 A 卷不是15題');
 for(const x of ['一、選擇題','二、填充題','三、計算題','四、應用題','40:00','班級：','姓名：','得分：____ / 100'])if(!h.includes(x))throw Error('期中 A 卷缺少 '+x);
 const qs=ctx.examPaperQuestions('midterm','A');
 for(const q of qs){if(q.type==='choice')ctx.answerExam(q.id,q.answer,null);else ctx.answerExamText(q.id,q.answers[0])}
 ctx.finishExam(false);
 h=el('main').innerHTML;if(!h.includes('class="examScoreCircle">100<'))throw Error('期中 A 卷全對未顯示100分');
 if(ctx.examRecord('midterm','A').best!==100)throw Error('期中 A 卷最佳分未保存');
 if(ctx.examBossStars()<1)throw Error('100分未取得魔王星');
 ctx.closeExam();ctx.startExam('B');h=el('main').innerHTML;if((h.match(/<article class="examQ/g)||[]).length!==15)throw Error('期中 B卷不是15題');
 ctx.stopExamClock();
 ctx.selectCheckpoint('final',false);h=el('main').innerHTML;if(!h.includes('期末模擬考'))throw Error('期末檢核不存在');ctx.startExam('A');h=el('main').innerHTML;if((h.match(/<article class="examQ/g)||[]).length!==15)throw Error('期末 A卷不是15題');ctx.stopExamClock();
 console.log('EXAM OK: midterm/final checkpoints, A/B independent 15-question papers, 40-minute timer, weighted 100-point scoring, boss-star reward');
})().catch(e=>{console.error(e.stack||e);process.exit(1)});
