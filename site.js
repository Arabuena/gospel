(function () {
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  function getBaseUrl() {
    var meta = document.querySelector('meta[name="site:base"]');
    var content = meta && meta.getAttribute('content');
    if (content && /^https?:\/\//i.test(content)) return content.replace(/\/+$/, '');
    return '';
  }

  function getFullUrl() {
    var base = getBaseUrl();
    if (base) return base + window.location.pathname.replace(/index\.html$/i, '');
    return window.location.href;
  }

  function makeShareText(prefix) {
    var url = getFullUrl();
    return (prefix ? prefix + ' ' : '') + url;
  }

  function toWhatsAppUrl(text) {
    return 'https://wa.me/?text=' + encodeURIComponent(text);
  }

  function setWaLink(id, text) {
    var el = document.getElementById(id);
    if (!el) return;
    el.href = toWhatsAppUrl(text);
  }

  setWaLink('waHome', makeShareText('Paz pra sua noite. 🙏 Versículo + louvor:'));
  setWaLink('waDormir', makeShareText('Deixa tocando e descanse em paz. 🙏'));
  setWaLink('waOracao', makeShareText('Oração da noite + louvor. 🙏'));
  setWaLink('waPost', makeShareText('Uma palavra e um louvor para o seu coração. 🙏'));

  function copy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', 'true');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    return Promise.resolve();
  }

  function extractYouTubeId(input) {
    if (!input) return '';
    var s = String(input).trim();
    if (!s) return '';

    if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;

    try {
      var url = new URL(s);
      if (url.hostname === 'youtu.be') {
        var p = url.pathname.replace(/^\/+/, '').split('/')[0];
        if (/^[a-zA-Z0-9_-]{11}$/.test(p)) return p;
      }

      if (url.hostname.indexOf('youtube.com') !== -1 || url.hostname.indexOf('m.youtube.com') !== -1) {
        var v = url.searchParams.get('v');
        if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;

        var parts = url.pathname.split('/').filter(Boolean);
        var idx = parts.indexOf('shorts');
        if (idx !== -1 && parts[idx + 1] && /^[a-zA-Z0-9_-]{11}$/.test(parts[idx + 1])) return parts[idx + 1];
        idx = parts.indexOf('embed');
        if (idx !== -1 && parts[idx + 1] && /^[a-zA-Z0-9_-]{11}$/.test(parts[idx + 1])) return parts[idx + 1];
      }
    } catch (_) {
      return '';
    }

    var m = s.match(/(?:v=|\/shorts\/|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (m && m[1]) return m[1];

    return '';
  }

  function applyVideoOverrides() {
    var params = new URLSearchParams(window.location.search || '');
    var iframes = document.querySelectorAll('iframe[src*="SEU_VIDEO_ID_"]');
    for (var i = 0; i < iframes.length; i++) {
      var iframe = iframes[i];
      var src = iframe.getAttribute('src') || '';
      var match = src.match(/SEU_VIDEO_ID_(\d+)/);
      if (!match) continue;
      var n = match[1];

      var candidate =
        params.get('v' + n) ||
        params.get('yt' + n) ||
        params.get('video' + n) ||
        params.get('v') ||
        params.get('yt') ||
        params.get('video') ||
        '';

      var id = extractYouTubeId(candidate);
      if (!id) continue;

      var newSrc = src.replace('SEU_VIDEO_ID_' + n, id);
      iframe.setAttribute('src', newSrc);

      var links = document.querySelectorAll('a[href*="SEU_VIDEO_ID_' + n + '"]');
      for (var j = 0; j < links.length; j++) {
        var a = links[j];
        a.setAttribute('href', (a.getAttribute('href') || '').replace('SEU_VIDEO_ID_' + n, id));
      }
    }
  }

  applyVideoOverrides();

  document.addEventListener('click', function (e) {
    var target = e.target;
    if (!(target instanceof HTMLElement)) return;

    var btn = target.closest('button[data-copy]');
    if (btn) {
      var value = btn.getAttribute('data-value') || '';
      if (value === '{PAGE_URL}') value = getFullUrl();
      if (value.indexOf('{PAGE_URL}') !== -1) value = value.replaceAll('{PAGE_URL}', getFullUrl());
      copy(value).then(function () {
        var old = btn.textContent;
        btn.textContent = 'Copiado!';
        setTimeout(function () { btn.textContent = old; }, 1200);
      });
      return;
    }

    var shareBtn = target.closest('[data-wa-text]');
    if (shareBtn) {
      var t = shareBtn.getAttribute('data-wa-text') || '';
      if (t.indexOf('{PAGE_URL}') !== -1) t = t.replaceAll('{PAGE_URL}', getFullUrl());
      window.open(toWhatsAppUrl(t), '_blank', 'noreferrer');
    }
  });

  var q = document.getElementById('postSearch');
  if (q) {
    q.addEventListener('input', function () {
      var value = (q.value || '').toLowerCase().trim();
      var cards = document.querySelectorAll('[data-post-card]');
      for (var i = 0; i < cards.length; i++) {
        var el = cards[i];
        var hay = (el.getAttribute('data-search') || '').toLowerCase();
        var show = !value || hay.indexOf(value) !== -1;
        el.style.display = show ? '' : 'none';
      }
    });
  }
})();
