let MODE = localStorage.getItem("mode") || "Learn";
const modeLabel = $("#modeLabel"); modeLabel.textContent = MODE;
$("#toggleMode").onclick=()=>{ MODE = MODE==="Learn" ? "Practice" : "Learn"; localStorage.setItem("mode", MODE); modeLabel.textContent=MODE; toast("Mode: "+MODE); };
const stepsBox=$("#steps"), unitTitle=$("#unitTitle"), unitSub=$("#unitSub"), unitTag=$("#unitTag"), unitBar=$("#unitBar"), unitCount=$("#unitCount");
const overallPct=$("#overallPct"), nextBtn=$("#nextStep"), resetBtn=$("#resetUnit"), navEl=$("#nav"), toastEl=document.querySelector(".toast");
function toast(msg){ toastEl.textContent=msg; toastEl.classList.remove("hidden"); setTimeout(()=>toastEl.classList.add("hidden"), 1100); }
const progress = getProgress();
function updateOverall(){ const totals = MODULES.map(m=>({n:m.steps.length,d:(progress[m.id]?.done||0)})); const n=totals.reduce((a,b)=>a+b.n,0); const d=totals.reduce((a,b)=>a+b.d,0); overallPct.textContent = (n?Math.round(100*d/n):0)+"% Complete"; }
function renderNav(){ navEl.innerHTML=""; MODULES.forEach((m,idx)=>{ const done=(progress[m.id]?.done||0); const total=m.steps.length; const pct=Math.round(100*done/total);
  const item=document.createElement("div"); item.className="row"; item.style.justifyContent="space-between"; item.style.padding="8px 6px"; item.style.borderRadius="10px"; item.style.cursor="pointer";
  item.onmouseenter=()=> item.style.background="#0c1220"; item.onmouseleave=()=> item.style.background="transparent"; item.onclick=()=>loadModule(m.id);
  item.innerHTML=`<div><div><strong>${idx+1}. ${m.title}</strong></div><div class='tiny muted'>${m.sub}</div>
    <div class='row tiny muted' style='margin-top:6px;gap:8px'><span class='badge'>${m.tag||"Lesson"}</span><span>${done}/${total} steps</span></div></div>
    <div style='width:72px'><div class='progress'><div class='bar' style='width:${pct}%'></div></div><div class='tiny muted' style='text-align:right;margin-top:4px'>${pct}%</div></div>`;
  navEl.appendChild(item); }); updateOverall(); }
const MODULES=[...LESSONS,{ id:"quiz", tag:"Practice", title:"Adaptive Quizzes (Polynomials)", sub:"Starts simple, levels up. 3 tries → breakdown.", steps:[ ()=>{
  const d=document.createElement("div"); d.className="step"; d.innerHTML=`
    <div class="row space">
      <div><div class="badge">Adaptive Quiz</div><div class="tiny muted">3 attempts; then we teach it.</div></div>
      <div class="row"><span class="chip">Level: <strong id="qLevel">1</strong></span><span class="chip">Q <strong id="qNum">1</strong> / <span id="qTotal">10</span></span><span class="chip">Attempts: <strong id="qAttempts">3</strong></span><span class="chip">Streak: <strong id="qStreak">0</strong></span></div>
    </div><div class="hr"></div><div id="qPrompt" style="margin:8px 0;font-weight:600"></div><div id="qChoices" class="row"></div><div class="hr"></div><div id="qFeedback" class="tiny muted"></div><div id="qTeach"></div>
    <div class="row" style="margin-top:10px"><button class="btn" id="qNext" disabled>Next ▶</button><button class="btn ghost" id="qReset">Restart</button></div>`;
  const TOTAL=10; const state={level:(progress.quiz?.level)||1, idx:0, attempts:3, streak:0, corrects:0, Q:null};
  const qLevel=d.querySelector("#qLevel"), qNum=d.querySelector("#qNum"), qTotal=d.querySelector("#qTotal"), qAttempts=d.querySelector("#qAttempts"), qStreak=d.querySelector("#qStreak");
  const qPrompt=d.querySelector("#qPrompt"), qChoices=d.querySelector("#qChoices"), qFeedback=d.querySelector("#qFeedback"), qTeach=d.querySelector("#qTeach"), qNext=d.querySelector("#qNext"), qReset=d.querySelector("#qReset");
  qTotal.textContent=TOTAL;
  function saveQuiz(){ progress.quiz={level:state.level,last:Date.now()}; setProgress(progress); }
  function teach(lines){ qTeach.innerHTML=""; const card=document.createElement("div"); card.className="step"; card.innerHTML=`<div class="badge">Breakdown</div>`; lines.forEach((ln,i)=>{ const p=document.createElement("div"); p.className="tiny"; p.style.marginTop="6px"; p.textContent=(i+1)+". "+ln; card.appendChild(p); }); qTeach.appendChild(card); }
  function adapt(ok){ if(ok){ state.streak+=1; state.corrects+=1; if(state.streak>=2){ state.level=Math.min(4,state.level+1); state.streak=0; } } else { state.streak=Math.max(0,state.streak-1); } saveQuiz(); }
  function soften(failed){ if(failed){ state.level=Math.max(1,state.level-1); } }
  function renderQ(){ qTeach.innerHTML=""; qFeedback.textContent=""; qNext.disabled=true; state.attempts=3; qAttempts.textContent=state.attempts; qLevel.textContent=state.level; qNum.textContent=(state.idx+1);
    const Q=makeQuestion(state.level); state.Q=Q; qPrompt.textContent=Q.prompt; qChoices.innerHTML="";
    Q.choices.forEach((choice,i)=>{ const b=document.createElement("button"); b.className="btn"; b.textContent=choice; b.onclick=()=>{ if(state.attempts<=0) return;
      if(i===Q.correctIndex){ qFeedback.textContent="correct ✅"; qNext.disabled=false; adapt(true); [...qChoices.children].forEach(x=>x.disabled=true); }
      else{ state.attempts-=1; qAttempts.textContent=state.attempts; qFeedback.textContent=state.attempts>0?"nope — try again":"3rd miss — teaching now"; if(state.attempts===0){ teach(Q.breakdown); [...qChoices.children].forEach((x,idx)=>{ if(idx===Q.correctIndex) x.classList.add("correct"); x.disabled=true; }); qNext.disabled=false; adapt(false); } } }; qChoices.appendChild(b); }); }
  qNext.onclick=()=>{ const failed=state.attempts===0; soften(failed); if(state.idx<TOTAL-1){ state.idx+=1; renderQ(); } else { qPrompt.innerHTML=`Quiz done. Score: <strong>${state.corrects}/${TOTAL}</strong>`; qChoices.innerHTML=""; qFeedback.textContent = state.corrects<=4 ? "Keep building the base." : (state.corrects<=7? "Solid! Push a level up." : "Cruising 😎"); qNext.disabled=true; } };
  qReset.onclick=()=>{ state.level=1; state.idx=0; state.attempts=3; state.streak=0; state.corrects=0; qStreak.textContent=state.streak; saveQuiz(); renderQ(); toast("Quiz reset"); };
  const mo=new MutationObserver(()=>{ qStreak.textContent=state.streak; }); mo.observe(d,{subtree:true,childList:true});
  renderQ(); return {el:d, check:()=>true}; } ] }
];
const stepsBoxEl=$("#steps");
function loadModule(id){
  const m = MODULES.find(x=>x.id===id) || MODULES[0];
  window.__current=m; stepsBox.innerHTML=""; unitTitle.textContent=m.title; unitSub.textContent=m.sub; unitTag.textContent=m.tag||"Lesson";
  (progress[m.id] ||= {index:0, done:0}); const idx=progress[m.id].index||0; unitCount.textContent=progress[m.id].done||0; unitBar.style.width=Math.round(100*(progress[m.id].done||0)/m.steps.length)+"%";
  for(let k=0;k<=idx && k<m.steps.length;k++){ const s=m.steps[k](); s._checker=s.check; stepsBox.appendChild(s.el); }
  updateNextBtn();
}
function updateNextBtn(){ const m=window.__current; const idx=progress[m.id].index||0; nextBtn.textContent=(idx>=m.steps.length-1)?"Finish Module":"Next ▶"; }
nextBtn.onclick=()=>{ const m=window.__current; const idx=progress[m.id].index||0; const checker=stepsBox.lastChild?stepsBox.lastChild._checker:null;
  if(MODE==="Learn" && checker){ const ok=checker(); if(!ok){ toast("Do the step first 👀"); return; } }
  if(idx<m.steps.length-1){ progress[m.id].index=idx+1; progress[m.id].done=Math.max(progress[m.id].done||0, idx+1); setProgress(progress);
    const s=m.steps[idx+1](); s._checker=s.check; stepsBox.appendChild(s.el); unitCount.textContent=progress[m.id].done; unitBar.style.width=Math.round(100*progress[m.id].done/m.steps.length)+"%";
  } else { toast("Module complete ✨"); }
  updateNextBtn();
};
resetBtn.onclick=()=>{ const m=window.__current; progress[m.id]={index:0,done:0}; setProgress(progress); loadModule(m.id); toast("Module reset"); };
function boot(){ renderNav(); loadModule(MODULES[0].id); }
document.addEventListener("DOMContentLoaded", boot);
renderNav(); loadModule(LESSONS[0].id);
