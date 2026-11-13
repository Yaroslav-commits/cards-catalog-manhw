/* =====================================================================
   ДУЭЛИ — интерфейс

   Работает против duel.py. Ход противника сервер не отдаёт до
   раскрытия раунда, поэтому подсмотреть его из консоли нельзя.

   Игр несколько (Разлом, Три стиля, Аура), но правил клиент не знает:
   сервер присылает готовые блоки pips / score / options, а арена
   просто рисует их. Новая игра на сервере не требует правок здесь.

   Подключать после script.js (нужны userId, API_BASE, authHeaders, tg).
   ===================================================================== */

(function (global) {
    'use strict';

    var POLL_MS = 2000;

    var config = null;      // ответ /api/duel/config
    var duel = null;        // текущее состояние матча
    var invite = null;      // открытое приглашение
    var stake = 0;
    var gameKey = null;     // выбранная в лобби игра
    var pollTimer = null;
    var tickTimer = null;   // отсчёт ссылки-приглашения
    var turnTimer = null;   // отсчёт хода
    var deadlineAt = 0;     // момент конца хода по часам ЭТОГО устройства
    var revealing = false;
    var sending = false;

    function api(path, options) {
        return fetch(API_BASE + '/api/duel/' + path + '/' + userId,
            Object.assign({
                headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders())
            }, options || {})
        ).then(function (r) { return r.json(); });
    }

    function haptic(kind) {
        try {
            if (!tg.HapticFeedback) return;
            if (kind === 'ok') tg.HapticFeedback.notificationOccurred('success');
            else if (kind === 'no') tg.HapticFeedback.notificationOccurred('error');
            else tg.HapticFeedback.impactOccurred(kind || 'light');
        } catch (e) {}
    }

    function alertMsg(text) {
        try { tg.showAlert(text); } catch (e) { alert(text); }
    }

    // Имена и подписи приходят с сервера, но ник задаёт игрок — в HTML только через экранирование
    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
        });
    }

    function num(n) {
        return String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }

    function avatar(id) { return API_BASE + '/api/avatar/' + id; }

    function byId(id) { return document.getElementById(id); }

    function currentGame() {
        if (!config || !config.games || !config.games.length) return null;
        for (var i = 0; i < config.games.length; i++) {
            if (config.games[i].key === gameKey) return config.games[i];
        }
        gameKey = config.games[0].key;
        return config.games[0];
    }

    /* =====================  ЛОББИ  ===================== */

    global.initDuelLobby = async function () {
        var box = byId('duelLobby');
        if (!box) return;

        if (!config) box.innerHTML = '<div class="duel-countdown">Загрузка дуэлей…</div>';

        try {
            config = await api('config');
            if (!config.success) throw new Error('config');
            var st = await api('state');
            setDuel(st.duel || null);
            invite = st.invite || null;
        } catch (e) {
            config = null;
            box.innerHTML =
                '<div class="duel-countdown">Не удалось загрузить дуэли</div>' +
                '<button class="duel-main-btn" onclick="initDuelLobby()">Повторить</button>';
            return;
        }

        if (!stake) stake = config.stake_min;
        if (invite && invite.game) gameKey = invite.game;
        renderLobby();
    };

    function stakeOptions() {
        // Шаги ставок из диапазона сервера: минимум, затем удвоения до максимума
        var out = [];
        var v = config.stake_min;
        while (v <= config.stake_max && out.length < 5) {
            out.push(v);
            v *= 2;
        }
        if (out[out.length - 1] !== config.stake_max) out.push(config.stake_max);
        return out;
    }

    function renderLobby() {
        var box = byId('duelLobby');
        if (!box || !config) return;
        var game = currentGame();
        var bal = config.battlecoin;
        clearInterval(tickTimer);

        // Уже в матче — всё остальное неважно, надо вернуть человека на арену
        if (duel) {
            box.innerHTML =
                '<div class="duel-game-card"><div class="duel-gc-body">' +
                '<div class="duel-gc-icon">' + esc(duel.game_icon) + '</div>' +
                '<div class="duel-gc-name">Матч идёт</div>' +
                '<div class="duel-gc-short">' + esc(duel.game_name) + ' · раунд ' +
                Math.min(duel.round, duel.rounds_total) + ' из ' + duel.rounds_total +
                ' · банк ' + num(duel.pot) + ' 🪙</div>' +
                '<button class="duel-main-btn" onclick="openDuelArena()">Вернуться на арену</button>' +
                '</div></div>';
            return;
        }
        if (!game) return;

        var html = '';

        // Переключатель игр. Пока висит приглашение — заблокирован: ссылка уже на конкретную игру
        if (config.games.length > 1) {
            html += '<div class="duel-games">' + config.games.map(function (g) {
                return '<button class="duel-game-tab' + (g.key === game.key ? ' active' : '') + '"' +
                    (invite ? ' disabled' : '') +
                    ' onclick="setDuelGame(\'' + esc(g.key) + '\')">' +
                    '<span class="duel-game-tab-ico">' + esc(g.icon) + '</span>' +
                    '<span class="duel-game-tab-name">' + esc(g.name) + '</span></button>';
            }).join('') + '</div>';
        }

        html +=
            '<div class="duel-game-card"><div class="duel-gc-body">' +
            '<div class="duel-gc-icon">' + esc(game.icon) + '</div>' +
            '<div class="duel-gc-name">' + esc(game.name) + '</div>' +
            '<div class="duel-gc-short">' + esc(game.short) + '</div>' +
            '<div class="duel-rules">' + esc(game.rules) + '</div>' +
            '<div class="duel-meta">' +
            '<span>⏱ ' + (game.turn_seconds || config.turn_seconds) + ' сек на ход</span>' +
            '<span>🔁 до ' + game.rounds + ' раундов</span>' +
            '</div>' +
            (config.afk_rule ? '<div class="duel-afk">' + esc(config.afk_rule) + '</div>' : '');

        if (invite) {
            html +=
                '<div class="duel-invite-box">' +
                '<div class="duel-lbl">Вызов создан · ставка ' + num(invite.stake) + ' 🪙</div>' +
                (invite.link
                    ? '<div class="duel-invite-link" id="duelLinkText">' + esc(invite.link) + '</div>'
                    : '<div class="duel-invite-link" id="duelLinkText" data-empty="1">Ссылка появится через пару секунд…</div>') +
                '<div class="duel-invite-actions">' +
                '<button class="duel-mini-btn primary" onclick="shareDuelLink()">Отправить</button>' +
                '<button class="duel-mini-btn" onclick="copyDuelLink()">Копировать</button>' +
                '<button class="duel-mini-btn danger" onclick="cancelDuelInvite()">Отменить</button>' +
                '</div>' +
                '<div class="duel-countdown" id="duelInviteTimer"></div>' +
                '</div>';
        } else {
            var opts = stakeOptions();
            if (stake > bal) {
                // Выбранная ставка больше не по карману — опускаемся до доступной
                var fit = opts.filter(function (v) { return v <= bal; });
                stake = fit.length ? fit[fit.length - 1] : config.stake_min;
            }
            html +=
                '<div class="duel-stake-box">' +
                '<div class="duel-lbl">Ставка с каждого</div>' +
                '<div class="duel-stake-row">' +
                opts.map(function (v) {
                    return '<button class="duel-stake-btn' + (v === stake ? ' active' : '') + '"' +
                        (v > bal ? ' disabled' : '') +
                        ' onclick="setDuelStake(' + v + ')">' + num(v) + '</button>';
                }).join('') +
                '</div>' +
                '<div class="duel-pot-line">Банк победителя — <b>' + num(stake * 2) + ' 🪙</b></div>' +
                '</div>';

            if (bal < config.stake_min) {
                html += '<button class="duel-main-btn" disabled>Нужно ' + num(config.stake_min) + ' 🪙</button>';
            } else {
                html += '<button class="duel-main-btn" id="duelCreateBtn" onclick="createDuelInvite()">Создать вызов</button>';
            }
            html += '<div class="duel-countdown">Ваш баланс: ' + num(bal) + ' 🪙</div>';
        }

        html += '</div></div>';
        box.innerHTML = html;

        if (invite) startInviteCountdown();
    }

    global.setDuelGame = function (key) {
        if (invite) return;
        gameKey = key;
        haptic('light');
        renderLobby();
    };

    global.setDuelStake = function (v) {
        stake = v;
        haptic('light');
        renderLobby();
    };

    global.createDuelInvite = async function () {
        var game = currentGame();
        if (!game) return;
        var btn = byId('duelCreateBtn');
        if (btn) btn.disabled = true;     // двойной тап не создаёт два вызова

        var res;
        try {
            res = await api('invite', {
                method: 'POST',
                body: JSON.stringify({ game: game.key, stake: stake })
            });
        } catch (e) {
            res = { success: false, error: 'Нет связи с сервером' };
        }
        if (btn) btn.disabled = false;
        if (!res.success) return alertMsg(res.error || 'Не удалось создать вызов');

        invite = {
            token: res.token, game: res.game, stake: res.stake,
            link: res.link, expires_in: res.expires_in || res.ttl_minutes * 60
        };
        haptic('ok');
        renderLobby();
    };

    global.cancelDuelInvite = async function () {
        if (!invite) return;
        try {
            await api('cancel_invite', {
                method: 'POST',
                body: JSON.stringify({ token: invite.token })
            });
        } catch (e) {}
        invite = null;
        haptic('light');
        renderLobby();
    };

    function linkText() {
        var el = byId('duelLinkText');
        if (!el || el.getAttribute('data-empty')) return '';
        return el.innerText.trim();
    }

    global.copyDuelLink = function () {
        var text = linkText();
        if (!text) return alertMsg('Ссылка ещё не готова, попробуйте через пару секунд');
        // navigator.clipboard в WebView Telegram работает не всегда — есть запасной путь
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function () {
                haptic('ok');
                alertMsg('Ссылка скопирована');
            }).catch(fallbackCopy);
        } else {
            fallbackCopy();
        }

        function fallbackCopy() {
            var ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            var ok = false;
            try { ok = document.execCommand('copy'); } catch (e) {}
            document.body.removeChild(ta);
            if (ok) haptic('ok');
            alertMsg(ok ? 'Ссылка скопирована' : 'Не получилось скопировать — выделите ссылку вручную');
        }
    };

    global.shareDuelLink = function () {
        var text = linkText();
        if (!text) return alertMsg('Ссылка ещё не готова, попробуйте через пару секунд');
        var game = currentGame();
        var msg = 'Вызываю тебя на дуэль' + (game ? ' — ' + game.icon + ' ' + game.name : '') +
            '! Ставка ' + num(invite.stake) + ' 🪙';
        tg.openTelegramLink(
            'https://t.me/share/url?url=' + encodeURIComponent(text) +
            '&text=' + encodeURIComponent(msg)
        );
    };

    function startInviteCountdown() {
        clearInterval(tickTimer);
        var endAt = Date.now() + (invite.expires_in || 15 * 60) * 1000;
        var checks = 0;

        function tick() {
            var el = byId('duelInviteTimer');
            if (!el || !invite) return clearInterval(tickTimer);
            var left = Math.round((endAt - Date.now()) / 1000);
            if (left <= 0) {
                clearInterval(tickTimer);
                invite = null;
                renderLobby();
                return;
            }
            var m = Math.floor(left / 60), s = left % 60;
            el.innerText = 'Ссылка действует ещё ' + m + ':' + (s < 10 ? '0' : '') + s;

            // Раз в 4 секунды проверяем, не принял ли кто-то вызов:
            // раньше хозяин узнавал об этом только из сообщения бота.
            if (++checks % 4 === 0) {
                api('state').then(function (st) {
                    if (!st || !st.success || !invite) return;
                    if (st.duel) {
                        setDuel(st.duel);
                        invite = null;
                        clearInterval(tickTimer);
                        haptic('ok');
                        global.openDuelArena();
                    } else if (!st.invite) {
                        invite = null;       // отклонён или отменён
                        clearInterval(tickTimer);
                        renderLobby();
                    }
                }).catch(function () {});
            }
        }

        tick();
        tickTimer = setInterval(tick, 1000);
    }

    /* =====================  АРЕНА  ===================== */

    /* Недостающие узлы арены создаём сами: вёрстка в index.html писалась под одну
       игру с ползунком, а кнопок выбора и подписей в ней нет. */
    function ensureArenaDom() {
        var inputs = byId('duelInputs');
        if (inputs && !byId('duelChoices')) {
            var slider = document.createElement('div');
            slider.id = 'duelSliderBox';
            while (inputs.firstChild) slider.appendChild(inputs.firstChild);
            inputs.appendChild(slider);

            var choices = document.createElement('div');
            choices.id = 'duelChoiceBox';
            choices.style.display = 'none';
            choices.innerHTML =
                '<div class="duel-ctrl-head"><div class="duel-ctrl-lbl" id="duelChoiceLbl">Ваш ход</div>' +
                '<div class="duel-my-note" id="duelMyNote"></div></div>' +
                '<div class="duel-choices" id="duelChoices"></div>' +
                '<button class="duel-quick-btn duel-forfeit-line" onclick="forfeitDuel()">Сдаться</button>';
            inputs.appendChild(choices);
        }

        var foeInfo = byId('duelFoeName') && byId('duelFoeName').parentNode;
        if (foeInfo && !byId('duelFoeNote')) {
            var note = document.createElement('div');
            note.className = 'duel-note';
            note.id = 'duelFoeNote';
            foeInfo.insertBefore(note, byId('duelFoeReady'));
        }
    }

    global.openDuelArena = function () {
        var el = byId('duelArena');
        if (!el) return;
        ensureArenaDom();
        el.classList.add('open');
        var result = byId('duelResult');
        if (result) result.classList.remove('show');
        if (typeof manageBack === 'function') manageBack();
        haptic('medium');
        revealing = false;
        if (duel) renderArena();
        pollState();
        clearInterval(pollTimer);
        pollTimer = setInterval(pollState, POLL_MS);
        clearInterval(turnTimer);
        turnTimer = setInterval(tickTurn, 250);
    };

    global.closeDuelArena = function () {
        var el = byId('duelArena');
        if (el) el.classList.remove('open');
        clearInterval(pollTimer);
        clearInterval(turnTimer);
        pollTimer = turnTimer = null;
        revealing = false;
        duel = null;
        if (typeof manageBack === 'function') manageBack();
        if (byId('duelLobby')) global.initDuelLobby();
    };

    function setDuel(next) {
        // Сервер прежней версии не присылает блоки pips / score — собираем их из старых полей
        if (next && next.pips === undefined && next.my_mana !== undefined) {
            next.pips = { mine: next.my_mana, foe: next.foe_mana, max: 10 };
            next.score = { mine: next.my_wins, foe: next.foe_wins, max: next.need_wins, kind: 'wins' };
            next.my_move = next.my_bid;
        }
        duel = next;
        // Дедлайн пересчитываем в часы устройства: серверное время и пояс нам не важны
        deadlineAt = (next && next.status === 'active')
            ? Date.now() + (next.seconds_left || 0) * 1000 : 0;
    }

    async function pollState() {
        if (revealing || sending) return;   // не перебиваем анимацию раскрытия и отправку хода
        var st;
        try {
            st = await api('state');
        } catch (e) {
            return;
        }
        if (!st || !st.success || revealing || sending) return;

        if (st.duel) {
            var prev = duel;
            setDuel(st.duel);
            if (prev && prev.duel_id === duel.duel_id && duel.log.length > prev.log.length) {
                return revealRound(duel.log[duel.log.length - 1]);
            }
            renderArena();
        } else if (st.last && st.last.status === 'finished') {
            var before = duel;
            setDuel(st.last);
            clearInterval(pollTimer);
            // Последний раунд закрыл соперник — сначала показываем раскрытие, потом итог
            if (before && before.duel_id === duel.duel_id && duel.log.length > before.log.length) {
                return revealRound(duel.log[duel.log.length - 1]);
            }
            renderArena();
            showResult(duel);
        } else if (st.last && st.last.status === 'aborted') {
            clearInterval(pollTimer);
            alertMsg(st.last.reason === 'afk'
                ? 'Оба игрока пропустили ходы. Матч отменён, ставки возвращены.'
                : 'Матч прерван, ставки возвращены.');
            global.closeDuelArena();
        } else {
            clearInterval(pollTimer);
            global.closeDuelArena();
        }
    }

    function pips(count, total) {
        var out = '';
        for (var i = 0; i < total; i++) {
            out += '<div class="duel-pip' + (i < count ? ' on' : '') + '"></div>';
        }
        return out;
    }

    function stars(score, side) {
        if (!score) return '';
        var count = score[side], out = '';
        for (var i = 0; i < score.max; i++) {
            out += '<div class="duel-star' + (score.kind === 'hp' ? ' hp' : '') +
                (i < count ? ' on' : '') + '"></div>';
        }
        return out;
    }

    function renderArena() {
        if (!duel) return;
        ensureArenaDom();
        var d = duel;

        byId('duelRoundLbl').innerText =
            (d.game_icon ? d.game_icon + ' ' : '') +
            'Раунд ' + Math.min(d.round, d.rounds_total) + ' из ' + d.rounds_total;
        byId('duelPot').innerText = num(d.pot) + ' 🪙';

        // Соперник
        byId('duelFoeName').innerText = d.opponent_name || 'Соперник';
        var foeAva = byId('duelFoeAva');
        var foeSrc = avatar(d.opponent_id);
        if (foeAva.getAttribute('data-src') !== foeSrc) {     // не перезагружаем картинку каждые 2 секунды
            foeAva.setAttribute('data-src', foeSrc);
            foeAva.src = foeSrc;
        }
        var foeMana = byId('duelFoeMana'), myMana = byId('duelMyMana');
        foeMana.style.display = myMana.style.display = d.pips ? 'flex' : 'none';
        if (d.pips) {
            foeMana.innerHTML = pips(d.pips.foe, d.pips.max);
            myMana.innerHTML = pips(d.pips.mine, d.pips.max);
        }
        byId('duelFoeWins').innerHTML = stars(d.score, 'foe');
        byId('duelMyWins').innerHTML = stars(d.score, 'mine');

        var foeNote = byId('duelFoeNote');
        if (foeNote) {
            foeNote.innerText = d.foe_note || '';
            foeNote.style.display = d.foe_note ? 'block' : 'none';
        }
        byId('duelFoeReady').style.display =
            (d.status === 'active' && d.foe_ready && d.my_move === null) ? 'inline-block' : 'none';

        // Я
        var myAva = byId('userAvatar');
        var mySrc = (myAva && myAva.src) ? myAva.src : avatar(userId);
        var duelMyAva = byId('duelMyAva');
        if (duelMyAva.getAttribute('src') !== mySrc) duelMyAva.src = mySrc;

        renderLog(d.log);
        renderControls(d);
        tickTurn();
    }

    function renderLog(log) {
        var box = byId('duelLog');
        box.innerHTML = log.map(function (e) {
            var cls = e.won === true ? ' won' : (e.won === false ? ' lost' : '');
            var mine = e.mine_label != null ? e.mine_label : e.mine;
            var foe = e.foe_label != null ? e.foe_label : e.foe;
            return '<div class="duel-log-item' + cls + '">' + esc(mine) + ' : ' + esc(foe) + '</div>';
        }).join('');
    }

    function renderControls(d) {
        var wait = byId('duelWaiting');
        var ctrl = byId('duelInputs');
        var sliderBox = byId('duelSliderBox');
        var choiceBox = byId('duelChoiceBox');

        if (d.status !== 'active') {
            wait.style.display = 'none';
            ctrl.style.display = 'none';
            return;
        }

        if (d.my_move !== null && d.my_move !== undefined) {
            // Ход сделан — показываем ожидание, а не заблокированные кнопки
            ctrl.style.display = 'none';
            wait.style.display = 'block';
            wait.innerHTML = 'Ваш ход принят: <b>' + esc(d.my_move_label != null ? d.my_move_label : d.my_move) +
                '</b> · ждём соперника<span class="duel-waiting-dots"></span>';
            return;
        }

        wait.style.display = 'none';
        ctrl.style.display = 'block';

        if (d.options) {
            // Игры с выбором: ход уходит одним нажатием
            sliderBox.style.display = 'none';
            choiceBox.style.display = 'block';
            byId('duelMyNote').innerText = d.my_note || (d.pips ? d.pips.label + ': ' + d.pips.mine : '');
            var box = byId('duelChoices');
            box.className = 'duel-choices n' + d.options.length;
            box.innerHTML = d.options.map(function (o) {
                return '<button class="duel-choice"' + (o.enabled ? '' : ' disabled') +
                    ' onclick="submitDuelMove(\'' + esc(o.key) + '\')">' +
                    '<span class="duel-choice-ico">' + esc(o.icon) + '</span>' +
                    '<span class="duel-choice-name">' + esc(o.name) + '</span>' +
                    '<span class="duel-choice-hint">' + esc(o.hint || '') + '</span></button>';
            }).join('');
            return;
        }

        // «Разлом»: ползунок от 0 до остатка
        choiceBox.style.display = 'none';
        sliderBox.style.display = 'block';
        var max = d.pips ? d.pips.mine : 0;
        var lbl = sliderBox.querySelector('.duel-ctrl-lbl');
        if (lbl && d.pips && d.pips.label) lbl.innerText = d.pips.label;
        var submit = byId('duelSubmit');
        if (submit && d.pips && d.pips.submit) submit.innerText = d.pips.submit;

        var slider = byId('duelBidSlider');
        slider.max = max;
        slider.disabled = max <= 0;
        if (parseInt(slider.value, 10) > max) slider.value = max;
        global.syncBid(slider.value);
    }

    function myMax() {
        return (duel && duel.pips) ? duel.pips.mine : 0;
    }

    global.syncBid = function (v) {
        if (!duel) return;
        var max = myMax();
        v = Math.max(0, Math.min(parseInt(v, 10) || 0, max));
        byId('duelBidSlider').value = v;
        byId('duelBidVal').innerText = v;
        var pct = max > 0 ? (v / max) * 100 : 0;
        byId('duelBidSlider').style.setProperty('--fill', pct + '%');
    };

    global.quickBid = function (kind) {
        if (!duel) return;
        var max = myMax();
        var v = kind === 'all' ? max
            : kind === 'half' ? Math.floor(max / 2)
            : 0;
        haptic('light');
        global.syncBid(v);
    };

    global.submitDuelBid = function () {
        if (!duel) return;
        var v = parseInt(byId('duelBidSlider').value, 10) || 0;
        return global.submitDuelMove(v);
    };

    global.submitDuelMove = async function (move) {
        if (!duel || sending || revealing) return;
        sending = true;
        var btn = byId('duelSubmit');
        if (btn) btn.disabled = true;
        var buttons = document.querySelectorAll('#duelChoices .duel-choice');
        for (var i = 0; i < buttons.length; i++) buttons[i].classList.add('busy');

        var res;
        try {
            res = await api('move', {
                method: 'POST',
                // bid — для сервера прежней версии, move — для новой
                body: JSON.stringify(typeof move === 'number'
                    ? { duel_id: duel.duel_id, move: move, bid: move }
                    : { duel_id: duel.duel_id, move: move })
            });
        } catch (e) {
            res = { success: false, error: 'Нет связи с сервером. Попробуйте ещё раз.' };
        }
        sending = false;
        if (btn) btn.disabled = false;

        if (!res.success) {
            haptic('no');
            alertMsg(res.error || 'Ход не принят');
            return pollState();       // состояние могло уйти вперёд — сверяемся с сервером
        }

        haptic('medium');
        var prevLen = duel.log.length;
        setDuel(res.state);

        if (duel.log.length > prevLen) revealRound(duel.log[duel.log.length - 1]);
        else renderArena();
    };

    /* Раскрытие раунда: ходы проявляются, победивший пульсирует,
       проигравший гаснет. Только после этого обновляем остальное. */
    function revealRound(entry) {
        revealing = true;

        var mine = byId('duelBidMine');
        var foe = byId('duelBidFoe');
        var verdict = byId('duelVerdict');

        mine.className = 'duel-bid mine';
        foe.className = 'duel-bid foe';
        mine.innerText = entry.mine_label != null ? entry.mine_label : entry.mine;
        foe.innerText = entry.foe_label != null ? entry.foe_label : entry.foe;
        verdict.classList.remove('show');

        setTimeout(function () {
            mine.classList.add('shown');
            foe.classList.add('shown');
            haptic('medium');
        }, 60);

        setTimeout(function () {
            if (entry.won === true) {
                mine.classList.add('winner');
                foe.classList.add('loser');
                verdict.innerText = 'Раунд за вами';
                haptic('ok');
            } else if (entry.won === false) {
                foe.classList.add('winner');
                mine.classList.add('loser');
                verdict.innerText = 'Раунд за соперником';
                haptic('no');
            } else {
                verdict.innerText = 'Ничья — раунд никому';
            }
            verdict.classList.add('show');
        }, 700);

        setTimeout(function () {
            mine.className = 'duel-bid mine';
            foe.className = 'duel-bid foe';
            mine.innerText = '?';
            foe.innerText = '?';
            verdict.classList.remove('show');
            revealing = false;
            // Пока шла анимация, часы хода шли — сверяемся с сервером
            if (duel && duel.status === 'active') pollState();
            renderArena();
            if (duel && duel.status === 'finished') showResult(duel);
        }, 2300);
    }

    function tickTurn() {
        var box = byId('duelTimer');
        if (!box) return;
        var d = duel;
        if (!d || d.status !== 'active' || !deadlineAt) {
            box.style.visibility = 'hidden';
            return;
        }
        box.style.visibility = 'visible';

        var total = d.turn_seconds || (config && config.turn_seconds) || 45;
        var left = Math.max(0, Math.ceil((deadlineAt - Date.now()) / 1000));
        if (left > total) left = total;

        byId('duelTimerNum').innerText = left;
        var circ = 2 * Math.PI * 16;
        byId('duelTimerFill').style.strokeDashoffset = (circ * (1 - left / total)).toFixed(1);
        box.classList.toggle('urgent', left <= 10);
    }

    function showResult(d) {
        var box = byId('duelResult');
        var win = d.i_won === true;
        var draw = d.winner === null || d.winner === undefined;

        box.className = 'duel-result show ' + (draw ? '' : (win ? 'win' : 'lose'));
        byId('duelResultIcon').innerText = draw ? '⚖️' : (win ? '🏆' : '💀');

        var title = draw ? 'Ничья' : (win ? 'Победа' : 'Поражение');
        if (!draw && d.reason === 'afk') title = win ? 'Соперник не явился' : 'Техническое поражение';
        if (!draw && d.reason === 'forfeit') title = win ? 'Соперник сдался' : 'Вы сдались';
        byId('duelResultTitle').innerText = title;

        byId('duelResultSum').innerText =
            draw ? 'Ставки возвращены' : (win ? '+' + num(d.stake) + ' 🪙' : '−' + num(d.stake) + ' 🪙');

        haptic(draw ? 'light' : (win ? 'ok' : 'no'));
        if (typeof fetchProfile === 'function') fetchProfile();
    }

    global.closeDuelResult = function () {
        byId('duelResult').classList.remove('show');
        global.closeDuelArena();
    };

    global.forfeitDuel = function () {
        if (!duel || duel.status !== 'active') return;
        var id = duel.duel_id;
        tg.showConfirm('Сдаться? Банк уйдёт сопернику.', async function (ok) {
            if (!ok) return;
            try {
                var res = await api('forfeit', {
                    method: 'POST',
                    body: JSON.stringify({ duel_id: id })
                });
                if (!res.success) alertMsg(res.error || 'Не получилось сдаться');
            } catch (e) {
                alertMsg('Нет связи с сервером');
            }
            pollState();
        });
    };

    global.isDuelArenaOpen = function () {
        var el = byId('duelArena');
        return !!(el && el.classList.contains('open'));
    };
})(window);
