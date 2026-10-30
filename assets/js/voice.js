(function(){
"use strict";
const s=window.speechSynthesis;let current=null,btn=null,voices=[];
function load(){voices=s?s.getVoices():[]} if(s){load();s.onvoiceschanged=load}
function pick(){return voices.slice().sort((a,b)=>score(b)-score(a))[0]}
function score(v){let n=0,l=(v.lang||"").toLowerCase(),name=(v.name||"").toLowerCase();if(l.startsWith("zh-tw"))n+=100;else if(l.startsWith("zh"))n+=60;if(/taiwan|mandarin|國語|meijia|yating|hsiao/.test(name))n+=20;return n}
function text(el){const c=el.cloneNode(true);c.querySelectorAll("button,input,.voiceBtn").forEach(x=>x.remove());return (c.innerText||"").replace(/\s+/g," ").replace(/\+/g," 加 ").replace(/=/g," 等於 ").replace(/−/g," 減 ").trim()}
function reset(){if(btn){btn.textContent="🔊";btn.classList.remove("on")}btn=null;current=null}
function speak(el,b){
 if(!s)return;
 if(current===el&&s.speaking&&!s.paused){s.pause();b.textContent="▶";return}
 if(current===el&&s.paused){s.resume();b.textContent="⏸";return}
 s.cancel();reset();current=el;btn=b;
 const u=new SpeechSynthesisUtterance(text(el));u.lang="zh-TW";u.rate=.9;u.pitch=1;const v=pick();if(v)u.voice=v;
 u.onend=reset;u.onerror=reset;b.textContent="⏸";b.classList.add("on");s.speak(u)
}
function enhance(){
 document.querySelectorAll("[data-voice]").forEach(el=>{
   if(el.dataset.vready)return;el.dataset.vready="1";el.classList.add("voiceReadable");
   const b=document.createElement("button");b.className="voiceBtn";b.type="button";b.textContent="🔊";b.title="播放／暫停語音導讀";b.onclick=e=>{e.stopPropagation();speak(el,b)};el.appendChild(b)
 })
}
const obs=new MutationObserver(()=>setTimeout(enhance,30));
document.addEventListener("DOMContentLoaded",()=>{enhance();obs.observe(document.body,{childList:true,subtree:true})});
window.G5Voice={enhance,stop:()=>{s?.cancel();reset()}};
})();