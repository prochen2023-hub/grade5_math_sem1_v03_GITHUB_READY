(function(){
"use strict";
const STORE="g5m1_accounts_v1",CUR="g5m1_current_account_v1";
function read(){try{return JSON.parse(localStorage.getItem(STORE)||'{"accounts":{}}')}catch{return {accounts:{}}}}
function write(x){localStorage.setItem(STORE,JSON.stringify(x))}
function getId(){return localStorage.getItem(CUR)||""}
function getAccount(){const d=read();return d.accounts[getId()]||null}
function ensure(id,name){
 id=(id||"").trim();name=(name||id).trim();
 if(!/^[\u4e00-\u9fffA-Za-z0-9_-]{2,24}$/.test(id))throw new Error("帳號請用2–24個中文字、英文字、數字、_ 或 -");
 const d=read(),now=new Date().toISOString();
 d.accounts[id]=d.accounts[id]||{id,displayName:name,createdAt:now,lastActivityAt:now,progress:{}};
 d.accounts[id].displayName=name||d.accounts[id].displayName;d.accounts[id].lastActivityAt=now;
 write(d);localStorage.setItem(CUR,id);return d.accounts[id]
}
function progress(){
 const a=getAccount();return a?.progress?.g5m1||{completed:{},correct:{},attempts:{},xp:0,lastUnit:"u01"}
}
function saveProgress(p){
 const id=getId();if(!id)return;
 const d=read();if(!d.accounts[id])return;
 d.accounts[id].progress=d.accounts[id].progress||{};
 d.accounts[id].progress.g5m1=p;d.accounts[id].lastActivityAt=new Date().toISOString();write(d)
}
function openPanel(){
 const a=getAccount(),old=document.getElementById("accountOverlay");if(old)old.remove();
 const div=document.createElement("div");div.id="accountOverlay";div.className="accountOverlay";
 div.innerHTML=`<div class="accountCard"><button class="closeAccount" id="closeAccount">×</button><h3>${a?"切換學習者":"先取一個學習帳號"}</h3><p>目前先不用密碼。進度會依帳號保存在這台裝置。</p><label>帳號<input id="accId" value="${a?.id||""}" placeholder="例如 ming5"></label><label>顯示名稱<input id="accName" value="${a?.displayName||""}" placeholder="例如 小明"></label><button class="primary" id="accLogin">開始學習</button>${a?`<button class="secondary" id="accLogout">登出目前帳號</button>`:""}<div id="accMsg"></div></div>`;
 document.body.appendChild(div);
 document.getElementById("closeAccount").onclick=()=>div.remove();
 document.getElementById("accLogin").onclick=()=>{try{ensure(document.getElementById("accId").value,document.getElementById("accName").value);div.remove();renderHeader();window.dispatchEvent(new CustomEvent("g5-account-changed"))}catch(e){document.getElementById("accMsg").textContent=e.message}};
 if(a)document.getElementById("accLogout").onclick=()=>{localStorage.removeItem(CUR);div.remove();renderHeader();window.dispatchEvent(new CustomEvent("g5-account-changed"))}
}
function renderHeader(){
 const a=getAccount();document.querySelectorAll("[data-account-name]").forEach(el=>el.textContent=a?a.displayName:"登入")
}
function boot(opt={}){renderHeader();if(opt.promptIfMissing&&!getAccount())setTimeout(openPanel,120)}
window.G5Account={boot,openPanel,getAccount,ensure,progress,saveProgress,read,renderHeader};
})();