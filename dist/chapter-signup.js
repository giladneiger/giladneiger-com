// Chapter requests use their own HubSpot form, separate from AI in the Loop.
(() => {
  const form = document.querySelector('#chapter-form');
  if (!form) return;
  const endpoint = 'https://api.hsforms.com/submissions/v3/integration/submit/25695560/aa85f8e0-c6f0-41f9-97c7-fd28818759b5';
  const email = form.elements.email;
  const button = form.querySelector('button');
  const status = form.querySelector('[role="status"]');
  let pending = false, complete = false;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (pending || complete || !form.reportValidity()) return;
    pending = true;
    button.disabled = true;
    email.readOnly = true;
    button.textContent = 'Sending…';
    form.setAttribute('aria-busy', 'true');
    status.textContent = 'Sending your request…';
    status.dataset.state = 'pending';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(endpoint, {
        method: 'POST', credentials: 'omit', signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: [{ objectTypeId: '0-1', name: 'email', value: email.value.trim() }],
          context: { pageName: 'First chapter and The Team Talk | Gilad Neiger', pageUri: location.origin + location.pathname }
        })
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        const type = result.errors?.[0]?.errorType;
        throw new Error(response.status === 429 ? 'Please wait a moment, then try again.' :
          type === 'INVALID_EMAIL' ? 'Please check your email address and try again.' :
          'We couldn’t complete your request. Please try again shortly.');
      }
      complete = true;
      status.dataset.state = 'success';
      status.textContent = 'Thanks! Your request has been received.';
      button.textContent = 'Request received ✓';
      email.value = '';
    } catch (error) {
      status.dataset.state = 'error';
      status.textContent = error.name === 'AbortError' ?
        'We couldn’t confirm your request in time. Please try again later.' :
        error instanceof TypeError ? 'We couldn’t reach the signup service. Please try again.' : error.message;
      button.textContent = 'Get the chapter →';
    } finally {
      clearTimeout(timer);
      pending = false;
      form.removeAttribute('aria-busy');
      button.disabled = complete;
      email.readOnly = complete;
    }
  });
})();
