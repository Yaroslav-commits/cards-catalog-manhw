// =====================================================================
//  МАСТЕРСКАЯ — создание своих карт
//  Подключается после script.js. Использует оттуда: tg, API_BASE,
//  authHeaders(), userId, allCards, manageBack().
//
//  Карта собирается прямо здесь на canvas 960×1280, слоями:
//  арт → шаблон → логотип → статы → имя.
//  На сервер уходит уже готовая картинка (JPEG).
// =====================================================================

// ---------------------------------------------------------------------
//  НАСТРОЙКИ. Все координаты — в пикселях карты 960×1280.
//  Замерены по шаблонам IMG_1133 / IMG_1134 и готовым картам.
// ---------------------------------------------------------------------
var WS_CFG = {
    W: 960,
    H: 1280,
    dir: 'images/templates/',

    // Шрифты (положи .ttf в папку fonts/ под этими именами)
    fonts: {
        name: 'fonts/impact.ttf',   // Impact — имя персонажа (все редкости)
        stats: 'fonts/lozung.ttf'   // Molot — цифры статов (Легендарная и ниже); файл назван lozung.ttf
    },

    // Шаблоны рамок по редкостям
    templates: {
        mythic: 'mythic.png',
        legendary: 'legendary.png',
        epic: 'epic.png',
        rare: 'rare.png',
        common: 'common.png'
    },

    // Картинки статов мифической: speed_91.png … speed_100.png, str_…, int_…
    mythicStatFile: function (stat, value) {
        var p = { speed: 'speed_', strength: 'str_', intellect: 'int_' }[stat];
        return p + value + '.PNG';  // регистр важен: на GitHub Pages .PNG и .png — разные файлы
    },

    logosManifest: 'logos.json',  // { "Вселенная": "файл.png", ... }
    badArt: 'bad.webp',           // пример плохого арта для гайда

    // Арт: мифическая на всю карту, остальные — 96% по центру
    artScale: { mythic: 1, other: 0.96 },

    // Зона логотипа (левый верхний угол). Логотип вписывается целиком,
    // прозрачные поля по краям обрезаются автоматически.
    logo: { x: 52, y: 46, w: 205, h: 158 },

    mythic: {
        // baseline — линия, на которой стоят буквы; cap — высота заглавной
        name: { cx: 480, baseline: 1255.5, cap: 64, maxW: 780, stroke: 5 },
        // Если PNG статов размером 960×1280 — кладётся как есть.
        // Если вырезан по размеру цифр — вписывается в эту зону:
        // правый край right, высота h, центр по вертикали cy.
        stat: {
            right: 938, h: 52, maxW: 125,
            cy: { speed: 878.5, strength: 980, intellect: 1081.5 }
        }
    },
    other: {
        name: { cx: 478, baseline: 1171, cap: 65, maxW: 760, stroke: 4 },
        digit: {
            cx: 820, h: 39, stroke: 3.5, maxW: 112,
            cy: { speed: 788, strength: 874, intellect: 971.5 }
        }
    }
};

var WS_RARITIES = [
    { key: 'mythic',    label: 'Мифическая',  emoji: '🔴', color: '#ef4444', min: 91, max: 100 },
    { key: 'legendary', label: 'Легендарная', emoji: '🔵', color: '#3b82f6', min: 1,  max: 99 },
    { key: 'epic',      label: 'Эпическая',   emoji: '🟢', color: '#4ade80', min: 1,  max: 99 },
    { key: 'rare',      label: 'Редкая',      emoji: '🟡', color: '#fde047', min: 1,  max: 99 },
    { key: 'common',    label: 'Обычная',     emoji: '⚪️', color: '#cbd5e1', min: 1,  max: 99 }
];

var WS_STATS = [
    { key: 'speed',     label: 'Скорость',  icon: '⚡' },
    { key: 'strength',  label: 'Сила',      icon: '💪' },
    { key: 'intellect', label: 'Интеллект', icon: '🧠' }
];

// ---------------------------------------------------------------------
//  СОСТОЯНИЕ
// ---------------------------------------------------------------------
var ws = {
    built: false,
    tab: 'gallery',
    galleryPage: 0,
    rarity: 'legendary',
    seriesMode: 'none',      // 'none' | 'existing' | 'custom'
    series: '',
    customSeries: '',
    customLogo: null,        // canvas с обрезанным логотипом игрока
    name: '',
    stats: { speed: 85, strength: 85, intellect: 85 },
    src: null,               // canvas с артом игрока (уменьшенный)
    crop: null,              // { sx, sy, sw, sh } в пикселях src
    logos: null,             // манифест логотипов
    fontsReady: null,        // Promise
    fontFamily: { name: 'Impact, "Arial Narrow", sans-serif', stats: 'Impact, sans-serif' },
    guideStep: 0,
    viewing: null,           // работа, открытая в просмотре
    busy: false,
    renderQueued: false
};

var WS_GUIDE_KEY = 'ws_guide_seen_v1';

// ---------------------------------------------------------------------
//  УТИЛИТЫ
// ---------------------------------------------------------------------
function wsEsc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
}

function wsHaptic(type) {
    try {
        if (!tg.HapticFeedback) return;
        if (type === 'select') tg.HapticFeedback.selectionChanged();
        else if (type === 'success' || type === 'error' || type === 'warning') tg.HapticFeedback.notificationOccurred(type);
        else tg.HapticFeedback.impactOccurred(type || 'light');
    } catch (e) {}
}

function wsToast(text, isError) {
    var el = document.getElementById('wsToast');
    if (!el) return;
    el.textContent = text;
    el.className = 'ws-toast show' + (isError ? ' error' : '');
    clearTimeout(wsToast._t);
    wsToast._t = setTimeout(function () { el.className = 'ws-toast' + (isError ? ' error' : ''); }, 2600);
}

function wsRarity(key) {
    for (var i = 0; i < WS_RARITIES.length; i++) if (WS_RARITIES[i].key === key) return WS_RARITIES[i];
    return WS_RARITIES[1];
}

function wsRarityByName(name) {
    name = name || '';
    for (var i = 0; i < WS_RARITIES.length; i++) if (name.indexOf(WS_RARITIES[i].label) === 0) return WS_RARITIES[i];
    return WS_RARITIES[4];
}

function wsDaysLeft(sec) {
    var d = Math.ceil(sec / 86400);
    if (sec < 3600) return 'меньше часа';
    if (sec < 86400) return Math.ceil(sec / 3600) + ' ч';
    return d + ' ' + (d === 1 ? 'день' : (d < 5 ? 'дня' : 'дней'));
}

function wsStorageGet(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
}
function wsStorageSet(key, val) {
    try { localStorage.setItem(key, val); } catch (e) {}
    try { if (tg.CloudStorage && tg.isVersionAtLeast && tg.isVersionAtLeast('6.9')) tg.CloudStorage.setItem(key, val); } catch (e) {}
}
// Гайд показываем один раз на аккаунт: сначала смотрим localStorage,
// потом облачное хранилище Telegram (на случай другого устройства).
function wsGuideSeen() {
    return new Promise(function (resolve) {
        if (wsStorageGet(WS_GUIDE_KEY)) return resolve(true);
        try {
            if (tg.CloudStorage && tg.isVersionAtLeast && tg.isVersionAtLeast('6.9')) {
                var done = false;
                setTimeout(function () { if (!done) { done = true; resolve(false); } }, 1500);
                tg.CloudStorage.getItem(WS_GUIDE_KEY, function (err, val) {
                    if (done) return;
                    done = true;
                    if (val) { try { localStorage.setItem(WS_GUIDE_KEY, '1'); } catch (e) {} }
                    resolve(!!val);
                });
                return;
            }
        } catch (e) {}
        resolve(false);
    });
}

// ---------------------------------------------------------------------
//  ЗАГРУЗКА РЕСУРСОВ
// ---------------------------------------------------------------------
var wsImgCache = {};
function wsLoadImg(url) {
    if (wsImgCache[url]) return wsImgCache[url];
    var p = new Promise(function (resolve, reject) {
        var img = new Image();
        img.decoding = 'async';
        img.onload = function () { resolve(img); };
        img.onerror = function () { delete wsImgCache[url]; reject(new Error('Не найден файл: ' + url)); };
        img.src = url;
    });
    wsImgCache[url] = p;
    return p;
}

function wsLoadFonts() {
    if (ws.fontsReady) return ws.fontsReady;
    function load(family, url, key) {
        if (!window.FontFace) return Promise.resolve();
        var ff = new FontFace(family, 'url("' + encodeURI(url) + '")');
        return ff.load().then(function (f) {
            document.fonts.add(f);
            ws.fontFamily[key] = '"' + family + '"';
        }).catch(function () {
            console.warn('[Мастерская] Шрифт не загрузился: ' + url);
        });
    }
    ws.fontsReady = Promise.all([
        load('WSCardName', WS_CFG.fonts.name, 'name'),
        load('WSCardStats', WS_CFG.fonts.stats, 'stats')
    ]);
    return ws.fontsReady;
}

function wsLoadLogos() {
    if (ws.logos) return Promise.resolve(ws.logos);
    return fetch(WS_CFG.dir + WS_CFG.logosManifest, { cache: 'no-cache' })
        .then(function (r) { return r.ok ? r.json() : {}; })
        .catch(function () { return {}; })
        .then(function (data) { ws.logos = data || {}; return ws.logos; });
}

// Обрезает прозрачные поля вокруг картинки (у логотипов их бывает много)
function wsTrim(img) {
    var w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var x = c.getContext('2d');
    x.drawImage(img, 0, 0);
    var data;
    try { data = x.getImageData(0, 0, w, h).data; } catch (e) { return c; }
    var minX = w, minY = h, maxX = -1, maxY = -1;
    for (var y = 0; y < h; y++) {
        for (var xx = 0; xx < w; xx++) {
            if (data[(y * w + xx) * 4 + 3] > 12) {
                if (xx < minX) minX = xx;
                if (xx > maxX) maxX = xx;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }
    if (maxX < 0) return c;
    var out = document.createElement('canvas');
    out.width = maxX - minX + 1;
    out.height = maxY - minY + 1;
    out.getContext('2d').drawImage(c, minX, minY, out.width, out.height, 0, 0, out.width, out.height);
    return out;
}

var wsTrimCache = {};
function wsLoadTrimmed(url) {
    if (wsTrimCache[url]) return wsTrimCache[url];
    wsTrimCache[url] = wsLoadImg(url).then(wsTrim);
    return wsTrimCache[url];
}

// Читает файл игрока в canvas, уменьшая слишком большие картинки
function wsFileToCanvas(file, maxSide) {
    return new Promise(function (resolve, reject) {
        if (!file || !/^image\//.test(file.type || 'image/')) return reject(new Error('Это не картинка'));
        var url = URL.createObjectURL(file);
        var img = new Image();
        img.onload = function () {
            var w = img.naturalWidth, h = img.naturalHeight;
            var k = Math.min(1, maxSide / Math.max(w, h));
            var c = document.createElement('canvas');
            c.width = Math.round(w * k);
            c.height = Math.round(h * k);
            var x = c.getContext('2d');
            x.imageSmoothingQuality = 'high';
            x.drawImage(img, 0, 0, c.width, c.height);
            URL.revokeObjectURL(url);
            resolve(c);
        };
        img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Не удалось открыть картинку')); };
        img.src = url;
    });
}

// ---------------------------------------------------------------------
//  РЕНДЕР КАРТЫ
// ---------------------------------------------------------------------
function wsArtRect(rarity) {
    var k = rarity === 'mythic' ? WS_CFG.artScale.mythic : WS_CFG.artScale.other;
    var w = WS_CFG.W * k, h = WS_CFG.H * k;
    return { x: (WS_CFG.W - w) / 2, y: (WS_CFG.H - h) / 2, w: w, h: h };
}

// Вписывает картинку в прямоугольник целиком, по центру
function wsDrawContain(ctx, img, box) {
    var iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
    if (!iw || !ih) return;
    var k = Math.min(box.w / iw, box.h / ih);
    var w = iw * k, h = ih * k;
    ctx.drawImage(img, box.x + (box.w - w) / 2, box.y + (box.h - h) / 2, w, h);
}

// Текст с чёрной обводкой. Размер шрифта подбирается так, чтобы высота
// заглавной буквы была ровно cfg.cap — так не важно, какие метрики у файла
// шрифта. Длинный текст сначала сжимается по ширине (до 82%), потом
// уменьшается, оставаясь по центру плашки.
function wsDrawOutlined(ctx, text, family, cfg, capProbe) {
    if (!text) return;
    ctx.save();
    ctx.font = '200px ' + family;
    var probe = ctx.measureText(capProbe || 'Н');
    var capAt200 = probe.actualBoundingBoxAscent || 145;
    var size = 200 * cfg.cap / capAt200;
    ctx.font = size + 'px ' + family;

    var textW = ctx.measureText(text).width + cfg.stroke * 2;
    var squeeze = 1, scale = 1;
    if (textW > cfg.maxW) {
        squeeze = Math.max(0.82, cfg.maxW / textW);
        if (textW * squeeze > cfg.maxW) scale = cfg.maxW / (textW * squeeze);
    }
    var cap = cfg.cap * scale;
    var capCenter = cfg.baseline - cfg.cap / 2;
    var baseline = capCenter + cap / 2;
    ctx.font = (size * scale) + 'px ' + family;

    ctx.translate(cfg.cx, baseline);
    ctx.scale(squeeze, 1);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    ctx.lineWidth = cfg.stroke * 2 * Math.max(0.75, scale);
    ctx.strokeStyle = '#000';
    ctx.fillStyle = '#fff';
    ctx.strokeText(text, 0, 0);
    ctx.fillText(text, 0, 0);
    ctx.restore();
}

async function wsRenderCard(canvas, opts) {
    opts = opts || {};
    var ctx = canvas.getContext('2d');
    var W = WS_CFG.W, H = WS_CFG.H;
    var rarity = ws.rarity;
    var isMythic = rarity === 'mythic';

    await wsLoadFonts();

    // Всё грузим заранее, чтобы рисовать без мигания
    var tplP = wsLoadImg(WS_CFG.dir + WS_CFG.templates[rarity]).catch(function (e) { return e; });
    var logoP = wsCurrentLogo();
    var statP = isMythic
        ? Promise.all(WS_STATS.map(function (s) {
            return wsLoadImg(WS_CFG.dir + WS_CFG.mythicStatFile(s.key, ws.stats[s.key])).catch(function (e) { return e; });
        }))
        : Promise.resolve([]);
    var tpl = await tplP, logo = await logoP, statImgs = await statP;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#05050a';
    ctx.fillRect(0, 0, W, H);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 1. Арт
    var art = wsArtRect(rarity);
    if (ws.src && ws.crop) {
        ctx.drawImage(ws.src, ws.crop.sx, ws.crop.sy, ws.crop.sw, ws.crop.sh, art.x, art.y, art.w, art.h);
    } else if (opts.preview) {
        var g = ctx.createLinearGradient(0, 0, W, H);
        g.addColorStop(0, '#1d1640');
        g.addColorStop(1, '#0a0814');
        ctx.fillStyle = g;
        ctx.fillRect(art.x, art.y, art.w, art.h);
        ctx.fillStyle = 'rgba(196,181,253,0.55)';
        ctx.font = '600 44px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Здесь будет твой арт', W / 2, H * 0.36);
    }

    // 2. Шаблон
    var missing = [];
    if (tpl instanceof Error) missing.push(WS_CFG.templates[rarity]);
    else ctx.drawImage(tpl, 0, 0, W, H);

    // 3. Логотип
    if (logo) wsDrawContain(ctx, logo, WS_CFG.logo);

    // 4. Статы
    if (isMythic) {
        var sc = WS_CFG.mythic.stat;
        statImgs.forEach(function (img, i) {
            var key = WS_STATS[i].key;
            if (img instanceof Error) { missing.push(WS_CFG.mythicStatFile(key, ws.stats[key])); return; }
            var iw = img.naturalWidth, ih = img.naturalHeight;
            if (iw >= 480 && Math.abs(iw / ih - W / H) < 0.01) {
                ctx.drawImage(img, 0, 0, W, H);          // PNG во весь размер карты (3:4, любой масштаб)
            } else {
                var t = wsTrim(img);                      // PNG вырезан по цифрам
                var k = Math.min(sc.h / t.height, sc.maxW / t.width);
                var w = t.width * k, h = t.height * k;
                ctx.drawImage(t, sc.right - w, sc.cy[key] - h / 2, w, h);
            }
        });
    } else {
        var dc = WS_CFG.other.digit;
        WS_STATS.forEach(function (s) {
            wsDrawOutlined(ctx, String(ws.stats[s.key]), ws.fontFamily.stats, {
                cx: dc.cx, baseline: dc.cy[s.key] + dc.h / 2, cap: dc.h, maxW: dc.maxW, stroke: dc.stroke
            }, '8');
        });
    }

    // 5. Имя
    var nc = isMythic ? WS_CFG.mythic.name : WS_CFG.other.name;
    wsDrawOutlined(ctx, ws.name.trim(), ws.fontFamily.name, nc, 'Н');

    return { missing: missing };
}

function wsCurrentLogo() {
    if (ws.seriesMode === 'custom') return Promise.resolve(ws.customLogo);
    if (ws.seriesMode !== 'existing' || !ws.series) return Promise.resolve(null);
    return wsLoadLogos().then(function (map) {
        var file = map[ws.series];
        if (!file) return null;
        return wsLoadTrimmed(WS_CFG.dir + file).catch(function () { return null; });
    });
}

var wsMissingWarned = {};
function wsQueuePreview() {
    if (ws.renderQueued) return;
    ws.renderQueued = true;
    requestAnimationFrame(function () {
        ws.renderQueued = false;
        var c = document.getElementById('wsPreview');
        if (!c) return;
        wsRenderCard(c, { preview: true }).then(function (res) {
            var miss = (res.missing || []).filter(function (m) { return !wsMissingWarned[m]; });
            if (miss.length) {
                miss.forEach(function (m) { wsMissingWarned[m] = 1; });
                wsToast('Нет файла шаблона: ' + miss[0], true);
            }
        });
    });
}

// ---------------------------------------------------------------------
//  РАЗМЕТКА
// ---------------------------------------------------------------------
var WS_ICON = {
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>',
    help: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.2a2.6 2.6 0 0 1 5 .9c0 1.7-2.5 2.3-2.5 3.9"/><circle cx="12" cy="17.2" r=".6" fill="currentColor"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/></svg>',
    crop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v12M7 11l5 5 5-5"/><path d="M4 20h16"/></svg>',
    publish: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
    brush: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M18.4 2.6a2 2 0 0 1 2.9 2.9L12 14.8 9.2 12z"/><path d="M9.2 12C6.5 12 5 13.8 5 16c0 1.6-1 2.7-2.5 3 1.3 1.5 3.3 2.2 5.5 2 3-.3 5-2.5 4-5.2"/></svg>',
    heart: '<svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.3 3 4.5 6.7 4.5c2.2 0 3.7 1.2 5.3 3.1 1.6-1.9 3.1-3.1 5.3-3.1 3.7 0 5.8 3.8 4.3 7.2C19.5 16.4 12 21 12 21z"/></svg>',
    bulb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1.1 2V16h5v-.2c.1-.8.5-1.5 1.1-2A6 6 0 0 0 12 3z"/></svg>',
    hammer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4l6 6-3 3-6-6z"/><path d="M11 7L3.5 14.5a2.1 2.1 0 0 0 3 3L14 10"/><path d="M17 3l4 4"/></svg>',
    gift: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v8h14v-8M12 8v12"/><path d="M12 8S10.5 3.5 8 4.2C6 4.8 7 8 12 8zM12 8s1.5-4.5 4-3.8C18 4.8 17 8 12 8z"/></svg>',
    ticket: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z"/><path d="M14 6v12" stroke-dasharray="2 2.5"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5z"/><path d="M8.5 12l2.5 2.5 4.5-5" stroke-linecap="round"/></svg>',
    crown: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 7l4.5 4L12 4l4.5 7L21 7l-2 12H5z"/></svg>',
    pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>',
    view1: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="3" width="12" height="18" rx="2"/></svg>',
    view2: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="7.5" height="16" rx="1.5"/><rect x="13.5" y="4" width="7.5" height="16" rx="1.5"/></svg>'
};

var WS_PURPOSES = [
    { key: 'craft',      label: 'Крафт',   icon: 'hammer', text: 'Карту можно будет скрафтить' },
    { key: 'battlepack', label: 'Батлпак', icon: 'gift',   text: 'Карта как награда в батлпаке' },
    { key: 'pass',       label: 'Пасс',    icon: 'ticket', text: 'Приоритет — вселенные, которые уже есть в боте' },
    { key: 'other',      label: 'Другое',  icon: 'pen',    text: 'Опиши идею в комментарии' }
];

function wsPurpose(key) {
    for (var i = 0; i < WS_PURPOSES.length; i++) if (WS_PURPOSES[i].key === key) return WS_PURPOSES[i];
    return null;
}

function wsBuild() {
    if (ws.built) return;
    ws.built = true;
    var root = document.getElementById('wsScreen');
    root.innerHTML =
        '<div class="ws-head">' +
            '<button class="ws-icon-btn" onclick="workshopBack()" aria-label="Назад">' + WS_ICON.back + '</button>' +
            '<div class="ws-head-txt"><div class="ws-title">Мастерская</div></div>' +
            '<button class="ws-icon-btn" onclick="openWorkshopGuide()" aria-label="Как выбрать арт">' + WS_ICON.help + '</button>' +
        '</div>' +
        '<div class="ws-body" id="wsHome">' +
            '<section class="ws-hero">' +
                '<div class="ws-hero-copy">' +
                    '<h1 class="ws-hero-title">Собери свою карту</h1>' +
                    '<p class="ws-hero-text">Загрузи арт — рамку, статы и имя мастерская наложит сама. Лучшие карты попадают в бота.</p>' +
                    '<button class="ws-btn primary" onclick="openWorkshopEditor()">' + WS_ICON.plus + ' Создать карту</button>' +
                '</div>' +
                '<div class="ws-hero-fan" id="wsHeroFan" aria-hidden="true"></div>' +
            '</section>' +
            '<div class="ws-seg" role="tablist">' +
                '<span class="ws-seg-pill" id="wsSegPill"></span>' +
                '<button class="ws-seg-btn active" id="wsTabGallery" role="tab" onclick="wsSwitchTab(\'gallery\')">Лента</button>' +
                '<button class="ws-seg-btn" id="wsTabMine" role="tab" onclick="wsSwitchTab(\'mine\')">Мои работы<span class="ws-seg-dot" id="wsMineDot"></span></button>' +
            '</div>' +
            '<div id="wsFeedPane">' +
                '<div class="ws-sortbar">' +
                    '<button class="ws-sort active" data-sort="new" onclick="wsSetSort(\'new\')">Новые</button>' +
                    '<button class="ws-sort" data-sort="top" onclick="wsSetSort(\'top\')">Популярные</button>' +
                    '<span class="ws-view" role="group" aria-label="Вид ленты">' +
                        '<button class="ws-view-btn" data-cols="1" aria-label="По одной карте" onclick="wsSetCols(1)">' + WS_ICON.view1 + '</button>' +
                        '<button class="ws-view-btn" data-cols="2" aria-label="По две карты в ряд" onclick="wsSetCols(2)">' + WS_ICON.view2 + '</button>' +
                    '</span>' +
                '</div>' +
                '<div class="ws-feed" id="wsFeed"></div>' +
                '<div class="ws-more" id="wsFeedMore"></div>' +
            '</div>' +
            '<div id="wsMinePane" style="display:none">' +
                '<p class="ws-note" id="wsMineNote">Работы хранятся 14 дней. Скачай карту, чтобы не потерять её.</p>' +
                '<div class="ws-grid" id="wsMineGrid"></div>' +
            '</div>' +
        '</div>' +

        // ---------- ГАЙД ----------
        '<div class="ws-layer ws-guide" id="wsGuide">' +
            '<div class="ws-guide-top">' +
                '<div class="ws-guide-dots" id="wsGuideDots"></div>' +
                '<div class="ws-guide-count" id="wsGuideCount">1/4</div>' +
                '<button class="ws-icon-btn" onclick="closeWorkshopGuide()" aria-label="Закрыть">' + WS_ICON.close + '</button>' +
            '</div>' +
            '<div class="ws-guide-page" id="wsGuidePage"></div>' +
            '<div class="ws-guide-nav">' +
                '<button class="ws-btn ghost" id="wsGuidePrev" onclick="wsGuideGo(-1)">Назад</button>' +
                '<button class="ws-btn primary" id="wsGuideNext" onclick="wsGuideGo(1)">Далее</button>' +
            '</div>' +
        '</div>' +

        // ---------- РЕДАКТОР ----------
        '<div class="ws-layer ws-editor" id="wsEditor">' +
            '<div class="ws-head">' +
                '<button class="ws-icon-btn" onclick="workshopBack()" aria-label="Назад">' + WS_ICON.back + '</button>' +
                '<div class="ws-head-txt"><div class="ws-title">Новая карта</div></div>' +
                '<div style="width:40px"></div>' +
            '</div>' +
            '<div class="ws-editor-scroll">' +
                '<div class="ws-preview-wrap"><div class="ws-preview-aura" id="wsPreviewAura"></div><canvas id="wsPreview" width="960" height="1280"></canvas></div>' +

                '<div class="ws-field"><div class="ws-label">Редкость</div><div class="ws-chips" id="wsRarityChips"></div>' +
                    '<div class="ws-hint">Божественные карты в мастерской не создаются.</div></div>' +

                '<div class="ws-field"><div class="ws-label">Вселенная</div>' +
                    '<select id="wsSeriesSelect" class="ws-native-select" data-cs-title="Вселенная" data-cs-search="always" onchange="wsOnSeries(this.value)"></select>' +
                    '<div id="wsCustomSeries" class="ws-custom" style="display:none">' +
                        '<input class="ws-input" id="wsCustomSeriesName" maxlength="60" placeholder="Название вселенной" oninput="ws.customSeries=this.value">' +
                        '<div class="ws-logo-row">' +
                            '<div class="ws-logo-box" id="wsLogoBox">Без лого</div>' +
                            '<div class="ws-logo-btns">' +
                                '<label class="ws-btn ghost small">' + WS_ICON.upload + ' Загрузить лого<input type="file" accept="image/*" hidden onchange="wsOnLogoFile(this)"></label>' +
                                '<button class="ws-btn ghost small" id="wsLogoClear" style="display:none" onclick="wsClearLogo()">Убрать</button>' +
                            '</div>' +
                        '</div>' +
                        '<div class="ws-hint">Лучше всего — PNG с прозрачным фоном.</div>' +
                    '</div>' +
                    '<div class="ws-hint" id="wsSeriesHint"></div>' +
                '</div>' +

                '<div class="ws-field"><div class="ws-label">Имя персонажа</div>' +
                    '<input class="ws-input" id="wsName" maxlength="24" placeholder="Например: Сон Джин-Ву" oninput="wsOnName(this.value)"></div>' +

                '<div class="ws-field"><div class="ws-label">Статы <span id="wsStatRange"></span></div><div id="wsStats"></div></div>' +

                '<div class="ws-field"><div class="ws-label">Арт</div>' +
                    '<div class="ws-art-btns">' +
                        '<label class="ws-btn ghost">' + WS_ICON.upload + ' <span id="wsArtLbl">Загрузить арт</span><input type="file" accept="image/*" hidden id="wsArtInput" onchange="wsOnArtFile(this)"></label>' +
                        '<button class="ws-btn ghost" id="wsRecropBtn" style="display:none" onclick="openWorkshopCropper()">' + WS_ICON.crop + ' Обрезка</button>' +
                    '</div>' +
                    '<div class="ws-hint">Высокое качество, детальный фон, персонаж в полный рост. Картинка сразу обрежется под формат карты 3:4.</div>' +
                '</div>' +
            '</div>' +
            '<div class="ws-editor-foot"><button class="ws-btn primary wide" id="wsCreateBtn" onclick="wsCreate()">Создать карту</button></div>' +
        '</div>' +

        // ---------- ОБРЕЗКА ----------
        '<div class="ws-layer ws-cropper" id="wsCropper">' +
            '<div class="ws-crop-head">' +
                '<button class="ws-btn ghost small" onclick="closeWorkshopCropper()">Отмена</button>' +
                '<div class="ws-crop-title">Обрезка 3:4</div>' +
                '<button class="ws-btn primary small" id="wsCropDoneBtn" onclick="wsCropDone()">Готово</button>' +
            '</div>' +
            '<div class="ws-crop-stage-wrap" id="wsCropWrap"><canvas id="wsCropCanvas"></canvas></div>' +
            '<div class="ws-crop-tools">' +
                '<input type="range" id="wsCropZoom" min="0" max="1000" value="0" aria-label="Масштаб" oninput="wsCropZoomSlider(this.value)">' +
                '<label class="ws-crop-check"><input type="checkbox" id="wsCropFrame" checked onchange="wsCropDraw()"> Показать рамку</label>' +
                '<div class="ws-hint center">Двигай пальцем, разводи двумя пальцами для масштаба</div>' +
            '</div>' +
        '</div>' +

        // ---------- ПРОСМОТР РАБОТЫ ----------
        '<div class="ws-layer ws-viewer" id="wsViewer">' +
            '<div class="ws-viewer-top">' +
                '<div id="wsViewerHead" class="ws-viewer-head"></div>' +
                '<button class="ws-icon-btn" onclick="closeWorkshopViewer()" aria-label="Закрыть">' + WS_ICON.close + '</button>' +
            '</div>' +
            '<div class="ws-viewer-scroll">' +
                '<div class="ws-stage" id="wsViewerStage"></div>' +
                '<div id="wsViewerBody"></div>' +
            '</div>' +
        '</div>' +

        // ---------- ПРЕДЛОЖИТЬ В БОТА ----------
        '<div class="ws-sheet-backdrop" id="wsSuggest" onclick="if(event.target===this)closeWorkshopSuggest()">' +
            '<div class="ws-sheet" role="dialog" aria-modal="true" aria-labelledby="wsSgTitle">' +
                '<div class="ws-sheet-grab"></div>' +
                '<div class="ws-sheet-head">' +
                    '<div class="ws-sheet-thumb" id="wsSgThumb"></div>' +
                    '<div><div class="ws-sheet-title" id="wsSgTitle">Предложить в бота</div>' +
                    '<div class="ws-sheet-sub">Модератор посмотрит карту и ответит тебе в бот.</div></div>' +
                '</div>' +
                '<div class="ws-label">Для чего карта</div>' +
                '<div class="ws-purposes" id="wsSgPurposes"></div>' +
                '<div class="ws-label" id="wsSgNoteLabel">Комментарий модератору</div>' +
                '<div class="ws-textarea-wrap">' +
                    '<textarea class="ws-input ws-textarea" id="wsSgNote" maxlength="500" rows="4" ' +
                        'placeholder="Почему эта карта нужна в боте? Например: персонажа нет в игре, а в пассе его ждут многие." ' +
                        'oninput="wsSgCount()"></textarea>' +
                    '<span class="ws-counter" id="wsSgCounter">0/500</span>' +
                '</div>' +
                '<label class="ws-switch" id="wsSgPublishRow">' +
                    '<input type="checkbox" id="wsSgPublish">' +
                    '<span class="ws-switch-track"><span class="ws-switch-knob"></span></span>' +
                    '<span class="ws-switch-txt"><b>Сразу опубликовать в ленте</b><span id="wsSgPublishSub">Другие игроки увидят карту и смогут ставить лайки</span></span>' +
                '</label>' +
                '<button class="ws-btn gold wide" id="wsSgSend" onclick="wsSuggestSend()">' + WS_ICON.send + ' Отправить модератору</button>' +
            '</div>' +
        '</div>' +

        '<div class="ws-busy" id="wsBusy"><div class="ws-spinner"></div><div id="wsBusyText">Сохраняю…</div></div>' +
        '<div class="ws-toast" id="wsToast" role="status" aria-live="polite"></div>';

    wsBuildEditorParts();
    wsInitCropperEvents();
    wsInitFeedEvents();
}

function wsBuildEditorParts() {
    var chips = document.getElementById('wsRarityChips');
    chips.innerHTML = WS_RARITIES.map(function (r) {
        return '<button class="ws-chip" data-r="' + r.key + '" style="--c:' + r.color + '" onclick="wsSetRarity(\'' + r.key + '\')">' +
            '<i></i>' + r.label + '</button>';
    }).join('');

    var stats = document.getElementById('wsStats');
    stats.innerHTML = WS_STATS.map(function (s) {
        return '<div class="ws-stat-row">' +
            '<div class="ws-stat-name">' + s.icon + ' ' + s.label + '</div>' +
            '<button class="ws-step" aria-label="Меньше" onclick="wsStep(\'' + s.key + '\',-1)">−</button>' +
            '<input class="ws-stat-input" id="wsStat_' + s.key + '" type="number" inputmode="numeric" aria-label="' + s.label + '" ' +
                'oninput="wsOnStatInput(\'' + s.key + '\',this.value)" onblur="wsStatBlur(\'' + s.key + '\')">' +
            '<button class="ws-step" aria-label="Больше" onclick="wsStep(\'' + s.key + '\',1)">+</button>' +
        '</div>';
    }).join('');

    // Кастомный дропдаун сайта вместо нативного
    if (window.CustomSelect) {
        try { CustomSelect.init('#wsSeriesSelect'); } catch (e) {}
    } else {
        document.getElementById('wsSeriesSelect').classList.add('ws-input');
    }
}

function wsBotSeries() {
    var set = {};
    (typeof allCards !== 'undefined' ? allCards : []).forEach(function (c) { if (c && c.series) set[c.series] = 1; });
    (ws.knownSeries || []).forEach(function (s) { set[s] = 1; });
    return set;
}

function wsFillSeriesSelect() {
    var sel = document.getElementById('wsSeriesSelect');
    var list = Object.keys(wsBotSeries()).sort(function (a, b) { return a.localeCompare(b, 'ru'); });
    var html = '<option value="__none">🚫 Без лого</option>';
    html += '<option value="__custom">✨ Своя вселенная</option>';
    html += '<optgroup label="Вселенные из бота">';
    list.forEach(function (s) { html += '<option value="' + wsEsc(s) + '">' + wsEsc(s) + '</option>'; });
    html += '</optgroup>';
    sel.innerHTML = html;
    sel.value = ws.seriesMode === 'custom' ? '__custom' : (ws.seriesMode === 'existing' ? ws.series : '__none');
    if (window.CustomSelect) try { CustomSelect.refresh(sel); } catch (e) {}
}

// ---------------------------------------------------------------------
//  ОТКРЫТИЕ / ЗАКРЫТИЕ / КНОПКА «НАЗАД»
// ---------------------------------------------------------------------
function wsLayerOpen(id) {
    var el = document.getElementById(id);
    return !!(el && el.classList.contains('open'));
}

function isWorkshopOpen() {
    var s = document.getElementById('wsScreen');
    return !!(s && s.classList.contains('open'));
}

function openWorkshop() {
    wsHaptic('light');
    wsBuild();
    document.getElementById('wsScreen').classList.add('open');
    document.body.classList.add('ws-lock');
    if (typeof manageBack === 'function') manageBack();
    wsLoadFonts();
    wsLoadLogos();
    wsRenderHeroFan();
    wsSetCols(ws.cols, true);
    wsSwitchTab(ws.tab, true);
    var skipGuide = ws.skipGuideOnce;
    ws.skipGuideOnce = false;
    wsGuideSeen().then(function (seen) { if (!seen && !skipGuide) openWorkshopGuide(); });
}

function closeWorkshop() {
    document.getElementById('wsScreen').classList.remove('open');
    document.body.classList.remove('ws-lock');
    if (typeof manageBack === 'function') manageBack();
}

// Закрывает верхний слой мастерской. Вызывается из кнопки «Назад» Telegram.
function workshopBack() {
    if (document.getElementById('wsBusy').classList.contains('show')) return;
    var pub = document.getElementById('publicProfileScreen');
    if (pub && pub.classList.contains('open') && typeof closePublicProfile === 'function') return closePublicProfile();
    if (window.CustomSelect) try { CustomSelect.closeAll(); } catch (e) {}
    if (wsLayerOpen('wsSuggest')) return closeWorkshopSuggest();
    if (wsLayerOpen('wsViewer')) return closeWorkshopViewer();
    if (wsLayerOpen('wsCropper')) return closeWorkshopCropper();
    if (wsLayerOpen('wsGuide')) return closeWorkshopGuide();
    if (wsLayerOpen('wsEditor')) return closeWorkshopEditor();
    closeWorkshop();
}

// Веер из трёх настоящих карт бота в шапке мастерской
function wsRenderHeroFan() {
    var el = document.getElementById('wsHeroFan');
    if (!el || el.childElementCount) return;
    var cards = wsGuideExamples();
    if (!cards.length) return;   // каталог ещё грузится — попробуем при следующем входе
    el.innerHTML = cards.slice(0, 3).map(function (c, i) {
        var src = 'images/' + c.file;
        return '<img class="ws-fan-card f' + i + '" src="' + wsEsc(src) + '" alt="" loading="lazy" ' +
            'onerror="this.onerror=null;this.src=\'' + wsEsc(src.replace(/\.jpe?g$/i, '.webp')) + '\'">';
    }).join('');
}

// ---------------------------------------------------------------------
//  ГАЙД
// ---------------------------------------------------------------------
var WS_GUIDE = [
    function () {
        return '<div class="ws-g-icon">' + WS_ICON.brush + '</div>' +
            '<div class="ws-g-kicker">Шаг 1 · Вступление</div>' +
            '<div class="ws-g-title">Как выбрать арт для Воркшопа</div>' +
            '<p class="ws-g-text">Хороший арт = больше голосов = выше шанс попасть в игру. Этот гайд за минуту покажет, что заходит, а что нет.</p>' +
            '<div class="ws-g-callout"><b>Важно:</b> арт — первое, что видят голосующие. Сильный арт вытянет среднюю карту, а слабый утопит даже отличную идею.</div>';
    },
    function () {
        return '<div class="ws-g-kicker">Шаг 2 · Чек-лист</div>' +
            '<div class="ws-g-title">💡 Главные правила</div>' +
            '<p class="ws-g-text">Стремись к арту, за который не стыдно настоящему художнику. Короткий чек-лист:</p>' +
            '<div class="ws-g-list good"><div class="ws-g-list-title">Нужно</div>' +
                '<div>Высокое качество и разрешение.</div>' +
                '<div>Насыщенный, детальный фон — не однотонный и не тёмный.</div>' +
                '<div>Персонаж в полный рост, в живой динамичной позе.</div>' +
                '<div>Загружай сразу несколько артов (до 8).</div>' +
            '</div>' +
            '<div class="ws-g-list bad"><div class="ws-g-list-title">Избегай</div>' +
                '<div>Белый, однотонный или тёмный фон.</div>' +
                '<div>Сгенерированный нейросетью или низкокачественный арт.</div>' +
                '<div>Кривой ракурс, обрезанный или статичный персонаж.</div>' +
            '</div>';
    },
    function () {
        return '<div class="ws-g-kicker">Шаг 3 · Плохой пример</div>' +
            '<div class="ws-g-title">⚠️ Так делать не надо</div>' +
            '<div class="ws-g-bad-img"><img src="' + WS_CFG.dir + WS_CFG.badArt + '" alt="Пример плохого арта" onerror="this.parentElement.classList.add(\'empty\')"><span>✕</span></div>' +
            '<p class="ws-g-text">Такой арт отклонят. Почему:</p>' +
            '<div class="ws-g-list bad compact">' +
                '<div>Пустой белый фон.</div><div>Похоже на AI-генерацию.</div>' +
                '<div>Неудачный ракурс и статичная поза.</div><div>Низкое качество.</div>' +
            '</div>' +
            '<div class="ws-g-callout"><b>Простое правило:</b> если это похоже на быстрый AI-рендер на пустом фоне — арт не готов. Найди настоящую иллюстрацию.</div>';
    },
    function () {
        var cards = wsGuideExamples();
        var imgs = cards.map(function (c) {
            var src = 'images/' + c.file;
            var fb = src.replace(/\.jpe?g$/i, '.webp');
            var r = wsRarityByName(c.rarity);
            return '<div class="ws-g-ex" style="--c:' + r.color + '"><img src="' + wsEsc(src) + '" alt="' + wsEsc(c.name) +
                '" onerror="this.onerror=null;this.src=\'' + wsEsc(fb) + '\'"></div>';
        }).join('');
        return '<div class="ws-g-kicker">Шаг 4 · Идеальные примеры</div>' +
            '<div class="ws-g-title">✨ Вот к чему стремиться</div>' +
            '<div class="ws-g-examples">' + imgs + '</div>' +
            '<p class="ws-g-text">Детальный фон, живая поза, чистая картинка без артефактов. Такие карты уже есть в игре.</p>';
    }
];

// 2 мифические + 1 легендарная или 2 легендарные + 1 мифическая
function wsGuideExamples() {
    if (ws.guideCards) return ws.guideCards;
    var src = (typeof allCards !== 'undefined' ? allCards : []).filter(function (c) { return c && c.file; });
    var myth = src.filter(function (c) { return (c.rarity || '').indexOf('Мифич') === 0; });
    var leg = src.filter(function (c) { return (c.rarity || '').indexOf('Легенд') === 0; });
    function pick(arr, n) {
        var a = arr.slice(), out = [];
        while (a.length && out.length < n) out.push(a.splice(Math.floor(Math.random() * a.length), 1)[0]);
        return out;
    }
    var res = Math.random() < 0.5 ? pick(myth, 2).concat(pick(leg, 1)) : pick(leg, 2).concat(pick(myth, 1));
    res.sort(function () { return Math.random() - 0.5; });
    // Кешируем только непустой набор: каталог карт мог ещё не загрузиться
    if (res.length) ws.guideCards = res;
    return res;
}

function openWorkshopGuide() {
    wsHaptic('light');
    ws.guideStep = 0;
    ws.guideCards = null;
    wsRenderGuide();
    document.getElementById('wsGuide').classList.add('open');
}

function closeWorkshopGuide() {
    document.getElementById('wsGuide').classList.remove('open');
    wsStorageSet(WS_GUIDE_KEY, '1');
}

function wsGuideGo(dir) {
    wsHaptic('select');
    var n = ws.guideStep + dir;
    if (n >= WS_GUIDE.length) {
        closeWorkshopGuide();
        openWorkshopEditor();
        return;
    }
    if (n < 0) return;
    ws.guideStep = n;
    wsRenderGuide();
}

function wsRenderGuide() {
    var total = WS_GUIDE.length, i = ws.guideStep;
    var page = document.getElementById('wsGuidePage');
    page.innerHTML = WS_GUIDE[i]();
    page.scrollTop = 0;
    page.classList.remove('in');
    void page.offsetWidth;
    page.classList.add('in');
    document.getElementById('wsGuideCount').textContent = (i + 1) + '/' + total;
    var dots = '';
    for (var k = 0; k < total; k++) dots += '<span class="' + (k <= i ? 'on' : '') + '"></span>';
    document.getElementById('wsGuideDots').innerHTML = dots;
    document.getElementById('wsGuidePrev').style.display = i === 0 ? 'none' : '';
    document.getElementById('wsGuideNext').textContent = i === total - 1 ? 'Создать карту' : 'Далее';
}

// ---------------------------------------------------------------------
//  РЕДАКТОР
// ---------------------------------------------------------------------
function openWorkshopEditor() {
    wsHaptic('light');
    wsBuild();
    wsFillSeriesSelect();
    document.getElementById('wsName').value = ws.name;
    document.getElementById('wsCustomSeriesName').value = ws.customSeries;
    wsSetRarity(ws.rarity, true);
    wsOnSeries(document.getElementById('wsSeriesSelect').value, true);
    wsUpdateArtButtons();
    document.getElementById('wsEditor').classList.add('open');
    wsQueuePreview();
}

function closeWorkshopEditor(force) {
    if (!force && ws.src) {
        var doClose = function (ok) {
            if (ok) closeWorkshopEditor(true);
        };
        if (tg.showConfirm) tg.showConfirm('Выйти из редактора? Несохранённая карта останется в черновике до закрытия приложения.', doClose);
        else doClose(confirm('Выйти из редактора?'));
        return;
    }
    document.getElementById('wsEditor').classList.remove('open');
}

function wsSetRarity(key, silent) {
    if (!silent) wsHaptic('select');
    ws.rarity = key;
    var r = wsRarity(key);
    document.querySelectorAll('#wsRarityChips .ws-chip').forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-r') === key);
    });
    document.getElementById('wsStatRange').textContent = r.min + '–' + r.max;
    var aura = document.getElementById('wsPreviewAura');
    if (aura) aura.style.setProperty('--c', r.color);
    WS_STATS.forEach(function (s) { ws.stats[s.key] = wsClampStat(ws.stats[s.key]); });
    wsSyncStatInputs();
    wsQueuePreview();
}

function wsClampStat(v) {
    var r = wsRarity(ws.rarity);
    v = parseInt(v, 10);
    if (isNaN(v)) v = r.min;
    return Math.max(r.min, Math.min(r.max, v));
}

function wsSyncStatInputs() {
    var r = wsRarity(ws.rarity);
    WS_STATS.forEach(function (s) {
        var el = document.getElementById('wsStat_' + s.key);
        if (!el) return;
        el.min = r.min;
        el.max = r.max;
        el.value = ws.stats[s.key];
        el.classList.remove('bad');
    });
}

function wsStep(key, d) {
    wsHaptic('select');
    ws.stats[key] = wsClampStat(ws.stats[key] + d);
    wsSyncStatInputs();
    wsQueuePreview();
}

function wsOnStatInput(key, val) {
    var r = wsRarity(ws.rarity);
    var v = parseInt(val, 10);
    var el = document.getElementById('wsStat_' + key);
    var ok = !isNaN(v) && v >= r.min && v <= r.max;
    el.classList.toggle('bad', !ok);
    if (ok) {
        ws.stats[key] = v;
        wsQueuePreview();
    }
}

function wsStatBlur(key) {
    var el = document.getElementById('wsStat_' + key);
    ws.stats[key] = wsClampStat(el.value === '' ? ws.stats[key] : el.value);
    wsSyncStatInputs();
    wsQueuePreview();
}

function wsOnName(v) {
    ws.name = v.replace(/[\u0000-\u001f]/g, '');
    wsQueuePreview();
}

function wsOnSeries(val, silent) {
    var custom = document.getElementById('wsCustomSeries');
    var hint = document.getElementById('wsSeriesHint');
    hint.textContent = '';
    if (val === '__custom') {
        ws.seriesMode = 'custom';
        custom.style.display = 'block';
    } else if (val === '__none' || !val) {
        ws.seriesMode = 'none';
        ws.series = '';
        custom.style.display = 'none';
    } else {
        ws.seriesMode = 'existing';
        ws.series = val;
        custom.style.display = 'none';
        wsLoadLogos().then(function (map) {
            if (ws.series === val && !map[val]) hint.textContent = 'У этой вселенной пока нет логотипа — карта будет без лого.';
        });
    }
    if (!silent) wsHaptic('select');
    wsQueuePreview();
}

function wsOnLogoFile(input) {
    var file = input.files && input.files[0];
    input.value = '';
    if (!file) return;
    wsFileToCanvas(file, 1200).then(function (c) {
        ws.customLogo = wsTrim(c);
        var box = document.getElementById('wsLogoBox');
        box.innerHTML = '';
        var prev = document.createElement('canvas');
        prev.width = ws.customLogo.width;
        prev.height = ws.customLogo.height;
        prev.getContext('2d').drawImage(ws.customLogo, 0, 0);
        box.appendChild(prev);
        document.getElementById('wsLogoClear').style.display = '';
        wsQueuePreview();
    }).catch(function (e) { wsToast(e.message, true); });
}

function wsClearLogo() {
    ws.customLogo = null;
    document.getElementById('wsLogoBox').textContent = 'Без лого';
    document.getElementById('wsLogoClear').style.display = 'none';
    wsQueuePreview();
}

function wsOnArtFile(input) {
    var file = input.files && input.files[0];
    input.value = '';
    if (!file) return;
    wsBusy(true, 'Открываю картинку…');
    // 2560px по длинной стороне хватает с запасом: карта 960×1280
    wsFileToCanvas(file, 2560).then(function (c) {
        wsBusy(false);
        if (c.width < 300 || c.height < 400) wsToast('Картинка очень маленькая — карта выйдет размытой', true);
        ws.pendingSrc = c;
        openWorkshopCropper(c);
    }).catch(function (e) {
        wsBusy(false);
        wsToast(e.message, true);
    });
}

function wsUpdateArtButtons() {
    document.getElementById('wsArtLbl').textContent = ws.src ? 'Заменить арт' : 'Загрузить арт';
    document.getElementById('wsRecropBtn').style.display = ws.src ? '' : 'none';
}

function wsBusy(on, text) {
    var el = document.getElementById('wsBusy');
    if (!el) return;
    if (text) document.getElementById('wsBusyText').textContent = text;
    el.classList.toggle('show', !!on);
}

// ---------------------------------------------------------------------
//  ОБРЕЗКА 3:4
// ---------------------------------------------------------------------
var wsCrop = { img: null, tpl: null, s: 1, sMin: 1, sMax: 6, tx: 0, ty: 0, SW: 300, SH: 400, ptrs: {}, pinch: null };

function openWorkshopCropper(srcCanvas) {
    var img = srcCanvas || ws.src;
    if (!img) return;
    wsCrop.img = img;
    wsCrop.tpl = null;
    wsLoadImg(WS_CFG.dir + WS_CFG.templates[ws.rarity]).then(function (tpl) {
        wsCrop.tpl = tpl;
        if (wsLayerOpen('wsCropper')) wsCropDraw();
    }).catch(function () {});
    document.getElementById('wsCropper').classList.add('open');
    try { if (tg.disableVerticalSwipes) tg.disableVerticalSwipes(); } catch (e) {}
    requestAnimationFrame(function () {
        wsCropLayout();
        // При повторной обрезке того же арта — возвращаем прошлое положение
        if (!srcCanvas && ws.crop) {
            wsCrop.s = wsCrop.SW / ws.crop.sw;
            wsCrop.tx = -ws.crop.sx * wsCrop.s;
            wsCrop.ty = -ws.crop.sy * wsCrop.s;
        } else {
            wsCrop.s = wsCrop.sMin;
            wsCrop.tx = (wsCrop.SW - img.width * wsCrop.s) / 2;
            wsCrop.ty = (wsCrop.SH - img.height * wsCrop.s) / 2;
        }
        wsCropClamp();
        wsCropDraw();
    });
}

function closeWorkshopCropper() {
    document.getElementById('wsCropper').classList.remove('open');
    ws.pendingSrc = null;
    try { if (tg.enableVerticalSwipes) tg.enableVerticalSwipes(); } catch (e) {}
}

function wsCropLayout() {
    var wrap = document.getElementById('wsCropWrap');
    var cv = document.getElementById('wsCropCanvas');
    var maxW = wrap.clientWidth - 24, maxH = wrap.clientHeight - 24;
    var SW = Math.min(maxW, maxH * 3 / 4);
    var SH = SW * 4 / 3;
    var dpr = Math.min(window.devicePixelRatio || 1, 3);
    cv.style.width = SW + 'px';
    cv.style.height = SH + 'px';
    cv.width = Math.round(SW * dpr);
    cv.height = Math.round(SH * dpr);
    wsCrop.SW = SW;
    wsCrop.SH = SH;
    wsCrop.dpr = dpr;
    var img = wsCrop.img;
    wsCrop.sMin = Math.max(SW / img.width, SH / img.height);
    wsCrop.sMax = wsCrop.sMin * 6;
}

function wsCropClamp() {
    var c = wsCrop, img = c.img;
    c.s = Math.max(c.sMin, Math.min(c.sMax, c.s));
    var w = img.width * c.s, h = img.height * c.s;
    c.tx = Math.min(0, Math.max(c.SW - w, c.tx));
    c.ty = Math.min(0, Math.max(c.SH - h, c.ty));
    var slider = document.getElementById('wsCropZoom');
    if (slider) slider.value = Math.round(Math.log(c.s / c.sMin) / Math.log(c.sMax / c.sMin) * 1000) || 0;
}

function wsCropDraw() {
    var c = wsCrop, cv = document.getElementById('wsCropCanvas');
    if (!cv || !c.img) return;
    var x = cv.getContext('2d');
    x.setTransform(c.dpr, 0, 0, c.dpr, 0, 0);
    x.clearRect(0, 0, c.SW, c.SH);
    x.imageSmoothingQuality = 'high';
    x.drawImage(c.img, c.tx, c.ty, c.img.width * c.s, c.img.height * c.s);

    // Полупрозрачная рамка карты поверх — видно, что закроет шаблон
    if (c.tpl && document.getElementById('wsCropFrame').checked) {
        var art = wsArtRect(ws.rarity);
        var k = c.SW / art.w;
        x.save();
        x.globalAlpha = 0.85;
        x.drawImage(c.tpl, -art.x * k, -art.y * k, WS_CFG.W * k, WS_CFG.H * k);
        x.restore();
    }
    // Сетка третей
    x.strokeStyle = 'rgba(255,255,255,0.22)';
    x.lineWidth = 1;
    x.beginPath();
    for (var i = 1; i < 3; i++) {
        x.moveTo(c.SW * i / 3, 0); x.lineTo(c.SW * i / 3, c.SH);
        x.moveTo(0, c.SH * i / 3); x.lineTo(c.SW, c.SH * i / 3);
    }
    x.stroke();
}

function wsCropZoomAt(newS, px, py) {
    var c = wsCrop;
    newS = Math.max(c.sMin, Math.min(c.sMax, newS));
    // Точка под пальцем остаётся на месте
    c.tx = px - (px - c.tx) * (newS / c.s);
    c.ty = py - (py - c.ty) * (newS / c.s);
    c.s = newS;
    wsCropClamp();
    wsCropDraw();
}

function wsCropZoomSlider(v) {
    var c = wsCrop;
    var s = c.sMin * Math.pow(c.sMax / c.sMin, v / 1000);
    wsCropZoomAt(s, c.SW / 2, c.SH / 2);
}

function wsInitCropperEvents() {
    var cv = document.getElementById('wsCropCanvas');
    function local(e) {
        var r = cv.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top };
    }
    cv.addEventListener('pointerdown', function (e) {
        cv.setPointerCapture(e.pointerId);
        wsCrop.ptrs[e.pointerId] = local(e);
        wsCrop.pinch = null;
        e.preventDefault();
    });
    cv.addEventListener('pointermove', function (e) {
        var c = wsCrop;
        if (!c.ptrs[e.pointerId]) return;
        var p = local(e);
        var ids = Object.keys(c.ptrs);
        if (ids.length === 1) {
            var prev = c.ptrs[e.pointerId];
            c.tx += p.x - prev.x;
            c.ty += p.y - prev.y;
            c.ptrs[e.pointerId] = p;
            wsCropClamp();
            wsCropDraw();
        } else if (ids.length >= 2) {
            c.ptrs[e.pointerId] = p;
            var a = c.ptrs[ids[0]], b = c.ptrs[ids[1]];
            var dist = Math.hypot(a.x - b.x, a.y - b.y);
            var mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
            if (c.pinch) {
                c.tx += mid.x - c.pinch.mid.x;
                c.ty += mid.y - c.pinch.mid.y;
                wsCropZoomAt(c.s * dist / c.pinch.dist, mid.x, mid.y);
            }
            c.pinch = { dist: dist || 1, mid: mid };
        }
        e.preventDefault();
    });
    function up(e) {
        delete wsCrop.ptrs[e.pointerId];
        wsCrop.pinch = null;
    }
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', function (e) {
        e.preventDefault();
        var p = local(e);
        wsCropZoomAt(wsCrop.s * Math.pow(1.0015, -e.deltaY), p.x, p.y);
    }, { passive: false });
    window.addEventListener('resize', function () {
        if (!wsLayerOpen('wsCropper') || !wsCrop.img) return;
        var cx = (wsCrop.SW / 2 - wsCrop.tx) / wsCrop.s, cy = (wsCrop.SH / 2 - wsCrop.ty) / wsCrop.s;
        var rel = wsCrop.s / wsCrop.sMin;
        wsCropLayout();
        wsCrop.s = wsCrop.sMin * rel;
        wsCrop.tx = wsCrop.SW / 2 - cx * wsCrop.s;
        wsCrop.ty = wsCrop.SH / 2 - cy * wsCrop.s;
        wsCropClamp();
        wsCropDraw();
    });
}

function wsCropDone() {
    wsHaptic('medium');
    var c = wsCrop;
    ws.src = c.img;
    ws.crop = { sx: -c.tx / c.s, sy: -c.ty / c.s, sw: c.SW / c.s, sh: c.SH / c.s };
    closeWorkshopCropper();
    wsUpdateArtButtons();
    wsQueuePreview();
    // Показываем превью с только что обрезанным артом
    var sc = document.querySelector('#wsEditor .ws-editor-scroll');
    if (sc) sc.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---------------------------------------------------------------------
//  СОЗДАНИЕ И СОХРАНЕНИЕ
// ---------------------------------------------------------------------
function wsCanvasToJpeg(canvas, quality) {
    return new Promise(function (resolve) {
        canvas.toBlob(function (blob) {
            var fr = new FileReader();
            fr.onload = function () { resolve({ dataUrl: fr.result, size: blob.size }); };
            fr.readAsDataURL(blob);
        }, 'image/jpeg', quality);
    });
}

async function wsCreate() {
    if (ws.busy) return;
    var name = ws.name.trim();
    if (!name) { wsToast('Впиши имя персонажа', true); wsHaptic('error'); document.getElementById('wsName').focus(); return; }
    if (!ws.src || !ws.crop) { wsToast('Загрузи арт для карты', true); wsHaptic('error'); return; }
    if (ws.seriesMode === 'custom' && !ws.customSeries.trim() && ws.customLogo) {
        wsToast('Впиши название своей вселенной', true);
        return;
    }
    WS_STATS.forEach(function (s) { ws.stats[s.key] = wsClampStat(ws.stats[s.key]); });
    wsSyncStatInputs();

    ws.busy = true;
    wsBusy(true, 'Собираю карту…');
    try {
        var canvas = document.createElement('canvas');
        canvas.width = WS_CFG.W;
        canvas.height = WS_CFG.H;
        var res = await wsRenderCard(canvas, { preview: false });
        if (res.missing.length) throw new Error('Нет файла шаблона: ' + res.missing[0]);

        var out = await wsCanvasToJpeg(canvas, 0.93);
        if (out.size > 2.8 * 1024 * 1024) out = await wsCanvasToJpeg(canvas, 0.85);

        wsBusy(true, 'Сохраняю…');
        var series = ws.seriesMode === 'existing' ? ws.series : (ws.seriesMode === 'custom' ? ws.customSeries.trim() : '');
        var r = await fetch(API_BASE + '/api/workshop/save/' + userId, {
            method: 'POST',
            headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
            body: JSON.stringify({
                image: out.dataUrl,
                name: name,
                rarity: ws.rarity,
                series: series,
                speed: ws.stats.speed,
                strength: ws.stats.strength,
                intellect: ws.stats.intellect
            })
        });
        var data = await r.json();
        if (!data.success) throw new Error(data.error || data.detail || 'Не удалось сохранить карту');

        wsHaptic('success');
        // Черновик сбрасываем только арт и имя: редкость и вселенная удобны для следующей карты
        ws.src = null;
        ws.crop = null;
        ws.name = '';
        document.getElementById('wsName').value = '';
        wsUpdateArtButtons();
        closeWorkshopEditor(true);
        wsSwitchTab('mine', true);
        openWorkshopViewer(data.work, true);
        wsToast('Карта готова! Она хранится 14 дней');
    } catch (e) {
        wsHaptic('error');
        wsToast(e.message || 'Ошибка соединения', true);
    } finally {
        ws.busy = false;
        wsBusy(false);
    }
}

// ---------------------------------------------------------------------
//  ЛЕНТА И МОИ РАБОТЫ
// ---------------------------------------------------------------------
var WS_PUB = {
    'private':  { t: 'Только у тебя',  c: 'muted' },
    'pending':  { t: 'На проверке',    c: 'wait' },
    'public':   { t: 'В ленте',        c: 'ok' },
    'rejected': { t: 'Не прошла',      c: 'bad' }
};
var WS_SUG = {
    'none':     { t: 'Не предлагалась', c: 'muted' },
    'pending':  { t: 'Модератор смотрит', c: 'wait' },
    'accepted': { t: 'Берут в бота',   c: 'gold' },
    'declined': { t: 'Не подошла',     c: 'bad' }
};

// Все карточки, которые сейчас на экране, по токену — чтобы лайк
// в просмотре сразу отражался в ленте и наоборот
ws.byToken = {};
ws.sort = 'new';
ws.feed = [];
ws.feedPage = 0;
ws.feedMore = false;
ws.feedLoading = false;
ws.likeBusy = {};
ws.feedReq = 0;
ws.cols = 1;
try { if (localStorage.getItem('ws_feed_cols') === '2') ws.cols = 2; } catch (e) {}

function wsRemember(w) {
    var old = ws.byToken[w.token];
    if (old) { for (var k in w) old[k] = w[k]; return old; }
    ws.byToken[w.token] = w;
    return w;
}

function wsAgo(ts) {
    if (!ts) return '';
    var s = Math.max(0, Math.floor(Date.now() / 1000) - ts);
    if (s < 60) return 'только что';
    if (s < 3600) return Math.floor(s / 60) + ' мин';
    if (s < 86400) return Math.floor(s / 3600) + ' ч';
    return Math.floor(s / 86400) + ' дн';
}

function wsPlural(n, one, few, many) {
    var m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
}

function wsAvatar(author, size) {
    var name = (author && author.name) || 'Игрок';
    var src = API_BASE + '/api/avatar/' + author.id + '?name=' + encodeURIComponent(name);
    var fb = 'https://placehold.co/96x96/1c1c28/8b5cf6?text=' + encodeURIComponent(name.charAt(0).toUpperCase()).replace(/'/g, '%27');
    return '<span class="ws-ava' + (author.frame_url ? ' framed' : '') + '" style="--s:' + (size || 40) + 'px">' +
        '<img class="ws-ava-img" src="' + wsEsc(src) + '" alt="" loading="lazy" onerror="this.onerror=null;this.src=\'' + fb + '\'">' +
        (author.frame_url ? '<img class="ws-ava-frame" src="' + wsEsc(author.frame_url) + '" alt="" loading="lazy">' : '') +
    '</span>';
}

function wsAuthorBtn(w, size, extra) {
    var a = w.author || { id: w.user_id, name: 'Игрок' };
    return '<button class="ws-author" onclick="wsOpenAuthor(' + a.id + ')">' +
        wsAvatar(a, size) +
        '<span class="ws-author-txt"><span class="ws-author-name">' + wsEsc(a.name) +
            (a.premium ? '<span class="ws-crown">' + WS_ICON.crown + '</span>' : '') + '</span>' +
            (extra ? '<span class="ws-author-sub">' + extra + '</span>' : '') +
        '</span></button>';
}

function wsOpenAuthor(id) {
    if (typeof openPublicProfile !== 'function') return;
    openPublicProfile(id);
}

function wsSwitchTab(tab, silent) {
    if (!silent) wsHaptic('select');
    ws.tab = tab;
    document.getElementById('wsTabGallery').classList.toggle('active', tab === 'gallery');
    document.getElementById('wsTabMine').classList.toggle('active', tab === 'mine');
    document.getElementById('wsSegPill').style.transform = tab === 'mine' ? 'translateX(100%)' : 'none';
    document.getElementById('wsFeedPane').style.display = tab === 'gallery' ? '' : 'none';
    document.getElementById('wsMinePane').style.display = tab === 'mine' ? '' : 'none';
    if (tab === 'gallery') wsLoadFeed(true);
    else wsLoadMine();
}

function wsSetSort(sort) {
    if (ws.sort === sort) return;
    wsHaptic('select');
    ws.sort = sort;
    document.querySelectorAll('#wsFeedPane .ws-sort').forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-sort') === sort);
    });
    wsLoadFeed(true);
}

async function wsGet(path) {
    var r = await fetch(API_BASE + path, { headers: authHeaders() });
    return r.json();
}

async function wsLoadFeed(reset) {
    if (!reset && (ws.feedLoading || !ws.feedMore)) return;
    var feed = document.getElementById('wsFeed');
    var more = document.getElementById('wsFeedMore');
    var req = ++ws.feedReq;
    if (reset) {
        ws.feedPage = 0;
        ws.feed = [];
        feed.innerHTML = wsSkeletonPosts(ws.cols === 2 ? 4 : 2);
        more.innerHTML = '';
    } else {
        more.innerHTML = '<div class="ws-spinner small"></div>';
    }
    ws.feedLoading = true;
    try {
        var data = await wsGet('/api/workshop/gallery/' + userId + '?page=' + ws.feedPage + '&sort=' + ws.sort);
        if (req !== ws.feedReq) return;          // пока грузили, сменили сортировку
        if (!data.success) throw new Error(data.error || data.detail || '');

        if (reset) feed.innerHTML = '';
        if (!data.works.length && reset) {
            feed.innerHTML =
                '<div class="ws-empty">' +
                    '<div class="ws-empty-ico">' + WS_ICON.brush + '</div>' +
                    '<b>В ленте пока пусто</b>' +
                    '<span>Создай карту и опубликуй её — она появится здесь первой.</span>' +
                    '<button class="ws-btn ghost small" onclick="openWorkshopEditor()">' + WS_ICON.plus + ' Создать карту</button>' +
                '</div>';
        }
        var frag = '';
        data.works.forEach(function (w) {
            w = wsRemember(w);
            ws.feed.push(w);
            frag += wsPostHtml(w);
        });
        feed.insertAdjacentHTML('beforeend', frag);
        ws.feedMore = !!data.has_more;
        ws.feedPage += 1;
        more.innerHTML = ws.feedMore ? '<button class="ws-btn ghost small" onclick="wsLoadFeed(false)">Показать ещё</button>' : '';
    } catch (e) {
        if (req !== ws.feedReq) return;
        if (reset) feed.innerHTML = '<div class="ws-empty error"><b>Ленту не удалось загрузить</b><span>' +
            wsEsc(e.message || 'Проверь соединение') + '</span><button class="ws-btn ghost small" onclick="wsLoadFeed(true)">Повторить</button></div>';
        else {
            more.innerHTML = '<button class="ws-btn ghost small" onclick="wsLoadFeed(false)">Показать ещё</button>';
            wsToast('Не удалось загрузить ещё карты', true);
        }
    } finally {
        if (req === ws.feedReq) ws.feedLoading = false;
    }
}

// Вид ленты: 1 или 2 карты в ряд (запоминается на устройстве)
function wsSetCols(n, silent) {
    n = n === 2 ? 2 : 1;
    if (!silent) wsHaptic('select');
    ws.cols = n;
    wsStorageLocalSet('ws_feed_cols', String(n));
    var feed = document.getElementById('wsFeed');
    if (feed) feed.classList.toggle('cols-2', n === 2);
    document.querySelectorAll('#wsFeedPane .ws-view-btn').forEach(function (b) {
        var on = b.getAttribute('data-cols') === String(n);
        b.classList.toggle('active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
}

function wsStorageLocalSet(key, val) {
    try { localStorage.setItem(key, val); } catch (e) {}
}

function wsSkeletonPosts(n) {
    var s = '';
    for (var i = 0; i < n; i++) {
        s += '<div class="ws-post skeleton"><div class="ws-post-head"><span class="sk sk-ava"></span><span class="sk sk-line"></span></div>' +
            '<div class="ws-post-media"><div class="sk sk-card"></div></div></div>';
    }
    return s;
}

function wsRarityStyle(w) {
    var r = wsRarityByName(w.rarity);
    return '--c:' + r.color;
}

function wsPostHtml(w) {
    var r = wsRarityByName(w.rarity);
    var sub = wsEsc(w.series || 'Своя вселенная');
    return '<article class="ws-post" data-token="' + w.token + '" style="' + wsRarityStyle(w) + '">' +
        '<header class="ws-post-head">' +
            wsAuthorBtn(w, 40, wsAgo(w.published_at)) +
            '<span class="ws-rar-pill"><i></i>' + r.label + '</span>' +
        '</header>' +
        '<div class="ws-post-media" data-action="media">' +
            '<div class="ws-post-aura"></div>' +
            '<img class="ws-post-img" src="' + API_BASE + w.image_url + '" alt="' + wsEsc(w.name) + '" loading="lazy" decoding="async">' +
            '<span class="ws-burst" aria-hidden="true"></span>' +
        '</div>' +
        '<footer class="ws-post-foot">' +
            wsLikeBtn(w) +
            '<div class="ws-post-meta"><b>' + wsEsc(w.name) + '</b><span>' + sub + '</span></div>' +
            '<button class="ws-round" data-action="send" aria-label="Отправить себе в чат">' + WS_ICON.send + '</button>' +
        '</footer>' +
    '</article>';
}

function wsLikeBtn(w) {
    return '<button class="ws-like' + (w.liked ? ' on' : '') + '" data-action="like" aria-pressed="' + (w.liked ? 'true' : 'false') + '" aria-label="Нравится">' +
        '<span class="ws-like-ico">' + WS_ICON.heart + '</span><span class="ws-like-n">' + (w.likes || 0) + '</span></button>';
}

function wsInitFeedEvents() {
    var lastTap = {};
    var tapTimer = null;
    document.getElementById('wsFeed').addEventListener('click', function (e) {
        var btn = e.target.closest('[data-action]');
        var post = e.target.closest('.ws-post');
        if (!btn || !post || post.classList.contains('skeleton')) return;
        var token = post.getAttribute('data-token');
        var w = ws.byToken[token];
        if (!w) return;
        var act = btn.getAttribute('data-action');

        if (act === 'like') return wsToggleLike(w, false);
        if (act === 'send') return wsSendToChat(w);
        if (act === 'media') {
            // Двойной тап — лайк, одиночный — открыть карту
            var now = Date.now();
            if (lastTap[token] && now - lastTap[token] < 320) {
                clearTimeout(tapTimer);
                lastTap[token] = 0;
                wsBurst(post);
                if (!w.liked) wsToggleLike(w, true);
                return;
            }
            lastTap[token] = now;
            clearTimeout(tapTimer);
            tapTimer = setTimeout(function () { openWorkshopViewer(w); }, 320);
        }
    });
}

function wsBurst(post) {
    var b = post.querySelector('.ws-burst');
    if (!b) return;
    wsHaptic('medium');
    b.innerHTML = WS_ICON.heart + '<i></i><i></i><i></i><i></i><i></i><i></i>';
    b.classList.remove('go');
    void b.offsetWidth;
    b.classList.add('go');
}

function wsSyncLike(w) {
    document.querySelectorAll('[data-token="' + w.token + '"] .ws-like, .ws-like[data-token="' + w.token + '"]').forEach(function (el) {
        el.classList.toggle('on', !!w.liked);
        el.setAttribute('aria-pressed', w.liked ? 'true' : 'false');
        el.querySelector('.ws-like-n').textContent = w.likes || 0;
        if (w.liked) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
    });
}

async function wsToggleLike(w, onlyLike) {
    if (w.status !== 'public') { wsToast('Лайки ставят только опубликованным картам', true); return; }
    if (ws.likeBusy[w.token]) return;
    if (onlyLike && w.liked) return;
    ws.likeBusy[w.token] = true;
    var prev = { liked: w.liked, likes: w.likes };
    w.liked = !w.liked;
    w.likes = Math.max(0, (w.likes || 0) + (w.liked ? 1 : -1));
    wsHaptic(w.liked ? 'light' : 'select');
    wsSyncLike(w);
    try {
        var d = await wsPost('/api/workshop/like/', { token: w.token });
        if (!d.success) throw new Error(d.error || d.detail);
        w.liked = d.liked;
        w.likes = d.likes;
        wsSyncLike(w);
    } catch (e) {
        w.liked = prev.liked;
        w.likes = prev.likes;
        wsSyncLike(w);
        wsToast(e.message || 'Лайк не сохранился — проверь соединение', true);
    } finally {
        ws.likeBusy[w.token] = false;
    }
}

function wsOpenToken(token) {
    var w = ws.byToken[token];
    if (w) openWorkshopViewer(w);
}

// ---------- МОИ РАБОТЫ ----------
async function wsLoadMine() {
    var grid = document.getElementById('wsMineGrid');
    if (!ws.myWorks) grid.innerHTML = '<div class="ws-empty"><div class="ws-spinner small"></div></div>';
    try {
        var data = await wsGet('/api/workshop/my/' + userId);
        if (!data.success) throw new Error(data.error || data.detail || '');
        ws.knownSeries = data.known_series || ws.knownSeries;
        ws.myWorks = data.works.map(wsRemember);
        wsRenderMine(data.limit);
    } catch (e) {
        if (ws.tab === 'mine') grid.innerHTML = '<div class="ws-empty error"><b>Работы не загрузились</b><span>' +
            wsEsc(e.message || 'Проверь соединение') + '</span><button class="ws-btn ghost small" onclick="wsLoadMine()">Повторить</button></div>';
    }
}

function wsRenderMine(limit) {
    var grid = document.getElementById('wsMineGrid');
    var works = ws.myWorks || [];
    var hasReply = works.some(function (w) { return w.mod_reply; });
    document.getElementById('wsMineDot').classList.toggle('on', hasReply);
    if (!works.length) {
        grid.innerHTML =
            '<div class="ws-empty">' +
                '<div class="ws-empty-ico">' + WS_ICON.plus + '</div>' +
                '<b>Здесь будут твои карты</b>' +
                '<span>Собери первую — это займёт пару минут.</span>' +
                '<button class="ws-btn ghost small" onclick="openWorkshopEditor()">Создать карту</button>' +
            '</div>';
        return;
    }
    document.getElementById('wsMineNote').textContent =
        works.length + ' из ' + (limit || 20) + ' · работы хранятся 14 дней, скачай карту, чтобы не потерять её.';
    grid.innerHTML = works.map(function (w) {
        var pub = WS_PUB[w.status] || WS_PUB['private'];
        var sg = w.suggest ? (WS_SUG[w.suggest.status] || WS_SUG.none) : WS_SUG.none;
        return '<button class="ws-tile" style="' + wsRarityStyle(w) + '" onclick="wsOpenToken(\'' + w.token + '\')">' +
            '<span class="ws-tile-img"><img loading="lazy" src="' + API_BASE + w.image_url + '" alt=""></span>' +
            (w.mod_reply ? '<span class="ws-tile-reply" title="Есть ответ модератора">' + WS_ICON.shield + '</span>' : '') +
            '<span class="ws-tile-name">' + wsEsc(w.name) + '</span>' +
            '<span class="ws-tile-tags">' +
                '<span class="ws-tag ' + pub.c + '">' + WS_ICON.publish + pub.t + '</span>' +
                (w.suggest && w.suggest.status !== 'none' ? '<span class="ws-tag ' + sg.c + '">' + WS_ICON.bulb + sg.t + '</span>' : '') +
            '</span>' +
            '<span class="ws-tile-sub">' + (w.status === 'public' ? (WS_ICON.heart + (w.likes || 0) + ' · ') : '') +
                'удалится через ' + wsDaysLeft(w.expires_in) + '</span>' +
        '</button>';
    }).join('');
}

// ---------------------------------------------------------------------
//  ПРОСМОТР РАБОТЫ
// ---------------------------------------------------------------------
function openWorkshopViewer(work) {
    if (!work) return;
    wsHaptic('light');
    work = wsRemember(work);
    ws.viewing = work;
    wsRenderViewer();
    var v = document.getElementById('wsViewer');
    v.classList.add('open');
    v.querySelector('.ws-viewer-scroll').scrollTop = 0;
}

function wsRenderViewer() {
    var w = ws.viewing;
    if (!w) return;
    var mine = w.user_id === userId;
    var r = wsRarityByName(w.rarity);
    var head = document.getElementById('wsViewerHead');
    head.innerHTML = w.author
        ? wsAuthorBtn(w, 34, w.published_at ? wsAgo(w.published_at) : '')
        : '<span class="ws-viewer-title">Моя карта</span>';

    var stage = document.getElementById('wsViewerStage');
    stage.setAttribute('style', wsRarityStyle(w));
    stage.innerHTML =
        '<div class="ws-post-aura"></div>' +
        '<img class="ws-stage-img" src="' + API_BASE + w.image_url + '" alt="' + wsEsc(w.name) + '">';

    var html = '';
    html += '<div class="ws-v-title" style="--c:' + r.color + '">' +
        '<h2>' + wsEsc(w.name) + '</h2>' +
        '<div class="ws-v-sub"><span class="ws-rar-pill"><i></i>' + r.label + '</span>' +
            '<span>' + wsEsc(w.series || 'Своя вселенная') + '</span></div>' +
        '<div class="ws-v-stats"><span>⚡ ' + w.speed + '</span><span>💪 ' + w.strength + '</span><span>🧠 ' + w.intellect + '</span></div>' +
    '</div>';

    if (w.status === 'public') {
        html += '<div class="ws-v-likes">' + wsLikeBtnTok(w) +
            '<span class="ws-v-likes-txt">' + (mine ? 'Лайки твоей карты' : 'Нравится карта? Поставь лайк') + '</span></div>';
    }

    if (mine) {
        var pub = WS_PUB[w.status] || WS_PUB['private'];
        var s = w.suggest || { status: 'none' };
        var sg = WS_SUG[s.status] || WS_SUG.none;
        var p = wsPurpose(s.purpose);
        html += '<div class="ws-track">' +
            '<div class="ws-track-row"><span class="ws-track-ico">' + WS_ICON.publish + '</span>' +
                '<span class="ws-track-txt"><b>Лента</b><span>' + wsPubHint(w) + '</span></span>' +
                '<span class="ws-tag ' + pub.c + '">' + pub.t + '</span></div>' +
            '<div class="ws-track-row"><span class="ws-track-ico">' + WS_ICON.bulb + '</span>' +
                '<span class="ws-track-txt"><b>Предложение в бота</b><span>' +
                    (p ? p.label + (s.note ? ' · «' + wsEsc(s.note.length > 70 ? s.note.slice(0, 70) + '…' : s.note) + '»' : '') : 'Модератор может взять карту в игру') +
                '</span></span>' +
                '<span class="ws-tag ' + sg.c + '">' + sg.t + '</span></div>' +
        '</div>';
        if (w.mod_reply) {
            html += '<div class="ws-reply">' +
                '<div class="ws-reply-head"><span class="ws-reply-ava">' + WS_ICON.shield + '</span><b>Модератор</b>' +
                    '<span>' + wsAgo(w.mod_reply_at) + '</span></div>' +
                '<p>' + wsEsc(w.mod_reply).replace(/\n/g, '<br>') + '</p>' +
            '</div>';
        }
        html += '<div class="ws-v-expire">Удалится через ' + wsDaysLeft(w.expires_in) + '</div>';
    }

    html += '<div class="ws-v-actions">';
    if (mine && s.status === 'none') {
        html += '<button class="ws-btn gold wide" onclick="openWorkshopSuggest()">' + WS_ICON.bulb + ' Предложить в бота</button>';
    }
    if (mine && (w.status === 'private' || w.status === 'rejected')) {
        html += '<button class="ws-btn accent wide" onclick="wsPublish()">' + WS_ICON.publish + ' Опубликовать в ленте</button>';
    }
    html += '<button class="ws-btn primary" onclick="wsSendToChat()">' + WS_ICON.send + ' В чат</button>';
    html += '<button class="ws-btn ghost" onclick="wsDownload()">' + WS_ICON.download + ' Скачать</button>';
    if (mine) html += '<button class="ws-btn danger wide" onclick="wsDeleteWork()">' + WS_ICON.trash + ' Удалить карту</button>';
    html += '</div>';

    document.getElementById('wsViewerBody').innerHTML = html;
}

function wsPubHint(w) {
    if (w.status === 'public') return (w.likes || 0) + ' ' + wsPlural(w.likes || 0, 'лайк', 'лайка', 'лайков');
    if (w.status === 'pending') return 'Модератор проверяет карту';
    if (w.status === 'rejected') return 'Можно отправить ещё раз';
    return 'Карту видишь только ты';
}

function wsLikeBtnTok(w) {
    return wsLikeBtn(w).replace('class="ws-like', 'data-token="' + w.token + '" onclick="wsToggleLike(ws.viewing,false)" class="ws-like');
}

function closeWorkshopViewer() {
    document.getElementById('wsViewer').classList.remove('open');
    ws.viewing = null;
}

async function wsPost(path, body) {
    var r = await fetch(API_BASE + path + userId, {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
        body: JSON.stringify(body)
    });
    return r.json();
}

async function wsSendToChat(work) {
    var w = work || ws.viewing;
    if (!w || ws.busy) return;
    ws.busy = true;
    wsHaptic('medium');
    try {
        var d = await wsPost('/api/workshop/send/', { token: w.token });
        if (!d.success) throw new Error(d.error || d.detail);
        wsHaptic('success');
        wsToast('Карта отправлена в чат с ботом');
    } catch (e) {
        wsToast(e.message || 'Ошибка соединения', true);
    } finally {
        ws.busy = false;
    }
}

function wsDownload() {
    if (!ws.viewing) return;
    wsHaptic('medium');
    var url = API_BASE + ws.viewing.download_url;
    var fileName = 'manhwcard_' + ws.viewing.id + '.jpg';
    try {
        // Telegram 8.0+: штатное окно сохранения файла
        if (tg.downloadFile && tg.isVersionAtLeast && tg.isVersionAtLeast('8.0')) {
            tg.downloadFile({ url: url, file_name: fileName }, function (accepted) {
                if (accepted) wsToast('Скачивание началось');
            });
            return;
        }
    } catch (e) {}
    // Старый Telegram: открываем во внешнем браузере, там файл скачается сам
    if (tg.openLink && tg.initData) {
        tg.openLink(url);
        return;
    }
    var a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
}

function wsAfterChange(updated) {
    if (updated) wsRemember(updated);
    if (ws.viewing) wsRenderViewer();
    if (ws.tab === 'mine') wsRenderMine();
}

function wsConfirm(msg, cb) {
    if (tg.showConfirm) tg.showConfirm(msg, cb);
    else cb(confirm(msg));
}

function wsPublish() {
    if (!ws.viewing || ws.busy) return;
    var w = ws.viewing;
    wsConfirm('Отправить карту на проверку? После одобрения её увидят все игроки в ленте.', async function (ok) {
        if (!ok) return;
        ws.busy = true;
        try {
            var d = await wsPost('/api/workshop/publish/', { token: w.token });
            if (!d.success) throw new Error(d.error || d.detail);
            wsHaptic('success');
            wsAfterChange(d.work);
            wsToast('Карта отправлена на проверку');
        } catch (e) {
            wsToast(e.message || 'Ошибка соединения', true);
        } finally {
            ws.busy = false;
        }
    });
}

function wsDeleteWork() {
    if (!ws.viewing || ws.busy) return;
    var w = ws.viewing;
    wsConfirm('Удалить карту навсегда? Лайки и заявки по ней тоже пропадут.', async function (ok) {
        if (!ok) return;
        ws.busy = true;
        try {
            var d = await wsPost('/api/workshop/delete/', { token: w.token });
            if (!d.success) throw new Error(d.error || d.detail);
            wsHaptic('success');
            delete ws.byToken[w.token];
            ws.myWorks = (ws.myWorks || []).filter(function (x) { return x.token !== w.token; });
            closeWorkshopViewer();
            wsToast('Карта удалена');
            if (ws.tab === 'mine') wsRenderMine(); else wsLoadFeed(true);
        } catch (e) {
            wsToast(e.message || 'Ошибка соединения', true);
        } finally {
            ws.busy = false;
        }
    });
}

// ---------------------------------------------------------------------
//  ПРЕДЛОЖИТЬ В БОТА
// ---------------------------------------------------------------------
function openWorkshopSuggest() {
    var w = ws.viewing;
    if (!w) return;
    wsHaptic('light');
    ws.sgPurpose = null;
    document.getElementById('wsSgThumb').innerHTML = '<img src="' + API_BASE + w.image_url + '" alt="">';
    document.getElementById('wsSgPurposes').innerHTML = WS_PURPOSES.map(function (p) {
        return '<button class="ws-purpose" data-p="' + p.key + '" aria-pressed="false" onclick="wsSgPick(\'' + p.key + '\')">' +
            '<span class="ws-purpose-ico">' + WS_ICON[p.icon] + '</span>' +
            '<b>' + p.label + '</b>' +
            '<span>' + p.text + '</span>' +
        '</button>';
    }).join('');
    var note = document.getElementById('wsSgNote');
    note.value = '';
    note.placeholder = WS_NOTE_HINT.def;
    wsSgCount();
    var pubRow = document.getElementById('wsSgPublishRow');
    var pubBox = document.getElementById('wsSgPublish');
    var canPublish = w.status === 'private' || w.status === 'rejected';
    pubBox.checked = canPublish;
    pubBox.disabled = !canPublish;
    pubRow.classList.toggle('disabled', !canPublish);
    document.getElementById('wsSgPublishSub').textContent = canPublish
        ? 'Другие игроки увидят карту и смогут ставить лайки. Что карта предложена в бота, они не узнают.'
        : (w.status === 'public' ? 'Карта уже в ленте' : 'Публикация уже на проверке');
    wsSgValidate();
    document.getElementById('wsSuggest').classList.add('open');
}

var WS_NOTE_HINT = {
    def: 'Почему эта карта нужна в боте? Например: персонажа нет в игре, а в пассе его ждут многие.',
    other: 'Напиши, для чего карта: событие, ивент, награда за топ — что угодно.'
};

function closeWorkshopSuggest() {
    document.getElementById('wsSuggest').classList.remove('open');
}

function wsSgPick(key) {
    wsHaptic('select');
    ws.sgPurpose = key;
    document.querySelectorAll('#wsSgPurposes .ws-purpose').forEach(function (b) {
        var on = b.getAttribute('data-p') === key;
        b.classList.toggle('active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    var note = document.getElementById('wsSgNote');
    note.placeholder = key === 'other' ? WS_NOTE_HINT.other : WS_NOTE_HINT.def;
    if (key === 'other' && !note.value.trim()) note.focus();
    wsSgValidate();
}

function wsSgCount() {
    var n = document.getElementById('wsSgNote').value.length;
    document.getElementById('wsSgCounter').textContent = n + '/500';
    wsSgValidate();
}

// «Другое» без комментария отправить нельзя: модератору нужно понять, о чём речь
function wsSgValid() {
    if (!ws.sgPurpose) return false;
    if (ws.sgPurpose === 'other') return document.getElementById('wsSgNote').value.trim().length >= 3;
    return true;
}

function wsSgValidate() {
    var ok = wsSgValid();
    document.getElementById('wsSgSend').disabled = !ok;
    document.getElementById('wsSgNoteLabel').textContent = ws.sgPurpose === 'other' ? 'Для чего карта — обязательно' : 'Комментарий модератору';
}

async function wsSuggestSend() {
    var w = ws.viewing;
    if (!w || ws.busy || !wsSgValid()) return;
    ws.busy = true;
    var btn = document.getElementById('wsSgSend');
    btn.disabled = true;
    try {
        var d = await wsPost('/api/workshop/suggest/', {
            token: w.token,
            purpose: ws.sgPurpose,
            note: document.getElementById('wsSgNote').value,
            publish: document.getElementById('wsSgPublish').checked
        });
        if (!d.success) throw new Error(d.error || d.detail);
        wsHaptic('success');
        closeWorkshopSuggest();
        wsAfterChange(d.work);
        wsToast('Карта отправлена модератору. Ответ придёт в бот');
    } catch (e) {
        wsHaptic('error');
        wsToast(e.message || 'Ошибка соединения', true);
    } finally {
        ws.busy = false;
        btn.disabled = !wsSgValid();
    }
}

// ---------------------------------------------------------------------
//  ПЕРЕХОД ПО ССЫЛКЕ
//  • из чата игроков: t.me/<бот>?startapp=ws_<token>  → start_param
//  • из бота (кнопка «Открыть в Мастерской»): ...?ws=<token> или ?ws=open
// ---------------------------------------------------------------------
function wsReadDeepLink() {
    var token = null, open = false;
    try {
        var sp = tg.initDataUnsafe && tg.initDataUnsafe.start_param;
        if (sp && sp.indexOf('ws_') === 0) token = sp.slice(3);
    } catch (e) {}
    try {
        var q = new URLSearchParams(window.location.search).get('ws');
        if (q === 'open') open = true;
        else if (q) token = q;
    } catch (e) {}
    if (token && !/^[A-Za-z0-9_-]{16,48}$/.test(token)) token = null;
    return { token: token, open: open || !!token };
}

async function wsHandleDeepLink() {
    var link = wsReadDeepLink();
    if (!link.open) return;
    ws.skipGuideOnce = !!link.token;     // сначала показываем карту, гайд — в другой раз
    openWorkshop();
    if (!link.token) return;
    try {
        var d = await wsGet('/api/workshop/work/' + userId + '?token=' + encodeURIComponent(link.token));
        if (!d.success) throw new Error(d.error || d.detail || '');
        openWorkshopViewer(d.work);
    } catch (e) {
        wsToast(e.message || 'Карту не удалось открыть', true);
    }
}

(function () {
    var run = function () { setTimeout(wsHandleDeepLink, 350); };
    if (document.readyState === 'complete') run();
    else window.addEventListener('load', run);
})();
