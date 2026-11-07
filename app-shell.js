/* =====================================================================
   APP SHELL
   1. Telegram: полноэкранный режим, безопасные зоны, цвета шапки.
   2. Лёгкая графика: включается сама, если устройство не тянет эффекты,
      или вручную переключателем на главной.
   Стили к этому файлу — app-shell.css.
   ===================================================================== */
(function () {
    'use strict';

    var root = document.documentElement;
    var tg = window.Telegram && window.Telegram.WebApp;
    var BG = '#06060c';

    function atLeast(v) {
        try { return !!(tg && tg.isVersionAtLeast && tg.isVersionAtLeast(v)); } catch (e) { return false; }
    }
    function safe(fn) { try { fn(); } catch (e) {} }

    /* ---------------- 1. TELEGRAM ---------------- */

    // Отступы, которые занимает сам телефон (вырез, полоска «домой»)
    // и кнопки Telegram поверх приложения в fullscreen («Закрыть/Назад», «⋯»).
    // Пишем их в CSS-переменные, а вёрстка уже сама отступает.
    function px(v) { v = Number(v) || 0; return (v > 0 ? Math.round(v) : 0) + 'px'; }

    var platform = tg ? String(tg.platform || '').toLowerCase() : '';
    var isPhone = platform === 'ios' || platform === 'android' || platform === 'android_x';
    var isDesktop = platform === 'tdesktop' || platform === 'macos';

    // Высота строки кнопок Telegram («Закрыть», «⌄ ⋯») в fullscreen на телефоне.
    // Некоторые версии Telegram присылают её как 0 — тогда берём стандартную.
    var PHONE_BUTTONS_H = 46;

    function applyInsets() {
        if (!tg) return;
        var sa = tg.safeAreaInset || {};
        var ca = tg.contentSafeAreaInset || {};
        var cat = Number(ca.top) || 0;
        if (isPhone && tg.isFullscreen && cat < 30) cat = PHONE_BUTTONS_H;
        root.style.setProperty('--tg-sat', px(sa.top));
        root.style.setProperty('--tg-sab', px(sa.bottom));
        root.style.setProperty('--tg-sal', px(sa.left));
        root.style.setProperty('--tg-sar', px(sa.right));
        root.style.setProperty('--tg-cat', px(cat));
        root.style.setProperty('--tg-cab', px(ca.bottom));
        root.classList.toggle('tg-fullscreen', !!tg.isFullscreen);
    }

    if (tg) {
        root.classList.add('in-telegram');
        root.classList.add('tg-' + String(tg.platform || 'unknown').toLowerCase());

        // Шапка и фон Telegram в цвет приложения — без белых полос при открытии
        safe(function () { if (atLeast('6.1')) { tg.setHeaderColor(BG); tg.setBackgroundColor(BG); } });
        safe(function () { if (atLeast('7.10') && tg.setBottomBarColor) tg.setBottomBarColor(BG); });

        // В fullscreen свайп вниз сворачивает приложение — при прокрутке вверх
        // это срабатывает случайно. Закрыть всё равно можно кнопкой Telegram.
        safe(function () { if (atLeast('7.7') && tg.disableVerticalSwipes) tg.disableVerticalSwipes(); });

        applyInsets();
        safe(function () {
            ['safeAreaChanged', 'contentSafeAreaChanged', 'fullscreenChanged', 'viewportChanged'].forEach(function (ev) {
                tg.onEvent(ev, applyInsets);
            });
        });
        // Некоторые клиенты присылают отступы с небольшой задержкой
        setTimeout(applyInsets, 300);
        setTimeout(applyInsets, 1200);

        // Телефоны: открываемся во весь экран сами — не зависим от настройки
        // в BotFather (там fullscreen можно выключить, чтобы он не включался на ПК)
        safe(function () {
            if (isPhone && atLeast('8.0') && tg.requestFullscreen && !tg.isFullscreen) tg.requestFullscreen();
        });

        // Компьютер: Telegram Desktop на Windows с масштабом экрана (125–150%)
        // иногда ставит окно fullscreen со сдвигом — часть приложения уезжает
        // за край монитора. Если окно не помещается на экран, выходим из
        // fullscreen в обычное окно: там вёрстка для ПК работает как надо.
        var fixedPlacement = false;
        function windowOffScreen() {
            var s = window.screen;
            if (!s || !s.availWidth) return false;
            var x = typeof window.screenX === 'number' ? window.screenX : window.screenLeft;
            var y = typeof window.screenY === 'number' ? window.screenY : window.screenTop;
            var w = window.outerWidth || window.innerWidth;
            var h = window.outerHeight || window.innerHeight;
            if (typeof x !== 'number' || !w) return false;
            var left = s.availLeft || 0, top = s.availTop || 0;
            // Запас на панель задач: fullscreen может перекрывать её
            var tolX = (s.width - s.availWidth) + 16;
            var tolY = (s.height - s.availHeight) + 16;
            return x < left - tolX || x + w > left + s.availWidth + tolX ||
                   y < top - tolY || y + h > top + s.availHeight + tolY;
        }
        function checkDesktopPlacement() {
            if (!isDesktop || fixedPlacement || !tg.isFullscreen || !tg.exitFullscreen) return;
            if (!windowOffScreen()) return;
            fixedPlacement = true;
            safe(function () { tg.exitFullscreen(); });
        }
        if (isDesktop) {
            setTimeout(checkDesktopPlacement, 400);
            setTimeout(checkDesktopPlacement, 1500);
            safe(function () { tg.onEvent('fullscreenChanged', function () { setTimeout(checkDesktopPlacement, 400); }); });
        }
    }

    // Затемнение под кнопками Telegram: контент уходит под него при прокрутке
    function addScrim() {
        if (document.querySelector('.app-top-scrim')) return;
        var scrim = document.createElement('div');
        scrim.className = 'app-top-scrim';
        scrim.setAttribute('aria-hidden', 'true');
        document.body.appendChild(scrim);

        var backdrop = document.createElement('div');
        backdrop.className = 'app-backdrop';
        backdrop.setAttribute('aria-hidden', 'true');
        document.body.insertBefore(backdrop, document.body.firstChild);
    }
    if (document.body) addScrim();
    else document.addEventListener('DOMContentLoaded', addScrim);

    /* ---------------- 2. ЛЁГКАЯ ГРАФИКА ---------------- */
    // mc_lite: '1' — включил игрок, '0' — выключил игрок,
    //          'auto' — включилась сама, null — ещё не решено.
    var KEY = 'mc_lite';
    function readPref() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
    function writePref(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

    function setLite(on, reason) {
        on = !!on;
        var was = root.classList.contains('perf-lite');
        root.classList.toggle('perf-lite', on);
        window.MC_LITE = on;
        window.MC_LITE_REASON = on ? (reason || 'user') : '';
        if (was !== on) {
            safe(function () { window.dispatchEvent(new CustomEvent('mc:perfmode', { detail: { lite: on } })); });
        }
        renderToggle();
    }

    function weakHardware() {
        var mem = navigator.deviceMemory;
        var cores = navigator.hardwareConcurrency;
        return (mem && mem <= 2) || (cores && cores <= 2);
    }
    function prefersReducedMotion() {
        return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }

    var pref = readPref();
    if (pref === '1') setLite(true, 'user');
    else if (pref === 'auto') setLite(true, 'auto');
    else if (pref !== '0' && (weakHardware() || prefersReducedMotion())) setLite(true, 'auto');

    // Замер плавности: первые ~20 секунд после запуска считаем кадры.
    // Две секунды подряд ниже ~38 FPS — значит, эффекты мешают, включаем лёгкий режим.
    function startFpsWatch() {
        if (!window.requestAnimationFrame) return;
        if (readPref() !== null || root.classList.contains('perf-lite')) return;

        var frames = 0, winStart = 0, badWindows = 0, totalWindows = 0, stopped = false;
        function stop() { stopped = true; }
        setTimeout(stop, 20000);

        function tick(t) {
            if (stopped) return;
            if (document.hidden) { winStart = 0; frames = 0; requestAnimationFrame(tick); return; }
            if (!winStart) { winStart = t; frames = 0; }
            frames++;
            var span = t - winStart;
            if (span >= 1000) {
                var fps = frames * 1000 / span;
                totalWindows++;
                badWindows = fps < 38 ? badWindows + 1 : 0;
                winStart = t; frames = 0;
                if (badWindows >= 2) {
                    writePref('auto');
                    setLite(true, 'auto');
                    return;
                }
            }
            requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }
    // Ждём, пока уйдёт заставка и всё прогрузится, иначе замер будет нечестным
    window.addEventListener('load', function () { setTimeout(startFpsWatch, 3500); });

    /* ---------- Переключатель на главной ---------- */
    var ICON_ON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>';
    var ICON_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.2 5.6L20 9.3l-4.4 3.8 1.3 5.9L12 16l-4.9 3 1.3-5.9L4 9.3l5.8-.7z"/></svg>';

    function renderToggle() {
        var card = document.getElementById('liteToggleCard');
        if (!card) return;
        var on = root.classList.contains('perf-lite');
        card.classList.toggle('on', on);
        var sub = document.getElementById('liteToggleSub');
        if (sub) {
            sub.textContent = on
                ? (window.MC_LITE_REASON === 'auto' ? 'Включена автоматически — так плавнее' : 'Меньше эффектов, работает плавнее')
                : 'Все эффекты и анимации';
        }
        var ico = document.getElementById('liteToggleIco');
        if (ico) ico.innerHTML = on ? ICON_ON : ICON_OFF;
    }

    window.toggleLiteMode = function () {
        var on = !root.classList.contains('perf-lite');
        writePref(on ? '1' : '0');
        setLite(on, 'user');
        safe(function () { if (tg && tg.HapticFeedback) tg.HapticFeedback.selectionChanged(); });
    };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', renderToggle);
    else renderToggle();
})();
