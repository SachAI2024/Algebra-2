function qL1(){
  const a=small(), b=small(), c=small(), d=small(), e=small(), f=small();
  const prompt = `Combine like terms: (${polyFormatAscii(poly([a,2],[b,1],[c,0]))}) + (${polyFormatAscii(poly([d,2],[e,1],[f,0]))})`;
  const correct = poly([a,2],[b,1],[c,0],[d,2],[e,1],[f,0]);
  const ans = polyFormatAscii(correct);
  const wrong1 = polyFormatAscii(correct.map(t=>({coef:t.coef+(Math.random()<.5?1:-1), pow:t.pow})));
  const wrong2 = polyFormatAscii(correct.map((t,i)=> i===0?{coef:-t.coef,pow:t.pow}:t));
  const wrong3 = polyFormatAscii(poly([a+d,2],[b+e,1],[c-f,0]));
  const choices = [ans, wrong1, wrong2, wrong3].sort(()=>Math.random()-0.5);
  const breakdown = [`x^2: ${a}+${d} = ${a+d}`, `x: ${b}+${e} = ${b+e}`, `const: ${c}+${f} = ${c+f}`, `Final: ${ans}`];
  return {level:1, prompt, choices, correctIndex:choices.indexOf(ans), breakdown};
}
function qL2(){
  const m=small(), n=small(), p=small();
  const prompt = `Multiply: (x ${m>=0?"+":"-"} ${Math.abs(m)})(${n}x ${p>=0?"+":"-"} ${Math.abs(p)})`;
  const correct = poly([n,2],[p+m*n,1],[m*p,0]);
  const ans=polyFormatAscii(correct);
  const wrong1=polyFormatAscii(poly([n,2],[p-m*n,1],[m*p,0]));
  const wrong2=polyFormatAscii(poly([n,2],[p+m*n,1],[m+p,0]));
  const wrong3=polyFormatAscii(poly([n,2],[p,1],[m*p,0]));
  const choices=[ans,wrong1,wrong2,wrong3].sort(()=>Math.random()-0.5);
  const breakdown=[`First: x·${n}x = ${n}x^2`,`Outer: x·${p} = ${p}x`,`Inner: ${m}·${n}x = ${m*n}x`,`Last: ${m}·${p} = ${m*p}`,`Middle → ${(p+m*n)}x`,`Final: ${ans}`];
  return {level:2, prompt, choices, correctIndex:choices.indexOf(ans), breakdown};
}
function qL3(){
  const a=Math.abs(small()), minus=Math.random()<0.5;
  const prompt = `Expand: (x ${minus?"-":"+"} ${a})^3`;
  const c2=3*a*(minus?-1:1), c1=3*a*a, c0=(minus?-1:1)*a*a*a;
  const correct=poly([1,3],[c2,2],[c1,1],[c0,0]);
  const ans=polyFormatAscii(correct);
  const wrong1=polyFormatAscii(poly([1,3],[c2,2],[a*a,1],[c0,0]));
  const wrong2=polyFormatAscii(poly([1,3],[-c2,2],[c1,1],[-c0,0]));
  const wrong3=polyFormatAscii(correct.map(t=>({coef:t.coef+(Math.random()<.5?2:-2),pow:t.pow})));
  const choices=[ans,wrong1,wrong2,wrong3].sort(()=>Math.random()-0.5);
  const breakdown=[`Coeffs: 1,3,3,1`,`Signs ${minus?"alternate":"stay +"} for cube`,`x^2: 3·${a}·x^2 → ${c2}x^2`,`x: 3·${a}^2·x → ${c1}x`,`const: ${c0}`,`Final: ${ans}`];
  return {level:3, prompt, choices, correctIndex:choices.indexOf(ans), breakdown};
}
function qL4(){
  const type = pick(["gcf","dos","trin"]);
  if(type==="gcf"){
    const g=Math.abs(small()); const a=g*R(1,5), b=g*R(1,5);
    const prompt=`Factor completely: ${a}x^3 + ${b}x`;
    const correct=`(${g}x) (${polyFormatAscii(poly([a/g,2],[b/g,0]))})`;
    const wrong1=`(${g}) (${polyFormatAscii(poly([a/g,3],[b/g,1]))})`;
    const wrong2=`(${g}x) (${polyFormatAscii(poly([a/g,3],[b/g,1]))})`;
    const wrong3=`(${g}) (${polyFormatAscii(poly([a/g,2],[b/g,0]))})`;
    const choices=[correct,wrong1,wrong2,wrong3].sort(()=>Math.random()-0.5);
    const breakdown=[`GCF is ${g}x`,`Pull out → ${g}x (${a/g}x^2 + ${b/g})`];
    return {level:4,prompt,choices,correctIndex:choices.indexOf(correct),breakdown};
  }
  if(type==="dos"){
    const k=R(2,6); const prompt=`Factor: x^2 − ${k*k}`;
    const correct=`(x - ${k})(x + ${k})`;
    const wrong1=`(x - ${k})^2`, wrong2=`(x + ${k})^2`, wrong3=`(x - ${k-1})(x + ${k+1})`;
    const choices=[correct,wrong1,wrong2,wrong3].sort(()=>Math.random()-0.5);
    const breakdown=[`a^2 - b^2 = (a-b)(a+b)`,`a=x, b=${k}`];
    return {level:4,prompt,choices,correctIndex:choices.indexOf(correct),breakdown};
  }
  const r1=small(), r2=small(); const p=r1+r2, q=r1*r2;
  const prompt=`Factor: x^2 ${p>=0?"+":"-"} ${Math.abs(p)}x ${q>=0?"+":"-"} ${Math.abs(q)}`;
  const correct=`(x ${r1>=0?"-":"+"} ${Math.abs(r1)})(x ${r2>=0?"-":"+"} ${Math.abs(r2)})`;
  const wrong1=`(x ${r1>=0?"+":"-"} ${Math.abs(r1)})(x ${r2>=0?"+":"+"} ${Math.abs(r2)})`;
  const wrong2=`(x ${r1>=0?"-":"+"} ${Math.abs(r1)})(x ${r2>=0?"+":"-"} ${Math.abs(r2+1)})`;
  const wrong3=`(x ${r1>=0?"-":"+"} ${Math.abs(r1+1)})(x ${r2>=0?"+":"-"} ${Math.abs(r2)})`;
  const choices=[correct,wrong1,wrong2,wrong3].sort(()=>Math.random()-0.5);
  const breakdown=[`Need r1+r2=${p} and r1·r2=${q}`,`Roots ${r1}, ${r2}`];
  return {level:4,prompt,choices,correctIndex:choices.indexOf(correct),breakdown};
}
function makeQuestion(level){ if(level<=1) return qL1(); if(level===2) return qL2(); if(level===3) return qL3(); return qL4(); }
