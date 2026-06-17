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
      const subMenuLinks = dropdown.querySelectorAll('a')
      const lastLink = subMenuLinks[subMenuLinks.length - 1]

      lastLink.addEventListener('blur', function() {
        item.parentElement.classList.remove('focus')
      })
    });
  }
});

// Close menu on nav/dropdown click
[".nav-link", ".dropdown-item"].forEach(className =>
  document.querySelectorAll(className).forEach(function(item) {
    item.addEventListener("click", function(e) {
      closeMenu(this);
    })
  })
);


// Cookies

function getCookie(cname) {
  var name = cname + "=";
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(';');
  for(var i = 0; i <ca.length; i++) {
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

// Copy button for code blocks
document.querySelectorAll('.code-block .btn-copy').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var block = btn.closest('.code-block');
    // With line numbers, code is in the second td; otherwise just find <code>
    var codeTd = block.querySelector('.lntd:last-child code');
    var code = codeTd || block.querySelector('code');
    if (!code) return;
    navigator.clipboard.writeText(code.textContent).then(function() {
      btn.innerHTML = '<i class="fa-solid fa-check"></i>';
      setTimeout(function() {
        btn.innerHTML = '<i class="fa-regular fa-copy"></i>';
      }, 2000);
    });
  });
});


// TOC scroll tracking - highlight active section in "On This Page"
(function() {
  var toc = document.getElementById('TableOfContents');
  if (!toc) return;

  var tocLinks = toc.querySelectorAll('a');
  if (!tocLinks.length) return;

  var sections = [];
  var linkMap = {};
  var clickLockUntil = 0;

  tocLinks.forEach(function(link) {
    var href = link.getAttribute('href');
    if (!href || href.charAt(0) !== '#') return;
    var id = decodeURIComponent(href.substring(1));
    var target = document.getElementById(id);
    if (target) {
      sections.push({ el: target, li: link.parentElement, id: id });
      linkMap[id] = link.parentElement;
    }
  });

  function clearActive() {
    sections.forEach(function(s) {
      s.li.classList.remove('active');
    });
  }

  function setActiveById(id) {
    clearActive();
    if (linkMap[id]) {
      linkMap[id].classList.add('active');
    }
  }

  function updateActiveByScroll() {
    // Skip scroll updates briefly after a click to prevent override
    if (Date.now() < clickLockUntil) return;

    var scrollPos = window.scrollY + 100;
    var activeLi = null;

    for (var i = 0; i < sections.length; i++) {
      if (sections[i].el.offsetTop <= scrollPos) {
        activeLi = sections[i].li;
      }
    }

    clearActive();
    if (activeLi) {
      activeLi.classList.add('active');
    }
  }

  function updateFromHash() {
    var hash = window.location.hash;
    if (hash) {
      var id = decodeURIComponent(hash.substring(1));
      if (linkMap[id]) {
        setActiveById(id);
        return true;
      }
    }
    return false;
  }

  // Click on TOC links: highlight immediately, suppress scroll override
  tocLinks.forEach(function(link) {
    link.addEventListener('click', function() {
      var href = link.getAttribute('href');
      if (!href || href.charAt(0) !== '#') return;
      var id = decodeURIComponent(href.substring(1));
      clickLockUntil = Date.now() + 300;
      setActiveById(id);
    });
  });

  // Hash change (back/forward navigation)
  window.addEventListener('hashchange', function() {
    updateFromHash();
  });

  // Scroll tracking
  window.addEventListener('scroll', updateActiveByScroll, { passive: true });

  // Initial state: use hash if present, otherwise use scroll position
  if (!updateFromHash()) {
    updateActiveByScroll();
  }
})();

document.querySelectorAll(".contact-cookies-consent-notice").forEach(
  function (item) {
    if (getCookie("cookieconsent_status") !== "allow") {
      item.classList.remove("d-none");
    }
  }
);