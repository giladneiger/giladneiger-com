const baseURL=(process.env.QA_BASE_URL||'http://127.0.0.1:5173').replace(/\/$/,'');
const outputDirectory=require('node:path').join(__dirname,'results');
require('node:fs').mkdirSync(outputDirectory,{recursive:true});
process.chdir(outputDirectory);
const {chromium}=require('playwright');
const assert=require('assert');
(async()=>{
 const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||undefined,headless:true});
 const page=await browser.newPage(),plain=await browser.newPage({javaScriptEnabled:false});const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 const selectors=['.hero h1','#book-perspective h2','.chapter-copy h2','.chapter-page blockquote p','.about-copy h2'];
 for(const [width,height] of [[1440,900],[768,900],[390,844]]){
  await page.setViewportSize({width,height});await plain.setViewportSize({width,height});
  await Promise.all([page.goto(`${baseURL}/`),plain.goto(`${baseURL}/`)]);
  await Promise.all([page.evaluate(()=>document.fonts.ready),plain.evaluate(()=>document.fonts.ready)]);
  await page.waitForTimeout(1100);
  const measure=async p=>p.evaluate(selectors=>selectors.flatMap(selector=>[...document.querySelectorAll(selector)].map(n=>({text:n.textContent,width:n.offsetWidth,height:n.offsetHeight}))),selectors);
  const live=await measure(page),base=await measure(plain);
  live.forEach((n,i)=>{assert.equal(n.text,base[i].text,'copy preserved');assert(Math.abs(n.width-base[i].width)<2&&Math.abs(n.height-base[i].height)<2,'typography does not reflow '+width+' '+i)});
  assert(await page.locator('[data-enter]').count()>40,'whole page motion registered');
  assert.equal(await page.locator('.hero h1').getAttribute('data-enter-state'),'entered','hero complete within one second');
  if(width===1440||width===390)await page.screenshot({path:`modern-hero-${width}.png`});
  for(const selector of ['#book-perspective','.chapter-panel','#article-grid','#about','#speaking','footer']){
   await page.locator(selector).evaluate(n=>scrollTo({top:scrollY+n.getBoundingClientRect().top-100,behavior:'instant'}));await page.waitForTimeout(100);
   if(selector==='.chapter-panel'&&width===1440){assert(await page.locator('.chapter-page .word-ink').evaluateAll(ns=>ns.some(n=>getComputedStyle(n).transform!=='none')),'quote has its own typography motion');await page.screenshot({path:'modern-chapter-building.png'});}
   await page.waitForTimeout(1100);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no overflow '+width+' '+selector);
   const visiblePending=await page.locator('[data-enter-state="pending"]').evaluateAll(ns=>ns.filter(n=>{const r=n.getBoundingClientRect();return r.width>0&&r.height>0&&r.top<innerHeight-34&&r.bottom>0}).length);assert.equal(visiblePending,0,'visible content completes');
   if(selector==='.chapter-panel'&&(width===1440||width===390))await page.screenshot({path:`modern-chapter-${width}.png`});
  }
  await page.reload();await page.locator('#speaking input').first().focus();await page.waitForTimeout(80);
  assert.equal(await page.locator('#speaking-form').evaluate(n=>getComputedStyle(n).opacity),'1','keyboard focus bypasses motion');
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(120);
  assert.equal(await page.locator('[data-enter-state="pending"]').count(),0,'reduced motion reveals all');
  assert.equal(await page.locator('.loop-stage').evaluate(n=>getComputedStyle(n).position),'static');
  assert(await page.locator('.loop-return .gateway-copy').evaluate(n=>Number(getComputedStyle(n).opacity)===1),'return text visible with reduced motion');
  assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length),0,'no running reduced-motion animations');
  await page.emulateMedia({reducedMotion:'no-preference'});
  console.log({width,typography:'unchanged',entrances:'complete',focus:'immediate',reducedMotion:'passed'});
 }
 assert.equal(errors.length,0,errors.join('\n'));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
