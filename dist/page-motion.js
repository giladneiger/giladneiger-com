/* Small independent entrances, with immediate access by keyboard and no replay. */
(() => {
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 if(!('IntersectionObserver' in window)||!Element.prototype.animate)return;
 const records=new Map(),active=new Set();
 const easing='cubic-bezier(.16,1,.3,1)';
 function words(node){
  const walker=document.createTreeWalker(node,NodeFilter.SHOW_TEXT),texts=[];
  while(walker.nextNode())texts.push(walker.currentNode);
  for(const text of texts){
   if(!text.textContent.trim()||text.parentElement.closest('.sr-only,.reveal-word'))continue;
   const fragment=document.createDocumentFragment();
   for(const token of text.textContent.split(/(\s+)/)){
    if(!token.trim()){fragment.append(document.createTextNode(token));continue;}
    const mask=document.createElement('span'),ink=document.createElement('span');
    mask.className='reveal-word';ink.className='word-ink';ink.textContent=token;mask.append(ink);fragment.append(mask);
   }
   text.replaceWith(fragment);
  }
 }
 function run(node,frames,options){
  const animation=node.animate(frames,{duration:620,easing,fill:'both',...options});active.add(animation);
  return animation.finished.catch(()=>{}).then(()=>{active.delete(animation);animation.cancel()});
 }
 function show(record,instant=false){
  const {node,kind,delay}=record;if(node.dataset.enterState!=='pending')return;
  observer.unobserve(node);
  if(instant||reduce.matches){node.dataset.enterState='entered';return;}
  const jobs=[];
  if(kind==='words'){
   const ink=[...node.querySelectorAll('.word-ink')],stagger=Math.min(22,160/Math.max(1,ink.length-1));
   ink.forEach((word,i)=>jobs.push(run(word,[{transform:'translateY(105%)',opacity:.12},{transform:'translateY(0)',opacity:1}],{duration:640,delay:delay+i*stagger})));
  }else if(kind==='panel'){
   // The red field draws independently from the paper and its text.
  }else{
   const base=getComputedStyle(node).transform,rest=base==='none'?'':base;
   const start=kind==='paper'?`translateY(28px) rotate(-1.2deg) ${rest}`:kind==='book'?`translateY(24px) rotate(-2deg) ${rest}`:kind==='rule'?`scaleX(.75) ${rest}`:`translateY(${kind==='card'?22:14}px) ${rest}`;
   jobs.push(run(node,[{opacity:0,transform:start},{opacity:1,transform:rest||'none'}],{duration:kind==='paper'||kind==='book'?820:600,delay}));
   if(kind==='card'){
    const title=node.querySelector('h3'),art=node.querySelector('.card-art');
    if(title)jobs.push(run(title,[{clipPath:'inset(0 0 100% 0)',opacity:0},{clipPath:'inset(0 0 0% 0)',opacity:1}],{duration:560,delay:delay+70}));
    if(art)jobs.push(run(art,[{opacity:0},{opacity:1}],{duration:680,delay:delay+110}));
   }
  }
  node.dataset.enterState='running';
  Promise.allSettled(jobs).then(()=>node.dataset.enterState='entered');
 }
 const observer=new IntersectionObserver(entries=>{
  for(const entry of entries)if(entry.isIntersecting)show(records.get(entry.target));
 },{threshold:0,rootMargin:'0px 0px -32px 0px'});
 function add(node,kind='rise',delay=0){
  if(!node||records.has(node))return;
  if(kind==='words')words(node);
  const record={node,kind,delay};records.set(node,record);node.dataset.enter=kind;
  node.dataset.enterState=reduce.matches?'entered':'pending';
  if(!reduce.matches)observer.observe(node);
 }
 const all=(selector,kind='rise',delay=0)=>document.querySelectorAll(selector).forEach((node,i)=>add(node,kind,delay+Math.min(i*35,100)));
 all('.nav>.wordmark,.nav>nav,.nav>.nav-cta,.nav>.menu-toggle','rise');
 all('.hero h1','words');all('.hero .intro','rise',100);all('.hero-actions a','rise',160);all('.book-cover','book',120);
 all('#book-perspective h2,.chapter-copy h2,#articles .section-heading h2,.about-copy h2,#speaking h2','words');
 all('#book-perspective .book-intro>div>p,.chapter-copy>p,#articles .section-intro,.about-copy>p,#speaking .wrap>div>p');
 all('.chapter-panel','panel');all('.chapter-page','paper');all('.chapter-page-running,.quote-glyph','rise',80);
 all('.chapter-page blockquote p','words',100);all('.chapter-page figcaption','rise',170);
 all('#chapter-form,#speaking-form','rise',120);all('#articles .topics,#articles .feed-controls');
 all('.about-copy details,#speaking .wrap>div>a,.speaking-play');
 all('footer .footer-rule','rule');all('footer>.wordmark,footer>nav,footer>.small');
 const grid=document.querySelector('#article-grid');
 const registerCards=()=>grid?.querySelectorAll('.article-card').forEach((node,i)=>add(node,'card',i*45));
 registerCards();if(grid)new MutationObserver(registerCards).observe(grid,{childList:true});
 // Focus never waits for an entrance, including a direct hash or keyboard jump.
 document.addEventListener('focusin',event=>{
  for(const record of records.values())if(record.node.contains(event.target)){
   show(record,true);for(const animation of [...active])if(record.node.contains(animation.effect?.target))animation.finish();
  }
 });
 reduce.addEventListener('change',()=>{
  if(!reduce.matches)return;
  for(const record of records.values())show(record,true);
  for(const animation of [...active])animation.finish();
 });
})();
