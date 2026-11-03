const baseURL=(process.env.QA_BASE_URL||'http://127.0.0.1:5173').replace(/\/$/,'');
const outputDirectory=require('node:path').join(__dirname,'results');
require('node:fs').mkdirSync(outputDirectory,{recursive:true});
process.chdir(outputDirectory);
const {chromium}=require('playwright');
const assert=require('assert');
(async()=>{
 const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||undefined,headless:true});
 const page=await browser.newPage();const errors=[],failed=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().startsWith(`${baseURL}`)&&r.status()>=400)failed.push(r.url())});
 for(const width of [1440,1024,768,390]){
  await page.setViewportSize({width,height:900});await page.goto(`${baseURL}`);await page.evaluate(()=>document.fonts.ready);
  const stats=await page.evaluate(()=>({count:articles.length,source:articles.every(a=>a.url.startsWith('https://www.develeap.com/')),dates:articles.map(a=>a.date)}));
  assert.equal(stats.count,5);assert(stats.source);assert.deepEqual(stats.dates,[...stats.dates].sort().reverse());
  for(const selector of ['#chapter','#articles','#ai-in-the-loop','#about','#speaking']){
   await page.locator(selector).evaluate(n=>scrollTo({top:scrollY+n.getBoundingClientRect().top-24,behavior:'instant'}));await page.waitForTimeout(200);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal overflow '+width+' '+selector);
   if(width===1440||width===390)await page.screenshot({path:'world-'+selector.slice(1)+'-'+width+'.png'});
  }
  const input=await page.locator('#chapter-email').boundingBox();assert(input.width>180&&input.height>=44,'chapter email must remain visible '+width);
  const widths=await page.locator('.wrap').evaluateAll(ns=>ns.filter(n=>n.getBoundingClientRect().width>0).map(n=>{const r=n.getBoundingClientRect();return Math.abs(r.left-(innerWidth-r.right))}));
  assert(widths.every(x=>x<1),'centered containers '+width);
  for(let id=1;id<=5;id++){
   await page.locator(`[data-expand="${id}"]`).click();await page.waitForTimeout(620);
   const check=await page.locator('.featured').evaluate(card=>{
    const r=n=>n.getBoundingClientRect(),art=card.querySelector('.card-art'), a=r(art),h=r(card.querySelector('h3')),c=r(card),b=r(card.querySelector('.article-link'));
    const intersect=(x,y)=>Math.min(x.right,y.right)>Math.max(x.left,y.left)+2&&Math.min(x.bottom,y.bottom)>Math.max(x.top,y.top)+2;
    return {id:card.dataset.id,overlap:getComputedStyle(art).visibility!=='hidden'&&(intersect(a,h)||intersect(a,b)),buttonFits:b.bottom<=c.bottom+1&&b.right<=c.right+1,titleFits:h.bottom<b.top,artHeight:a.height,artWidth:a.width};
   });
   assert(!check.overlap&&check.buttonFits&&check.titleFits&&check.artWidth>50&&check.artHeight>50,JSON.stringify({width,...check}));
   console.log('Card',width,check.id,'art',Math.round(check.artWidth),Math.round(check.artHeight));
  }
  await page.goto(`${baseURL}/#ai-in-the-loop`);await page.waitForFunction(()=>!document.querySelector('#ai-in-the-loop').inert);
  assert(await page.locator('.nav').evaluate(n=>n.classList.contains('in-loop-world')));
  await page.locator('#about').evaluate(n=>scrollTo({top:scrollY+n.getBoundingClientRect().top,behavior:'instant'}));await page.waitForTimeout(100);
  assert(!await page.locator('.nav').evaluate(n=>n.classList.contains('in-loop-world')));
 }
 await page.emulateMedia({reducedMotion:'reduce'});await page.reload();
 const reduced=await page.locator('.loop-stage').evaluate(n=>getComputedStyle(n).position==='static');
 assert(reduced,'reduced motion skips sticky travel');
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(failed.length,0,failed.join('\n'));
 console.log('Shared alignment, 5 published articles, all expansion states, header theme, reduced motion and local assets passed.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
