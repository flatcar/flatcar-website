// Mobile menu toggle
document.querySelector('.mobile-menu')?.addEventListener('click', function(e) {
  document.body.classList.toggle('mobile-menu_open');
});

// Docs menu toggle
document.querySelector('.docs-menu')?.addEventListener('click', function(e) {
  document.body.classList.toggle('show');
});

function closeMenu(elem) {
  if(document.body.classList.contains('mobile-menu_open')) {
    if(!elem.classList.contains('dropdown-toggle')) {
      document.querySelector('.mobile-menu')?.click();
    }
  }
}

// Dropdown navigation for mobile
document.querySelectorAll(".nav-item.dropdown .nav-link").forEach(function(item) {
  item.addEventListener("click", function(e) {
    // Skip theme dropdown - it has its own handling
    if(this.classList.contains('theme-dropdown-toggle')) {
      return;
    }

    e.preventDefault();
    if(document.body.classList.contains('mobile-menu_open')) {
      if(!this.classList.contains('nav-link_selected')) {
        document.querySelectorAll('.nav-link').forEach(function(elem) {
          elem.classList.remove('nav-link_selected');
        });
        this.classList.add('nav-link_selected');
      } else {
        this.classList.remove('nav-link_selected');
      }
    }
  });
});

// Dropdown focus handling for desktop
document.querySelectorAll(".nav-item.dropdown .nav-link").forEach(function(item) {
  if(!document.body.classList.contains('mobile-menu_open')) {
    item.addEventListener("focus", function(e) {
      item.parentElement.classList.add("focus");
    });

    // This logic is based on https://www.a11ywithlindsey.com/blog/create-accessible-dropdown-navigation
    item.parentElement.querySelectorAll(".dropdown-menu").forEach(function(dropdown) {
      const subMenuLinks = dropdown.querySelectorAll('a');
      const lastLink = subMenuLinks[subMenuLinks.length - 1];

      lastLink?.addEventListener('blur', function() {
        item.parentElement.classList.remove('focus');
      });
    });
  }
});

// Close menu on link clicks
[".nav-link", ".dropdown-item"].forEach(className =>
  document.querySelectorAll(className).forEach(function(item) {
    item.addEventListener("click", function(e) {
      closeMenu(this);
    });
  })
);


// Cookies

function getCookie(cname) {
  var name = cname + "=";
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(';');
  for(var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

document.querySelectorAll(".contact-cookies-consent-notice").forEach(
  function (item) {
    if (getCookie("cookieconsent_status") !== "allow") {
      item.classList.remove("d-none");
    }
  }
);

// Dark mode theme switcher with three modes: auto, light, dark
window.ThemeSwitcher = (function() {
  const THEME_AUTO = 'auto';
  const THEME_LIGHT = 'light';
  const THEME_DARK = 'dark';

  function log(message, data) {
    console.log('[ThemeSwitcher]', message, data || '');
  }

  function getStoredMode() {
    const mode = localStorage.getItem('theme-mode') || THEME_AUTO;
    log('getStoredMode:', mode);
    return mode;
  }

  function setStoredMode(mode) {
    log('setStoredMode:', mode);
    localStorage.setItem('theme-mode', mode);
  }

  function getSystemTheme() {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = isDark ? THEME_DARK : THEME_LIGHT;
    log('getSystemTheme:', theme);
    return theme;
  }

  function getEffectiveTheme(mode) {
    if (mode === THEME_AUTO) {
      return getSystemTheme();
    }
    return mode;
  }

  function applyTheme(mode) {
    log('applyTheme called with mode:', mode);
    const effectiveTheme = getEffectiveTheme(mode);
    log('effectiveTheme:', effectiveTheme);

    document.documentElement.setAttribute('data-bs-theme', effectiveTheme);
    setStoredMode(mode);
    updateThemeUI(mode, effectiveTheme);

    log('Theme applied successfully');
  }

  function updateThemeUI(mode, effectiveTheme) {
    log('updateThemeUI:', { mode, effectiveTheme });

    // Update dropdown button icon
    const dropdownBtn = document.querySelector('.theme-dropdown-toggle');
    if (dropdownBtn) {
      const iconContainer = dropdownBtn.querySelector('.theme-current-icon');
      if (iconContainer) {
        let iconHtml = '';
        if (mode === THEME_AUTO) {
          iconHtml = '<svg class="theme-icon" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><use xlink:href="#auto-icon"/></svg>';
        } else if (effectiveTheme === THEME_DARK) {
          iconHtml = '<svg class="theme-icon" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><use xlink:href="#moon-icon"/></svg>';
        } else {
          iconHtml = '<svg class="theme-icon" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><use xlink:href="#sun-icon"/></svg>';
        }
        iconContainer.innerHTML = iconHtml;
        log('Updated dropdown icon');
      }
    } else {
      log('WARNING: dropdown button not found');
    }

    // Update checkmarks in dropdown menu
    const options = document.querySelectorAll('.theme-option');
    log('Found theme options:', options.length);

    options.forEach(option => {
      const optionMode = option.getAttribute('data-theme-mode');
      const checkmark = option.querySelector('.theme-checkmark');
      if (checkmark) {
        checkmark.style.visibility = optionMode === mode ? 'visible' : 'hidden';
        log(`Checkmark for ${optionMode}:`, checkmark.style.visibility);
      }
    });
  }

  function setThemeMode(mode) {
    log('setThemeMode called with:', mode);
    applyTheme(mode);

    // Close the Bootstrap dropdown
    const dropdownElement = document.querySelector('.theme-dropdown-toggle');
    if (dropdownElement && window.bootstrap) {
      const dropdown = bootstrap.Dropdown.getInstance(dropdownElement);
      if (dropdown) {
        dropdown.hide();
        log('Dropdown closed');
      }
    }
  }

  // Initialize theme on DOM ready
  function init() {
    log('Initializing theme switcher...');

    const currentMode = getStoredMode();
    const effectiveTheme = getEffectiveTheme(currentMode);

    // Apply initial theme
    document.documentElement.setAttribute('data-bs-theme', effectiveTheme);
    updateThemeUI(currentMode, effectiveTheme);

    // Add click handlers to theme options using event delegation
    const themeDropdown = document.querySelector('.theme-dropdown-menu');
    if (themeDropdown) {
      log('Theme dropdown found, attaching event listener');
      themeDropdown.addEventListener('click', function(e) {
        const themeOption = e.target.closest('.theme-option');
        if (themeOption) {
          e.preventDefault();
          e.stopPropagation();
          const mode = themeOption.getAttribute('data-theme-mode');
          log('Theme option clicked:', mode);
          setThemeMode(mode);
        }
      });
    } else {
      log('ERROR: Theme dropdown not found!');
    }

    // Listen for system theme changes (only matters when in auto mode)
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
      log('System theme changed:', e.matches ? 'dark' : 'light');
      const currentMode = getStoredMode();
      if (currentMode === THEME_AUTO) {
        const effectiveTheme = e.matches ? THEME_DARK : THEME_LIGHT;
        document.documentElement.setAttribute('data-bs-theme', effectiveTheme);
        updateThemeUI(currentMode, effectiveTheme);
      }
    });

    log('Theme switcher initialized');
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose public API for debugging
  return {
    setThemeMode: setThemeMode,
    getStoredMode: getStoredMode,
    getSystemTheme: getSystemTheme,
    THEME_AUTO: THEME_AUTO,
    THEME_LIGHT: THEME_LIGHT,
    THEME_DARK: THEME_DARK
  };
})();