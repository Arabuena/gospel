(function () {
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  function getFullUrl() {
    var origin = window.location.origin;
    if (origin && origin !== 'null') {
      return origin + window.location.pathname.replace(/index\.html$/i, '');
    }
    var meta = document.querySelector('meta[name="site:base"]');
    var content = meta && meta.getAttribute('content');
    if (content && /^https?:\/\//i.test(content)) return content.replace(/\/+$/, '') + window.location.pathname.replace(/index\.html$/i, '');
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

  function parseCsv(text) {
    var rows = [];
    var row = [];
    var field = '';
    var inQuotes = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') {
            field += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          field += c;
        }
        continue;
      }
      if (c === '"') {
        inQuotes = true;
        continue;
      }
      if (c === ',') {
        row.push(field);
        field = '';
        continue;
      }
      if (c === '\r') continue;
      if (c === '\n') {
        row.push(field);
        field = '';
        if (row.length > 1 || row[0]) rows.push(row);
        row = [];
        continue;
      }
      field += c;
    }
    row.push(field);
    if (row.length > 1 || row[0]) rows.push(row);
    return rows;
  }

  function toInt(v) {
    var n = parseInt(String(v || '').replace(/[^\d-]/g, ''), 10);
    return isFinite(n) ? n : 0;
  }

  function cleanTitle(title) {
    var t = String(title || '').trim();
    if (!t) return '';
    t = t.replace(/#[^\s]+/g, '').replace(/\s+/g, ' ').trim();
    return t;
  }

  function chooseCtaHref(index) {
    return index % 2 === 0 ? '/dormir/' : '/oracao/';
  }

  function buildShortCard(item, index) {
    var card = document.createElement('div');
    card.className = 'card';
    card.setAttribute('data-post-card', '');
    card.setAttribute('data-search', 'shorts versículo do dia biblia');

    var kicker = document.createElement('div');
    kicker.className = 'kicker';
    kicker.textContent = 'Short';

    var h = document.createElement('h2');
    h.className = 'h2';
    h.textContent = cleanTitle(item.title) || 'Versículo do dia';

    var aThumb = document.createElement('a');
    aThumb.className = 'thumb r9x16';
    aThumb.href = 'https://www.youtube.com/shorts/' + item.id;
    aThumb.target = '_blank';
    aThumb.rel = 'noreferrer';

    var img = document.createElement('img');
    img.loading = 'lazy';
    img.src = 'https://i.ytimg.com/vi/' + item.id + '/hqdefault.jpg';
    img.alt = 'Capa do Short';

    var play = document.createElement('div');
    play.className = 'play';
    play.textContent = '▶';

    var label = document.createElement('div');
    label.className = 'label';
    label.textContent = 'Abrir Short';

    aThumb.appendChild(img);
    aThumb.appendChild(play);
    aThumb.appendChild(label);

    var cta = document.createElement('div');
    cta.className = 'cta-row';

    var aLong = document.createElement('a');
    aLong.className = 'btn primary';
    aLong.href = chooseCtaHref(index);
    aLong.textContent = 'Ouça completo';

    var aShort = document.createElement('a');
    aShort.className = 'btn';
    aShort.href = aThumb.href;
    aShort.target = '_blank';
    aShort.rel = 'noreferrer';
    aShort.textContent = 'Abrir Short';

    cta.appendChild(aLong);
    cta.appendChild(aShort);

    card.appendChild(kicker);
    card.appendChild(h);
    card.appendChild(aThumb);
    card.appendChild(cta);

    return card;
  }

  function loadCsvFeed() {
    var containers = document.querySelectorAll('[data-feed][data-csv]');
    if (!containers.length) return;

    function tryFetchCsv(urls, idx) {
      if (idx >= urls.length) return Promise.reject(new Error('No CSV source available'));
      var url = urls[idx];
      return fetch(encodeURI(url)).then(function (r) {
        if (r.ok) return r.text();
        return tryFetchCsv(urls, idx + 1);
      }).catch(function () {
        return tryFetchCsv(urls, idx + 1);
      });
    }

    for (var i = 0; i < containers.length; i++) {
      (function (container) {
        var csvUrl = container.getAttribute('data-csv') || '';
        if (!csvUrl) return;
        var csvUrls = csvUrl.split(';').map(function (s) { return String(s || '').trim(); }).filter(Boolean);
        if (!csvUrls.length) return;
        var limit = toInt(container.getAttribute('data-limit') || '10') || 10;
        var feed = (container.getAttribute('data-feed') || '').toLowerCase().trim();

        tryFetchCsv(csvUrls, 0)
          .then(function (text) {
            var rows = parseCsv(text);
            if (!rows.length) return;
            var header = rows[0];
            var idxId = header.indexOf('Conteúdo');
            var idxTitle = header.indexOf('Título do vídeo');
            var idxDate = header.indexOf('Horário de publicação do vídeo');
            var idxDur = header.indexOf('Duração');
            var idxViews = header.indexOf('Visualizações');

            var items = [];
            for (var r = 1; r < rows.length; r++) {
              var row = rows[r];
              var id = (row[idxId] || '').trim();
              if (!id || id.toLowerCase() === 'total') continue;
              if (id.length !== 11) continue;
              var title = (row[idxTitle] || '').trim();
              var dateStr = (row[idxDate] || '').replace(/^"|"$/g, '').trim();
              var dur = toInt(row[idxDur]);
              var views = toInt(row[idxViews]);
              var published = Date.parse(dateStr);
              items.push({ id: id, title: title, dateStr: dateStr, published: isNaN(published) ? 0 : published, duration: dur, views: views });
            }

            if (feed === 'shorts') {
              items = items.filter(function (x) { return x.duration > 0 && x.duration <= 60; });
              items.sort(function (a, b) { return (b.published || 0) - (a.published || 0) || b.views - a.views; });
              items = items.slice(0, limit);
              container.innerHTML = '';
              for (var k = 0; k < items.length; k++) container.appendChild(buildShortCard(items[k], k));
              return;
            }
          })
          .catch(function () {});
      })(containers[i]);
    }
  }

  loadCsvFeed();

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
