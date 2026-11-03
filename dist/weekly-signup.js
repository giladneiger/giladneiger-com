/* Only the verified AI in the Loop form receives these submissions.
   https://developers.hubspot.com/docs/api-reference/legacy/marketing/forms/v3-legacy/submit-data-unauthenticated */
(()=>{
const endpoint='https://api.hsforms.com/submissions/v3/integration/submit/25695560/b54058f1-90e9-401c-9052-7b482d71f06e';
for(const form of document.querySelectorAll('[data-weekly-form]')){
 let pending=false,complete=false;
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(pending||complete||!form.reportValidity())return;
  const email=form.elements.email,button=form.querySelector('button'),status=form.querySelector('[role="status"]');
  pending=true;button.disabled=true;email.readOnly=true;button.textContent='…';form.setAttribute('aria-busy','true');status.textContent='Sending your request…';status.dataset.state='pending';
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
  try{
   const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'omit',signal:controller.signal,body:JSON.stringify({fields:[{objectTypeId:'0-1',name:'email',value:email.value.trim()}],context:{pageName:'AI in the Loop | Gilad Neiger',pageUri:location.origin+location.pathname}})});
   const result=await response.json().catch(()=>({}));
   if(!response.ok){const type=result.errors?.[0]?.errorType;throw new Error(response.status===429?'Please wait a moment, then try again.':type==='INVALID_EMAIL'?'Please check your email address and try again.':'We couldn’t complete your signup. Please try again shortly.');}
   complete=true;status.dataset.state='success';status.textContent='Your request is received. Check your inbox for any confirmation from develeap.';button.textContent='✓';email.value='';
  }catch(error){status.dataset.state='error';status.textContent=error.name==='AbortError'?'We couldn’t confirm your signup in time. Check your inbox before trying again.':error instanceof TypeError?'We couldn’t reach the signup service. Check your connection and try again.':error.message;button.textContent='GO →';}
  finally{clearTimeout(timer);pending=false;form.removeAttribute('aria-busy');button.disabled=complete;email.readOnly=complete;}
 });
}
})();
