// Modal search powered by Pagefind
(function() {
  var searchWrapper = document.getElementById('search-wrapper');
  if (!searchWrapper) return;

  var searchToggle = document.getElementById('search-toggle');
  var searchInput = document.getElementById('searchbar');
  var searchResults = document.getElementById('searchresults');
  var searchResultsHeader = document.getElementById('searchresults-header');
  var searchOverlay = searchWrapper.querySelector('.search-overlay');
  var pagefind = null;
  var version = searchWrapper.dataset.searchVersion;
  var currentQuery = '';

  // Append highlight param to a URL
  function addHighlight(url, query) {
    if (!query) return url;
    var separator = url.indexOf('?') === -1 ? '?' : '&';
    return url + separator + 'highlight=' + encodeURIComponent(query);
  }

  function openSearch() {
    searchWrapper.classList.remove('hidden');
    searchToggle.setAttribute('aria-expanded', 'true');
    searchInput.focus();
    searchInput.select();
    document.body.style.overflow = 'hidden';
  }

  function closeSearch() {
    searchWrapper.classList.add('hidden');
    searchToggle.setAttribute('aria-expanded', 'false');
    searchInput.value = '';
    searchInput.removeAttribute('aria-activedescendant');
    searchResults.innerHTML = '';
    searchResultsHeader.textContent = '';
    document.body.style.overflow = '';
    currentQuery = '';
  }

  async function initPagefind() {
    if (pagefind) return;
    pagefind = await import('/pagefind/pagefind.js');
    await pagefind.init();
  }

  async function doSearch(query) {
    currentQuery = query;

    if (!query) {
      searchResults.innerHTML = '';
      searchResultsHeader.textContent = '';
      searchInput.removeAttribute('aria-activedescendant');
      return;
    }

    await initPagefind();

    var filters = version ? { version: [version] } : {};
    var search = await pagefind.search(query, { filters: filters });

    if (search.results.length === 0) {
      searchResultsHeader.textContent = 'No results found.';
      searchResults.innerHTML = '';
      searchInput.removeAttribute('aria-activedescendant');
      return;
    }

    searchResultsHeader.textContent = search.results.length + ' result' + (search.results.length === 1 ? '' : 's') + ' found';

    // Load first 20 results
    var results = await Promise.all(search.results.slice(0, 20).map(function(r) { return r.data(); }));
    var html = '';
    for (var i = 0; i < results.length; i++) {
      var result = results[i];
      var href = addHighlight(result.url, query);
      html += '<li class="search-result" role="option" id="search-result-' + i + '">' +
        '<a href="' + href + '" tabindex="-1">' +
          '<span class="search-result-title">' + result.meta.title + '</span>' +
          '<span class="search-result-excerpt">' + result.excerpt + '</span>' +
        '</a>' +
      '</li>';
    }
    searchResults.innerHTML = html;
    searchInput.removeAttribute('aria-activedescendant');
  }

  // Debounced search
  var searchTimeout = -1;
  searchInput.addEventListener('input', function() {
    if (searchTimeout >= 0) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(function() {
      searchTimeout = -1;
      doSearch(searchInput.value);
    }, 150);
  });

  // Open search
  searchToggle.addEventListener('click', function(e) {
    e.preventDefault();
    openSearch();
  });

  // Close on overlay click
  searchOverlay.addEventListener('click', closeSearch);

  // Close on result link click
  searchResults.addEventListener('click', function(e) {
    if (e.target.tagName === 'A' || e.target.closest('a')) {
      closeSearch();
    }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    var isOpen = !searchWrapper.classList.contains('hidden');

    // "S" to open search (only when not in an input/textarea/contenteditable)
    if ((e.key === 's' || e.key === 'S') && !e.ctrlKey && !e.metaKey && !e.altKey && !isOpen) {
      var el = document.activeElement;
      var tag = el.tagName;
      if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT' && !el.isContentEditable) {
        e.preventDefault();
        openSearch();
      }
    }

    // Escape to close
    if (e.key === 'Escape' && isOpen) {
      closeSearch();
    }

    // Arrow key navigation and Enter within results
    if (isOpen) {
      var items = searchResults.querySelectorAll('.search-result a');
      if (items.length === 0) return;

      var focused = document.activeElement;
      var currentIndex = Array.prototype.indexOf.call(items, focused);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        var nextIndex;
        if (focused === searchInput) {
          nextIndex = 0;
        } else if (currentIndex >= 0 && currentIndex < items.length - 1) {
          nextIndex = currentIndex + 1;
        }
        if (nextIndex !== undefined) {
          items[nextIndex].focus();
          items[nextIndex].scrollIntoView({ block: 'nearest' });
          searchInput.setAttribute('aria-activedescendant', 'search-result-' + nextIndex);
        }
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (currentIndex === 0) {
          searchInput.focus();
          searchInput.removeAttribute('aria-activedescendant');
        } else if (currentIndex > 0) {
          var prevIndex = currentIndex - 1;
          items[prevIndex].focus();
          items[prevIndex].scrollIntoView({ block: 'nearest' });
          searchInput.setAttribute('aria-activedescendant', 'search-result-' + prevIndex);
        }
      }

      // Enter on focused result
      if (e.key === 'Enter') {
        if (currentIndex >= 0) {
          items[currentIndex].click();
        } else if (focused === searchInput && items.length > 0) {
          window.location.href = items[0].href;
        }
      }
    }
  });

  // === Highlight on page load ===
  // When arriving on a page with ?highlight=term, highlight all instances in the content
  var params = new URLSearchParams(window.location.search);
  var highlightTerm = params.get('highlight');
  if (highlightTerm) {
    var content = document.querySelector('[data-pagefind-body]') || document.querySelector('.td-content');
    if (content) {
      highlightInElement(content, highlightTerm);

      // Scroll to first highlight
      var firstMark = content.querySelector('mark.search-highlight');
      if (firstMark) {
        firstMark.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }

      // Add a dismiss bar
      var bar = document.createElement('div');
      bar.className = 'search-highlight-bar';
      bar.innerHTML = '<span>Highlighted: <strong>' + escapeHtml(highlightTerm) + '</strong></span>' +
        '<button type="button" aria-label="Clear highlights">Clear</button>';
      bar.querySelector('button').addEventListener('click', function() {
        clearHighlights(content);
        bar.remove();
        // Remove highlight param from URL
        var url = new URL(window.location);
        url.searchParams.delete('highlight');
        history.replaceState(null, '', url.toString());
      });
      content.parentElement.insertBefore(bar, content);
    }
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function highlightInElement(el, term) {
    var words = term.trim().split(/\s+/);
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    var textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    for (var i = 0; i < textNodes.length; i++) {
      var node = textNodes[i];
      // Skip nodes inside script/style/mark tags
      if (node.parentElement.closest('script, style, mark, .search-highlight-bar')) continue;

      var text = node.textContent;
      var regex = new RegExp('(' + words.map(escapeRegex).join('|') + ')', 'gi');
      if (!regex.test(text)) continue;

      var fragment = document.createDocumentFragment();
      var lastIndex = 0;
      text.replace(regex, function(match, p1, offset) {
        if (offset > lastIndex) {
          fragment.appendChild(document.createTextNode(text.slice(lastIndex, offset)));
        }
        var mark = document.createElement('mark');
        mark.className = 'search-highlight';
        mark.textContent = match;
        fragment.appendChild(mark);
        lastIndex = offset + match.length;
      });
      if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
      }
      node.parentNode.replaceChild(fragment, node);
    }
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function clearHighlights(el) {
    var marks = el.querySelectorAll('mark.search-highlight');
    for (var i = 0; i < marks.length; i++) {
      var mark = marks[i];
      mark.replaceWith(document.createTextNode(mark.textContent));
    }
    el.normalize();
  }
})();
