import { sendContactRequest } from './contact-request.js';

(() => {
  const doc = document;
  const themeButton = doc.querySelector('.theme-toggle');
  const updateThemeLabel = () => {
    if (themeButton) themeButton.setAttribute('aria-label', doc.documentElement.dataset.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  };
  updateThemeLabel();
  themeButton?.addEventListener('click', () => {
    const theme = doc.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    doc.documentElement.dataset.theme = theme;
    doc.documentElement.classList.toggle('dark', theme === 'dark');
    try { localStorage.setItem('infrayard-theme', theme); } catch { /* Storage can be disabled. */ }
    updateThemeLabel();
  });

  const menu = doc.getElementById('main-navigation');
  const menuButton = doc.querySelector('.menu-toggle');
  menuButton?.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    menu?.classList.toggle('is-open', open);
  });
  menu?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    menu.classList.remove('is-open');
    menuButton?.setAttribute('aria-expanded', 'false');
  }));

  const priceData = doc.getElementById('pricing-data');
  const prices = priceData ? JSON.parse(priceData.textContent) : null;
  const formatMoney = value => new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
  let billing = 'monthly';
  const foundingInput = doc.getElementById('founding-pricing');
  const renderPrice = () => {
    if (!prices) return;
    const founding = Boolean(foundingInput?.checked);
    const plan = founding ? prices.founding : prices.business;
    const annual = billing === 'annual';
    doc.getElementById('business-price').textContent = formatMoney(annual ? plan.annual / 12 : plan.monthly);
    doc.getElementById('business-unit').textContent = annual ? '/month, billed annually' : '/month';
    const note = doc.getElementById('business-billing-note');
    note.textContent = annual ? `${formatMoney(plan.annual)} paid upfront for 12 months. Save ${formatMoney(plan.monthly * 12 - plan.annual)} compared with monthly billing.` : 'Billed monthly. Cancel at the end of your billing period.';
    doc.getElementById('founding-period-note').hidden = !founding;
    doc.querySelectorAll('[data-billing]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.billing === billing)));
  };
  doc.querySelectorAll('[data-billing]').forEach(button => button.addEventListener('click', () => {
    billing = button.dataset.billing;
    renderPrice();
  }));
  foundingInput?.addEventListener('change', renderPrice);
  renderPrice();

  const dialog = doc.getElementById('contact-dialog');
  const form = doc.getElementById('contact-form');
  if (!dialog || !form) return;
  const status = doc.getElementById('form-status');
  const submit = form.querySelector('[type=submit]');
  const preview = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname) || location.protocol === 'file:';
  let context = 'demo';
  let previousFocus;
  let requestInFlight = false;
  const contexts = {
    demo: { title: 'Request your Infrayard demo', description: 'See the product in action and discuss your OCI environment in a 30-minute call.', submit: 'Request a demo', subject: 'Infrayard demo request' },
    business: { title: 'Start with Business', description: 'Discuss your environment, onboarding and the subscription that fits your team.', submit: 'Discuss Business', subject: 'Infrayard Business enquiry' },
    enterprise: { title: 'Discuss your requirements', description: 'Tell us about your rollout, support and procurement requirements.', submit: 'Send enquiry', subject: 'Infrayard Enterprise enquiry' },
    evaluation: { title: 'Discuss an evaluation', description: 'Agree the prerequisites and success criteria for an optional guided evaluation in your tenancy.', submit: 'Discuss an evaluation', subject: 'Infrayard evaluation enquiry' },
    support: { title: 'Contact support', description: 'Describe the issue and affected release. Keep credentials, tokens and customer data out of this form.', submit: 'Send support request', subject: 'Infrayard support request' },
  };
  const setStatus = (message, state) => {
    status.textContent = message;
    status.dataset.state = state;
    status.hidden = false;
  };
  const selectionText = () => {
    if (!prices || context !== 'business') return '';
    const founding = Boolean(foundingInput?.checked);
    const plan = founding ? prices.founding : prices.business;
    const label = founding ? 'Founding Business' : 'Business';
    return `${label} · ${billing === 'annual' ? `${formatMoney(plan.annual)} annually, paid upfront` : `${formatMoney(plan.monthly)} monthly`}${founding ? ' · first 12 months' : ''}`;
  };
  const openContact = requested => {
    if (requestInFlight) return;
    context = Object.hasOwn(contexts, requested) ? requested : 'demo';
    const config = contexts[context];
    previousFocus = doc.activeElement;
    doc.getElementById('contact-title').textContent = config.title;
    doc.getElementById('contact-description').textContent = config.description;
    submit.textContent = config.submit;
    status.hidden = true;
    const support = context === 'support';
    doc.getElementById('company-field').hidden = support;
    form.elements.company.required = !support;
    form.elements.message.required = support;
    doc.getElementById('message-label').textContent = support ? 'How can we help?' : 'What would you like to improve?';
    doc.getElementById('message-optional').hidden = support;
    const selection = doc.getElementById('form-selection');
    selection.textContent = selectionText();
    selection.hidden = !selection.textContent;
    doc.getElementById('preview-note').hidden = !preview;
    const email = support ? 'support@infrayard.eu' : 'hello@infrayard.eu';
    const fallback = doc.getElementById('contact-email');
    fallback.textContent = email;
    fallback.href = `mailto:${email}`;
    if (!dialog.open) dialog.showModal();
  };
  const closeContact = () => { if (!requestInFlight) dialog.close(); };
  doc.querySelectorAll('[data-contact]').forEach(button => button.addEventListener('click', () => openContact(button.dataset.contact)));
  doc.getElementById('close-contact').addEventListener('click', closeContact);
  dialog.addEventListener('click', event => { if (event.target === dialog) {
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeContact();
  } });
  dialog.addEventListener('cancel', event => { if (requestInFlight) event.preventDefault(); });
  dialog.addEventListener('close', () => previousFocus?.focus());
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (requestInFlight || !form.reportValidity()) return;
    if (form.elements.website.value) return;
    if (preview) {
      setStatus('Local preview: no message has been sent. Your entries have been kept so you can review this form.', 'preview');
      return;
    }
    const email = context === 'support' ? 'support@infrayard.eu' : 'hello@infrayard.eu';
    const data = new FormData(form);
    data.delete('website');
    if (context === 'support') data.delete('company');
    data.set('_subject', contexts[context].subject);
    data.set('_template', 'table');
    data.set('request_type', context);
    if (selectionText()) data.set('selected_subscription', selectionText());
    const originalLabel = submit.textContent;
    requestInFlight = true;
    submit.disabled = true;
    submit.textContent = 'Sending…';
    status.hidden = true;
    try {
      await sendContactRequest(email, data);
      setStatus(context === 'support' ? 'Your support request has been received. We’ll reply by email.' : 'Your request has been received. We’ll email you to arrange the next step.', 'success');
      form.reset();
    } catch {
      setStatus(`We couldn’t send your request. Please try again or email ${email}. Your entries have been kept.`, 'error');
    } finally {
      requestInFlight = false;
      submit.disabled = false;
      submit.textContent = originalLabel;
    }
  });
  const requested = new URLSearchParams(location.search).get('enquiry');
  if (requested && Object.hasOwn(contexts, requested)) openContact(requested);
})();
