/* =====================================================================
   🎃 MANHWCARD · HALLOWEEN EVENT

   Подключается в <head> одной строкой. Сам включает тему до даты
   HW_END и сам выключается после неё. Логику приложения не трогает.

   Проверка вне сезона:  ...index.html?hw=1   (принудительно включить)
                         ...index.html?hw=0   (принудительно выключить)
   ===================================================================== */

(function () {
    'use strict';

    // ⚙️ До какого момента показывать тему (месяцы с нуля: 10 = ноябрь)
    var HW_END = new Date(2026, 10, 3, 0, 0, 0);   // 3 ноября 2026, 00:00

    var force = null;
    try { force = new URLSearchParams(location.search).get('hw'); } catch (e) { /* старый WebView */ }
    var active = force === '1' || (force !== '0' && Date.now() < HW_END.getTime());
    if (!active) return;

    document.documentElement.classList.add('hw-on');

    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var tgApp = (window.Telegram && window.Telegram.WebApp) || null;
    var uid = 0;

    function store(key, val) {
        try {
            if (val === undefined) return localStorage.getItem(key);
            localStorage.setItem(key, val);
        } catch (e) { return null; }
    }

    /* =================================================================
       SVG-ЗАГОТОВКИ
       ================================================================= */

    function pumpkinSVG() {
        var n = ++uid;
        return '' +
        '<svg class="hw-pumpkin" viewBox="0 0 64 60" aria-hidden="true">' +
          '<defs>' +
            '<radialGradient id="hwPk' + n + '" cx="42%" cy="38%" r="70%">' +
              '<stop offset="0" stop-color="#ffbf5e"/><stop offset=".55" stop-color="#f26a12"/><stop offset="1" stop-color="#8a2c06"/>' +
            '</radialGradient>' +
            '<radialGradient id="hwGl' + n + '" cx="50%" cy="50%" r="60%">' +
              '<stop offset="0" stop-color="#fff9c4"/><stop offset=".5" stop-color="#ffd23d"/><stop offset="1" stop-color="#ff8a00"/>' +
            '</radialGradient>' +
          '</defs>' +
          '<path d="M30 13 C30 7 33 2 38 1 L39.5 4 C35.5 5 34.5 8.5 34.5 13 Z" fill="#4d7c1f"/>' +
          '<path d="M34 9 C40 3 47 5 48 10" stroke="#6a9a2e" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
          '<ellipse cx="18" cy="37" rx="14.5" ry="20" fill="url(#hwPk' + n + ')"/>' +
          '<ellipse cx="46" cy="37" rx="14.5" ry="20" fill="url(#hwPk' + n + ')"/>' +
          '<ellipse cx="32" cy="36.5" rx="15.5" ry="22" fill="url(#hwPk' + n + ')"/>' +
          '<path d="M24.5 17 C20.5 27 20.5 46 24.5 56 M39.5 17 C43.5 27 43.5 46 39.5 56" stroke="rgba(110,35,5,.45)" stroke-width="1.2" fill="none"/>' +
          '<g class="hw-face" fill="url(#hwGl' + n + ')">' +
            '<path d="M14 31 L27 29 L22 21 Z"/>' +
            '<path d="M50 31 L37 29 L42 21 Z"/>' +
            '<path d="M29.5 37 L34.5 37 L32 32.5 Z"/>' +
            '<path d="M13 42 C20 52 44 52 51 42 L47 43.5 L44.5 47.5 L41 44.5 L37.5 49 L34.5 45.5 L29.5 45.5 L26.5 49 L23 44.5 L19.5 47.5 L17 43.5 Z"/>' +
          '</g>' +
        '</svg>';
    }

    var BAT_SVG = '' +
        '<svg viewBox="0 0 100 50" aria-hidden="true">' +
          '<path class="hw-wing" fill="#120a14" d="M46 22 C38 10 24 8 5 14 C12 18 14 22 12 29 C18 24 22 26 24 33 C28 26 34 26 38 33 C40 28 44 28 46 30 Z"/>' +
          '<path class="hw-wing" fill="#120a14" d="M54 22 C62 10 76 8 95 14 C88 18 86 22 88 29 C82 24 78 26 76 33 C72 26 66 26 62 33 C60 28 56 28 54 30 Z"/>' +
          '<ellipse cx="50" cy="26" rx="6" ry="10" fill="#120a14"/>' +
          '<circle cx="50" cy="15" r="5.2" fill="#120a14"/>' +
          '<path d="M45.5 13 L46.5 5 L49.3 10.5 Z M54.5 13 L53.5 5 L50.7 10.5 Z" fill="#120a14"/>' +
          '<circle cx="48.2" cy="15" r="1.1" fill="#ff3b1f"/><circle cx="51.8" cy="15" r="1.1" fill="#ff3b1f"/>' +
        '</svg>';

    var GHOST_SVG = '' +
        '<svg viewBox="0 0 40 50" aria-hidden="true">' +
          '<path d="M20 2 C9 2 2 11 2 22 L2 46 L8 41 L14 47 L20 41 L26 47 L32 41 L38 46 L38 22 C38 11 31 2 20 2 Z" fill="rgba(236,238,255,.88)"/>' +
          '<ellipse cx="14" cy="20" rx="3.2" ry="4.4" fill="#1a1024"/>' +
          '<ellipse cx="26" cy="20" rx="3.2" ry="4.4" fill="#1a1024"/>' +
          '<ellipse cx="20" cy="30" rx="3" ry="4" fill="#1a1024"/>' +
        '</svg>';

    var SPIDER_SVG = '' +
        '<svg viewBox="0 0 30 30" aria-hidden="true">' +
          '<g stroke="#1a0f1c" stroke-width="1.6" fill="none" stroke-linecap="round">' +
            '<path d="M11 13 L4 8 L1 12 M11 15 L3 15 L1 19 M11 17 L4 21 L3 26 M12 18 L7 25 L8 29"/>' +
            '<path d="M19 13 L26 8 L29 12 M19 15 L27 15 L29 19 M19 17 L26 21 L27 26 M18 18 L23 25 L22 29"/>' +
          '</g>' +
          '<circle cx="15" cy="11" r="4" fill="#1a0f1c"/>' +
          '<ellipse cx="15" cy="18" rx="5.5" ry="6.5" fill="#1a0f1c"/>' +
          '<circle cx="13.6" cy="10.6" r=".9" fill="#ff3b1f"/><circle cx="16.4" cy="10.6" r=".9" fill="#ff3b1f"/>' +
          '<path d="M15 14.5 L15 21 M12.5 17.5 L17.5 17.5" stroke="#e11d48" stroke-width="1" opacity=".8"/>' +
        '</svg>';

    // Паутина в углу: лучи + провисающие нити
    function webSVG() {
        var R = 150, rays = 7, rings = [22, 44, 70, 100, 135];
        var d = '';
        var ang = [];
        for (var i = 0; i < rays; i++) ang.push((i / (rays - 1)) * Math.PI / 2);
        ang.forEach(function (a) {
            d += 'M0 0 L' + (Math.cos(a) * R).toFixed(1) + ' ' + (Math.sin(a) * R).toFixed(1) + ' ';
        });
        rings.forEach(function (r) {
            for (var j = 0; j < rays - 1; j++) {
                var a1 = ang[j], a2 = ang[j + 1], am = (a1 + a2) / 2;
                var x1 = Math.cos(a1) * r, y1 = Math.sin(a1) * r;
                var x2 = Math.cos(a2) * r, y2 = Math.sin(a2) * r;
                var cx = Math.cos(am) * r * 0.82, cy = Math.sin(am) * r * 0.82;
                d += 'M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + ' Q' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ' ' + x2.toFixed(1) + ' ' + y2.toFixed(1) + ' ';
            }
        });
        return '<path d="' + d + '"/>';
    }

    var GRAVEYARD_SVG = '' +
        '<svg class="hw-graveyard" viewBox="0 0 400 170" preserveAspectRatio="xMidYMax slice" aria-hidden="true">' +
          '<defs><linearGradient id="hwGround" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0" stop-color="#1a0f22"/><stop offset="1" stop-color="#050308"/>' +
          '</linearGradient></defs>' +
          // Сухое дерево слева
          '<path fill="#07040b" d="M38 170 L44 98 C36 88 22 84 10 70 L14 68 C24 78 36 82 44 88 C42 70 30 58 26 40 L30 39 C36 56 46 66 48 80 C52 66 60 56 74 48 L76 51 C64 60 56 72 54 90 C62 84 74 82 86 72 L88 75 C76 86 64 90 54 100 L58 170 Z"/>' +
          // Холм
          '<path fill="url(#hwGround)" d="M0 150 C60 130 120 138 180 146 C250 154 320 128 400 140 L400 170 L0 170 Z"/>' +
          // Надгробия
          '<path fill="#0c0712" stroke="rgba(255,140,40,.18)" stroke-width="1" d="M150 152 L150 122 C150 110 172 110 172 122 L172 152 Z"/>' +
          '<path fill="#0c0712" stroke="rgba(255,140,40,.18)" stroke-width="1" d="M205 154 L205 132 C205 124 220 124 220 132 L220 154 Z"/>' +
          '<path fill="#0c0712" stroke="rgba(255,140,40,.18)" stroke-width="1" d="M262 150 L266 112 L274 112 L274 100 L282 100 L282 112 L290 112 L290 120 L282 120 L282 150 Z"/>' +
          '<path fill="#0c0712" stroke="rgba(255,140,40,.18)" stroke-width="1" d="M318 146 L318 124 L340 124 L340 146 Z"/>' +
          '<text x="161" y="138" text-anchor="middle" font-size="8" font-weight="900" fill="rgba(255,150,60,.35)" font-family="Inter, sans-serif">RIP</text>' +
          // Забор
          '<g fill="#08050c">' +
            '<rect x="350" y="118" width="3" height="40"/><rect x="362" y="114" width="3" height="44"/><rect x="374" y="118" width="3" height="40"/>' +
            '<rect x="386" y="114" width="3" height="44"/><rect x="346" y="130" width="54" height="3"/>' +
            '<path d="M349.5 118 L351.5 112 L353.5 118 Z M361.5 114 L363.5 108 L365.5 114 Z M373.5 118 L375.5 112 L377.5 118 Z M385.5 114 L387.5 108 L389.5 114 Z"/>' +
          '</g>' +
        '</svg>';

    /* =================================================================
       МУЗЫКА — генерируется в браузере (Web Audio), без mp3-файлов.
       Гул в ре-миноре, шкатулка с жуткой колыбельной, ветер, колокол.
       ================================================================= */

    function Music() {
        var AC = window.AudioContext || window.webkitAudioContext;
        this.ok = !!AC;
        this.AC = AC;
        this.ctx = null;
        this.playing = false;
    }

    Music.prototype.init = function () {
        var ctx = this.ctx = new this.AC();
        var self = this;

        this.master = ctx.createGain();
        this.master.gain.value = 0;
        this.master.connect(ctx.destination);

        // Реверберация из сгенерированного «зала»
        var conv = ctx.createConvolver();
        conv.buffer = this.impulse(3.6, 2.4);
        var wet = ctx.createGain();
        wet.gain.value = 0.6;
        conv.connect(wet);
        wet.connect(this.master);
        this.reverb = conv;

        this.bus = ctx.createGain();
        this.bus.connect(this.master);
        this.bus.connect(conv);

        // Эхо для шкатулки
        this.delay = ctx.createDelay(1.5);
        this.delay.delayTime.value = 0.705;
        var fb = ctx.createGain();
        fb.gain.value = 0.32;
        this.delay.connect(fb);
        fb.connect(this.delay);
        this.delay.connect(conv);

        this.makeDrone();
        this.makeWind();

        this.step = 0;
        this.stepDur = 0.47;           // ~64 BPM восьмыми
        this.nextTime = ctx.currentTime + 0.2;
        this.timer = setInterval(function () { self.schedule(); }, 90);
    };

    Music.prototype.impulse = function (sec, decay) {
        var ctx = this.ctx, len = Math.floor(ctx.sampleRate * sec);
        var buf = ctx.createBuffer(2, len, ctx.sampleRate);
        for (var c = 0; c < 2; c++) {
            var ch = buf.getChannelData(c);
            for (var i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
        }
        return buf;
    };

    Music.prototype.noiseBuffer = function (sec) {
        var ctx = this.ctx, len = Math.floor(ctx.sampleRate * sec);
        var buf = ctx.createBuffer(1, len, ctx.sampleRate);
        var ch = buf.getChannelData(0);
        for (var i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
        return buf;
    };

    Music.prototype.lfo = function (freq, depth, target) {
        var o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.frequency.value = freq;
        g.gain.value = depth;
        o.connect(g);
        g.connect(target);
        o.start();
    };

    Music.prototype.makeDrone = function () {
        var ctx = this.ctx;
        var filt = ctx.createBiquadFilter();
        filt.type = 'lowpass';
        filt.frequency.value = 260;
        filt.Q.value = 6;
        var g = ctx.createGain();
        g.gain.value = 0.05;
        filt.connect(g);
        g.connect(this.bus);
        [[73.42, 'sawtooth', -6], [73.42, 'sawtooth', 7], [110, 'triangle', 0], [77.78, 'sine', 0]].forEach(function (v, i) {
            var o = ctx.createOscillator();
            o.type = v[1];
            o.frequency.value = v[0];
            o.detune.value = v[2];
            var og = ctx.createGain();
            og.gain.value = i === 3 ? 0.25 : 1;     // тихий полутон Eb — тревожный диссонанс
            o.connect(og);
            og.connect(filt);
            o.start();
        });
        this.lfo(0.06, 140, filt.frequency);
        this.lfo(0.11, 0.02, g.gain);
    };

    Music.prototype.makeWind = function () {
        var ctx = this.ctx;
        var src = ctx.createBufferSource();
        src.buffer = this.noiseBuffer(3);
        src.loop = true;
        var bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 600;
        bp.Q.value = 1.4;
        var g = ctx.createGain();
        g.gain.value = 0.028;
        src.connect(bp);
        bp.connect(g);
        g.connect(this.bus);
        this.lfo(0.05, 380, bp.frequency);
        this.lfo(0.09, 0.02, g.gain);
        src.start();
    };

    function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }

    // Колыбельная в ре гармоническом миноре (null — пауза)
    var MELODY = [
        74, 77, 81, 77,   80, 81, 77, 76,
        74, null, 69, null, 73, 76, 74, null,
        70, 74, 77, 74,   69, 73, 76, null,
        74, 77, 76, 73,   74, null, null, null
    ];
    var BASS = [38, 38, 34, 33];   // D, D, Bb, A — по одному на такт

    Music.prototype.musicBox = function (t, midi) {
        var ctx = this.ctx, f = mtof(midi);
        var env = ctx.createGain();
        env.gain.setValueAtTime(0.0001, t);
        env.gain.exponentialRampToValueAtTime(0.11, t + 0.006);
        env.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
        env.connect(this.bus);
        env.connect(this.delay);
        [[1, 'sine', 1], [2, 'triangle', 0.25], [4.07, 'sine', 0.06]].forEach(function (p) {
            var o = ctx.createOscillator(), g = ctx.createGain();
            o.type = p[1];
            o.frequency.value = f * p[0];
            o.detune.value = (Math.random() - 0.5) * 8;   // чуть «расстроенная» шкатулка
            g.gain.value = p[2];
            o.connect(g);
            g.connect(env);
            o.start(t);
            o.stop(t + 1.9);
        });
    };

    Music.prototype.bass = function (t, midi) {
        var ctx = this.ctx;
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = mtof(midi);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.13, t + 0.4);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 3.6);
        o.connect(g);
        g.connect(this.bus);
        o.start(t);
        o.stop(t + 3.7);
    };

    Music.prototype.bell = function (t) {
        var ctx = this.ctx, base = mtof(50);
        [[1, 0.06], [2.4, 0.035], [3.0, 0.03], [4.5, 0.02], [5.9, 0.012]].forEach(function (p) {
            var o = ctx.createOscillator(), g = ctx.createGain();
            o.frequency.value = base * p[0];
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(p[1], t + 0.01);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 5);
            o.connect(g);
            g.connect(this.bus);
            o.start(t);
            o.stop(t + 5.1);
        }, this);
    };

    Music.prototype.thunder = function () {
        if (!this.playing || !this.ctx) return;
        var ctx = this.ctx, t = ctx.currentTime + 0.15;
        var src = ctx.createBufferSource();
        src.buffer = this.noiseBuffer(4);
        var lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(900, t);
        lp.frequency.exponentialRampToValueAtTime(90, t + 3);
        var g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.45, t + 0.08);
        g.gain.exponentialRampToValueAtTime(0.15, t + 0.6);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 3.8);
        src.connect(lp);
        lp.connect(g);
        g.connect(this.master);
        g.connect(this.reverb);
        src.start(t);
        src.stop(t + 4);
    };

    Music.prototype.schedule = function () {
        if (!this.playing) return;
        var ctx = this.ctx;
        while (this.nextTime < ctx.currentTime + 0.35) {
            var s = this.step % MELODY.length;
            if (MELODY[s] !== null) this.musicBox(this.nextTime, MELODY[s]);
            if (s % 8 === 0) this.bass(this.nextTime, BASS[(s / 8) % BASS.length]);
            if (this.step % (MELODY.length * 2) === 0) this.bell(this.nextTime);
            this.step++;
            this.nextTime += this.stepDur;
        }
    };

    Music.prototype.start = function () {
        if (!this.ok) return false;
        try {
            if (!this.ctx) this.init();
            if (this.ctx.state === 'suspended') this.ctx.resume();
            this.playing = true;
            this.nextTime = Math.max(this.nextTime, this.ctx.currentTime + 0.1);
            var g = this.master.gain, now = this.ctx.currentTime;
            g.cancelScheduledValues(now);
            g.setValueAtTime(g.value, now);
            g.linearRampToValueAtTime(0.34, now + 3);
            return true;
        } catch (e) {
            console.warn('Halloween: звук недоступен', e);
            return false;
        }
    };

    Music.prototype.stop = function () {
        if (!this.ctx) return;
        this.playing = false;
        var ctx = this.ctx, g = this.master.gain, now = ctx.currentTime;
        g.cancelScheduledValues(now);
        g.setValueAtTime(g.value, now);
        g.linearRampToValueAtTime(0, now + 0.6);
        setTimeout(function () { if (ctx.state === 'running') ctx.suspend(); }, 700);
    };

    var music = new Music();
    var wantMusic = false;

    function musicPref() {
        var saved = store('hw_music');
        if (saved === 'on') return true;
        if (saved === 'off') return false;
        // Не задано: уважаем общий переключатель звуков интерфейса
        var snd = document.getElementById('sndToggleCard');
        return !snd || snd.classList.contains('on');
    }

    function renderMusicUI() {
        var on = music.playing;
        var nav = document.getElementById('hwNavPumpkin');
        if (nav) {
            nav.classList.toggle('playing', on);
            nav.classList.toggle('off', !on);
            var note = nav.querySelector('.hw-note');
            if (note) note.textContent = on ? '♪' : '✕';
        }
        var btn = document.getElementById('hwMusicBtn');
        if (btn) {
            btn.classList.toggle('off', !on);
            btn.textContent = on ? '🔊' : '🔇';
            btn.setAttribute('aria-label', on ? 'Выключить музыку' : 'Включить музыку');
        }
    }

    function toggleMusic(e) {
        if (e) { e.stopPropagation(); e.preventDefault(); }
        if (music.playing) {
            music.stop();
            store('hw_music', 'off');
        } else {
            music.start();
            store('hw_music', 'on');
        }
        wantMusic = music.playing;
        try { tgApp && tgApp.HapticFeedback && tgApp.HapticFeedback.impactOccurred('medium'); } catch (err) { /* нет */ }
        renderMusicUI();
    }
    window.toggleHalloweenMusic = toggleMusic;

    // Браузеры запускают звук только после касания — ждём первое
    function armAutostart() {
        function first(e) {
            document.removeEventListener('pointerdown', first, true);
            document.removeEventListener('touchend', first, true);
            // Первое касание пришлось на сам переключатель — пусть решает он
            var t = e && e.target;
            if (t && t.closest && t.closest('#hwNavPumpkin, #hwMusicBtn')) return;
            if (musicPref() && !music.playing) {
                music.start();
                wantMusic = music.playing;
                renderMusicUI();
            }
        }
        document.addEventListener('pointerdown', first, true);
        document.addEventListener('touchend', first, true);
    }

    document.addEventListener('visibilitychange', function () {
        if (!music.ctx) return;
        if (document.hidden) {
            if (music.playing) { music.stop(); wantMusic = true; }
        } else if (wantMusic && !music.playing) {
            music.start();
        }
        renderMusicUI();
    });

    /* =================================================================
       ДЕКОРАЦИИ
       ================================================================= */

    var fx = null;

    function el(tag, cls, html) {
        var e = document.createElement(tag);
        if (cls) e.className = cls;
        if (html) e.innerHTML = html;
        return e;
    }

    function buildScene() {
        var sky = el('div', 'hw-sky');
        sky.setAttribute('aria-hidden', 'true');
        sky.innerHTML =
            '<div class="hw-moon"></div>' +
            '<div class="hw-cloud c1"></div><div class="hw-cloud c2"></div>' +
            '<svg class="hw-web l" viewBox="0 0 150 150">' + webSVG() + '</svg>' +
            '<svg class="hw-web r" viewBox="0 0 150 150">' + webSVG() + '</svg>' +
            '<div class="hw-fog"></div><div class="hw-fog f2"></div>' +
            GRAVEYARD_SVG;
        document.body.insertBefore(sky, document.body.firstChild);

        fx = el('div', 'hw-fx');
        fx.setAttribute('aria-hidden', 'true');
        fx.innerHTML = '<div class="hw-flash" id="hwFlash"></div>' +
            (reduceMotion ? '' : '<div class="hw-spider">' + SPIDER_SVG + '</div>');
        document.body.appendChild(fx);
    }

    function buildNavPumpkins() {
        var nav = document.getElementById('bottomNav');
        if (!nav) return;
        var left = el('span', 'hw-nav-pumpkin l hw-pumpkin-glow', pumpkinSVG());
        nav.appendChild(left);

        var right = el('button', 'hw-nav-pumpkin r hw-pumpkin-glow off', pumpkinSVG() + '<span class="hw-note">✕</span>');
        right.id = 'hwNavPumpkin';
        right.type = 'button';
        right.setAttribute('aria-label', 'Музыка Хэллоуина');
        right.addEventListener('click', toggleMusic);
        nav.appendChild(right);
    }

    function buildBanner() {
        var tab = document.getElementById('tab-profile');
        if (!tab) return;
        var b = el('div', 'hw-banner');
        b.innerHTML =
            '<div class="hw-banner-pk hw-pumpkin-glow">' + pumpkinSVG() + '</div>' +
            '<div class="hw-banner-txt">' +
                '<div class="hw-banner-kicker">Сезонный ивент</div>' +
                '<div class="hw-banner-title">Хэллоуин в ManhwCard</div>' +
                '<div class="hw-banner-sub">Тыквы, летучие мыши и жуткая музыка. Музыку можно включать тыквой на нижней панели.</div>' +
            '</div>' +
            '<button class="hw-banner-btn off" id="hwMusicBtn" type="button" aria-label="Включить музыку">🔇</button>';
        tab.insertBefore(b, tab.firstChild);
        document.getElementById('hwMusicBtn').addEventListener('click', toggleMusic);
    }

    function buildSplash() {
        var sp = document.getElementById('splashScreen');
        if (sp && !sp.querySelector('.hw-splash-sub')) sp.appendChild(el('div', 'hw-splash-sub', 'Happy Halloween'));
    }

    /* ---------- Живые эффекты ---------- */

    function rand(a, b) { return a + Math.random() * (b - a); }

    function spawnBat(opts) {
        if (!fx || document.hidden) return;
        if (fx.querySelectorAll('.hw-bat').length >= 7) return;
        opts = opts || {};
        var far = Math.random() < 0.4;
        var bat = el('div', 'hw-bat' + (Math.random() < 0.5 ? ' rtl' : '') + (far ? ' far' : ''),
            '<div class="hw-bat-inner">' + BAT_SVG + '</div>');
        bat.style.setProperty('--y', (opts.y != null ? opts.y : rand(4, 55)).toFixed(1) + 'vh');
        bat.style.setProperty('--dy', rand(-120, 120).toFixed(0) + 'px');
        bat.style.setProperty('--w', (far ? rand(22, 32) : rand(38, 58)).toFixed(0) + 'px');
        bat.style.setProperty('--d', (far ? rand(11, 15) : rand(6, 9.5)).toFixed(1) + 's');
        bat.style.animationDelay = (opts.delay || 0) + 's';
        bat.addEventListener('animationend', function (e) { if (e.target === bat) bat.remove(); });
        fx.appendChild(bat);
    }

    function spawnGhost() {
        if (!fx || document.hidden) return;
        var g = el('div', 'hw-ghost', GHOST_SVG);
        g.style.setProperty('--x', rand(6, 80).toFixed(0) + 'vw');
        g.addEventListener('animationend', function (e) { if (e.target === g) g.remove(); });
        fx.appendChild(g);
    }

    function lightning() {
        if (document.hidden) return;
        var f = document.getElementById('hwFlash');
        if (f) {
            f.classList.remove('go');
            void f.offsetWidth;
            f.classList.add('go');
        }
        music.thunder();
        for (var i = 0; i < 4; i++) spawnBat({ delay: 0.2 + i * 0.25, y: rand(5, 30) });
    }

    function loop(fn, min, max) {
        (function next() {
            setTimeout(function () { fn(); next(); }, rand(min, max) * 1000);
        })();
    }

    function startLife() {
        if (reduceMotion) return;
        spawnBat();
        setTimeout(spawnBat, 1500);
        loop(spawnBat, 4, 9);
        loop(spawnGhost, 28, 48);
        loop(lightning, 35, 75);
    }

    function setTelegramColors() {
        try {
            if (tgApp && tgApp.setHeaderColor) tgApp.setHeaderColor('#0b0614');
            if (tgApp && tgApp.setBackgroundColor) tgApp.setBackgroundColor('#07050b');
        } catch (e) { /* старая версия Telegram */ }
    }

    function boot() {
        buildScene();
        buildNavPumpkins();
        buildBanner();
        buildSplash();
        renderMusicUI();
        armAutostart();
        setTelegramColors();
        startLife();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
