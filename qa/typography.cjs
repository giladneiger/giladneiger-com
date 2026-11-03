const baseURL=(process.env.QA_BASE_URL||'http://127.0.0.1:5173').replace(/\/$/,'');
const outputDirectory=require('node:path').join(__dirname,'results');
require('node:fs').mkdirSync(outputDirectory,{recursive:true});
process.chdir(outputDirectory);
const {chromium}=require('playwright');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||undefined,headless:true});
 const page=await browser.newPage({reducedMotion:'reduce'}),report=[];
 for(const width of [320,360,375,390,430,560,640,760,768,820,900,1024,1100,1280,1366,1440,1600,1920]){
  await page.setViewportSize({width,height:900});await page.goto(`${baseURL}/`);await page.evaluate(()=>document.fonts.ready);
  const items=await page.locator('main h1,main h2,main h3,main h4,.gateway-copy>p').evaluateAll(nodes=>nodes.filter(n=>!n.closest('.article-card')).map(n=>{
   const bounds=n.getBoundingClientRect(),walker=document.createTreeWalker(n,NodeFilter.SHOW_TEXT),lines=[];let clipped=false;
   while(walker.nextNode()){
    const text=walker.currentNode;if(text.parentElement.closest('.sr-only'))continue;
    for(const match of text.textContent.matchAll(/\S+/g)){
     const range=document.createRange();range.setStart(text,match.index);range.setEnd(text,match.index+match[0].length);
     for(const r of range.getClientRects())if(r.width&&r.height){let line=lines.find(l=>Math.abs(l.y-r.y)<4);if(!line){line={y:r.y,words:[]};lines.push(line)}line.words.push(match[0]);if(r.left<bounds.left-2||r.right>bounds.right+2)clipped=true;}
    }
   }
   const words=lines.map(l=>l.words.filter(w=>/[\p{L}\p{N}]/u.test(w)));
   return{selector:n.closest('section')?.id||n.parentElement.className,tag:n.tagName,text:n.textContent,lines:words,single:words.length>1&&words.some(w=>w.length===1),clipped};
  }));
  report.push({width,items});const problems=items.filter(n=>n.single||n.clipped);console.log(JSON.stringify({width,problems}));
 }
 fs.writeFileSync('page-type-audit.json',JSON.stringify(report,null,2));await browser.close();
 if(report.some(r=>r.items.some(n=>n.single||n.clipped)))process.exitCode=1;
})().catch(error=>{console.error(error);process.exit(1)});
