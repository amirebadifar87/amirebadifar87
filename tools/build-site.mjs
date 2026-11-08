#!/usr/bin/env node
/**
 * Static site builder. No runtime framework, CDN, tracking, or backend.
 * Edit content/portfolio.json, then run: node tools/build-site.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'content/portfolio.json'), 'utf8'));
const { person, locales, projects } = data;
const base = data.siteUrl.replace(/\/$/, '');
const write = (file, content) => {
  const target = path.join(root, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content.trimStart() + '\n');
};
const e = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const json = value => JSON.stringify(value, null, 2).replace(/</g, '\\u003c');
const icon = (name, cls = '') => `<svg class="icon ${cls}" aria-hidden="true" focusable="false"><use href="#i-${name}"></use></svg>`;
const tags = items => `<ul class="tag-list" aria-label="${e(items.join(', '))}">${items.map(item => `<li>${e(item)}</li>`).join('')}</ul>`;
const homePath = lang => locales[lang].path;
const projectPath = (lang, slug) => `${homePath(lang)}projects/${slug}/`;
const absolute = p => `${base}${p}`;
const sectionHead = (s, number, id) => `<div class="section-head" data-reveal><p class="eyebrow"><span>${e(s.eyebrow)}</span><span class="section-number" aria-hidden="true">${number}</span></p><h2 id="${id}">${e(s.heading)}</h2>${s.intro ? `<p class="section-intro">${e(s.intro)}</p>` : ''}</div>`;

function symbols() {
  return `<svg class="svg-symbols" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <symbol id="i-logo" viewBox="0 0 24 24"><path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/></symbol>
  <symbol id="i-arrow" viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6"/></symbol>
  <symbol id="i-external" viewBox="0 0 24 24"><path d="M14 4h6v6M20 4 10 14M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/></symbol>
  <symbol id="i-mail" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></symbol>
  <symbol id="i-phone" viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a12 12 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/></symbol>
  <symbol id="i-github" viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02A9.56 9.56 0 0 1 12 6.8c.85 0 1.71.11 2.51.34 1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"/></symbol>
  <symbol id="i-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/></symbol>
  <symbol id="i-moon" viewBox="0 0 24 24"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z"/></symbol>
  <symbol id="i-menu" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></symbol>
  <symbol id="i-close" viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></symbol>
  <symbol id="i-download" viewBox="0 0 24 24"><path d="M12 3v12m-5-5 5 5 5-5M4 17v3h16v-3"/></symbol>
  <symbol id="i-print" viewBox="0 0 24 24"><path d="M7 8V3h10v5M7 17H4V9h16v8h-3M7 14h10v7H7z"/></symbol>
  <symbol id="i-copy" viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4H4v12h4"/></symbol>
  <symbol id="i-check" viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></symbol>
  <symbol id="i-layout" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 9v11"/></symbol>
  <symbol id="i-code" viewBox="0 0 24 24"><path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/></symbol>
  <symbol id="i-dashboard" viewBox="0 0 24 24"><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="5" rx="1"/><rect x="13" y="10" width="8" height="11" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/></symbol>
  <symbol id="i-database" viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/></symbol>
  <symbol id="i-link" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5"/></symbol>
  <symbol id="i-spark" viewBox="0 0 24 24"><path d="m12 3 2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2L12 3Z"/></symbol>
  <symbol id="i-server" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01M11 7.5h6M11 16.5h6"/></symbol>
  <symbol id="i-heart" viewBox="0 0 24 24"><path d="M12 20s-8-4.8-8-10a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.2-8 10-8 10Z"/></symbol>
  <symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></symbol>
</svg>`;
}

function header(lang, current = 'home') {
  const l = locales[lang];
  const prefix = current === 'home' ? '' : homePath(lang);
  const otherLang = l.other;
  const otherHref = current === 'home' ? homePath(otherLang) : projectPath(otherLang, current);
  const nav = l.nav.map(([href, label]) => `<a href="${e(prefix + href)}">${e(label)}</a>`).join('');
  return `<a class="skip-link" href="#main">${e(l.skip)}</a>
<header class="site-header" id="site-header">
  <div class="reading-progress" id="reading-progress" aria-hidden="true"></div>
  <div class="container header-inner">
    <a class="brand" href="${e(homePath(lang))}" aria-label="${e(person.name[lang])}"><span class="brand-mark" aria-hidden="true">${icon('logo')}</span><span class="brand-name">${e(person.name[lang])}</span></a>
    <nav class="primary-nav" id="primary-nav" aria-label="${lang === 'fa' ? 'ناوبری اصلی' : 'Primary navigation'}">${nav}</nav>
    <div class="header-actions">
      <a class="language-link" href="${e(otherHref)}" hreflang="${otherLang}" lang="${otherLang}" aria-label="${e(l.languageLabel + ' — ' + l.language)}">${e(l.languageLabel)}</a>
      <button class="icon-button theme-toggle" id="theme-toggle" type="button" aria-pressed="false" aria-label="${e(l.theme)}">${icon('sun', 'theme-sun')}${icon('moon', 'theme-moon')}</button>
      <button class="icon-button menu-toggle" id="menu-toggle" type="button" aria-expanded="false" aria-controls="primary-nav" aria-label="${e(l.menu)}">${icon('menu', 'menu-open')}${icon('close', 'menu-close')}</button>
    </div>
  </div>
</header>`;
}

function footer(lang) {
  const l = locales[lang];
  return `<footer class="site-footer"><div class="container footer-inner">
  <div><a class="brand footer-brand" href="${e(homePath(lang))}"><span class="brand-mark" aria-hidden="true">${icon('logo')}</span><span>${e(person.name[lang])}</span></a><p>${e(l.footer)}</p></div>
  <div class="footer-links"><a href="mailto:${e(person.email)}">${e(person.email)}</a><a href="${e(person.github)}" rel="me noopener" target="_blank">GitHub ${icon('external')}</a><a href="#top" class="back-top">${e(l.top)} ${icon('arrow')}</a></div>
  <p class="copyright">© <span id="copyright-year">2026</span> ${e(person.name[lang])}</p>
</div></footer>
<div class="toast" id="toast" role="status" aria-live="polite"><span id="toast-message"></span></div>`;
}

function head({ lang, title, description, canonical, ogType = 'website', pagePath, projectSlug = null, social = 'social-card.png' }) {
  const l = locales[lang];
  const other = l.other;
  const faUrl = projectSlug ? absolute(projectPath('fa', projectSlug)) : absolute(homePath('fa'));
  const enUrl = projectSlug ? absolute(projectPath('en', projectSlug)) : absolute(homePath('en'));
  const ogLocale = lang === 'fa' ? 'fa_IR' : 'en_US';
  const ogAlternate = lang === 'fa' ? 'en_US' : 'fa_IR';
  return `<!DOCTYPE html>
<html lang="${l.lang}" dir="${l.dir}" id="top">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#f6f7f3">
<title>${e(title)}</title>
<meta name="description" content="${e(description)}">
<meta name="author" content="${e(person.name[lang])}">
<meta name="robots" content="${pagePath === '/404.html' ? 'noindex, follow' : 'index, follow, max-image-preview:large'}">
<link rel="canonical" href="${e(canonical)}">
<link rel="alternate" hreflang="fa" href="${e(faUrl)}">
<link rel="alternate" hreflang="en" href="${e(enUrl)}">
<link rel="alternate" hreflang="x-default" href="${e(faUrl)}">
<meta property="og:type" content="${ogType}">
<meta property="og:locale" content="${ogLocale}">
<meta property="og:locale:alternate" content="${ogAlternate}">
<meta property="og:site_name" content="${e(person.name[lang])}">
<meta property="og:title" content="${e(title)}">
<meta property="og:description" content="${e(description)}">
<meta property="og:url" content="${e(canonical)}">
<meta property="og:image" content="${e(absolute('/assets/images/' + social))}">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${e(title)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${e(title)}"><meta name="twitter:description" content="${e(description)}">
<meta name="twitter:image" content="${e(absolute('/assets/images/' + social))}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/assets/images/icon-192.png" type="image/png" sizes="192x192">
<link rel="apple-touch-icon" href="/assets/images/apple-touch-icon.png">
<link rel="manifest" href="${lang === 'fa' ? '/site.webmanifest' : '/en/site.webmanifest'}">
<link rel="preload" href="/assets/fonts/${lang === 'fa' ? 'vazirmatn-arabic' : 'space-grotesk-latin'}.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/styles.css">
<script>
(() => { let t='light'; try { const s=localStorage.getItem('ae-theme'); t=s==='dark'||s==='light'?s:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'); } catch (_) { try { t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'; } catch (_) {} } document.documentElement.dataset.theme=t; document.querySelector('meta[name="theme-color"]').content=t==='dark'?'#101915':'#f6f7f3'; })();
</script>
${pagePath === '/404.html' ? '' : `<script type="application/ld+json">${json(structuredData(lang, pagePath, projectSlug, title, description))}</script>`}
<script type="application/json" id="site-data">${json({ lang, messages: l.contact, email: person.email, siteUrl: base + '/' })}</script>
<script src="/assets/main.js" defer></script>
<noscript><style>.theme-toggle,.menu-toggle,.print-trigger,.copy-request{display:none!important}.primary-nav{display:flex!important;position:static!important;flex-wrap:wrap}.reading-progress{display:none}[data-reveal]{opacity:1!important;transform:none!important}</style></noscript>
</head>
<body>
${symbols()}
${header(lang, projectSlug || 'home')}`;
}

function structuredData(lang, pagePath, slug, title, description) {
  const l = locales[lang];
  const personNode = {
    '@type': 'Person', '@id': `${base}/#person`, name: person.name[lang], alternateName: [person.name.fa, person.name.en, 'Amir Ebadifar'],
    url: absolute(homePath(lang)), jobTitle: lang === 'fa' ? 'Full-Stack Developer with a strong focus on .NET Backend Development' : 'Full-Stack Developer with a strong focus on .NET Backend Development',
    email: person.email, telephone: person.phoneHref, sameAs: [person.github],
    knowsAbout: ['C#', 'ASP.NET Core', 'Entity Framework Core', 'REST API', 'Software Architecture', 'SQL Server', 'Redis', 'MongoDB', 'Meilisearch', 'Blazor', 'ML.NET', 'Semantic Kernel', 'Docker', 'Linux', 'Git', 'NestJS']
  };
  const website = { '@type': 'WebSite', '@id': `${base}/#website`, url: absolute(homePath(lang)), name: person.name[lang], inLanguage: l.lang, publisher: { '@id': `${base}/#person` } };
  if (!slug) {
    return { '@context': 'https://schema.org', '@graph': [website, personNode, {
      '@type': 'ProfilePage', '@id': absolute(pagePath), url: absolute(pagePath), name: title, description, inLanguage: l.lang,
      isPartOf: { '@id': `${base}/#website` }, mainEntity: { '@id': `${base}/#person` },
      hasPart: projects.map(p => ({ '@id': `${absolute(projectPath(lang, p.slug))}#project` }))
    }, ...projects.map(p => projectNode(lang, p))] };
  }
  const p = projects.find(item => item.slug === slug);
  return { '@context': 'https://schema.org', '@graph': [website, personNode, projectNode(lang, p), {
    '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: l.home, item: absolute(homePath(lang)) },
      { '@type': 'ListItem', position: 2, name: l.projects.eyebrow, item: absolute(homePath(lang)) + '#projects' },
      { '@type': 'ListItem', position: 3, name: p.name[lang], item: absolute(projectPath(lang, slug)) }
    ]
  }] };
}

function projectNode(lang, p) {
  const node = {
    '@type': p.repo ? 'SoftwareSourceCode' : 'CreativeWork', '@id': `${absolute(projectPath(lang, p.slug))}#project`,
    name: p.name[lang], description: p.summary[lang], url: absolute(projectPath(lang, p.slug)), inLanguage: lang === 'fa' ? 'fa-IR' : 'en',
    creator: { '@id': `${base}/#person` }, creativeWorkStatus: p.status === 'unavailable' ? 'Currently unavailable' : p.status === 'live' ? 'Published and in active use' : 'Open source'
  };
  if (p.url) node.sameAs = p.url;
  if (p.repo) { node.codeRepository = p.repo; node.programmingLanguage = p.slug === 'promptbridge' ? 'Python' : 'C#'; node.license = 'https://opensource.org/licenses/MIT'; }
  return node;
}

function statusBadge(lang, p) {
  const l = locales[lang].projects;
  const label = p.status === 'live' ? (lang === 'fa' ? 'فعال و در دسترس' : 'Live and available') : p.status === 'unavailable' ? l.unavailable : l.openSource;
  return `<span class="status-badge status-${p.status}"><span class="status-dot" aria-hidden="true"></span>${e(label)}</span>`;
}

function projectVisual(lang, p, context = 'card') {
  const l = locales[lang].projects;
  if (p.slug === 'mehriz') {
    return `<figure class="project-media real-media ${context === 'hero' ? 'hero-media' : ''}">
      <div class="media-fallback" aria-hidden="true"><span class="fallback-domain">salmandan-mehriz.com</span><span class="fallback-mark">${icon('heart')}</span><span class="fallback-title" lang="fa" dir="rtl">جایی که مهربانی و تخصص کنار هم می‌نشینند</span><span class="fallback-note">${e(lang === 'fa' ? 'تصویر واقعی منتشرشده در سایت؛ در صورت نبود شبکه، متن واقعی سایت نمایش داده می‌شود.' : 'Actual published site image; if the network is unavailable, the site’s real headline is shown.')}</span></div>
      <img src="${e(p.image)}" alt="${e(lang === 'fa' ? 'تصویر واقعی بخش معرفی وب‌سایت خانه سالمندان مهریز' : 'Actual image from the Mehriz care home website introduction')}" width="1200" height="750" loading="${context === 'hero' ? 'eager' : 'lazy'}" decoding="async" ${context === 'hero' ? 'fetchpriority="high"' : ''} referrerpolicy="no-referrer" data-project-image>
      <figcaption>${e(l.realImage)} · <span dir="ltr">salmandan-mehriz.com</span></figcaption>
    </figure>`;
  }
  if (p.slug === 'meetyab') {
    return `<figure class="project-media concept-media"><div class="time-grid" aria-hidden="true">${Array.from({ length: 20 }, (_, i) => `<span class="${[2, 7, 8, 12, 17].includes(i) ? 'is-shared' : ''}"></span>`).join('')}<span class="time-cursor">${icon('clock')}</span></div><figcaption>${e(lang === 'fa' ? 'نمای مفهومی از زمان مشترک؛ اسکرین‌شات محیط پروژه در دسترس نیست.' : 'A conceptual shared-time motif; no product screenshot is currently available.')}</figcaption></figure>`;
  }
  if (p.slug === 'promptbridge') {
    const steps = lang === 'fa' ? ['اسکن پروژه', 'انتخاب فایل', 'ساخت پرامپت', 'گفت‌وگو با AI', 'اعمال + پشتیبان'] : ['Scan project', 'Select files', 'Build prompt', 'AI chat', 'Apply + backup'];
    return `<figure class="project-media doc-media"><ol class="flow-visual">${steps.map((step, i) => `<li><span>${String(i + 1).padStart(2, '0')}</span>${e(step)}</li>`).join('')}</ol><figcaption>${e(lang === 'fa' ? 'جریان واقعی مستندشده در README؛ تصویر رابط کاربری منتشر نشده است.' : 'The actual workflow documented in the README; no UI screenshot is published.')}</figcaption></figure>`;
  }
  return `<figure class="project-media doc-media"><div class="api-visual" dir="ltr"><span class="api-label">Ollaya.Client / README</span><code>POST /api/decide</code><code>POST /v1/systemone</code><span class="api-note">${e(lang === 'fa' ? 'پاسخ ساخت‌یافته و نوع‌دار' : 'Structured, typed answers')}</span></div><figcaption>${e(lang === 'fa' ? 'مسیرهای API مستندشده در README؛ اسکرین‌شات رابط کاربری وجود ندارد.' : 'API paths documented in the README; this is a library, not a UI.')}</figcaption></figure>`;
}

function projectLinks(lang, p, primary = false) {
  const l = locales[lang].projects;
  const detail = `<a class="button ${primary ? 'button-primary' : 'button-secondary'}" href="${e(projectPath(lang, p.slug))}">${e(primary ? l.caseStudy : l.details)} ${icon('arrow')}</a>`;
  const live = p.url && p.status === 'live' ? `<a class="text-link" href="${e(p.url)}" target="_blank" rel="noopener">${e(l.live)} ${icon('external')}</a>` : '';
  const source = p.repo ? `<a class="text-link" href="${e(p.repo)}" target="_blank" rel="noopener">${e(l.source)} ${icon('external')}</a>` : '';
  return `<div class="project-links">${detail}${live}${source}</div>`;
}

function featuredProject(lang, p) {
  const l = locales[lang].projects;
  return `<article class="featured-project" data-reveal>
  <div class="featured-visual">${projectVisual(lang, p, 'featured')}<div class="featured-stamp"><span class="stamp-label">${e(l.featured)}</span><span class="stamp-value">${e(lang === 'fa' ? 'محصول واقعی روی سرور' : 'A real product on a server')}</span></div></div>
  <div class="featured-content"><div class="project-meta">${statusBadge(lang, p)}<span>${e(p.category[lang])}</span></div><h3>${e(p.name[lang])}</h3><p class="project-summary">${e(p.summary[lang])}</p>
  <dl class="project-brief"><div><dt>${e(l.problem)}</dt><dd>${e(p.problem[lang])}</dd></div><div><dt>${e(l.role)}</dt><dd>${e(p.role[lang])}</dd></div></dl>
  <div class="project-features"><h4>${e(l.features)}</h4><ul>${p.features[lang].slice(0, 4).map(item => `<li>${icon('check')}${e(item)}</li>`).join('')}</ul></div>
  ${tags(p.technologies[lang])}<p class="tech-note">${e(p.techNote[lang])}</p>${projectLinks(lang, p, true)}</div>
</article>`;
}

function compactProject(lang, p) {
  const l = locales[lang].projects;
  return `<article class="project-card" data-reveal><div class="card-visual">${projectVisual(lang, p)}</div><div class="card-content"><div class="project-meta">${statusBadge(lang, p)}<span>${e(p.category[lang])}</span></div><h3>${e(p.name[lang])}</h3><p>${e(p.summary[lang])}</p><dl class="compact-role"><dt>${e(l.role)}</dt><dd>${e(p.role[lang])}</dd></dl>${tags(p.technologies[lang])}${projectLinks(lang, p)}</div></article>`;
}

function contactSection(lang) {
  const l = locales[lang]; const c = l.contact;
  return `<section class="section contact-section" id="contact" aria-labelledby="contact-title">${sectionHead(c, '07', 'contact-title')}
  <div class="contact-grid"><div class="contact-details" data-reveal>
    <a class="contact-row" href="mailto:${e(person.email)}"><span class="contact-icon">${icon('mail')}</span><span><span class="contact-label">${e(c.emailLabel)}</span><span class="contact-value" dir="ltr">${e(person.email)}</span></span>${icon('arrow', 'contact-arrow')}</a>
    <a class="contact-row" href="tel:${e(person.phoneHref)}"><span class="contact-icon">${icon('phone')}</span><span><span class="contact-label">${e(c.phoneLabel).replace(/ /g, '&nbsp;')}</span><span class="contact-value" dir="ltr">${e(person.phoneDisplay[lang]).replace(/ /g, '&nbsp;')}</span></span>${icon('arrow', 'contact-arrow')}</a>
    <a class="contact-row" href="${e(person.github)}" target="_blank" rel="me noopener"><span class="contact-icon">${icon('github')}</span><span><span class="contact-label">${e(c.githubLabel)}</span><span class="contact-value" dir="ltr">github.com/amirebadifar87</span></span>${icon('external', 'contact-arrow')}</a>
    <div class="resume-actions"><a class="button button-secondary" href="/assets/resume-${lang}.pdf" download>${icon('download')} ${e(c.pdf)}</a><button class="button button-quiet print-trigger" type="button">${icon('print')} ${e(c.print)}</button></div>
  </div>
  <form class="project-form" id="project-form" action="mailto:${e(person.email)}" method="post" enctype="text/plain" data-reveal>
    <h3>${e(c.formTitle)}</h3><p class="form-note" id="form-note">${e(c.formNote)}</p>
    <div class="form-row"><div class="field"><label for="contact-name">${e(c.name)} <span aria-hidden="true">*</span></label><input id="contact-name" name="name" type="text" autocomplete="name" required maxlength="120" placeholder="${e(c.namePlaceholder)}" aria-describedby="name-error"><span class="field-error" id="name-error"></span></div>
    <div class="field"><label for="contact-email">${e(c.email)} <span aria-hidden="true">*</span></label><input id="contact-email" name="email" type="email" autocomplete="email" required maxlength="254" placeholder="${e(c.emailPlaceholder)}" dir="ltr" aria-describedby="email-error"><span class="field-error" id="email-error"></span></div></div>
    <div class="field"><label for="contact-type">${e(c.type)}</label><select id="contact-type" name="type">${c.types.map(type => `<option>${e(type)}</option>`).join('')}</select></div>
    <div class="field"><label for="contact-message">${e(c.message)} <span aria-hidden="true">*</span></label><textarea id="contact-message" name="message" rows="5" required minlength="20" maxlength="4000" placeholder="${e(c.messagePlaceholder)}" aria-describedby="message-error"></textarea><span class="field-error" id="message-error"></span></div>
    <div class="form-actions"><button class="button button-primary" type="submit">${icon('mail')} ${e(c.submit)}</button><button class="button button-quiet copy-request" type="button">${icon('copy')} ${e(c.copy)}</button></div>
    <p class="form-status" id="form-status" role="status" aria-live="polite"></p>
  </form></div></section>`;
}

function homePage(lang) {
  const l = locales[lang]; const h = l.hero;
  const featured = projects.find(p => p.featured);
  const body = `${head({ lang, title: l.title, description: l.description, canonical: absolute(homePath(lang)), pagePath: homePath(lang), social: lang === 'fa' ? 'social-card.png' : 'social-card-en.png' })}
<main id="main">
<section class="hero" aria-labelledby="hero-title"><div class="container hero-grid"><div class="hero-copy" data-reveal>
  <p class="hero-kicker"><span class="availability-dot" aria-hidden="true"></span>${e(h.kicker)}</p>
  <p class="hero-role" dir="ltr">Full-Stack Developer <span aria-hidden="true">|</span> .NET Specialist</p>
  <h1 id="hero-title">${e(h.heading[0])}<br>${e(h.heading[1])} <span class="accent-text">${e(h.heading[2])}</span></h1>
  <p class="hero-intro">${e(h.intro)}</p><p class="hero-experience">${icon('check')} ${e(person.experience[lang])}</p>
  <div class="hero-actions"><a class="button button-primary" href="#projects">${e(h.primary)} ${icon('arrow')}</a><a class="button button-secondary" href="#contact">${e(h.secondary)}</a><a class="text-link hero-resume" href="/assets/resume-${lang}.pdf" download>${icon('download')} ${e(h.resume)}</a></div>
</div><aside class="hero-product" data-reveal aria-label="${e(h.panelLabel)}"><div class="product-panel-head"><span>${e(h.panelLabel)}</span>${statusBadge(lang, featured)}</div><div class="hero-site-preview" aria-hidden="true"><span class="preview-domain" dir="ltr">salmandan-mehriz.com</span><p class="preview-headline" lang="fa" dir="rtl">جایی که مهربانی و تخصص کنار هم می‌نشینند</p><div class="preview-paths">${(lang === 'fa' ? ['پذیرش', 'داوطلبی', 'کمک مالی'] : ['Admission', 'Volunteer', 'Donate']).map(x => `<span>${e(x)}</span>`).join('')}</div></div><div class="product-panel-body"><h2>${e(h.panelTitle)}</h2><p>${e(h.panelNote)}</p><a class="text-link" href="${e(projectPath(lang, featured.slug))}">${e(h.panelLink)} ${icon('arrow')}</a></div></aside></div></section>

<section class="section about-section" id="about" aria-labelledby="about-title"><div class="container">${sectionHead(l.about, '01', 'about-title')}<div class="about-grid"><div class="about-copy" data-reveal>${l.about.paragraphs.map(p => `<p>${e(p)}</p>`).join('')}</div><dl class="fact-grid" data-reveal>${l.about.facts.map(([value, label]) => `<div><dt>${e(label)}</dt><dd>${e(value)}</dd></div>`).join('')}</dl></div></div></section>

<section class="section services-section" id="services" aria-labelledby="services-title"><div class="container">${sectionHead(l.services, '02', 'services-title')}<div class="services-grid">${l.services.items.map(([ic, title, text, deliverable], i) => `<article class="service-card" data-reveal><div class="service-top"><span class="service-icon">${icon(ic.replace('i-', ''))}</span><span class="service-index" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span></div><h3>${e(title)}</h3><p>${e(text)}</p><p class="service-deliverable">${icon('check')} ${e(deliverable)}</p></article>`).join('')}</div></div></section>

<section class="section skills-section" id="skills" aria-labelledby="skills-title"><div class="container">${sectionHead(l.skills, '03', 'skills-title')}<div class="skills-grid">${l.skills.groups.map(([title, subtitle, items, level]) => `<article class="skill-group ${level === 'core' ? 'is-core' : ''}" data-reveal><div class="skill-head"><h3 dir="ltr">${e(title)}</h3><span class="skill-level">${e(level === 'core' ? l.skills.core : l.skills.support)}</span></div><p>${e(subtitle)}</p>${tags(items)}</article>`).join('')}</div><p class="learning-note" data-reveal><span class="learning-label">${e(l.skills.learning)}</span>${e(l.skills.learningNote)}</p></div></section>

<section class="section projects-section" id="projects" aria-labelledby="projects-title"><div class="container">${sectionHead(l.projects, '04', 'projects-title')}${featuredProject(lang, featured)}<div class="projects-grid">${projects.filter(p => !p.featured).map(p => compactProject(lang, p)).join('')}</div></div></section>

<section class="section experience-section" id="experience" aria-labelledby="experience-title"><div class="container">${sectionHead(l.experience, '05', 'experience-title')}<ol class="experience-list">${l.experience.items.map(([kind, title, text], i) => `<li data-reveal><span class="experience-index" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><div><p class="experience-kind">${e(kind)}</p><h3>${e(title)}</h3><p>${e(text)}</p></div></li>`).join('')}</ol></div></section>

<section class="section process-section" id="process" aria-labelledby="process-title"><div class="container">${sectionHead(l.process, '06', 'process-title')}<ol class="process-grid">${l.process.steps.map(([title, text], i) => `<li data-reveal><span class="process-number" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><h3>${e(title)}</h3><p>${e(text)}</p></li>`).join('')}</ol></div></section>

<div class="container">${contactSection(lang)}</div>
</main>${footer(lang)}
</body></html>`;
  write(lang === 'fa' ? 'index.html' : 'en/index.html', body);
}

function detailPage(lang, p, index) {
  const l = locales[lang]; const pl = l.projects;
  const title = `${p.name[lang]} | ${pl.projectPage} | ${person.name[lang]}`;
  const description = p.summary[lang];
  const next = projects[(index + 1) % projects.length];
  const body = `${head({ lang, title, description, canonical: absolute(projectPath(lang, p.slug)), ogType: 'article', pagePath: projectPath(lang, p.slug), projectSlug: p.slug, social: lang === 'fa' ? 'social-card.png' : 'social-card-en.png' })}
<main id="main" class="detail-main"><div class="container">
<nav class="breadcrumb" aria-label="${e(l.breadcrumb)}"><a href="${e(homePath(lang))}">${e(l.home)}</a><span aria-hidden="true">/</span><a href="${e(homePath(lang))}#projects">${e(pl.eyebrow)}</a><span aria-hidden="true">/</span><span aria-current="page">${e(p.name[lang])}</span></nav>
<header class="detail-hero" data-reveal><div class="project-meta">${statusBadge(lang, p)}<span>${e(p.category[lang])}</span></div><h1>${e(p.name[lang])}</h1><p class="detail-summary">${e(description)}</p>${projectLinks(lang, p, true)}</header>
<div class="detail-visual" data-reveal>${projectVisual(lang, p, 'detail')}</div>
<div class="detail-grid"><article class="detail-content">
<section data-reveal><h2>${e(pl.problem)}</h2><p>${e(p.problem[lang])}</p></section>
<section data-reveal><h2>${e(pl.features)}</h2><ul class="feature-list">${p.features[lang].map(item => `<li>${icon('check')}${e(item)}</li>`).join('')}</ul></section>
<section data-reveal><h2>${e(lang === 'fa' ? 'مسئله محصول و طراحی راه‌حل' : 'Product problem and solution design')}</h2><p>${e(p.challenge[lang])}</p></section>
<section data-reveal><h2>${e(pl.role)}</h2><p>${e(p.role[lang])}</p></section>
<section data-reveal><h2>${e(pl.tech)}</h2>${tags(p.technologies[lang])}<p class="tech-note">${e(p.techNote[lang])}</p></section>
<section data-reveal><h2>${e(pl.status)}</h2><p>${e(p.statusText[lang])}</p>${p.slug === 'mehriz' ? `<p class="tech-note">${e(pl.privateSource)}</p>` : ''}</section>
</article><aside class="detail-aside" data-reveal><h2>${e(lang === 'fa' ? 'اطلاعات تأییدشده مرکز / پروژه' : 'Verified project facts')}</h2><dl>${p.facts[lang].map(([value, label]) => `<div><dt>${e(label)}</dt><dd>${e(value)}</dd></div>`).join('')}</dl>${p.slug === 'mehriz' ? `<p class="aside-source">${e(lang === 'fa' ? 'منبع اطلاعات مرکز: صفحات رسمی خانه سالمندان مهریز.' : 'Centre facts are drawn from the official Mehriz care home pages.')}</p>` : ''}<a class="button button-primary" href="${e(homePath(lang))}#contact">${e(l.contact.eyebrow)} ${icon('arrow')}</a></aside></div>
<nav class="detail-nav" aria-label="${e(l.backProjects)}"><a class="text-link" href="${e(homePath(lang))}#projects">${icon('arrow')} ${e(l.backProjects)}</a><a class="next-project" href="${e(projectPath(lang, next.slug))}"><span>${e(l.nextProject)}</span><strong>${e(next.name[lang])}</strong>${icon('arrow')}</a></nav>
</div></main>${footer(lang)}
</body></html>`;
  write(projectPath(lang, p.slug).slice(1) + 'index.html', body);
}

function notFound() {
  const fa = locales.fa, en = locales.en;
  const body = `${head({ lang: 'fa', title: `${fa.notFound} | ${person.name.fa}`, description: fa.notFoundText, canonical: absolute('/404.html'), pagePath: '/404.html' })}
<main id="main" class="not-found"><div class="container"><p class="error-code" aria-hidden="true">404</p><h1>${e(fa.notFound)}</h1><p>${e(fa.notFoundText)}</p><p lang="en" dir="ltr">${e(en.notFound)} ${e(en.notFoundText)}</p><div class="hero-actions"><a class="button button-primary" href="/">${e(fa.notFoundButton)}</a><a class="button button-secondary" href="/en/" lang="en" hreflang="en">English home</a></div></div></main>${footer('fa')}
</body></html>`;
  write('404.html', body);
}

function sitemap() {
  const urls = [];
  for (const lang of ['fa', 'en']) {
    urls.push({ loc: absolute(homePath(lang)), fa: absolute(homePath('fa')), en: absolute(homePath('en')) });
    for (const p of projects) urls.push({ loc: absolute(projectPath(lang, p.slug)), fa: absolute(projectPath('fa', p.slug)), en: absolute(projectPath('en', p.slug)) });
  }
  write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.map(u => `  <url><loc>${e(u.loc)}</loc><xhtml:link rel="alternate" hreflang="fa" href="${e(u.fa)}"/><xhtml:link rel="alternate" hreflang="en" href="${e(u.en)}"/><xhtml:link rel="alternate" hreflang="x-default" href="${e(u.fa)}"/></url>`).join('\n')}\n</urlset>`);
}

function manifest(lang) {
  const l = locales[lang];
  const m = { name: `${person.name[lang]} — ${person.role[lang]}`, short_name: person.name[lang], description: l.description, lang: l.lang, dir: l.dir, start_url: homePath(lang), scope: '/', display: 'standalone', background_color: '#f6f7f3', theme_color: '#276b52', icons: [{ src: '/assets/images/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/assets/images/icon-512.png', sizes: '512x512', type: 'image/png' }] };
  write(lang === 'fa' ? 'site.webmanifest' : 'en/site.webmanifest', JSON.stringify(m, null, 2));
}

for (const lang of ['fa', 'en']) {
  homePage(lang);
  projects.forEach((p, i) => detailPage(lang, p, i));
  manifest(lang);
}
notFound();
sitemap();
write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml`);
console.log(`Built ${2 + projects.length * 2} localized pages, sitemap, manifests and robots.txt.`);
