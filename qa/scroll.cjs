const baseURL=(process.env.QA_BASE_URL||'http://127.0.0.1:5173').replace(/\/$/,'');
const outputDirectory=require('node:path').join(__dirname,'results');
require('node:fs').mkdirSync(outputDirectory,{recursive:true});
process.chdir(outputDirectory);
const{chromium}=require('playwright');
const assert=require('assert');
(async()=>{
 const b=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||undefined,headless:true}),p=await b.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('https://api.hsforms.com/**',r=>r.fulfill({status:200,contentType:'application/json',body:'{"inlineMessage":"Thanks"}'}));
 for(const [width,height] of [[1440,900],[1366,768],[1024,800],[768,900],[390,844]]){
  await p.setViewportSize({width,height});await p.goto(`${baseURL}/`);await p.evaluate(()=>document.fonts.ready);
  const geometry=await p.locator('.loop-journey').evaluate(n=>({top:scrollY+n.getBoundingClientRect().top,height:n.querySelector('.loop-stage').offsetHeight,range:n.offsetHeight-n.querySelector('.loop-stage').offsetHeight}));
  const at=async d=>{await p.evaluate(y=>scrollTo({top:y,behavior:'instant'}),geometry.top+d);await p.waitForTimeout(100)};
  const parts=()=>p.locator('[data-loop-reveal]').evaluateAll(ns=>ns.map(n=>({opacity:Number(getComputedStyle(n).opacity),x:new DOMMatrix(getComputedStyle(n).transform).m41,y:new DOMMatrix(getComputedStyle(n).transform).m42})));
  await at(.35*geometry.height);
  const early=await p.locator('[data-loop-reveal]').evaluateAll(ns=>ns.map(n=>parseFloat(getComputedStyle(n).opacity)));
  assert(early[0]>early[1]&&early[1]>0&&early[2]===0,'overlapping, ordered assembly');
  await at(.55*geometry.height);if(width===1440||width===390)await p.screenshot({path:`pinned-build-${width}.png`});
  const overlap=await p.locator('[data-loop-reveal]').evaluateAll(ns=>ns.slice(1,4).every(n=>Number(getComputedStyle(n).opacity)>0));assert(overlap,'elements build together');
  await at(1.02*geometry.height);await p.locator('.loop-art img').evaluate(n=>n.decode());
  const hold1=await p.locator('.loop-masthead').boundingBox();
  assert(Math.abs((await p.locator('.loop-stage').boundingBox()).y)<1,'stage stays pinned');
  assert.equal(await p.locator('#ai-newsletter-form').evaluate(n=>n.closest('[inert]')!==null),false);
  assert(await p.locator('.nav').evaluate(n=>n.classList.contains('in-loop-world')));
  const reveal=await p.locator('[data-loop-reveal]').evaluateAll(ns=>ns.every(n=>getComputedStyle(n).opacity==='1'));assert(reveal,'fully assembled');
  const art=await p.locator('.loop-art img').boundingBox(),title=await p.locator('.loop-latest-copy h3').boundingBox();assert(art.y+art.height<=title.y,'illustration does not overlap headline');
  if(width===1440||width===390)await p.screenshot({path:`pinned-read-${width}.png`});
  for(const point of [.92,1.15,1.38]){await at(point*geometry.height);const hold2=await p.locator('.loop-masthead').boundingBox();assert(Math.abs(hold1.y-hold2.y)<1,'stable reading hold');assert.equal(await p.locator('#ai-in-the-loop').evaluate(n=>getComputedStyle(n).opacity),'1','hold has full contrast');}
  await p.locator('#ai-newsletter-form input').focus();await p.waitForTimeout(100);const input=await p.locator('#ai-newsletter-form input').boundingBox();assert(input.y>=0&&input.y+input.height<=height,'email reachable');
  await p.locator('#ai-newsletter-form input').fill('preview@example.com');await p.locator('#ai-newsletter-form button').click();await p.waitForFunction(()=>document.querySelector('.weekly-status').dataset.state==='success');
  assert.equal(await p.locator('#chapter-form [role=status]').textContent(),'');
  await p.locator('.loop-past-grid>a').last().focus();await p.waitForTimeout(150);const last=await p.locator('.loop-past-grid>a').last().boundingBox();assert(last.y>=0&&last.y+last.height<=height,'archive reachable by keyboard');
  if(width===1440||width===390)await p.screenshot({path:`pinned-archive-${width}.png`});
  const updated=await p.locator('.loop-journey').evaluate(n=>n.offsetHeight-n.querySelector('.loop-stage').offsetHeight);
  await p.locator('#article-grid').focus();
  const exitDistance=updated-.42*geometry.height;
  await at(exitDistance+.42*geometry.height*.15);
  const earlyExit=await parts();assert.equal(earlyExit[0].opacity,1,'masthead stays while archive leaves');assert(earlyExit[5].opacity>earlyExit[7].opacity&&earlyExit[7].opacity<1,'last archive card leaves first');
  if(width===1440||width===390)await p.screenshot({path:`pinned-exit-early-${width}.png`});
  await at(exitDistance+.42*geometry.height*.50);
  const mid=await parts();
  assert(mid[0].opacity>mid[7].opacity&&mid[7].y>mid[0].y,'reverse order and movement retained');
  assert.equal(await p.locator('#ai-in-the-loop').evaluate(n=>getComputedStyle(n).opacity),'1','no collective section fade');
  assert(await p.locator('.world-entry').evaluate(n=>Number(getComputedStyle(n).opacity)<1),'field recedes during disassembly');
  assert(await p.locator('.world-entry .gateway-frames i').evaluateAll(ns=>ns.every(n=>Number(getComputedStyle(n).opacity)>.4)),'frames close before the last pieces disappear');
  if(width===1440||width===390)await p.screenshot({path:`pinned-exit-mid-${width}.png`});
  for(const progress of [.2,.35,.5,.6,.68,.74]){
   await at(exitDistance+.42*geometry.height*progress);
   const continuity=await p.evaluate(()=>{
    const fieldOpacity=Number(getComputedStyle(document.querySelector('.world-entry')).opacity);
    const visible=[...document.querySelectorAll('[data-loop-reveal]')].some(n=>{const r=n.getBoundingClientRect();let opacity=1,parent=n;while(parent&&parent.id!=='ai-in-the-loop'){opacity*=Number(getComputedStyle(parent).opacity);parent=parent.parentElement}return r.bottom>20&&r.top<innerHeight-20&&opacity>.015});
    return {fieldOpacity,visible};
   });
   assert(continuity.visible||continuity.fieldOpacity<.12,'no opaque empty panel '+width+' '+progress);
  }
  await at(exitDistance+.42*geometry.height*.75);
  assert((await parts()).every(n=>n.opacity===0),'pieces fully disassembled');
  assert.equal(await p.locator('.world-entry').evaluate(n=>Number(getComputedStyle(n).opacity)),0,'no empty dark frame after disassembly');
  if(width===1440||width===390)await p.screenshot({path:`pinned-exit-frames-${width}.png`});
  await at(updated);assert(!await p.locator('.nav').evaluate(n=>n.classList.contains('in-loop-world')));
  const gap=await p.evaluate(()=>Math.min(document.querySelector('.about-copy').getBoundingClientRect().top,document.querySelector('.portrait-scene').getBoundingClientRect().top)-document.querySelector('.loop-return .gateway-copy').getBoundingClientRect().bottom);assert(gap>=140&&gap<310,'spacious handoff to about');
  if(width===1440||width===390)await p.screenshot({path:`pinned-exit-${width}.png`});
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no overflow');
  await at(exitDistance+.42*geometry.height*.50);assert.deepEqual(await parts(),mid,'exit reverses exactly');
  await at(.35*geometry.height);const back=await p.locator('[data-loop-reveal]').evaluateAll(ns=>ns.map(n=>parseFloat(getComputedStyle(n).opacity)));assert.deepEqual(early,back,'reverse scroll deterministic');
  const previous={1440:3321,1366:2970,1024:3052,768:3654,390:4261}[width];assert(geometry.range+geometry.height<previous*.92,'shorter scroll journey');
  console.log({width,height,sceneHeight:Math.round(geometry.range+geometry.height),previous,hold:'stable',form:'mocked',keyboard:'passed',reverse:'passed'});
 }
 await p.goto(`${baseURL}/#ai-in-the-loop`);await p.waitForTimeout(150);assert.equal(await p.locator('#ai-newsletter-form').evaluate(n=>!!n.closest('[inert]')),false,'direct anchor enters reading state');
 await p.emulateMedia({reducedMotion:'reduce'});await p.waitForTimeout(100);assert.equal(await p.locator('.loop-stage').evaluate(n=>getComputedStyle(n).position),'static');assert.equal(await p.locator('.loop-journey [inert]').count(),0);
 await p.locator('.loop-past-grid>a').last().scrollIntoViewIfNeeded();assert(await p.locator('.loop-past-grid>a').last().isVisible());
 assert.equal(errors.length,0,errors.join('\n'));console.log('Direct anchor and reduced-motion normal flow passed. No live submissions.');await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
