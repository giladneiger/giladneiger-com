let format='all',topic='all',featuredId=1,pageIndex=0,pageCount=1,changeToken=0,paging=false;
const pageSize=6;
const grid=document.querySelector('#article-grid');
function sizeCardArtwork(card){
const art=card.querySelector('.card-art');if(!art)return;
const bounds=card.getBoundingClientRect(),open=card.classList.contains('featured'),mobile=innerWidth<=760,pad=open?(mobile?18:24):(mobile?10:18);
const text=card.querySelector(open?'.card-excerpt':'h3').getBoundingClientRect();
const footer=card.querySelector('.card-footer'),foot=footer.getBoundingClientRect();
const sideBySide=open&&!mobile&&bounds.width>=450;
const title=card.querySelector('h3').getBoundingClientRect();
const top=Math.max(pad,(sideBySide?title.bottom:text.bottom)-bounds.top+12),bottom=open||getComputedStyle(footer).display==='none'?bounds.height-pad:foot.top-bounds.top-12;
const available=Math.max(0,bottom-top);
art.style.setProperty('--art-top',top+'px');art.style.setProperty('--art-height',available+'px');
const button=card.querySelector('.article-link')?.getBoundingClientRect();
const safeLeft=sideBySide?Math.max(text.right-bounds.left+20,(button?.right||bounds.left)-bounds.left+18):((button?.right||bounds.left)-bounds.left+18);
art.style.setProperty('--art-width',Math.max(0,open?bounds.width-safeLeft-pad:bounds.width-2*pad)+'px');
art.style.visibility=available<25?'hidden':'visible';
}
const artworkObserver=new ResizeObserver(entries=>entries.forEach(e=>sizeCardArtwork(e.target)));
const dateLabel=d=>new Date(d+'T12:00:00').toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}).toUpperCase();
function articleTitle(text){
 const words=text.trim().split(/\s+/),escape=value=>value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
 const ending=words.splice(-2).map(escape).join(' ');
 const start=words.map(escape).join(' ')
  .replace(/\b(to \S+)/g,'<span class="title-phrase title-phrase-wide">$1</span>')
  .replace(/\b((?:at|in|on) \S+|\S+) - /g,'<span class="title-phrase title-phrase-wide">$1 -</span> ');
 return `${start} <span class="title-phrase">${ending}</span>`;
}
function render(animate=false){

const filtered=articles.filter(a=>(format==='all'||a.type===format)&&(topic==='all'||a.topic===topic)).sort((a,b)=>b.date.localeCompare(a.date));
pageCount=Math.max(1,Math.ceil(filtered.length/pageSize));pageIndex=Math.min(pageIndex,pageCount-1);
const items=filtered.slice(pageIndex*pageSize,(pageIndex+1)*pageSize);
grid.hidden=items.length===0;
document.querySelector('.archive-pager').hidden=pageCount===1;
grid.dataset.count=items.length;
document.querySelector('#archive-status').textContent=items.length?`${pageIndex+1} / ${pageCount} · ${dateLabel(items[0].date)} - ${dateLabel(items.at(-1).date)}`:'No matching articles';
document.querySelector('#newer-posts').disabled=paging||pageIndex===0;
document.querySelector('#older-posts').disabled=paging||pageIndex>=pageCount-1;
if(!items.some(a=>a.id===featuredId))featuredId=items[0]?.id;
const markup=items.map((a,position)=>{const open=a.id===featuredId;return `<article class="article-card ${a.theme||''} ${open?'featured':''}" data-id="${a.id}" data-slot="${position}"><div class="card-grid" style="background-image:url('assets/${a.grid}')"></div><p class="card-date"><time datetime="${a.date}">${dateLabel(a.date)}</time>${open?' / FEATURED':''}${a.mockup?' / DEMO':''}</p><h3><button class="expand-card" data-expand="${a.id}" aria-expanded="${open}" aria-controls="excerpt-${a.id}">${articleTitle(open?a.title:(a.compactTitle||a.title))}</button></h3><div id="excerpt-${a.id}" class="card-excerpt" ${open?'':'hidden'}>${a.excerpt}</div><img class="card-art" src="assets/${a.art}" alt=""><div class="card-footer"><span>BY GILAD NEIGER</span>${open?`<a class="button article-link" href="${a.url||`article.html?id=${a.id}`}" target="_blank" rel="noopener">Read on develeap ↗</a>`:'<span class="expand-hint" aria-hidden="true">Open +</span>'}</div></article>`;}).join('');
const template=document.createElement('template');template.innerHTML=markup;
const old=new Map([...grid.children].map(n=>[n.dataset.id,n]));
for(const next of [...template.content.children]){const existing=old.get(next.dataset.id);if(existing){if(existing.className!==next.className)existing.innerHTML=next.innerHTML;existing.className=next.className;existing.dataset.slot=next.dataset.slot;grid.append(existing);old.delete(next.dataset.id);}else grid.append(next);}
for(const node of old.values()){artworkObserver.unobserve(node);node.remove();}
layoutBento();
for(const card of grid.children){artworkObserver.observe(card);sizeCardArtwork(card);}
document.querySelector('#empty').hidden=items.length>0;

}
function layoutBento(){
const cards=[...grid.children],mobile=matchMedia('(max-width:760px)').matches,selected=Math.max(0,cards.findIndex(n=>Number(n.dataset.id)===featuredId)),W=grid.clientWidth,H=grid.clientHeight,gap=mobile?10:16;
// Independently sized tiles follow the Figma composition, reflected around the selected tile.
const base=[[0,0,16,16],[16,0,8,8],[16,8,8,8],[0,16,6,8],[6,16,9,8],[15,16,9,8]];
const anchor=cards[selected]?.dataset.rect?JSON.parse(cards[selected].dataset.rect):base[selected]||base[0],cx=anchor[0]+anchor[2]/2,cy=anchor[1]+anchor[3]/2;
let slots;
if(cards.length<6){
const n=cards.length;
if(!n)return;
if(mobile){const h=n===1?24:n===2?16:14,rest=n-1,rows=Math.ceil(rest/2),rowH=(24-h)/Math.max(1,rows);slots=[[0,0,24,h]];for(let i=0;i<rest;i++){const lastOdd=i===rest-1&&rest%2;slots.push([lastOdd?0:(i%2)*12,h+Math.floor(i/2)*rowH,lastOdd?24:12,rowH]);}if(cy>=12)slots=slots.map(([x,y,w,h])=>[x,24-y-h,w,h]);}
else {const layouts={1:[[0,0,24,24]],2:[[0,0,15,24],[15,0,9,24]],3:[[0,0,16,24],[16,0,8,12],[16,12,8,12]],4:[[0,0,16,16],[16,0,8,16],[0,16,10,8],[10,16,14,8]],5:[[0,0,16,16],[16,0,8,8],[16,8,8,8],[0,16,10,8],[10,16,14,8]]};slots=layouts[n].map(([x,y,w,h])=>[cx>=12?24-x-w:x,cy>=12?24-y-h:y,w,h]);}
}
else if(mobile){const bottom=cy>=12,lead=[0,bottom?10:0,24,14],y=bottom?0:14;slots=[lead,[0,y,12,3.3],[12,y,12,3.3],[0,y+3.3,12,3.3],[12,y+3.3,12,3.3],[0,y+6.6,24,3.4]];}
else if(cy>=12&&cx>=9&&cx<=15){slots=[[6,8,12,16],[0,0,8,8],[8,0,8,8],[16,0,8,8],[0,8,6,16],[18,8,6,16]];}
else {const right=cx>=12,bottom=cy>=12;slots=base.map(([x,y,w,h])=>[right?24-x-w:x,bottom?24-y-h:y,w,h]);}
const others=cards.filter((_,i)=>i!==selected),available=slots.slice(1,others.length+1);
// Compact articles retain chronological reading order around the selected lead.
const best=[...available].sort((a,b)=>a[1]-b[1]||a[0]-b[0]);
const rects=new Map(others.map((n,i)=>[n,best[i]]));rects.set(cards[selected],slots[0]);
for(const n of cards){const r=rects.get(n);if(!r)continue;n.dataset.rect=JSON.stringify(r);n.style.gridArea='auto';n.style.left=(r[0]/24*(W+gap))+'px';n.style.top=(r[1]/24*(H+gap))+'px';n.style.width=(r[2]/24*(W+gap)-gap)+'px';n.style.height=(r[3]/24*(H+gap)-gap)+'px';}
}
window.addEventListener('resize',layoutBento);
document.fonts.ready.then(()=>{for(const card of grid.children)sizeCardArtwork(card);});
render();
document.querySelectorAll('[data-format]').forEach(b=>b.onclick=()=>{cancelPaging();pageIndex=0;format=b.dataset.format;document.querySelectorAll('[data-format]').forEach(x=>x.setAttribute('aria-pressed',x===b));render(true);});
document.querySelectorAll('[data-topic]').forEach(b=>b.onclick=()=>{cancelPaging();pageIndex=0;topic=b.dataset.topic;document.querySelectorAll('[data-topic]').forEach(x=>x.setAttribute('aria-pressed',x===b));render(true);});
function cancelPaging(){changeToken++;paging=false;grid.removeAttribute('aria-busy');for(const c of grid.children)c.getAnimations().forEach(a=>a.cancel());}
async function turnPage(direction){
if(paging||pageIndex+direction<0||pageIndex+direction>=pageCount)return;
const token=++changeToken;paging=true;grid.setAttribute('aria-busy','true');
document.querySelector('#newer-posts').disabled=true;document.querySelector('#older-posts').disabled=true;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
if(!reduced)await Promise.allSettled([...grid.children].map((n,i)=>n.animate([{opacity:1,transform:'translateX(0)'},{opacity:0,transform:'translateX('+(-direction*18)+'px)'}],{duration:120,delay:i*15,fill:'forwards',easing:'ease-in'}).finished));
if(token!==changeToken)return;
pageIndex+=direction;featuredId=null;render();
for(const n of grid.children)n.getAnimations().forEach(a=>a.cancel());
if(!reduced)await Promise.allSettled([...grid.children].map((n,i)=>n.animate([{opacity:0,transform:'translateX('+(direction*22)+'px)'},{opacity:1,transform:'translateX(0)'}],{duration:220,delay:i*22,fill:'backwards',easing:'cubic-bezier(.2,.7,.2,1)'}).finished));
if(token!==changeToken)return;paging=false;grid.removeAttribute('aria-busy');document.querySelector('#newer-posts').disabled=pageIndex===0;document.querySelector('#older-posts').disabled=pageIndex>=pageCount-1;
}
document.querySelector('#newer-posts').onclick=()=>turnPage(-1);
document.querySelector('#older-posts').onclick=()=>turnPage(1);
grid.addEventListener('click',e=>{if(paging)return;if(e.target.closest('a'))return;const card=e.target.closest('.article-card');if(!card||Number(card.dataset.id)===featuredId)return;featuredId=Number(card.dataset.id);render(true);const current=grid.querySelector('[data-id="'+featuredId+'"]');if(e.detail===0)current.querySelector('button').focus({preventScroll:true});});
const menu=document.querySelector('.menu-toggle'),nav=document.querySelector('#navigation');menu.onclick=()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',open);nav.classList.toggle('open',open);};nav.querySelectorAll('a').forEach(a=>a.onclick=()=>{menu.setAttribute('aria-expanded','false');nav.classList.remove('open');});
document.querySelectorAll('[data-signup]').forEach(form=>{form.onsubmit=e=>{e.preventDefault();form.querySelector('[role=status]').textContent=form.dataset.signup==='chapter'?'Preview only. Your email was not sent, and you have not been subscribed to any newsletter.':'Preview only. Your email was not submitted and no subscription was created.';};});
document.querySelector('#speaking-form').onsubmit=e=>{e.preventDefault();const f=e.currentTarget,d=new FormData(f);const body=`Name: ${d.get('name')}\nEmail: ${d.get('email')}\nEvent: ${d.get('type')}\nAudience: ${d.get('audience')}\n\n${d.get('message')}`;window.location.href='mailto:gilad.neiger@develeap.com?subject='+encodeURIComponent('Speaking request: '+d.get('type'))+'&body='+encodeURIComponent(body);f.querySelector('[role=status]').textContent='Your email app will open with the request. Review it and send it when you are ready.';};
