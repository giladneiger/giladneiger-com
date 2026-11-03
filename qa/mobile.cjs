const baseURL=(process.env.QA_BASE_URL||'http://127.0.0.1:5173').replace(/\/$/,'');
const outputDirectory=require('node:path').join(__dirname,'results');
require('node:fs').mkdirSync(outputDirectory,{recursive:true});
process.chdir(outputDirectory);
const{chromium}=require('playwright');
const assert=require('assert');
(async()=>{
 const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||undefined,headless:true});
 for(const[width,height]of [[390,844],[375,667],[360,640],[430,932],[844,390]].filter(([width])=>!process.argv[2]||width===Number(process.argv[2]))){
  const p=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true});const errors=[],requests=[];let success=false;
  p.on('pageerror',e=>errors.push(e.message));
  await p.route('https://api.hsforms.com/**',async route=>{requests.push(route.request().postDataJSON());await route.fulfill({status:success?200:500,contentType:'application/json',body:'{}'});});
  const load=async()=>{await p.goto(`${baseURL}/?utm_source=mobile-check#ai-in-the-loop`);await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(350)};
  const form=p.locator('#ai-newsletter-form'),entry=form.locator('.newsletter-entry');
  const fits=async()=>{const box=await entry.boundingBox();return box.y>=0&&box.y+box.height<=await p.evaluate(()=>visualViewport.height)};
  await load();assert(await fits(),'input and GO visible immediately '+width);
  assert(!await form.evaluate(n=>!!n.closest('[inert]')),'form interactive');
  assert(await form.locator('input').evaluate(n=>parseFloat(getComputedStyle(n).fontSize)>=16),'no text-input zoom');
  assert.equal(await form.locator('input').evaluate(n=>n===document.activeElement),false,'keyboard not opened on landing');
  const consent=await form.locator('.small').boundingBox();assert(consent.y+consent.height<height,'signup terms visible');
  await p.screenshot({path:`ai-mobile-entry-${width}.png`});
  const session=await p.context().newCDPSession(p);
  async function swipe(direction){
   const start=direction==='down'?height*.76:height*.28,end=direction==='down'?height*.28:height*.76,x=width*.82;
   await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y:start,id:1}]});
   for(let i=1;i<=12;i++){await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:start+(end-start)*i/12,id:1}]});await p.waitForTimeout(18)}
   await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(400);
  }
  const before=await entry.boundingBox(),startY=await p.evaluate(()=>scrollY);
  await swipe('down');assert(await p.evaluate(()=>scrollY)>startY+80,'native downward swipe moves page');
  assert((await entry.boundingBox()).y<before.y-35,'first swipe moves content rather than waiting through a long hold');
  for(let i=0;i<14;i++){if(await p.locator('#about').evaluate(n=>n.getBoundingClientRect().top<innerHeight*.6))break;await swipe('down')}
  assert(await p.locator('#about').evaluate(n=>n.getBoundingClientRect().top<innerHeight*.6),'can leave scene for About');
  assert(!await p.locator('.nav').evaluate(n=>n.classList.contains('in-loop-world')),'paper header restored');
  await load();for(let i=0;i<8;i++){if(await p.locator('.loop-journey').evaluate(n=>n.getBoundingClientRect().top>100))break;await swipe('up')}
  assert(await p.locator('.loop-journey').evaluate(n=>n.getBoundingClientRect().top>100),'upward swipes return to articles');
  const y=await p.evaluate(()=>scrollY);await p.waitForTimeout(400);assert(await p.evaluate(()=>scrollY)<=y+2,'no anchor snap-back against upward momentum');
  if(width===375){
   await load();await form.locator('input').tap();await p.setViewportSize({width,height:380});await p.waitForTimeout(250);
   assert(await fits(),'signup row visible with a reduced keyboard viewport');
   await form.locator('input').fill('preview@example.com');await form.locator('button').tap();await p.waitForFunction(()=>document.querySelector('.weekly-status').dataset.state==='error');
   success=true;await form.locator('button').tap();await p.waitForFunction(()=>document.querySelector('.weekly-status').dataset.state==='success');
   assert.equal(requests.length,2,'one request per tap');assert.equal(requests[0].fields[0].name,'email');
   assert.equal(await p.locator('#chapter-form [role=status]').textContent(),'','book/monthly signup remains separate');
   await p.setViewportSize({width,height});await p.emulateMedia({reducedMotion:'reduce'});await load();
   assert(await fits(),'reduced-motion direct entry keeps form visible');
   assert.equal(await p.locator('.loop-stage').evaluate(n=>getComputedStyle(n).position),'static');
  }
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow');
  assert.equal(errors.length,0,errors.join('\n'));console.log({width,height,entry:'visible',touch:'both directions',signup:width===375?'mocked error/retry/success':'not submitted'});await p.close();
 }
 await browser.close();console.log('No live signup submitted. Keyboard checked with a reduced viewport, not a physical device.');
})().catch(e=>{console.error(e);process.exit(1)});
