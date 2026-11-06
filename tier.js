/* =====================================================================
   ТИРЛИСТЫ — интерфейс

   Три экрана: выбор списка, доска с зумом, аналитика карты.
   Подключать после script.js (нужны userId, API_BASE, authHeaders, tg).

   Про iOS. WebView в Telegram на iPhone жёстко ограничен по памяти,
   и при превышении процесс страницы просто убивается — это и есть
   «вылет». Поэтому здесь:
     • на доске грузятся миниатюры, а не полноразмерные арты;
     • зум сделан через CSS zoom + обычную прокрутку, а не через
       transform: scale — scale заставлял WebKit держать в памяти всю
       доску растром, умноженным на масштаб и плотность экрана;
     • при уходе с доски её DOM удаляется, картинки освобождаются.
   ===================================================================== */

(function (global) {
    'use strict';

    // Папка с миниатюрами (делаются скриптом make_thumbs.py).
    // Если миниатюр ещё нет, каждая картинка сама откатится на полный арт.
    var THUMB_DIR = 'images/thumbs/';

    var meta = null;        // /api/tier/lists
    var current = null;     // текущий тирлист
    var currentCard = null; // карта в аналитике
    var imgObserver = null;
    var closeTimer = null;

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

    function thumbSrc(file) { return (THUMB_DIR || 'images/') + file; }

    // Миниатюры нет — один раз пробуем полный арт, потом прячем
    global.tierImgFallback = function (img) {
        var full = img.getAttribute('data-full');
        if (full && img.getAttribute('src') !== full) {
            img.setAttribute('src', full);
        } else {
            img.onerror = null;
            img.style.visibility = 'hidden';
        }
    };

    function dropBoard() {
        if (imgObserver) { imgObserver.disconnect(); imgObserver = null; }
        var body = document.getElementById('tierPickBody');
        if (body) body.innerHTML = '';
        current = null;
    }

    function resetHead() {
        document.getElementById('tierTitle').innerText = 'Тирлисты';
        document.getElementById('tierSub').innerText = 'Ценность карт по версии сообщества';
        document.getElementById('tierBackBtn').setAttribute('onclick', 'closeTierScreen()');
    }

    /* =====================  ЭКРАН ВЫБОРА  ===================== */

    global.openTierScreen = async function () {
        var el = document.getElementById('tierScreen');
        if (!el) return;
        if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
        dropBoard();
        resetHead();
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
        if (!meta.success) {
            body.innerHTML = '<div class="ta-chart-empty">Не удалось загрузить тирлисты</div>';
            return;
        }

        body.innerHTML = meta.lists.map(function (l) {
            var prev = (l.preview || []).map(function (f) {
                return '<img src="' + esc(thumbSrc(f)) + '" data-full="images/' + esc(f) + '" ' +
                       'loading="lazy" decoding="async" alt="" onerror="tierImgFallback(this)">';
            }).join('');
            return '' +
              '<div class="tier-pick" style="--pc:' + esc(l.accent) + '" ' +
              'onclick="openTierBoard(\'' + esc(l.key) + '\')">' +
                '<div class="tier-pick-glow"></div>' +
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
        // После анимации выкидываем доску целиком, чтобы картинки
        // не висели в памяти, пока игрок листает каталог
        if (closeTimer) clearTimeout(closeTimer);
        closeTimer = setTimeout(function () {
            closeTimer = null;
            if (el && !el.classList.contains('open')) {
                dropBoard();
                resetHead();
            }
        }, 400);
    };

    /* =====================  ДОСКА  ===================== */

    global.openTierBoard = async function (key) {
        var body = document.getElementById('tierPickBody');
        body.innerHTML = '<div class="ta-chart-empty">Загрузка…</div>';
        haptic('light');

        var data;
        try {
            data = await api('list/' + userId + '?key=' + encodeURIComponent(key));
        } catch (e) {
            body.innerHTML = '<div class="ta-chart-empty">Ошибка загрузки</div>';
            return;
        }
        if (!data.success) {
            body.innerHTML = '<div class="ta-chart-empty">' + esc(data.error || 'Ошибка') + '</div>';
            return;
        }
        current = data;

        document.getElementById('tierTitle').innerText = current.title;
        document.getElementById('tierSub').innerText = current.subtitle;
        document.getElementById('tierBackBtn').setAttribute('onclick', 'backToTierPicks()');

        body.innerHTML =
            '<div class="tier-board-wrap">' +
              '<div class="tier-viewport" id="tierViewport">' +
                '<div class="tier-canvas" id="tierCanvas">' + boardHtml(current) + '</div>' +
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
        setupLazyImages();
    };

    global.backToTierPicks = function () {
        global.openTierScreen();
    };

    function boardHtml(data) {
        return data.tiers.map(function (row) {
            var cards = row.cards.map(function (c) {
                // src пустой: картинки подставляет lazy-загрузчик ниже
                return '' +
                  '<div class="tier-card" onclick="openTierCard(\'' + esc(c.id) + '\')">' +
                    '<img class="tier-img" data-src="' + esc(thumbSrc(c.file)) + '" ' +
                    'data-full="images/' + esc(c.file) + '" ' +
                    'decoding="async" alt="" onerror="tierImgFallback(this)">' +
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
              '<button class="tier-row-btn" data-name="' + esc(String(c.name).toLowerCase()) + '" ' +
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
        return p == null ? '—' : String(p);
    }

    global.filterTierList = function (q) {
        q = (q || '').trim().toLowerCase();
        var rows = document.querySelectorAll('#tierRows .tier-row-btn');
        for (var i = 0; i < rows.length; i++) {
            var name = rows[i].getAttribute('data-name') || '';
            rows[i].style.display = (!q || name.indexOf(q) !== -1) ? '' : 'none';
        }
    };

    /* Ленивая загрузка. Картинку грузим один раз и больше не трогаем:
       прежняя схема «убрать src, когда уехала» на iOS только заставляла
       WebKit декодировать одно и то же снова и снова. */
    function setupLazyImages() {
        var vp = document.getElementById('tierViewport');
        if (!vp) return;
        if (imgObserver) { imgObserver.disconnect(); imgObserver = null; }

        var imgs = vp.querySelectorAll('.tier-img');

        if (!('IntersectionObserver' in window)) {
            var i = 0;
            (function step() {
                if (!document.getElementById('tierViewport')) return;
                for (var n = 0; n < 8 && i < imgs.length; n++, i++) {
                    imgs[i].src = imgs[i].getAttribute('data-src');
                }
                if (i < imgs.length) setTimeout(step, 120);
            })();
            return;
        }

        imgObserver = new IntersectionObserver(function (entries, obs) {
            entries.forEach(function (en) {
                if (!en.isIntersecting) return;
                var img = en.target;
                img.src = img.getAttribute('data-src');
                obs.unobserve(img);
            });
        }, { root: vp, rootMargin: '200px', threshold: 0 });

        for (var k = 0; k < imgs.length; k++) imgObserver.observe(imgs[k]);
    }

    /* ---------- Зум ----------
       Масштабируем через CSS zoom: браузер просто перекладывает доску
       в новом размере и рисует её в родном разрешении. Панорама —
       обычная прокрутка окна доски одним пальцем, её делает система. */
    var zoom = { scale: 1, min: 0.6, max: 2.2 };
    var pinch = null, rafId = 0, pendingZoom = null, mouse = null;
    var globalsBound = false;

    function updateZoomLabel() {
        var val = document.getElementById('tierZoomVal');
        if (val) val.innerText = Math.round(zoom.scale * 100) + '%';
    }

    // ox, oy — точка внутри окна доски, которая должна остаться на месте
    function setZoom(next, ox, oy) {
        var vp = document.getElementById('tierViewport');
        var canvas = document.getElementById('tierCanvas');
        if (!vp || !canvas) return;
        next = Math.max(zoom.min, Math.min(zoom.max, next));
        var old = zoom.scale;
        if (Math.abs(next - old) < 0.001) return;

        var px = (vp.scrollLeft + ox) / old;
        var py = (vp.scrollTop + oy) / old;
        zoom.scale = next;
        canvas.style.zoom = next;
        vp.scrollLeft = px * next - ox;
        vp.scrollTop = py * next - oy;
        updateZoomLabel();
    }

    function queueZoom(next, ox, oy) {
        pendingZoom = [next, ox, oy];
        if (rafId) return;
        rafId = requestAnimationFrame(function () {
            rafId = 0;
            if (pendingZoom) setZoom(pendingZoom[0], pendingZoom[1], pendingZoom[2]);
            pendingZoom = null;
        });
    }

    function fitCanvasWidth() {
        var vp = document.getElementById('tierViewport');
        var canvas = document.getElementById('tierCanvas');
        if (!vp || !canvas) return;
        // Ширина в px, а не 100%: тогда zoom честно делает доску шире окна
        canvas.style.width = vp.clientWidth + 'px';
    }

    function initZoom() {
        var vp = document.getElementById('tierViewport');
        var canvas = document.getElementById('tierCanvas');
        if (!vp || !canvas) return;

        zoom.scale = 1;
        canvas.style.zoom = 1;
        fitCanvasWidth();
        updateZoomLabel();

        vp.addEventListener('touchstart', function (e) {
            if (e.touches.length === 2) {
                var r = vp.getBoundingClientRect();
                pinch = {
                    d: dist(e.touches),
                    scale: zoom.scale,
                    ox: (e.touches[0].clientX + e.touches[1].clientX) / 2 - r.left,
                    oy: (e.touches[0].clientY + e.touches[1].clientY) / 2 - r.top
                };
            }
        }, { passive: true });

        vp.addEventListener('touchmove', function (e) {
            if (!pinch || e.touches.length !== 2) return;
            e.preventDefault();
            queueZoom(pinch.scale * dist(e.touches) / pinch.d, pinch.ox, pinch.oy);
        }, { passive: false });

        vp.addEventListener('touchend', function (e) {
            if (e.touches.length < 2) pinch = null;
        }, { passive: true });

        // Старые iOS масштабируют страницу целиком мимо touch-action
        ['gesturestart', 'gesturechange'].forEach(function (ev) {
            vp.addEventListener(ev, function (e) { e.preventDefault(); }, { passive: false });
        });

        // Десктоп: Ctrl + колесо (и щипок на тачпаде) — зум, просто колесо — прокрутка
        vp.addEventListener('wheel', function (e) {
            if (!e.ctrlKey) return;
            e.preventDefault();
            var r = vp.getBoundingClientRect();
            queueZoom(zoom.scale * (e.deltaY < 0 ? 1.1 : 0.9), e.clientX - r.left, e.clientY - r.top);
        }, { passive: false });

        // Десктоп: перетаскивание мышью
        vp.addEventListener('mousedown', function (e) {
            if (e.button !== 0) return;
            mouse = { x: e.clientX, y: e.clientY, sl: vp.scrollLeft, st: vp.scrollTop, moved: false };
        });

        if (!globalsBound) {
            globalsBound = true;
            window.addEventListener('mousemove', function (e) {
                if (!mouse) return;
                var v = document.getElementById('tierViewport');
                if (!v) { mouse = null; return; }
                var dx = e.clientX - mouse.x, dy = e.clientY - mouse.y;
                if (Math.abs(dx) + Math.abs(dy) > 5) mouse.moved = true;
                v.scrollLeft = mouse.sl - dx;
                v.scrollTop = mouse.st - dy;
            });
            window.addEventListener('mouseup', function () {
                if (mouse && mouse.moved) {
                    // Гасим клик по карте после перетаскивания
                    var stop = function (ev) { ev.stopPropagation(); ev.preventDefault(); };
                    window.addEventListener('click', stop, { capture: true, once: true });
                    setTimeout(function () { window.removeEventListener('click', stop, true); }, 0);
                }
                mouse = null;
            });
            window.addEventListener('resize', fitCanvasWidth);
            window.addEventListener('orientationchange', function () { setTimeout(fitCanvasWidth, 200); });
        }
    }

    function dist(t) {
        var dx = t[0].clientX - t[1].clientX, dy = t[0].clientY - t[1].clientY;
        return Math.sqrt(dx * dx + dy * dy) || 1;
    }

    global.tierZoom = function (delta) {
        var vp = document.getElementById('tierViewport');
        if (!vp) return;
        setZoom(zoom.scale + delta, vp.clientWidth / 2, vp.clientHeight / 2);
        haptic('light');
    };

    global.tierZoomReset = function () {
        var vp = document.getElementById('tierViewport');
        if (!vp) return;
        setZoom(1, 0, 0);
        vp.scrollLeft = 0;
        vp.scrollTop = 0;
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
        // Освобождаем крупный арт после анимации
        setTimeout(function () {
            if (el && !el.classList.contains('open')) {
                var body = document.getElementById('taBody');
                if (body) body.innerHTML = '';
            }
        }, 400);
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
            '<img src="images/' + esc(c.file) + '" decoding="async" alt="" ' +
            'onerror="this.onerror=null;this.src=\'images/default.webp\'">' +
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
            var x = pad + (w - pad * 2) * (i / (hist.length - 1));
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
        if (!currentCard) return;

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