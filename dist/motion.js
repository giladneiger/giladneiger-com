(()=>{
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(hover:hover) and (pointer:fine)'),hero=document.querySelector('.hero'),scene=document.querySelector('.portrait-scene'),NS='http://www.w3.org/2000/svg';
fetch('assets/portrait-layered.svg').then(r=>{if(!r.ok)throw Error('Portrait asset');return r.text()}).then(source=>{
const doc=new DOMParser().parseFromString(source,'image/svg+xml'),portrait=doc.documentElement;portrait.classList.add('portrait','portrait-vector');portrait.setAttribute('role','img');portrait.setAttribute('aria-label','Gilad Neiger');
const root=portrait.querySelector('g'),person=document.createElementNS(NS,'g'),windowGroup=document.createElementNS(NS,'g');
person.classList.add('portrait-person');windowGroup.classList.add('portrait-window');
const head=portrait.querySelector('[id="image"]'),body=portrait.querySelector('[id="Mask group"]'),fullPhoto=portrait.querySelector('[id="image_2"]');
// The original full photograph moves; its crop stays anchored to the painted circle.
const mask=document.createElementNS(NS,'mask');mask.id='portrait-fixed-window';mask.setAttribute('maskUnits','userSpaceOnUse');mask.setAttribute('x','0');mask.setAttribute('y','0');mask.setAttribute('width','406');mask.setAttribute('height','412');mask.style.maskType='alpha';
const rim=portrait.querySelector('[id="Ellipse 2"]').cloneNode(true);rim.removeAttribute('id');rim.querySelector('circle').setAttribute('fill','white');
const topWindow=document.createElementNS(NS,'rect');for(const [key,value] of Object.entries({x:12,y:0,width:356,height:234,fill:'white'}))topWindow.setAttribute(key,value);mask.append(rim,topWindow);portrait.querySelector('defs').append(mask);
windowGroup.setAttribute('mask','url(#portrait-fixed-window)');root.insertBefore(windowGroup,head);windowGroup.append(person);person.append(fullPhoto);head.remove();body.remove();
let i=0;for(const child of root.children)if(child!==windowGroup&&child.id!=='Ellipse 2'){child.classList.add('portrait-brush');child.style.setProperty('--draw-delay',(.55+i++*.07)+'s');}
scene.querySelector('.portrait-reveal').replaceChildren(portrait);scene.classList.add('layered');scene.querySelector('.portrait-ink').remove();
}).catch(()=>{});
const svg=document.createElementNS(NS,'svg');svg.classList.add('hero-ink');svg.setAttribute('aria-hidden','true');svg.innerHTML='<defs><filter id="brush-grain" x="-15%" y="-15%" width="130%" height="130%"><feTurbulence type="fractalNoise" baseFrequency=".16 .6" numOctaves="2" seed="12" result="grain"/><feDisplacementMap in="SourceGraphic" in2="grain" scale="1.8" xChannelSelector="R" yChannelSelector="G"/></filter></defs>';hero.append(svg);
// Build real, uneven bristle paths around the tactical gesture.
function paintGesture(group,d,index,seed){
const strokes=d.match(/M[^M]+/g)||[d];if(strokes.length>1){strokes.forEach((stroke,i)=>paintGesture(group,stroke,index,seed+i));return;}
const guide=document.createElementNS(NS,'path');guide.setAttribute('d',d);group.append(guide);
const length=guide.getTotalLength(),steps=Math.max(12,Math.ceil(length/2));
const random=n=>{const x=Math.sin(n*127.1+seed*311.7)*43758.5453;return x-Math.floor(x)};
for(let strand=0;strand<5;strand++){
const path=document.createElementNS(NS,'path'),offset=(strand-2)*.45;
let points='';
for(let j=0;j<=steps;j++){const t=j/steps,at=t*length,p=guide.getPointAtLength(at),a=guide.getPointAtLength(Math.max(0,at-.7)),b=guide.getPointAtLength(Math.min(length,at+.7)),dx=b.x-a.x,dy=b.y-a.y,n=Math.hypot(dx,dy)||1;
const pressure=.55+.45*Math.sin(Math.PI*t),jitter=(random(j+strand*93)-.5)*.45,spread=offset*pressure+jitter;
points+=(j?' L':'M')+(p.x-dy/n*spread).toFixed(2)+' '+(p.y+dx/n*spread).toFixed(2);
}
path.setAttribute('d',points);path.setAttribute('pathLength','1');path.classList.add('brush-fiber');
path.style.strokeWidth=(strand===2?1.25:.3+random(strand+66)*.3)+'px';path.style.opacity=String(.58+random(strand+5)*.4);
path.style.animationDelay=(index*135+strand*5)+'ms';
path.style.animationDuration=Math.min(420,Math.max(190,length*5))+'ms';
group.append(path);
}
guide.remove();
}
let previous=null,lastTime=-Infinity,sequence=0,bag=[],lastVariant=-1;
function nextVariant(){if(!bag.length){bag=[0,1,2,3];for(let i=3;i>0;i--){const j=Math.floor(Math.random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}if(bag.at(-1)===lastVariant)[bag[0],bag[3]]=[bag[3],bag[0]];}return lastVariant=bag.pop();}
hero.addEventListener('pointermove',e=>{if(new URLSearchParams(location.search).get('hero')!=='A'||reduced.matches||!fine.matches||e.pointerType==='touch')return;const bounds=hero.getBoundingClientRect(),p={x:e.clientX-bounds.left,y:e.clientY-bounds.top};if(!previous){previous=p;return;}const dx=p.x-previous.x,dy=p.y-previous.y,d=Math.hypot(dx,dy);if(d<85||performance.now()-lastTime<700)return;lastTime=performance.now();const start=previous;previous=p;
// Keep marks away from the headline, navigation, book and calls to action.
if(e.target.closest('a,button,.book-cover'))return;
if(svg.querySelectorAll('.ink-mark').length>=2)return;
const g=document.createElementNS(NS,'g');g.classList.add('ink-mark');
// A compact passing move, assembled in order from connected gestures.
const variant=nextVariant();
// Local direction of each formation's leading arrow; align it to pointer travel.
const leadAngles=[Math.atan2(-48,28),Math.atan2(-47,-16),Math.atan2(-70,12),Math.atan2(-51,-15)];
const heading=Math.atan2(dy,dx),jitter=(Math.random()-.5)*12;
const angle=(heading-leadAngles[variant])*180/Math.PI+jitter;sequence++;
g.dataset.heading=String(heading*180/Math.PI);g.dataset.leadDirection=String(angle+leadAngles[variant]*180/Math.PI);
g.setAttribute('transform',`translate(${Math.max(95,Math.min(bounds.width-95,p.x))} ${Math.max(155,Math.min(bounds.height-85,p.y))}) rotate(${angle})`);
const paths=variant===2?[
'M-65 30 a6 6 0 1 0 .1 0',
'M-58 30 L-15 -20',
'M-21 -24 a6 6 0 1 0 .1 0',
'M-10 -20 L40 25',
'M35 21 a6 6 0 1 0 .1 0',
'M35 29 Q-9 47 -57 34',
'M-48 29 L-59 34 -48 40',
'M45 19 Q69 -9 57 -48 M51 -37 L57 -51 64 -39',
'M-39 -2 l8 8 M-39 6 l8 -8 M17 -7 l8 8 M17 1 l8 -8'
]:variant===3?[
'M-69 20 a6 6 0 1 0 .1 0',
'M-61 20 Q-32 -23 -3 7',
'M-8 3 a6 6 0 1 0 .1 0',
'M3 8 Q46 45 63 4',
'M57 0 a6 6 0 1 0 .1 0',
'M62 -3 Q67 -41 30 -48 L2 -42',
'M12 -51 L0 -42 14 -39',
'M-4 2 L-18 -46 M-24 -34 L-19 -49 -10 -38',
'M-44 -17 l8 8 M-44 -9 l8 -8 M33 2 l8 8 M33 10 l8 -8'
]:variant===0?[
'M-72 36 a6 6 0 1 0 .1 0',
'M-68 36 L-20 10',
'M-25 10 a6 6 0 1 0 .1 0',
'M-17 12 L35 29',
'M30 25 a6 6 0 1 0 .1 0',
'M36 24 Q53 0 57 -19 Q67 -45 22 -49',
'M31 -56 L20 -49 33 -44',
'M-20 5 L7 -40 M-3 -35 L8 -43 7 -30',
'M-50 -10 l8 8 M-50 -2 l8 -8 M35 -11 l8 8 M35 -3 l8 -8'
]:[
'M-62 30 a6 6 0 1 0 .1 0',
'M-55 30 Q-31 32 -16 4',
'M-21 -1 a6 6 0 1 0 .1 0',
'M-10 2 Q16 24 42 5',
'M37 1 a6 6 0 1 0 .1 0',
'M44 0 Q71 -20 48 -44 L18 -54',
'M28 -59 L15 -55 24 -45',
'M-15 -5 L-25 -49 M-31 -39 L-26 -52 -17 -42',
'M3 -23 l8 8 M3 -15 l8 -8 M58 25 l8 8 M58 33 l8 -8'
];
paths.forEach((d,i)=>{const part=document.createElementNS(NS,'g');part.classList.add('tactic-step');part.style.animationDelay=(2050+i*65)+'ms';if(i===8)part.style.stroke='var(--ink)';g.append(part);paintGesture(part,d,i,sequence);});
svg.append(g);
const protectedAreas=[...document.querySelectorAll('.hero-actions a,.book-cover,.nav')].map(n=>n.getBoundingClientRect());
// Protect rendered text lines rather than the empty space in their containing columns.
for(const element of document.querySelectorAll('.hero-copy h1,.hero-copy .intro,.hero-copy .eyebrow')){
const walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT);let text;
while(text=walker.nextNode()){if(!text.textContent.trim())continue;const range=document.createRange();range.selectNodeContents(text);protectedAreas.push(...range.getClientRects());}
}
const box=g.getBBox(),rad=angle*Math.PI/180,cos=Math.cos(rad),sin=Math.sin(rad);
// Place the leading arrow just behind the pointer, with the formation trailing it.
const [tipX,tipY]=[[8,-43],[-26,-52],[57,-51],[-19,-49]][variant];
const originX=p.x-(tipX*cos-tipY*sin)-Math.cos(heading)*8;
const originY=p.y-(tipX*sin+tipY*cos)-Math.sin(heading)*8;
const corners=[[box.x,box.y],[box.x+box.width,box.y],[box.x,box.y+box.height],[box.x+box.width,box.y+box.height]].map(([x,y])=>[x*cos-y*sin,x*sin+y*cos]);
let placed=false;
for(const [ox,oy] of [[0,0],[-12,0],[12,0],[0,12],[0,-12]]){const x=originX+ox,y=originY+oy,left=bounds.left+x+Math.min(...corners.map(c=>c[0]))-10,right=bounds.left+x+Math.max(...corners.map(c=>c[0]))+10,top=bounds.top+y+Math.min(...corners.map(c=>c[1]))-10,bottom=bounds.top+y+Math.max(...corners.map(c=>c[1]))+10;
if(left<bounds.left||right>bounds.right||top<bounds.top||bottom>bounds.bottom||protectedAreas.some(r=>left<r.right+12&&right>r.left-12&&top<r.bottom+12&&bottom>r.top-12))continue;
g.setAttribute('transform',`translate(${x} ${y}) rotate(${angle})`);g.dataset.pointerGap=String(Math.hypot(x+tipX*cos-tipY*sin-p.x,y+tipX*sin+tipY*cos-p.y));placed=true;break;}
if(!placed){g.remove();return;}
g.addEventListener('animationend',e=>{if(e.animationName==='system-away')g.remove()});});
hero.addEventListener('pointerleave',()=>previous=null);
if(!reduced.matches){document.documentElement.classList.add('motion-ready');const observer=new IntersectionObserver(entries=>{if(entries[0].isIntersecting){scene.classList.add('is-visible');observer.disconnect()}},{threshold:.2});observer.observe(scene);let ticking=false;const move=()=>{ticking=false;if(reduced.matches)return;const r=scene.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight)return;const y=Math.max(-9,Math.min(9,(r.top+r.height/2-innerHeight/2)*.025));scene.style.setProperty('--portrait-y',y+'px')};addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(move)}},{passive:true});}else scene.classList.add('is-visible');
reduced.addEventListener('change',()=>{if(reduced.matches){scene.classList.add('is-visible');[...svg.querySelectorAll('.ink-mark')].forEach(n=>n.remove())}});
})();

// Hide after deliberate downward scrolling; reveal promptly when scrolling up.
(()=>{
const header=document.querySelector('header.nav'),menu=header.querySelector('.menu-toggle');
let lastY=Math.max(0,scrollY),travel=0,direction=0,scheduled=false;
function update(){scheduled=false;const y=Math.max(0,scrollY),delta=y-lastY;lastY=y;
if(y<90||menu.getAttribute('aria-expanded')==='true'||header.contains(document.activeElement)){header.classList.remove('nav-hidden');travel=0;return;}
if(Math.abs(delta)<1)return;const next=delta>0?1:-1;if(next!==direction){direction=next;travel=0;}travel+=Math.abs(delta);
if(travel> (direction>0?32:10)){header.classList.toggle('nav-hidden',direction>0);travel=0;}
}
addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(update)}},{passive:true});
header.addEventListener('focusin',()=>header.classList.remove('nav-hidden'));
})();
