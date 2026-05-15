/*! lagoon-cta.js — sticky guide CTA + GA4 conversion + scroll-depth tracking */
(function () {
  'use strict';

  // ----- GA4 conversion tracking (works on every page that loads this file) -----
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href*="apps.apple.com"]');
    if (!a) return;
    var source = a.getAttribute('data-lagoon-cta') || 'inline';
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'app_store_click', {
        cta_source: source,
        page_path: location.pathname,
        link_url: a.href
      });
      // GA4 conversion (mark `app_store_click` as a key event in GA4 dashboard too)
      window.gtag('event', 'conversion', {
        send_to: 'G-2F8CTN4DNP',
        cta_source: source
      });
    }
  }, true);

  // Waitlist / form submit tracking
  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (!f || f.tagName !== 'FORM') return;
    var name = f.getAttribute('name') || f.id || 'form';
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'form_submit', { form_name: name, page_path: location.pathname });
    }
  }, true);

  // Scroll-depth milestones
  var milestones = [25, 50, 75, 100], hit = {};
  window.addEventListener('scroll', function () {
    var h = document.documentElement;
    var pct = Math.round(((h.scrollTop || document.body.scrollTop) + window.innerHeight) / h.scrollHeight * 100);
    for (var i = 0; i < milestones.length; i++) {
      var m = milestones[i];
      if (!hit[m] && pct >= m) {
        hit[m] = true;
        if (typeof window.gtag === 'function') {
          window.gtag('event', 'scroll_depth', { percent: m, page_path: location.pathname });
        }
      }
    }
  }, { passive: true });

  // ----- Sticky CTA bar (skip homepage; only inject on guide pages) -----
  var isHome = location.pathname === '/' || location.pathname === '/index.html';
  if (isHome) return;

  // Skip if already dismissed this session
  try { if (sessionStorage.getItem('lagoon_sticky_dismissed')) return; } catch (e) {}

  function init() {
    var style = document.createElement('style');
    style.textContent = [
      '#lagoon-sticky-cta{position:fixed;left:12px;right:12px;bottom:12px;z-index:9999;max-width:720px;margin:0 auto;',
      'background:#FEBC11;color:#0C1B2A;border-radius:16px;padding:12px 16px;',
      'box-shadow:0 10px 30px rgba(0,0,0,.18);display:flex;align-items:center;justify-content:space-between;',
      "font-family:'Space Grotesk',system-ui,sans-serif;font-weight:700;",
      'transform:translateY(140%);transition:transform .35s ease}',
      '#lagoon-sticky-cta.visible{transform:translateY(0)}',
      '#lagoon-sticky-cta a{background:#0C1B2A;color:#FBF7F0;text-decoration:none;padding:10px 18px;',
      'border-radius:10px;font-weight:700;white-space:nowrap;margin-left:12px}',
      '#lagoon-sticky-cta .lc-text{font-size:15px;line-height:1.25;flex:1}',
      '#lagoon-sticky-cta .lc-close{background:transparent;border:0;color:#0C1B2A;opacity:.55;',
      'font-size:20px;cursor:pointer;margin-right:6px;padding:0 4px;line-height:1}',
      '@media (max-width:480px){#lagoon-sticky-cta .lc-text{font-size:13px}',
      '#lagoon-sticky-cta a{padding:9px 14px;font-size:14px}}'
    ].join('');
    document.head.appendChild(style);

    var bar = document.createElement('div');
    bar.id = 'lagoon-sticky-cta';
    bar.setAttribute('role', 'complementary');
    bar.setAttribute('aria-label', 'Get Lagoon');
    bar.innerHTML =
      '<button class="lc-close" aria-label="Dismiss">×</button>' +
      '<span class="lc-text">Get the UCSB campus app — free.</span>' +
      '<a href="https://apps.apple.com/us/app/ucsb-lagoon/id6760681142" rel="noreferrer" ' +
      'data-lagoon-cta="sticky-guide">Download Lagoon</a>';
    document.body.appendChild(bar);

    var shown = false;
    function maybeShow() {
      if (shown) return;
      if (window.scrollY > 240 || document.documentElement.scrollHeight < 1200) {
        bar.classList.add('visible');
        shown = true;
        if (typeof window.gtag === 'function') {
          window.gtag('event', 'sticky_cta_shown', { page_path: location.pathname });
        }
      }
    }
    window.addEventListener('scroll', maybeShow, { passive: true });
    setTimeout(maybeShow, 4000);

    bar.querySelector('.lc-close').addEventListener('click', function () {
      try { sessionStorage.setItem('lagoon_sticky_dismissed', '1'); } catch (e) {}
      bar.classList.remove('visible');
      setTimeout(function () { bar.remove(); }, 350);
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'sticky_cta_dismiss', { page_path: location.pathname });
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
