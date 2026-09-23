/* Amara Health — site interactions. No dependencies. */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Page load ---------- */
  window.requestAnimationFrame(function () { root.classList.add('is-loaded'); });

  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* ---------- Header state ---------- */
  var header = document.querySelector('.site-header');
  if (header && !header.classList.contains('is-solid')) {
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 12); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Mobile menu ---------- */
  var toggle = document.querySelector('.menu-toggle');
  var menu = document.getElementById('mobile-menu');
  if (toggle && menu) {
    var closeBtn = menu.querySelector('.menu-close');
    var lastFocus = null;

    var focusables = function () {
      return Array.prototype.slice.call(menu.querySelectorAll('a[href], button:not([disabled])'));
    };

    var openMenu = function () {
      lastFocus = document.activeElement;
      menu.hidden = false;
      document.body.classList.add('menu-open');
      toggle.setAttribute('aria-expanded', 'true');
      window.requestAnimationFrame(function () {
        menu.classList.add('is-open');
        closeBtn.focus();
      });
    };

    var closeMenu = function (restoreFocus) {
      menu.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-open');
      var finish = function () { menu.hidden = true; };
      if (reduceMotion.matches) { finish(); } else { window.setTimeout(finish, 300); }
      if (restoreFocus !== false && lastFocus) { lastFocus.focus(); }
    };

    toggle.addEventListener('click', openMenu);
    closeBtn.addEventListener('click', function () { closeMenu(); });

    menu.addEventListener('click', function (e) {
      var link = e.target.closest('a[href]');
      if (link) { closeMenu(false); }
    });

    menu.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); closeMenu(); return; }
      if (e.key !== 'Tab') { return; }
      var items = focusables();
      var first = items[0];
      var last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    window.matchMedia('(min-width: 1081px)').addEventListener('change', function (mq) {
      if (mq.matches && !menu.hidden) { closeMenu(false); }
    });
  }

  /* ---------- In-page links: smooth scroll without adding #section to the URL ---------- */
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href^="#"]');
    if (!link) { return; }
    var id = link.getAttribute('href').slice(1);
    var target = id ? document.getElementById(id) : null;
    if (!target) { return; }
    e.preventDefault();
    var behavior = reduceMotion.matches ? 'auto' : 'smooth';
    if (id === 'top') { window.scrollTo({ top: 0, behavior: behavior }); }
    else { target.scrollIntoView({ behavior: behavior, block: 'start' }); }
    if (!target.hasAttribute('tabindex')) { target.setAttribute('tabindex', '-1'); }
    window.setTimeout(function () { target.focus({ preventScroll: true }); }, reduceMotion.matches ? 0 : 450);
  });

  /* ---------- Scroll-spy for primary nav ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.primary-nav a[href^="#"]'));
  if ('IntersectionObserver' in window && navLinks.length) {
    var byId = {};
    navLinks.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        navLinks.forEach(function (a) { a.removeAttribute('aria-current'); });
        var active = byId[entry.target.id];
        if (active) { active.setAttribute('aria-current', 'true'); }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('main section[id]').forEach(function (s) { spy.observe(s); });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll('.reveal, .img-reveal, .timeline, .garden');
  if (!('IntersectionObserver' in window) || reduceMotion.matches) {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Forms ---------- */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  var MESSAGES = {
    'waitlist-form': {
      successTitle: 'You are on the list.',
      successBody: 'Thank you for joining us. We will be in touch when early access opens.',
      loading: 'Joining…'
    },
    'partner-form': {
      successTitle: 'Thank you. Message received.',
      successBody: 'We appreciate your interest in partnering with Amara. A member of our team will be in touch.',
      loading: 'Sending…'
    }
  };

  var fieldError = function (form, input) {
    var v = input.type === 'checkbox' ? input.checked : input.value.trim();
    if (input.required && !v) {
      if (input.type === 'checkbox') {
        return form.id === 'waitlist-form'
          ? 'Please confirm you would like to receive emails from us.'
          : 'Please confirm so we can respond to your inquiry.';
      }
      if (input.type === 'email') { return 'Please enter your email address.'; }
      if (input.tagName === 'SELECT') { return 'Please choose an option.'; }
      return 'This field is required.';
    }
    if (input.type === 'email' && v && !EMAIL_RE.test(v)) {
      return 'Please enter a valid email address, like name@example.com.';
    }
    if (input.maxLength > 0 && typeof v === 'string' && v.length > input.maxLength) {
      return 'Please shorten this to ' + input.maxLength + ' characters or fewer.';
    }
    return '';
  };

  var setError = function (input, message) {
    var errEl = document.getElementById(input.id + '-err');
    if (message) {
      input.setAttribute('aria-invalid', 'true');
      if (errEl) {
        errEl.textContent = message;
        input.setAttribute('aria-describedby', errEl.id);
      }
    } else {
      input.removeAttribute('aria-invalid');
      if (errEl) { errEl.textContent = ''; }
      input.removeAttribute('aria-describedby');
    }
  };

  var validate = function (form) {
    var firstInvalid = null;
    form.querySelectorAll('input, select, textarea').forEach(function (input) {
      if (input.closest('.hp') || !input.id) { return; }
      var msg = fieldError(form, input);
      setError(input, msg);
      if (msg && !firstInvalid) { firstInvalid = input; }
    });
    return firstInvalid;
  };

  var serialize = function (form) {
    var data = {};
    form.querySelectorAll('input, select, textarea').forEach(function (input) {
      if (!input.name) { return; }
      data[input.name] = input.type === 'checkbox' ? input.checked : input.value.trim();
    });
    return data;
  };

  var showSuccess = function (form, copy) {
    var box = document.createElement('div');
    box.className = 'form-success';
    box.setAttribute('tabindex', '-1');
    box.setAttribute('role', 'status');
    var mark = document.createElement('div');
    mark.className = 'form-success-mark';
    mark.setAttribute('aria-hidden', 'true');
    var title = document.createElement('p');
    title.className = 'form-success-title';
    title.textContent = copy.successTitle;
    var body = document.createElement('p');
    body.textContent = copy.successBody;
    box.appendChild(mark);
    box.appendChild(title);
    box.appendChild(body);
    form.replaceWith(box);
    box.focus();
  };

  var errorMessage = function (status, payload, formId) {
    if (payload && payload.error === 'not_configured') {
      return formId === 'waitlist-form'
        ? 'Our waitlist is not accepting sign-ups just yet. Please check back soon.'
        : 'Our partnership inbox is not connected yet. Please check back soon.';
    }
    if (status === 400 && payload && payload.fields) {
      return 'Please check the highlighted fields and try again.';
    }
    if (status === 429) { return 'Too many attempts. Please wait a moment and try again.'; }
    return 'Something went wrong and your submission was not sent. Please try again in a moment.';
  };

  document.querySelectorAll('form.js-form').forEach(function (form) {
    var copy = MESSAGES[form.id] || MESSAGES['partner-form'];
    var button = form.querySelector('button[type="submit"]');
    var label = button.querySelector('.btn-label');
    var defaultLabel = label.textContent;
    var status = form.querySelector('.form-status');
    var busy = false;

    form.querySelectorAll('input, select, textarea').forEach(function (input) {
      var evt = input.type === 'checkbox' || input.tagName === 'SELECT' ? 'change' : 'blur';
      input.addEventListener(evt, function () {
        if (input.getAttribute('aria-invalid') === 'true' || (evt === 'blur' && input.value)) {
          setError(input, fieldError(form, input));
        }
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (busy) { return; }
      status.textContent = '';
      status.className = 'form-status';

      var firstInvalid = validate(form);
      if (firstInvalid) { firstInvalid.focus(); return; }

      busy = true;
      button.disabled = true;
      button.classList.add('is-loading');
      label.textContent = copy.loading;
      form.setAttribute('aria-busy', 'true');

      var controller = 'AbortController' in window ? new AbortController() : null;
      var timer = controller ? window.setTimeout(function () { controller.abort(); }, 15000) : null;
      var httpStatus = 0;

      fetch(form.getAttribute('data-endpoint'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(serialize(form)),
        signal: controller ? controller.signal : undefined
      })
        .then(function (res) {
          httpStatus = res.status;
          return res.json().catch(function () { return {}; }).then(function (payload) {
            if (res.ok && payload && payload.ok) { return payload; }
            var err = new Error('Request failed');
            err.payload = payload;
            throw err;
          });
        })
        .then(function () { showSuccess(form, copy); })
        .catch(function (err) {
          var payload = err && err.payload;
          if (payload && payload.fields) {
            Object.keys(payload.fields).forEach(function (name) {
              var input = form.querySelector('[name="' + name + '"]');
              if (input) { setError(input, payload.fields[name]); }
            });
          }
          status.textContent = errorMessage(httpStatus, payload, form.id);
          status.className = 'form-status is-error';
        })
        .then(function () {
          if (timer) { window.clearTimeout(timer); }
          busy = false;
          if (document.body.contains(form)) {
            button.disabled = false;
            button.classList.remove('is-loading');
            label.textContent = defaultLabel;
            form.removeAttribute('aria-busy');
          }
        });
    });
  });
})();
