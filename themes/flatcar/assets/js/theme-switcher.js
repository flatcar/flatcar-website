// Dark mode theme switcher – three modes: auto · light · dark.
// The localStorage key and mode values must match the inline FOUC-prevention
// script emitted by theme-mode.html (called with "head" part).

(function () {
  var KEY = "theme-mode";
  var AUTO = "auto",
    LIGHT = "light",
    DARK = "dark";

  var ICONS = { auto: "auto-icon", light: "sun-icon", dark: "moon-icon" };
  var LABELS = { auto: "Auto", light: "Light", dark: "Dark" };

  function stored() {
    try {
      var m = localStorage.getItem(KEY);
      return m === LIGHT || m === DARK ? m : AUTO;
    } catch (e) {
      return AUTO;
    }
  }
  function save(mode) {
    try {
      localStorage.setItem(KEY, mode);
    } catch (e) {
      /* storage unavailable */
    }
  }
  function system() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? DARK
      : LIGHT;
  }
  function resolve(m) {
    return m === AUTO ? system() : m;
  }

  function forcedTheme() {
    var f = document.body && document.body.dataset.themeForce;
    return f || null;
  }

  function updateUI(mode) {
    var theme = resolve(mode);

    // On pages with data-theme-force (e.g. landing page), don't touch the
    // data-bs-theme attribute on <html> at all — leave it exactly as the
    // server rendered it. The icon and checkmark still reflect the user's
    // actual choice so the preference is visible and saved for other pages.
    if (!forcedTheme()) {
      document.documentElement.setAttribute("data-bs-theme", theme);
    }

    var iconRef = "#" + ICONS[mode];
    document.querySelectorAll(".theme-switcher__toggle").forEach(function (btn) {
      var use = btn.querySelector(".theme-switcher__current-icon use");
      if (use) {
        use.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", iconRef);
        use.setAttribute("href", iconRef);
      }
      btn.setAttribute("aria-label", "Theme: " + LABELS[mode]);
    });

    document.querySelectorAll(".theme-switcher__option").forEach(function (el) {
      var isActive = el.getAttribute("data-theme-mode") === mode;
      var cm = el.querySelector(".theme-switcher__checkmark");
      if (cm) cm.style.visibility = isActive ? "visible" : "hidden";
      el.setAttribute("aria-checked", isActive ? "true" : "false");
    });
  }

  function apply(mode) {
    save(mode);
    updateUI(mode);
  }

  function select(mode, opt) {
    apply(mode);
    var scope = (opt && opt.closest(".dropdown")) || document;
    var t = scope.querySelector(".theme-switcher__toggle");
    if (t && window.bootstrap) {
      var d = bootstrap.Dropdown.getInstance(t);
      if (d) d.hide();
    }
  }

  function init() {
    updateUI(stored());

    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", function () {
        if (stored() === AUTO) updateUI(AUTO);
      });

    // Delegated so any number of switcher instances (e.g. a footer one) work.
    document.addEventListener("click", function (e) {
      var opt = e.target.closest(".theme-switcher__option");
      if (opt) {
        e.preventDefault();
        select(opt.getAttribute("data-theme-mode"), opt);
      }
    });

    // Accessibility: on narrow viewports the toggle is hidden with display:none
    // while the dropdown is open (see navbar.scss). Hiding the focused element
    // drops focus to <body>, breaking arrow-key roving and Escape-to-close. Move
    // focus into the menu on open (while hidden) and restore it on close. Bound
    // per switcher instance so additional switchers behave the same.
    document.querySelectorAll(".theme-switcher__toggle").forEach(function (toggle) {
      var menu = (toggle.closest(".dropdown") || document).querySelector(
        ".theme-switcher__menu",
      );
      if (!menu) return;
      var toggleHidden = function () {
        return getComputedStyle(toggle).display === "none";
      };
      toggle.addEventListener("shown.bs.dropdown", function () {
        if (!toggleHidden()) return;
        var target =
          menu.querySelector('.theme-switcher__option[aria-checked="true"]') ||
          menu.querySelector(".theme-switcher__option");
        if (target) target.focus();
      });
      toggle.addEventListener("hidden.bs.dropdown", function () {
        if (toggleHidden()) return;
        var active = document.activeElement;
        if (!active || active === document.body || menu.contains(active)) {
          toggle.focus();
        }
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
