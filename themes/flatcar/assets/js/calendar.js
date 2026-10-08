(function() {
  var root = document.querySelector('[data-calendar-root]');
  if (!root) return;

  var tzLabel = root.querySelector('[data-calendar-tz]');
  if (tzLabel) {
    try {
      tzLabel.textContent = 'localized for ' + Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (e) {
      // Leave the server-rendered "UTC" label in place.
    }
  }

  root.querySelectorAll('[data-calendar-row]').forEach(function(row) {
    var tsEl = row.querySelector('[data-calendar-timestamp]');
    var dateEl = row.querySelector('[data-calendar-date]');
    var timeEl = row.querySelector('[data-calendar-time]');

    if (tsEl && dateEl && timeEl) {
      var ts = Date.parse(tsEl.textContent.trim());
      if (!isNaN(ts)) {
        var dto = new Date(ts);
        var locale = navigator.language || undefined;
        dateEl.textContent = dto.toLocaleDateString(locale, {
          month: 'numeric',
          day: 'numeric',
          year: 'numeric'
        });
        timeEl.textContent = dto.toLocaleTimeString(locale, {
          hour: '2-digit',
          minute: '2-digit',
          timeZoneName: 'short'
        });
      }
    }

    var toggle = row.querySelector('[data-calendar-toggle]');
    var card = row.querySelector('.calendar-card');
    if (!toggle || !card) return;

    toggle.addEventListener('click', function() {
      var isOpen = !card.hasAttribute('hidden');

      root.querySelectorAll('.calendar-card').forEach(function(other) {
        other.setAttribute('hidden', '');
      });
      root.querySelectorAll('[data-calendar-toggle]').forEach(function(btn) {
        btn.setAttribute('aria-expanded', 'false');
      });

      if (!isOpen) {
        card.removeAttribute('hidden');
        toggle.setAttribute('aria-expanded', 'true');
      }
    });
  });
})();
