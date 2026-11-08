/* Progressive enhancements. The resume and all links work without JavaScript. */
(() => {
  'use strict';

  const root = document.documentElement;
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
  const filterButtons = [...document.querySelectorAll('[data-filter]')];
  const projectCards = [...document.querySelectorAll('[data-category]')];
  const projectsGrid = document.getElementById('projects-grid');
  const projectCount = document.getElementById('project-count');
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');
  const siteUrl = 'https://amirebadifar.ir/';
  const persianNumber = new Intl.NumberFormat('fa-IR', { useGrouping: false });
  let toastTimer;
  let printSnapshot = null;
  let scrollScheduled = false;

  function readSavedTheme() {
    try {
      const value = localStorage.getItem('ae-theme');
      return value === 'light' || value === 'dark' ? value : null;
    } catch (_) {
      return null;
    }
  }

  function applyTheme(theme, persist = false) {
    const isDark = theme === 'dark';
    root.dataset.theme = isDark ? 'dark' : 'light';
    themeButton.setAttribute('aria-pressed', String(isDark));
    themeButton.title = isDark ? 'تغییر به حالت روشن' : 'تغییر به حالت تاریک';
    themeColor.content = isDark ? '#101c22' : '#f7f9f8';
    if (persist) {
      try { localStorage.setItem('ae-theme', root.dataset.theme); } catch (_) {}
    }
  }

  applyTheme(readSavedTheme() || (darkPreference.matches ? 'dark' : 'light'));
  themeButton.addEventListener('click', () => {
    applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', true);
  });
  darkPreference.addEventListener('change', event => {
    if (!readSavedTheme()) applyTheme(event.matches ? 'dark' : 'light');
  });
  window.addEventListener('storage', event => {
    if (event.key === 'ae-theme' || event.key === null) {
      applyTheme(readSavedTheme() || (darkPreference.matches ? 'dark' : 'light'));
    }
  });

  function setMenu(open, returnFocus = false) {
    header.classList.toggle('nav-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'بستن منو' : 'باز کردن منو');
    if (returnFocus) menuButton.focus();
  }

  menuButton.addEventListener('click', () => {
    setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
  });
  navigationLinks.forEach(link => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('click', event => {
    if (!header.contains(event.target)) setMenu(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      setMenu(false, true);
    }
  });
  header.addEventListener('focusout', () => {
    requestAnimationFrame(() => {
      if (!header.contains(document.activeElement)) setMenu(false);
    });
  });
  desktopNavigation.addEventListener('change', () => setMenu(false));

  const spySections = navigationLinks
    .map(link => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  function updateScrollState() {
    scrollScheduled = false;
    const scrollTop = Math.max(0, window.scrollY);
    const scrollRange = document.documentElement.scrollHeight - window.innerHeight;
    const fraction = scrollRange > 0 ? Math.min(1, scrollTop / scrollRange) : 0;
    progressBar.style.transform = `scaleX(${fraction})`;
    header.classList.toggle('is-scrolled', scrollTop > 12);
    let currentSection = null;
    const threshold = header.offsetHeight + 150;
    spySections.forEach(section => {
      if (section.getBoundingClientRect().top <= threshold) currentSection = section;
    });
    if (scrollRange > 0 && scrollTop >= scrollRange - 8) currentSection = spySections[spySections.length - 1];
    navigationLinks.forEach(link => {
      if (currentSection && link.getAttribute('href') === `#${currentSection.id}`) {
        link.setAttribute('aria-current', 'location');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  function scheduleScrollUpdate() {
    if (!scrollScheduled) {
      scrollScheduled = true;
      requestAnimationFrame(updateScrollState);
    }
  }

  window.addEventListener('scroll', scheduleScrollUpdate, { passive: true });
  window.addEventListener('resize', scheduleScrollUpdate, { passive: true });
  window.addEventListener('load', scheduleScrollUpdate, { once: true });
  updateScrollState();

  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      const filter = button.dataset.filter;
      let visibleCount = 0;
      filterButtons.forEach(item => {
        const selected = item === button;
        item.classList.toggle('is-active', selected);
        item.setAttribute('aria-pressed', String(selected));
      });
      projectCards.forEach(card => {
        const visible = filter === 'all' || card.dataset.category === filter;
        card.hidden = !visible;
        if (visible) {
          visibleCount += 1;
          card.classList.add('is-revealed');
        }
      });
      projectsGrid.classList.toggle('is-filtered', filter !== 'all');
      projectCount.textContent = `${persianNumber.format(visibleCount)} پروژه معرفی‌شده`;
      scheduleScrollUpdate();
    });
  });

  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.06, rootMargin: '0px 0px -24px 0px' });
    document.querySelectorAll('[data-reveal]').forEach(element => {
      if (element.getBoundingClientRect().top < window.innerHeight - 24) {
        element.classList.add('is-revealed');
      } else {
        element.classList.add('will-reveal');
        revealObserver.observe(element);
      }
    });
    reducedMotion.addEventListener('change', event => {
      if (event.matches) {
        revealObserver.disconnect();
        document.querySelectorAll('.will-reveal').forEach(element => element.classList.add('is-revealed'));
      }
    });
  }

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
    field.setAttribute('aria-label', 'پیوند سایت برای کپی');
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

  document.querySelectorAll('.copy-trigger').forEach(button => {
    let resetTimer;
    button.addEventListener('click', async () => {
      let copied = false;
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(siteUrl);
          copied = true;
        }
      } catch (_) {}
      if (!copied) copied = legacyCopy(siteUrl);
      if (copied) {
        showToast('پیوند سایت کپی شد؛ برای اشتراک‌گذاری آماده است.');
        const label = button.querySelector('span');
        const icon = button.querySelector('use');
        clearTimeout(resetTimer);
        label.textContent = 'کپی شد!';
        icon.setAttribute('href', '#i-check');
        resetTimer = setTimeout(() => {
          label.textContent = 'کپی پیوند سایت';
          icon.setAttribute('href', '#i-copy');
        }, 2500);
      } else {
        showToast('کپی خودکار ممکن نیست. نشانی سایت: amirebadifar.ir');
      }
    });
  });

  function preparePrint() {
    if (printSnapshot) return;
    printSnapshot = projectCards.map(card => card.hidden);
    projectCards.forEach(card => {
      card.hidden = false;
      card.classList.add('is-revealed');
    });
    document.querySelectorAll('.will-reveal').forEach(element => element.classList.add('is-revealed'));
  }

  function restoreAfterPrint() {
    if (!printSnapshot) return;
    projectCards.forEach((card, index) => { card.hidden = printSnapshot[index]; });
    printSnapshot = null;
    scheduleScrollUpdate();
  }

  window.addEventListener('beforeprint', preparePrint);
  window.addEventListener('afterprint', restoreAfterPrint);
  document.querySelectorAll('.print-trigger').forEach(button => {
    button.addEventListener('click', () => {
      preparePrint();
      try { window.print(); } finally { restoreAfterPrint(); }
    });
  });

  const contactDataEl = document.getElementById('contact-data');
  const form = document.getElementById('project-form');
  if (contactDataEl && form) {
    const contactData = JSON.parse(contactDataEl.textContent);
    const messages = contactData.messages;
    form.noValidate = true;
    const name = form.elements.namedItem('name');
    const email = form.elements.namedItem('email');
    const type = form.elements.namedItem('type');
    const message = form.elements.namedItem('message');
    const status = document.getElementById('form-status');

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

    [name, email, message].forEach(field => field.addEventListener('input', () => { setError(field, ''); status.textContent = ''; }));

    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!validate()) return;
      const subject = encodeURIComponent(`${messages.mailSubject} — ${name.value.trim()}`);
      const body = encodeURIComponent(requestText());
      status.textContent = messages.prepared;
      window.location.href = `mailto:${contactData.email}?subject=${subject}&body=${body}`;
    });

    form.querySelector('.copy-request').addEventListener('click', async () => {
      if (!validate()) return;
      const text = `${messages.mailSubject}\n\n${requestText()}`;
      let copied = false;
      try {
        if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); copied = true; }
      } catch (_) {}
      if (!copied) copied = legacyCopy(text);
      showToast(copied ? messages.copied : messages.copyFailed);
      if (copied) status.textContent = messages.copied;
    });
  }

  document.getElementById('copyright-year').textContent = persianNumber.format(new Date().getFullYear());
})();
