(()=>{
const issues=window.NEWSLETTER_ISSUES||[],list=document.querySelector('#issue-list'),month=document.querySelector('#issue-month'),search=document.querySelector('#issue-search');
const fmt=(s,options)=>new Intl.DateTimeFormat('en-GB',options).format(new Date(s+'T12:00:00'));
const months=[...new Set(issues.map(i=>i.date.slice(0,7)))];
months.forEach(m=>{const o=new Option(fmt(m+'-01',{month:'long',year:'numeric'}),m);month.add(o)});
const query=new URLSearchParams(location.search);if(months.includes(query.get('month')))month.value=query.get('month');search.value=query.get('q')||'';
function render(){
 const term=search.value.trim().toLowerCase();const selected=issues.filter(i=>(month.value==='all'||i.date.startsWith(month.value))&&(!term||i.title.toLowerCase().includes(term)||String(i.number)===term));list.replaceChildren();
 for(const m of [...new Set(selected.map(i=>i.date.slice(0,7)))]){
  const group=document.createElement('section');group.className='issue-month-group';const title=document.createElement('h3');title.textContent=fmt(m+'-01',{month:'long',year:'numeric'});group.append(title);const cards=document.createElement('div');cards.className='issue-cards';
  selected.filter(i=>i.date.startsWith(m)).forEach(i=>{const card=document.createElement(i.url?'a':'div');card.className='issue-card';if(i.url){card.href=i.url;if(i.number!==31){card.target='_blank';card.rel='noopener'}}else{card.setAttribute('aria-disabled','true')}const meta=document.createElement('span');meta.className='issue-meta';meta.textContent='No. '+String(i.number).padStart(2,'0')+' / '+fmt(i.date,{day:'numeric',month:'short'});const heading=document.createElement('h4');heading.textContent=i.title;const action=document.createElement('span');action.className='issue-card-action';action.textContent=i.url?'Read in Hebrew ↗':'Edition unavailable';card.append(meta,heading,action);cards.append(card)});group.append(cards);list.append(group);
 }
 document.querySelector('#issue-count').textContent=selected.length+' of '+issues.length+' editions · Newest first';document.querySelector('#no-issues').hidden=selected.length>0;
 const params=new URLSearchParams();if(month.value!=='all')params.set('month',month.value);if(search.value.trim())params.set('q',search.value.trim());history.replaceState(null,'',location.pathname+(params.size?'?'+params:''));
}
month.addEventListener('change',render);search.addEventListener('input',render);render();
})();
