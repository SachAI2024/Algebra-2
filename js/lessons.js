function stepInfo(html){ const d=document.createElement("div"); d.className="step"; d.innerHTML=html; return {el:d, check:null}; }
function stepInput(label, placeholder, validator, hintHtml){
  const d=document.createElement("div"); d.className="step";
  d.innerHTML = `
    <div class="row"><strong>${label}</strong></div>
    <div class="row" style="margin-top:8px">
      <input type="text" id="ans" placeholder="${placeholder}" />
      <button class="btn" id="check">Check</button>
      <span id="msg" class="tiny muted"></span>
    </div>
    ${hintHtml?`<details style="margin-top:10px"><summary>Hint</summary><div class="tiny">${hintHtml}</div></details>`:""}
  `;
  const ans=d.querySelector("#ans"), msg=d.querySelector("#msg"), btn=d.querySelector("#check");
  let passed=false;
  btn.onclick=()=>{
    const res=validator(ans.value);
    if(res===true){ msg.textContent="correct ✅"; ans.classList.add("correct"); ans.classList.remove("incorrect"); passed=true; }
    else { msg.textContent=res||"try again"; ans.classList.add("incorrect"); ans.classList.remove("correct"); }
  };
  return {el:d, check:()=>passed};
}
function stepMultiInputs(config){
  const d=document.createElement("div"); d.className="step"; d.innerHTML=`<div><strong>${config.title}</strong></div>`;
  config.fields.forEach((f,i)=>{
    const row=document.createElement("div"); row.className="row"; row.style.marginTop="8px";
    row.innerHTML=`<label class="tiny muted" style="width:220px">${i+1}. ${f.label}</label>
      <input type="text" data-key="${f.key}" placeholder="${f.placeholder||''}"/>
      <span class="tiny muted" id="m-${i}"></span>`;
    d.appendChild(row);
  });
  const btnRow=document.createElement("div"); btnRow.className="row"; btnRow.style.marginTop="10px";
  btnRow.innerHTML=`<button class="btn" id="check">Check</button> <span class="tiny muted" id="msg"></span>`;
  d.appendChild(btnRow);
  const btn=d.querySelector("#check"), msg=d.querySelector("#msg");
  let passed=false;
  btn.onclick=()=>{
    let all=true;
    const inputs=[...d.querySelectorAll('input[data-key]')];
    inputs.forEach((inp,idx)=>{
      const f=config.fields[idx], ok=f.validate(inp.value), m=d.querySelector(`#m-${idx}`);
      if(ok===true){ inp.classList.add("correct"); inp.classList.remove("incorrect"); m.textContent="✓"; }
      else { inp.classList.add("incorrect"); inp.classList.remove("correct"); m.textContent=(ok||""); all=false; }
    });
    if(all){ msg.textContent=config.onPassNote||"Nice."; passed=true; }
    else { msg.textContent="Fix highlighted entries."; }
  };
  return {el:d, check:()=>passed};
}

const LESSONS = [
  { id:"addsub", tag:"6.1", title:"Add & Subtract Polynomials", sub:"Combine like terms; mind the minus.",
    steps:[
      ()=>stepInfo(`<div><div class="badge">Concept</div><p class="tiny muted">Standard form = descending powers. Combine like powers by adding coefficients.</p></div>`),
      ()=>stepInput("Standard form: –2x + 6 + 3x^2 – x^3", "e.g. -x^3 + 3x^2 - 2x + 6",
        v=> polyEqual(v,[{coef:-1,pow:3},{coef:3,pow:2},{coef:-2,pow:1},{coef:6,pow:0}]) || "Expected -x^3 + 3x^2 - 2x + 6",
        "Order by powers: x^3, x^2, x, constant."),
      ()=>stepMultiInputs({
        title:"Subtract: (7a^3 − 4a^2 + 11) − (3a^2 − 2a + 5)",
        fields:[
          {label:"Distribute minus on second polynomial", key:"dist", validate:(v)=> polyEqual(v,[{coef:-3,pow:2},{coef:2,pow:1},{coef:-5,pow:0}]) || "−3a^2 + 2a − 5"},
          {label:"a^3 coefficient", key:"a3", validate:(v)=> Number(v)===7 || "7"},
          {label:"a^2 coefficient", key:"a2", validate:(v)=> Number(v)===-7 || "−7"},
          {label:"a coefficient", key:"a1", validate:(v)=> Number(v)===2 || "2"},
          {label:"constant", key:"c", validate:(v)=> Number(v)===6 || "6"},
        ],
        onPassNote:"Final: 7a^3 − 7a^2 + 2a + 6"
      }),
    ]},
  { id:"multiply", tag:"6.2", title:"Multiply Polynomials", sub:"Distribute/FOIL; combine like terms.",
    steps:[
      ()=>stepInfo(`<div><div class="badge">Concept</div><p class="tiny muted">Multiply coefficients; add exponents for like bases.</p></div>`),
      ()=>stepMultiInputs({
        title:"(x + 2)(2x^2 − 4x + 1)",
        fields:[
          {label:"x × 2x^2", key:"1", validate:(v)=> polyEqual(v,[{coef:2,pow:3}]) || "2x^3"},
          {label:"x × (−4x)", key:"2", validate:(v)=> polyEqual(v,[{coef:-4,pow:2}]) || "−4x^2"},
          {label:"x × 1", key:"3", validate:(v)=> polyEqual(v,[{coef:1,pow:1}]) || "x"},
          {label:"2 × 2x^2", key:"4", validate:(v)=> polyEqual(v,[{coef:4,pow:2}]) || "4x^2"},
          {label:"2 × (−4x)", key:"5", validate:(v)=> polyEqual(v,[{coef:-8,pow:1}]) || "−8x"},
          {label:"2 × 1", key:"6", validate:(v)=> polyEqual(v,[{coef:2,pow:0}]) || "2"},
          {label:"Combine to final", key:"7", validate:(v)=> polyEqual(v,[{coef:2,pow:3},{coef:-7,pow:1},{coef:2,pow:0}]) || "2x^3 − 7x + 2"},
        ]
      }),
      ()=>stepMultiInputs({
        title:"FOIL: (3x − 4)(x + 2)",
        fields:[
          {label:"First", key:"f", validate:(v)=> polyEqual(v,[{coef:3,pow:2}]) || "3x^2"},
          {label:"Outer", key:"o", validate:(v)=> polyEqual(v,[{coef:6,pow:1}]) || "6x"},
          {label:"Inner", key:"i", validate:(v)=> polyEqual(v,[{coef:-4,pow:1}]) || "−4x"},
          {label:"Last", key:"l", validate:(v)=> polyEqual(v,[{coef:-8,pow:0}]) || "−8"},
          {label:"Combine", key:"fin", validate:(v)=> polyEqual(v,[{coef:3,pow:2},{coef:2,pow:1},{coef:-8,pow:0}]) || "3x^2 + 2x − 8"}
        ]
      }),
    ]},
  { id:"binomial", tag:"6.3", title:"Binomial Theorem", sub:"Use C(n,r). Signs alternate for (x − y)^n.",
    steps:[
      ()=>stepInfo(`<div><div class="badge">Concept</div><p class="tiny muted">(a+b)^n = Σ C(n,r) a^{n-r} b^r.</p></div>`),
      ()=>stepMultiInputs({
        title:"Expand (x − 2)^3",
        fields:[
          {label:"Row 3 coefficients", key:"c", placeholder:"1,3,3,1", validate:(v)=> v.replace(/\s+/g,'').replace(/，/g,',')==="1,3,3,1" || "1,3,3,1"},
          {label:"Final", key:"f", validate:(v)=> polyEqual(v,[{coef:1,pow:3},{coef:-6,pow:2},{coef:12,pow:1},{coef:-8,pow:0}]) || "x^3 − 6x^2 + 12x − 8"},
        ]
      }),
      ()=>stepMultiInputs({
        title:"Middle term of (a + b)^8",
        fields:[
          {label:"Term number (1-indexed)", key:"t", validate:(v)=> /5(th)?/i.test(v) || "5th"},
          {label:"Coefficient", key:"coef", validate:(v)=> Number(v)===70 || "70"},
          {label:"Power of a", key:"pa", validate:(v)=> Number(v)===4 || "4"},
          {label:"Power of b", key:"pb", validate:(v)=> Number(v)===4 || "4"},
        ],
        onPassNote:"Middle term = 70 a^4 b^4"
      }),
    ]},
  { id:"factor", tag:"6.4", title:"Factoring", sub:"GCF → patterns → grouping.",
    steps:[
      ()=>stepInfo(`<div><div class="badge">Concept</div><p class="tiny muted">Try GCF first. Patterns: a^2−b^2, a^3±b^3. Grouping for 4 terms.</p></div>`),
      ()=>stepMultiInputs({
        title:"GCF: 2x^3 − 20x",
        fields:[
          {label:"GCF", key:"g", validate:(v)=> v.replace(/\s+/g,'').toLowerCase()==="2x" || "2x"},
          {label:"Inside", key:"rem", validate:(v)=> polyEqual(v,[{coef:1,pow:2},{coef:-10,pow:0}]) || "x^2 − 10"},
        ]
      }),
      ()=>stepMultiInputs({
        title:"Sum of cubes: 27x^3 + 64",
        fields:[
          {label:"a,b", key:"ab", placeholder:"a=3x, b=4", validate:(v)=> v.replace(/\s+/g,'').toLowerCase()==="a=3x,b=4" || "a=3x, b=4"},
          {label:"Factorized", key:"fac", validate:(v)=> v.replace(/\s+/g,'').toLowerCase()==="(3x+4)(9x^2-12x+16)" || "(3x + 4)(9x^2 − 12x + 16)"},
        ]
      }),
      ()=>stepMultiInputs({
        title:"Grouping: x^3 − x^2 + x − 1",
        fields:[
          {label:"Group & factor", key:"grp", placeholder:"x^2(x−1) + 1(x−1)",
           validate:(v)=> v.replace(/\s+/g,'').toLowerCase()==="x^2(x-1)+1(x-1)" || "x^2(x−1) + 1(x−1)"},
          {label:"Final", key:"final", validate:(v)=> v.replace(/\s+/g,'').toLowerCase()==="(x-1)(x^2+1)" || "(x − 1)(x^2 + 1)"},
        ]
      }),
    ]},
];
