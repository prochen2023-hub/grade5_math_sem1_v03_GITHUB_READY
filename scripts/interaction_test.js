#!/usr/bin/env node
/* v0.4 interaction-logic regression test: exercise diagram generators without a real browser. */
const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
const dummy={textContent:'',innerHTML:'',value:'',style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){}};
const document={getElementById:()=>dummy,addEventListener(){},querySelector(){return null},querySelectorAll(){return []},body:{classList:{add(){},remove(){},toggle(){}},appendChild(){}},createElement(){return dummy}};
const windowObj={addEventListener(){},scrollTo(){},dispatchEvent(){}};
const ctx={console,document,window:windowObj,G5Account:{boot(){},progress(){return{}},saveProgress(){},openPanel(){}},G5Voice:{stop(){},enhance(){}},setTimeout(){return 1},clearTimeout(){},Date,Math,Number,String,Object,Array,JSON,Error};
vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(ROOT,'assets/js/app.js'),'utf8'),ctx);
function assert(c,m){if(!c)throw new Error(m)}
assert(ctx.factorPanel(12).includes('1 一定是因數')&&ctx.factorPanel(12).includes('12 元'),'factor panel missing extreme split concept');
assert(ctx.gcfPanel(12,18).includes('最大公因數＝6'),'GCF calculation failed');
assert(ctx.multipleSvg(4,6).includes('12 公尺')&&ctx.multipleSvg(4,6).includes('24 公尺'),'number-line common multiples failed');
assert(ctx.trackPanel(4,6,200).includes('12 分鐘')&&ctx.trackPanel(4,6,200).includes('甲：3 圈＝600 m'),'track LCM failed');
assert(ctx.polygonSvg(5,4,true).includes('周長＝4＋4＋4＋4＋4')&&ctx.polygonSvg(5,4,true).includes('20 cm'),'polygon perimeter failed');
assert(ctx.polygonSvg(5,4,false).includes('逐邊相加'),'irregular polygon explanation missing');
assert(ctx.sectorPanel(90,4).includes('1/4')&&ctx.sectorPanel(90,4).includes('弧長'),'sector ratio/arc length failed');
assert(ctx.symShapeSvg('pentagon').includes('5 條對稱軸'),'regular polygon symmetry axes failed');
assert(ctx.areaSvg('triangle',8,5,5).includes('底的延長線')&&ctx.areaSvg('triangle',8,5,5).includes('垂直距離'),'triangle height extension missing');
assert(ctx.areaSvg('trapezoid',8,5,5).includes('上底到下底的垂直距離'),'trapezoid height missing');
assert(ctx.solidPanel('sphere',5,5,0).includes('沒有稜、沒有頂點'),'sphere features missing');
assert(ctx.solidPanel('cone',5,5,15).includes('圓錐')&&ctx.solidPanel('cone',5,5,15).includes('頂點'),'cone 3D panel failed');
for(const t of ['prism','cylinder','pyramid','cone','sphere']) assert(ctx.solidSvg(t,5,5,0).includes('<svg'),'solid SVG missing '+t);
console.log('INTERACTION TEST OK: v0.4 concept diagrams and calculations');
