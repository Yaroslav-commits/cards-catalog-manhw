/* =====================================================================
   🌴 НЕОН-БЭЙ: ГОРЯЧИЙ СЕЗОН — ивент в честь выхода GTA VI

   Подключать после script.js (нужны tg, API_BASE, authHeaders, userId).
   Всё, что решает исход (шансы, добыча, код сейфа, посты копов),
   считает сервер. Клиент только показывает и отправляет выбор.

   Убрать ивент: удалить heist.js, heist.css и <div id="hzEntry">.
   ===================================================================== */
(function (global) {
    'use strict';

    var S = {
        state: null, pub: null, tab: 'city', open: false, busy: false, skew: 0,
        sheet: null, sheetData: null, raid: null, safe: '', imgs: {}, lastLoad: 0,
        wires: null
    };
    var TABS = [
        ['city', '🗺', 'Город'], ['phone', '📱', 'Сэл'], ['stash', '💵', 'Заначка'],
        ['raids', '🥊', 'Наезды'], ['top', '🏆', 'Топ']
    ];
    var STAGE_NAMES = { scout: 'Разведка', entry: 'Заход', event: 'Событие', vault: 'Хранилище', greed: 'Добыча', safe: 'Сейф', escape: 'Отход' };
    var TAG_ICON = { quiet: '🤫', loud: '💥', smart: '🧠' };
    var DAY_NAMES = { 1: 'Новенький в городе', 2: 'Блеск', 3: 'Подготовка', 4: 'Большое дело' };
    var CARD_IMG = 'images/lusia_jason.webp';          // арт карты (кладёшь сам)
    var BG_VIDEO = 'images/backgrounds/gta6.mp4';      // видео-фон (кладёшь сам)
    STAGE_NAMES.wires = 'Щиток';
    var PALM = '<svg viewBox="0 0 200 400" preserveAspectRatio="xMinYMax meet"><path d="M96 400C100 320 92 250 112 170l8 2c-16 78-8 148-10 228z"/>' +
        '<path d="M114 166C80 140 40 140 4 168c36-18 74-16 110 4z"/><path d="M114 166C90 120 60 100 22 104c38 8 66 26 88 68z"/>' +
        '<path d="M114 166c4-46-6-76-30-100 20 30 26 60 24 104z"/><path d="M114 166c26-38 58-48 86-36-30-4-58 10-82 42z"/>' +
        '<path d="M114 166c36-16 68 0 84 30-22-24-50-34-82-24z"/><path d="M114 166c14 24 16 54 6 80 2-26-2-50-12-74z"/>' +
        '<path d="M114 166c-28 10-50 34-58 66 14-28 34-48 56-60z"/></svg>';

    /* ---------------------------- утилиты ---------------------------- */
    function $(id) { return document.getElementById(id); }
    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }
    function fmt(n) { return Math.round(Number(n) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
    function short(n) {
        n = Number(n) || 0;
        if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 2).replace(/\.?0+$/, '') + 'M';
        if (Math.abs(n) >= 1e4) return Math.round(n / 1e3) + 'K';
        return fmt(n);
    }
    function now() { return Date.now() / 1000 + S.skew; }
    function dur(sec) {
        sec = Math.max(0, Math.floor(sec));
        var d = Math.floor(sec / 86400), h = Math.floor(sec % 86400 / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
        if (d) return d + 'д ' + h + 'ч';
        if (h) return h + 'ч ' + (m < 10 ? '0' : '') + m + 'м';
        return m + ':' + (s < 10 ? '0' : '') + s;
    }
    function hhmm(ts) {
        // время всегда по МСК, как в объявлениях бота
        var d = new Date(ts * 1000 + 3 * 3600000);
        return (d.getUTCHours() < 10 ? '0' : '') + d.getUTCHours() + ':' + (d.getUTCMinutes() < 10 ? '0' : '') + d.getUTCMinutes();
    }
    function ago(ts) {
        var s = now() - ts;
        if (s < 60) return 'только что';
        if (s < 3600) return Math.floor(s / 60) + ' мин назад';
        if (s < 86400) return Math.floor(s / 3600) + ' ч назад';
        return Math.floor(s / 86400) + ' д назад';
    }
    function cdEl(ts) { return '<b class="hz-cd" data-cd="' + ts + '">' + dur(ts - now()) + '</b>'; }
    function haptic(kind) {
        try {
            var h = tg.HapticFeedback;
            if (!h) return;
            if (kind === 'ok' || kind === 'bad' || kind === 'warn') h.notificationOccurred(kind === 'ok' ? 'success' : kind === 'bad' ? 'error' : 'warning');
            else h.impactOccurred(kind || 'light');
        } catch (e) { }
    }
    function stars(n, max) {
        var o = '<span class="hz-stars' + (n >= 4 ? ' hot' : '') + '">';
        for (var i = 0; i < (max || 5); i++) o += '<i class="' + (i < n ? 'on' : '') + '">★</i>';
        return o + '</span>';
    }
    // ID устройства живёт в памяти Telegram на этом телефоне/ПК и общий для всех аккаунтов,
    // которые открывают бота с этого устройства. По нему сервер понимает, что это один человек.
    function deviceId() {
        try {
            var v = localStorage.getItem('mc_dev');
            if (!v) {
                v = (global.crypto && crypto.randomUUID) ? crypto.randomUUID() :
                    'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 12);
                localStorage.setItem('mc_dev', v);
            }
            return v;
        } catch (e) { return ''; }
    }
    function fingerprint() {
        try {
            var n = navigator, sc = global.screen || {};
            var raw = [n.userAgent, n.language, n.platform, n.hardwareConcurrency, sc.width + 'x' + sc.height,
                global.devicePixelRatio, (Intl.DateTimeFormat().resolvedOptions().timeZone || '')].join('|');
            var h = 2166136261;
            for (var i = 0; i < raw.length; i++) { h ^= raw.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
            return 'fp' + h.toString(16);
        } catch (e) { return ''; }
    }
    var DEV = { id: deviceId(), fp: fingerprint() };
    function hdrs(extra) {
        return Object.assign({ 'X-Hz-Device': DEV.id, 'X-Hz-Fp': DEV.fp }, authHeaders(), extra || {});
    }

    function api(path, body) {
        var opts = body === undefined ? { headers: hdrs() } : {
            method: 'POST',
            headers: hdrs({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(body || {})
        };
        return fetch(API_BASE + '/api/heist/' + path + '/' + userId, opts).then(function (r) { return r.json(); });
    }
    function toast(msg, bad) {
        var t = $('hzToast');
        if (!t) return;
        t.innerHTML = esc(msg);
        t.className = 'hz-toast show' + (bad ? ' bad' : '');
        clearTimeout(toast._t);
        toast._t = setTimeout(function () { t.className = 'hz-toast' + (bad ? ' bad' : ''); }, bad ? 3600 : 2600);
        haptic(bad ? 'bad' : 'ok');
    }
    function preloadImg(key, url) {
        if (S.imgs[key] !== undefined) return;
        S.imgs[key] = false;
        var im = new Image();
        im.onload = function () { S.imgs[key] = true; document.querySelectorAll('[data-art="' + key + '"]').forEach(function (e) { e.classList.add('has-img'); }); };
        im.src = url;
    }
    ['gas', 'market', 'jewel', 'bank'].forEach(function (k) { preloadImg(k, 'images/heist/' + k + '.webp'); });

    /* ---------------------------- баннер на главной ---------------------------- */
    function loadPublic() {
        fetch(API_BASE + '/api/heist/public').then(function (r) { return r.json(); }).then(function (d) {
            if (!d || !d.success) return;
            S.pub = d;
            S.skew = d.now - Date.now() / 1000;
            renderEntry();
        }).catch(function () { });
    }

    function renderEntry() {
        var box = $('hzEntry'), d = S.pub;
        if (!box || !d) return;
        if (d.status === 'hidden') { box.classList.remove('show'); return; }
        var line;
        if (d.status === 'before') line = 'Старт через ' + cdEl(d.start) + ' · 21.11 в 11:55 МСК';
        else if (d.status === 'open' && d.window) line = 'День ' + d.window.day + ' · «' + esc(d.window.title) + '» · смена ещё ' + cdEl(d.window.end);
        else if (d.status === 'night') line = 'Город спит 🌙 · смена через ' + (d.next ? cdEl(d.next.start) : '—');
        else if (d.status === 'review') line = 'Ивент окончен · итоги подводятся';
        else line = 'Ивент окончен · смотри итоги и призы';
        box.innerHTML =
            '<div class="hz-banner" data-hz-open="1">' +
            '<div class="hz-sun"></div><div class="hz-palms">' + PALM.replace('<svg', '<svg class="p1"') + PALM.replace('<svg', '<svg class="p2"') + '</div>' +
            '<div class="hz-banner-in">' +
            '<div class="hz-banner-tag">Ивент · в честь выхода <b>GTA VI</b></div>' +
            '<div class="hz-logo"><div class="hz-logo-sign">Неон-Бэй</div><div class="hz-logo-sub">Горячий сезон</div></div>' +
            '<div class="hz-banner-cd">' + line + (d.players > 20 && d.status === 'open' ? ' · <b>' + fmt(d.players) + '</b> в деле' : '') + '</div>' +
            '<button class="hz-banner-cta">' + (d.status === 'before' ? 'Правила и призы' : d.status === 'review' || d.status === 'done' ? 'Итоги' : 'Войти в город') + ' ›</button>' +
            '</div></div>';
        box.classList.add('show');
        box.querySelector('[data-hz-open]').onclick = function () { haptic('medium'); openHeist(); };
    }

    /* ---------------------------- экран ---------------------------- */
    function build() {
        if ($('hz')) return;
        var root = document.createElement('div');
        root.className = 'hz';
        root.id = 'hz';
        root.innerHTML =
            '<div class="hz-sky"><div class="hz-sun"></div><div class="hz-grid"></div><div class="hz-palms">' +
            PALM.replace('<svg', '<svg class="p1"') + PALM.replace('<svg', '<svg class="p2"') + '</div></div>' +
            '<header class="hz-top">' +
            '<button class="hz-ibtn" data-a="close" aria-label="Закрыть"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>' +
            '<div class="hz-logo" style="align-items:center"><div class="hz-logo-sign">Неон-Бэй</div><div class="hz-logo-sub">Горячий сезон</div></div>' +
            '<button class="hz-ibtn" data-a="help" aria-label="Правила">?</button>' +
            '</header>' +
            '<div class="hz-hud" id="hzHud"></div>' +
            '<main class="hz-body" id="hzBody"><div class="hz-loading">Въезжаем в город…</div></main>' +
            '<nav class="hz-nav" id="hzNav"></nav>' +
            '<div class="hz-sheet" id="hzSheet"><div class="hz-sheet-in" id="hzSheetIn"></div></div>' +
            '<div class="hz-cine" id="hzCine"></div>' +
            '<div class="hz-toast" id="hzToast"></div>';
        document.body.appendChild(root);
        root.addEventListener('click', onClick);
        $('hzSheet').addEventListener('click', function (e) {
            if (e.target === this && S.sheet !== 'run') closeSheet();
        });
        if (global.MC_BACK_LAYERS) {
            global.MC_BACK_LAYERS.unshift({ open: function () { return S.open; }, close: back });
        }
    }

    function openHeist() {
        build();
        $('hz').classList.add('open');
        document.body.classList.add('hz-lock');
        S.open = true;
        if (typeof manageBack === 'function') manageBack();
        renderNav();
        load(true);
    }

    function closeHeist() {
        S.open = false;
        closeCine();
        closeSheet(true);
        stopVideos();
        var r = $('hz');
        if (r) r.classList.remove('open');
        document.body.classList.remove('hz-lock');
        if (typeof manageBack === 'function') manageBack();
        loadPublic();
    }

    function back() {
        if (S.cine) return closeCine();
        if (S.sheet && S.sheet !== 'run') return closeSheet();
        if (S.sheet === 'run') return closeSheet();
        closeHeist();
    }

    function load(first) {
        return api('state').then(function (d) {
            if (!d.success) { if (first) $('hzBody').innerHTML = '<div class="hz-empty"><b>📵</b>' + esc(d.error || 'Нет связи') + '</div>'; return; }
            S.state = d;
            S.skew = d.now - Date.now() / 1000;
            S.lastLoad = Date.now();
            render();
            if (first && d.run && d.run.status === 'active') openRun();
            if (S.sheet === 'run' && S.sheetData && d.run) { S.sheetData = d.run; renderSheet(); }
        }).catch(function () {
            if (first) $('hzBody').innerHTML = '<div class="hz-empty"><b>📵</b>Нет связи с городом. Попробуй ещё раз.</div>';
        });
    }

    function render() {
        renderHud();
        renderNav();
        var b = $('hzBody'), st = S.state;
        if (!st) return;
        var fn = { city: renderCity, phone: renderPhone, stash: renderStash, raids: renderRaids, top: renderTop }[S.tab];
        b.innerHTML = fn(st);
    }

    function renderHud() {
        var p = S.state && S.state.player;
        if (!p) { $('hzHud').innerHTML = ''; return; }
        $('hzHud').innerHTML =
            cell(stars(p.heat), 'Розыск') +
            cell('⚡ ' + p.actions, 'Действия') +
            cell('💵 ' + short(p.cash), 'Грязные') +
            cell('⭐ ' + fmt(p.respect), 'Респект');
        function cell(v, l) { return '<div class="hz-hud-cell"><div class="hz-hud-v">' + v + '</div><div class="hz-hud-l">' + l + '</div></div>'; }
    }

    function renderNav() {
        var st = S.state, dots = {};
        if (st && st.missions) dots.phone = st.missions.some(function (m) { return !m.done; });
        if (st && st.raids) dots.raids = (st.raids.history || []).some(function (r) { return r.revenge; });
        if (st && st.auction) dots.top = st.auction.open;
        $('hzNav').innerHTML = TABS.map(function (t) {
            return '<button data-a="tab" data-v="' + t[0] + '" class="' + (S.tab === t[0] ? 'on' : '') + '"><span>' + t[1] + '</span>' + t[2] +
                (dots[t[0]] ? '<i class="hz-dot"></i>' : '') + '</button>';
        }).join('');
    }

    /* ---------------------------- вкладка: ГОРОД ---------------------------- */
    function renderCity(st) {
        var h = '';
        if (st.status === 'before') return renderBefore(st);
        if (st.status === 'review' || st.status === 'done') h += resultsCard(st);
        var p = st.player;
        if (!p) return h + '<div class="hz-empty"><b>🌙</b>Ты не участвовал в ивенте.</div>';

        if (st.window) {
            var w = st.window;
            h += '<div class="hz-card hz-shift"><div class="hz-shift-top">' +
                '<div class="hz-shift-day"><div><b>' + w.day + '</b><small>день</small></div></div>' +
                '<div class="hz-sp"><div class="hz-t">' + esc(DAY_NAMES[w.day] || '') + '</div>' +
                '<div class="hz-s">Смена ' + pad(w.hour) + ':00–' + hhmm(w.end) + ' · осталось ' + cdEl(w.end) + '</div></div></div>' +
                (w.mod && w.mod.text ? '<div class="hz-shift-mod">🌆 ' + esc(w.mod.text) + '</div>' : '') + '</div>';
        } else if (st.status === 'night') {
            h += '<div class="hz-card"><div class="hz-row"><div style="font-size:34px">🌙</div><div class="hz-sp">' +
                '<div class="hz-t">Город спит</div><div class="hz-s">Ограбления с 09:00 до 00:00. Ночью розыск обнуляется, а прачечная работает: отмой заначку, пока её не обнесли.' +
                (st.next_window ? '<br>Следующая смена через ' + cdEl(st.next_window.start) : '') + '</div></div></div></div>';
        }

        if (st.run && st.run.status === 'active') {
            h += '<div class="hz-card hz-target special" data-a="run-open"><div class="hz-target-art hz-art-' + st.run.type + '" data-art="' + st.run.type + '">' + st.run.icon + '</div>' +
                '<div class="hz-sp"><div class="hz-target-name">Дело не закончено</div><div class="hz-target-meta">' + esc(st.run.name) + ' · ' + esc(STAGE_NAMES[st.run.stage] || '') +
                ' · в сумке ' + fmt(st.run.loot) + ' 💵</div></div><div class="hz-target-go">ВЕРНУТЬСЯ</div></div>';
        }

        var cur = (st.missions || []).filter(function (m) { return m.live && !m.done; })[0] ||
            (st.missions || []).filter(function (m) { return !m.done; })[0];
        if (cur) {
            h += '<div class="hz-card hz-msg new" data-a="mission" data-v="' + cur.key + '"><div class="hz-ava">' + cur.npc.icon + '</div>' +
                '<div class="hz-sp"><div class="hz-t" style="font-size:15px">' + esc(cur.npc.name) + ' · «' + esc(cur.title) + '»</div>' +
                '<div class="hz-s">' + esc(cur.push) + '</div>' + (cur.live ? '<div class="hz-chip sun" style="margin-top:6px">⏱ Сейчас награда ×1.5</div>' : '') + '</div></div>';
        }

        if (p.late) {
            h += '<div class="hz-card" style="border-color:rgba(46,230,255,.45)"><div class="hz-row"><div style="font-size:30px">🧳</div><div class="hz-sp">' +
                '<div class="hz-t">Ты не опоздал</div><div class="hz-s">Сэл держит для тебя место: прошлые миссии всё ещё ждут ответа (стартовый набор — в первой), ' +
                'у тебя полный запас ⚡, а следующие дела дают ×1.3 добычи. Главное — банк и аукцион за карту — в День 4.</div></div></div></div>';
        } else if (p.boost) {
            h += '<div class="hz-card" style="border-color:rgba(46,230,255,.45)"><div class="hz-row"><div style="font-size:26px">🚀</div><div class="hz-sp">' +
                '<div class="hz-t" style="font-size:15px">С возвращением в город!</div><div class="hz-s">Добыча ×1.3 на следующие ' + p.boost + ' дела (кроме банка).</div></div></div></div>';
        }
        if (p.rob_block) h += '<div class="hz-card" style="border-color:rgba(255,77,94,.45)"><div class="hz-s" style="color:#ffc2c8">🚔 ' + esc(p.rob_block) + '</div></div>';

        if (st.day >= 3 && !p.bank_done) h += bankCard(st);
        if (p.bank_done) h += '<div class="hz-card"><div class="hz-row"><div style="font-size:30px">🏦</div><div class="hz-sp"><div class="hz-t">Банк взят!</div><div class="hz-s">Тебя пустят на чёрный аукцион (24.11, 21:00). Береги грязный кэш для ставки.</div></div></div></div>';

        if (st.targets && st.targets.length) {
            h += '<div class="hz-h">Точки на карте <small>визиты · касса</small></div>';
            st.targets.forEach(function (t) { h += targetCard(t, p); });
            h += '<div class="hz-s hz-muted" style="text-align:center;margin:6px 0 10px">Чем меньше народу побывало на точке, тем богаче касса. Толпа — это и меньше денег, и злее охрана.</div>';
        } else if (st.status === 'open') {
            h += '<div class="hz-empty"><b>🗺</b>Точки загружаются…</div>';
        }
        return h;
    }
    function pad(n) { return (n < 10 ? '0' : '') + n; }

    function targetCard(t, p) {
        var cls = 'hz-card hz-target' + (t.special ? ' special' : '') + (t.type === 'bank' ? ' bank' : '');
        var tillCls = t.till >= 100 ? 'rich' : '';
        return '<div class="' + cls + '" data-a="target" data-v="' + t.tid + '">' +
            '<div class="hz-target-art hz-art-' + t.type + (S.imgs[t.type] ? ' has-img' : '') + '" data-art="' + t.type + '">' + t.icon + '</div>' +
            '<div class="hz-sp"><div class="hz-target-name">' + esc(t.name) + '</div>' +
            '<div class="hz-target-meta">' + esc(t.kind) + ' · ' + esc(t.district) + '</div>' +
            '<div class="hz-chips" style="margin-top:2px">' +
            (t.special ? '<span class="hz-chip cyan">💎 Привоз ×3</span>' : '') +
            '<span class="hz-chip">👣 ' + t.visits + '</span>' +
            '<span class="hz-chip ' + (t.mult >= 1.1 ? 'mint' : t.mult < .85 ? 'red' : '') + '">💰 ×' + t.mult.toFixed(2) + '</span>' +
            (t.risk ? '<span class="hz-chip red">🛡 −' + t.risk + '%</span>' : '') +
            '</div>' +
            (t.type !== 'bank' ? '<div class="hz-till ' + tillCls + '"><i style="width:' + Math.min(100, Math.round(t.till / 1.25)) + '%"></i></div>' : '') +
            '</div><div class="hz-target-go">⚡' + t.cost + '<br><span style="font-size:10px;opacity:.8">НА ДЕЛО</span></div></div>';
    }

    function bankCard(st) {
        var n = st.preps.filter(function (x) { return x.q; }).length;
        var h = '<div class="hz-card hz-target bank" style="display:block"><div class="hz-row"><div style="font-size:30px">🏦</div><div class="hz-sp">' +
            '<div class="hz-t">Первый Неоновый банк</div><div class="hz-s">' +
            (st.day < 4 ? 'Большое дело — 24.11 с 09:00. Нужно минимум ' + st.bank_min_preps + ' подготовки из 4.' : 'Банк открыт до полуночи! Одно удачное ограбление на игрока.') +
            '</div></div></div><div class="hz-preps">';
        st.preps.forEach(function (x) {
            var ic = x.name.split(' ')[0], nm = x.name.split(' ').slice(1).join(' ');
            h += '<div class="hz-prep ' + (x.q === 'good' ? 'good' : x.q ? 'ok' : '') + '"><b>' + ic + '</b>' + esc(nm) + (x.q === 'good' ? ' ★' : '') + '</div>';
        });
        h += '</div><div class="hz-s" style="margin-top:8px">Готово ' + n + '/4. ' + (n < st.bank_min_preps ? 'Подготовки дают сюжетные миссии Дня 3, а пропущенные — чёрный рынок в «Заначке».' : 'Можно идти на дело. ★ — лучший вариант подготовки.') + '</div></div>';
        return h;
    }

    function renderBefore(st) {
        var h = '<div class="hz-card" style="text-align:center;padding:22px 14px">' +
            '<div class="hz-s">Город откроется через</div><div style="font:700 40px/1.1 var(--hz-head);margin:6px 0">' + cdEl(st.start) + '</div>' +
            '<div class="hz-s">Суббота, 21 ноября, 11:55 МСК · 4 дня · смены каждые 3 часа с 09:00 до 00:00</div></div>';
        h += prizesBlock(st);
        h += rulesHtml();
        return h;
    }

    function rulesHtml() {
        var li = function (i, t, s) { return '<div class="hz-li"><div class="hz-ic">' + i + '</div><div class="hz-sp"><b>' + t + '</b><div class="hz-s">' + s + '</div></div></div>'; };
        return '<div class="hz-h">Как это работает</div><div class="hz-card hz-list">' +
            li('🕒', 'Смены', 'С 09:00 до 00:00 каждые 3 часа новая смена: сюжет от Сэла, новые точки на карте и +3 ⚡ действия (копятся до 6). Ночью город спит.') +
            li('🎯', 'Дело — это решения', 'Разведка, заход, неожиданности, жадность у кассы, сейф-головоломка и отход. У каждого варианта виден шанс и из чего он сложился.') +
            li('★', 'Розыск', 'Громкие дела поднимают звёзды, каждая −7% к шансам. 5★ — на дело не пустят. Каждую смену −1★, ночью розыск сгорает.') +
            li('💵', 'Грязные деньги', 'Добыча приходит грязным кэшем. Отмой его в прачечной Сэла в KRW. Пока кэш не отмыт, его могут украсть другие игроки.') +
            li('🥊', 'Наезды', 'С Дня 2 можно обносить чужие заначки. Оборона против подхода — как камень-ножницы-бумага. Обнесли — у тебя 3 часа на ответку.') +
            li('🏦', 'Большое дело', 'День 3 — подготовка (чертежи, ключ-карта, тачка, инсайдер). День 4 — ограбление банка.') +
            li('🎮', 'Мини-игры', 'В ювелирке и банке — щиток сигнализации: соедини провода, пока не вышло время (подписи гнёзд — обманка!). В хранилище банка — терминал: вычисли пароль по подсказкам системы.') +
            li('🧳', 'Опоздал?', 'Не страшно: пропущенные миссии остаются, новичок получает полный запас ⚡, а кто пропустил целый день — ×1.3 добычи на 4 дела. Главные призы решаются в День 4.') +
            li('🔨', 'Аукцион', '24.11 в 21:00 Сэл выставит 10 карт «Люсия и Джейсон». Ставки только грязным кэшем, только для тех, кто взял банк.') +
            li('🏆', 'ТОП по Респекту', 'Респект дают за чистые дела, сюжет и наезды. ТОП-25 получают эксклюзивный фон, ТОП-5 — ещё и алмазы.') +
            '</div><div class="hz-s hz-muted" style="text-align:center;margin:4px 8px 14px">Один человек — один приз: аккаунты, с которых играют на одном устройстве, борются за призы как один игрок. Призовые карта и фон не передаются. За призы борются аккаунты, созданные до 14.11 и с коллекцией от 25 карт.</div>';
    }

    function resultsCard(st) {
        var r = st.results;
        if (!r) return '';
        var mine = r.mine || [];
        var t = { card: '🃏 Карта «Люсия и Джейсон»', bg: '🌄 Фон GTA VI', dia: '💎 Алмазы' };
        var h = '<div class="hz-card" style="border-color:rgba(255,211,77,.5)"><div class="hz-t">' + (r.granted ? '🏁 Итоги Неон-Бэя' : '⏳ Итоги на проверке') + '</div>' +
            '<div class="hz-s" style="margin-top:4px">' + (r.granted ? 'Призы выданы.' : 'Проверяем победителей на твинков. Призы придут в течение 12 часов.') + '</div>';
        if (mine.length) {
            h += '<div class="hz-chips">' + mine.map(function (m) {
                return '<span class="hz-chip sun">' + t[m.prize] + (m.prize === 'dia' ? ' +' + m.amount : '') + ' · #' + m.rank + '</span>';
            }).join('') + '</div>';
        }
        return h + '</div>';
    }

    /* ---------------------------- вкладка: СЭЛ (сюжет) ---------------------------- */
    function renderPhone(st) {
        if (st.status === 'before') return rulesHtml();
        var h = '<div class="hz-h">Сообщения <small>сюжет на каждую смену</small></div>';
        var ms = st.missions || [];
        if (!ms.length) h += '<div class="hz-empty"><b>📱</b>Сэл ещё не писал.</div>';
        ms.forEach(function (m) {
            h += '<div class="hz-card hz-msg' + (!m.done ? ' new' : '') + '" data-a="mission" data-v="' + m.key + '"><div class="hz-ava">' + m.npc.icon + '</div>' +
                '<div class="hz-sp"><div class="hz-row"><div class="hz-sp hz-t" style="font-size:15px">' + esc(m.title) + '</div>' +
                '<span class="hz-time">День ' + m.day + ' · ' + pad(m.hour) + ':00</span></div>' +
                '<div class="hz-s">' + esc(m.npc.name) + ': ' + esc(m.done ? (m.done.text || 'Выбор сделан') : m.push) + '</div>' +
                (!m.done && m.live ? '<span class="hz-chip sun" style="margin-top:6px">⏱ Сейчас ×1.5 награды</span>' : '') +
                (m.done ? '<span class="hz-chip ' + (m.done.ok ? 'mint' : 'red') + '" style="margin-top:6px">' + (m.done.ok ? '✓ Сделано' : '✗ Не вышло') + '</span>' : '') +
                '</div></div>';
        });
        if (st.feed && st.feed.length) {
            h += '<div class="hz-h">Журнал</div><div class="hz-card hz-list">';
            st.feed.forEach(function (f) {
                h += '<div class="hz-li"><div class="hz-ic">' + esc(f.icon) + '</div><div class="hz-sp">' + esc(f.text) + '</div><div class="hz-time">' + ago(f.ts) + '</div></div>';
            });
            h += '</div>';
        }
        h += '<div class="hz-h">Расписание</div><div class="hz-card">';
        var lastDay = 0, n = now();
        (st.schedule || []).forEach(function (w) {
            if (w.day !== lastDay) { h += '<div class="hz-sched-day">День ' + w.day + ' · ' + esc(DAY_NAMES[w.day] || '') + '</div>'; lastDay = w.day; }
            var cls = n >= w.end ? 'past' : n >= w.start ? 'now' : '';
            h += '<div class="hz-sched ' + cls + '"><b>' + pad(w.hour) + ':00</b><span>' + esc(w.title) + '</span></div>';
        });
        h += '</div>';
        return h;
    }

    /* ---------------------------- вкладка: ЗАНАЧКА ---------------------------- */
    function renderStash(st) {
        if (st.status === 'before') return prizesBlock(st) + rulesHtml();
        var p = st.player;
        if (!p) return '<div class="hz-empty"><b>💵</b>Нет данных.</div>';
        var w = p.wash, left = Math.max(0, w.cap - w.used);
        var h = '<div class="hz-money">' +
            '<div class="dirty"><small>Грязные 💵</small><b>' + fmt(p.cash) + '</b>' + (p.escrow ? '<small>+ ' + fmt(p.escrow) + ' в ставке</small>' : '') + '</div>' +
            '<div class="clean"><small>Чистые ₩</small><b>' + short(p.krw) + '</b><small>отмыто за ивент ' + short(p.laundered) + '</small></div></div>';

        h += '<div class="hz-h">🧺 Прачечная «Солнечная стирка» <small>ур. ' + (w.lvl + 1) + '</small></div><div class="hz-card">' +
            '<div class="hz-row"><div class="hz-sp hz-s">Можно отмыть в эту смену</div><b>' + fmt(left) + ' / ' + fmt(w.cap) + '</b></div>' +
            '<div class="hz-bar"><i style="width:' + Math.round(100 * w.used / w.cap) + '%"></i></div>' +
            '<input class="hz-input" id="hzWashAmt" inputmode="numeric" placeholder="Сумма 💵" value="' + Math.min(p.cash, left) + '">' +
            '<div class="hz-quick"><button data-a="wq" data-v="25">25%</button><button data-a="wq" data-v="50">50%</button><button data-a="wq" data-v="100">Всё</button></div>' +
            '<div class="hz-btns"><button class="hz-btn sun col" data-a="wash" data-v="fast">⚡ Срочно<small>−' + Math.round(w.fast_fee * 100) + '%, деньги сразу</small></button>' +
            '<button class="hz-btn cool col" data-a="wash" data-v="clean">🧺 Чисто<small>−' + Math.round(w.clean_fee * 100) + '%, через ' + w.clean_h + ' ч</small></button></div>';
        if (w.pending && w.pending.length) {
            h += '<div class="hz-list" style="margin-top:10px">';
            w.pending.forEach(function (x) { h += '<div class="hz-li"><div class="hz-ic">🌀</div><div class="hz-sp">+' + fmt(x.krw) + ' ₩</div><div class="hz-time">через ' + cdEl(x.ready) + '</div></div>'; });
            h += '</div>';
        }
        if (w.next_cost) h += '<button class="hz-btn ghost" style="margin-top:10px" data-a="buy" data-v="wash_up">⬆ Прокачать до ' + short(w.next_cap) + '/смену · ' + short(w.next_cost) + ' 💵</button>';
        h += '<div class="hz-s hz-muted" style="margin-top:8px">Деньги в барабане уже никто не украдёт. Всё неотмытое к концу ивента Сэл отмоет сам с комиссией 25%.</div></div>';

        h += '<div class="hz-h">🛡 Оборона тайника</div><div class="hz-card"><div class="hz-def">';
        Object.keys(st.defenses).forEach(function (k) {
            var d = st.defenses[k], ap = st.approaches[d.beats];
            h += '<button data-a="def" data-v="' + k + '" class="' + (p.defense === k ? 'on' : '') + '"><b>' + d.icon + '</b>' + esc(d.name) + '<br><span class="hz-muted">ловит «' + esc(ap.name) + '»</span></button>';
        });
        h += '</div><div class="hz-s" style="margin-top:8px">Если подход налётчика совпадёт с тем, что ловит твоя оборона, он уйдёт ни с чем и ещё заплатит тебе. Меняй оборону: наводчики тоже не дремлют.</div></div>';

        h += '<div class="hz-h">🔫 Снаряжение' + (p.flags && p.flags.pak_friend ? ' <small>скидка дяди Пака −15%</small>' : '') + '</div><div class="hz-shop">';
        st.shop.forEach(function (it) {
            var full = it.have >= it.max;
            h += '<div class="hz-item"><div class="hz-row"><div class="hz-item-i">' + it.icon + '</div><div class="hz-sp"><div class="hz-item-n">' + esc(it.name) + '</div>' +
                '<div class="hz-s">' + (it.perm ? (it.have ? 'есть' : 'навсегда') : 'есть ' + it.have + '/' + it.max) + '</div></div></div>' +
                '<div class="hz-s">' + esc(it.desc) + '</div>' +
                '<button class="hz-btn sm ' + (full ? 'ghost' : '') + '" data-a="buy" data-v="' + it.id + '"' + (full ? ' disabled' : '') + '>' + (full ? 'Максимум' : short(it.price) + ' 💵') + '</button></div>';
        });
        h += '</div>';

        if (st.day >= 3 && !p.bank_done) {
            h += '<div class="hz-h">🕶 Чёрный рынок <small>подготовка к банку</small></div><div class="hz-card hz-list">';
            st.black_market.forEach(function (b) {
                h += '<div class="hz-li"><div class="hz-sp">' + esc(b.name) + '</div>' + (b.have ? '<span class="hz-chip mint">✓ есть</span>' :
                    '<button class="hz-btn sm" data-a="buy" data-v="prep_' + b.id + '">' + short(b.price) + ' 💵</button>') + '</div>';
            });
            h += '</div>';
        }
        h += '<div class="hz-h">📊 Статистика</div><div class="hz-card hz-chips" style="margin-top:0">' +
            '<span class="hz-chip">Дел: ' + p.heists + '</span><span class="hz-chip red">Повязали: ' + p.busts + '</span>' +
            '<span class="hz-chip mint">Украдено: ' + short(p.stolen) + '</span><span class="hz-chip pink">Наездов: ' + p.raids_won + '</span>' +
            '<span class="hz-chip">Обнесли тебя: ' + p.raids_lost + '</span></div>' +
            '<button class="hz-btn ghost" data-a="bell">' + (p.notify ? '🔔 Уведомления в боте: вкл' : '🔕 Уведомления в боте: выкл') + '</button>';
        return h;
    }

    /* ---------------------------- вкладка: НАЕЗДЫ ---------------------------- */
    function renderRaids(st) {
        if (st.status === 'before') return rulesHtml();
        var r = st.raids || {}, p = st.player;
        var h = '';
        if (!r.open) {
            h += '<div class="hz-card" style="text-align:center;padding:22px 14px"><div style="font-size:40px">🐀</div><div class="hz-t" style="margin:6px 0">Наезды пока закрыты</div>' +
                '<div class="hz-s">' + (r.opens && now() < r.opens ? 'Откроются по сюжету: День 2, 15:00 (через ' + cdEl(r.opens) + ').' : 'Наезды работают только в официальные смены.') + '</div></div>';
        } else {
            h += '<div class="hz-card"><div class="hz-row"><div class="hz-sp"><div class="hz-t">Обнести чужую заначку</div>' +
                '<div class="hz-s">⚡1 за наезд · осталось ' + r.left + ' за смену · цели с заначкой от 40K</div></div></div>' +
                '<div class="hz-rps"><div>🤫 Тихо<br>ловит 🚨</div><div>💪 Силой<br>ловит 🐕</div><div>🎭 Обманом<br>ловит 📹</div></div>' +
                '<button class="hz-btn" style="margin-top:10px" data-a="find">🔍 Найти цели</button></div>';
            if (S.raid && S.raid.length) {
                S.raid.forEach(function (v) {
                    h += '<div class="hz-card hz-victim"><div class="hz-row"><div class="hz-ava" style="width:40px;height:40px;font-size:20px">😎</div><div class="hz-sp">' +
                        '<div class="hz-t" style="font-size:15px">' + esc(v.name) + '</div><div class="hz-s">⭐ ' + fmt(v.respect) + ' · заначка ' + esc(v.stash) + ' 💵</div></div></div>' +
                        '<div class="hz-hint' + (v.sure ? ' sure' : '') + '">' + (v.sure ? '🕵️ Точно: ' : '👀 ') + esc(v.hint) + (v.sure ? '' : ' <span class="hz-muted">(может быть обманка)</span>') + '</div>' +
                        (!v.sure && p.gear.tipster ? '<button class="hz-btn ghost sm" style="width:100%;margin-bottom:8px" data-a="reveal" data-v="' + v.uid + '">🕵️ Наводчик (есть ' + p.gear.tipster + ')</button>' : '') +
                        '<div class="hz-appr">' + ['quiet', 'force', 'con'].map(function (a) {
                            var ap = st.approaches[a];
                            return '<button data-a="raid" data-v="' + v.uid + ':' + a + '"><b>' + ap.icon + '</b>' + esc(ap.name) + '</button>';
                        }).join('') + '</div></div>';
                });
            } else if (S.raid) {
                h += '<div class="hz-empty"><b>🫥</b>Жирных заначек поблизости нет. Все отмылись. Попробуй позже.</div>';
            }
        }
        var hist = r.history || [];
        if (hist.length) {
            h += '<div class="hz-h">Разборки</div><div class="hz-card hz-list">';
            hist.forEach(function (x) {
                var t;
                if (x.incoming) t = x.ok ? '🚨 <b>' + esc(x.name) + '</b> обнёс тебя на ' + fmt(x.amount) + ' 💵' : '🛡 <b>' + esc(x.name) + '</b> не смог тебя обнести (+' + fmt(x.amount) + ' 💵)';
                else t = x.ok ? '🥊 Ты обнёс <b>' + esc(x.name) + '</b> на ' + fmt(x.amount) + ' 💵' : '💥 Наезд на <b>' + esc(x.name) + '</b> провален (−' + fmt(x.amount) + ' 💵)';
                if (x.is_revenge) t += ' · ответка';
                h += '<div class="hz-li" style="flex-wrap:wrap"><div class="hz-sp">' + t + '</div><div class="hz-time">' + ago(x.ts) + '</div>';
                if (x.revenge && r.open) {
                    var td = x.their_def ? st.defenses[x.their_def] : null;
                    h += '<div style="width:100%;margin-top:6px"><div class="hz-hint sure" style="margin:0 0 6px;padding:7px 10px;border-radius:10px;font-size:12px;background:rgba(46,230,255,.1)">⏱ Ответка ещё ' + cdEl(x.rev_until) +
                        (td ? ' · у него ' + td.icon + ' ' + esc(td.name) : '') + ' · уносишь 25%</div><div class="hz-appr">' +
                        ['quiet', 'force', 'con'].map(function (a) {
                            var ap = st.approaches[a];
                            return '<button data-a="revenge" data-v="' + x.other + ':' + a + '"><b>' + ap.icon + '</b>' + esc(ap.name) + '</button>';
                        }).join('') + '</div></div>';
                }
                h += '</div>';
            });
            h += '</div>';
        }
        return h;
    }

    /* ---------------------------- вкладка: ТОП ---------------------------- */
    function prizesBlock(st) {
        var pz = st.prizes || {};
        var d = pz.dia || {};
        return '<div class="hz-h">Главные призы</div><div class="hz-prizes">' +
            '<div class="hz-prize" data-a="card-zoom"><div class="hz-tirage">ТИРАЖ ' + (pz.card_count || 10) + '</div><div class="hz-prize-img" style="background-image:url(' + CARD_IMG + '),linear-gradient(160deg,#ff3d8b,#2b0f4f)"></div>' +
            '<div class="hz-prize-cap"><b>Люсия и Джейсон</b><small>Лимитированная карта · чёрный аукцион</small></div></div>' +
            '<div class="hz-prize"><div class="hz-tirage">ТИРАЖ ' + (pz.bg_count || 25) + '</div>' +
            '<div class="hz-prize-vid" data-a="cine"><video src="' + BG_VIDEO + '" muted autoplay loop playsinline webkit-playsinline preload="metadata"></video>' +
            '<span class="hz-prize-play"><b>▶</b>Смотреть<br>со звуком</span></div>' +
            '<div class="hz-prize-cap"><b>Фон «GTA VI»</b><small>ТОП-25 по Респекту</small></div>' +
            '<div class="hz-prize-cap" style="padding-top:0"><small>💎 ТОП-1 ' + (d[1] || 300) + ' · 2 — ' + (d[2] || 200) + ' · 3 — ' + (d[3] || 175) + ' · 4 — ' + (d[4] || 150) + ' · 5 — ' + (d[5] || 100) + '</small></div></div>' +
            '</div>';
    }

    function renderTop(st) {
        var h = '';
        if (st.status === 'review' || st.status === 'done') h += resultsCard(st);
        h += prizesBlock(st);
        if (st.status === 'before') return h + rulesHtml();
        var p = st.player, top = st.top || { rows: [] };
        if (p && !p.eligible) h += '<div class="hz-card" style="margin-top:12px;border-color:rgba(255,211,77,.4)"><div class="hz-s" style="color:#ffe7a6">⚠️ ' + esc(p.eligible_why) + '. Играть и зарабатывать KRW можно, но в призовой ТОП ты не попадаешь.</div></div>';
        if (p && p.device_mates) h += '<div class="hz-card" style="margin-top:12px;border-color:rgba(46,230,255,.4)"><div class="hz-s" style="color:#bff6ff">📱 С этого устройства в ивенте играют ещё ' + p.device_mates +
            ' акк. Для призов вы считаетесь одним игроком: в призовой ТОП и на аукцион проходит только лучший из аккаунтов. Если это ошибка (семья на одном телефоне) — напиши в поддержку.</div></div>';
        if (st.auction) h += auctionBlock(st);
        h += '<div class="hz-h">ТОП грабителей <small>' + (top.my_place ? 'ты #' + top.my_place + ' · ' + fmt(top.my_respect) + ' ⭐' : 'набери Респект') + '</small></div><div class="hz-card" style="padding:8px">';
        if (!top.rows.length) h += '<div class="hz-empty">Пока никого. Будь первым.</div>';
        top.rows.forEach(function (r) {
            var badge = r.prize_rank ? (r.prize_rank <= 5 ? '💎' + (st.prizes.dia[r.prize_rank] || '') + ' 🌄' : r.prize_rank <= st.prizes.bg_count ? '🌄 фон' : '') : '';
            h += '<div class="hz-lb-row' + (r.me ? ' me' : '') + '"><div class="hz-place">' + r.place + '</div><div class="hz-lb-name">' + esc(r.name) + '</div>' +
                (badge ? '<span class="hz-badge">' + badge + '</span>' : (!r.prize_rank ? '<span class="hz-badge no">без призов</span>' : '')) +
                '<div class="hz-lb-val">' + fmt(r.respect) + ' ⭐</div></div>';
        });
        h += '</div>';
        return h;
    }

    function auctionBlock(st) {
        var a = st.auction, p = st.player;
        var h = '<div class="hz-h">🔨 Чёрный аукцион <small>' + (a.open ? 'до 00:00 · ' + cdEl(a.ends) : a.starts && now() < a.starts ? 'откроется 24.11 в 21:00' : 'закрыт') + '</small></div><div class="hz-card">';
        if (!a.open && a.starts && now() < a.starts) {
            h += '<div class="hz-s">Сэл выставит ' + a.count + ' карт «Люсия и Джейсон». Ставки — только грязным кэшем и только для тех, кто ограбил банк. ТОП-' + a.count + ' ставок забирают карты. Проигравшим ставка вернётся (с комиссией отмывки).</div></div>';
            return h;
        }
        h += '<div class="hz-row"><div class="hz-sp"><div class="hz-s">Проходная ставка (топ-' + a.count + ')</div><div class="hz-t" style="color:var(--hz-sun)">' + (a.cutoff ? fmt(a.cutoff) + ' 💵' : 'мест ещё хватает') + '</div></div>' +
            '<div style="text-align:right"><div class="hz-s">Твоя ставка</div><div class="hz-t">' + (a.my_bid ? fmt(a.my_bid) + ' 💵' : '—') + '</div>' +
            (a.my_rank ? '<span class="hz-chip ' + (a.my_rank <= a.count ? 'mint' : 'red') + '">#' + a.my_rank + (a.my_rank <= a.count ? ' · проходишь' : ' · не проходишь') + '</span>' : '') + '</div></div>';
        if (a.open && p) {
            var minBid = a.my_bid ? a.my_bid + a.step : a.min;
            var suggest = Math.max(minBid, a.cutoff && (!a.my_rank || a.my_rank > a.count) ? a.cutoff + a.step : minBid);
            if (!p.bank_done) h += '<div class="hz-s" style="margin-top:10px;color:#ffc2c8">🔒 Ставить могут только те, кто взял банк.</div>';
            else h += '<input class="hz-input" style="margin-top:10px" id="hzBid" inputmode="numeric" value="' + suggest + '">' +
                '<div class="hz-s" style="margin:6px 0">Минимум ' + fmt(minBid) + ' 💵 · у тебя ' + fmt(p.cash) + ' 💵 грязных. Ставку можно только повышать.</div>' +
                '<button class="hz-btn sun" data-a="bid">Поставить</button>';
        }
        if (a.bids && a.bids.length) {
            h += '<div class="hz-list" style="margin-top:10px">';
            a.bids.forEach(function (b, i) {
                h += '<div class="hz-lb-row' + (b.uid === Number(userId) ? ' me' : '') + '" style="padding:7px 2px"><div class="hz-place">' + (i + 1) + '</div><div class="hz-lb-name">' + esc(b.name) + '</div>' +
                    (i < a.count ? '<span class="hz-badge">🃏</span>' : '') + '<div class="hz-lb-val">' + short(b.amount) + '</div></div>';
            });
            h += '</div>';
        }
        return h + '</div>';
    }

    /* ---------------------------- шторки ---------------------------- */
    function openSheet(kind, data) {
        S.sheet = kind;
        S.sheetData = data;
        $('hzSheet').classList.add('open');
        renderSheet();
    }
    function closeSheet(silent) {
        var wasRun = S.sheet === 'run';
        S.sheet = null;
        S.sheetData = null;
        S.safe = '';
        var sh = $('hzSheet');
        if (sh) sh.classList.remove('open');
        if (!silent && wasRun) load();
    }
    function renderSheet() {
        var box = $('hzSheetIn');
        if (!S.sheet) return;
        if (S.sheet === 'run') { box.innerHTML = runHtml(S.sheetData); requestAnimationFrame(drawWires); }
        else if (S.sheet === 'target') box.innerHTML = targetSheet(S.sheetData);
        else if (S.sheet === 'mission') box.innerHTML = missionHtml(S.sheetData);
        else if (S.sheet === 'help') box.innerHTML = sheetHead('📖', 'Правила Неон-Бэя', '') + '<div class="hz-sheet-body">' + rulesHtml() + '</div>';
    }
    function sheetHead(icon, title, sub, noClose) {
        return '<div class="hz-sheet-head"><div style="font-size:30px">' + icon + '</div><div class="hz-sp"><div class="hz-t">' + esc(title) + '</div>' +
            (sub ? '<div class="hz-s">' + sub + '</div>' : '') + '</div>' +
            (noClose ? '' : '<button class="hz-ibtn" data-a="sheet-x">✕</button>') + '</div>';
    }

    function targetSheet(t) {
        var p = S.state.player;
        var h = sheetHead(t.icon, t.name, esc(t.kind) + ' · ' + esc(t.district)) + '<div class="hz-sheet-body">';
        h += '<div class="hz-chips" style="margin-top:0">' +
            '<span class="hz-chip">⚡ ' + t.cost + ' действ.</span><span class="hz-chip">👣 Побывало: ' + t.visits + '</span>' +
            '<span class="hz-chip ' + (t.mult >= 1.1 ? 'mint' : t.mult < .85 ? 'red' : '') + '">💰 Добыча ×' + t.mult.toFixed(2) + '</span>' +
            (t.risk ? '<span class="hz-chip red">🛡 Охрана настороже −' + t.risk + '%</span>' : '') + '</div>';
        var tips = {
            gas: 'Быстро, громко, по мелочи. Хороший способ разогреться.',
            market: 'Касса пожирнее, а в подсобке бывает сейф с кодом.',
            jewel: 'Витрины дорогие, охрана злая, сейф с часовым механизмом. Готовь маски, отмычки и термит.',
            bank: 'Одно удачное ограбление на игрока. Подготовки открывают варианты и повышают шансы.'
        };
        h += '<div class="hz-stage-x" style="margin-top:12px">' + tips[t.type] + '</div>';
        h += '<div class="hz-s" style="margin-bottom:12px">С собой: 🎭 ' + (p.gear.mask || 0) + ' · 🔓 ' + (p.gear.lockpick || 0) + ' · 📡 ' + (p.gear.jammer || 0) + ' · 🔥 ' + (p.gear.thermite || 0) + ' · 📋 ' + (p.gear.intel || 0) + (p.gear.gun ? ' · 🔫' : '') + '</div>';
        var block = p.rob_block || (p.actions < t.cost ? 'Не хватает ⚡ действий: они пополняются каждую смену.' : '');
        if (block) h += '<div class="hz-s" style="color:#ffc2c8;margin-bottom:10px">' + esc(block) + '</div>';
        h += '<button class="hz-btn" data-a="start" data-v="' + t.tid + '"' + (block ? ' disabled' : '') + '>🎯 Идти на дело</button></div>';
        return h;
    }

    function optHtml(o, act) {
        var cls = o.chance == null ? 's' : o.chance >= 75 ? 'g' : o.chance >= 50 ? 'y' : 'r';
        var tags = (o.tags || []).map(function (t) { return TAG_ICON[t] || ''; }).join('');
        var parts = (o.parts || []).length > 1 ? o.parts.map(function (x, i) {
            return (i === 0 ? 'база ' + x[1] : esc(x[0].toLowerCase()) + ' ' + (x[1] > 0 ? '+' : '−') + Math.abs(x[1]));
        }).join(' · ') : '';
        var sub = [];
        if (o.desc) sub.push(esc(o.desc));
        if (o.needs && o.needs.length) sub.push('тратит ' + o.needs.map(function (n) { return { mask: '🎭', lockpick: '🔓', thermite: '🔥', jammer: '📡' }[n] || n; }).join(''));
        if (o.cost) sub.push('стоит ' + fmt(o.cost) + ' 💵');
        if (o.locked && o.why) sub.push('<span style="color:#ff9aa5">' + esc(o.why) + '</span>');
        return '<button class="hz-opt' + (o.locked ? ' locked' : '') + '" data-a="' + act + '" data-v="' + esc(o.id) + '">' +
            '<div class="hz-sp"><div class="hz-opt-l">' + (tags ? tags + ' ' : '') + esc(o.label) + '</div>' +
            (sub.length ? '<div class="hz-opt-d">' + sub.join(' · ') + '</div>' : '') + (parts ? '<div class="hz-opt-p">' + parts + '</div>' : '') + '</div>' +
            (o.minigame ? '<div class="hz-pct s" style="background:rgba(46,230,255,.16);color:#8ff1ff">🎮<small>игра</small></div>' :
            '<div class="hz-pct ' + cls + '">' + (o.chance == null ? '✓' : o.chance + '%') + '<small>' + (o.chance == null ? 'точно' : 'шанс') + '</small></div>') + '</button>';
    }

    function runHtml(r) {
        if (!r) return '';
        var done = r.status !== 'active';
        var h = sheetHead(r.icon, r.name, esc(r.district) + (r.mult !== 1 ? ' · добыча ×' + Number(r.mult).toFixed(2) : ''), !done && r.stage === 'escape');
        if (done) return h + '<div class="hz-sheet-body">' + resultHtml(r) + '</div>';
        h += '<div class="hz-steps">' + r.stages.map(function (s, i) { return '<i class="' + (i < r.si ? 'done' : i === r.si ? 'cur' : '') + '"></i>'; }).join('') + '</div>';
        h += '<div class="hz-sheet-body"><div class="hz-runhud"><div class="hz-loot"><small>В сумке</small><b>' + fmt(r.loot) + ' 💵</b></div>' +
            '<div class="hz-alarm' + (r.triggered ? ' trig' : '') + '"><small><span>Тревога</span><span>' + (r.triggered ? '🚨 СРАБОТАЛА' : r.thr ? 'порог ' + r.thr : 'порог ❓') + '</span></small><div class="hz-meter">';
        for (var i = 1; i <= 10; i++) h += '<i class="' + (r.alarm >= i ? 'on' : '') + (r.thr === i ? ' thr' : '') + '"></i>';
        h += '</div></div></div>';
        var log = (r.log || []).filter(function (l) { return l.t; }).slice(-3);
        if (log.length) {
            h += '<div class="hz-log">' + log.map(function (l) {
                return '<div class="' + (l.ok === true ? 'ok' : l.ok === false ? 'bad' : '') + '">' + esc(l.t) + (l.n && l.n.length ? '<em>' + esc(l.n.join(' · ')) + '</em>' : '') + '</div>';
            }).join('') + '</div>';
        }
        h += '<div class="hz-chip pink" style="margin-bottom:6px">' + esc(STAGE_NAMES[r.stage] || '') + '</div><div class="hz-stage-t">' + esc(r.title || '') + '</div><div class="hz-stage-x">' + esc(r.text || '') + '</div>';

        if (r.wires_intro) {
            var wi = r.wires_intro;
            h += '<div class="hz-wire-intro"><div class="hz-s">🎮 Мини-игра: ' + wi.n + ' провода, ' + wi.time + ' сек. Правило: ' + esc(wi.rule) + '. Ошибка — искры и +1 к тревоге за каждый неверный провод. Успех — тревога −2 и дальше растёт медленнее.</div></div>' +
                '<button class="hz-btn cool" data-a="wires-start">🔧 Вскрыть щиток</button>' +
                '<button class="hz-btn ghost sm" style="width:100%;margin-top:8px" data-a="opt" data-v="skip">Не трогать · ' + esc(wi.skip) + '</button>';
        } else if (r.wires) {
            h += wiresHtml(r.wires);
        } else if (r.terminal) {
            h += terminalHtml(r.terminal);
        } else if (r.options) {
            var act = r.stage === 'escape' ? 'chase' : 'opt';
            h += r.options.map(function (o) { return optHtml(o, act); }).join('');
        } else if (r.greed) {
            var g = r.greed;
            h += '<div class="hz-s" style="margin-bottom:8px">Взято ' + g.grabs + ' из ' + g.max + ' · каждый заход +' + short(g.range[0]) + '–' + short(g.range[1]) + ' 💵 и +1…3 к тревоге' + (g.jam ? ' (📡 глушилка: ×0.6)' : '') + '</div>' +
                '<div class="hz-greed"><button class="hz-btn" data-a="grab">💰 ' + esc(g.btn) + '<small>' + (r.thr ? 'до сирены ' + Math.max(0, (r.thr - r.alarm)).toFixed(1) : 'порог неизвестен') + '</small></button>' +
                '<button class="hz-btn ghost" data-a="stop">🏃 Уходим<small>с тем, что есть</small></button></div>' +
                (g.can_jam ? '<button class="hz-btn cool" style="margin-top:8px" data-a="jam">📡 Включить глушилку</button>' : '');
        } else if (r.safe) {
            var s = r.safe, rev = s.revealed || {}, code = safeCode(rev);
            h += '<div class="hz-s" style="margin-bottom:6px">Код из 4 цифр (1–6), цифры могут повторяться. После попытки каждая цифра подсветится: <b style="color:#46f5b0">зелёная</b> — стоит на своём месте, <b style="color:#ffd34d">жёлтая</b> — есть в коде, но в другом месте, серая — такой нет. Ошибка = +1 к тревоге. Награда ' + short(s.reward[0]) + '–' + short(s.reward[1]) + ' 💵.</div>';
            if (Object.keys(rev).length) h += '<div class="hz-chip sun" style="margin-bottom:6px">🔑 Подсказка: ' + Object.keys(rev).map(function (k) { return (Number(k) + 1) + '-я цифра — ' + rev[k]; }).join(', ') + '</div>';
            h += '<div class="hz-safe-slots">';
            for (var j = 0; j < 4; j++) {
                h += '<span class="' + (rev[j] !== undefined ? 'hint' : '') + '">' + (code[j] || '·') + '</span>';
            }
            h += '</div><div class="hz-pad">';
            for (var d = 1; d <= 6; d++) h += '<button data-a="pad" data-v="' + d + '">' + d + '</button>';
            h += '<button data-a="pad-del">⌫</button><button data-a="pad-clr">C</button><button class="go" data-a="pad-go">Вскрыть · ' + s.left + '</button></div>';
            if (s.guesses.length) {
                h += '<div class="hz-guesses">' + s.guesses.slice().reverse().map(function (g) {
                    if (g.m) {   // подсветка по позициям: видно, какая именно цифра на месте
                        var tiles = '';
                        for (var q = 0; q < 4; q++) tiles += '<span class="' + (g.m[q] === 'x' ? 'x' : g.m[q] === 'n' ? 'n' : '') + '">' + esc(g.g[q]) + '</span>';
                        return '<div class="hz-guess"><div class="hz-tiles">' + tiles + '</div><small>' + g.exact + ' на месте · ' + g.near + ' не там</small></div>';
                    }
                    var pegs = '';
                    for (var k = 0; k < 4; k++) pegs += '<i class="' + (k < g.exact ? 'x' : k < g.exact + g.near ? 'n' : '') + '"></i>';
                    return '<div class="hz-guess"><b>' + esc(g.g) + '</b><div class="hz-pegs">' + pegs + '</div></div>';
                }).join('') + '</div>';
            }
            h += '<div class="hz-btns">' + (s.can_thermite ? '<button class="hz-btn sun sm" data-a="thermite">🔥 Термит +2</button>' : '<span></span>') +
                '<button class="hz-btn ghost sm" data-a="skip-safe">Бросить сейф</button></div>';
        } else if (r.routes) {
            h += r.routes.map(function (x) {
                var cls = x.chance >= 75 ? 'g' : x.chance >= 50 ? 'y' : 'r';
                var info = x.known ? (x.police ? '🚔 Пост копов!' : '✅ Чисто') : '❓ Неизвестно: может быть пост';
                return '<button class="hz-route ' + (x.known ? (x.police ? 'cop' : 'clear') : '') + '" data-a="route" data-v="' + x.id + '"><div class="hz-route-i">' + x.icon + '</div>' +
                    '<div class="hz-sp"><div class="hz-opt-l">' + esc(x.name) + '</div><div class="hz-opt-d">' + info + '</div></div>' +
                    '<div class="hz-pct ' + cls + '">' + x.chance + '%<small>' + (x.known ? 'шанс' : 'если чисто') + '</small></div></button>';
            }).join('');
        }
        if (r.stage !== 'escape' && !r.wires) h += '<button class="hz-btn ghost sm" style="width:100%;margin-top:14px" data-a="abandon">Бросить дело (добыча пропадёт)</button>';
        return h + '</div>';
    }

    /* ---------- мини-игра «Щиток» ---------- */
    function wiresHtml(wz) {
        if (!S.wires || S.wires.deadline !== wz.deadline) S.wires = { deadline: wz.deadline, map: {}, sel: null, tries: 0, sending: false };
        var W = S.wires;
        // Остаток с сервера минус время, пока ответ летел до телефона, — чтобы экран не обещал лишнего
        if (wz.left !== undefined && W.seen !== wz) { W.end = Date.now() / 1000 + wz.left - Math.min(2, (S.rtt || 0) / 2); W.seen = wz; }
        if (wz.tries !== W.tries) {          // после неверной попытки снимаем только неверные провода
            (wz.wrong || []).forEach(function (i) { delete W.map[i]; });
            W.tries = wz.tries;
            W.flash = wz.wrong || [];
        }
        var used = {};
        Object.keys(W.map).forEach(function (k) { used[W.map[k]] = Number(k); });
        var left = Math.max(0, W.end - Date.now() / 1000);
        var h = '<div class="hz-wire-rule">📋 ' + esc(wz.rule_text) + '</div>' +
            '<div class="hz-wire-timer"><i id="hzWireBar" style="width:' + Math.min(100, left / wz.time * 100) + '%"></i><span id="hzWireLeft">' + Math.ceil(left) + ' с</span></div>' +
            '<div class="hz-wires' + (left <= 0 || W.sending ? ' busy' : '') + '" id="hzWires"><svg class="hz-wire-svg" id="hzWireSvg"></svg>' +
            '<div class="hz-wire-wait">' + (left <= 0 ? '⏱ Время! Проверяем схему…' : 'Проверяем схему…') + '</div><div class="hz-wire-col">';
        wz.plugs.forEach(function (pl, i) {
            var on = W.map[i] !== undefined;
            h += '<button class="hz-plug' + (W.sel === i ? ' sel' : '') + (on ? ' on' : '') + ((W.flash || []).indexOf(i) >= 0 ? ' spark' : '') + '" data-a="plug" data-v="' + i + '" style="--c:' + pl.hex + '"><i></i></button>';
        });
        h += '</div><div class="hz-wire-col r">';
        wz.sockets.forEach(function (sk, j) {
            h += '<button class="hz-sock' + (used[j] !== undefined ? ' on' : '') + '" data-a="sock" data-v="' + j + '"><b style="color:' + sk.ink + '">' + esc(sk.word) + '</b><i></i></button>';
        });
        h += '</div></div><div class="hz-s" style="text-align:center;margin-top:8px">Тапни провод слева, потом гнездо справа. Тап по подключённому проводу — перекинуть его.</div>';
        W.flash = [];
        return h;
    }
    function drawWires() {
        var W = S.wires, box = $('hzWires'), svg = $('hzWireSvg');
        if (!W || !box || !svg) return;
        var r0 = box.getBoundingClientRect(), d = '';
        var plugs = box.querySelectorAll('.hz-plug'), socks = box.querySelectorAll('.hz-sock');
        Object.keys(W.map).forEach(function (k) {
            var a = plugs[k], b = socks[W.map[k]];
            if (!a || !b) return;
            var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
            var x1 = ra.right - r0.left - 6, y1 = ra.top + ra.height / 2 - r0.top, x2 = rb.left - r0.left + 6, y2 = rb.top + rb.height / 2 - r0.top;
            var mx = (x1 + x2) / 2, col = getComputedStyle(a).getPropertyValue('--c');
            d += '<path d="M' + x1 + ' ' + y1 + ' C' + mx + ' ' + y1 + ' ' + mx + ' ' + y2 + ' ' + x2 + ' ' + y2 + '" stroke="' + col + '"/>';
        });
        svg.setAttribute('viewBox', '0 0 ' + r0.width + ' ' + r0.height);
        svg.innerHTML = d;
    }
    function wiresSubmit(force) {
        var W = S.wires, r = S.sheetData;
        if (!W || W.sending || !r || !r.wires) return;
        var n = r.wires.plugs.length, arr = [];
        for (var i = 0; i < n; i++) arr.push(W.map[i]);
        var full = arr.every(function (x) { return x !== undefined; });
        if (!full && !force) return;
        W.sending = true;
        var box = $('hzWires'); if (box) box.classList.add('busy');
        var arg = full ? arr.join(',') : '';
        var t0 = Date.now();
        api('act', { action: 'wires', arg: arg }).then(function (d) {
            W.sending = false;
            S.rtt = (Date.now() - t0) / 1000;
            if (!d.success) { if (!force) toast(d.error, true); var bx = $('hzWires'); if (bx) bx.classList.remove('busy'); return; }
            haptic(d.ok ? 'ok' : 'bad');
            if (d.player && S.state) Object.assign(S.state.player, d.player);
            S.sheetData = d.run;
            if (S.state) S.state.run = d.run;
            if (!d.run.wires) S.wires = null;
            renderHud();
            renderSheet();
        }, function () {
            // Сеть моргнула — отправляем ту же схему ещё раз
            W.sending = false;
            W.retries = (W.retries || 0) + 1;
            if (W.retries <= 3) setTimeout(function () { wiresSubmit(true); }, 800);
            else toast('Нет связи с сервером. Проверь интернет.', true);
        });
    }

    /* ---------- мини-игра «Терминал» ---------- */
    function terminalHtml(t) {
        var tried = {};
        t.guesses.forEach(function (g) { tried[g.w] = g.k; });
        var h = '<div class="hz-term"><div class="hz-term-top"><span>NEON-VAULT OS v6.1</span><span>ПОПЫТКИ ' +
            new Array(t.left + 1).join('▮') + new Array(Math.max(0, 4 - t.left) + 1).join('▯') + '</span></div><div class="hz-term-log">';
        h += '<div>&gt; ДОСТУП К ХРАНИЛИЩУ: НУЖЕН ПАРОЛЬ</div>';
        t.guesses.forEach(function (g) { h += '<div>&gt; ' + esc(g.w) + ' … ' + (g.k === t.len ? 'ДОСТУП РАЗРЕШЁН' : 'ОТКАЗ · совпадений ' + g.k + '/' + t.len) + '</div>'; });
        h += '<div class="cur">&gt; _</div></div><div class="hz-term-words">';
        t.words.forEach(function (w) {
            var rm = t.removed.indexOf(w) >= 0, tr = tried[w] !== undefined;
            h += '<button class="' + (rm ? 'rm' : tr ? 'tr' : '') + '" data-a="term" data-v="' + esc(w) + '"' + (rm || tr ? ' disabled' : '') + '>' + esc(w) +
                (tr ? '<small>' + tried[w] + '/' + t.len + '</small>' : '') + '</button>';
        });
        h += '</div><div class="hz-term-help">«Совпадения» — сколько букв стоят на тех же местах, что и в пароле. Сравнивай слова между собой и вычёркивай лишние.</div></div>';
        return h;
    }

    /* ---------- кинозал (видео-фон со звуком) ---------- */
    function openCine() {
        var box = $('hzCine');
        if (!box) return;
        stopVideos();
        S.cine = true;
        box.innerHTML =
            '<div class="hz-cine-glow"></div>' +
            '<div class="hz-cine-top"><div><div class="hz-cine-kick">Эксклюзивный видео-фон · тираж 25</div><div class="hz-cine-title">GTA VI</div></div>' +
            '<button class="hz-ibtn" data-a="cine-x">✕</button></div>' +
            '<div class="hz-cine-screen"><video id="hzCineV" src="' + BG_VIDEO + '" playsinline webkit-playsinline preload="auto"></video>' +
            '<div class="hz-cine-flash" id="hzCineFlash"></div><div class="hz-cine-err" id="hzCineErr">Видео ещё не загружено</div></div>' +
            '<div class="hz-cine-bar"><button data-a="cine-play" id="hzCinePlay">⏸</button>' +
            '<div class="hz-cine-prog" id="hzCineProg"><i id="hzCineFill"></i></div><span id="hzCineTime">0:00</span>' +
            '<button data-a="cine-snd" id="hzCineSnd" class="on">🔊</button><button data-a="cine-fs">⛶</button></div>' +
            '<div class="hz-cine-hint">Получают ТОП-25 по Респекту в Неон-Бэе</div>';
        box.classList.add('open');
        var v = $('hzCineV');
        v.muted = false;
        var p = v.play();
        if (p && p.catch) p.catch(function () { v.muted = true; v.play().catch(function () { }); syncCine(); });
        ['play', 'pause', 'volumechange'].forEach(function (e) { v.addEventListener(e, syncCine); });
        v.addEventListener('timeupdate', function () {
            if (!v.duration) return;
            $('hzCineFill').style.width = (v.currentTime / v.duration * 100) + '%';
            $('hzCineTime').textContent = mmss(v.currentTime) + ' / ' + mmss(v.duration);
        });
        v.addEventListener('ended', function () { v.currentTime = 0; v.play().catch(function () { }); });
        v.addEventListener('error', function () { $('hzCineErr').classList.add('show'); });
        v.addEventListener('click', cinePlay);
        $('hzCineProg').addEventListener('click', function (e) {
            if (!v.duration) return;
            var rc = this.getBoundingClientRect();
            v.currentTime = Math.max(0, Math.min(1, (e.clientX - rc.left) / rc.width)) * v.duration;
        });
        haptic('medium');
    }
    function mmss(t) { t = Math.floor(t || 0); return Math.floor(t / 60) + ':' + (t % 60 < 10 ? '0' : '') + t % 60; }
    function syncCine() {
        var v = $('hzCineV');
        if (!v) return;
        $('hzCinePlay').textContent = v.paused ? '▶' : '⏸';
        var b = $('hzCineSnd');
        b.textContent = v.muted ? '🔇' : '🔊';
        b.classList.toggle('on', !v.muted);
    }
    function cinePlay() {
        var v = $('hzCineV');
        if (!v) return;
        if (v.paused) v.play().catch(function () { }); else v.pause();
        var f = $('hzCineFlash');
        f.textContent = v.paused ? '⏸' : '▶';
        f.classList.remove('show'); void f.offsetWidth; f.classList.add('show');
    }
    function closeCine() {
        var box = $('hzCine');
        S.cine = false;
        if (!box || !box.classList.contains('open')) return;
        var v = $('hzCineV');
        if (v) { try { v.pause(); v.removeAttribute('src'); v.load(); } catch (e) { } }
        box.classList.remove('open');
        box.innerHTML = '';
        document.querySelectorAll('#hz .hz-prize-vid video').forEach(function (x) { x.play().catch(function () { }); });
    }
    function stopVideos() {
        document.querySelectorAll('#hz .hz-prize-vid video').forEach(function (x) { try { x.pause(); } catch (e) { } });
    }

    function resultHtml(r) {
        var res = r.result || {}, win = res.outcome === 'escaped';
        var h = '<div class="hz-result"><div class="hz-stamp ' + (win ? 'win' : 'lose') + '">' + (win ? 'Чисто ушёл' : res.outcome === 'abandoned' ? 'Дело брошено' : 'Повязали') + '</div>';
        if (win) {
            h += '<div class="hz-result-num">+' + fmt(res.loot) + ' 💵</div><div class="hz-chips" style="justify-content:center">' +
                '<span class="hz-chip sun">+' + res.respect + ' ⭐' + (res.clean ? ' (без тревоги +50%)' : '') + '</span>' +
                (res.heat ? '<span class="hz-chip red">+' + res.heat + '★ розыска</span>' : '') + '</div>' +
                '<div class="hz-s" style="margin:12px 6px">Кэш грязный. Отмой его в «Заначке», пока не обнесли.</div>';
        } else if (res.outcome !== 'abandoned') {
            h += '<div class="hz-result-num" style="color:var(--hz-red)">−' + fmt(res.lost || 0) + ' 💵</div><div class="hz-chips" style="justify-content:center">' +
                '<span class="hz-chip red">' + res.respect + ' ⭐</span>' + (res.jail ? '<span class="hz-chip red">🚔 В участке до конца смены</span>' : '') + '</div>';
        }
        var log = (r.log || []).filter(function (l) { return l.t; }).slice(-4);
        h += '<div class="hz-log" style="text-align:left;margin-top:14px">' + log.map(function (l) { return '<div class="' + (l.ok === true ? 'ok' : l.ok === false ? 'bad' : '') + '">' + esc(l.t) + '</div>'; }).join('') + '</div>';
        return h + '<button class="hz-btn" data-a="run-done">В город</button></div>';
    }

    function missionHtml(m) {
        var h = sheetHead(m.npc.icon, m.npc.name, esc(m.npc.role)) + '<div class="hz-sheet-body"><div class="hz-chip pink">День ' + m.day + ' · ' + pad(m.hour) + ':00 · «' + esc(m.title) + '»</div>';
        if (m.mod) h += '<div class="hz-s" style="margin:8px 0 0">🌆 ' + esc(m.mod) + '</div>';
        h += '<div class="hz-bubbles">';
        m.msgs.forEach(function (t, i) { h += '<div class="hz-bubble" style="animation-delay:' + (i * 0.35) + 's">' + esc(t) + '</div>'; });
        var delay = m.msgs.length * 0.35;
        if (m.result) {
            h += '<div class="hz-bubble me" style="animation-delay:0s">' + esc(m.result.label) + '</div>' +
                '<div class="hz-bubble res' + (m.result.ok ? '' : ' bad') + '" style="animation-delay:.3s">' + esc(m.result.text) +
                (m.result.notes && m.result.notes.length ? '<div class="hz-chips">' + m.result.notes.map(function (n) { return '<span class="hz-chip">' + esc(n) + '</span>'; }).join('') + '</div>' : '') + '</div>';
        } else if (m.done) {
            h += '<div class="hz-bubble res' + (m.done.ok ? '' : ' bad') + '" style="animation-delay:' + delay + 's">' + esc(m.done.text || 'Выбор сделан') +
                (m.done.notes && m.done.notes.length ? '<div class="hz-chips">' + m.done.notes.map(function (n) { return '<span class="hz-chip">' + esc(n) + '</span>'; }).join('') + '</div>' : '') + '</div>';
        }
        h += '</div>';
        if (!m.done && !m.result && m.options) {
            if (m.live) h += '<div class="hz-chip sun" style="margin-bottom:8px">⏱ Ответь в эту смену — награда кэшем ×1.5</div>';
            h += m.options.map(function (o) { return optHtml(o, 'mchoice'); }).join('');
        } else {
            h += '<button class="hz-btn ghost" data-a="sheet-x">Закрыть</button>';
        }
        return h + '</div>';
    }

    // Код сейфа: подсказанные цифры стоят на своих местах, остальные набирает игрок по порядку
    function safeCode(rev) {
        var out = [], k = 0;
        for (var i = 0; i < 4; i++) {
            if (rev[i] !== undefined) out.push(String(rev[i]));
            else out.push(S.safe[k++] || '');
        }
        return out;
    }

    function confirmBox(msg, cb) {
        try { if (tg.showConfirm) return tg.showConfirm(msg, cb); } catch (e) { }
        cb(window.confirm(msg));
    }

    function openRun() {
        if (!S.state || !S.state.run) return;
        openSheet('run', S.state.run);
    }

    /* ---------------------------- действия ---------------------------- */
    function busy(fn) {
        if (S.busy) return;
        S.busy = true;
        var done = function () { S.busy = false; };
        try { fn().then(done, done); } catch (e) { done(); }
    }

    function act(action, arg) {
        busy(function () {
            var t0 = Date.now();
            return api('act', { action: action, arg: arg == null ? null : String(arg) }).then(function (d) {
                S.rtt = (Date.now() - t0) / 1000;
                if (!d.success) return toast(d.error, true);
                if (d.ok === true) haptic('ok'); else if (d.ok === false) haptic('bad'); else haptic('light');
                if (d.player && S.state) Object.assign(S.state.player, d.player);
                S.sheetData = d.run;
                if (S.state) S.state.run = d.run;
                if (d.run && d.run.stage !== 'safe') S.safe = '';
                if (d.run && d.run.status !== 'active') haptic(d.run.result && d.run.result.outcome === 'escaped' ? 'ok' : 'bad');
                renderHud();
                renderSheet();
            });
        });
    }

    function onClick(e) {
        var t = e.target.closest('[data-a]');
        if (!t || !$('hz').contains(t)) return;
        var a = t.getAttribute('data-a'), v = t.getAttribute('data-v');
        var st = S.state;
        switch (a) {
            case 'close': return closeHeist();
            case 'help': haptic(); return openSheet('help');
            case 'sheet-x': return closeSheet();
            case 'tab':
                S.tab = v; haptic();
                render(); $('hzBody').scrollTop = 0;
                if (Date.now() - S.lastLoad > 15000) load();
                return;
            case 'target':
                var tg_ = (st.targets || []).filter(function (x) { return x.tid === v; })[0];
                if (tg_) { haptic(); openSheet('target', tg_); }
                return;
            case 'start':
                return busy(function () {
                    return api('start', { tid: v }).then(function (d) {
                        if (!d.success) return toast(d.error, true);
                        haptic('medium');
                        st.run = d.run;
                        S.safe = '';
                        openSheet('run', d.run);
                        load();
                    });
                });
            case 'run-open': return openRun();
            case 'wires-start': return act('wires_start');
            case 'plug':
                var W = S.wires; if (!W || W.sending || W.end - Date.now() / 1000 <= 0) return;
                var pi = Number(v);
                if (W.map[pi] !== undefined) { delete W.map[pi]; W.sel = pi; }      // перекинуть провод: снять и сразу взять в руку
                else W.sel = W.sel === pi ? null : pi;
                haptic('light'); renderSheet();
                return;
            case 'sock':
                var W2 = S.wires; if (!W2 || W2.sending || W2.end - Date.now() / 1000 <= 0) return;
                if (W2.sel === null) return toast('Сначала выбери провод слева', true);
                var sj = Number(v);
                Object.keys(W2.map).forEach(function (k) { if (W2.map[k] === sj) delete W2.map[k]; });
                W2.map[W2.sel] = sj; W2.sel = null;
                haptic('medium'); renderSheet();
                setTimeout(function () { wiresSubmit(false); }, 280);
                return;
            case 'term': return act('term', v);
            case 'cine': return openCine();
            case 'cine-x': return closeCine();
            case 'cine-play': return cinePlay();
            case 'cine-snd':
                var cv = $('hzCineV'); if (!cv) return;
                cv.muted = !cv.muted; if (!cv.muted && cv.paused) cv.play().catch(function () { });
                haptic('light'); return syncCine();
            case 'cine-fs':
                var fv = $('hzCineV'); if (!fv) return;
                try {
                    if (fv.requestFullscreen) fv.requestFullscreen();
                    else if (fv.webkitEnterFullscreen) fv.webkitEnterFullscreen();
                    else if (fv.webkitRequestFullscreen) fv.webkitRequestFullscreen();
                } catch (e) { }
                return;
            case 'card-zoom':
                if (typeof global.mcOpenViewer === 'function') global.mcOpenViewer({ kind: 'image', src: CARD_IMG, title: 'Люсия и Джейсон', sub: 'Лимитированная карта · тираж 10', color: '#ff3d8b' });
                return;
            case 'opt': case 'chase': return act('choose', v);
            case 'route': return act('choose', v);
            case 'grab': return act('choose', 'grab');
            case 'stop': return act('choose', 'stop');
            case 'jam': return act('jam');
            case 'thermite': return act('thermite');
            case 'skip-safe': return act('choose', 'skip');
            case 'pad':
                var free = 4 - Object.keys((S.sheetData && S.sheetData.safe && S.sheetData.safe.revealed) || {}).length;
                if (S.safe.length < free) { S.safe += v; haptic(); renderSheet(); }
                return;
            case 'pad-del': S.safe = S.safe.slice(0, -1); return renderSheet();
            case 'pad-clr': S.safe = ''; return renderSheet();
            case 'pad-go':
                var code = safeCode((S.sheetData && S.sheetData.safe && S.sheetData.safe.revealed) || {}).join('');
                if (code.length !== 4) return toast('Набери все 4 цифры', true);
                S.safe = '';
                return act('guess', code);
            case 'abandon':
                return confirmBox('Бросить дело? Добыча пропадёт, действия не вернутся.', function (ok) {
                    if (!ok) return;
                    busy(function () { return api('abandon', {}).then(function (d) { if (!d.success) return toast(d.error, true); closeSheet(); }); });
                });
            case 'run-done': return closeSheet();
            case 'mission':
                var m = (st.missions || []).filter(function (x) { return x.key === v; })[0];
                if (m) { haptic(); openSheet('mission', Object.assign({}, m)); }
                return;
            case 'mchoice':
                var mm = S.sheetData;
                var opt = (mm.options || []).filter(function (o) { return o.id === v; })[0];
                return busy(function () {
                    return api('mission', { key: mm.key, choice: v }).then(function (d) {
                        if (!d.success) return toast(d.error, true);
                        haptic(d.ok ? 'ok' : 'bad');
                        mm.result = { ok: d.ok, text: d.text, notes: d.notes, label: opt ? opt.label : '' };
                        mm.msgs = [];
                        renderSheet();
                        if (d.player) Object.assign(st.player, d.player);
                        renderHud();
                        load();
                    });
                });
            case 'wq':
                var p = st.player, left = Math.max(0, p.wash.cap - p.wash.used);
                $('hzWashAmt').value = Math.floor(Math.min(p.cash, left) * Number(v) / 100);
                return;
            case 'wash':
                var amt = parseInt(($('hzWashAmt').value || '').replace(/\D/g, ''), 10) || 0;
                return busy(function () {
                    return api('wash', { amount: amt, mode: v }).then(function (d) {
                        if (!d.success) return toast(d.error, true);
                        toast(d.text); load();
                    });
                });
            case 'buy':
                return busy(function () {
                    return api('buy', { item: v, qty: 1 }).then(function (d) {
                        if (!d.success) return toast(d.error, true);
                        toast(d.text); load();
                    });
                });
            case 'def':
                return busy(function () {
                    return api('defense', { defense: v }).then(function (d) {
                        if (!d.success) return toast(d.error, true);
                        st.player.defense = d.defense; haptic(); render();
                    });
                });
            case 'bell':
                return busy(function () {
                    return api('notify', {}).then(function (d) {
                        if (!d.success) return toast(d.error, true);
                        st.player.notify = d.notify; toast(d.notify ? 'Уведомления включены 🔔' : 'Уведомления выключены 🔕'); render();
                    });
                });
            case 'find':
                return busy(function () {
                    return api('raid_targets').then(function (d) {
                        if (!d.success) return toast(d.error, true);
                        S.raid = d.targets || []; haptic(); render();
                    });
                });
            case 'reveal':
                return busy(function () {
                    return api('raid_reveal', { victim: Number(v) }).then(function (d) {
                        if (!d.success) return toast(d.error, true);
                        (S.raid || []).forEach(function (x) { if (x.uid === Number(v)) { x.sure = true; x.hint = d.hint; } });
                        st.player.gear.tipster = Math.max(0, (st.player.gear.tipster || 1) - 1);
                        toast(d.text); render();
                    });
                });
            case 'raid': case 'revenge':
                var parts = v.split(':');
                return busy(function () {
                    return api('raid', { victim: Number(parts[0]), approach: parts[1], revenge: a === 'revenge' }).then(function (d) {
                        if (!d.success) return toast(d.error, true);
                        toast(d.text, !d.ok);
                        S.raid = (S.raid || []).filter(function (x) { return x.uid !== Number(parts[0]); });
                        load();
                    });
                });
            case 'bid':
                var b = parseInt(($('hzBid').value || '').replace(/\D/g, ''), 10) || 0;
                return confirmBox('Поставить ' + fmt(b) + ' 💵 грязными? Ставку нельзя отменить, только повысить.', function (ok) {
                    if (!ok) return;
                    busy(function () {
                        return api('bid', { amount: b }).then(function (d) {
                            if (!d.success) return toast(d.error, true);
                            st.auction = d.auction; if (d.player) Object.assign(st.player, d.player);
                            toast('Ставка принята! 🔨'); render();
                        });
                    });
                });
        }
    }

    /* ---------------------------- таймеры ---------------------------- */
    setInterval(function () {
        var n = now();
        document.querySelectorAll('[data-cd]').forEach(function (e) {
            var ts = Number(e.getAttribute('data-cd'));
            e.textContent = dur(ts - n);
        });
        if (S.open && S.state) {
            var w = S.state.window, nw = S.state.next_window;
            var edge = (w && n >= w.end) || (!w && nw && n >= nw.start) || (S.state.status === 'before' && n >= S.state.start);
            if (edge && Date.now() - S.lastLoad > 5000) load();
            else if (!S.sheet && Date.now() - S.lastLoad > 45000) load();
        }
        if (!S.open && S.pub) {
            var pw = S.pub.window;
            if ((pw && n >= pw.end) || (S.pub.status === 'before' && n >= S.pub.start) || (S.pub.status === 'night' && S.pub.next && n >= S.pub.next.start)) {
                S.pub.status = 'stale';
                loadPublic();
            }
        }
    }, 1000);

    // Таймер щитка: плавная полоска и авто-отправка, когда время вышло
    setInterval(function () {
        var r = S.sheetData;
        if (S.sheet !== 'run' || !r || !r.wires || !S.wires) return;
        var left = S.wires.end - Date.now() / 1000;
        var bar = $('hzWireBar'), lab = $('hzWireLeft');
        if (bar) bar.style.width = Math.max(0, Math.min(100, left / r.wires.time * 100)) + '%';
        if (lab) lab.textContent = Math.max(0, Math.ceil(left)) + ' с';
        if (left <= 0 && !S.wires.sending && !S.wires.timedOut) {
            S.wires.timedOut = true;
            var bx = $('hzWires');
            if (bx) { bx.classList.add('busy'); var wt = bx.querySelector('.hz-wire-wait'); if (wt) wt.textContent = '⏱ Время! Проверяем схему…'; }
            wiresSubmit(true);
            setTimeout(function () { if (S.wires) S.wires.timedOut = false; }, 2000);   // если сеть подвела — повторим
        }
    }, 200);
    global.addEventListener('resize', function () { if (S.sheet === 'run') drawWires(); });

    /* ---------------------------- старт ---------------------------- */
    function init() {
        loadPublic();
        try {
            var params = new URLSearchParams(location.search);
            var sp = (tg.initDataUnsafe && tg.initDataUnsafe.start_param) || '';
            if (params.get('ev') === 'heist' || sp === 'heist') setTimeout(openHeist, 350);
        } catch (e) { }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

    global.openHeist = openHeist;
    global.closeHeist = closeHeist;
})(window);
