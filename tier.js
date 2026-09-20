/* =====================================================================
   ТИРЛИСТЫ — интерфейс

   Три экрана: выбор списка, доска с зумом, аналитика карты.
   Подключать после script.js (нужны userId, API_BASE, authHeaders, tg).
   ===================================================================== */

(function (global) {
    'use strict';

    var meta = null;        // /api/tier/lists
    var current = null;     // текущий тирлист
    var currentCard = null; // карта в аналитике

    function api(path, options) {
        return fetch(API_BASE + '/api/tier/' + path,
            Object.assign({
                headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders())
            }, options || {})
        ).then(function (r) { return r.json(); });
    }

    function haptic(kind) {
        try {
            if (!tg.HapticFeedback) return;
            if (kind === 'ok') tg.HapticFeedback.notificationOccurred('success');
            else tg.HapticFeedback.impactOccurred(kind || 'light');
        } catch (e) {}
    }

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    /* =====================  ЭКРАН ВЫБОРА  ===================== */

    global.openTierScreen = async function () {
        var el = document.getElementById('tierScreen');
        if (!el) return;
        el.classList.add('open');
        if (typeof manageBack === 'function') manageBack();
        haptic('medium');

        var body = document.getElementById('tierPickBody');
        body.innerHTML = '<div class="ta-chart-empty">Загрузка…</div>';

        try {
            meta = await api('lists/' + userId);
        } catch (e) {
            body.innerHTML = '<div class="ta-chart-empty">Не удалось загрузить тирлисты</div>';
            return;
        }
        if (!meta.success) return;

        body.innerHTML = meta.lists.map(function (l) {
            var prev = (l.preview || []).map(function (f) {
                return '<img src="images/' + esc(f) + '" loading="lazy" ' +
                       'onerror="this.style.visibility=\'hidden\'">';
            }).join('');
            return '' +
              '<div class="tier-pick" style="--pc:' + esc(l.accent) + '" ' +
              'onclick="openTierBoard(\'' + esc(l.key) + '\')">' +
                '<div class="tier-pick-top">' +
                  '<div class="tier-pick-ico">' + l.icon + '</div>' +
                  '<div style="flex:1;min-width:0">' +
                    '<div class="tier-pick-name">' + esc(l.title) + '</div>' +
                    '<div class="tier-pick-desc">' + esc(l.subtitle) + '</div>' +
                  '</div>' +
                  '<div class="tier-pick-count">' + l.count + '</div>' +
                '</div>' +
                '<div class="tier-pick-preview">' + prev + '</div>' +
              '</div>';
        }).join('');
    };

    global.closeTierScreen = function () {
        var el = document.getElementById('tierScreen');
        if (el) el.classList.remove('open');
        if (typeof manageBack === 'function') manageBack();
    };

    /* =====================  ДОСКА  ===================== */

    global.openTierBoard = async function (key) {
        var body = document.getElementById('tierPickBody');
        body.innerHTML = '<div class="ta-chart-empty">Загрузка…</div>';
        haptic('light');

        try {
            current = await api('list/' + userId + '?key=' + encodeURIComponent(key));
        } catch (e) {
            body.innerHTML = '<div class="ta-chart-empty">Ошибка загрузки</div>';
            return;
        }
        if (!current.success) {
            body.innerHTML = '<div class="ta-chart-empty">' + esc(current.error || 'Ошибка') + '</div>';
            return;
        }

        document.getElementById('tierTitle').innerText = current.title;
        document.getElementById('tierSub').innerText = current.subtitle;
        document.getElementById('tierBackBtn').setAttribute('onclick', 'backToTierPicks()');

        body.innerHTML =
            '<div class="tier-board-wrap">' +
              '<div class="tier-viewport" id="tierViewport">' +
                '<div class="tier-canvas smooth" id="tierCanvas">' + boardHtml(current) + '</div>' +
              '</div>' +
              '<div class="tier-hint">Два пальца — масштаб</div>' +
              '<div class="tier-zoom">' +
                '<button onclick="tierZoom(0.25)">+</button>' +
                '<div class="tier-zoom-val" id="tierZoomVal">100%</div>' +
                '<button onclick="tierZoom(-0.25)">−</button>' +
                '<button onclick="tierZoomReset()" style="font-size:13px">⤢</button>' +
              '</div>' +
            '</div>' +
            '<div class="tier-list-head"><b>Все карты · ' + current.all.length + '</b></div>' +
            '<input class="tier-search" id="tierSearch" placeholder="Поиск по названию" ' +
              'oninput="filterTierList(this.value)">' +
            '<div id="tierRows">' + rowsHtml(current.all) + '</div>';

        initZoom();
    };

    global.backToTierPicks = function () {
        document.getElementById('tierTitle').innerText = 'Тирлисты';
        document.getElementById('tierSub').innerText = 'Ценность карт по версии сообщества';
        document.getElementById('tierBackBtn').setAttribute('onclick', 'closeTierScreen()');
        current = null;
        global.openTierScreen();
    };

    function boardHtml(data) {
        return data.tiers.map(function (row) {
            var cards = row.cards.map(function (c) {
                return '' +
                  '<div class="tier-card" onclick="openTierCard(\'' + esc(c.id) + '\')">' +
                    '<img src="images/' + esc(c.file) + '" loading="lazy" decoding="async" ' +
                    'onerror="this.src=\'images/default.webp\'">' +
                    '<div class="tier-price">' + esc(c.price_short) + '</div>' +
                    '<div class="tier-card-name">' + esc(c.name) + '</div>' +
                  '</div>';
            }).join('');
            return '' +
              '<div class="tier-row">' +
                '<div class="tier-label" style="--tc:' + esc(row.color) + '">' +
                  row.tier + '<small>' + row.cards.length + '</small>' +
                '</div>' +
                '<div class="tier-cards">' + cards + '</div>' +
              '</div>';
        }).join('');
    }

    function rowsHtml(list) {
        var colors = { S: '#fbbf24', A: '#f472b6', B: '#a855f7', C: '#06b6d4', D: '#64748b' };
        return list.map(function (c) {
            return '' +
              '<button class="tier-row-btn" data-name="' + esc(c.name.toLowerCase()) + '" ' +
              'onclick="openTierCard(\'' + esc(c.id) + '\')">' +
                '<span class="tier-row-badge" style="--tc:' + (colors[c.tier] || '#a855f7') + '">' +
                  c.tier + '</span>' +
                '<span class="tier-row-info">' +
                  '<span class="tier-row-name">' + esc(c.name) + '</span>' +
                  '<span class="tier-row-stats">' + c.speed + ' / ' + c.strength + ' / ' + c.intellect + '</span>' +
                '</span>' +
                '<span class="tier-row-price">' + fmt(c.price) +
                  '<small>' + (current ? current.unit_icon : '') + '</small></span>' +
              '</button>';
        }).join('');
    }

    function fmt(p) {
        if (p == null) return '—';
        return (p === Math.floor(p)) ? String(p) : String(p);
    }

    global.filterTierList = function (q) {
        q = (q || '').trim().toLowerCase();
        var rows = document.querySelectorAll('#tierRows .tier-row-btn');
        for (var i = 0; i < rows.length; i++) {
            var name = rows[i].getAttribute('data-name') || '';
            rows[i].style.display = (!q || name.indexOf(q) !== -1) ? '' : 'none';
        }
    };

    /* ---------- Зум и перетаскивание ----------
       Свой обработчик вместо браузерного зума: страница не должна
       масштабироваться целиком, увеличивается только доска. */
    var zoom = { scale: 1, x: 0, y: 0, min: 0.5, max: 2.2 };
    var drag = null, pinch = null;

    function applyZoom(smooth) {
        var canvas = document.getElementById('tierCanvas');
        if (!canvas) return;
        canvas.classList.toggle('smooth', !!smooth);
        canvas.style.transform =
            'translate(' + zoom.x + 'px,' + zoom.y + 'px) scale(' + zoom.scale + ')';
        var val = document.getElementById('tierZoomVal');
        if (val) val.innerText = Math.round(zoom.scale * 100) + '%';
    }

    function clampPan() {
        var vp = document.getElementById('tierViewport');
        var canvas = document.getElementById('tierCanvas');
        if (!vp || !canvas) return;
        var w = canvas.offsetWidth * zoom.scale;
        var h = canvas.offsetHeight * zoom.scale;
        var minX = Math.min(0, vp.clientWidth - w);
        var minY = Math.min(0, vp.clientHeight - h);
        zoom.x = Math.max(minX, Math.min(0, zoom.x));
        zoom.y = Math.max(minY, Math.min(0, zoom.y));
    }

    function initZoom() {
        var vp = document.getElementById('tierViewport');
        if (!vp) return;

        zoom.scale = 1; zoom.x = 0; zoom.y = 0;
        applyZoom(false);

        vp.addEventListener('touchstart', function (e) {
            var c = document.getElementById('tierCanvas');
            if (c) c.classList.remove('smooth');
            if (e.touches.length === 2) {
                pinch = {
                    d: dist(e.touches),
                    scale: zoom.scale,
                    cx: (e.touches[0].clientX + e.touches[1].clientX) / 2,
                    cy: (e.touches[0].clientY + e.touches[1].clientY) / 2
                };
                drag = null;
            } else if (e.touches.length === 1) {
                drag = { x: e.touches[0].clientX - zoom.x, y: e.touches[0].clientY - zoom.y, moved: false };
            }
        }, { passive: true });

        vp.addEventListener('touchmove', function (e) {
            if (pinch && e.touches.length === 2) {
                e.preventDefault();
                var k = dist(e.touches) / pinch.d;
                var next = Math.max(zoom.min, Math.min(zoom.max, pinch.scale * k));
                var rect = vp.getBoundingClientRect();
                var ox = pinch.cx - rect.left, oy = pinch.cy - rect.top;
                // Точка под пальцами остаётся на месте
                zoom.x = ox - (ox - zoom.x) * (next / zoom.scale);
                zoom.y = oy - (oy - zoom.y) * (next / zoom.scale);
                zoom.scale = next;
                clampPan();
                applyZoom(false);
            } else if (drag && e.touches.length === 1) {
                // Двигаем только когда есть куда: иначе отдаём жест странице
                var canvas = document.getElementById('tierCanvas');
                if (!canvas) return;
                if (canvas.offsetHeight * zoom.scale <= vp.clientHeight &&
                    canvas.offsetWidth * zoom.scale <= vp.clientWidth) return;
                e.preventDefault();
                zoom.x = e.touches[0].clientX - drag.x;
                zoom.y = e.touches[0].clientY - drag.y;
                drag.moved = true;
                clampPan();
                applyZoom(false);
            }
        }, { passive: false });

        vp.addEventListener('touchend', function (e) {
            if (e.touches.length === 0) { pinch = null; drag = null; }
        }, { passive: true });

        // Колесо мыши для десктопа
        vp.addEventListener('wheel', function (e) {
            e.preventDefault();
            var next = Math.max(zoom.min, Math.min(zoom.max, zoom.scale * (e.deltaY < 0 ? 1.12 : 0.89)));
            var rect = vp.getBoundingClientRect();
            var ox = e.clientX - rect.left, oy = e.clientY - rect.top;
            zoom.x = ox - (ox - zoom.x) * (next / zoom.scale);
            zoom.y = oy - (oy - zoom.y) * (next / zoom.scale);
            zoom.scale = next;
            clampPan();
            applyZoom(false);
        }, { passive: false });
    }

    function dist(t) {
        var dx = t[0].clientX - t[1].clientX, dy = t[0].clientY - t[1].clientY;
        return Math.sqrt(dx * dx + dy * dy) || 1;
    }

    global.tierZoom = function (delta) {
        var vp = document.getElementById('tierViewport');
        if (!vp) return;
        var next = Math.max(zoom.min, Math.min(zoom.max, zoom.scale + delta));
        var ox = vp.clientWidth / 2, oy = vp.clientHeight / 2;
        zoom.x = ox - (ox - zoom.x) * (next / zoom.scale);
        zoom.y = oy - (oy - zoom.y) * (next / zoom.scale);
        zoom.scale = next;
        clampPan();
        applyZoom(true);
        haptic('light');
    };

    global.tierZoomReset = function () {
        zoom.scale = 1; zoom.x = 0; zoom.y = 0;
        applyZoom(true);
        haptic('light');
    };

    /* =====================  АНАЛИТИКА  ===================== */

    global.openTierCard = async function (cardId) {
        var el = document.getElementById('tierAnalytic');
        if (!el) return;
        el.classList.add('open');
        if (typeof manageBack === 'function') manageBack();
        haptic('medium');

        var body = document.getElementById('taBody');
        body.innerHTML = '<div class="ta-chart-empty">Загрузка…</div>';

        try {
            currentCard = await api('card/' + userId + '?card_id=' + encodeURIComponent(cardId));
        } catch (e) {
            body.innerHTML = '<div class="ta-chart-empty">Ошибка загрузки</div>';
            return;
        }
        if (!currentCard.success) {
            body.innerHTML = '<div class="ta-chart-empty">' + esc(currentCard.error) + '</div>';
            return;
        }
        renderAnalytic();
    };

    global.closeTierCard = function () {
        var el = document.getElementById('tierAnalytic');
        if (el) el.classList.remove('open');
        currentCard = null;
        if (typeof manageBack === 'function') manageBack();
    };

    function renderAnalytic() {
        var c = currentCard;
        var body = document.getElementById('taBody');

        var chg = '<div class="ta-change flat">—</div>';
        if (c.change_pct != null) {
            var cls = c.change_pct > 0 ? 'up' : (c.change_pct < 0 ? 'down' : 'flat');
            var sign = c.change_pct > 0 ? '+' : '';
            chg = '<div class="ta-change ' + cls + '">' + sign + c.change_pct + '%</div>';
        }

        body.innerHTML = '' +
          '<div class="ta-hero" style="--tc:' + esc(c.tier_color) + '">' +
            '<img src="images/' + esc(c.file) + '" onerror="this.src=\'images/default.webp\'">' +
            '<div class="ta-tier-flag">' + esc(c.tier) + '</div>' +
          '</div>' +
          '<div class="ta-name">' + esc(c.name) + '</div>' +
          '<div class="ta-series">' + esc(c.rarity) + (c.series ? ' · ' + esc(c.series) : '') + '</div>' +

          '<div class="ta-stats">' +
            statBox('⚡️', c.speed, 'Скорость') +
            statBox('💪', c.strength, 'Сила') +
            statBox('🧠', c.intellect, 'Интеллект') +
          '</div>' +

          '<div class="ta-price-box">' +
            '<div>' +
              '<div class="ta-price-lbl">' + esc(c.unit) + '</div>' +
              '<div class="ta-price-val">' + fmt(c.price) + ' ' + c.unit_icon + '</div>' +
            '</div>' + chg +
          '</div>' +

          '<div class="ta-chart-box">' +
            '<div class="ta-chart-title">История цены</div>' +
            chartHtml(c.history) +
            histRows(c.history) +
          '</div>' +

          voteHtml(c);
    }

    function statBox(ico, val, lbl) {
        return '<div class="ta-stat"><div class="ta-stat-ico">' + ico + '</div>' +
               '<div class="ta-stat-val">' + val + '</div>' +
               '<div class="ta-stat-lbl">' + lbl + '</div></div>';
    }

    /* График строится только когда есть хотя бы две точки:
       одна точка — это не история, а просто текущая цена */
    function chartHtml(hist) {
        if (!hist || hist.length < 2) {
            return '<div class="ta-chart-empty">Цена пока не менялась</div>';
        }
        var w = 300, h = 130, pad = 14;
        var vals = hist.map(function (p) { return p.price; });
        var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
        if (max === min) { max = min + 1; }

        var pts = hist.map(function (p, i) {
            var x = pad + (w - pad * 2) * (hist.length === 1 ? 0.5 : i / (hist.length - 1));
            var y = h - pad - (h - pad * 2) * ((p.price - min) / (max - min));
            return [x, y];
        });

        var line = pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ');
        var area = line + ' ' + pts[pts.length - 1][0].toFixed(1) + ',' + (h - pad) +
                   ' ' + pts[0][0].toFixed(1) + ',' + (h - pad);
        var dots = pts.map(function (p) {
            return '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) +
                   '" r="3.5" fill="#0b0a14" stroke="#a855f7" stroke-width="2"/>';
        }).join('');

        return '<svg class="ta-chart" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none">' +
                 '<defs><linearGradient id="taGrad" x1="0" y1="0" x2="0" y2="1">' +
                   '<stop offset="0%" stop-color="#a855f7" stop-opacity="0.35"/>' +
                   '<stop offset="100%" stop-color="#a855f7" stop-opacity="0"/>' +
                 '</linearGradient></defs>' +
                 '<polygon points="' + area + '" fill="url(#taGrad)"/>' +
                 '<polyline points="' + line + '" fill="none" stroke="#a855f7" ' +
                   'stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>' +
                 dots +
               '</svg>';
    }

    function histRows(hist) {
        if (!hist || !hist.length) return '';
        return hist.slice().reverse().slice(0, 6).map(function (p) {
            return '<div class="ta-hist-row"><span>' + esc((p.at || '').slice(0, 10)) + '</span>' +
                   '<span>' + fmt(p.price) + '</span></div>';
        }).join('');
    }

    function voteHtml(c) {
        var total = (c.up || 0) + (c.down || 0);
        var pctUp = total ? Math.round(c.up / total * 100) : 50;
        var bar = total
            ? '<div class="ta-vote-bar"><i class="yes" style="width:' + pctUp + '%"></i>' +
              '<i class="no" style="width:' + (100 - pctUp) + '%"></i></div>' +
              '<div class="ta-vote-pct"><span>Согласны ' + pctUp + '%</span>' +
              '<span>Не согласны ' + (100 - pctUp) + '%</span></div>'
            : '<div class="ta-vote-pct" style="justify-content:center">Оценок пока нет</div>';

        return '' +
          '<div class="ta-vote-box">' +
            '<div class="ta-vote-q">Вы согласны с этой ценой?</div>' +
            '<div class="ta-vote-hint">Оценка помогает держать тирлист актуальным</div>' +
            '<div class="ta-vote-btns">' +
              '<button class="ta-vote-btn up' + (c.my_vote === 1 ? ' on' : '') + '" ' +
                'onclick="voteTier(1)">👍 Да</button>' +
              '<button class="ta-vote-btn down' + (c.my_vote === -1 ? ' on' : '') + '" ' +
                'onclick="voteTier(-1)">👎 Нет</button>' +
            '</div>' + bar +
          '</div>';
    }

    global.voteTier = async function (vote) {
        if (!currentCard) return;
        var res;
        try {
            res = await api('vote/' + userId, {
                method: 'POST',
                body: JSON.stringify({ card_id: currentCard.id, vote: vote })
            });
        } catch (e) {
            return tg.showAlert('Не удалось отправить оценку');
        }
        if (!res.success) return tg.showAlert(res.error || 'Ошибка');

        currentCard.up = res.up;
        currentCard.down = res.down;
        currentCard.my_vote = res.my_vote;
        renderAnalytic();

        if (res.reward) {
            haptic('ok');
            tg.showAlert('Спасибо за оценку!\n+' + res.reward + ' KRW');
            if (typeof fetchProfile === 'function') fetchProfile();
        } else {
            haptic('light');
        }
    };

    global.isTierOpen = function () {
        var a = document.getElementById('tierAnalytic');
        var s = document.getElementById('tierScreen');
        return !!((a && a.classList.contains('open')) || (s && s.classList.contains('open')));
    };
})(window);
