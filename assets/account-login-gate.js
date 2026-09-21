/**
 * Require Shopify customer sign-in before checkout.
 * Always use /customer_authentication/login (new customer accounts).
 * Do NOT use /account/login — that is the classic email/password form (no Google).
 */
(function () {
  var SEEN_KEY = 'account_login_gate_seen';
  var PENDING_KEY = 'pending_checkout_after_login';

  function buildLoginUrl() {
    var returnTo = encodeURIComponent('/cart');
    var canonical = (window.shopCanonicalUrl || '').replace(/\/$/, '');
    var origin = window.location.origin || '';

    // Real shop host only — localhost theme-dev returns 401 for this path
    if (canonical && !/127\.0\.0\.1|localhost/i.test(canonical)) {
      return (
        canonical +
        '/customer_authentication/login?return_to=' +
        returnTo
      );
    }

    if (origin && !/127\.0\.0\.1|localhost/i.test(origin)) {
      return (
        origin.replace(/\/$/, '') +
        '/customer_authentication/login?return_to=' +
        returnTo
      );
    }

    // Last resort (may 401 on theme-dev localhost)
    return '/customer_authentication/login?return_to=' + returnTo;
  }

  function isLoggedIn() {
    return document.documentElement.getAttribute('data-customer-logged-in') === 'true';
  }

  function goToHostedLogin() {
    window.location.assign(buildLoginUrl());
  }

  function startSignIn() {
    try {
      sessionStorage.setItem(SEEN_KEY, '1');
    } catch (e) {
      /* ignore */
    }
    var gate = document.getElementById('AccountLoginGate');
    var needsCheckout =
      gate && gate.getAttribute('data-checkout-required') === 'true';
    if (needsCheckout) {
      try {
        sessionStorage.setItem(PENDING_KEY, '1');
      } catch (e) {
        /* ignore */
      }
    }
    hideGate(true);
    goToHostedLogin();
  }

  function requireLoginThenCheckout(event) {
    if (isLoggedIn()) return;
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    try {
      sessionStorage.setItem(PENDING_KEY, '1');
    } catch (e) {
      /* ignore */
    }
    showGate(true);
  }

  function showGate(forceCheckout) {
    var gate = document.getElementById('AccountLoginGate');
    if (!gate) {
      goToHostedLogin();
      return;
    }
    gate.hidden = false;
    document.body.classList.add('overflow-hidden');
    if (forceCheckout) {
      gate.setAttribute('data-checkout-required', 'true');
    } else {
      gate.removeAttribute('data-checkout-required');
    }
  }

  function hideGate(keepPending) {
    var gate = document.getElementById('AccountLoginGate');
    if (!gate) return;
    if (gate.getAttribute('data-checkout-required') === 'true' && !keepPending) {
      try {
        sessionStorage.removeItem(PENDING_KEY);
      } catch (e) {
        /* ignore */
      }
    }
    gate.removeAttribute('data-checkout-required');
    gate.hidden = true;
    document.body.classList.remove('overflow-hidden');
  }

  function bindCheckoutGates() {
    if (isLoggedIn()) return;
    var nodes = document.querySelectorAll(
      '#CartDrawer-Checkout, #cart-notification-form, #checkout, a.cart__checkout-button'
    );
    nodes.forEach(function (el) {
      if (el.dataset.loginGateBound === '1') return;
      el.dataset.loginGateBound = '1';
      el.addEventListener('click', requireLoginThenCheckout, true);
    });
  }

  function onReady() {
    if (isLoggedIn()) {
      try {
        if (sessionStorage.getItem(PENDING_KEY) === '1') {
          sessionStorage.removeItem(PENDING_KEY);
          if (window.location.pathname.indexOf('/cart') !== 0) {
            window.location.href = '/cart';
            return;
          }
        }
      } catch (e) {
        /* ignore */
      }
      return;
    }

    var gate = document.getElementById('AccountLoginGate');
    if (gate) {
      gate.querySelectorAll('[data-login-gate-dismiss]').forEach(function (el) {
        el.addEventListener('click', function () {
          hideGate();
          try {
            sessionStorage.setItem(SEEN_KEY, '1');
          } catch (e) {
            /* ignore */
          }
        });
      });
      gate.querySelectorAll('[data-login-gate-signin]').forEach(function (el) {
        el.addEventListener('click', startSignIn);
      });
    }

    bindCheckoutGates();
    document.addEventListener('cart:updated', bindCheckoutGates);
    new MutationObserver(bindCheckoutGates).observe(document.body, {
      childList: true,
      subtree: true,
    });

    try {
      if (sessionStorage.getItem(SEEN_KEY) !== '1') {
        window.setTimeout(function () {
          showGate(false);
        }, 900);
      }
    } catch (e) {
      showGate(false);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }
})();
