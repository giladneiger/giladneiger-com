/* A native-scroll scene. No wheel interception, scroll locking or nested scroller. */
(() => {
 const entry=document.querySelector('.world-entry'),exit=document.querySelector('.world-exit');
 const content=document.querySelector('#ai-in-the-loop'),header=document.querySelector('.nav');
 if(!entry||!exit||!content)return;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const journey=document.createElement('div');journey.className='loop-journey';
 const stage=document.createElement('div');stage.className='loop-stage';
 const contentWindow=document.createElement('div');contentWindow.className='loop-content-window';
 entry.before(journey);journey.append(stage);stage.append(entry,contentWindow);contentWindow.append(content);
 exit.classList.add('loop-return');
 const progress=document.createElement('div');progress.className='loop-progress';progress.setAttribute('aria-hidden','true');
 progress.innerHTML='<span class="loop-progress-label">Into the Loop</span><i class="loop-progress-track"></i><span>↓</span>';stage.append(progress);
 const label=progress.querySelector('.loop-progress-label');
 const clamp=x=>Math.max(0,Math.min(1,x));
 const ease=x=>{x=clamp(x);return x*x*(3-2*x)};
 const step=(x,a,b)=>ease((x-a)/(b-a));
 const timing={entryEnd:.38,readAt:1.02,holdEnd:1.46,exitDuration:.42,panRatio:1.1};
 let directEntry=location.hash==='#ai-in-the-loop';
 const mobileEntry=()=>directEntry&&matchMedia('(max-width:760px), (max-width:1000px) and (pointer:coarse)').matches;
 const parts=[
  [content.querySelector('.loop-masthead'),.29,.51,0],
  [content.querySelector('.ai-editorial'),.34,.60,-10],
  [content.querySelector('.loop-latest'),.39,.66,14],
  [content.querySelector('.weekly-subscribe'),.43,.70,0],
  [content.querySelector('.loop-library-heading'),.54,.76,0],
  ...[...content.querySelectorAll('.loop-past-grid>a')].map((n,i)=>[n,.57+i*.025,.80+i*.025,0])
 ];
 const assembledAt=Math.max(...parts.map(([,start,end])=>end));
 parts.forEach(([n])=>n.dataset.loopReveal='');
 let height=1,overflow=0,panStart=1,panEnd=1,exitStart=1,range=1,frame=0,rewindRate=1;
 function layoutTop(node){let top=0;while(node&&node!==content){top+=node.offsetTop;node=node.offsetParent}return top;}
 function measure(){
  journey.classList.toggle('loop-direct-entry',mobileEntry());
  if(reduce.matches){journey.style.removeProperty('--journey-height');update();return;}
  height=stage.offsetHeight;
  overflow=Math.max(0,content.offsetHeight-height+28);
  const visibleParts=parts.filter(([node])=>{const top=layoutTop(node);return Math.min(top+node.offsetHeight,overflow+height)-Math.max(top,overflow)>Math.min(80,node.offsetHeight*.5)});
  const lastStart=Math.min(...(visibleParts.length?visibleParts:parts).map(([,start])=>start));
  rewindRate=(assembledAt-lastStart)/.72;
  panStart=height*(mobileEntry()?.98:timing.holdEnd);panEnd=panStart+overflow*timing.panRatio;
  exitStart=panEnd+height*(overflow>0?.20:.08);
  range=exitStart+height*timing.exitDuration;
  journey.style.setProperty('--journey-height',`${height+range}px`);
  update();
 }
 function aperture(node,p){
  const mobile=innerWidth<=760;
  node.style.setProperty('--gate-y',`${(1-p)*(mobile?20:26)}%`);
  node.style.setProperty('--gate-x',`${(1-p)*(mobile?9:22)}%`);
  node.style.setProperty('--frame-scale',1+p*.85);
  node.style.setProperty('--frame-angle',`${(1-p)*1.4}deg`);
  node.style.setProperty('--frame-opacity',1-p);
 }
 function update(){
  frame=0;
  if(reduce.matches){
   [entry,content,exit,...parts.map(p=>p[0])].forEach(n=>n.inert=false);
   const r=content.getBoundingClientRect();header?.classList.toggle('in-loop-world',r.top<80&&r.bottom>80);
   return;
  }
  const distance=-journey.getBoundingClientRect().top;
  const t=distance/height;
  const entrance=step(t,0,timing.entryEnd),leaving=clamp((distance-exitStart)/(range-exitStart));
  const pan=overflow*clamp((distance-panStart)/Math.max(1,panEnd-panStart));
  // Reverse the assembly while the frame closes, so no empty dark panel lingers.
  const rewind=assembledAt-leaving*rewindRate;
  const closing=step(leaving,.04,.82);
  aperture(entry,Math.min(entrance,1-closing));
  // The outline frames lead; the dark field follows while the final visible pieces leave.
  const fieldClosing=step(leaving,.38,.78),mobile=innerWidth<=760;
  entry.style.setProperty('--gate-y',`${Math.max(1-entrance,fieldClosing)*(mobile?20:26)}%`);
  entry.style.setProperty('--gate-x',`${Math.max(1-entrance,fieldClosing)*(mobile?9:22)}%`);
  aperture(contentWindow,Math.min(entrance,1-fieldClosing));
  entry.style.opacity=1-step(leaving,.45,.74);
  entry.style.setProperty('--gate-copy',1-step(t,.10,.29));
  entry.style.setProperty('--gate-shift',`${-16*step(t,.10,.29)}px`);
  exit.style.setProperty('--gate-copy',step(leaving,.72,.94));
  exit.style.setProperty('--gate-shift',`${18*(1-step(leaving,.72,.94))}px`);
  journey.style.setProperty('--content-pan',`${-pan}px`);
  journey.style.setProperty('--progress-opacity',step(t,.38,.60)*(1-step(leaving,0,.22)));
  journey.style.setProperty('--journey-progress',clamp(distance/range));
  label.textContent=t<.85?'Into the Loop':distance<panStart?'A moment to explore':distance<panEnd?'Previously in the Loop':'Back to Gilad';
  entry.inert=t>.29;content.inert=t<.29||leaving>.10;exit.inert=leaving<.94;
  for(const [node,start,end,x] of parts){
   const p=step(Math.min(t,rewind),start,end)*(1-step(leaving,.72,.74));
   node.style.setProperty('--reveal',p);
   node.style.setProperty('--reveal-x',`${x*(1-p)}px`);
   node.style.setProperty('--reveal-y',`${18*(1-p)}px`);
   node.style.setProperty('--reveal-scale',.98+.02*p);
   node.inert=p<.99;
  }
  header?.classList.toggle('in-loop-world',distance>height*.35&&leaving<.30);
 }
 const schedule=()=>{if(!frame)frame=requestAnimationFrame(update)};
 function goToReading(behavior='smooth'){
  directEntry=true;measure();
  if(reduce.matches){content.scrollIntoView({behavior:'instant',block:'start'});return;}
  const signup=content.querySelector('.weekly-subscribe');
  const initialPan=mobileEntry()?Math.max(0,Math.min(overflow,layoutTop(signup)+signup.offsetHeight-height+40)):0;
  const position=initialPan>0?panStart+initialPan*timing.panRatio:height*(mobileEntry()?.92:timing.readAt);
  scrollTo({top:scrollY+journey.getBoundingClientRect().top+position,behavior});
 }
 document.addEventListener('click',event=>{
  const link=event.target.closest('a[href="#ai-in-the-loop"]');if(!link)return;
  event.preventDefault();history.pushState(null,'','#ai-in-the-loop');goToReading(reduce.matches?'instant':'smooth');
 });
 addEventListener('hashchange',()=>{if(location.hash==='#ai-in-the-loop')goToReading('instant')});
 // Tabbing to an offscreen issue advances the scene to that item without trapping focus.
 function keepFocusVisible(){
  if(reduce.matches)return;
  const focused=document.activeElement;if(!content.contains(focused))return;
  const target=focused.closest('.newsletter-entry')||focused;
  const r=target.getBoundingClientRect(),viewport=window.visualViewport;
  const visibleHeight=Math.min(height,viewport?.height||innerHeight),visibleTop=viewport?.offsetTop||0;
  if(r.top>=visibleTop+88&&r.bottom<=visibleTop+visibleHeight-24)return;
  const relative=r.top-content.getBoundingClientRect().top;
  const desired=Math.max(0,Math.min(overflow,relative-visibleTop-visibleHeight*.4));
  const position=desired>0?panStart+desired*timing.panRatio:height*(mobileEntry()?.92:timing.readAt);
  scrollTo({top:scrollY+journey.getBoundingClientRect().top+position,behavior:'instant'});
 }
 content.addEventListener('focusin',keepFocusVisible);
 window.visualViewport?.addEventListener('resize',()=>requestAnimationFrame(keepFocusVisible));
 addEventListener('scroll',schedule,{passive:true});
 addEventListener('resize',measure);reduce.addEventListener('change',measure);
 new ResizeObserver(measure).observe(content);
 measure();
 document.fonts.ready.then(()=>{measure();if(location.hash==='#ai-in-the-loop')goToReading('instant')});
})();
