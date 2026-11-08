/* Progressive enhancements. Content, links and native mailto form work without JavaScript. */
(() => {
  'use strict';

  const root = document.documentElement;
  const siteData = JSON.parse(document.getElementById('site-data').textContent);
  const lang = siteData.lang;
  const fa = lang === 'fa';
  const messages = siteData.messages;
  const header = document.getElementById('site-header');
  const themeButton = document.getElementById('theme-toggle');
  const themeColor = document.querySelector('meta[name="theme-color"]');
  const darkPreference = window.matchMedia('(prefers-color-scheme: dark)');
  const desktopNavigation = window.matchMedia('(min-width: 901px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const menuButton = document.getElementById('menu-toggle');
  const navigation = document.getElementById('primary-nav');
  const navigationLinks = [...navigation.querySelectorAll('a[href^="#"]')];
  const progressBar = document.getElementById('reading-progress');
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');
  const numberFormat = new Intl.NumberFormat(fa ? 'fa-IR' : 'en', { useGrouping: false });
  let toastTimer;
  let scrollScheduled = false;

  function readSavedTheme() {
    try {
      const value = localStorage.getItem('ae-theme');
      return value === 'light' || value === 'dark' ? value : null;
    } catch (_) { return null; }
  }

  function applyTheme(theme, persist = false) {
    const isDark = theme === 'dark';
    root.dataset.theme = isDark ? 'dark' : 'light';
    themeButton.setAttribute('aria-pressed', String(isDark));
    themeButton.title = isDark ? (fa ? 'تغییر به حالت روشن' : 'Switch to light theme') : (fa ? 'تغییر به حالت تاریک' : 'Switch to dark theme');
    themeColor.content = isDark ? '#101915' : '#f6f7f3';
    if (persist) { try { localStorage.setItem('ae-theme', root.dataset.theme); } catch (_) {} }
  }

  applyTheme(readSavedTheme() || (darkPreference.matches ? 'dark' : 'light'));
  themeButton.addEventListener('click', () => applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', true));
  darkPreference.addEventListener('change', event => { if (!readSavedTheme()) applyTheme(event.matches ? 'dark' : 'light'); });
  window.addEventListener('storage', event => {
    if (event.key === 'ae-theme' || event.key === null) applyTheme(readSavedTheme() || (darkPreference.matches ? 'dark' : 'light'));
  });

  function setMenu(open, returnFocus = false) {
    header.classList.toggle('nav-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? (fa ? 'بستن منو' : 'Close menu') : (fa ? 'باز کردن منو' : 'Open menu'));
    if (returnFocus) menuButton.focus();
  }

  menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  navigationLinks.forEach(link => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('click', event => { if (!header.contains(event.target)) setMenu(false); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') setMenu(false, true);
  });
  header.addEventListener('focusout', () => requestAnimationFrame(() => { if (!header.contains(document.activeElement)) setMenu(false); }));
  desktopNavigation.addEventListener('change', () => setMenu(false));

  const spySections = navigationLinks.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  function updateScrollState() {
    scrollScheduled = false;
    const scrollTop = Math.max(0, window.scrollY);
    const scrollRange = document.documentElement.scrollHeight - window.innerHeight;
    const fraction = scrollRange > 0 ? Math.min(1, scrollTop / scrollRange) : 0;
    progressBar.style.transform = `scaleX(${fraction})`;
    header.classList.toggle('is-scrolled', scrollTop > 12);
    let currentSection = null;
    const threshold = header.offsetHeight + 150;
    spySections.forEach(section => { if (section.getBoundingClientRect().top <= threshold) currentSection = section; });
    if (scrollRange > 0 && scrollTop >= scrollRange - 8) currentSection = spySections[spySections.length - 1];
    navigationLinks.forEach(link => {
      if (currentSection && link.getAttribute('href') === `#${currentSection.id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  function scheduleScrollUpdate() {
    if (!scrollScheduled) { scrollScheduled = true; requestAnimationFrame(updateScrollState); }
  }
  window.addEventListener('scroll', scheduleScrollUpdate, { passive: true });
  window.addEventListener('resize', scheduleScrollUpdate, { passive: true });
  window.addEventListener('load', scheduleScrollUpdate, { once: true });
  updateScrollState();

  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('is-revealed'); revealObserver.unobserve(entry.target); }
      });
    }, { threshold: 0.06, rootMargin: '0px 0px -24px 0px' });
    document.querySelectorAll('[data-reveal]').forEach(element => {
      if (element.getBoundingClientRect().top < window.innerHeight - 24) element.classList.add('is-revealed');
      else { element.classList.add('will-reveal'); revealObserver.observe(element); }
    });
    reducedMotion.addEventListener('change', event => {
      if (event.matches) { revealObserver.disconnect(); document.querySelectorAll('.will-reveal').forEach(el => el.classList.add('is-revealed')); }
    });
  }

  document.querySelectorAll('[data-project-image]').forEach(img => {
    const markFailed = () => img.closest('.real-media')?.classList.add('image-failed');
    img.addEventListener('error', markFailed);
    if (img.complete && img.naturalWidth === 0) markFailed();
  });

  function showToast(message) {
    clearTimeout(toastTimer);
    toastMessage.textContent = message;
    toast.classList.add('is-visible');
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 5000);
  }

  function legacyCopy(text) {
    const previouslyFocused = document.activeElement;
    const field = document.createElement('textarea');
    field.value = text;
    field.readOnly = true;
    field.setAttribute('aria-label', fa ? 'متن درخواست برای کپی' : 'Request text to copy');
    field.style.cssText = 'position:fixed;top:0;left:-9999px;opacity:0;font-size:16px;';
    document.body.appendChild(field);
    field.select();
    field.setSelectionRange(0, text.length);
    let copied = false;
    try { copied = document.execCommand('copy'); } catch (_) {}
    field.remove();
    if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus({ preventScroll: true });
    return copied;
  }

  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return true; }
    } catch (_) {}
    return legacyCopy(text);
  }

  const form = document.getElementById('project-form');
  if (form) {
    form.noValidate = true;
    const name = form.elements.namedItem('name');
    const email = form.elements.namedItem('email');
    const type = form.elements.namedItem('type');
    const message = form.elements.namedItem('message');
    const status = document.getElementById('form-status');
    const fields = [name, email, message];

    function setError(field, text) {
      const error = document.getElementById(field.getAttribute('aria-describedby'));
      field.setAttribute('aria-invalid', text ? 'true' : 'false');
      error.textContent = text;
    }

    function validate() {
      let firstInvalid = null;
      const checks = [
        [name, name.value.trim() ? '' : messages.required],
        [email, !email.value.trim() ? messages.required : (email.validity.typeMismatch || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()) ? messages.invalidEmail : '')],
        [message, !message.value.trim() ? messages.required : (message.value.trim().length < 20 ? messages.shortMessage : '')]
      ];
      checks.forEach(([field, error]) => { setError(field, error); if (error && !firstInvalid) firstInvalid = field; });
      if (firstInvalid) { firstInvalid.focus(); status.textContent = ''; return false; }
      return true;
    }

    function requestText() {
      return `${messages.mailName}: ${name.value.trim()}\n${messages.mailEmail}: ${email.value.trim()}\n${messages.mailType}: ${type.value}\n\n${messages.mailMessage}:\n${message.value.trim()}`;
    }

    fields.forEach(field => field.addEventListener('input', () => { setError(field, ''); status.textContent = ''; }));

    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!validate()) return;
      const subject = encodeURIComponent(`${messages.mailSubject} — ${name.value.trim()}`);
      const body = encodeURIComponent(requestText());
      status.textContent = messages.prepared;
      window.location.href = `mailto:${siteData.email}?subject=${subject}&body=${body}`;
    });

    form.querySelector('.copy-request').addEventListener('click', async () => {
      if (!validate()) return;
      const copied = await copyText(`${messages.mailSubject}\n\n${requestText()}`);
      showToast(copied ? messages.copied : messages.copyFailed);
      if (copied) status.textContent = messages.copied;
    });
  }

  function preparePrint() { document.querySelectorAll('.will-reveal').forEach(element => element.classList.add('is-revealed')); }
  window.addEventListener('beforeprint', preparePrint);
  document.querySelectorAll('.print-trigger').forEach(button => button.addEventListener('click', () => { preparePrint(); window.print(); }));

  const year = document.getElementById('copyright-year');
  if (year) year.textContent = numberFormat.format(new Date().getFullYear());
})();
