(() => {
  document.documentElement.classList.add('js');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Year ---------- */
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Sticky header shadow ---------- */
  const header = document.querySelector('.site-header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.getElementById('nav-menu');
  const setMenu = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.classList.toggle('is-open', open);
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
  });

  /* ---------- Active nav link on scroll ---------- */
  const links = [...document.querySelectorAll('.nav-menu a[href^="#"]')];
  const sections = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  const isSubpage = !!document.querySelector('.nav-menu a[aria-current="page"]');
  if (!isSubpage && 'IntersectionObserver' in window) {
    const navObs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((a) => {
          if (a.getAttribute('href') === '#' + entry.target.id) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => navObs.observe(s));
  }

  /* ---------- Programs tabs (placeholder content — edit freely) ---------- */
  const programs = [
    { title: 'Mentorship Program', desc: 'Alumni volunteers guide Form 4 and Form 5 students on SPM preparation, university applications and career choices.', pos: '50% 60%' },
    { title: 'Scholarship Fund', desc: 'Need-based and merit awards that help deserving Semesrans continue to pre-university and degree studies.', pos: '25% 70%' },
    { title: 'Career Network', desc: 'Internship placements, job referrals and industry talks from Semesrans working across sectors.', pos: '80% 50%' },
    { title: 'Homecoming & Reunions', desc: 'Our signature yearly gathering back on campus, plus batch reunions organised with OSEM support.', pos: '40% 35%' },
    { title: 'Sports & Recreation', desc: 'Alumni futsal, badminton and fun runs that keep the house spirit and friendly rivalry alive.', pos: '15% 85%' },
    { title: 'Community Service', desc: 'Volunteering drives in Rembau and beyond, from flood relief to tuition for rural schools.', pos: '90% 80%' },
  ];
  const tabs = [...document.querySelectorAll('.program-list [role="tab"]')];
  const panel = document.getElementById('program-panel');
  if (panel) {
  const pImg = panel.querySelector('.program-img img');
  const pTitle = panel.querySelector('.program-title');
  const pDesc = panel.querySelector('.program-desc');
  let switchTimer;

  const selectTab = (i, focus = false) => {
    tabs.forEach((t, j) => {
      const on = i === j;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    if (focus) tabs[i].focus();
    panel.setAttribute('aria-labelledby', tabs[i].id);
    const apply = () => {
      pTitle.textContent = programs[i].title;
      pDesc.textContent = programs[i].desc;
      pImg.style.objectPosition = programs[i].pos;
      panel.classList.remove('is-switching');
    };
    clearTimeout(switchTimer);
    if (reduceMotion) { apply(); return; }
    panel.classList.add('is-switching');
    switchTimer = setTimeout(apply, 180);
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => selectTab(i));
    tab.addEventListener('keydown', (e) => {
      const keys = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
      if (e.key in keys) { e.preventDefault(); selectTab((i + keys[e.key] + tabs.length) % tabs.length, true); }
      else if (e.key === 'Home') { e.preventDefault(); selectTab(0, true); }
      else if (e.key === 'End') { e.preventDefault(); selectTab(tabs.length - 1, true); }
    });
  });
  }

  /* ---------- Reveal on scroll ---------- */
  const reveals = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach((el) => el.classList.add('is-visible'));
  } else {
    const revObs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const siblings = [...entry.target.parentElement.children].filter((c) => c.classList.contains('reveal'));
        entry.target.style.transitionDelay = Math.max(0, siblings.indexOf(entry.target)) * 60 + 'ms';
        entry.target.classList.add('is-visible');
        revObs.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach((el) => revObs.observe(el));
  }

  /* ---------- Count-up stats ---------- */
  const stats = document.querySelectorAll('[data-count]');
  const fmt = new Intl.NumberFormat('en-MY');
  const render = (el, n) => { el.textContent = (el.dataset.prefix || '') + fmt.format(n) + (el.dataset.suffix || ''); };
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const statObs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target; const target = +el.dataset.count; const start = performance.now(); const dur = 1200;
        const tick = (now) => {
          const p = Math.min(1, (now - start) / dur);
          render(el, Math.round(target * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        statObs.unobserve(el);
      });
    }, { threshold: 0.6 });
    stats.forEach((el) => statObs.observe(el));
  }

  /* ---------- Contact form validation ---------- */
  const form = document.querySelector('.contact-form');
  if (!form) return;
  const status = form.querySelector('.form-status');
  const rules = {
    name: (v) => v.trim() ? '' : 'Please enter your name.',
    email: (v) => !v.trim() ? 'Please enter your email address.' : (/^\S+@\S+\.\S+$/.test(v) ? '' : 'Enter an email like name@example.com.'),
    message: (v) => v.trim().length >= 10 ? '' : 'Please write a message of at least 10 characters.',
  };
  const check = (field) => {
    const msg = rules[field.name](field.value);
    const err = document.getElementById(field.name + '-err');
    err.textContent = msg;
    field.setAttribute('aria-invalid', msg ? 'true' : 'false');
    return !msg;
  };
  Object.keys(rules).forEach((name) => {
    const f = form.elements[name];
    f.addEventListener('blur', () => { if (f.value) check(f); });
    f.addEventListener('input', () => { if (f.getAttribute('aria-invalid') === 'true') check(f); });
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    status.textContent = '';
    const fields = Object.keys(rules).map((n) => form.elements[n]);
    const invalid = fields.filter((f) => !check(f));
    if (invalid.length) { invalid[0].focus(); return; }

    // Placeholder submit — connect to Formspree, Google Forms or your backend here.
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true; btn.setAttribute('aria-busy', 'true'); btn.textContent = 'Sending…';
    setTimeout(() => {
      btn.disabled = false; btn.removeAttribute('aria-busy'); btn.textContent = 'Send message';
      form.reset();
      fields.forEach((f) => f.removeAttribute('aria-invalid'));
      status.textContent = 'Thank you! Your message has been received. We will be in touch soon.';
    }, 900);
  });
})();
