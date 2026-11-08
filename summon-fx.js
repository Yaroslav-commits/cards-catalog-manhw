/* =====================================================================
   ОТКРЫТИЕ КРУТОК — сцена призыва
   Режимы:
     auto   — портал, вылет карт, карты переворачиваются сами;
     manual — то же, но игрок сам тапает по картам;
     fast   — короткая вспышка и сразу итог.
   Портал «разгоняется» по ступеням редкости до цвета лучшей карты
   в призыве — по цвету уже видно, что выпало что-то сильное.
   Мифические и божественные показываются крупно.
   Стили — summon-fx.css. Запрос к серверу — executeSummon() в script.js.
   ===================================================================== */
(function () {
    'use strict';

    var TIERS = [
        { key: 'common',    name: 'Обычная',      c: '#e2e8f0', c2: '#94a3b8', back: 'back_common.png' },
        { key: 'rare',      name: 'Редкая',       c: '#fde047', c2: '#ca8a04', back: 'back_rare.png' },
        { key: 'epic',      name: 'Эпическая',    c: '#4ade80', c2: '#16a34a', back: 'back_epic.png' },
        { key: 'legendary', name: 'Легендарная',  c: '#60a5fa', c2: '#2563eb', back: 'back_legendary.png' },
        { key: 'mythic',    name: 'Мифическая',   c: '#f87171', c2: '#dc2626', back: 'back_mythic.png' },
        { key: 'divine',    name: 'Божественная', c: '#c084fc', c2: '#7c3aed', back: 'back_divine.png' }
    ];
    var NEUTRAL = { c: '#a78bfa', c2: '#6d28d9' };
    var MODES = ['auto', 'manual', 'fast'];
    var MODE_KEY = 'mc_summon_mode';

    function tierOf(rarity) {
        var r = String(rarity || '');
        if (r.indexOf('Божест') !== -1) return 5;
        if (r.indexOf('Мифич') !== -1) return 4;
        if (r.indexOf('Легенд') !== -1) return 3;
        if (r.indexOf('Эпич') !== -1) return 2;
        if (r.indexOf('Редк') !== -1) return 1;
        return 0;
    }
    function rgbOf(hex) {
        var n = parseInt(String(hex).replace('#', ''), 16) || 0;
        return ((n >> 16) & 255) + ', ' + ((n >> 8) & 255) + ', ' + (n & 255);
    }
    function lite() {
        return document.documentElement.classList.contains('perf-lite') ||
            !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }
    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }
    function fmt(n) { return (Number(n) || 0).toLocaleString('ru-RU'); }
    function sound(name, arg) { try { if (window.MCSound) window.MCSound.play(name, arg); } catch (e) {} }
    function haptic(kind) { try { if (typeof mcHaptic === 'function') mcHaptic(kind); } catch (e) {} }
    function plural(n, f) {
        n = Math.abs(n) % 100;
        var n1 = n % 10;
        if (n > 10 && n < 20) return f[2];
        if (n1 > 1 && n1 < 5) return f[1];
        if (n1 === 1) return f[0];
        return f[2];
    }
    function previewSrc(file) {
        return 'images/preview/' + String(file || '').replace(/\.[^.\/]+$/, '') + '.webp';
    }
    function fullSrc(file) {
        return 'images/' + String(file || '').replace(/\.jpe?g$/i, '.webp');
    }

    /* ---------------- Состояние ---------------- */
    var S = {
        built: false,
        open: false,
        mode: 'auto',
        phase: 'idle',
        token: 0,
        cards: [],
        tiers: [],
        best: 0,
        revealed: 0,
        dataReady: false,
        skipCharge: false,
        chargeStart: 0,
        timers: [],
        autoOn: false,
        spot: null,
        spotted: {},
        amount: 0,
        attemptsLeft: null
    };
    try { var saved = localStorage.getItem(MODE_KEY); if (MODES.indexOf(saved) !== -1) S.mode = saved; } catch (e) {}

    var el = {};

    function later(fn, ms) {
        var tok = S.token;
        var id = setTimeout(function () { if (tok === S.token && S.open) fn(); }, ms);
        S.timers.push(id);
        return id;
    }
    function clearTimers() {
        S.timers.forEach(clearTimeout);
        S.timers = [];
    }

    /* ---------------- Разметка ---------------- */
    var SIGIL = '<svg viewBox="0 0 200 200" fill="none" stroke="currentColor">' +
        '<circle cx="100" cy="100" r="96" stroke-width="1"/>' +
        '<circle cx="100" cy="100" r="86" stroke-width="0.6" stroke-dasharray="2 6"/>' +
        '<path d="M100 8 L180 146 L20 146 Z" stroke-width="0.9"/>' +
        '<path d="M100 192 L20 54 L180 54 Z" stroke-width="0.9"/>' +
        '<circle cx="100" cy="100" r="54" stroke-width="0.7"/>' +
        '</svg>';

    function build() {
        if (S.built) return;
        S.built = true;
        var root = document.createElement('div');
        root.className = 'sx';
        root.id = 'sxScene';
        root.setAttribute('data-phase', 'idle');
        root.innerHTML =
            '<div class="sx-bg"></div>' +
            '<div class="sx-portal">' +
                '<div class="sx-sigil">' + SIGIL + '</div>' +
                '<div class="sx-vortex"></div><div class="sx-vortex b"></div>' +
                '<div class="sx-ring r3"></div><div class="sx-ring"></div><div class="sx-ring r2"></div>' +
                '<div class="sx-core"></div>' +
            '</div>' +
            '<div class="sx-wave"></div>' +
            '<div class="sx-flash"></div>' +
            '<div class="sx-hint">Нажми, чтобы ускорить</div>' +
            '<header class="sx-top">' +
                '<div class="sx-title"><div class="sx-kicker" id="sxKicker">Призыв</div><div class="sx-head" id="sxHead"></div></div>' +
                '<div class="sx-count" id="sxCount">0<small>/0</small></div>' +
                '<div class="sx-bar"><i id="sxBar"></i></div>' +
            '</header>' +
            '<div class="sx-stage" id="sxStage"><div class="sx-grid" id="sxGrid"></div></div>' +
            '<footer class="sx-bottom"><div class="sx-bottom-in">' +
                '<div class="sx-summary" id="sxSummary"></div>' +
                '<div class="sx-actions">' +
                    '<button class="sx-btn tint" id="sxAll" type="button"></button>' +
                    '<button class="sx-btn ghost" id="sxAgain" type="button" hidden></button>' +
                    '<button class="sx-btn main" id="sxClaim" type="button" hidden>Забрать</button>' +
                '</div>' +
            '</div></footer>' +
            '<div class="sx-spot" id="sxSpot"></div>' +
            '<canvas class="sx-fx" id="sxFx"></canvas>';
        document.body.appendChild(root);

        el.root = root;
        el.portal = root.querySelector('.sx-portal');
        el.flash = root.querySelector('.sx-flash');
        el.wave = root.querySelector('.sx-wave');
        el.stage = root.querySelector('#sxStage');
        el.grid = root.querySelector('#sxGrid');
        el.kicker = root.querySelector('#sxKicker');
        el.head = root.querySelector('#sxHead');
        el.count = root.querySelector('#sxCount');
        el.bar = root.querySelector('#sxBar');
        el.summary = root.querySelector('#sxSummary');
        el.all = root.querySelector('#sxAll');
        el.again = root.querySelector('#sxAgain');
        el.claim = root.querySelector('#sxClaim');
        el.spot = root.querySelector('#sxSpot');
        el.canvas = root.querySelector('#sxFx');

        root.addEventListener('click', onSceneClick);
        el.all.addEventListener('click', function (e) { e.stopPropagation(); onAllClick(); });
        el.claim.addEventListener('click', function (e) { e.stopPropagation(); close(); });
        el.again.addEventListener('click', function (e) { e.stopPropagation(); again(); });
        el.spot.addEventListener('click', function (e) { e.stopPropagation(); closeSpot(); });
        el.spot.addEventListener('pointermove', onSpotTilt);
        el.spot.addEventListener('pointerleave', function () { setTilt(0, 0); });

        window.addEventListener('resize', function () { if (S.open && S.cards.length && S.phase !== 'charge') layout(); });
        // Пересчёт и при любом изменении высоты сцены (панель Telegram, поворот экрана)
        if (window.ResizeObserver) {
            var lastH = 0;
            new ResizeObserver(function () {
                var h = el.stage.clientHeight;
                if (Math.abs(h - lastH) < 2) return;
                lastH = h;
                if (S.open && S.cards.length && S.phase !== 'charge') layout();
            }).observe(el.stage);
        }

        // Кнопка «Назад» Telegram: сначала закрывает крупный показ, потом сцену
        if (typeof MC_BACK_LAYERS !== 'undefined' && MC_BACK_LAYERS.unshift) {
            MC_BACK_LAYERS.unshift({
                open: function () { return S.open; },
                close: function () { if (S.spot) closeSpot(); else close(); }
            });
        }
    }

    function setPhase(p) {
        S.phase = p;
        el.root.setAttribute('data-phase', p);
    }
    function setColor(c, c2) {
        el.root.style.setProperty('--sx-c', c);
        el.root.style.setProperty('--sx-c2', c2);
        el.root.style.setProperty('--sx-rgb', rgbOf(c));
    }
    function backMgr() { try { if (typeof manageBack === 'function') manageBack(); } catch (e) {} }

    /* ---------------- Частицы (canvas) ---------------- */
    var P = { list: [], raf: 0, ctx: null, w: 0, h: 0, dpr: 1, suck: 0, suckRgb: '167, 139, 250', cx: 0, cy: 0, last: 0 };

    function pResize() {
        var c = el.canvas;
        P.dpr = Math.min(2, window.devicePixelRatio || 1);
        P.w = c.clientWidth;
        P.h = c.clientHeight;
        c.width = Math.round(P.w * P.dpr);
        c.height = Math.round(P.h * P.dpr);
        P.ctx = c.getContext('2d');
        P.ctx.setTransform(P.dpr, 0, 0, P.dpr, 0, 0);
    }
    function pCap() { return lite() ? 140 : 520; }
    function pPortalCenter() {
        var r = el.portal.getBoundingClientRect();
        P.cx = r.left + r.width / 2;
        P.cy = r.top + r.height / 2;
    }
    function pBurst(x, y, rgb, count, power, opts) {
        opts = opts || {};
        if (lite()) count = Math.ceil(count / 3);
        var cap = pCap();
        for (var i = 0; i < count && P.list.length < cap; i++) {
            var a = Math.random() * Math.PI * 2;
            var sp = power * (0.35 + Math.random() * 0.75);
            P.list.push({
                x: x, y: y,
                vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (opts.lift || 0),
                g: opts.g == null ? 0.06 : opts.g,
                drag: 0.965,
                life: 1,
                decay: 0.012 + Math.random() * 0.02,
                r: (opts.size || 2) * (0.6 + Math.random() * 0.9),
                rgb: Math.random() < 0.25 ? '255, 255, 255' : rgb
            });
        }
        pStart();
    }
    function pSuckSpawn() {
        var n = lite() ? 1 : 4;
        var R = Math.max(P.w, P.h) * 0.55;
        for (var i = 0; i < n && P.list.length < pCap(); i++) {
            var a = Math.random() * Math.PI * 2;
            var d = R * (0.45 + Math.random() * 0.55);
            P.list.push({
                suck: true,
                a: a, d: d,
                spin: 0.018 + Math.random() * 0.02,
                pull: 0.965 - Math.random() * 0.02,
                life: 1, decay: 0,
                r: 0.8 + Math.random() * 1.8,
                rgb: Math.random() < 0.3 ? '255, 255, 255' : P.suckRgb
            });
        }
    }
    function pStart() {
        if (P.raf) return;
        if (!P.ctx) pResize();
        P.last = 0;
        P.raf = requestAnimationFrame(pTick);
    }
    function pStop() {
        if (P.raf) cancelAnimationFrame(P.raf);
        P.raf = 0;
        P.list = [];
        P.suck = 0;
        if (P.ctx) P.ctx.clearRect(0, 0, P.w, P.h);
    }
    function pTick(t) {
        P.raf = 0;
        var dt = P.last ? Math.min(2.5, (t - P.last) / 16.67) : 1;
        P.last = t;
        var ctx = P.ctx;
        ctx.clearRect(0, 0, P.w, P.h);
        ctx.globalCompositeOperation = 'lighter';
        if (P.suck) pSuckSpawn();

        var keep = [];
        for (var i = 0; i < P.list.length; i++) {
            var p = P.list[i];
            var x, y, alpha;
            if (p.suck) {
                p.a += p.spin * dt;
                p.d *= Math.pow(p.pull, dt);
                x = P.cx + Math.cos(p.a) * p.d;
                y = P.cy + Math.sin(p.a) * p.d * 0.92;
                alpha = Math.min(1, p.d / 60) * 0.9;
                if (p.d < 14) continue;
            } else {
                p.vx *= Math.pow(p.drag, dt);
                p.vy = p.vy * Math.pow(p.drag, dt) + p.g * dt;
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.life -= p.decay * dt;
                if (p.life <= 0) continue;
                x = p.x; y = p.y; alpha = p.life;
            }
            ctx.fillStyle = 'rgba(' + p.rgb + ',' + (alpha * 0.18).toFixed(3) + ')';
            ctx.beginPath(); ctx.arc(x, y, p.r * 3.2, 0, 6.2832); ctx.fill();
            ctx.fillStyle = 'rgba(' + p.rgb + ',' + alpha.toFixed(3) + ')';
            ctx.beginPath(); ctx.arc(x, y, p.r, 0, 6.2832); ctx.fill();
            keep.push(p);
        }
        P.list = keep;
        ctx.globalCompositeOperation = 'source-over';
        if (P.list.length || P.suck) P.raf = requestAnimationFrame(pTick);
        else ctx.clearRect(0, 0, P.w, P.h);
    }

    /* ---------------- Открытие сцены ---------------- */
    function reset() {
        clearTimers();
        closeSpot(true);
        pStop();
        S.cards = []; S.tiers = []; S.best = 0; S.revealed = 0;
        S.dataReady = false; S.skipCharge = false; S.autoOn = false; S.spotted = {};
        el.grid.innerHTML = '';
        el.summary.innerHTML = '';
        el.root.classList.remove('fast', 'shake-s', 'shake-l');
        el.flash.classList.remove('go');
        el.wave.classList.remove('go');
        el.again.hidden = true;
        el.claim.hidden = true;
        el.all.hidden = true;
        el.bar.style.width = '0';
        setColor(NEUTRAL.c, NEUTRAL.c2);
    }

    // Вызывается сразу по нажатию «Открыть» — портал крутится, пока сервер отвечает
    function begin(mode, amount) {
        build();
        S.token++;
        reset();
        S.mode = MODES.indexOf(mode) !== -1 ? mode : S.mode;
        S.amount = amount || 0;
        S.open = true;
        S.chargeStart = Date.now();
        el.root.classList.add('open');
        el.root.classList.toggle('fast', S.mode === 'fast');
        el.kicker.textContent = 'Призыв · ' + ({ auto: 'Авто', manual: 'Вручную', fast: 'Быстро' })[S.mode];
        el.head.textContent = S.amount + ' ' + plural(S.amount, ['карта', 'карты', 'карт']);
        pResize();
        backMgr();

        if (S.mode === 'fast') {
            setPhase('burst');
            return;
        }
        setPhase('charge');
        pPortalCenter();
        P.suckRgb = rgbOf(NEUTRAL.c);
        P.suck = 1;
        pStart();
        sound('portal');
        haptic('medium');
    }

    // Ответ сервера
    function resolve(cards, info) {
        if (!S.open) return;
        info = info || {};
        S.cards = cards || [];
        S.tiers = S.cards.map(function (c) { return tierOf(c.rarity); });
        S.best = S.tiers.reduce(function (m, t) { return Math.max(m, t); }, 0);
        S.attemptsLeft = info.attemptsLeft == null ? null : info.attemptsLeft;
        S.dataReady = true;
        el.head.textContent = S.cards.length + ' ' + plural(S.cards.length, ['карта', 'карты', 'карт']);
        // Заранее качаем лёгкие превью, пока крутится портал
        S.cards.forEach(function (c) { var im = new Image(); im.decoding = 'async'; im.src = previewSrc(c.file); });

        if (S.mode === 'fast') { renderFast(); return; }
        escalate();
    }

    function fail() {
        if (!S.open) return;
        close(true);
    }

    /* ---------------- Разгон портала ---------------- */
    function escalate() {
        var tok = S.token;
        var stepMs = lite() ? 260 : 400;
        var minCharge = lite() ? 500 : 900;
        var waited = Date.now() - S.chargeStart;
        var startDelay = Math.max(0, minCharge - waited - S.best * stepMs * 0.5);
        if (S.skipCharge) return burst();

        var tier = -1;
        function step() {
            if (tok !== S.token || !S.open || S.phase !== 'charge') return;
            if (S.skipCharge) return burst();
            tier++;
            var T = TIERS[tier];
            setColor(T.c, T.c2);
            P.suckRgb = rgbOf(T.c);
            el.portal.classList.remove('kick');
            void el.portal.offsetWidth;
            el.portal.classList.add('kick');
            pPortalCenter();
            pBurst(P.cx, P.cy, rgbOf(T.c), 10 + tier * 8, 3 + tier, { g: 0 });
            haptic(tier >= 4 ? 'heavy' : tier >= 2 ? 'medium' : 'light');
            sound(tier >= 3 ? 'rumble' : 'open');
            if (tier >= S.best) {
                later(burst, S.best >= 4 ? 850 : S.best >= 3 ? 550 : 350);
                return;
            }
            later(step, stepMs);
        }
        later(step, startDelay);
    }

    function onSceneClick(e) {
        if (!S.open) return;
        if (S.phase === 'charge') {
            S.skipCharge = true;
            if (S.dataReady) burst();
            return;
        }
        var cardEl = e.target.closest && e.target.closest('.sx-card');
        if (!cardEl || S.phase === 'burst') return;
        var i = Number(cardEl.getAttribute('data-i'));
        if (cardEl.classList.contains('flipped')) {
            openSpot(i, 0, null);
        } else if (S.mode === 'manual' && S.phase === 'reveal') {
            revealCard(i, {}, null);
        }
    }

    /* ---------------- Взрыв и вылет карт ---------------- */
    function burst() {
        if (S.phase !== 'charge' || !S.dataReady) return;
        var T = TIERS[S.best];
        setColor(T.c, T.c2);
        setPhase('burst');
        P.suck = 0;
        clearTimers();

        el.flash.classList.remove('go'); el.wave.classList.remove('go');
        void el.flash.offsetWidth;
        el.flash.classList.add('go'); el.wave.classList.add('go');
        pPortalCenter();
        pBurst(P.cx, P.cy, rgbOf(T.c), 60 + S.best * 25, 7 + S.best, { g: 0.04, size: 2.2 });
        sound('whoosh');
        if (S.best >= 4) sound('thud');
        haptic('heavy');
        if (S.best >= 4) shake('l');

        buildCards(false);
        layout();
        flyIn();
    }

    function shake(kind) {
        var cls = kind === 'l' ? 'shake-l' : 'shake-s';
        el.root.classList.remove('shake-s', 'shake-l');
        void el.root.offsetWidth;
        el.root.classList.add(cls);
        later(function () { el.root.classList.remove(cls); }, 650);
    }

    function cardHtml(c, i, faceUp) {
        var t = S.tiers[i], T = TIERS[t];
        var tag = c.is_dup
            ? '<div class="sx-tag dup">ДУБЛЬ <b>+' + fmt(c.dup_reward) + ' ₩</b></div>'
            : '<div class="sx-tag new">НОВАЯ</div>';
        return '<div class="sx-card t' + t + (c.is_dup ? ' dup' : '') + (faceUp ? ' flipped in' : '') + '" data-i="' + i + '" ' +
                'style="--i:' + i + ';--tc:' + T.c + ';--trgb:' + rgbOf(T.c) + '">' +
            '<div class="sx-aura"></div>' +
            '<div class="sx-card-in">' +
                '<div class="sx-face sx-back" style="--back:url(\'images/' + T.back + '\')"></div>' +
                '<div class="sx-face sx-front">' +
                    '<img src="' + previewSrc(c.file) + '" data-fb="' + esc(fullSrc(c.file)) + '" alt="" decoding="async" onerror="mcImgFallback(this)">' +
                    tag +
                '</div>' +
            '</div>' +
        '</div>';
    }

    function buildCards(faceUp) {
        el.grid.innerHTML = S.cards.map(function (c, i) { return cardHtml(c, i, faceUp); }).join('');
        updateCount();
    }

    // Размер карт подбираем так, чтобы весь призыв помещался на экране.
    // Если экран совсем маленький — включаем прокрутку, но с запасом по краям.
    function layout() {
        var n = S.cards.length;
        if (!n) return;
        el.stage.classList.remove('scroll');
        var W = Math.min(el.stage.clientWidth - 40, 780);
        var H = el.stage.clientHeight - 48;
        var gap = n > 12 ? 8 : 10;
        var maxW = n === 1 ? 250 : n <= 4 ? 200 : n <= 9 ? 170 : 150;
        var best = { c: 1, w: 0 };
        for (var c = 1; c <= Math.min(n, 6); c++) {
            var rows = Math.ceil(n / c);
            var w = Math.min((W - gap * (c - 1)) / c, maxW);
            var needH = rows * w * 4 / 3 + gap * (rows - 1);
            if (needH > H) w = Math.min(w, ((H - gap * (rows - 1)) / rows) * 0.75);
            if (w > best.w + 0.5) best = { c: c, w: w };
        }
        if (best.w < 56) {
            var cc = Math.max(1, Math.min(n, Math.floor((W + gap) / (72 + gap))));
            best = { c: cc, w: Math.min((W - gap * (cc - 1)) / cc, maxW) };
            el.stage.classList.add('scroll');
        }
        var cw = Math.floor(best.w);
        el.grid.style.gridTemplateColumns = 'repeat(' + best.c + ', ' + cw + 'px)';
        el.root.style.setProperty('--sx-w', cw + 'px');
        el.root.style.setProperty('--sx-gap', gap + 'px');
    }

    function flyIn() {
        var cards = el.grid.querySelectorAll('.sx-card');
        var n = cards.length;
        var stepMs = n > 16 ? 32 : n > 8 ? 45 : 70;
        var dur = lite() ? 380 : 620;
        var portalX = P.cx, portalY = P.cy;
        Array.prototype.forEach.call(cards, function (card, i) {
            later(function () {
                var r = card.getBoundingClientRect();
                var dx = portalX - (r.left + r.width / 2);
                var dy = portalY - (r.top + r.height / 2);
                var rot = lite() ? 0 : (Math.random() * 60 - 30);
                card.classList.add('in');
                if (card.animate) {
                    card.animate([
                        { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(0.15) rotate(' + rot + 'deg)', opacity: 0 },
                        { opacity: 1, offset: 0.25 },
                        { transform: 'translate(0,0) scale(1.06) rotate(0deg)', offset: 0.8 },
                        { transform: 'none', opacity: 1 }
                    ], { duration: dur, easing: 'cubic-bezier(0.2, 0.8, 0.25, 1)' });
                }
                later(function () { sound('land'); if (i % 3 === 0) haptic('light'); }, dur * 0.8);
            }, i * stepMs);
        });
        later(startReveal, n * stepMs + dur + 120);
    }

    /* ---------------- Раскрытие ---------------- */
    function startReveal() {
        setPhase('reveal');
        el.all.hidden = false;
        el.all.className = 'sx-btn ' + (S.mode === 'auto' ? 'ghost' : 'tint');
        el.all.textContent = S.mode === 'auto' ? 'Пропустить' : 'Открыть все';
        if (S.mode === 'auto') el.all.style.flex = '1';
        else el.all.style.flex = '';
        if (S.mode === 'auto') runAuto();
    }

    function autoGap() {
        var n = S.cards.length;
        var base = n <= 3 ? 650 : n <= 8 ? 420 : n <= 16 ? 260 : 190;
        return lite() ? Math.round(base * 0.7) : base;
    }

    function runAuto() {
        S.autoOn = true;
        (function next() {
            if (!S.autoOn || !S.open) return;
            var i = nextHidden();
            if (i < 0) { S.autoOn = false; return; }
            revealCard(i, { auto: true }, function () { later(next, autoGap()); });
        })();
    }
    function nextHidden() {
        var cards = el.grid.children;
        for (var i = 0; i < cards.length; i++) if (!cards[i].classList.contains('flipped')) return i;
        return -1;
    }

    // opts.instant — без «заряда»; opts.noSpot — без крупного показа
    function revealCard(i, opts, done) {
        opts = opts || {};
        var card = el.grid.children[i];
        if (!card || card.classList.contains('flipped') || card.classList.contains('charging')) { if (done) done(); return; }
        var t = S.tiers[i];
        var charge = opts.instant ? 0 : t >= 5 ? 1050 : t >= 4 ? 780 : t >= 3 ? 380 : 0;
        if (lite()) charge = Math.round(charge * 0.6);

        if (charge) {
            card.classList.add('charging');
            haptic(t >= 4 ? 'heavy' : 'medium');
            if (t >= 4) sound('rumble');
            pRect(card, function (x, y) { pBurst(x, y, rgbOf(TIERS[t].c), 6 + t * 3, 1.5, { g: -0.02 }); });
        }
        later(function () { flip(i, card, t, opts, done); }, charge);
    }

    function pRect(card, fn) {
        var r = card.getBoundingClientRect();
        fn(r.left + r.width / 2, r.top + r.height / 2, r);
    }

    function flip(i, card, t, opts, done) {
        card.classList.remove('charging');
        card.classList.add('flipped');
        card.classList.remove('pop'); void card.offsetWidth; card.classList.add('pop');
        S.revealed++;
        updateCount();
        sound('flip');
        later(function () { sound('reveal', S.cards[i].rarity); }, 170);
        haptic(t >= 4 ? 'heavy' : t >= 2 ? 'medium' : 'light');

        later(function () {
            pRect(card, function (x, y, r) {
                pBurst(x, y, rgbOf(TIERS[t].c), 10 + t * 16, 2.2 + t * 0.9, { size: 1.6 + t * 0.25, lift: t >= 3 ? 1 : 0 });
            });
            if (t >= 2) {
                var ring = document.createElement('span');
                ring.className = 'sx-ring-hit';
                card.appendChild(ring);
                setTimeout(function () { ring.remove(); }, 750);
            }
            if (t >= 4) {
                shake('l');
                el.flash.classList.remove('go'); void el.flash.offsetWidth; el.flash.classList.add('go');
                haptic('success');
            } else if (t === 3) {
                shake('s');
            }
        }, 220);

        var finishCard = function () {
            if (S.revealed >= S.cards.length) later(finish, opts.auto ? 650 : 450);
            if (done) done();
        };
        if (t >= 4 && !opts.noSpot && !S.spotted[i]) {
            later(function () { openSpot(i, opts.auto ? 2600 : 0, finishCard); }, 520);
        } else {
            later(finishCard, 0);
        }
    }

    function onAllClick() {
        if (S.phase !== 'reveal') return;
        haptic('medium');
        S.autoOn = false;
        var hidden = [];
        Array.prototype.forEach.call(el.grid.children, function (c, i) {
            if (!c.classList.contains('flipped') && !c.classList.contains('charging')) hidden.push(i);
        });
        if (!hidden.length) return;
        el.all.hidden = true;
        // Лучшую ещё не показанную крупно мифическую/божественную — покажем в конце
        var star = -1;
        hidden.forEach(function (i) { if (S.tiers[i] >= 4 && !S.spotted[i] && (star < 0 || S.tiers[i] > S.tiers[star])) star = i; });
        var stepMs = hidden.length > 12 ? 45 : 80;
        hidden.forEach(function (i, k) {
            later(function () { revealCard(i, { instant: true, noSpot: true }, null); }, k * stepMs);
        });
        if (star >= 0) later(function () { if (!S.spot) openSpot(star, 0, null); }, hidden.length * stepMs + 500);
    }

    function updateCount() {
        var n = S.cards.length;
        el.count.innerHTML = S.revealed + '<small>/' + n + '</small>';
        el.bar.style.width = (n ? (S.revealed / n) * 100 : 0) + '%';
    }

    /* ---------------- Итог ---------------- */
    function finish() {
        if (S.phase === 'done' || !S.open) return;
        if (S.spot) { later(finish, 400); return; }
        setPhase('done');
        S.autoOn = false;
        el.all.hidden = true;

        var byTier = [0, 0, 0, 0, 0, 0], fresh = 0, dupKrw = 0;
        S.cards.forEach(function (c, i) {
            byTier[S.tiers[i]]++;
            if (c.is_dup) dupKrw += Number(c.dup_reward) || 0; else fresh++;
        });
        var chips = '';
        for (var t = 5; t >= 0; t--) {
            if (!byTier[t]) continue;
            chips += '<span class="sx-chip" style="--trgb:' + rgbOf(TIERS[t].c) + '"><i></i>' + TIERS[t].name + ' ×' + byTier[t] + '</span>';
        }
        chips += '<span class="sx-chip meta">Новых: <b>' + fresh + '</b></span>';
        if (dupKrw) chips += '<span class="sx-chip meta">За дубли: <b>+' + fmt(dupKrw) + ' ₩</b></span>';
        el.summary.innerHTML = chips;

        el.claim.hidden = false;
        var canAgain = S.attemptsLeft != null && S.amount > 0 && S.attemptsLeft >= S.amount;
        el.again.hidden = !canAgain;
        if (canAgain) el.again.innerHTML = 'Ещё ×' + S.amount + '<small>осталось ' + fmt(S.attemptsLeft) + '</small>';

        sound(S.best >= 3 ? 'success' : 'shine');
        haptic('success');
        el.kicker.textContent = 'Призыв завершён';
    }

    function renderFast() {
        var T = TIERS[S.best];
        setColor(T.c, T.c2);
        buildCards(true);
        layout();
        S.revealed = S.cards.length;
        updateCount();
        el.flash.classList.remove('go'); void el.flash.offsetWidth; el.flash.classList.add('go');
        sound('shine');
        haptic('medium');
        setPhase('reveal');
        var cards = el.grid.children;
        var stepMs = cards.length > 12 ? 22 : 40;
        Array.prototype.forEach.call(cards, function (card, i) {
            card.classList.remove('in');
            later(function () {
                card.classList.add('in');
                if (card.animate) {
                    card.animate([
                        { transform: 'translateY(16px) scale(0.85)', opacity: 0 },
                        { transform: 'none', opacity: 1 }
                    ], { duration: 320, easing: 'cubic-bezier(0.2, 0.9, 0.3, 1.2)' });
                }
                if (S.tiers[i] >= 3) {
                    later(function () {
                        pRect(card, function (x, y) { pBurst(x, y, rgbOf(TIERS[S.tiers[i]].c), 8 + S.tiers[i] * 8, 2 + S.tiers[i] * 0.6); });
                    }, 200);
                }
            }, i * stepMs);
        });
        later(finish, cards.length * stepMs + 380);
    }

    /* ---------------- Крупный показ ---------------- */
    function openSpot(i, autoMs, onClose) {
        var c = S.cards[i];
        if (!c) { if (onClose) onClose(); return; }
        if (S.spot) closeSpot(true);
        var t = S.tiers[i], T = TIERS[t];
        S.spotted[i] = true;
        S.spot = { onClose: onClose };
        el.spot.style.setProperty('--tr', rgbOf(T.c));
        var sub = c.is_dup
            ? '<span class="dup">Дубликат · <b>+' + fmt(c.dup_reward) + ' ₩</b></span>'
            : '<span class="new">Новая карта</span>';
        el.spot.innerHTML =
            '<div class="sx-spot-rays"></div>' +
            '<div class="sx-spot-stage">' +
                '<div class="sx-spot-rarity">' + T.name + '</div>' +
                '<div class="sx-spot-card"><div class="sx-spot-tilt">' +
                    '<img src="' + previewSrc(c.file) + '" data-fb="' + esc(fullSrc(c.file)) + '" alt="" onerror="mcImgFallback(this)">' +
                '</div></div>' +
                '<div class="sx-spot-name">' + esc(c.name) + '</div>' +
                '<div class="sx-spot-sub">' + sub + '</div>' +
                '<div class="sx-spot-tap">Нажми, чтобы продолжить</div>' +
            '</div>';
        el.spot.classList.remove('closing');
        el.spot.classList.add('open');

        // Пока игрок смотрит на превью, подгружаем оригинал в полном качестве
        var img = el.spot.querySelector('img');
        var hi = new Image();
        hi.onload = function () { if (img.isConnected) img.src = hi.src; };
        hi.src = fullSrc(c.file);

        if (t >= 4) {
            el.root.classList.remove('shake-l'); void el.root.offsetWidth; el.root.classList.add('shake-l');
            var r = el.spot.querySelector('.sx-spot-card').getBoundingClientRect();
            later(function () { pBurst(r.left + r.width / 2, r.top + r.height / 2, rgbOf(T.c), 70 + t * 20, 6 + t, { size: 2.4 }); }, 250);
        }
        sound(t >= 4 ? 'win' : 'shine');
        backMgr();
        if (autoMs) S.spot.timer = later(function () { closeSpot(); }, autoMs);
    }

    function closeSpot(silent) {
        if (!S.spot) return;
        var s = S.spot;
        S.spot = null;
        if (s.timer) clearTimeout(s.timer);
        if (silent) {
            el.spot.classList.remove('open', 'closing');
            el.spot.innerHTML = '';
        } else {
            el.spot.classList.add('closing');
            haptic('select');
            setTimeout(function () {
                if (S.spot) return;
                el.spot.classList.remove('open', 'closing');
                el.spot.innerHTML = '';
            }, 240);
        }
        backMgr();
        if (s.onClose && !silent) s.onClose();
    }

    function setTilt(rx, ry) {
        var t = el.spot.querySelector('.sx-spot-tilt');
        if (!t) return;
        t.style.setProperty('--rx', rx + 'deg');
        t.style.setProperty('--ry', ry + 'deg');
        t.style.setProperty('--hx', (50 - ry * 4) + '%');
    }
    function onSpotTilt(e) {
        var card = el.spot.querySelector('.sx-spot-card');
        if (!card) return;
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        setTilt((-py * 14).toFixed(1), (px * 18).toFixed(1));
    }

    /* ---------------- Закрытие и повтор ---------------- */
    function close(silent) {
        if (!S.open) return;
        S.token++;
        clearTimers();
        closeSpot(true);
        pStop();
        S.open = false;
        S.autoOn = false;
        setPhase('idle');
        el.root.classList.remove('open', 'shake-s', 'shake-l');
        if (!silent) haptic('select');
        backMgr();
    }

    function again() {
        if (typeof window.executeSummon !== 'function') return;
        haptic('medium');
        window.executeSummon(S.mode);
    }

    /* ---------------- Переключатель режимов в магазине ---------------- */
    function renderModes() {
        var box = document.getElementById('sxModes');
        if (!box) return;
        box.setAttribute('data-mode', S.mode);
        box.querySelectorAll('.sx-mode').forEach(function (b) {
            var on = b.getAttribute('data-mode') === S.mode;
            b.classList.toggle('active', on);
            b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
    }
    window.setSummonMode = function (mode) {
        if (MODES.indexOf(mode) === -1 || mode === S.mode) return;
        S.mode = mode;
        try { localStorage.setItem(MODE_KEY, mode); } catch (e) {}
        haptic('select');
        sound('tick');
        renderModes();
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', renderModes);
    else renderModes();

    window.SummonFX = {
        begin: begin,
        resolve: resolve,
        fail: fail,
        close: close,
        isOpen: function () { return S.open; },
        getMode: function () { return S.mode; },
        tierOf: tierOf
    };
})();
