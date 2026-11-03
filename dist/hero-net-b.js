(()=>{
const hero=document.querySelector('.hero'),isB=new URLSearchParams(location.search).get('hero')!=='A';
if(!isB)return;hero.classList.add('net-option-b');
const NS='http://www.w3.org/2000/svg',svg=document.createElementNS(NS,'svg');svg.classList.add('reactive-net');svg.setAttribute('aria-hidden','true');hero.prepend(svg);
const cursor=document.createElement('span');cursor.className='net-cursor';cursor.setAttribute('aria-hidden','true');hero.append(cursor);
const fine=matchMedia('(hover:hover) and (pointer:fine)'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
let width=0,height=0,paths=[],x=0,y=0,aimX=0,aimY=0,depth=0,target=0,frame=0,last=0;
function build(){const b=hero.getBoundingClientRect();width=b.width;height=b.height;svg.setAttribute('viewBox',`0 0 ${width} ${height}`);svg.replaceChildren();paths=[];const step=width<760?48:66;
for(let c=-step;c<=width+step;c+=step){const points=[];for(let r=-25;r<=height+25;r+=12)points.push([c+(r/height-.5)*24,r]);add(points)}
for(let r=-step;r<=height+step;r+=step){const points=[];for(let c=-25;c<=width+25;c+=12)points.push([c,r+(c/width-.5)*-30]);add(points)}draw();}
function add(points){const path=document.createElementNS(NS,'path');svg.append(path);paths.push({path,points})}
function draw(){const radius=Math.min(255,width*.38);for(const {path,points}of paths){path.setAttribute('d',points.map(([px,py],i)=>{const dx=px-x,dy=py-y,d2=dx*dx+dy*dy,falloff=Math.exp(-d2/(radius*radius*.62))*depth;
return (i?'L':'M')+(px-dx*.39*falloff).toFixed(2)+' '+(py-dy*.39*falloff+19*falloff).toFixed(2)}).join(' '))}}
function tick(time){frame=0;const dt=Math.min(40,last?time-last:16);last=time;depth+=(target-depth)*(1-Math.exp(-dt/(target?70:180)));draw();if(Math.abs(target-depth)>.002)frame=requestAnimationFrame(tick);else{depth=target;last=0;draw()}}
function wake(){if(!frame)frame=requestAnimationFrame(tick)}
hero.addEventListener('pointermove',e=>{if(!fine.matches||reduced.matches||e.pointerType==='touch')return;const b=hero.getBoundingClientRect();aimX=e.clientX-b.left;aimY=e.clientY-b.top;x=aimX;y=aimY;const control=e.target.closest('a,button,input');target=control?0:1;hero.classList.toggle('net-engaged',!control);cursor.style.transform=`translate3d(${aimX}px,${aimY}px,0)`;wake()});
function leave(){target=0;hero.classList.remove('net-engaged');wake()}
hero.addEventListener('pointerleave',leave);window.addEventListener('blur',leave);document.addEventListener('visibilitychange',()=>{if(document.hidden)leave()});
reduced.addEventListener('change',leave);fine.addEventListener('change',leave);new ResizeObserver(build).observe(hero);
})();
