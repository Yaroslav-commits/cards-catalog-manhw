/* =====================================================================
   ДУЭЛИ — интерфейс

   Работает против duel.py. Вклад противника сервер не отдаёт до
   раскрытия раунда, поэтому подсмотреть его из консоли нельзя.

   Подключать после script.js (нужны userId, API_BASE, authHeaders, tg).
   ===================================================================== */

(function (global) {
    'use strict';

    var POLL_MS = 2000;

    var config = null;      // ответ /api/duel/config
    var duel = null;        // текущее состояние матча
    var invite = null;      // открытое приглашение
    var stake = 0;
    var pollTimer = null;
    var tickTimer = null;
    var lastRound = 0;
    var revealing = false;

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

    function avatar(id) { return API_BASE + '/api/avatar/' + id; }

    /* =====================  ЛОББИ  ===================== */

    global.initDuelLobby = async function () {
        var box = document.getElementById('duelLobby');
        if (!box) return;

        try {
            config = await api('config');
        } catch (e) {
            box.innerHTML = '<div class="duel-countdown">Не удалось загрузить дуэли</div>';
            return;
        }
        if (!config.success) return;

        var st = await api('state');
        duel = st.duel || null;
        invite = st.invite || null;

        if (!stake) stake = config.stake_min;
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
        var box = document.getElementById('duelLobby');
        var game = config.games[0];
        var bal = config.battlecoin;

        // Уже в матче — всё остальное неважно, надо вернуть человека на арену
        if (duel) {
            box.innerHTML =
                '<div class="duel-game-card"><div class="duel-gc-body">' +
                '<div class="duel-gc-icon">' + duel.game_icon + '</div>' +
                '<div class="duel-gc-name">Матч идёт</div>' +
                '<div class="duel-gc-short">Раунд ' + duel.round + ' из ' + duel.rounds_total +
                ' · банк ' + duel.pot + ' 🪙</div>' +
                '<button class="duel-main-btn" onclick="openDuelArena()">Вернуться в Разлом</button>' +
                '</div></div>';
            return;
        }

        var html =
            '<div class="duel-game-card"><div class="duel-gc-body">' +
            '<div class="duel-gc-icon">' + game.icon + '</div>' +
            '<div class="duel-gc-name">' + game.name + '</div>' +
            '<div class="duel-gc-short">' + game.short + '</div>' +
            '<div class="duel-rules">' + game.rules + '</div>';

        if (invite) {
            var link = 'https://t.me/?start=duel_' + invite.token;
            html +=
                '<div class="duel-invite-box">' +
                '<div class="duel-lbl">Вызов создан · ставка ' + invite.stake + ' 🪙</div>' +
                '<div class="duel-invite-link" id="duelLinkText">' + (invite.link || link) + '</div>' +
                '<div class="duel-invite-actions">' +
                '<button class="duel-mini-btn primary" onclick="shareDuelLink()">Отправить</button>' +
                '<button class="duel-mini-btn" onclick="copyDuelLink()">Копировать</button>' +
                '<button class="duel-mini-btn danger" onclick="cancelDuelInvite()">Отменить</button>' +
                '</div>' +
                '<div class="duel-countdown" id="duelInviteTimer"></div>' +
                '</div>';
        } else {
            var opts = stakeOptions();
            html +=
                '<div class="duel-stake-box">' +
                '<div class="duel-lbl">Ставка с каждого</div>' +
                '<div class="duel-stake-row">' +
                opts.map(function (v) {
                    return '<button class="duel-stake-btn' + (v === stake ? ' active' : '') + '"' +
                        (v > bal ? ' disabled' : '') +
                        ' onclick="setDuelStake(' + v + ')">' + v + '</button>';
                }).join('') +
                '</div>' +
                '<div class="duel-pot-line">Банк победителя — <b>' + (stake * 2) + ' 🪙</b></div>' +
                '</div>';

            if (bal < config.stake_min) {
                html += '<button class="duel-main-btn" disabled>Нужно ' + config.stake_min + ' 🪙</button>';
            } else {
                html += '<button class="duel-main-btn" onclick="createDuelInvite()">Создать вызов</button>';
            }
            html += '<div class="duel-countdown">Ваш баланс: ' + bal + ' 🪙</div>';
        }

        html += '</div></div>';
        box.innerHTML = html;

        if (invite) startInviteCountdown();
    }

    global.setDuelStake = function (v) {
        stake = v;
        haptic('light');
        renderLobby();
    };

    global.createDuelInvite = async function () {
        var res = await api('invite', {
            method: 'POST',
            body: JSON.stringify({ game: 'rift', stake: stake })
        });
        if (!res.success) return tg.showAlert(res.error || 'Не удалось создать вызов');

        invite = {
            token: res.token, game: res.game, stake: res.stake,
            link: res.link, expires_in: res.ttl_minutes * 60
        };
        haptic('ok');
        renderLobby();
    };

    global.cancelDuelInvite = async function () {
        if (!invite) return;
        await api('cancel_invite', {
            method: 'POST',
            body: JSON.stringify({ token: invite.token })
        });
        invite = null;
        haptic('light');
        renderLobby();
    };

    function linkText() {
        var el = document.getElementById('duelLinkText');
        return el ? el.innerText.trim() : '';
    }

    global.copyDuelLink = function () {
        var text = linkText();
        if (!text) return;
        // navigator.clipboard в WebView Telegram работает не всегда — есть запасной путь
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function () {
                haptic('ok');
                tg.showAlert('Ссылка скопирована');
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
            try { document.execCommand('copy'); haptic('ok'); } catch (e) {}
            document.body.removeChild(ta);
            tg.showAlert('Ссылка скопирована');
        }
    };

    global.shareDuelLink = function () {
        var text = linkText();
        if (!text) return;
        var msg = 'Вызываю тебя на дуэль в Разломе! Ставка ' + invite.stake + ' 🪙';
        tg.openTelegramLink(
            'https://t.me/share/url?url=' + encodeURIComponent(text) +
            '&text=' + encodeURIComponent(msg)
        );
    };

    function startInviteCountdown() {
        clearInterval(tickTimer);
        var left = invite.expires_in || 15 * 60;

        tickTimer = setInterval(function () {
            var el = document.getElementById('duelInviteTimer');
            if (!el) return clearInterval(tickTimer);
            left -= 1;
            if (left <= 0) {
                clearInterval(tickTimer);
                invite = null;
                renderLobby();
                return;
            }
            var m = Math.floor(left / 60), s = left % 60;
            el.innerText = 'Ссылка действует ещё ' + m + ':' + (s < 10 ? '0' : '') + s;
        }, 1000);
    }

    /* =====================  АРЕНА  ===================== */

    global.openDuelArena = function () {
        var el = document.getElementById('duelArena');
        if (!el) return;
        el.classList.add('open');
        if (typeof manageBack === 'function') manageBack();
        haptic('medium');
        lastRound = 0;
        pollState();
        clearInterval(pollTimer);
        pollTimer = setInterval(pollState, POLL_MS);
    };

    global.closeDuelArena = function () {
        var el = document.getElementById('duelArena');
        if (el) el.classList.remove('open');
        clearInterval(pollTimer);
        pollTimer = null;
        if (typeof manageBack === 'function') manageBack();
        if (document.getElementById('duelLobby')) global.initDuelLobby();
    };

    async function pollState() {
        if (revealing) return;   // не перебиваем анимацию раскрытия
        var st;
        try {
            st = await api('state');
        } catch (e) {
            return;
        }
        if (!st.success) return;

        if (st.duel) {
            var prev = duel;
            duel = st.duel;
            if (prev && duel.log.length > prev.log.length) {
                return revealRound(duel.log[duel.log.length - 1]);
            }
            renderArena();
        } else if (st.last && st.last.status === 'finished') {
            duel = st.last;
            clearInterval(pollTimer);
            renderArena();
            showResult(st.last);
        } else if (st.last && st.last.status === 'aborted') {
            clearInterval(pollTimer);
            tg.showAlert('Матч прерван, ставки возвращены.');
            global.closeDuelArena();
        }
    }

    function pips(count, total, cls) {
        var out = '';
        for (var i = 0; i < total; i++) {
            out += '<div class="duel-pip' + (i < count ? ' on' : '') + '"></div>';
        }
        return out;
    }

    function stars(count, total) {
        var out = '';
        for (var i = 0; i < total; i++) {
            out += '<div class="duel-star' + (i < count ? ' on' : '') + '"></div>';
        }
        return out;
    }

    function renderArena() {
        if (!duel) return;
        var d = duel;
        var maxMana = 10;

        document.getElementById('duelRoundLbl').innerText =
            'Раунд ' + Math.min(d.round, d.rounds_total) + ' из ' + d.rounds_total;
        document.getElementById('duelPot').innerText = d.pot + ' 🪙';

        // Соперник
        document.getElementById('duelFoeName').innerText = d.opponent_name || 'Соперник';
        document.getElementById('duelFoeAva').src = avatar(d.opponent_id);
        document.getElementById('duelFoeMana').innerHTML = pips(d.foe_mana, maxMana);
        document.getElementById('duelFoeWins').innerHTML = stars(d.foe_wins, d.need_wins);
        document.getElementById('duelFoeReady').style.display =
            (d.foe_ready && d.my_bid === null) ? 'inline-block' : 'none';

        // Я
        document.getElementById('duelMyMana').innerHTML = pips(d.my_mana, maxMana);
        document.getElementById('duelMyWins').innerHTML = stars(d.my_wins, d.need_wins);

        var myAva = document.getElementById('userAvatar');
        document.getElementById('duelMyAva').src = myAva ? myAva.src : avatar(userId);

        renderLog(d.log, d.my_slot);
        renderControls(d);
        renderTimer(d);
    }

    function renderLog(log, slot) {
        var box = document.getElementById('duelLog');
        box.innerHTML = log.map(function (e) {
            var cls = e.won === true ? ' won' : (e.won === false ? ' lost' : '');
            return '<div class="duel-log-item' + cls + '">' + e.mine + ':' + e.foe + '</div>';
        }).join('');
    }

    function renderControls(d) {
        var wait = document.getElementById('duelWaiting');
        var ctrl = document.getElementById('duelInputs');

        if (d.status !== 'active') {
            wait.style.display = 'none';
            ctrl.style.display = 'none';
            return;
        }

        if (d.my_bid !== null) {
            // Ход сделан — показываем ожидание, а не заблокированный слайдер
            ctrl.style.display = 'none';
            wait.style.display = 'block';
            wait.innerHTML = 'Вклад принят: <b>' + d.my_bid +
                '</b> · ждём соперника<span class="duel-waiting-dots"></span>';
            return;
        }

        wait.style.display = 'none';
        ctrl.style.display = 'block';

        var slider = document.getElementById('duelBidSlider');
        slider.max = d.my_mana;
        if (parseInt(slider.value) > d.my_mana) slider.value = d.my_mana;
        syncBid(slider.value);
    }

    global.syncBid = function (v) {
        var d = duel;
        if (!d) return;
        v = Math.max(0, Math.min(parseInt(v) || 0, d.my_mana));
        document.getElementById('duelBidSlider').value = v;
        document.getElementById('duelBidVal').innerText = v;
        var pct = d.my_mana > 0 ? (v / d.my_mana) * 100 : 0;
        document.getElementById('duelBidSlider').style.setProperty('--fill', pct + '%');
    };

    global.quickBid = function (kind) {
        var d = duel;
        if (!d) return;
        var v = kind === 'all' ? d.my_mana
            : kind === 'half' ? Math.floor(d.my_mana / 2)
            : 0;
        haptic('light');
        global.syncBid(v);
    };

    global.submitDuelBid = async function () {
        if (!duel) return;
        var v = parseInt(document.getElementById('duelBidSlider').value) || 0;
        var btn = document.getElementById('duelSubmit');
        btn.disabled = true;

        var res = await api('move', {
            method: 'POST',
            body: JSON.stringify({ duel_id: duel.duel_id, bid: v })
        });
        btn.disabled = false;

        if (!res.success) return tg.showAlert(res.error || 'Ход не принят');

        haptic('medium');
        var prevLen = duel.log.length;
        duel = res.state;

        if (duel.log.length > prevLen) revealRound(duel.log[duel.log.length - 1]);
        else renderArena();
    };

    /* Раскрытие раунда: числа проявляются, победившее пульсирует,
       проигравшее гаснет. Только после этого обновляем остальное. */
    function revealRound(entry) {
        revealing = true;

        var mine = document.getElementById('duelBidMine');
        var foe = document.getElementById('duelBidFoe');
        var verdict = document.getElementById('duelVerdict');

        mine.className = 'duel-bid mine';
        foe.className = 'duel-bid foe';
        mine.innerText = entry.mine;
        foe.innerText = entry.foe;
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
            renderArena();
            if (duel && duel.status === 'finished') showResult(duel);
        }, 2300);
    }

    function renderTimer(d) {
        var box = document.getElementById('duelTimer');
        if (!d.deadline || d.status !== 'active') {
            box.style.visibility = 'hidden';
            return;
        }
        box.style.visibility = 'visible';

        var total = (config && config.turn_seconds) || 45;
        var left = Math.max(0, Math.round((new Date(d.deadline.replace(' ', 'T')) - new Date()) / 1000));
        if (left > total) left = total;

        document.getElementById('duelTimerNum').innerText = left;
        var circ = 2 * Math.PI * 16;
        document.getElementById('duelTimerFill').style.strokeDashoffset =
            (circ * (1 - left / total)).toFixed(1);
        box.classList.toggle('urgent', left <= 10);
    }

    function showResult(d) {
        var box = document.getElementById('duelResult');
        var win = d.i_won === true;
        var draw = d.winner === null;

        box.className = 'duel-result show ' + (draw ? '' : (win ? 'win' : 'lose'));
        document.getElementById('duelResultIcon').innerText = draw ? '⚖️' : (win ? '🏆' : '💀');
        document.getElementById('duelResultTitle').innerText =
            draw ? 'Ничья' : (win ? 'Победа' : 'Поражение');
        document.getElementById('duelResultSum').innerText =
            draw ? 'Ставки возвращены' : (win ? '+' + d.pot + ' 🪙' : '−' + d.stake + ' 🪙');

        haptic(win ? 'ok' : 'no');
        if (typeof fetchProfile === 'function') fetchProfile();
    }

    global.closeDuelResult = function () {
        document.getElementById('duelResult').classList.remove('show');
        global.closeDuelArena();
    };

    global.forfeitDuel = function () {
        if (!duel) return;
        tg.showConfirm('Сдаться? Банк уйдёт сопернику.', async function (ok) {
            if (!ok) return;
            var res = await api('forfeit', {
                method: 'POST',
                body: JSON.stringify({ duel_id: duel.duel_id })
            });
            if (res.success) pollState();
        });
    };

    global.isDuelArenaOpen = function () {
        var el = document.getElementById('duelArena');
        return !!(el && el.classList.contains('open'));
    };
})(window);
