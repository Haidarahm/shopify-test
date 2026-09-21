(function () {
  var COMPACT_STYLE_ID = 'account-sheet-compact';

  function accountEl() {
    var nodes = document.querySelectorAll('shopify-account');
    var fallback = null;
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var rect = el.getBoundingClientRect();
      var style = window.getComputedStyle(el);
      var parent = el.parentElement;
      var parentHidden =
        parent &&
        (window.getComputedStyle(parent).display === 'none' ||
          window.getComputedStyle(parent).visibility === 'hidden');
      if (parentHidden || style.display === 'none') continue;
      if (rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden') return el;
      if (!fallback) fallback = el;
    }
    return fallback;
  }

  function compactSheet(el) {
    if (!el || !el.shadowRoot) return;
    if (!el.shadowRoot.getElementById(COMPACT_STYLE_ID)) {
      var style = document.createElement('style');
      style.id = COMPACT_STYLE_ID;
      style.textContent =
        '.dialog{height:fit-content!important;min-height:0!important;max-height:min(85vh,100%)!important;--dialog-min-height:0!important;}' +
        '.account__header{padding:10px 14px!important;gap:8px!important;}' +
        '.account__content{padding:12px 14px 14px!important;gap:10px!important;margin-top:-10px!important;}' +
        '.account__menu-region{margin-top:4px!important;}' +
        '.stack-inline{gap:6px!important;}' +
        '.button.outline{padding:10px 14px!important;min-height:0!important;}' +
        '.shop-login,.social-login{margin:0!important;}';
      el.shadowRoot.appendChild(style);
    }

    var dialog = el.shadowRoot.querySelector('dialog');
    if (!dialog) return;
    dialog.style.setProperty('--dialog-min-height', '0px', 'important');
    dialog.style.setProperty('min-height', '0', 'important');
    dialog.style.setProperty('height', 'fit-content', 'important');
    dialog.style.setProperty('max-height', '85vh', 'important');
  }

  function isOpen(el) {
    var dialog = el.shadowRoot && el.shadowRoot.querySelector('dialog');
    return !!(dialog && dialog.open);
  }

  function openShopifyAccount() {
    var el = accountEl();
    if (!el) return false;
    compactSheet(el);
    if (isOpen(el)) return true;

    if (typeof el.showModal === 'function') {
      el.showModal();
      compactSheet(el);
      requestAnimationFrame(function () {
        compactSheet(el);
      });
      if (isOpen(el)) return true;
    }

    var btn =
      (el.shadowRoot && el.shadowRoot.querySelector('button')) ||
      el.querySelector('[slot="signed-out-avatar"]') ||
      el;
    if (btn && typeof btn.click === 'function') {
      btn.click();
      compactSheet(el);
      return isOpen(el);
    }
    return false;
  }

  function openOnCart() {
    if (window.location.pathname.indexOf('/cart') !== 0) return;
    if (document.documentElement.getAttribute('data-customer-logged-in') === 'true') return;

    var tries = 0;
    var timer = window.setInterval(function () {
      tries += 1;
      if (openShopifyAccount() || tries > 40) window.clearInterval(timer);
    }, 100);
  }

  function wireCompact() {
    document.querySelectorAll('shopify-account').forEach(function (el) {
      compactSheet(el);
      el.addEventListener('open', function () {
        compactSheet(el);
        // Shopify sets --dialog-min-height after open; clear it again.
        requestAnimationFrame(function () {
          compactSheet(el);
          setTimeout(function () {
            compactSheet(el);
          }, 50);
        });
      });
    });
  }

  function openOnCart() {
    wireCompact();
    if (window.location.pathname.indexOf('/cart') !== 0) return;
    if (document.documentElement.getAttribute('data-customer-logged-in') === 'true') return;

    var tries = 0;
    var timer = window.setInterval(function () {
      tries += 1;
      if (openShopifyAccount() || tries > 40) window.clearInterval(timer);
    }, 100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', openOnCart);
  } else {
    openOnCart();
  }
})();
