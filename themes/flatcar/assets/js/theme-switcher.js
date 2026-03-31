// Dark mode theme switcher – three modes: auto · light · dark.
// The localStorage key and mode values must match the inline FOUC-prevention
// script emitted by theme-mode.html (called with "head" part).

(function () {
  var KEY = "theme-mode";
  var AUTO = "auto",
    LIGHT = "light",
    DARK = "dark";

  var ICONS = { auto: "auto-icon", light: "sun-icon", dark: "moon-icon" };

  function stored() {
    try {
      return localStorage.getItem(KEY) || AUTO;
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

    var btn = document.querySelector(".theme-switcher__toggle");
    if (btn) {
      var use = btn.querySelector(".theme-switcher__current-icon use");
      if (use) {
        var iconRef = "#" + ICONS[mode];
        use.setAttributeNS(
          "http://www.w3.org/1999/xlink",
          "xlink:href",
          iconRef,
        );
        use.setAttribute("href", iconRef);
      }
    }

    document.querySelectorAll(".theme-switcher__option").forEach(function (el) {
      var isActive = el.getAttribute("data-theme-mode") === mode;
      var cm = el.querySelector(".theme-switcher__checkmark");
      if (cm) cm.style.visibility = isActive ? "visible" : "hidden";
      if (isActive) {
        el.setAttribute("aria-current", "true");
      } else {
        el.removeAttribute("aria-current");
      }
    });
  }

  function apply(mode) {
    save(mode);
    updateUI(mode);
  }

  function select(mode) {
    apply(mode);
    var t = document.querySelector(".theme-switcher__toggle");
    if (t && window.bootstrap) {
      var d = bootstrap.Dropdown.getInstance(t);
      if (d) d.hide();
    }
  }

  function init() {
    var menu = document.querySelector(".theme-switcher__menu");
    if (!menu) return;

    updateUI(stored());

    menu.addEventListener("click", function (e) {
      var opt = e.target.closest(".theme-switcher__option");
      if (opt) {
        e.preventDefault();
        select(opt.getAttribute("data-theme-mode"));
      }
    });

    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", function () {
        if (stored() === AUTO) updateUI(AUTO);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
