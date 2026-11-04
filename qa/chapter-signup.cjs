const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('dist/chapter-signup.js', 'utf8');
function setup(fetch) {
  let submit, valid = true;
  const email = {value:' reader@example.com '}, button = {}, status = {dataset:{}};
  const form = {elements:{email}, querySelector:s=>s==='button'?button:status,
    reportValidity:()=>valid, setAttribute(){},removeAttribute(){},
    addEventListener:(type,handler)=>{submit=handler}};
  vm.runInNewContext(source,{document:{querySelector:()=>form},fetch,AbortController,setTimeout,clearTimeout,TypeError,
    location:{origin:'https://giladneiger.com',pathname:'/'}});
  return {email,button,status,submit:()=>submit({preventDefault(){}}),invalid:()=>{valid=false}};
}
(async()=>{
 let calls=[];let release;
 const app=setup((url,opts)=>{calls.push({url,opts});return new Promise(r=>release=r)});
 const pending=app.submit();await app.submit();assert.equal(calls.length,1);assert.equal(app.button.disabled,true);
 assert(calls[0].url.endsWith('/25695560/aa85f8e0-c6f0-41f9-97c7-fd28818759b5'));
 const payload=JSON.parse(calls[0].opts.body);assert.equal(payload.fields[0].value,'reader@example.com');assert.equal(payload.fields.length,1);
 assert.equal(payload.context.pageUri,'https://giladneiger.com/');
 release({ok:true});await pending;await app.submit();assert.equal(calls.length,1);assert.equal(app.status.dataset.state,'success');assert.equal(app.email.value,'');
 let tries=0;const retry=setup(async()=>({ok:++tries>1,status:429,json:async()=>({})}));
 await retry.submit();assert.equal(retry.status.dataset.state,'error');assert.equal(retry.button.disabled,false);assert.equal(retry.email.value,' reader@example.com ');
 await retry.submit();assert.equal(retry.status.dataset.state,'success');
 const network=setup(async()=>{throw new TypeError('network')});await network.submit();assert.equal(network.status.dataset.state,'error');assert.equal(network.email.readOnly,false);
 const timeout=setup(async()=>{const e=new Error();e.name='AbortError';throw e});await timeout.submit();assert.match(timeout.status.textContent,/confirm/);
 const invalid=setup(()=>{throw new Error('Must not submit invalid form')});invalid.invalid();await invalid.submit();
 const html=fs.readFileSync('dist/index.html','utf8');assert(html.includes('src="chapter-signup.js"'));assert(!html.includes('id="chapter-form" data-signup='));
 console.log('PASS: endpoint, payload, duplicate prevention, success, retry, network error, timeout, validation and demo-handler isolation. No live submissions.');
})().catch(e=>{console.error(e);process.exit(1)});
