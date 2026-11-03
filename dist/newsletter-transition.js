/* Decorative, deterministic pixel dissolve. No continuous animation loop. */
(()=>{
const band=document.querySelector('.newsletter-transition');if(!band)return;
const ns='http://www.w3.org/2000/svg',reduce=matchMedia('(prefers-reduced-motion: reduce)');
const matrix=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
function draw(){
 const width=band.clientWidth,height=78,cell=6,svg=document.createElementNS(ns,'svg');
 svg.setAttribute('viewBox','0 0 '+width+' '+height);svg.setAttribute('width','100%');svg.setAttribute('height',height);svg.setAttribute('shape-rendering','crispEdges');
 for(let row=0;row<13;row++){
  const group=document.createElementNS(ns,'g');group.style.setProperty('--pixel-delay',row*22+'ms');
  for(let col=0;col<Math.ceil(width/cell);col++){
   const wave=Math.sin(col*.12)*.065+Math.sin(col*.037)*.045;
   const density=Math.max(0,Math.min(1,1-row/11+wave));
   if((matrix[row%4][col%4]+.5)/16>=density)continue;
   const rect=document.createElementNS(ns,'rect');rect.setAttribute('x',col*cell);rect.setAttribute('y',row*cell);rect.setAttribute('width',cell);rect.setAttribute('height',cell);group.append(rect);
  }svg.append(group);
 }band.replaceChildren(svg);
}
draw();let resizeTimer;const resize=new ResizeObserver(()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(draw,100)});resize.observe(band);
if(!reduce.matches&&'IntersectionObserver' in window){band.classList.add('pixel-ready');const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){band.classList.add('pixel-revealed');observer.disconnect();}},{threshold:.25});observer.observe(band);}
})();
