const $ = (sel)=>document.querySelector(sel);
function getProgress(){ try{return JSON.parse(localStorage.getItem("a2tutor-progress"))||{};}catch{return{};} }
function setProgress(v){ localStorage.setItem("a2tutor-progress", JSON.stringify(v)); }
function polyCombine(terms){
  const map=new Map();
  for(const t of terms){ map.set(t.pow, (map.get(t.pow)||0)+t.coef); }
  return [...map.entries()].map(([pow,coef])=>({pow,coef}))
    .filter(t=>Math.abs(t.coef)>1e-9).sort((a,b)=>b.pow-a.pow);
}
function polyFormatAscii(terms){
  if(!terms.length) return "0";
  return terms.map((t,i)=>{
    const s=t.coef<0?" - ":(i===0?"":" + ");
    const a=Math.abs(t.coef);
    if(t.pow===0) return s+a;
    if(t.pow===1) return s+(a===1?"":""+a)+"x";
    return s+(a===1?"":""+a)+"x^"+t.pow;
  }).join("").replace(/^ \+ /,"").replace(/^ - /,"- ");
}
function polyFromAscii(str){
  if(!str||typeof str!=="string") return null;
  const s=str.replace(/\s+/g,"").replace(/–/g,"-").toLowerCase();
  const parts=s.replace(/^\+/,"").replace(/-/g,"±-").replace(/\+/g,"±+").split("±").filter(Boolean);
  const pairs=[];
  for(let p of parts){
    let sign=1;
    if(p[0]==='-'){sign=-1;p=p.slice(1);} if(p[0]==='+'){p=p.slice(1);}
    if(p.includes("x")){
      const [cStr, rest]=p.split("x");
      let c=cStr===""?1:Number(cStr); if(Number.isNaN(c)) return null;
      let pow=1;
      if(rest && rest.startsWith("^")){ pow=Number(rest.slice(1)); if(Number.isNaN(pow)) return null; }
      pairs.push({coef:sign*c, pow});
    }else{
      const c=Number(p); if(Number.isNaN(c)) return null;
      pairs.push({coef:sign*c, pow:0});
    }
  }
  return polyCombine(pairs);
}
function polyEqual(aStr, expectedTerms){
  const got=polyFromAscii(aStr);
  if(!got) return false;
  return polyFormatAscii(got).replace(/\s+/g,"")===polyFormatAscii(expectedTerms).replace(/\s+/g,"");
}
const R = (a,b)=> Math.floor(Math.random()*(b-a+1))+a;
const pick = arr => arr[R(0,arr.length-1)];
const small = (nonzero=true)=>{ let v=R(-6,6); if(nonzero&&v===0) v=1; return v; };
function poly(...pairs){ return polyCombine(pairs.map(([c,p])=>({coef:c,pow:p}))); }
window.__tests__ = [];
function test(name, fn){ try{ fn(); window.__tests__.push({name, ok:true}); } catch(e){ window.__tests__.push({name, ok:false, msg:e.message}); } }
function assert(cond, msg="Assertion failed"){ if(!cond) throw new Error(msg); }
