const baseURL=(process.env.QA_BASE_URL||'http://127.0.0.1:5173').replace(/\/$/,'');
const outputDirectory=require('node:path').join(__dirname,'results');
require('node:fs').mkdirSync(outputDirectory,{recursive:true});
process.chdir(outputDirectory);
const{chromium}=require('playwright');
const fs=require('fs');
(async()=>{
 const b=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||undefined,headless:true}),p=await b.newPage({reducedMotion:'reduce'});const all=[];
 for(const[width,height]of [[1440,900],[1366,768],[1024,768],[820,900],[768,900],[760,900],[430,932],[390,844],[375,667],[360,640],[320,640]]){
  await p.setViewportSize({width,height});await p.goto(`${baseURL}/`);await p.evaluate(()=>document.fonts.ready);
  for(const filter of ['all','Careers and growth','Teams that stay hungry']){
   await p.locator(`[data-topic="${filter}"]`).click();
   const ids=await p.locator('.article-card').evaluateAll(ns=>ns.map(n=>n.dataset.id));
   for(const id of ids){
    await p.locator(`[data-expand="${id}"]`).click();await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const state=await p.locator('.article-card').evaluateAll(cards=>cards.map(card=>{
     const n=card.querySelector('.expand-card'),h=card.querySelector('h3'),words=[],walker=document.createTreeWalker(n,NodeFilter.SHOW_TEXT);
     while(walker.nextNode()){const t=walker.currentNode;for(const match of t.textContent.matchAll(/\S+/g)){const r=document.createRange();r.setStart(t,match.index);r.setEnd(t,match.index+match[0].length);for(const box of r.getClientRects())if(box.width)words.push({text:match[0],x:box.x,y:box.y,width:box.width,bottom:box.bottom})}}
     const lines=[];for(const word of words){let line=lines.find(l=>Math.abs(l.y-word.y)<4);if(!line){line={y:word.y,words:[]};lines.push(line)}line.words.push(word)}
     const cr=card.getBoundingClientRect(),hr=h.getBoundingClientRect(),f=card.querySelector('.article-link')?.getBoundingClientRect(),a=card.querySelector('.card-art'),ar=a.getBoundingClientRect();
     const lineWords=lines.map(l=>l.words.map(w=>w.text));
     return{id:card.dataset.id,open:card.classList.contains('featured'),tile:[Math.round(cr.width),Math.round(cr.height)],font:parseFloat(getComputedStyle(h).fontSize),lines:lineWords,single:lineWords.some(words=>words.filter(w=>/[\p{L}\p{N}]/u.test(w)).length===1),clipped:n.scrollWidth>n.clientWidth+1||hr.bottom>cr.bottom-8||(f&&hr.bottom>f.top-6),artOverlap:getComputedStyle(a).visibility!=='hidden'&&ar.top<hr.bottom-1};
    }));
    all.push({width,height,filter,selected:id,cards:state});
    if(filter==='all'&&['1','5'].includes(id)&&[1440,768,375,320].includes(width))await p.locator('#article-grid').screenshot({path:`bento-type-${width}-${id}.png`});
   }
  }
  const bad=all.filter(s=>s.width===width).flatMap(s=>s.cards.filter(c=>c.single||c.clipped||c.artOverlap).map(c=>({filter:s.filter,selected:s.selected,...c})));
  console.log(JSON.stringify({width,height,problems:bad.length,examples:bad.slice(0,4)}));
 }
 fs.writeFileSync('bento-type-audit.json',JSON.stringify(all,null,2));await b.close();
 if(all.some(state=>state.cards.some(card=>card.single||card.clipped||card.artOverlap)))throw new Error("Headline layout problems found; inspect bento-type-audit.json");
})().catch(e=>{console.error(e);process.exit(1)});
