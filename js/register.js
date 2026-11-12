/* Membership registration form: validation, error summary, batch preview, section tracking.
   Submission is a placeholder — connect to Google Forms / Google Sheets / Formspree or a backend in submitRegistration(). */
(() => {
  const form = document.getElementById('reg-form');
  if (!form) return;

  const summary = document.getElementById('error-summary');
  const success = document.getElementById('reg-success');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Rules (only required / formatted fields) ---------- */
  const today = new Date();
  const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  const pick = (what) => (v) => v ? '' : `Please select your ${what}.`;
  const rules = {
    fullName: (v) => v.trim().length >= 2 ? '' : 'Please enter your name.',
    email: (v) => !v.trim() ? 'Please enter your email address.'
      : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Enter an email like name@example.com.',
    phone: (v) => {
      const digits = v.replace(/\D/g, '');
      if (!digits) return 'Please enter your phone number.';
      return digits.length >= 9 && digits.length <= 15 && /^[+\d\s()-]+$/.test(v.trim()) ? '' : 'Enter a valid phone number, e.g. +60 12-345 6789.';
    },
    dob: (v) => {
      if (!v) return 'Please enter your date of birth.';
      const d = new Date(v + 'T00:00:00');
      const age = (today - d) / (365.25 * 864e5);
      if (isNaN(age) || age < 15 || age > 100) return 'Please check your date of birth.';
      return '';
    },
    batch: pick('batch'),
    batchCycle: pick('batch cycle'),
    house: pick('house'),
    country: (v) => v.trim() ? '' : 'Please enter your country of residence.',
    state: pick('state'),
    city: (v, el) => el.disabled || v.trim() ? '' : 'Please tell us the city or area where you live.',
    eduLevel: pick('highest education level'),
    consent: (_, el) => el.checked ? '' : 'Please give your consent so we can process your registration.',
  };
  const labelFor = (name) => {
    const l = form.querySelector(`label[for="${name}"]`);
    return name === 'consent' ? 'Consent' : l.textContent.replace('*', '').trim();
  };

  const check = (el) => {
    const msg = rules[el.name](el.value, el);
    document.getElementById(el.name + '-err').textContent = msg;
    el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    return msg;
  };

  Object.keys(rules).forEach((name) => {
    const el = form.elements[name];
    const evt = el.tagName === 'SELECT' || el.type === 'checkbox' ? 'change' : 'blur';
    el.addEventListener(evt, () => { if (el.value || el.type === 'checkbox' || el.tagName === 'SELECT') check(el); });
    el.addEventListener('input', () => { if (el.getAttribute('aria-invalid') === 'true') check(el); });
  });

  // Date of birth can't be in the future
  form.elements.dob.max = today.toISOString().slice(0, 10);

  /* ---------- Batch preview: "Prodigy I · Lela Maharaja" ---------- */
  const preview = document.getElementById('batch-preview');
  const updatePreview = () => {
    const b = form.elements.batch.value, c = form.elements.batchCycle.value;
    const h = form.elements.house;
    if (!b || !c) { preview.hidden = true; return; }
    preview.querySelector('strong').textContent = `${b} ${ROMAN[+c]}` + (h.value ? ` · ${h.options[h.selectedIndex].text}` : '');
    preview.hidden = false;
  };
  ['batch', 'batchCycle', 'house'].forEach((n) => form.elements[n].addEventListener('change', updatePreview));

  /* ---------- Outside Malaysia ↔ country ---------- */
  const cityField = document.getElementById('city-field');
  const city = form.elements.city;
  form.elements.state.addEventListener('change', (e) => {
    const abroad = e.target.value === 'Outside Malaysia';
    cityField.hidden = !abroad;
    city.disabled = !abroad;
    city.required = abroad;
    if (!abroad) { city.removeAttribute('aria-invalid'); document.getElementById('city-err').textContent = ''; }

    const country = form.elements.country;
    if (abroad && country.value.trim().toLowerCase() === 'malaysia') {
      country.value = ''; country.focus();
    } else if (e.target.value && e.target.value !== 'Outside Malaysia' && !country.value.trim()) {
      country.value = 'Malaysia'; check(country);
    }
  });

  /* ---------- Submit ---------- */
  const showSummary = (names) => {
    const list = summary.querySelector('ul');
    list.innerHTML = '';
    names.forEach((name) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#' + name;
      a.textContent = `${labelFor(name)}: ${document.getElementById(name + '-err').textContent}`;
      a.addEventListener('click', (e) => { e.preventDefault(); form.elements[name].focus(); form.elements[name].scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' }); });
      li.appendChild(a);
      list.appendChild(li);
    });
    summary.querySelector('.error-count').textContent = names.length === 1 ? '1' : String(names.length);
    summary.querySelector('h2').firstChild.textContent = 'Please check ';
    summary.querySelector('h2').lastChild.textContent = names.length === 1 ? ' detail' : ' details';
    summary.hidden = false;
    summary.focus();
    summary.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  // Placeholder: replace with a real request, e.g.
  // return fetch('https://formspree.io/f/XXXX', { method: 'POST', body: data, headers: { Accept: 'application/json' } });
  const submitRegistration = (data) => new Promise((resolve) => setTimeout(() => resolve(data), 900));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const invalid = Object.keys(rules).filter((name) => check(form.elements[name]));
    if (invalid.length) { showSummary(invalid); return; }
    summary.hidden = true;

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true; btn.setAttribute('aria-busy', 'true'); btn.textContent = 'Submitting…';
    try {
      await submitRegistration(new FormData(form));
      success.querySelector('.reg-success-name').textContent = form.elements.fullName.value.trim().split(/\s+/)[0];
      form.hidden = true;
      document.querySelector('.reg-steps')?.setAttribute('hidden', '');
      success.hidden = false;
      success.focus();
      window.scrollTo({ top: success.getBoundingClientRect().top + window.scrollY - 120, behavior: reduceMotion ? 'auto' : 'smooth' });
    } catch {
      btn.disabled = false; btn.removeAttribute('aria-busy'); btn.textContent = 'Submit registration';
      summary.querySelector('ul').innerHTML = '<li>We could not send your registration. Please check your connection and try again.</li>';
      summary.hidden = false; summary.focus();
    }
  });

  /* ---------- Highlight current section in the aside ---------- */
  const stepLinks = [...document.querySelectorAll('.reg-steps a')];
  if (stepLinks.length && 'IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        stepLinks.forEach((a) => {
          if (a.getAttribute('href') === '#' + entry.target.id) a.setAttribute('aria-current', 'step');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    form.querySelectorAll('.reg-group').forEach((g) => obs.observe(g));
  }
})();
