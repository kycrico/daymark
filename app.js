"use strict";
(()=>{
const KEY="daymark_v3_path",LEGACY="daymark_v2_iphone";
const $=id=>document.getElementById(id);
const today=()=>fmt(new Date());
const fmt=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");
const date=s=>{const a=s.split("-").map(Number);return new Date(a[0],a[1]-1,a[2]);};
const validDate=s=>typeof s==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&fmt(date(s))===s;
const uuid=()=>globalThis.crypto?.randomUUID?.()||"id"+Date.now().toString(36)+Math.random().toString(36).slice(2);
const clean=(s,n=120)=>String(s??"").slice(0,n);
const plain=()=>({habits:[],checks:{},rewards:[],redeemed:{},dreams:[],quests:[],settings:{reminder:"20:00"},v:3});
const e=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=String(txt);return n;};
const add=(parent,...kids)=>{kids.forEach(k=>k&&parent.append(k));return parent;};
const button=(txt,cls,fn)=>{const b=e("button",cls,txt);b.type="button";b.addEventListener("click",fn);return b;};
const sum=(arr,fn)=>arr.reduce((a,b)=>a+fn(b),0);
function normalize(v){
 if(!v||typeof v!=="object"||Array.isArray(v))throw Error("Invalid data");
 const x=plain();
 x.habits=Array.isArray(v.habits)?v.habits.filter(h=>h&&typeof h.id==="string"&&typeof h.name==="string"&&validDate(h.start)).slice(0,1000).map(h=>({
 id:clean(h.id,100),name:clean(h.name,70),emoji:clean(h.emoji||"🌱",12),start:h.start,
 minimum:clean(h.minimum||"",95),anchor:clean(h.anchor||"",95),schedule:["daily","weekdays","weekends"].includes(h.schedule)?h.schedule:"daily",questId:clean(h.questId||"",100),graduated:validDate(h.graduated)?h.graduated:null
 })):[];
 if(v.checks&&typeof v.checks==="object"&&!Array.isArray(v.checks))for(const [k,val] of Object.entries(v.checks).slice(0,200000))if(val===true&&/^\d{4}-\d{2}-\d{2}\|.{1,100}$/.test(k))x.checks[k]=true;
 x.rewards=Array.isArray(v.rewards)?v.rewards.filter(r=>r&&typeof r.id==="string"&&typeof r.name==="string").slice(0,300).map(r=>({
 id:clean(r.id,100),name:clean(r.name,80),emoji:clean(r.emoji||"🎁",12),cost:Math.min(9999,Math.max(0,Number(r.cost??15)||0)),
 rule:["all","count","specific"].includes(r.rule)?r.rule:"count",count:Math.min(100,Math.max(1,Number(r.count)||2)),habitId:clean(r.habitId||"",100)
 })):[];
 if(v.redeemed&&typeof v.redeemed==="object"&&!Array.isArray(v.redeemed))for(const [k,val] of Object.entries(v.redeemed).slice(0,10000))if(/^\d{4}-\d{2}-\d{2}\|/.test(k)){if(val===true)x.redeemed[k]={cost:0};else if(val&&typeof val==="object")x.redeemed[k]={cost:Math.min(9999,Math.max(0,Number(val.cost)||0))};}
 x.dreams=Array.isArray(v.dreams)?v.dreams.filter(q=>q&&typeof q.id==="string"&&typeof q.name==="string").slice(0,150).map(q=>({id:clean(q.id,100),name:clean(q.name,90),why:clean(q.why||"",270)})):[];
 x.quests=Array.isArray(v.quests)?v.quests.filter(q=>q&&typeof q.id==="string"&&typeof q.name==="string").slice(0,500).map(q=>({id:clean(q.id,100),name:clean(q.name,90),dreamId:clean(q.dreamId||"",100),type:q.type==="side"?"side":"main",milestone:clean(q.milestone||"",140),finished:validDate(q.finished)?q.finished:null})):[];
 x.settings.reminder=/^([01]\d|2[0-3]):[0-5]\d$/.test(v.settings?.reminder||"")?v.settings.reminder:"20:00";
 return x;
}
let db=plain(),month=new Date(),tab="today",includeGraduated=false,editing={habit:null,dream:null,quest:null,reward:null},usableStorage=true;
try{const raw=localStorage.getItem(KEY)||localStorage.getItem(LEGACY)||localStorage.getItem("daymark_mobile_offline_v1");if(raw){db=normalize(JSON.parse(raw));if(!localStorage.getItem(KEY))localStorage.setItem(KEY,JSON.stringify(db));}
 else{localStorage.setItem("daymark_probe","1");localStorage.removeItem("daymark_probe");}
}catch(err){usableStorage=false;}
$("storageWarning").hidden=usableStorage;
function save(){try{localStorage.setItem(KEY,JSON.stringify(db));usableStorage=true;$("storageWarning").hidden=true;}catch(err){usableStorage=false;$("storageWarning").hidden=false;toast("無法保存，請匯出備份");}}
let toastTimer;
function toast(msg){const n=$("toast");n.textContent=msg;n.classList.add("visible");clearTimeout(toastTimer);toastTimer=setTimeout(()=>n.classList.remove("visible"),2600);}
function eligible(h,day,{graduate=true}={}){
 if(day<h.start||day>today())return false;
 if(graduate&&h.graduated&&day>h.graduated)return false;
 const weekday=date(day).getDay();
 return h.schedule==="daily"||(h.schedule==="weekdays"&&weekday>=1&&weekday<=5)||(h.schedule==="weekends"&&(weekday===0||weekday===6));
}
function done(h,day){return db.checks[day+"|"+h.id]===true;}
function todays(day=today()){return db.habits.filter(h=>eligible(h,day));}
function dayStat(day=today()){const h=todays(day);return {total:h.length,done:h.filter(a=>done(a,day)).length};}
function completions(h){return Object.keys(db.checks).filter(k=>k.endsWith("|"+h.id)&&db.checks[k]&&eligible(h,k.slice(0,10))).length;}
function totalXP(){const completed=sum(db.habits,h=>completions(h));return completed*10+db.quests.filter(q=>q.finished).length*50;}
function wallet(){return Math.max(0,sum(db.habits,h=>completions(h))*5-sum(Object.values(db.redeemed),r=>r?.cost||0));}
function level(){const xp=totalXP();return {level:Math.floor(xp/100)+1,part:xp%100,xp};}
function streak(){let d=date(today()),last=fmt(d);if(dayStat(last).done<dayStat(last).total||dayStat(last).total===0)d.setDate(d.getDate()-1);let count=0;for(let i=0;i<1000;i++){last=fmt(d);const s=dayStat(last);if(!s.total||s.done!==s.total)break;count++;d.setDate(d.getDate()-1);}return count;}
function milestone(h){const n=completions(h);return n>=66?"66 日+":n>=21?"21 日+":n>=7?"7 日+":n+" 次";}
function elemEmpty(parent,glyph,title,desc,action,fn){const card=e("div","empty-state");add(card,e("div","empty-glyph",glyph),e("b","",title),e("p","",desc));if(action)add(card,button(action,"button ghost",fn));add(parent,card);}
function go(name){tab=name;document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id===name));document.querySelectorAll(".navitem").forEach(b=>b.classList.toggle("active",b.dataset.tab===name));window.scrollTo(0,0);render();}
function renderTop(){
 const s=dayStat(),lv=level(),progress=s.total?Math.round(s.done/s.total*100):0;
 $("dateLine").textContent=new Date().toLocaleDateString("zh-HK",{year:"numeric",month:"long",day:"numeric",weekday:"long"})+" · 今天完成 "+progress+"%";
 $("levelDisplay").textContent=lv.level;$("chapterNum").textContent=String(Math.ceil(lv.level/5));
 $("xpFill").style.width=lv.part+"%";$("xpText").textContent=lv.part+" / 100 XP";$("wallet").textContent="🪙 "+wallet();
 $("doneCount").textContent=s.done+" / "+s.total;$("streakDisplay").textContent=streak()+" 天";$("graduateCount").textContent=db.habits.filter(h=>h.graduated).length;
 $("reminderNudge").hidden=!(s.total>s.done&&new Date().toTimeString().slice(0,5)>=db.settings.reminder);
}
function toggle(h,day=today()){
 if(!eligible(h,day))return;
 const key=day+"|"+h.id,was=done(h,day);
 if(was)delete db.checks[key];else db.checks[key]=true;
 save();render();
 if(!was)toast("⚔ 任務完成 · +10 XP · +5 金幣");
}
function renderToday(){
 renderTop();const target=$("todayHabits");target.replaceChildren();const list=todays();
 if(!list.length)elemEmpty(target,"✦","每段旅程都由第一步開始","新增第一個細小行動，例如每天閱讀 2 頁。","建立第一個微習慣",()=>openHabit());
 for(const h of list){
 const is=done(h,today()),card=e("div","habit-card"+(is?" complete":""));
 const tick=button(is?"✓":" ","checkbtn"+(is?" done":""),()=>toggle(h));
 tick.setAttribute("aria-label",(is?"取消完成 ":"完成 ")+h.name);
 const body=e("div","habit-main");add(body,e("span","habit-title",h.name));
 const desc=[h.minimum?"最低版本："+h.minimum:"",h.anchor?"⚓ "+h.anchor+" → "+h.name:""].filter(Boolean).join(" · ");
 add(body,e("div","habit-sub",desc||"今日做小小，明日繼續"));
 const tag=db.quests.find(q=>q.id===h.questId);
 if(tag)add(body,e("div","habit-tag","↳ "+(tag.type==="main"?"主線":"支線")+" · "+tag.name));
 add(body,e("div","habit-extra",e("span","milestone",milestone(h)),e("span","",is?"今日已完成":"未打卡")));
 add(card,tick,e("span","habit-emoji",h.emoji),body,button("⋯","small-icon",()=>openHabit(h)));add(target,card);
 }
 const tips=["將新行動接喺每日一定會做嘅事之後。","定一個細到唔需要意志力嘅最低版本。","漏咗一日唔緊要，下次提示出現時再做。","獎勵自己有開始，而唔係只獎勵完美。","慢慢加難度。先求重複，再求質量。"];
 $("dailyTip").textContent=tips[(date(today()).getDate()-1)%tips.length];
 const featured=$("featuredQuest");featured.replaceChildren();
 const q=db.quests.find(q=>!q.finished)||db.quests[0];
 if(q)featured.append(questCard(q,true));else elemEmpty(featured,"⚔","人生主線尚未開啟","先記低一個你真正想追求嘅夢想，然後拆成今日嘅一小步。","建立人生主線",()=>{go("journey");openDream();});
}
function monthInfo(){return {y:month.getFullYear(),m:month.getMonth(),n:new Date(month.getFullYear(),month.getMonth()+1,0).getDate(),off:(new Date(month.getFullYear(),month.getMonth(),1).getDay()+6)%7};}
function monthDay(i){const z=monthInfo();return fmt(new Date(z.y,z.m,i));}
function renderCalendar(){
 const info=monthInfo(),d=new Date(info.y,info.m,1);
 $("monthLabel").textContent=d.toLocaleDateString("zh-HK",{year:"numeric",month:"long"});
 const grid=$("masterCalendar");grid.replaceChildren();for(let i=0;i<info.off;i++)add(grid,e("span","daycell empty",""));
 let elig=0,checks=0;
 for(let i=1;i<=info.n;i++){
 const day=monthDay(i),s=dayStat(day),n=button(String(i),"daycell"+(day===today()?" today":"")+(day>today()?" future":s.total&&s.done===s.total?" full":s.done?" partial":""),()=>{if(day>today())return;toast(day+" · "+s.done+"/"+s.total+" 完成；可於下方補打卡");});
 if(day<=today()){elig+=s.total;checks+=s.done;}
 n.setAttribute("aria-label",day+" 完成 "+s.done+"/"+s.total);add(n,e("span","bar"));add(grid,n);
 }
 $("monthStat").textContent="本月 "+checks+" / "+elig+" 次完成 · "+(elig?Math.round(checks/elig*100):0)+"%";
 const cards=$("habitCalendars");cards.replaceChildren();const list=db.habits.filter(h=>!h.graduated||includeGraduated);
 if(!list.length)elemEmpty(cards,"▦","暫時未有習慣日曆","建立微習慣之後，呢度就會每日顯示佢嘅進度。");
 for(const h of list){
  const card=e("article","habit-calendar-card"),head=e("div","calendar-card-top");
  const doneNum=Array.from({length:info.n},(_,i)=>monthDay(i+1)).filter(day=>eligible(h,day)&&done(h,day)).length;
  const total=Array.from({length:info.n},(_,i)=>monthDay(i+1)).filter(day=>eligible(h,day)).length;
  add(head,e("strong","",h.emoji+" "+h.name+(h.graduated?" 🎓":"")),e("small","",doneNum+"/"+total+" · "+(total?Math.round(doneNum/total*100):0)+"%"));
  const grid2=e("div","mini-grid");for(let j=0;j<info.off;j++)add(grid2,e("span","mini-day blank"));
  for(let i=1;i<=info.n;i++){const day=monthDay(i),on=eligible(h,day),is=done(h,day),cell=button(String(i),"mini-day"+(on?(is?" done":""):day>today()?" future":" off")+(day===today()?" today":""),()=>toggle(h,day));cell.disabled=!on;cell.setAttribute("aria-label",day+" "+h.name+" "+(is?"完成":"未完成"));add(grid2,cell);}
  add(card,head,grid2);add(cards,card);
 }
}
function progressForQuest(q){const hs=db.habits.filter(h=>h.questId===q.id);return {n:hs.length,checks:sum(hs,h=>completions(h))};}
function dreamCard(d){const quests=db.quests.filter(q=>q.dreamId===d.id),doneQ=quests.filter(q=>q.finished).length,questIds=new Set(quests.map(q=>q.id)),dreamActions=sum(db.habits.filter(h=>questIds.has(h.questId)),h=>completions(h));
 const card=e("article","dream-card"),top=e("div","dream-top"),body=e("div");
 add(body,e("span","eyebrow","✧ LIFE DREAM"),e("h3","",d.name));
 if(d.why)add(body,e("p","",d.why));
 add(top,body,button("⋯","small-icon",()=>openDream(d)));
 const foot=e("div","dream-progress");
 const bar=e("div","habit-track"),inner=e("div");inner.style.width=(quests.length?Math.round(doneQ/quests.length*100):0)+"%";
 add(bar,inner);add(foot,e("span","",doneQ+"/"+quests.length+" 任務 · "+dreamActions+" 次行動"),bar);
 add(card,top,foot);return card;
}
function questCard(q,compact=false){
 const s=progressForQuest(q),dream=db.dreams.find(d=>d.id===q.dreamId),card=e("article","quest-card "+q.type+(q.finished?" finished":"")),top=e("div","quest-top"),body=e("div");
 add(body,e("span","quest-type",q.type==="main"?"⚔ MAIN QUEST · 主線":"✧ SIDE QUEST · 支線"),e("h3","",q.name));
 if(q.milestone)add(body,e("p","",q.milestone));
 add(top,body,button("⋯","small-icon",()=>openQuest(q)));
 add(card,top);
 const sub=e("div","quest-foot");
 add(sub,e("span","",dream?"↳ "+dream.name:"獨立任務"),e("span","",q.finished?"✓ 完成於 "+q.finished:s.n+" 個微習慣 · "+s.checks+" 次行動"));add(card,sub);
 return card;
}
function renderJourney(){
 const dreams=$("dreamList");dreams.replaceChildren();
 if(!db.dreams.length)elemEmpty(dreams,"✧","人生夢想，由你定義","例如旅居世界、創作藝術、提升舞蹈或音樂。","＋ 新增人生夢想",()=>openDream());
 db.dreams.forEach(d=>add(dreams,dreamCard(d)));
 const quests=$("questList");quests.replaceChildren();
 if(!db.quests.length)elemEmpty(quests,"⚔","未有主線任務","將一個遙遠夢想拆成有方向嘅長期任務。","＋ 設定主線",()=>openQuest());
 [...db.quests].sort((a,b)=>Number(!!a.finished)-Number(!!b.finished)).forEach(q=>add(quests,questCard(q)));
 const grads=$("graduationList");grads.replaceChildren();const completed=db.habits.filter(h=>h.graduated);
 if(!completed.length)elemEmpty(grads,"🎓","畢業之殿尚待填滿","當習慣已經自然融入生活，可以畢業，騰出位置畀下一個挑戰。");
 completed.forEach(h=>{const c=e("div","graduated-card");add(c,e("span","",h.emoji+" "+h.name+" · "+completions(h)+" 次"),button("重新啟用","mini-action",()=>{if(!confirm("將此習慣恢復到每日清單？"))return;h.graduated=null;save();render();}));add(grads,c);});
}
function rewardStatus(r){
 const s=dayStat();let allowed=false,why="";
 if(r.rule==="all"){allowed=s.total>0&&s.done===s.total;why="今日全部 "+s.total+" 個習慣";}
 else if(r.rule==="specific"){const h=db.habits.find(h=>h.id===r.habitId);allowed=!!h&&eligible(h,today())&&done(h,today());why=h?"完成「"+h.name+"」":"指定習慣不存在";}
 else {allowed=s.done>=r.count;why="今日完成 "+r.count+" 個習慣（"+s.done+"/"+r.count+"）";}
 const claimed=!!db.redeemed[today()+"|"+r.id],enough=wallet()>=r.cost;
 return {allowed,why,claimed,enough};
}
function renderRewards(){
 $("rewardWallet").textContent="🪙 "+wallet();const out=$("rewardList");out.replaceChildren();
 if(!db.rewards.length)elemEmpty(out,"♛","設定屬於你嘅獎賞","例如睇一集劇集、玩 30 分鐘遊戲、周末去一間好咖啡店。","＋ 建立獎勵",()=>openReward());
 for(const r of db.rewards){
  const s=rewardStatus(r),card=e("article","reward-card"),head=e("div","reward-head"),info=e("div");
  add(info,e("strong","",r.name),e("small","","🪙 "+r.cost+" 金幣 · "+s.why));
  add(head,e("span","",r.emoji),info,button("⋯","small-icon",()=>openReward(r)));
  const foot=e("div","reward-foot"),state=e("span","status"+(s.allowed&&!s.claimed&&s.enough?" unlocked":""),s.claimed?"✓ 今日已兌換":!s.allowed?"🔒 未達成條件":!s.enough?"金幣不足":"✦ 可以兌換");
  const redeem=button(s.claimed?"已兌換":"兌換","button "+(s.allowed&&s.enough&&!s.claimed?"primary":"ghost"),()=>{
   const st=rewardStatus(r);if(!st.allowed||st.claimed||!st.enough)return;
   db.redeemed[today()+"|"+r.id]={cost:r.cost};save();render();toast("♛ 獎勵已兌換。享受你努力賺返嚟嘅時間！");
  });
  redeem.disabled=!s.allowed||s.claimed||!s.enough;add(foot,state,redeem);add(card,head,foot);add(out,card);
 }
}
function render(){renderToday();renderCalendar();renderJourney();renderRewards();}
function openModal(id){const m=$(id);if(m.showModal)m.showModal();else m.setAttribute("open","");}
function closeModal(id){const m=$(id);if(m.close)m.close();else m.removeAttribute("open");}
function setOptions(id,items,first){const n=$(id);n.replaceChildren();const create=(value,label)=>{const op=e("option","",label);op.value=value;add(n,op);};create("",first);items.forEach(i=>create(i.id,i.name));}
function openHabit(h=null){
 editing.habit=h?.id||null;$("habitDialogTitle").textContent=h?"編輯微習慣":"新增微習慣";
 $("habitName").value=h?.name||"";$("habitEmoji").value=h?.emoji||"🌱";if(!$("habitEmoji").value)$("habitEmoji").value="🌱";
 $("habitMinimum").value=h?.minimum||"";$("habitAnchor").value=h?.anchor||"";$("habitSchedule").value=h?.schedule||"daily";
 setOptions("habitQuest",db.quests.map(q=>({id:q.id,name:(q.type==="main"?"⚔ ":"✧ ")+q.name})),"唔連結任何任務");
 $("habitQuest").value=h?.questId||"";
 $("habitDelete").hidden=!h;$("habitGraduate").hidden=!h;
 $("habitGraduate").textContent=h?.graduated?"↶ 重新啟用":"🎓 習慣畢業";openModal("habitDialog");
}
function openDream(d=null){editing.dream=d?.id||null;$("dreamDialogTitle").textContent=d?"編輯人生夢想":"新增人生夢想";$("dreamName").value=d?.name||"";$("dreamWhy").value=d?.why||"";$("dreamDelete").hidden=!d;openModal("dreamDialog");}
function openQuest(q=null){editing.quest=q?.id||null;$("questDialogTitle").textContent=q?"編輯任務":"新增主線／支線";$("questName").value=q?.name||"";$("questMilestone").value=q?.milestone||"";$("questType").value=q?.type||"main";setOptions("questDream",db.dreams,"暫無所屬人生夢想");$("questDream").value=q?.dreamId||"";$("questDelete").hidden=!q;$("questFinish").hidden=!q;$("questFinish").textContent=q?.finished?"↶ 重新開啟":"+50 XP · 標記任務完成";openModal("questDialog");}
function openReward(r=null){editing.reward=r?.id||null;$("rewardDialogTitle").textContent=r?"編輯獎勵":"新增獎勵";$("rewardName").value=r?.name||"";$("rewardCost").value=r?.cost??15;$("rewardRule").value=r?.rule||"count";$("rewardCount").value=r?.count||2;setOptions("rewardHabit",db.habits.filter(h=>!h.graduated),"請選擇習慣");$("rewardHabit").value=r?.habitId||"";$("rewardDelete").hidden=!r;rewardFields();openModal("rewardDialog");}
function rewardFields(){$("rewardCountWrap").hidden=$("rewardRule").value!=="count";$("rewardHabitWrap").hidden=$("rewardRule").value!=="specific";}
$("habitForm").addEventListener("submit",ev=>{ev.preventDefault();const name=$("habitName").value.trim();if(!name)return;const item=db.habits.find(h=>h.id===editing.habit);
 const vals={name,emoji:$("habitEmoji").value,minimum:$("habitMinimum").value.trim(),anchor:$("habitAnchor").value.trim(),schedule:$("habitSchedule").value,questId:$("habitQuest").value};
 if(item)Object.assign(item,vals);else db.habits.push({id:uuid(),start:today(),graduated:null,...vals});
 save();closeModal("habitDialog");render();toast(item?"習慣已更新":"✦ 新習慣已加入今日任務");});
$("habitDelete").addEventListener("click",()=>{if(!confirm("刪除此習慣及其打卡紀錄？呢個動作唔可以還原。"))return;const id=editing.habit;db.habits=db.habits.filter(h=>h.id!==id);Object.keys(db.checks).filter(k=>k.endsWith("|"+id)).forEach(k=>delete db.checks[k]);save();closeModal("habitDialog");render();});
$("habitGraduate").addEventListener("click",()=>{const h=db.habits.find(h=>h.id===editing.habit);if(!h)return;if(!h.graduated&&!confirm("你已經唔需要再靠清單提醒自己做呢個習慣？畢業後會由每日列表移至畢業之殿。"))return;h.graduated=h.graduated?null:today();save();closeModal("habitDialog");render();toast(h.graduated?"🎓 習慣畢業！":"習慣已重新啟用");});
$("dreamForm").addEventListener("submit",ev=>{ev.preventDefault();const name=$("dreamName").value.trim();if(!name)return;const item=db.dreams.find(d=>d.id===editing.dream);const vals={name,why:$("dreamWhy").value.trim()};if(item)Object.assign(item,vals);else db.dreams.push({id:uuid(),...vals});save();closeModal("dreamDialog");render();toast("人生夢想已保存");});
$("dreamDelete").addEventListener("click",()=>{if(!confirm("刪除這個夢想？相關任務會保留，但唔再連結到夢想。"))return;const id=editing.dream;db.dreams=db.dreams.filter(d=>d.id!==id);db.quests.forEach(q=>{if(q.dreamId===id)q.dreamId="";});save();closeModal("dreamDialog");render();});
$("questForm").addEventListener("submit",ev=>{ev.preventDefault();const name=$("questName").value.trim();if(!name)return;const item=db.quests.find(q=>q.id===editing.quest);const vals={name,type:$("questType").value,dreamId:$("questDream").value,milestone:$("questMilestone").value.trim()};if(item)Object.assign(item,vals);else db.quests.push({id:uuid(),finished:null,...vals});save();closeModal("questDialog");render();toast("⚔ 任務已保存");});
$("questDelete").addEventListener("click",()=>{if(!confirm("刪除這個任務？習慣仍然保留。"))return;const id=editing.quest;db.quests=db.quests.filter(q=>q.id!==id);db.habits.forEach(h=>{if(h.questId===id)h.questId="";});save();closeModal("questDialog");render();});
$("questFinish").addEventListener("click",()=>{const q=db.quests.find(q=>q.id===editing.quest);if(!q)return;q.finished=q.finished?null:today();save();closeModal("questDialog");render();toast(q.finished?"⚔ 任務完成 · +50 XP":"任務已重新開啟");});
$("rewardForm").addEventListener("submit",ev=>{ev.preventDefault();const name=$("rewardName").value.trim(),cost=Number($("rewardCost").value),rule=$("rewardRule").value,count=Number($("rewardCount").value),habitId=$("rewardHabit").value;if(!name||!Number.isInteger(cost)||cost<0||cost>9999)return toast("請輸入有效名稱及金幣");if(rule==="specific"&&!db.habits.some(h=>h.id===habitId))return toast("請先選擇指定習慣");if(rule==="count"&&(!Number.isInteger(count)||count<1||count>100))return toast("請設定 1–100 個習慣");const vals={name,emoji:"🎁",cost,rule,count:count||1,habitId};const item=db.rewards.find(r=>r.id===editing.reward);if(item)Object.assign(item,vals);else db.rewards.push({id:uuid(),...vals});save();closeModal("rewardDialog");render();toast("♛ 獎勵已儲存");});
$("rewardDelete").addEventListener("click",()=>{if(!confirm("刪除呢個獎勵？已經兌換嘅金幣紀錄唔受影響。"))return;db.rewards=db.rewards.filter(r=>r.id!==editing.reward);save();closeModal("rewardDialog");render();});
$("rewardRule").addEventListener("change",rewardFields);
document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>closeModal(b.dataset.close)));
document.querySelectorAll("dialog").forEach(d=>d.addEventListener("click",ev=>{if(ev.target===d)closeModal(d.id);}));
document.querySelectorAll("[data-tab]").forEach(b=>b.addEventListener("click",()=>go(b.dataset.tab)));
document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>go(b.dataset.go)));
$("settingsShortcut").addEventListener("click",()=>go("settings"));$("addHabit").addEventListener("click",()=>openHabit());$("addDream").addEventListener("click",()=>openDream());$("addQuest").addEventListener("click",()=>openQuest());$("addReward").addEventListener("click",()=>openReward());
$("monthBack").addEventListener("click",()=>{month=new Date(month.getFullYear(),month.getMonth()-1,1);renderCalendar();});
$("monthNext").addEventListener("click",()=>{month=new Date(month.getFullYear(),month.getMonth()+1,1);renderCalendar();});
$("toggleGraduatedCalendar").addEventListener("click",()=>{includeGraduated=!includeGraduated;$("toggleGraduatedCalendar").textContent=includeGraduated?"隱藏已畢業":"顯示已畢業";renderCalendar();});
$("reminderTime").value=db.settings.reminder;
$("saveReminder").addEventListener("click",()=>{db.settings.reminder=$("reminderTime").value||"20:00";save();toast("提醒時間已保存");renderTop();});
function download(blob,name){const url=URL.createObjectURL(blob),a=e("a");a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);}
$("backup").addEventListener("click",()=>{download(new Blob([JSON.stringify({app:"daymark",version:3,...db},null,2)],{type:"application/json"}),"daymark-backup-"+today()+".json");toast("備份已匯出");});
$("restore").addEventListener("click",()=>$("restoreFile").click());
$("restoreFile").addEventListener("change",async ev=>{const f=ev.target.files?.[0];if(!f)return;try{if(f.size>12e6)throw Error("Too big");const v=normalize(JSON.parse(await f.text()));if(!confirm("匯入備份會覆蓋現有所有資料，確定？"))return;db=v;save();$("reminderTime").value=db.settings.reminder;render();toast("所有紀錄已還原");}catch(err){toast("備份格式無效，請使用 Daymark JSON 備份");}finally{ev.target.value="";}});
$("exportReminder").addEventListener("click",()=>{
 const tm=$("reminderTime").value||"20:00",[h,m]=tm.split(":").map(Number),d=new Date();d.setHours(h,m,0,0);if(d<new Date())d.setDate(d.getDate()+1);
 const start=fmt(d).replace(/-/g,"")+"T"+String(h).padStart(2,"0")+String(m).padStart(2,"0")+"00",stamp=new Date().toISOString().replace(/[-:]/g,"").replace(/\.\d+Z/,"Z");
 const lines=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Daymark//Daily Habit Reminder//ZH","BEGIN:VEVENT","UID:daymark-reminder-"+Date.now()+"@daymark.local","DTSTAMP:"+stamp,"DTSTART:"+start,"DURATION:PT5M","RRULE:FREQ=DAILY","SUMMARY:Daymark - 檢查今日微習慣","DESCRIPTION:開啟 Daymark 完成今日任務","BEGIN:VALARM","TRIGGER:PT0M","ACTION:DISPLAY","DESCRIPTION:檢查今日習慣","END:VALARM","END:VEVENT","END:VCALENDAR"];
 download(new Blob([lines.join("\r\n")],{type:"text/calendar;charset=utf-8"}),"daymark-reminder.ics");toast("已匯出提醒，需匯入 iPhone 日曆先會生效");
});
if(location.protocol.startsWith("http")&&"serviceWorker"in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
window.addEventListener("visibilitychange",()=>{if(!document.hidden)render();});setInterval(()=>{if(tab==="today")renderTop();},60000);
render();
})();