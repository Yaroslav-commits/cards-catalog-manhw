/* =====================================================================
   MANHWCARD · SHOP ELITE EDITION + ПОДДЕРЖКА

   Подключать после script.js и wheel.js. Логику магазина не трогает:
   только наблюдает за элементами, которые обновляет script.js,
   и дорисовывает поверх них визуал.
   ===================================================================== */

(function () {
    'use strict';

    /* ⚙️  Юзернейм аккаунта поддержки в Telegram (без @).
       Можно также задать до подключения файла: window.MC_SUPPORT_USERNAME = '...'; */
    var SUPPORT_USERNAME = window.MC_SUPPORT_USERNAME || 'ManhwCardSupport';

    var tgApp = (window.Telegram && window.Telegram.WebApp) || null;
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function $(id) { return document.getElementById(id); }
    function num(t) {
        var n = parseInt(String(t == null ? '' : t).replace(/[^\d-]/g, ''), 10);
        return isNaN(n) ? 0 : n;
    }
    function fmt(n) { return Number(n).toLocaleString('ru-RU'); }

    function haptic(kind) {
        try {
            var h = tgApp && tgApp.HapticFeedback;
            if (!h) return;
            if (kind === 'sel') h.selectionChanged();
            else h.impactOccurred(kind || 'light');
        } catch (e) { /* старые клиенты */ }
    }

    // Следит за текстом элемента (его меняет script.js) и вызывает cb
    function watchText(el, cb) {
        if (!el) return;
        cb();
        new MutationObserver(cb).observe(el, { childList: true, characterData: true, subtree: true });
    }

    function restartAnim(el, cls) {
        el.classList.remove(cls);
        void el.offsetWidth;
        el.classList.add(cls);
    }

    /* ---------------- Кошелёк в шапке ---------------- */

    function mirror(srcId, dstId) {
        var src = $(srcId), dst = $(dstId);
        if (!src || !dst) return;
        var first = true;
        watchText(src, function () {
            var t = (src.textContent || '').trim() || '0';
            if (dst.textContent === t) return;
            dst.textContent = t;
            if (!first) restartAnim(dst, 'es-flash');
            first = false;
        });
    }

    /* ---------------- Табы: стеклянный ползунок ---------------- */

    var TABS = [
        { key: 'gacha',  tab: 'tabShopGachaBtn',  pane: 'shopGachaContent' },
        { key: 'wheel',  tab: 'tabShopWheelBtn',  pane: 'shopWheelContent' },
        { key: 'frames', tab: 'tabShopFramesBtn', pane: 'shopFramesContent' }
    ];

    function currentTabIndex() {
        var i;
        for (i = 0; i < TABS.length; i++) {
            var t = $(TABS[i].tab);
            if (t && t.classList.contains('active')) return i;
        }
        for (i = 0; i < TABS.length; i++) {
            var p = $(TABS[i].pane);
            if (p && p.style.display !== 'none') return i;
        }
        return 0;
    }

    function updateTabs() {
        var bar = $('esTabs');
        if (!bar) return;
        var i = currentTabIndex();
        bar.style.setProperty('--i', i);
        bar.setAttribute('data-tab', TABS[i].key);
        updatePromo();
    }

    function initTabs() {
        var mo = new MutationObserver(updateTabs);
        TABS.forEach(function (t) {
            var tab = $(t.tab), pane = $(t.pane);
            if (tab) mo.observe(tab, { attributes: true, attributeFilter: ['class'] });
            if (pane) mo.observe(pane, { attributes: true, attributeFilter: ['style'] });
            if (tab) tab.addEventListener('click', function () { haptic('sel'); });
        });
        updateTabs();
    }

    /* ---------------- Плашка «бесплатный спин» ---------------- */

    function updatePromo() {
        var promo = $('esFreePromo');
        var wheelTab = $('tabShopWheelBtn');
        if (!promo || !wheelTab) return;
        var free = wheelTab.classList.contains('has-free-spin');
        promo.hidden = !(free && TABS[currentTabIndex()].key !== 'wheel');
    }

    /* ---------------- Циферблат количества круток ---------------- */

    var DIAL_C = 2 * Math.PI * 50;
    var lastVal = null;

    function buildTicks(max) {
        var box = $('esDialTicks');
        if (!box || box.childElementCount) return;
        var html = '';
        for (var i = 0; i < max; i++) {
            html += '<i style="transform: rotate(' + (i * 360 / max) + 'deg)"></i>';
        }
        box.innerHTML = html;
    }

    function updateDial() {
        var valEl = $('gachaSliderVal');
        var slider = $('gachaSlider');
        if (!valEl || !slider) return;

        var min = num(slider.min) || 1;
        var max = num(slider.max) || 24;
        var v = Math.max(min, Math.min(max, num(valEl.textContent) || min));

        buildTicks(max);

        var fill = $('esDialFill');
        if (fill) fill.style.strokeDashoffset = (DIAL_C * (1 - v / max)).toFixed(2);

        var ticks = $('esDialTicks');
        if (ticks) {
            for (var i = 0; i < ticks.children.length; i++) {
                ticks.children[i].classList.toggle('on', i < v);
            }
        }

        slider.style.setProperty('--fill', ((v - min) / (max - min || 1) * 100) + '%');

        if (lastVal !== null && v !== lastVal) {
            restartAnim(valEl, 'es-pop');
            haptic('sel');
        }
        lastVal = v;
        updateAfter();
    }

    /* ---------------- Сколько попыток останется ---------------- */

    function updateAfter() {
        var balEl = $('shopAttemptsBal');
        var costEl = $('summonCostText');
        var out = $('esAfter');
        var box = document.querySelector('#tab-shop .es-cost');
        if (!balEl || !costEl || !out || !box) return;

        var bal = num(balEl.textContent);
        var cost = num(costEl.textContent);
        var short = cost - bal;

        if (short > 0) {
            out.textContent = 'не хватает ' + fmt(short);
            box.classList.add('not-enough');
        } else {
            out.textContent = fmt(bal - cost);
            box.classList.remove('not-enough');
        }
    }

    /* ---------------- Лампочки по ободу колеса ---------------- */

    function buildBulbs() {
        var g = $('esBulbs');
        if (!g || g.childElementCount) return;
        var NS = 'http://www.w3.org/2000/svg';
        var n = 24, r = 146.5;
        for (var i = 0; i < n; i++) {
            var a = (i / n) * Math.PI * 2;
            var c = document.createElementNS(NS, 'circle');
            c.setAttribute('cx', (150 + r * Math.sin(a)).toFixed(2));
            c.setAttribute('cy', (150 - r * Math.cos(a)).toFixed(2));
            c.setAttribute('r', '2.4');
            c.setAttribute('class', 'es-bulb ' + (i % 2 ? 'b-b' : 'b-a'));
            g.appendChild(c);
        }
    }

    /* ---------------- Искры на главных кнопках ---------------- */

    var SPARK_COLORS = ['#fff1c2', '#f3c969', '#c4b5fd', '#ffffff', '#67e8f9'];

    function burst(btn) {
        if (reduceMotion || !btn || btn.disabled) return;
        var r = btn.getBoundingClientRect();
        var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        for (var i = 0; i < 16; i++) {
            var s = document.createElement('span');
            var ang = Math.random() * Math.PI * 2;
            var dist = 50 + Math.random() * 70;
            s.className = 'es-spark';
            s.style.left = cx + 'px';
            s.style.top = cy + 'px';
            s.style.setProperty('--tx', (Math.cos(ang) * dist).toFixed(1) + 'px');
            s.style.setProperty('--ty', (Math.sin(ang) * dist * 0.7).toFixed(1) + 'px');
            s.style.setProperty('--c', SPARK_COLORS[i % SPARK_COLORS.length]);
            document.body.appendChild(s);
            setTimeout(s.remove.bind(s), 900);
        }
    }

    function initBursts() {
        ['btnFullSummon', 'wheelSpinBtn', 'btnQuickSummon'].forEach(function (id) {
            var b = $(id);
            if (b) b.addEventListener('pointerdown', function () { burst(b); });
        });
    }

    /* ---------------- Лёгкий наклон портала за пальцем ---------------- */

    function initTilt() {
        var portal = $('esPortal');
        var orbit = portal && portal.querySelector('.es-orbit');
        if (!portal || !orbit || reduceMotion) return;
        portal.addEventListener('pointermove', function (e) {
            var r = portal.getBoundingClientRect();
            var x = (e.clientX - r.left) / r.width - 0.5;
            var y = (e.clientY - r.top) / r.height - 0.5;
            orbit.style.setProperty('--ry', (x * 18).toFixed(1) + 'deg');
            orbit.style.setProperty('--rx', (-y * 18).toFixed(1) + 'deg');
        });
        portal.addEventListener('pointerleave', function () {
            orbit.style.setProperty('--ry', '0deg');
            orbit.style.setProperty('--rx', '0deg');
        });
    }

    /* ---------------- Звёздное небо ---------------- */

    function initStars() {
        var canvas = $('esStars');
        var shop = $('tab-shop');
        if (!canvas || !shop || !canvas.getContext) return;

        var ctx = canvas.getContext('2d');
        var dpr = Math.min(2, window.devicePixelRatio || 1);
        var W = 0, H = 0, stars = [], meteor = null, raf = 0, running = false;
        var TINTS = ['255,255,255', '255,255,255', '255,241,194', '196,181,253', '165,243,252'];

        function resize() {
            W = canvas.clientWidth;
            H = canvas.clientHeight;
            if (!W || !H) return;
            canvas.width = Math.round(W * dpr);
            canvas.height = Math.round(H * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            var count = Math.min(220, Math.round(W * H / 2400));
            stars = [];
            for (var i = 0; i < count; i++) {
                stars.push({
                    x: Math.random() * W,
                    y: Math.random() * H,
                    r: Math.random() < 0.08 ? 1.3 + Math.random() * 0.7 : 0.3 + Math.random() * 0.9,
                    sp: 0.0006 + Math.random() * 0.0018,
                    ph: Math.random() * Math.PI * 2,
                    d: 0.05 + Math.random() * 0.25,
                    c: TINTS[(Math.random() * TINTS.length) | 0]
                });
            }
        }

        function draw(t) {
            ctx.clearRect(0, 0, W, H);
            var sy = window.scrollY || 0;

            for (var i = 0; i < stars.length; i++) {
                var s = stars[i];
                var a = reduceMotion ? 0.7 : 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * s.sp + s.ph));
                var y = ((s.y - sy * s.d) % H + H) % H;
                ctx.fillStyle = 'rgba(' + s.c + ',' + a.toFixed(3) + ')';
                ctx.beginPath();
                ctx.arc(s.x, y, s.r, 0, 6.2832);
                ctx.fill();
                if (s.r > 1.25) {
                    ctx.strokeStyle = 'rgba(' + s.c + ',' + (a * 0.45).toFixed(3) + ')';
                    ctx.lineWidth = 0.6;
                    ctx.beginPath();
                    ctx.moveTo(s.x - s.r * 4, y); ctx.lineTo(s.x + s.r * 4, y);
                    ctx.moveTo(s.x, y - s.r * 4); ctx.lineTo(s.x, y + s.r * 4);
                    ctx.stroke();
                }
            }

            // Падающая звезда — изредка
            if (!reduceMotion) {
                if (!meteor && Math.random() < 0.004) {
                    meteor = { x: W * (0.4 + Math.random() * 0.6), y: H * Math.random() * 0.45, vx: -(6 + Math.random() * 4), vy: 2.5 + Math.random() * 2, life: 1 };
                }
                if (meteor) {
                    var tx = meteor.x - meteor.vx * 12, ty = meteor.y - meteor.vy * 12;
                    var g = ctx.createLinearGradient(meteor.x, meteor.y, tx, ty);
                    g.addColorStop(0, 'rgba(255,255,255,' + meteor.life + ')');
                    g.addColorStop(1, 'rgba(255,241,194,0)');
                    ctx.strokeStyle = g;
                    ctx.lineWidth = 1.4;
                    ctx.beginPath();
                    ctx.moveTo(meteor.x, meteor.y);
                    ctx.lineTo(tx, ty);
                    ctx.stroke();
                    meteor.x += meteor.vx;
                    meteor.y += meteor.vy;
                    meteor.life -= 0.012;
                    if (meteor.life <= 0 || meteor.x < -80 || meteor.y > H + 80) meteor = null;
                }
            }

            raf = requestAnimationFrame(draw);
        }

        function sync() {
            var should = shop.classList.contains('active') && !document.hidden;
            if (should && !running) {
                running = true;
                resize();
                raf = requestAnimationFrame(draw);
            } else if (!should && running) {
                running = false;
                cancelAnimationFrame(raf);
            }
        }

        new MutationObserver(sync).observe(shop, { attributes: true, attributeFilter: ['class'] });
        document.addEventListener('visibilitychange', sync);
        window.addEventListener('resize', function () { if (running) resize(); });
        sync();
    }

    /* =================================================================
       ПОДДЕРЖКА
       ================================================================= */

    function playerId() {
        try {
            if (typeof userId !== 'undefined' && userId) return String(userId);
        } catch (e) { /* userId не объявлен */ }
        var u = tgApp && tgApp.initDataUnsafe && tgApp.initDataUnsafe.user;
        return u && u.id ? String(u.id) : '—';
    }

    function copyText(text) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return legacyCopy(text); });
            }
        } catch (e) { /* падаем на запасной способ */ }
        return Promise.resolve(legacyCopy(text));
    }

    function legacyCopy(text) {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        var ok = false;
        try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
        ta.remove();
        return ok;
    }

    var toastTimer = null;
    function toast(title, text) {
        var el = $('toast');
        if (!el) return;
        var t = $('toastTitle'), d = $('toastText');
        if (t) t.textContent = title;
        if (d) d.textContent = text || '';
        el.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2600);
    }

    function openLink(url) {
        try {
            if (tgApp && typeof tgApp.openTelegramLink === 'function') {
                tgApp.openTelegramLink(url);
                return;
            }
        } catch (e) { /* откроем обычным способом */ }
        window.open(url, '_blank');
    }

    function openSupport() {
        var sheet = $('supportSheet');
        if (!sheet) {
            // Шторки нет в разметке — сразу ведём в чат поддержки
            openLink('https://t.me/' + SUPPORT_USERNAME);
            return;
        }
        var idEl = $('esSupId');
        if (idEl) idEl.textContent = playerId();
        sheet.classList.add('open');
        haptic('light');
    }

    function closeSupport() {
        var sheet = $('supportSheet');
        if (sheet) sheet.classList.remove('open');
    }

    function contactSupport(topic) {
        var text = 'Здравствуйте! ' + (topic ? 'Тема: ' + topic + '. ' : '') + 'Мой ID в ManhwCard: ' + playerId() + '\n\n';
        copyText(text).then(function (ok) {
            if (ok) toast('Шаблон скопирован', 'Вставьте его в чат поддержки');
        });
        haptic('medium');
        openLink('https://t.me/' + SUPPORT_USERNAME);
    }

    function copySupportId() {
        copyText(playerId()).then(function (ok) {
            toast(ok ? 'ID скопирован' : 'Не удалось скопировать', ok ? playerId() : 'Скопируйте вручную');
        });
        haptic('light');
    }

    // Назначаем глобально — перекрывает старую нерабочую версию из script.js
    window.openSupport = openSupport;
    window.closeSupport = closeSupport;
    window.contactSupport = contactSupport;
    window.esCopySupportId = copySupportId;

    /* ---------------- Запуск ---------------- */

    function boot() {
        mirror('valKrw', 'esWalKrw');
        mirror('valDiamond', 'esWalDia');
        mirror('valBc', 'esWalBc');
        mirror('shopAttemptsBal', 'esWalTix');

        initTabs();

        var wheelTab = $('tabShopWheelBtn');
        if (wheelTab) new MutationObserver(updatePromo).observe(wheelTab, { attributes: true, attributeFilter: ['class'] });

        watchText($('gachaSliderVal'), updateDial);
        watchText($('summonCostText'), updateAfter);
        watchText($('shopAttemptsBal'), updateAfter);
        var slider = $('gachaSlider');
        if (slider) slider.addEventListener('input', updateDial);

        buildBulbs();
        initBursts();
        initTilt();
        initStars();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
