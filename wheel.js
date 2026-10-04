/* =====================================================================
   КОЛЕСО УДАЧИ

   Результат определяет СЕРВЕР. Клиент только докручивает барабан
   до присланного индекса — подменить выигрыш из консоли нельзя.

   Подключать после script.js (нужны userId, API_BASE, authHeaders, tg).
   ===================================================================== */

(function (global) {
    'use strict';

    /* Порядок секторов по кругу. Он ДОЛЖЕН совпадать с WHEEL_PRIZES
       в main.py — сервер присылает индекс из этого же списка.
       Крупные призы расставлены вразбивку, чтобы колесо читалось. */
    var WHEEL_PRIZES = [
        { type: 'bc',  amount: 1000, color: '#fbbf24', icon: '🪙' },
        { type: 'bc',  amount: 75,   color: '#475569', icon: '🪙' },
        { type: 'bc',  amount: 250,  color: '#8b5cf6', icon: '🪙' },
        { type: 'dia', amount: 2,    color: '#06b6d4', icon: '💎' },
        { type: 'bc',  amount: 500,  color: '#f59e0b', icon: '🪙' },
        { type: 'bc',  amount: 100,  color: '#64748b', icon: '🪙' },
        { type: 'bc',  amount: 350,  color: '#a855f7', icon: '🪙' },
        { type: 'dia', amount: 5,    color: '#22d3ee', icon: '💎' },
        { type: 'bc',  amount: 200,  color: '#7c3aed', icon: '🪙' },
        { type: 'dia', amount: 4,    color: '#0ea5e9', icon: '💎' }
    ];

    var SPIN_COST = 400;
    var COUNT = WHEEL_PRIZES.length;
    var STEP = 360 / COUNT;
    var CX = 150, CY = 150, R = 142;

    var rotation = 0;      // накопленный угол, наружу не сбрасывается
    var isSpinning = false;
    var balance = 0;
    var built = false;

    // Бесплатный спин раз в 7 дней после прошлого бесплатного (считает сервер)
    var freeAvailable = false;
    var nextFreeAt = 0;     // Date.now()-метка, когда спин снова станет бесплатным
    var freeTimer = null;

    /* ---------- Отрисовка ---------- */

    function polar(angleDeg, radius) {
        var rad = (angleDeg - 90) * Math.PI / 180;
        return { x: CX + radius * Math.cos(rad), y: CY + radius * Math.sin(rad) };
    }

    function sectorPath(index) {
        // Сектор index центрируется на угле index*STEP, чтобы нулевой
        // сектор в покое стоял ровно под стрелкой.
        var from = index * STEP - STEP / 2;
        var to = index * STEP + STEP / 2;
        var a = polar(from, R);
        var b = polar(to, R);
        var large = (STEP > 180) ? 1 : 0;
        return 'M' + CX + ',' + CY +
               ' L' + a.x.toFixed(2) + ',' + a.y.toFixed(2) +
               ' A' + R + ',' + R + ' 0 ' + large + ',1 ' + b.x.toFixed(2) + ',' + b.y.toFixed(2) + ' Z';
    }

    function buildWheel() {
        var rotor = document.getElementById('wheelRotor');
        if (!rotor) return;

        var svg = '';

        for (var i = 0; i < COUNT; i++) {
            var p = WHEEL_PRIZES[i];
            // Чётные сектора чуть темнее — круг читается даже при близких цветах
            var fill = (i % 2 === 0) ? p.color : shade(p.color, -0.22);

            svg += '<path d="' + sectorPath(i) + '" fill="' + fill + '"' +
                   ' stroke="rgba(0,0,0,0.35)" stroke-width="1"/>';

            svg += '<g transform="rotate(' + (i * STEP) + ' ' + CX + ' ' + CY + ')">' +
                   '<text class="wheel-sector-label" x="' + CX + '" y="46"' +
                   ' text-anchor="middle">' + p.amount + '</text>' +
                   '<text class="wheel-sector-label wheel-sector-icon" x="' + CX + '" y="64"' +
                   ' text-anchor="middle">' + p.icon + '</text>' +
                   '</g>';
        }

        rotor.innerHTML = svg;
        built = true;
    }

    // Затемнение/осветление hex-цвета
    function shade(hex, amount) {
        var n = parseInt(hex.slice(1), 16);
        var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
        var mix = function (c) {
            return Math.max(0, Math.min(255, Math.round(c + 255 * amount)));
        };
        return 'rgb(' + mix(r) + ',' + mix(g) + ',' + mix(b) + ')';
    }

    /* ---------- Баланс ---------- */

    function renderBalance() {
        var el = document.getElementById('wheelBalVal');
        var btn = document.getElementById('wheelSpinBtn');
        if (el) el.innerText = balance.toLocaleString('ru-RU');
        if (btn) {
            var poor = balance < SPIN_COST;
            btn.disabled = isSpinning || (!freeAvailable && poor);
            btn.innerText = isSpinning ? 'Крутим…'
                : freeAvailable ? 'Крутить бесплатно 🎁'
                : poor ? 'Не хватает BattleCoin'
                : 'Крутить за ' + SPIN_COST + ' 🪙';
        }
        renderHint();
    }

    /* ---------- Бесплатный спин ---------- */

    function formatLeft(ms) {
        var min = Math.max(1, Math.ceil(ms / 60000));
        var d = Math.floor(min / 1440);
        var h = Math.floor((min % 1440) / 60);
        var m = min % 60;
        if (d > 0) return d + ' д ' + h + ' ч';
        if (h > 0) return h + ' ч ' + m + ' мин';
        return m + ' мин';
    }

    function renderHint() {
        var el = document.getElementById('wheelHint');
        if (!el) return;
        if (freeAvailable) {
            el.innerText = 'Бесплатный спин доступен — следующий через 7 дней';
        } else if (nextFreeAt) {
            el.innerText = 'Бесплатный спин через ' + formatLeft(nextFreeAt - Date.now());
        }
    }

    // Мигающие точки на кнопке магазина и на табе «Колесо»
    function renderFreeDots() {
        ['navShopBtn', 'tabShopWheelBtn'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.classList.toggle('has-free-spin', freeAvailable);
        });
    }

    function applyFreeState(data) {
        if (typeof data.free_available === 'boolean') freeAvailable = data.free_available;
        if (typeof data.next_free_in === 'number') nextFreeAt = Date.now() + data.next_free_in * 1000;
        renderFreeDots();

        // Если приложение открыто, когда пройдут 7 дней, — перезапросим состояние,
        // и точка загорится сама, без перезахода.
        clearTimeout(freeTimer);
        if (!freeAvailable && nextFreeAt) {
            var delay = Math.max(1000, nextFreeAt - Date.now() + 2000);
            if (delay < 2147483647) freeTimer = setTimeout(loadState, delay);
        }
    }

    async function loadState() {
        if (!built) buildWheel();
        if (isSpinning) return;
        if (typeof userId === 'undefined' || !userId) return;
        try {
            var res = await fetch(API_BASE + '/api/wheel_state/' + userId, { headers: authHeaders() });
            var data = await res.json();
            if (data.success) {
                balance = data.battlecoin;
                applyFreeState(data);
                renderBalance();
            }
        } catch (e) {
            console.error('Колесо: не удалось получить состояние', e);
        }
    }

    /* ---------- Вращение ---------- */

    async function spin() {
        if (isSpinning) return;
        if (!freeAvailable && balance < SPIN_COST) return;

        isSpinning = true;
        renderBalance();
        document.querySelector('.wheel-wrap').classList.add('spinning');
        if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');

        var data;
        try {
            var res = await fetch(API_BASE + '/api/wheel_spin/' + userId, {
                method: 'POST',
                headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders())
            });
            data = await res.json();
        } catch (e) {
            stopSpin();
            tg.showAlert('Ошибка соединения с сервером');
            return;
        }

        if (!data.success) {
            stopSpin();
            tg.showAlert(data.error || 'Не удалось прокрутить колесо');
            return;
        }

        balance = data.battlecoin;
        applyFreeState(data);   // точки гаснут сразу, как только спин потрачен

        // Докручиваем до сектора, который назвал сервер.
        // Небольшой разброс внутри сектора — чтобы стрелка не била в центр.
        var jitter = (Math.random() - 0.5) * (STEP * 0.72);
        var turns = 6 + Math.floor(Math.random() * 2);
        rotation += turns * 360 + (360 - (data.index * STEP)) % 360 - (rotation % 360) + jitter;

        var rotor = document.getElementById('wheelRotor');
        rotor.style.transform = 'rotate(' + rotation + 'deg)';

        startTicks();

        setTimeout(function () {
            stopSpin();
            renderBalance();
            showPrize(data);
            if (typeof fetchProfile === 'function') fetchProfile();
        }, 5700);
    }

    function stopSpin() {
        isSpinning = false;
        var wrap = document.querySelector('.wheel-wrap');
        if (wrap) wrap.classList.remove('spinning');
        renderBalance();
    }

    /* Пощёлкивание стрелки: интервал растёт, имитируя торможение */
    function startTicks() {
        var pointer = document.querySelector('.wheel-pointer');
        if (!pointer) return;

        var elapsed = 0;
        var gap = 60;

        (function tick() {
            if (elapsed > 5500) return;
            pointer.classList.remove('tick');
            void pointer.offsetWidth; // перезапуск анимации
            pointer.classList.add('tick');
            if (tg.HapticFeedback && tg.HapticFeedback.selectionChanged) {
                tg.HapticFeedback.selectionChanged();
            }
            elapsed += gap;
            gap = gap * 1.13 + 4;
            setTimeout(tick, gap);
        })();
    }

    /* ---------- Окно выигрыша ---------- */

    function showPrize(data) {
        var prize = WHEEL_PRIZES[data.index] || WHEEL_PRIZES[0];
        var overlay = document.getElementById('wheelPrizeOverlay');
        var card = document.getElementById('wheelPrizeCard');
        if (!overlay || !card) return;

        card.style.setProperty('--pc', prize.color);
        document.getElementById('wheelPrizeIcon').innerText = prize.icon;
        document.getElementById('wheelPrizeAmount').innerText =
            '+' + prize.amount + ' ' + (prize.type === 'dia' ? '💎' : '🪙');
        document.getElementById('wheelPrizeKicker').innerText =
            prize.type === 'dia' ? 'Редкая награда'
            : data.free ? 'Бесплатный спин'
            : 'Награда получена';

        overlay.classList.add('open');

        if (tg.HapticFeedback) {
            tg.HapticFeedback.notificationOccurred(prize.type === 'dia' ? 'success' : 'warning');
        }
    }

    function closePrize() {
        var overlay = document.getElementById('wheelPrizeOverlay');
        if (overlay) overlay.classList.remove('open');
    }

    /* ---------- Старт ---------- */

    // Состояние грузим сразу при запуске приложения, а не только при
    // открытии колеса — иначе точка на навигации никогда не появится.
    function boot() {
        loadState();
        setInterval(renderHint, 30000);   // обратный отсчёт в подсказке
    }

    // Вернулись в приложение (могли пройти 7 дней) — обновляемся
    document.addEventListener('visibilitychange', function () {
        if (!document.hidden) loadState();
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

    global.initWheel = loadState;
    global.spinWheel = spin;
    global.closeWheelPrize = closePrize;
})(window);
