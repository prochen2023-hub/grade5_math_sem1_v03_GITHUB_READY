(function(){
"use strict";
const synth=window.speechSynthesis;let activeEl=null,activeBtn=null,voices=[];
function load(){voices=synth?synth.getVoices():[]} if(synth){load();synth.onvoiceschanged=load}
function score(v){let n=0,l=(v.lang||"").toLowerCase(),name=(v.name||"").toLowerCase();if(l.startsWith("zh-tw"))n+=100;else if(l.startsWith("zh"))n+=60;if(/taiwan|mandarin|國語|meijia|yating|hsiao/.test(name))n+=20;return n}
function pick(){return voices.slice().sort((a,b)=>score(b)-score(a))[0]}
function readableText(el){
 const c=el.cloneNode(true);
 c.querySelectorAll('.voiceBtn,input,select,textarea,script,style,.feedback,.hintLine,.angleAnswer,.noVoice').forEach(x=>x.remove());
 c.querySelectorAll('button').forEach(b=>{if(!b.closest('.choices')&&!b.closest('.todayChoices')&&!b.closest('.practiceQ'))b.remove()});
 return (c.innerText||c.textContent||"").replace(/(\d+)\s*\/\s*(\d+)/g,"$2 分之 $1").replace(/\s+/g," ").replace(/\+/g," 加 ").replace(/=/g," 等於 ").replace(/−/g," 減 ").replace(/×/g," 乘以 ").replace(/÷/g," 除以 ").replace(/>/g," 大於 ").replace(/</g," 小於 ").trim()
}
function reset(){if(activeBtn){activeBtn.innerHTML='🔊 <span>朗讀</span>';activeBtn.classList.remove('on')}activeBtn=null;activeEl=null}
function speak(el,b){
 if(!synth)return;
 if(activeEl===el&&synth.speaking&&!synth.paused){synth.pause();b.innerHTML='▶ <span>繼續</span>';return}
 if(activeEl===el&&synth.paused){synth.resume();b.innerHTML='⏸ <span>暫停</span>';return}
 synth.cancel();reset();activeEl=el;activeBtn=b;const txt=readableText(el);if(!txt)return;
 const u=new SpeechSynthesisUtterance(txt);u.lang='zh-TW';u.rate=.88;u.pitch=1;const v=pick();if(v)u.voice=v;
 u.onend=reset;u.onerror=reset;b.innerHTML='⏸ <span>暫停</span>';b.classList.add('on');synth.speak(u)
}
function enhance(){
 document.querySelectorAll('[data-voice]').forEach(el=>{
   if(el.dataset.vready)return;
   // When a whole card is readable, do not add a second speaker to nested readable fragments.
   if(el.parentElement?.closest('[data-voice]')){el.dataset.vready='nested';return}
   el.dataset.vready='1';el.classList.add('voiceReadable');
   const b=document.createElement('button');b.className='voiceBtn';b.type='button';b.innerHTML='🔊 <span>朗讀</span>';b.title='朗讀這一格的內容與題目';b.setAttribute('aria-label','朗讀這一格');
   b.onclick=e=>{e.preventDefault();e.stopPropagation();speak(el,b)};el.prepend(b)
 })
}
const obs=new MutationObserver(()=>setTimeout(enhance,20));
document.addEventListener('DOMContentLoaded',()=>{enhance();obs.observe(document.body,{childList:true,subtree:true})});
window.G5Voice={enhance,stop:()=>{synth?.cancel();reset()}};
})();
