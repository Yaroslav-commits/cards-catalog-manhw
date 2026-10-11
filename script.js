var isUserPremium = false;
// === ТОЧНЫЙ МАППИНГ НАВЫКОВ ПО ID КАРТ ===
var SKILLS_MAP = {
    "Копирование": [
        "kerri_roana", "kafka", "jae_hyen", "yu_hobin_pass", "samdak", 
        "yu_hobin", "hyeonseok_pt", "yohan_son", "park_jinyeong", 
        "park_hyeonsok_vt", "kang_dagyeom", "eun_gel", "han_jig_wol", "premium_card_1"
    ],
    "Восстание": [
        "kim_u_dzhin", "isaak_ivanov", "ioann_georg", "letniy_dzhin_vu", "reinhard",
        "sanless", "lee_jin_ho", "son_jin_woo", "ashborn", "absolute_being", "moyon_hvi",
        "igris", "bellion", "ber", "red_igris", "tang_gi_mun", "exclusive_card_1", "demonicheskiy_bog"
    ],
    "Берсерк": [
        "uayt", "hell_dzho", "yubin", "han_wanguk", "ji_gonsop", 
        "lee_jinson", "kim_gapryeon", "beakcheon", "antares", "antares_woo",
        "choi_jong_in", "moyeong_yul_cheon", "jo_uk_kun", "yunsu", "li_dzhagang", "yu"
    ],
    "Пространство": [
        "premium_card_2", "aheron", "enryu", "zahard", "urek_mazino", 
        "garam_zahard", "han_son_yu", "baam", "yu_son", "han_ga_yun", 
        "yu_cha_ryeon", "deung_yu_myeong", "yoo_seol_ha", "dzhin_soyi"
    ],
    "Пробивание": [
        "lim_sae_jun", "nabirose", "ronan", "mortenaks_bleyd", "seong_han_su", 
        "logan_gracie", "hwang_man_gi", "gun_park", "kim_kimyeon", "kwak_jichan", 
        "ma_tesu", "shingen_yamazaki", "lee_dogyu", "manager_kim", "jangsu", 
        "gu_kim", "kim_gitae", "shintaro_yamazaki", "choi_diyav", "im_jae_hwan", 
        "liu_zhigang", "cha_hae_in", "jin_mu_won", "jin_gwan_ho", "eum_han_sol", 
        "seo_mu_san", "excluzive_card_jaehwan", "dang_hevon", "eon_ganvu", "dzhegal_hi"
    ],
    "Уклонение": [
        "letnyaya_cha_he_in", "letniy_gu_kim", "kun_mashenni_zahard", "ouen", 
        "seong_tae_hun1", "lee_ji_hoon", "lineman", "na_jaegyeon", "yoojae_son", 
        "choi_dongsu", "gyeong_mu_saeng", "jinx", "jang_ancheol"
    ]
};

// Функция определения навыка карты по её ID
function getCardSkill(cardId) {
    for (var skillName in SKILLS_MAP) {
        if (SKILLS_MAP[skillName].includes(cardId)) {
            return skillName;
        }
    }
    return "Базовый";
}
        var tg = window.Telegram.WebApp;
        tg.expand();
        tg.ready();

        // ============================================================
        //  ⚠️ ГЛАВНОЕ: адрес твоего бэкенда. ПРОВЕРЬ ЕГО!
        //  Открой этот адрес в браузере — должно вернуть {"status":"ok"}.
        //  Если не открывается / другой домен (.ru vs .tech) — меняй ЗДЕСЬ.
        // ============================================================
        var API_BASE = "https://manhwacard.bothost.tech";

        // Подписанные данные Telegram — единственный безопасный способ
        // подтвердить, кто ты. Шлём их на бэкенд в заголовке.
        function authHeaders() {
            return { "X-Telegram-Init-Data": (tg.initData || "") };
        }

        var userId = (tg.initDataUnsafe && tg.initDataUnsafe.user) ? tg.initDataUnsafe.user.id : 12345;
        var userName = (tg.initDataUnsafe && tg.initDataUnsafe.user) ? tg.initDataUnsafe.user.first_name : "Игрок";
        
        document.getElementById('userName').innerText = userName;

        var avatarEl = document.getElementById('userAvatar');
        if (tg.initDataUnsafe && tg.initDataUnsafe.user && tg.initDataUnsafe.user.photo_url) {
            avatarEl.src = tg.initDataUnsafe.user.photo_url;
        } else {
            avatarEl.src = "https://placehold.co/150x150/1c1c28/8b5cf6?text=" + userName.charAt(0);
        }

        // Временная заглушка для нереализованных разделов
        function wip(name) {
            if (tg.HapticFeedback && tg.HapticFeedback.notificationOccurred) {
                tg.HapticFeedback.notificationOccurred('warning');
            }
            tg.showAlert((name || 'Раздел') + ' в разработке 🚧');
        }
        // Сокращает крупные числа: 1 240 → 1.2K, 3 500 000 → 3.5M.
        // Нужно, чтобы миллионные балансы не выпирали из колонок.
        function formatBal(n) {
            n = Number(n) || 0;
            if (n >= 1000000) return (n / 1000000).toFixed(n >= 10000000 ? 0 : 1).replace('.0', '') + 'M';
            if (n >= 10000)   return (n / 1000).toFixed(n >= 100000 ? 0 : 1).replace('.0', '') + 'K';
            return n.toLocaleString('ru-RU');
        }
// === ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ДЛЯ КАТАЛОГА И СКИНОВ ===
        var currentCatalogTab = 'cards';
        var isExclusiveFilterActive = false;
        var allSkins = [];       // Все скины из базы
        var userOwnedSkins = []; // Скины, которые есть у юзера
        var allCards = [];
        var userOwnedCards = [];
        var allTitles = [];
        var userUnlockedTitles = [];
        var userActiveTitle = null; 
        var userFavCards = {};
        var allBgs = [];
        var userUnlockedBgs = [];
        var userActiveBg = 'default';
        
        // Загружаем фоны из bgs.json сразу при старте
        fetch('bgs.json')
            .then(r => r.json())
            .then(data => { allBgs = data; })
            .catch(e => console.error("Ошибка загрузки bgs.json:", e));
        var currentDailyDay = 0;
        var canClaimDaily = false;
        var needsRecovery = false; // НОВОЕ
        var dailyShownThisSession = false; // НОВОЕ (чтобы окно открывалось только 1 раз при входе) 
        
        var DAILY_REWARDS = [
            {krw: 200}, {krw: 300}, {krw: 350}, {krw: 350}, {krw: 400}, 
            {krw: 400}, {pack: 'Pack'}, {krw: 450}, {krw: 450}, {krw: 500, dia: 10}, 
            {krw: 500}, {krw: 500}, {krw: 550}, {pack: 'Pack'}, {krw: 600}, 
            {krw: 600}, {krw: 650}, {krw: 650}, {krw: 700}, {krw: 700, dia: 10},
            {pack: 'Pack'}, {krw: 750}, {krw: 750}, {krw: 800}, {krw: 850}, 
            {krw: 900}, {krw: 950}, {pack: 'Pack'}, {krw: 1000}, {pack: 'Mythic'}
        ];


        function updateCollectionInfo(visibleCount) {
            var total = allCards.length || 0;
            var owned = userOwnedCards.length || 0;
            document.getElementById('catalogTotal').innerText = total + " карт";
            document.getElementById('catalogOwned').innerText = "Собрано " + owned;
            document.getElementById('cardsResultText').innerText = total > 0 ? ("Показано " + visibleCount + " из " + total) : "Загрузка...";
            document.getElementById('collectionProgress').innerText = total > 0 ? (Math.round((owned / total) * 100) + "%") : "0%";
        }

        async function fetchProfile() {
            try {
                var res = await fetch(API_BASE + '/api/profile/' + userId, { headers: authHeaders() });
                if (res.ok) {
                    var data = await res.json();

                    document.getElementById('valKrw').innerText = formatBal(data.krw);
                    document.getElementById('valDiamond').innerText = formatBal(data.diamond);
                    document.getElementById('valBc').innerText = formatBal(data.battlecoin);
                    mcBal.krw = data.krw || 0; mcBal.dia = data.diamond || 0; mcBal.bc = data.battlecoin || 0; mcBal.att = data.attempts || 0;
                    if (document.getElementById('shopAttemptsBal')) {
                        document.getElementById('shopAttemptsBal').innerText = data.attempts || 0;
                        if (typeof refreshSummonCostState === 'function') refreshSummonCostState();
                    }

                    userOwnedCards = data.owned_cards || [];
                    document.getElementById('valCards').innerText = formatBal(userOwnedCards.length);

                    // === НОВОЕ: СИНХРОНИЗАЦИЯ СКИНОВ ===
                    userOwnedSkins = data.owned_skins || [];
                    allSkins = data.all_skins_data || [];
                    // ===================================

                    var statusEmojiEl = document.getElementById('userStatusEmoji');
                    isUserPremium = data.is_premium || false;
                    if (data.is_premium) {
                        statusEmojiEl.innerText = "👑";
                        avatarEl.style.borderColor = "var(--premium-gold)";
                        avatarEl.style.boxShadow = "0 0 15px rgba(245, 158, 11, 0.4)";
                    } else {
                        statusEmojiEl.innerText = "🧩";
                        avatarEl.style.borderColor = "var(--accent)";
                        avatarEl.style.boxShadow = "0 0 18px rgba(139,92,246,0.55)";
                    }

                    // Синхронизируем титулы напрямую с бэкенда
                    allTitles = data.all_titles || [];
                    userUnlockedTitles = data.unlocked_titles || [];
                    userActiveTitle = data.active_title;

                    // === ЖЁСТКАЯ ЗАЩИТА ОТ NaN ===
                    realPassLevel = parseInt(data.pass_level) || 1;
                    passXp = parseInt(data.pass_xp) || 0;
                    if (isNaN(passXp)) passXp = 0;
                    claimedPassLevels = parseInt(data.claimed_pass_levels) || 1;

                    // УМНАЯ ШКАЛА ОПЫТА
                    if (realPassLevel < 30) {
                        passMaxXp = (realPassLevel + 1) * 100;
                    } else {
                        passMaxXp = 3000;
                    }

                    userPassQuests = data.pass_quests || {};
                    // =============================

                    // Обновляем текст в профиле
                    var titleText = "ТИТУЛ: НЕ ВЫБРАН";
                    if (userActiveTitle) {
                        var foundTitle = allTitles.find(t => t.id === userActiveTitle);
                        if (foundTitle) titleText = "ТИТУЛ: " + foundTitle.name.toUpperCase();
                    }
                    document.getElementById('psTitle').innerText = titleText;
                    // --- ОТОБРАЖЕНИЕ ЮЗЕРНЕЙМА И СТАТУСА КНОПКИ ---
                    document.getElementById('psUsername').innerText = data.username ? '@' + data.username : 'Нет юзернейма';
                    var hideBtn = document.getElementById('psHideUserBtn');
                    if (data.hide_username) {
                        hideBtn.classList.add('active');
                        hideBtn.innerText = 'Скрыто';
                    } else {
                        hideBtn.classList.remove('active');
                        hideBtn.innerText = 'Скрыть';
                    }

                    // --- ОБНОВЛЕНИЕ СТАТИСТИКИ, КАРТ И ФОНА ---
                    userFavCards = data.fav_cards || {};
                    userUnlockedBgs = data.unlocked_bgs || [];
                    userActiveBg = data.active_bg || 'default';
                    applyProfileBg();

                    document.getElementById('psWins').innerText = data.wins || 0;
                    document.getElementById('psLosses').innerText = data.losses || 0;
                    document.getElementById('psWinrate').innerText = (data.winrate || 0) + '%';
                    document.getElementById('psMaxStreak').innerText = data.max_streak || 0;
                    renderFavSlots();

                    currentDailyDay = data.daily_day || 0;
                    canClaimDaily = data.can_claim_daily || false;
                    needsRecovery = data.needs_recovery || false;

                    var dailyText = document.getElementById('dailyStatusText');
                    if (canClaimDaily) {
                        dailyText.innerHTML = '<span style="color:var(--accent-light)">🎁 Доступно</span>';

                        if (!dailyShownThisSession) {
                            dailyShownThisSession = true;
                            setTimeout(openDailyModal, 800);
                        }
                    } else {
                        dailyText.innerHTML = '<span style="color:#4ade80">✓</span> ' + currentDailyDay + '/30';
                    }

                    updateCollectionInfo(allCards.length);

                    if (document.getElementById('passScreen').classList.contains('open')) {
                        renderPassScreen();
                        renderPassQuests();
                    }
                    updateMainMenuPass();
                    initCollection();

                } else {
                    console.error("Профиль не загрузился, HTTP " + res.status);
                }
                updateCards();
            } catch (e) {
                console.error("Нет связи с бэкендом:", e);
                updateCards();
            }
        }

        function renderDailyGrid() {
            var grid = document.getElementById('dailyGrid');
            grid.innerHTML = '';

            DAILY_REWARDS.forEach(function(r, index) {
                var dayNum = index + 1;
                var isPast = dayNum <= currentDailyDay;
                var isToday = dayNum === (currentDailyDay >= 30 ? 1 : currentDailyDay + 1) && canClaimDaily;

                var classes = 'daily-item';
                if (isPast) classes += ' claimed';
                if (isToday) classes += (needsRecovery ? ' recovery-mode' : ' available');

                var isPack = r.pack !== undefined;
                var isMythic = r.pack === 'Mythic';

                if (isPack && !isPast) {
                    classes += isMythic ? ' pack-gold' : ' pack-purple';
                }

                var innerHtml = '';
                if (isPast) {
                    innerHtml = '<div class="d-day">' + dayNum + '</div><div class="d-icon check">✓</div>';
                } else {
                    if (isPack) {
                        var icon = isMythic ? MC_SYS.crown : MC_SYS.cards;
                        innerHtml = '<div class="d-day">' + dayNum + '</div><div class="d-icon">' + icon + '</div><div class="d-val">Pack</div>';
                    } else {
                        var valText = r.krw;
                        if(r.dia) valText += '<br>+' + r.dia + ' ' + MC_SYS.dia;
                        innerHtml = '<div class="d-day">' + dayNum + '</div><div class="d-icon d-krw">' + MC_SYS.krw + '</div><div class="d-val">' + valText + '</div>';
                    }
                }

                grid.innerHTML += '<div class="' + classes + '">' + innerHtml + '</div>';
            });

            // Рендер кнопок в зависимости от статуса пропущенных дней
            var footerContainer = document.getElementById('dailyFooterContainer');
            if (canClaimDaily) {
                if (needsRecovery) {
                    footerContainer.innerHTML =
                        '<button class="daily-footer-btn active recover" onclick="claimDailyBonus(\'recover\')">Восстановить стрик (10 ' + MC_SYS.dia + ')</button>' +
                        '<button class="daily-footer-btn reset" onclick="claimDailyBonus(\'reset\')">Начать заново (Бесплатно)</button>';
                } else {
                    footerContainer.innerHTML = '<button class="daily-footer-btn active" onclick="claimDailyBonus(\'claim\')">Забрать награду</button>';
                }
            } else {
                footerContainer.innerHTML = '<button class="daily-footer-btn" disabled>Возвращайтесь завтра!</button>';
            }
        }

        function openDailyModal() {
            renderDailyGrid();
            document.getElementById('dailyModal').classList.add('open'); manageBack();
        }
        function closeDailyModal() {
            document.getElementById('dailyModal').classList.remove('open'); manageBack();
        }


        async function claimDailyBonus(actionType = 'claim') {
            try {
                var res = await fetch(API_BASE + '/api/claim_daily/' + userId, {
                    method: 'POST',
                    headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
                    body: JSON.stringify({ action: actionType })
                });
                var data = await res.json();
                if (data.success) {
                    fetchProfile();
                    closeDailyModal();

                    // Если выпала карта — запускаем 3D-Систему
                    if (data.card_key) {
                        startPackSequence(data);
                    } else {
                        tg.showAlert("Ежедневная награда успешно получена!");
                    }
                } else {
                    tg.showAlert("Ошибка: " + data.error);
                }
            } catch(e) { tg.showAlert("Ошибка соединения"); }
        }

// ================= 3D ИНТЕРАКТИВНАЯ АНИМАЦИЯ ОТКРЫТИЯ ПАКА =================
        var currentPackData = null;
        var isCardFlipped = false;
        var packTapCount = 0; // Считаем тапы!

        function startPackSequence(data) {
            currentPackData = data;
            isCardFlipped = false;
            packTapCount = 0; // Сбрасываем тапы при новом паке

            document.getElementById('packOverlay').classList.add('open');
            document.getElementById('packBoxContainer').style.display = 'block';
            document.getElementById('packResultContainer').style.display = 'none';

            document.getElementById('packCube').classList.remove('shake');
            document.getElementById('sysFlash').classList.remove('active');

            var innerCard = document.getElementById('packCardInner');
            innerCard.classList.remove('flipped', 'card-tap-1', 'card-tap-2');
            innerCard.style.transform = ''; // Сброс скейла

            document.getElementById('packCardBack').classList.remove('epic-glow');
            document.getElementById('packCardInfo').classList.remove('show');
            document.getElementById('packCloseBtn').classList.remove('show');

            var hintEl = document.getElementById('sysClickHint');
            if (hintEl) {
                hintEl.style.display = 'block';
                hintEl.innerText = '[ КОСНИТЕСЬ ПАКА : 3 ]';
            }
        }

        function openSystemPack() {
            var cube = document.getElementById('packCube');
            cube.classList.add('shake');

            if (tg.HapticFeedback && tg.HapticFeedback.impactOccurred) tg.HapticFeedback.impactOccurred('heavy');

            // УМНАЯ ПРЕДЗАГРУЗКА (с поддержкой .webp)
            var imgSrc = 'images/' + currentPackData.card_file;
            var fallbackSrc = imgSrc.replace(/\.jpe?g$/i, '.webp');

            var packImg = document.getElementById('packCardImg');
            packImg.onerror = function() {
                this.onerror = null;
                this.src = fallbackSrc;
            };
            packImg.src = imgSrc;

            setTimeout(() => {
                var flash = document.getElementById('sysFlash');
                flash.classList.remove('active');
                void flash.offsetWidth;
                flash.classList.add('active');

                setTimeout(() => {
                    document.getElementById('packBoxContainer').style.display = 'none';
                    document.getElementById('packResultContainer').style.display = 'flex';

                    document.getElementById('packCardTitle').innerText = currentPackData.card_name;
                    document.getElementById('packCardRarity').innerText = currentPackData.card_rarity;

                    var rarityStr = currentPackData.card_rarity || '';
                    var color = '#fff';
                    if(rarityStr.includes('Обыч')) color = '#e2e8f0';
                    else if(rarityStr.includes('Редк')) color = '#fef08a';
                    else if(rarityStr.includes('Эпич')) color = '#4ade80';
                    else if(rarityStr.includes('Легенд')) color = '#60a5fa';
                    else if(rarityStr.includes('Мифич')) color = '#ef4444';
                    else if(rarityStr.includes('Божест')) color = '#a855f7';

                    var backEl = document.getElementById('packCardBack');
                    backEl.style.setProperty('--aura-color', color);
                    backEl.style.borderColor = color;

                    document.getElementById('packCardRarity').style.color = color;
                    document.getElementById('packCardRarity').style.textShadow = '0 0 10px ' + color;

                    var dupMsg = document.getElementById('packDupMsg');
                    if (currentPackData.is_duplicate) {
                        dupMsg.style.display = 'inline-block';
                        dupMsg.innerText = '⚠️ КАРТА УЖЕ ЕСТЬ: КОНВЕРТИРОВАНО В ' + currentPackData.dup_reward + ' ₩';
                    } else {
                        dupMsg.style.display = 'none';
                    }
                }, 200);
            }, 500);
        }

        // ================= МЕХАНИКА 3-Х ТАПОВ =================
        function clickToFlipCard() {
            if (isCardFlipped || !currentPackData) return;

            packTapCount++;
            var innerCard = document.getElementById('packCardInner');
            var hintEl = document.getElementById('sysClickHint');

            // ПЕРВЫЙ ТАП: Легкая тряска
            if (packTapCount === 1) {
                if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
                innerCard.classList.remove('card-tap-1');
                void innerCard.offsetWidth; // Магия для перезапуска анимации
                innerCard.classList.add('card-tap-1');
                if (hintEl) hintEl.innerText = '[ РАЗРЫВ ПАКА... 2 ]';
                return;
            }

            // ВТОРОЙ ТАП: Сильная тряска и увеличение
            if (packTapCount === 2) {
                if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
                innerCard.classList.remove('card-tap-2');
                void innerCard.offsetWidth;
                innerCard.classList.add('card-tap-2');
                if (hintEl) hintEl.innerText = '[ КРИТИЧЕСКИЙ РАЗРЫВ : 1 ]';
                return;
            }

            // ТРЕТИЙ ТАП: Взрыв, вспышка и переворот!
            if (packTapCount >= 3) {
                isCardFlipped = true;
                if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('heavy');

                if (hintEl) hintEl.style.display = 'none';

                // Эпичная вспышка света!
                var flash = document.getElementById('sysFlash');
                flash.classList.remove('active');
                void flash.offsetWidth;
                flash.classList.add('active');

                // Очищаем классы тапов и запускаем переворот
                innerCard.classList.remove('card-tap-1', 'card-tap-2');
                innerCard.style.transform = '';
                innerCard.classList.add('flipped');
                var backEl = document.getElementById('packCardBack');
                backEl.classList.add('epic-glow');

                // 🔥 ГЕНЕРИРУЕМ ЭЛЕКТРО-ВЗРЫВ! 🔥
                var explosionBox = document.getElementById('electroExplosionContainer');
                explosionBox.innerHTML = ''; // очищаем

                // Главное кольцо
                var ring = document.createElement('div');
                ring.className = 'electro-ring explode';
                // Берем цвет редкости карты
                ring.style.setProperty('--aura-color', backEl.style.borderColor || '#06b6d4');
                explosionBox.appendChild(ring);

                // Искры
                for(var i = 0; i < 12; i++) {
                    var spark = document.createElement('div');
                    spark.className = 'electro-spark';
                    spark.style.setProperty('--rot', (i * 30) + 'deg');
                    spark.style.boxShadow = '0 0 10px ' + (backEl.style.borderColor || '#06b6d4');
                    spark.style.animation = 'sparkFly 0.6s cubic-bezier(0.165, 0.84, 0.44, 1) forwards ' + (Math.random() * 0.1) + 's';
                    explosionBox.appendChild(spark);
                }


                setTimeout(() => {
                    document.getElementById('packCardInfo').classList.add('show');
                    document.getElementById('packCloseBtn').classList.add('show');
                }, 600);
            }
        }

        function closeSystemPack() {
            document.getElementById('packOverlay').classList.remove('open');
            currentPackData = null;
        }

        // ====== КАТАЛОГ ======
        fetch('cards.json')
            .then(function(r) {
                if (!r.ok) throw new Error("cards.json HTTP " + r.status);
                return r.json();
            })
            .then(function(data) {
                allCards = data;
                var seriesSet = new Set();
                allCards.forEach(function(c) { if (c.series) seriesSet.add(c.series); });
                var seriesSelect = document.getElementById('seriesFilter');
                seriesSet.forEach(function(s) {
                    var opt = document.createElement('option');
                    opt.value = s;
                    opt.innerText = s;
                    seriesSelect.appendChild(opt);
                });
                updateCollectionInfo(allCards.length);
                updateCards();
            })
            .catch(function(e) {
                console.error("Не удалось загрузить cards.json:", e);
                document.getElementById('cardsResultText').innerText = "Не удалось загрузить каталог";
            })
            .finally(function() {
                // Профиль грузим в любом случае — даже если каталог не пришёл.
                fetchProfile();
            });
// Глобальная функция для iOS, чтобы браузер не терял контекст картинки
        window.cardImageLoaded = function(img) {
            if (img && img.parentElement) {
                img.parentElement.classList.add('loaded');
            }
        };

        var currentCatalogPage = 1;
        var lastCatalogFilterKey = "";

        // === ЛОГИКА ПЕРЕКЛЮЧАТЕЛЕЙ ===
function toggleCatalogTab(tab) {
    if (tg.HapticFeedback && tg.HapticFeedback.selectionChanged) tg.HapticFeedback.selectionChanged();
    currentCatalogTab = tab;

    var btnCards = document.getElementById('btnTabCards');
    var btnSkins = document.getElementById('btnTabSkins');
    var slider = document.getElementById('catalogToggleSlider');

    var sortFilter = document.getElementById('sortFilter');
    var styleFilter = document.getElementById('styleFilter');
    var exclusiveBtn = document.getElementById('exclusiveFilterBtn');

    if (tab === 'cards') {
        btnCards.classList.add('active');
        btnSkins.classList.remove('active');
        slider.style.transform = 'translateX(0)';

        sortFilter.style.display = 'block';
        styleFilter.style.display = 'block';
        exclusiveBtn.style.display = 'flex';
    } else {
        btnCards.classList.remove('active');
        btnSkins.classList.add('active');
        slider.style.transform = 'translateX(100%)';

        // Сила, скорость и навыки к скинам не относятся — прячем
        sortFilter.style.display = 'none';
        styleFilter.style.display = 'none';
        exclusiveBtn.style.display = 'none';
    }

    currentCatalogPage = 1;
    updateCards();
}

function toggleExclusive() {
    if (tg.HapticFeedback && tg.HapticFeedback.selectionChanged) tg.HapticFeedback.selectionChanged();
    isExclusiveFilterActive = !isExclusiveFilterActive;
    var btn = document.getElementById('exclusiveFilterBtn');

    if (isExclusiveFilterActive) btn.classList.add('active');
    else btn.classList.remove('active');

    currentCatalogPage = 1;
    updateCards();
}

// === ОБНОВЛЕННЫЙ ФИЛЬТР КАРТ И СКИНОВ ===
function updateCards() {
    var search = document.getElementById('searchInput').value.toLowerCase().trim();
    var rarity = document.getElementById('rarityFilter').value;
    var series = document.getElementById('seriesFilter').value;
    var sortType = document.getElementById('sortFilter').value;
    var style = document.getElementById('styleFilter').value;

    var currentFilterKey = currentCatalogTab + "_" + search + "_" + rarity + "_" + series + "_" + sortType + "_" + style + "_" + isExclusiveFilterActive;
    if (lastCatalogFilterKey !== currentFilterKey) {
        currentCatalogPage = 1;
        lastCatalogFilterKey = currentFilterKey;
    }

    var filtered = [];

    if (currentCatalogTab === 'cards') {
        filtered = allCards.filter(function(card) {
            if (!card) return false;
            var cleanRarity = (card.rarity || '').split(' ')[0];
            var matchName = String(card.name || '').toLowerCase().includes(search);
            var matchRarity = rarity === 'all' || cleanRarity === rarity;
            var matchSeries = series === 'all' || card.series === series;
            var matchExclusive = isExclusiveFilterActive ? (card.exclusive === true) : true;

            // Внутри updateCards():
            var selectedStyle = document.getElementById('styleFilter').value;

            var matchStyle = true;
            if (selectedStyle !== 'all') {
               var cardSkill = getCardSkill(card.id);
               if (selectedStyle === 'Базовый') {
               matchStyle = (cardSkill === 'Базовый');
         } else {
               matchStyle = (cardSkill === selectedStyle);
           }
         }
            return matchName && matchRarity && matchSeries && matchExclusive && matchStyle;
        });

        filtered = filtered.map(c => Object.assign({}, c, { isSkin: false }));
    } else {
        // Логика поиска по скинам
        allSkins.forEach(function(skinDef) {
            var baseCard = allCards.find(c => c.id === skinDef.card_id);
            if (!baseCard) return;

            var cleanRarity = (baseCard.rarity || '').split(' ')[0];
            var matchName = String(baseCard.name || '').toLowerCase().includes(search);
            var matchRarity = rarity === 'all' || cleanRarity === rarity;
            var matchSeries = series === 'all' || baseCard.series === series;
            var matchExclusive = isExclusiveFilterActive ? (baseCard.exclusive === true) : true;

            var matchStyle = true;
            if (style !== 'all') {
                var cardStyle = baseCard.style || '';
                if (style === 'Базовый') {
                    matchStyle = !cardStyle.includes('Копирование') && !cardStyle.includes('Восстание') && !cardStyle.includes('Берсерк') && !cardStyle.includes('Пространство') && !cardStyle.includes('Пробивание') && !cardStyle.includes('Уклонение');
                } else {
                    matchStyle = cardStyle.includes(style);
                }
            }

            if (matchName && matchRarity && matchSeries && matchExclusive && matchStyle) {
                filtered.push(Object.assign({}, baseCard, {
                    isSkin: true,
                    skinType: skinDef.type,
                    skinFile: skinDef.file,
                    skinIdKey: skinDef.card_id + "_" + skinDef.type
                }));
            }
        });
    }

    // Универсальная сортировка статов
    if (sortType === 'str_desc') filtered.sort((a, b) => (b.strength||0) - (a.strength||0));
    else if (sortType === 'str_asc') filtered.sort((a, b) => (a.strength||0) - (b.strength||0));
    else if (sortType === 'spd_desc') filtered.sort((a, b) => (b.speed||0) - (a.speed||0));
    else if (sortType === 'spd_asc') filtered.sort((a, b) => (a.speed||0) - (b.speed||0));
    else if (sortType === 'int_desc') filtered.sort((a, b) => (b.intellect||0) - (a.intellect||0));
    else if (sortType === 'int_asc') filtered.sort((a, b) => (a.intellect||0) - (b.intellect||0));

    renderCards(filtered);
}

// === РЕНДЕР КАРТ (ПОДДЕРЖКА WEBM И БЕЙДЖЕЙ) ===
function renderCards(cards) {
    var container = document.getElementById('cardsContainer');
    var pagContainer = document.getElementById('catalogPagination');
    container.innerHTML = '';
    if (pagContainer) pagContainer.innerHTML = '';

    if (currentCatalogTab === 'cards') {
        document.getElementById('catalogTotal').innerText = allCards.length + " карт";
        document.getElementById('catalogOwned').innerText = "Собрано " + userOwnedCards.length;
    } else {
        document.getElementById('catalogTotal').innerText = allSkins.length + " скинов";
        document.getElementById('catalogOwned').innerText = "Собрано " + userOwnedSkins.length;
    }

    document.getElementById('cardsResultText').innerText = cards.length > 0 ? ("Показано " + cards.length) : "Загрузка...";

    var totalItems = currentCatalogTab === 'cards' ? allCards.length : allSkins.length;
    var ownedItems = currentCatalogTab === 'cards' ? userOwnedCards.length : userOwnedSkins.length;
    document.getElementById('collectionProgress').innerText = totalItems > 0 ? (Math.round((ownedItems / totalItems) * 100) + "%") : "0%";

    if (!cards.length) {
        container.innerHTML = '<div class="empty-state" style="grid-column: 1/-1; text-align:center; padding:40px 10px; color:var(--text-muted);">Ничего не найдено<br><span style="font-size:11px; opacity:0.6;">Измените фильтры</span></div>';
        return;
    }

    var cardsPerPage = 12;
    var totalPages = Math.ceil(cards.length / cardsPerPage) || 1;
    if (currentCatalogPage > totalPages) currentCatalogPage = totalPages;

    var start = (currentCatalogPage - 1) * cardsPerPage;
    var pageCards = cards.slice(start, start + cardsPerPage);

    pageCards.forEach(function(item) {
        var cleanRarity = (item.rarity || '').split(' ')[0];
        var isOwned = item.isSkin ? userOwnedSkins.includes(item.skinIdKey) : userOwnedCards.includes(item.id);
        var hasAnyOwned = item.isSkin ? (userOwnedSkins.length > 0) : (userOwnedCards.length > 0);

        var div = document.createElement('div');
        div.className = 'card' + (!isOwned && hasAnyOwned ? ' is-locked' : '');
        div.dataset.rarity = cleanRarity;
        div.onclick = function() { openModal(item); };

        var badgeHtml = isOwned ? '<div class="owned-badge">МОЙ</div>' : (hasAnyOwned ? '<div class="locked-badge">LOCK</div>' : '');
        var mediaHtml = '';

        if (item.isSkin) {
            // УБРАЛИ ГРОМОЗДКИЙ БЕЙДЖ ОТСЮДА
            var webFileName = (item.skinFile || '').replace(/\.jpg|\.jpeg|\.png/i, '.webp').replace(/\.mp4/i, '.webm');

            if (item.skinType === 'absolute') {
                mediaHtml = '<div class="img-wrap"><div class="spinner-ring"></div>' + mcSkinVideo(item.skinFile, 'skin-grid-video', 'onloadeddata="this.parentElement.classList.add(\'loaded\')"') + '<div class="skin-video-badge">▶</div></div>';
            } else {
                mediaHtml = '<div class="img-wrap"><div class="spinner-ring"></div><img src="images/skins/' + webFileName + '" loading="lazy" onload="window.cardImageLoaded(this)" onerror="this.onerror=null; this.src=\'images/default.webp\';"></div>';
            }
        } else {
            var fallbackSrc = (item.file || '').replace(/\.jpe?g$/i, '.webp');
            mediaHtml = '<div class="img-wrap"><div class="spinner-ring"></div><img src="images/' + fallbackSrc + '" loading="lazy" onload="window.cardImageLoaded(this)" onerror="window.cardImageLoaded(this)"></div>';
        }

        var styleHtml = '';
        var cardSkill = getCardSkill(item.id);
        if (cardSkill !== 'Базовый') {
            var sIcon = cardSkill === 'Копирование' ? '👁️' :
                       cardSkill === 'Восстание' ? '🌑' :
                       cardSkill === 'Берсерк' ? '🩸' :
                       cardSkill === 'Пространство' ? '🌊' :
                       cardSkill === 'Пробивание' ? '⚔️' :
                       cardSkill === 'Уклонение' ? '🌪' : '✨';

            styleHtml = '<div class="style-badge">' + sIcon + ' ' + cardSkill + '</div>';
        }

        // ДОБАВЛЯЕМ ЭМОДЗИ СКИНА ПРЯМО К ИМЕНИ
        var displayName = item.name || '';
        if (item.isSkin) {
            displayName += item.skinType === 'awakened' ? ' 💠' : ' 🔮';
        }

        div.innerHTML = badgeHtml + mediaHtml +
            '<h3>' + displayName + '</h3>' +
            '<div class="rarity-badge">' + (item.rarity || '') + '</div>' +
            '<div class="card-meta">' +
                '<div class="mini-stat">⚡ ' + (item.speed || 0) + '</div>' +
                '<div class="mini-stat">💪 ' + (item.strength || 0) + '</div>' +
                '<div class="mini-stat">🧠 ' + (item.intellect || 0) + '</div>' +
            '</div>' + styleHtml;

        container.appendChild(div);
    });

    // Пагинация (оставил твою красивую реализацию)
    if (totalPages > 1 && pagContainer) {
        var prevBtn = document.createElement('button');
        prevBtn.className = 'catalog-page-btn';
        prevBtn.innerHTML = '◀';
        prevBtn.disabled = (currentCatalogPage === 1);
        prevBtn.onclick = function() { if(tg.HapticFeedback) tg.HapticFeedback.selectionChanged(); currentCatalogPage--; renderCards(cards); document.getElementById('tab-catalog').scrollIntoView({behavior: "smooth"}); };
        pagContainer.appendChild(prevBtn);

        var startPage = Math.max(1, currentCatalogPage - 2);
        var endPage = Math.min(totalPages, startPage + 4);
        if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);

        for (var p = startPage; p <= endPage; p++) {
            (function(pageNum) {
                var pageBtn = document.createElement('button');
                pageBtn.className = 'catalog-page-btn' + (pageNum === currentCatalogPage ? ' active' : '');
                pageBtn.innerText = pageNum;
                pageBtn.onclick = function() { if(tg.HapticFeedback) tg.HapticFeedback.selectionChanged(); currentCatalogPage = pageNum; renderCards(cards); document.getElementById('tab-catalog').scrollIntoView({behavior: "smooth"}); };
                pagContainer.appendChild(pageBtn);
            })(p);
        }

        var nextBtn = document.createElement('button');
        nextBtn.className = 'catalog-page-btn';
        nextBtn.innerHTML = '▶';
        nextBtn.disabled = (currentCatalogPage === totalPages);
        nextBtn.onclick = function() { if(tg.HapticFeedback) tg.HapticFeedback.selectionChanged(); currentCatalogPage++; renderCards(cards); document.getElementById('tab-catalog').scrollIntoView({behavior: "smooth"}); };
        pagContainer.appendChild(nextBtn);
    }
}

// === МОДАЛКА (ДОБАВЛЕНА ПОДДЕРЖКА ВИДЕО) ===


        document.querySelectorAll('.modal-overlay').forEach(function(overlay) {
            overlay.addEventListener('click', function(e) {
                if (e.target !== overlay) return;
                if (overlay.id === 'cardModal') closeModal();
                else { overlay.classList.remove('open'); manageBack(); }
            });
        });

        // ============================================================
        //  ====================  ЗАРАБОТОК  =========================
        // ============================================================
        var refData = null;
        var tasksData = null;
        var LINKS = {
            channel: "https://t.me/manhwcard",
            boost: "https://t.me/boost/manhwcard",
            tiktok: "https://vt.tiktok.com/ZS92ocVcSbVA5-QEi0R/"
        };

        // Иконки заданий (единый фиолетовый цвет сайта)
        function iconFor(type) {
            if (type === 'tiktok') {
                return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><rect x="2" y="3" width="20" height="18" rx="3"/><path d="M2 8h20M7 3v5M17 3v5"/><path d="M10 12l5 3-5 3z"/></svg>';
            }
            if (type === 'story') {
                return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M10 9l5 3-5 3z"/></svg>';
            }
            if (type === 'boost') {
                return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2 0-2.8a2 2 0 0 0-3 0z"/><path d="M12 15l-3-3a11 11 0 0 1 8-8c2.5 0 3 1 3 3a11 11 0 0 1-8 8z"/><path d="M9 12H4s.5-2.8 2-4 4-1 4-1M12 15v5s2.8-.5 4-2 1-4 1-4"/></svg>';
            }
            return '';
        }
        // Расставляем иконки в карточки заданий
        document.getElementById('ico-tiktok').innerHTML = iconFor('tiktok');
        document.getElementById('ico-story').innerHTML = iconFor('story');
        document.getElementById('ico-boost').innerHTML = iconFor('boost');

        var SVG_DIAMOND = '<svg class="b-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M3 9l3-5h12l3 5-9 12z"/><path d="M3 9h18M9 4l-2 5 5 12 5-12-2-5"/></svg>';

        function openEarnModal() {
            if (tg.HapticFeedback && tg.HapticFeedback.impactOccurred) tg.HapticFeedback.impactOccurred('light');
            document.getElementById('earnScreen').classList.add('open');
            manageBack();
            switchEarnTab('ref');
            loadReferral();
            loadTasks();
        }
        function closeEarnModal() {
            // Если открыт лист задания — сначала закрываем его
            if (document.getElementById('taskSheet').classList.contains('open')) {
                closeTaskSheet();
                return;
            }
            document.getElementById('earnScreen').classList.remove('open');
            manageBack();
        }

        function switchEarnTab(tab) {
            if (tg.HapticFeedback && tg.HapticFeedback.selectionChanged) tg.HapticFeedback.selectionChanged();

            var panes = {
                ref:   { btn: 'earnTabRef',   pane: 'earnRef'   },
                tasks: { btn: 'earnTabTasks', pane: 'earnTasks' },
                duel:  { btn: 'earnTabDuel',  pane: 'earnDuel'  }
            };

            Object.keys(panes).forEach(function (key) {
                var btn = document.getElementById(panes[key].btn);
                var pane = document.getElementById(panes[key].pane);
                if (btn) btn.classList.toggle('active', key === tab);
                if (pane) pane.classList.toggle('active', key === tab);
            });

            if (tab === 'duel' && typeof initDuelLobby === 'function') initDuelLobby();
        }

        // ---------- РЕФЕРАЛЫ ----------
        async function loadReferral() {
            try {
                var res = await fetch(API_BASE + '/api/referral/' + userId, { headers: authHeaders() });
                if (!res.ok) return;
                refData = await res.json();
                document.getElementById('refCount').innerText = refData.count || 0;
                document.getElementById('refEarnedKrw').innerText = refData.earned_krw || 0;
                document.getElementById('refEarnedAtt').innerText = refData.earned_attempts || 0;
                var mn = refData.reward_krw_min || 500, mx = refData.reward_krw_max || 850, at = refData.reward_attempts || 5;
                document.getElementById('refNote').innerHTML =
                    'Бонус за 1 друга: <b>₩ ' + mn + '–' + mx + '</b> + <b>' + at + ' круток</b>. Награду получаете и вы, и друг.';
            } catch (e) { console.error('referral load error', e); }
        }

        function inviteFriend() {
            if (tg.HapticFeedback && tg.HapticFeedback.impactOccurred) tg.HapticFeedback.impactOccurred('medium');
            if (!refData || !refData.code) { loadReferral(); tg.showAlert('Секунду, подгружаю вашу ссылку...'); return; }
            var bot = refData.bot_username || '';
            if (!bot) { tg.showAlert('Не удалось определить имя бота. Попробуйте позже.'); return; }
            var link = 'https://t.me/' + bot + '?start=' + refData.code;
            var text = 'Заходи в ManhwCard — собирай карты и получай награды! 🃏';
            var shareUrl = 'https://t.me/share/url?url=' + encodeURIComponent(link) + '&text=' + encodeURIComponent(text);
            tg.openTelegramLink(shareUrl);
        }

        // ---------- ЗАДАНИЯ ----------
        async function loadTasks() {
            try {
                var res = await fetch(API_BASE + '/api/tasks/' + userId, { headers: authHeaders() });
                if (!res.ok) return;
                tasksData = await res.json();
                if (tasksData.links) LINKS = tasksData.links;
                renderPartnerSub();
            } catch (e) { console.error('tasks load error', e); }
        }

        function renderPartnerSub() {
            markPartnerDone('subDoBtn', tasksData && tasksData.subscribe_done);
            markPartnerDone('chatDoBtn', tasksData && tasksData.chat_sub_done);
        }

        function markPartnerDone(btnId, done) {
            var btn = document.getElementById(btnId);
            if (!btn || !done) return;
            var chk = document.createElement('div');
            chk.className = 'partner-done-check';
            chk.innerHTML = '✓';
            btn.replaceWith(chk);
        }

        // Вступление в чат игроков (Партнёры)
        var chatCheckBusy = false;
        async function checkChatSub() {
            if (chatCheckBusy) return;
            chatCheckBusy = true;
            var btn = document.getElementById('chatDoBtn');
            var reset = function () {
                if (btn) { btn.disabled = false; btn.classList.remove('checking'); btn.innerText = 'Выполнить'; }
            };
            if (btn) { btn.disabled = true; btn.classList.add('checking'); btn.innerText = 'Проверяем...'; }
            try {
                var res = await fetch(API_BASE + '/api/check_chat/' + userId, { method: 'POST', headers: authHeaders() });
                var data = await res.json();
                if (!data.ok) { tg.showAlert(data.error || 'Ошибка проверки'); reset(); return; }
                if (!data.joined) {
                    var link = data.link || (LINKS && LINKS.chat);
                    if (link) {
                        if (link.indexOf('t.me/') !== -1 && tg.openTelegramLink) tg.openTelegramLink(link);
                        else openUrl(link);
                        tg.showAlert('Вступите в чат и нажмите «Выполнить» ещё раз.');
                    } else {
                        tg.showAlert('Ссылка на чат пока недоступна. Попробуйте позже.');
                    }
                    reset();
                    return;
                }
                if (data.rewarded) {
                    if (tg.HapticFeedback && tg.HapticFeedback.notificationOccurred) tg.HapticFeedback.notificationOccurred('success');
                    var rw = data.reward || { krw: 1000, dia: 5 };
                    showToast('Награда получена ✓', '+' + rw.krw + ' ₩ и +' + rw.dia + ' 💎 за вступление в чат.');
                    fetchProfile();
                } else {
                    showToast('Уже выполнено ✓', 'Вступление в чат засчитано ранее.');
                }
                if (tasksData) tasksData.chat_sub_done = true;
                markPartnerDone('chatDoBtn', true);
            } catch (e) {
                tg.showAlert('Ошибка соединения');
                reset();
            } finally {
                chatCheckBusy = false;
            }
        }

        // ---------- НИЖНИЙ ЛИСТ ЗАДАНИЯ ----------
        function openTaskSheet(type) {
            if (tg.HapticFeedback && tg.HapticFeedback.impactOccurred) tg.HapticFeedback.impactOccurred('light');
            document.getElementById('sheetContent').innerHTML = buildSheet(type);
            document.getElementById('taskSheet').classList.add('open');
            manageBack();
            // Если это буст и он уже на кулдауне — сразу показываем отчёт
            if (type === 'boost' && tasksData && tasksData.boost_on_cooldown) {
                resetBoostBtn(true);
            }
        }
        function closeTaskSheet() {
            document.getElementById('taskSheet').classList.remove('open');
            manageBack();
        }
        document.getElementById('taskSheet').addEventListener('click', function(e) {
            if (e.target === this) closeTaskSheet();
        });

        function buildSheet(type) {
            if (type === 'tiktok') {
                return socialSheet({
                    type: 'tiktok',
                    kicker: 'TikTok видео',
                    title: 'TikTok видео про ManhwCard',
                    desc: 'Снимите короткое TikTok-видео об <b>ManhwCard</b>. Награда растёт с просмотрами: 4 000 KRW + 10 алмазов за каждые 1 000 просмотров.',
                    krw: '+4 000', dia: '+10', when: 'за 1k просмотров',
                    foot: 'Больше охват — больше награда: выплата масштабируется по количеству просмотров.',
                    steps: [
                        'Снимите короткое TikTok-видео <b>или эдит</b> с упоминанием бота',
                        'Добавьте наш хэштег <b>#manhwcard</b>, чтобы модератор нашёл ролик',
                        'Вставьте ссылку и отправьте на модерацию'
                    ],
                    inputLabel: 'Ссылка на TikTok видео',
                    openLabel: 'Открыть TikTok', openLink: LINKS.tiktok
                });
            }
            if (type === 'story') {
                return socialSheet({
                    type: 'story',
                    kicker: 'Сторис в Telegram',
                    title: 'Сторис в Telegram',
                    desc: 'Выложите сторис в Telegram с упоминанием <b>ManhwCard</b> и нашего канала. 3 000 KRW + 5 алмазов за одобренную сторис.',
                    krw: '+3 000', dia: '+5', when: 'за одобренную сторис',
                    foot: '',
                    steps: [
                        'Откройте Telegram и опубликуйте историю об <b>ManhwCard</b>',
                        'Упомяните наш канал и оставьте сторис на 24 часа',
                        'Вставьте ссылку ниже и нажмите «Отправить на проверку»'
                    ],
                    inputLabel: 'Ссылка на вашу сторис',
                    openLabel: 'Открыть Telegram', openLink: LINKS.channel
                });
            }
            if (type === 'boost') {
                return boostSheet();
            }
            return '';
        }

        // Универсальный лист для TikTok / Сторис (отправка на модерацию)
        function socialSheet(o) {
            var footHtml = o.foot ? '<div class="sheet-reward-foot">' + o.foot + '</div>' : '';
            var stepsHtml = o.steps.map(function(s, i) {
                return '<div class="sheet-step"><div class="num">' + (i + 1) + '</div><div class="txt">' + s + '</div></div>';
            }).join('');
            return '' +
            '<div class="sheet-head">' +
                '<div class="task-ico">' + iconFor(o.type) + '</div>' +
                '<div><div class="sheet-kicker">' + o.kicker + '</div><div class="sheet-title">' + o.title + '</div></div>' +
                '<button class="sheet-close" onclick="closeTaskSheet()">✖</button>' +
            '</div>' +
            '<div class="sheet-desc">' + o.desc + '</div>' +
            '<div class="sheet-reward-box">' +
                '<div class="sheet-reward-head"><span>Что ты получишь</span><span class="when">' + o.when + '</span></div>' +
                '<div class="sheet-reward-pills">' +
                    '<span class="sheet-reward-pill"><span class="b-ico">₩</span> ' + o.krw + '</span>' +
                    '<span class="sheet-reward-pill">' + SVG_DIAMOND + ' ' + o.dia + '</span>' +
                '</div>' + footHtml +
            '</div>' +
            '<div class="sheet-steps">' +
                '<div class="sheet-steps-title">Как это работает</div>' + stepsHtml +
            '</div>' +
            '<div class="sheet-label">' + o.inputLabel + '</div>' +
            '<input id="socialLink" class="sheet-input" type="url" placeholder="https://...">' +
            '<div class="sheet-label">Сообщение модератору (необязательно)</div>' +
            '<textarea id="socialNote" class="sheet-input" placeholder="Контекст: просмотры, язык и т.п."></textarea>' +
            '<button class="sheet-btn ghost" onclick="openUrl(\'' + o.openLink + '\')">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6M10 14L21 3"/></svg> ' + o.openLabel + ' ›</button>' +
            '<button class="sheet-btn primary" id="socialSubmitBtn" onclick="submitSocial(\'' + o.type + '\')">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/></svg> Отправить на проверку</button>' +
            '<div class="sheet-foot">После отправки заявка уходит на модерацию — приложите скриншот в боте поддержки.</div>';
        }

        // Лист для буста
        function boostSheet() {
            var onCd = tasksData && tasksData.boost_on_cooldown;
            var actionHtml;
            if (onCd) {
                actionHtml = '<div id="boostAction">' + boostReportHtml(tasksData.boost_seconds_left) + '</div>';
            } else {
                actionHtml = '<div id="boostAction">' +
                    '<button class="sheet-btn primary" id="boostCheckBtn" onclick="checkBoost()">' +
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z"/><path d="M9 12l2 2 4-4"/></svg> Проверить буст</button>' +
                    '</div>';
            }
            return '' +
            '<div class="sheet-head">' +
                '<div class="task-ico">' + iconFor('boost') + '</div>' +
                '<div><div class="sheet-kicker">Буст канала</div><div class="sheet-title">Буст нашего Telegram-канала</div></div>' +
                '<button class="sheet-close" onclick="closeTaskSheet()">✖</button>' +
            '</div>' +
            '<div class="sheet-desc">Используйте ваш Premium-слот буста на <b>@manhwcard</b>. 2 000 KRW + 10 алмазов за активный буст. Повторное получение — раз в 7 дней, пока буст активен.</div>' +
            '<div class="sheet-reward-box">' +
                '<div class="sheet-reward-head"><span>Что ты получишь</span><span class="when">за каждый активный буст</span></div>' +
                '<div class="sheet-reward-pills">' +
                    '<span class="sheet-reward-pill"><span class="b-ico">₩</span> +2 000</span>' +
                    '<span class="sheet-reward-pill">' + SVG_DIAMOND + ' +10</span>' +
                '</div>' +
            '</div>' +
            '<div class="sheet-steps">' +
                '<div class="sheet-steps-title">Как это работает</div>' +
                '<div class="sheet-step"><div class="num">1</div><div class="txt">Забустите наш Telegram-канал вашим слотом <b>Premium</b></div></div>' +
                '<div class="sheet-step"><div class="num">2</div><div class="txt">Держите буст активным, чтобы сохранить награду</div></div>' +
                '<div class="sheet-step"><div class="num">3</div><div class="txt">Нажмите «Проверить буст» — награда начислится автоматически</div></div>' +
            '</div>' +
            '<button class="sheet-btn ghost" onclick="openUrl(\'' + LINKS.boost + '\')">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6M10 14L21 3"/></svg> Открыть канал ›</button>' +
            actionHtml;
        }

        // 7-дневный отчёт по бусту + обратный отсчёт до следующей награды
        function boostReportHtml(secondsLeft) {
            var total = 7 * 24 * 3600;
            var passed = total - (secondsLeft || 0);
            var daysDone = Math.max(0, Math.min(7, Math.floor(passed / (24 * 3600))));
            var cells = '';
            for (var i = 1; i <= 7; i++) {
                var done = i <= daysDone;
                cells += '<div class="boost-day' + (done ? ' done' : '') + '">' +
                    '<div class="dn">Д' + i + '</div>' +
                    '<div class="di">' + (done ? '✓' : '•') + '</div></div>';
            }
            return '' +
            '<div class="boost-report">' +
                '<div class="boost-report-title">' +
                    '<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;"><path d="M9 1l5 2.5v4C14 12 11.5 14 9 15.5 6.5 14 4 12 4 7.5v-4z"/><path d="M6.5 9l1.5 1.5 3-3"/></svg>' +
                    'Награда получена! Буст активен 🚀' +
                '</div>' +
                '<div class="boost-days">' + cells + '</div>' +
                '<div class="boost-countdown">Следующая награда через <b>' + fmtLeft(secondsLeft) + '</b><br><span style="font-size:11px;color:var(--text-muted)">держите буст активным, чтобы её не потерять</span></div>' +
            '</div>';
        }

        // Отправка TikTok / Сторис на модерацию
        async function submitSocial(type) {
            var link = (document.getElementById('socialLink') || {}).value || '';
            var note = (document.getElementById('socialNote') || {}).value || '';
            link = link.trim();
            if (!link || link.indexOf('http') !== 0) {
                tg.showAlert('Вставьте корректную ссылку (https://...)');
                return;
            }
            var btn = document.getElementById('socialSubmitBtn');
            if (btn) { btn.disabled = true; btn.innerText = 'Отправляем...'; }
            try {
                var res = await fetch(API_BASE + '/api/submit_social/' + userId, {
                    method: 'POST',
                    headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
                    body: JSON.stringify({ task_type: type, link: link, note: note })
                });
                var data = await res.json();
                if (data.ok) {
                    if (tg.HapticFeedback && tg.HapticFeedback.notificationOccurred) tg.HapticFeedback.notificationOccurred('success');
                    closeTaskSheet();
                    showToast('Заявка отправлена', 'Модератор проверит её вручную и начислит награду.');
                } else {
                    tg.showAlert(data.error || 'Не удалось отправить заявку');
                    if (btn) { btn.disabled = false; btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/></svg> Отправить на проверку'; }
                }
            } catch (e) {
                tg.showAlert('Ошибка соединения');
                if (btn) { btn.disabled = false; btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/></svg> Отправить на проверку'; }
            }
        }

        // Проверка буста
        async function checkBoost() {
            var btn = document.getElementById('boostCheckBtn');
            if (btn) { btn.disabled = true; btn.innerText = 'Проверяем...'; }
            try {
                var res = await fetch(API_BASE + '/api/check_boost/' + userId, { method: 'POST', headers: authHeaders() });
                var data = await res.json();
                if (!data.ok) {
                    tg.showAlert(data.error || 'Ошибка проверки');
                    if (btn) { btn.disabled = false; btn.innerText = 'Проверить буст'; }
                    return;
                }
                if (!data.boosting) {
                    tg.showAlert('Буст не найден. Забустите канал @manhwcard вашим слотом Premium и нажмите ещё раз.');
                    openUrl(LINKS.boost);
                    if (btn) { btn.disabled = false; btn.innerText = 'Проверить буст'; }
                    return;
                }
                if (data.claimed) {
                    if (tg.HapticFeedback && tg.HapticFeedback.notificationOccurred) tg.HapticFeedback.notificationOccurred('success');
                    var rw = data.reward || { krw: 2000, dia: 10 };
                    showToast('Награда получена 🚀', '+' + rw.krw + ' ₩ и +' + rw.dia + ' 💎 за активный буст.');
                    fetchProfile();
                    if (tasksData) { tasksData.boost_on_cooldown = true; tasksData.boost_seconds_left = data.boost_seconds_left; }
                    resetBoostBtn(false, data.boost_seconds_left);
                } else {
                    // Буст активен, но награда на этой неделе уже забрана
                    if (tasksData) { tasksData.boost_on_cooldown = true; tasksData.boost_seconds_left = data.boost_seconds_left; }
                    resetBoostBtn(true, data.boost_seconds_left);
                }
            } catch (e) {
                tg.showAlert('Ошибка соединения');
                if (btn) { btn.disabled = false; btn.innerText = 'Проверить буст'; }
            }
        }

        // Заменяет кнопку «Проверить буст» на 7-дневный отчёт
        function resetBoostBtn(silent, secondsLeft) {
            var holder = document.getElementById('boostAction');
            if (!holder) return;
            var secs = (secondsLeft != null) ? secondsLeft : (tasksData ? tasksData.boost_seconds_left : 0);
            holder.innerHTML = boostReportHtml(secs);
        }

        // Проверка подписки (Партнёры)
        async function checkSubscription() {
            var btn = document.getElementById('subDoBtn');
            if (btn) { btn.disabled = true; btn.classList.add('checking'); btn.innerText = 'Проверяем...'; }
            try {
                var res = await fetch(API_BASE + '/api/check_subscription/' + userId, { method: 'POST', headers: authHeaders() });
                var data = await res.json();
                if (!data.ok) {
                    tg.showAlert(data.error || 'Ошибка проверки');
                    if (btn) { btn.disabled = false; btn.classList.remove('checking'); btn.innerText = 'Выполнить'; }
                    return;
                }
                if (!data.subscribed) {
                    openUrl(LINKS.channel);
                    tg.showAlert('Подпишитесь на канал и нажмите «Выполнить» ещё раз.');
                    if (btn) { btn.disabled = false; btn.classList.remove('checking'); btn.innerText = 'Выполнить'; }
                    return;
                }
                // Подписан
                if (data.rewarded) {
                    if (tg.HapticFeedback && tg.HapticFeedback.notificationOccurred) tg.HapticFeedback.notificationOccurred('success');
                    var rw = data.reward || { krw: 1000, dia: 5 };
                    showToast('Награда получена ✓', '+' + rw.krw + ' ₩ и +' + rw.dia + ' 💎 за подписку.');
                    fetchProfile();
                } else {
                    showToast('Уже выполнено ✓', 'Подписка засчитана ранее.');
                }
                if (tasksData) tasksData.subscribe_done = true;
                if (btn) {
                    var chk = document.createElement('div');
                    chk.className = 'partner-done-check';
                    chk.innerHTML = '✓';
                    btn.replaceWith(chk);
                }
            } catch (e) {
                tg.showAlert('Ошибка соединения');
                if (btn) { btn.disabled = false; btn.classList.remove('checking'); btn.innerText = 'Выполнить'; }
            }
        }

        // ---------- Утилиты ----------
        function openUrl(url) {
            if (!url) return;
            if (url.indexOf('t.me') !== -1 || url.indexOf('telegram.') !== -1) {
                tg.openTelegramLink(url);
            } else {
                tg.openLink(url);
            }
        }

        // Секунды -> "Xд Yч" / "Yч Zм" / "меньше минуты"
        function fmtLeft(seconds) {
            seconds = Math.max(0, Math.floor(seconds || 0));
            var d = Math.floor(seconds / 86400);
            var h = Math.floor((seconds % 86400) / 3600);
            var m = Math.floor((seconds % 3600) / 60);
            if (d > 0) return d + 'д ' + h + 'ч';
            if (h > 0) return h + 'ч ' + m + 'м';
            if (m > 0) return m + 'м';
            return 'меньше минуты';
        }

        // Тост сверху
        var _toastTimer = null;
        function showToast(title, text) {
            var t = document.getElementById('toast');
            document.getElementById('toastTitle').innerText = title || 'Готово!';
            document.getElementById('toastText').innerText = text || '';
            t.classList.add('show');
            if (_toastTimer) clearTimeout(_toastTimer);
            _toastTimer = setTimeout(function() { t.classList.remove('show'); }, 4200);
        }

// Кнопка «Назад» Telegram: показываем, когда открыт экран/лист
// Открытие профиля
function openProfileModal() {
            if (tg.HapticFeedback && tg.HapticFeedback.impactOccurred) tg.HapticFeedback.impactOccurred('light');
            document.getElementById('fullProfileScreen').classList.add('open');

            // Копируем базовые данные с главной страницы
            document.getElementById('psAvatar').src = document.getElementById('userAvatar').src;
            document.getElementById('psAvatar').style.borderColor = document.getElementById('userAvatar').style.borderColor;
            document.getElementById('psAvatar').style.boxShadow = document.getElementById('userAvatar').style.boxShadow;

            document.getElementById('psName').innerHTML = userName + ' <span style="font-size: 20px;">' + document.getElementById('userStatusEmoji').innerText + '</span>';

            // ФИКС: Убрали несуществующий psHeaderName, из-за которого ломался BackButton
            manageBack();
        }

function closeProfileModal() {
    document.getElementById('fullProfileScreen').classList.remove('open');
    manageBack();
}
// ================= ТИТУЛЫ (ЛОГИКА И 3D ОКНО) =================

        function openTitleSystem() {
            if (tg.HapticFeedback && tg.HapticFeedback.impactOccurred) tg.HapticFeedback.impactOccurred('light');
            renderTitles();
            document.getElementById('titleSystemSheet').classList.add('open'); manageBack();
        }

        function closeTitleSystem() {
            document.getElementById('titleSystemSheet').classList.remove('open'); manageBack();
        }

        // Закрытие по клику на темный фон
        document.getElementById('titleSystemSheet').addEventListener('click', function(e) {
            if (e.target === this) closeTitleSystem();
        });

        function renderTitles() {
            var container = document.getElementById('titleListContainer');
            container.innerHTML = '';

            // Кнопка снятия титула
            var noneHtml = '<div class="title-item ' + (!userActiveTitle ? 'active-title' : '') + '" onclick="selectTitle(\'none\')">' +
                '<div class="title-name" style="color:var(--text-muted)">Без титула</div>' +
                '<div class="title-status">' + (!userActiveTitle ? 'ВЫБРАН ✓' : '') + '</div></div>';
            container.innerHTML += noneHtml;

            // Выводим все титулы из базы
            allTitles.forEach(function(t) {
                var isUnlocked = userUnlockedTitles.includes(t.id);
                var isActive = (userActiveTitle === t.id);

                var statusText = isActive ? 'ВЫБРАН ✓' : (isUnlocked ? 'НАДЕТЬ' : 'ЗАКРЫТО 🔒');
                var classNames = 'title-item';
                if (isActive) classNames += ' active-title';
                if (!isUnlocked) classNames += ' locked';

                var html = '<div class="' + classNames + '" onclick="' + (isUnlocked ? 'selectTitle(\'' + t.id + '\')' : 'tg.showAlert(\'Этот титул еще не разблокирован!\')') + '">' +
                    '<div class="title-name">' + t.name + '</div>' +
                    '<div class="title-status">' + statusText + '</div></div>';

                container.innerHTML += html;
            });
        }

        async function selectTitle(titleId) {
            if (tg.HapticFeedback && tg.HapticFeedback.impactOccurred) tg.HapticFeedback.impactOccurred('medium');

            // Если игрок кликнул на уже выбранный титул
            if (titleId === userActiveTitle || (titleId === 'none' && !userActiveTitle)) return;

            try {
                var res = await fetch(API_BASE + '/api/profile/title/' + userId, {
                    method: 'POST',
                    headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
                    body: JSON.stringify({ title_id: titleId })
                });
                var data = await res.json();

                if (data.success) {
                    showToast('Система', 'Титул успешно изменен!');
                    userActiveTitle = (titleId === 'none') ? null : titleId;

                    // Моментально обновляем интерфейс профиля
                    var titleText = "ТИТУЛ: НЕ ВЫБРАН";
                    if (userActiveTitle) {
                        var foundTitle = allTitles.find(t => t.id === userActiveTitle);
                        if (foundTitle) titleText = "ТИТУЛ: " + foundTitle.name.toUpperCase();
                    }
                    document.getElementById('psTitle').innerText = titleText;

                    // Перерисовываем список, чтобы галочка "Выбран" перепрыгнула
                    renderTitles();

                    setTimeout(closeTitleSystem, 300); // Красиво закрываем окно с задержкой
                } else {
                    tg.showAlert("Ошибка: " + data.error);
                }
            } catch (e) {
                tg.showAlert("Ошибка соединения с сервером");
            }
        }
// ================= ЛЮБИМЫЕ КАРТЫ =================
        var currentFavSlot = 0;
        var activeFavRarity = 'all';
        var favDragInitialized = false;

        function renderFavSlots() {
            var grid = document.getElementById('myFavGrid');
            if (!grid) return;
            grid.innerHTML = '';
            for (let i = 0; i < 3; i++) {
                var cardId = userFavCards[i] || userFavCards[String(i)];
                var slotHtml = '+';
                if (cardId && cardId !== 'none') {
                    var card = allCards.find(c => c.id === cardId);
                    if (card) {
                        // ИСПРАВЛЕНО: Чистый путь images/
                        slotHtml = '<img src="images/' + card.file + '" onerror="this.onerror=null; this.src=\'' + mcCardArt(card.file) + '\'" style="width:100%; height:100%; object-fit:cover; border-radius:14px;">';
                    }
                }
                grid.innerHTML += '<div class="ps-fav-slot" onclick="openFavSystem(' + i + ')">' + slotHtml + '</div>';
            }
        }

        async function openModalById(cardId) {
            var card = allCards.find(c => c.id === cardId);
            if (card) openModal(card);
        }

        const FAV_RARITIES = [
            { id: 'all', icon: 'Все карты' },
            { id: 'Обычная ⚪️', icon: '⚪️ Обычные' },
            { id: 'Редкая 🟡', icon: '🟡 Редкие' },
            { id: 'Эпическая 🟢', icon: '🟢 Эпические' },
            { id: 'Легендарная 🔵', icon: '🔵 Легенд.' },
            { id: 'Мифическая 🔴', icon: '🔴 Мифич.' },
            { id: 'Божественная ⚫️', icon: '⚫️ Божест.' }
        ];

        const RARITY_WEIGHTS = {
            "Обычная ⚪️": 1, "Редкая 🟡": 2, "Эпическая 🟢": 3,
            "Легендарная 🔵": 4, "Мифическая 🔴": 5, "Божественная ⚫️": 6
        };

        function openFavSystem(slotIndex) {
            if (tg.HapticFeedback && tg.HapticFeedback.impactOccurred) tg.HapticFeedback.impactOccurred('light');
            currentFavSlot = slotIndex;
            activeFavRarity = 'all';

            var searchInp = document.getElementById('favSearchInput');
            var sortSel = document.getElementById('favSortSelect');
            if (searchInp) searchInp.value = '';
            if (sortSel) sortSel.value = 'rarity_desc';

            document.getElementById('favSystemSheet').classList.add('open');
            manageBack();
            renderFavSelector();

            if (!favDragInitialized) {
                initDragScroll(document.getElementById('favListContainer'), 'y');
                initDragScroll(document.getElementById('favRarityFilters'), 'x');
                favDragInitialized = true;
            }
        }

        function closeFavSystem() {
            document.getElementById('favSystemSheet').classList.remove('open');
            manageBack();
        }

        function initDragScroll(slider, direction) {
            if (!slider) return;
            let isDown = false;
            let startPos;
            let scrollPos;

            slider.addEventListener('mousedown', function(e) {
                isDown = true;
                slider.style.cursor = 'grabbing';
                startPos = direction === 'y' ? e.pageY - slider.offsetTop : e.pageX - slider.offsetLeft;
                scrollPos = direction === 'y' ? slider.scrollTop : slider.scrollLeft;
            });
            slider.addEventListener('mouseleave', function() { isDown = false; slider.style.cursor = 'grab'; });
            slider.addEventListener('mouseup', function() { isDown = false; slider.style.cursor = 'grab'; });
            slider.addEventListener('mousemove', function(e) {
                if (!isDown) return;
                e.preventDefault();
                const pos = direction === 'y' ? e.pageY - slider.offsetTop : e.pageX - slider.offsetLeft;
                const walk = (pos - startPos) * 2;
                if (direction === 'y') slider.scrollTop = scrollPos - walk;
                else slider.scrollLeft = scrollPos - walk;
            });
        }

        function renderFavRarityCircles() {
            var container = document.getElementById('favRarityFilters');
            if (!container) return;
            container.innerHTML = '';

            FAV_RARITIES.forEach(function(r) {
                var btn = document.createElement('div');
                btn.className = 'rarity-filter-btn' + (activeFavRarity === r.id ? ' active' : '');
                btn.innerHTML = r.icon;
                btn.onclick = function() {
                    if (tg.HapticFeedback && tg.HapticFeedback.selectionChanged) tg.HapticFeedback.selectionChanged();
                    activeFavRarity = r.id;
                    renderFavSelector();
                };
                container.appendChild(btn);
            });
        }

        function renderFavSelector() {
            renderFavRarityCircles();

            var grid = document.getElementById('favListContainer');
            if (!grid) return;
            grid.innerHTML = '';

            var searchInp = document.getElementById('favSearchInput');
            var sortSel = document.getElementById('favSortSelect');

            var searchStr = searchInp ? searchInp.value.toLowerCase() : '';
            var sortType = sortSel ? sortSel.value : 'rarity_desc';

            var uniqueOwnedCardIds = [...new Set(userOwnedCards)];

            var mappedCards = uniqueOwnedCardIds.map(function(cid, idx) {
                var cData = allCards.find(c => c.id === cid);
                return { card: cData, originalIndex: idx };
            }).filter(item => item.card != null);

            var totalInThisRarity = mappedCards.filter(function(item) {
                return (activeFavRarity === 'all') || (item.card.rarity === activeFavRarity);
            }).length;

            var filtered = mappedCards.filter(function(item) {
                var matchSearch = item.card.name.toLowerCase().includes(searchStr);
                var matchRarity = (activeFavRarity === 'all') || (item.card.rarity === activeFavRarity);
                return matchSearch && matchRarity;
            });

            filtered.sort(function(a, b) {
                if (sortType === 'newest') return b.originalIndex - a.originalIndex;
                if (sortType === 'oldest') return a.originalIndex - b.originalIndex;

                var weightA = RARITY_WEIGHTS[a.card.rarity] || 0;
                var weightB = RARITY_WEIGHTS[b.card.rarity] || 0;

                if (sortType === 'rarity_desc') {
                    if (weightA !== weightB) return weightB - weightA;
                    return b.originalIndex - a.originalIndex;
                }
                if (sortType === 'rarity_asc') {
                    if (weightA !== weightB) return weightA - weightB;
                    return b.originalIndex - a.originalIndex;
                }
                return 0;
            });

            var countEl = document.getElementById('favCardCount');
            if (countEl) {
                countEl.innerHTML = 'Показано карт: <b style="color:#c4b5fd;">' + filtered.length + '</b> | В этой редкости: <b style="color:#4ade80;">' + totalInThisRarity + '</b>';
            }

            if (filtered.length === 0) {
                grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 40px 10px; font-size: 13px;">Ничего не найдено 😔</div>';
                return;
            }

            filtered.forEach(function(item) {
                var c = item.card;
                var div = document.createElement('div');
                div.className = 'card';
                div.style.userSelect = 'none';

                let isDragging = false;
                div.addEventListener('mousedown', function() { isDragging = false; });
                div.addEventListener('mousemove', function() { isDragging = true; });
                div.addEventListener('mouseup', function() {
                    if (!isDragging) selectFavCard(c.id);
                });

                var html = '';
                html += '<div class="img-wrap">';
                html += '<div class="spinner-ring"></div>';
                html += '<img src="images/' + c.file + '" alt="' + c.name + '" loading="lazy" onload="window.cardImageLoaded(this)" onerror="window.cardImageLoaded(this)" style="pointer-events: none;">';
                html += '</div>';
                html += '<div class="card-name" style="font-size: 13px; font-weight: 700; text-align: left; margin-top: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #fff; padding: 0 2px;">' + c.name + '</div>';
                html += '<div class="card-rarity" style="font-size: 11px; text-align: left; color: var(--text-muted); margin-top: 2px; padding: 0 2px;">' + c.rarity + '</div>';

                div.innerHTML = html;
                grid.appendChild(div);
            });
        }

        // ================= КРАСИВОЕ УВЕДОМЛЕНИЕ (Toast) =================
        function showFavToast(msg, isError = false) {
            var toast = document.getElementById('favActionToast');
            if (!toast) {
                toast = document.createElement('div');
                toast.id = 'favActionToast';
                document.body.appendChild(toast);
            }

            var bgColor = isError ? 'rgba(239, 68, 68, 0.95)' : 'rgba(74, 222, 128, 0.95)';
            var icon = isError ? '❌' : '✨';

            toast.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: ' + bgColor + '; color: #fff; padding: 12px 24px; border-radius: 16px; font-weight: 600; font-size: 14px; z-index: 10000; box-shadow: 0 4px 20px rgba(0,0,0,0.5); opacity: 0; transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55); pointer-events: none; display: flex; align-items: center; gap: 8px;';
            toast.innerHTML = '<span>' + icon + '</span> <span>' + msg + '</span>';

            void toast.offsetWidth; // Сброс кэша анимации

            toast.style.opacity = '1';
            toast.style.top = '40px';

            if (tg.HapticFeedback && tg.HapticFeedback.notificationOccurred) {
                tg.HapticFeedback.notificationOccurred(isError ? 'error' : 'success');
            }

            setTimeout(function() {
                toast.style.opacity = '0';
                toast.style.top = '20px';
            }, 3000);
        }

        async function selectFavCard(cardId) {
            if (tg.HapticFeedback && tg.HapticFeedback.impactOccurred) tg.HapticFeedback.impactOccurred('medium');

            if (cardId === 'none') {
                userFavCards[currentFavSlot] = 'none';
            } else {
                for (let i = 0; i < 3; i++) {
                    if (userFavCards[i] === cardId) {
                        userFavCards[i] = 'none';
                    }
                }
                userFavCards[currentFavSlot] = cardId;
            }

            renderFavSlots();
            closeFavSystem();

            try {
                // ИСПРАВЛЕНО: Указан правильный URL (с userId) и заголовок JSON
                var res = await fetch(API_BASE + '/api/set_favorite/' + userId, {
                    method: 'POST',
                    headers: Object.assign({'Content-Type': 'application/json'}, authHeaders()),
                    body: JSON.stringify({ slot_index: currentFavSlot, card_id: cardId })
                });
                var data = await res.json();

                if (data.success) {
                    showFavToast(cardId === 'none' ? 'Карта убрана со слота' : 'Карта успешно применена!');
                } else {
                    showFavToast(data.error || "Неизвестная ошибка сервера", true);
                }
            } catch (e) {
                console.error("Ошибка сети:", e);
                showFavToast("Ошибка сети при сохранении!", true);
            }
        }
// ================= ФОНЫ =================
        var currentBgPage = 1;

        function applyProfileBg() {
            var mediaContainer = document.getElementById('profileBgMedia');
            if (!mediaContainer || !allBgs.length) return;

            var bgData = allBgs.find(b => b.id === userActiveBg) || allBgs.find(b => b.id === 'default');
            if (!bgData) return;

            var ext = (bgData.file || '').split('.').pop().toLowerCase();
            if (ext === 'mp4' || ext === 'webm') {
                mediaContainer.innerHTML = '<video src="images/backgrounds/' + bgData.file + '" autoplay loop muted playsinline></video>';
            } else {
                mediaContainer.innerHTML = '<img src="images/backgrounds/' + bgData.file + '">';
            }
        }

        function openBgSystem() {
            if (tg.HapticFeedback && tg.HapticFeedback.impactOccurred) tg.HapticFeedback.impactOccurred('light');

            // Автоматически открываем слайдер на том фоне, который сейчас НАДЕТ на игроке
            var activeIdx = allBgs.findIndex(b => b.id === userActiveBg);
            currentBgPage = activeIdx !== -1 ? activeIdx + 1 : 1;

            renderBgs();
            document.getElementById('bgSystemSheet').classList.add('open'); manageBack();
        }

        function closeBgSystem() {
            document.getElementById('bgSystemSheet').classList.remove('open'); manageBack();
        }

        document.getElementById('bgSystemSheet').addEventListener('click', function(e) {
            if (e.target === this) closeBgSystem();
        });

        // Функция переключения слайдов
        function changeBgPage(direction) {
            if (tg.HapticFeedback && tg.HapticFeedback.selectionChanged) tg.HapticFeedback.selectionChanged();
            currentBgPage += direction;
            renderBgs();
        }

        function renderBgs() {
            var container = document.getElementById('bgListContainer');
            if (!container || !allBgs.length) return;
            container.innerHTML = '';

            var totalBgs = allBgs.length;

            // Защита от вылета за границы массива
            if (currentBgPage > totalBgs) currentBgPage = totalBgs;
            if (currentBgPage < 1) currentBgPage = 1;

            // Настраиваем доступность стрелочек и текст страниц
            document.getElementById('bgPrevBtn').disabled = (currentBgPage === 1);
            document.getElementById('bgNextBtn').disabled = (currentBgPage === totalBgs);
            document.getElementById('bgPageIndicator').innerText = currentBgPage + ' / ' + totalBgs;

            // Берем ровно ОДИН фон для текущего слайда
            var bg = allBgs[currentBgPage - 1];

            var isUnlocked = userUnlockedBgs.includes(bg.id) || bg.id === 'default';
            var isActive = (userActiveBg === bg.id);

            var statusText = isActive ? '<span style="color:#4ade80">ВЫБРАН ✓</span>' : (isUnlocked ? 'НАДЕТЬ' : 'ЗАКРЫТО 🔒');
            var classNames = 'bg-item';
            if (isActive) classNames += ' active-bg';
            if (!isUnlocked) classNames += ' locked';

            var ext = (bg.file || '').split('.').pop().toLowerCase();
            var mediaHtml = '';
            if (ext === 'mp4' || ext === 'webm') {
                mediaHtml = '<video src="images/backgrounds/' + bg.file + '" autoplay loop muted playsinline></video>';
            } else {
                mediaHtml = '<img src="images/backgrounds/' + bg.file + '">';
            }

            var html = '<div class="' + classNames + '" onclick="' + (isUnlocked ? 'setBg(\'' + bg.id + '\')' : 'tg.showAlert(\'Этот фон еще не разблокирован в боте!\')') + '">' +
                mediaHtml +
                '<div class="bg-item-overlay">' +
                    '<div class="bg-name">' + bg.name + '</div>' +
                '</div>' +
                '<div class="bg-status">' + statusText + '</div>' +
            '</div>';

            container.innerHTML = html;
        }

        async function setBg(bgId) {
            if (tg.HapticFeedback && tg.HapticFeedback.impactOccurred) tg.HapticFeedback.impactOccurred('medium');
            if (bgId === userActiveBg) return;

            try {
                var res = await fetch(API_BASE + '/api/profile/bg/' + userId, {
                    method: 'POST',
                    headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
                    body: JSON.stringify({ bg_id: bgId })
                });
                var data = await res.json();

                if (data.success) {
                    showToast('Система', 'Фон профиля обновлен!');
                    userActiveBg = bgId;
                    applyProfileBg(); // Меняем шапку профиля на лету
                    renderBgs(); // Перерисовываем плашку "ВЫБРАН ✓" в слайдере
                    setTimeout(closeBgSystem, 300);
                } else {
                    tg.showAlert("Ошибка: " + data.error);
                }
            } catch (e) {
                tg.showAlert("Ошибка соединения с сервером");
            }
        }
// ================= ТОПЫ (ЛОГИКА) =================
        var currentTopCategory = 'pvp';
        var topsTimerInterval = null;
        var topsSecondsLeft = 0;



// Генератор цветов для аватарок (чтобы было красиво и без картинок из интернета)
        function getAvatarStyle(name) {
            var colors = [
                'linear-gradient(135deg, #8b5cf6, #581c87)', // Фиолетовый
                'linear-gradient(135deg, #3b82f6, #1e3a8a)', // Синий
                'linear-gradient(135deg, #f59e0b, #78350f)', // Оранжевый
                'linear-gradient(135deg, #10b981, #064e3b)', // Изумрудный
                'linear-gradient(135deg, #ec4899, #831843)'  // Розовый
            ];
            var charCode = name.charCodeAt(0) || 0;
            return colors[charCode % colors.length];
        }


        // ================= ТАЙМЕР PVP СЕЗОНА =================
        async function loadTopsTimer() {
            try {
                var res = await fetch(API_BASE + '/api/tops/time_left');
                var data = await res.json();
                if (data.success) {
                    topsSecondsLeft = data.seconds_left;
                    startTopsTimer();
                }
            } catch (e) { console.error('Ошибка загрузки таймера', e); }
        }

        function startTopsTimer() {
            if (topsTimerInterval) clearInterval(topsTimerInterval);
            updateTopsTimerDisplay();

            topsTimerInterval = setInterval(function() {
                if (topsSecondsLeft > 0) {
                    topsSecondsLeft--;
                    updateTopsTimerDisplay();
                } else {
                    clearInterval(topsTimerInterval);
                    document.getElementById('topsTimeValue').innerText = 'Сезон завершён!';
                }
            }, 1000);
        }

// ================= ЧУЖОЙ ПРОФИЛЬ (БЕЗ БАГОВ И ВЫЛЕТОВ) =================
function closePublicProfile() {
    document.getElementById('publicProfileScreen').classList.remove('open');
    manageBack();
}

async function openPublicProfile(targetId) {
    if (tg.HapticFeedback && tg.HapticFeedback.impactOccurred) tg.HapticFeedback.impactOccurred('light');

    // 🔥 ФИКС: Убираем оба мешающих слоя (и список владельцев, и саму карточку), чтобы профиль открылся идеально!
    var ownersScr = document.getElementById('ownersScreen');
    if (ownersScr) ownersScr.classList.remove('open');

    var cModal = document.getElementById('cardModal');
    if (cModal) cModal.classList.remove('open');

    document.getElementById('publicProfileScreen').classList.add('open');
    manageBack();
    resetPublicAchBox();

    try {
        var res = await fetch(API_BASE + '/api/public_profile/' + targetId);
        var data = await res.json();

        if (data.success) {
            var p = data.profile;
            var dispName = p.nickname || p.username || 'Игрок ' + p.id;

            document.getElementById('pubName').innerHTML = mcEsc(dispName) + ' <span style="font-size: 20px;" id="pubStatusEmoji">' + (p.is_premium ? '👑' : '🧩') + '</span>';

            document.getElementById('pubAvatar').src = API_BASE + '/api/avatar/' + p.id + "?name=" + encodeURIComponent(dispName);

            if (p.is_premium) {
                document.getElementById('pubAvatar').style.borderColor = "var(--premium-gold)";
                document.getElementById('pubAvatar').style.boxShadow = "0 0 15px rgba(245, 158, 11, 0.4)";
            } else {
                document.getElementById('pubAvatar').style.borderColor = "var(--accent)";
                document.getElementById('pubAvatar').style.boxShadow = "0 0 18px rgba(139,92,246,0.55)";
            }

            // === ОТОБРАЖЕНИЕ РАМКИ ЧУЖОГО ИГРОКА ===
            var pubFrameEl = document.getElementById('pubAvatarFrame');
            if (pubFrameEl) {
                if (p.frame_url) {
                    pubFrameEl.src = p.frame_url;
                    pubFrameEl.style.display = 'block';
                } else {
                    pubFrameEl.src = '';
                    pubFrameEl.style.display = 'none';
                }
            }

            var titleText = "ТИТУЛ: НЕ ВЫБРАН";
            if (p.active_title) {
                var foundTitle = allTitles.find(t => t.id === p.active_title);
                if (foundTitle) titleText = "ТИТУЛ: " + foundTitle.name.toUpperCase();
            }
            document.getElementById('pubTitle').innerText = titleText;
            // --- ОТОБРАЖЕНИЕ ЮЗЕРНЕЙМА (ЕСЛИ ОН НЕ СКРЫТ) ---
            var pubUserEl = document.getElementById('pubUsername');
            if (p.username) {
                pubUserEl.style.display = 'inline-block';
                pubUserEl.innerText = '@' + p.username;
                pubUserEl.onclick = function(e) {
                    e.preventDefault();
                    tg.openTelegramLink('https://t.me/' + p.username);
                };
            } else {
                pubUserEl.style.display = 'none';
            }

            document.getElementById('pubWins').innerText = p.wins;
            document.getElementById('pubLosses').innerText = p.losses;
            document.getElementById('pubWinrate').innerText = p.winrate + '%';
            document.getElementById('pubMaxStreak').innerText = p.max_streak;

            var mediaContainer = document.getElementById('pubBgMedia');
            var bgData = allBgs.find(b => b.id === p.active_bg) || allBgs.find(b => b.id === 'default');
            if (bgData) {
                var ext = (bgData.file || '').split('.').pop().toLowerCase();
                if (ext === 'mp4' || ext === 'webm') {
                    mediaContainer.innerHTML = '<video src="images/backgrounds/' + bgData.file + '" autoplay loop muted playsinline></video>';
                } else {
                    mediaContainer.innerHTML = '<img src="images/backgrounds/' + bgData.file + '">';
                }
            }

            var favGrid = document.getElementById('pubFavGrid');
            favGrid.innerHTML = '';
            var pubFavs = p.fav_cards || {};

            for (let i = 0; i < 3; i++) {
                var cardId = pubFavs[i] || pubFavs[String(i)];
                if (cardId && cardId !== 'none') {
                    var card = allCards.find(c => c.id === cardId);
                    if (card) {
                        favGrid.innerHTML += '<div class="ps-fav-slot" onclick="openModalById(\'' + card.id + '\')" style="border:none; padding:0; cursor:pointer;"><img src="images/' + card.file + '" onerror="this.onerror=null; this.src=\'' + mcCardArt(card.file) + '\'" style="width:100%; height:100%; object-fit:cover; border-radius:14px;"></div>';
                        continue;
                    }
                }
                favGrid.innerHTML += '<div class="ps-fav-slot" style="cursor:default; opacity:0.15;">+</div>';
            }

            loadPublicAchievements(p.id, dispName);

        } else {
            tg.showAlert("Ошибка: " + data.error);
            closePublicProfile();
        }
    } catch (e) {
        tg.showAlert("Ошибка соединения с сервером");
        closePublicProfile();
    }
}
// ================= ЛОГИКА MANHWCARD PASS =================
        var realPassLevel = 1;
        var claimedPassLevels = 1;
        var passXp = 0;
        var passMaxXp = 3000;
        var userPassQuests = {};

        function openPassModal() {
            if (tg.HapticFeedback && tg.HapticFeedback.impactOccurred) tg.HapticFeedback.impactOccurred('light');
            document.getElementById('passScreen').classList.add('open');
            manageBack();

            renderPassScreen();
            renderPassQuests();
            updatePassResetTimer();
        }

        function closePassModal() {
            document.getElementById('passScreen').classList.remove('open');
            manageBack();
        }

        function updateMainMenuPass() {
            var pct = Math.floor((passXp / passMaxXp) * 100) || 0;
            if (pct > 100) pct = 100;
            if (pct < 0) pct = 0;

            var lvlEl = document.getElementById('mainMenuPassLvl');
            var progEl = document.getElementById('mainMenuPassProg');
            var fillEl = document.getElementById('mainMenuPassFill');

            if (lvlEl) lvlEl.innerHTML = 'Уровень <b>' + realPassLevel + '</b>';

            var unclaimed = realPassLevel - claimedPassLevels;
            if (unclaimed > 0) {
                if (progEl) progEl.innerHTML = '<span style="color:#4ade80">🎁 Награда ждёт!</span> ›';
                // Линия заполняется целиком и золотеет — награду видно, не читая текст
                if (fillEl) fillEl.classList.add('ready');
            } else {
                if (progEl) progEl.innerHTML = 'Прогресс <b>' + pct + '%</b> ›';
                if (fillEl) {
                    fillEl.classList.remove('ready');
                    fillEl.style.width = pct + '%';
                }
            }
        }

        function getRewardRanges(level) {
            if (level > 30) return { krw: '200 – 300', dia: '2 – 8', bc: '75 – 175' };
            const r = {
                2: { krw: '30 – 35', dia: '2 – 3', bc: '10 – 25' },
                3: { krw: '30 – 35', dia: '2 – 3', bc: '20 – 25' },
                4: { krw: '35', dia: '2 – 3', bc: '25' },
                5: { krw: '35 – 50', dia: '2 – 3', bc: '25 – 30' },
                6: { krw: '35 – 50', dia: '2 – 3', bc: '25 – 30' },
                7: { krw: '50', dia: '2 – 3', bc: '35' },
                8: { krw: '50 – 65', dia: '2 – 3', bc: '25 – 30' },
                9: { krw: '50 – 65', dia: '2 – 3', bc: '25 – 30' },
                10: { krw: '65', dia: '2 – 3', bc: '50' },
                11: { krw: '65 – 70', dia: '2 – 3', bc: '30' },
                12: { krw: '65 – 75', dia: '2 – 3', bc: '25 – 35' },
                13: { krw: '65 – 75', dia: '2 – 3', bc: '25 – 35' },
                14: { krw: '75', dia: '2 – 3', bc: '50' },
                15: { krw: '75 – 80', dia: '2 – 3', bc: '25 – 35' },
                16: { krw: '80', dia: '2 – 3', bc: '35' },
                17: { krw: '80 – 85', dia: '2 – 3', bc: '30 – 35' },
                18: { krw: '85', dia: '2 – 3', bc: '40' },
                19: { krw: '85 – 90', dia: '2 – 3', bc: '30 – 35' },
                20: { krw: '90', dia: '2 – 3', bc: '50' },
                21: { krw: '90 – 95', dia: '2 – 3', bc: '35 – 40' },
                22: { krw: '95', dia: '2 – 3', bc: '40' },
                23: { krw: '95 – 100', dia: '2 – 3', bc: '35 – 40' },
                24: { krw: '100', dia: '2 – 3', bc: '45' },
                25: { krw: '100 – 110', dia: '2 – 3', bc: '35 – 45' },
                26: { krw: '110', dia: '2 – 3', bc: '45' },
                27: { krw: '110 – 120', dia: '2 – 3', bc: '40 – 45' },
                28: { krw: '120 – 130', dia: '2 – 3', bc: '45' },
                29: { krw: '130 – 140', dia: '2 – 3', bc: '45 – 50' },
                30: { krw: '150', dia: '2 – 3', bc: '50' }
            };
            return r[level] || { krw: '200 – 300', dia: '2 – 8', bc: '75 – 175' };
        }

        function renderPassScreen() {
            var unclaimed = realPassLevel - claimedPassLevels;
            var percent = Math.floor((passXp / passMaxXp) * 100) || 0;
            if (percent > 100) percent = 100;
            if (percent < 0) percent = 0;

            var xpLeft = Math.max(0, passMaxXp - passXp) || 0;

            var hexLvl = document.getElementById('passHexLvl');
            var xpText = document.getElementById('passXpText');
            var progressBar = document.getElementById('passProgressBar');
            var leftTextTop = document.getElementById('passLeftTextTop');

            // Динамическое обновление наград
            var targetLvl = claimedPassLevels + 1;
            if (targetLvl > realPassLevel + 1) targetLvl = realPassLevel + 1;

            var rewRanges = getRewardRanges(targetLvl);
            var rKrw = document.getElementById('passRewKrw');
            var rDia = document.getElementById('passRewDia');
            var rBc = document.getElementById('passRewBc');
            var rTitle = document.getElementById('passRewTitleLevel');

            if (rKrw) rKrw.innerText = rewRanges.krw;
            if (rDia) rDia.innerText = rewRanges.dia;
            if (rBc) rBc.innerText = rewRanges.bc;
            if (rTitle) rTitle.innerHTML = 'НАГРАДА ЗА ' + targetLvl + ' УРОВЕНЬ<div class="pass-sec-sub">Получай случайную награду при аппе уровня</div>';

            if (hexLvl) hexLvl.innerText = realPassLevel;
            if (xpText) xpText.innerHTML = passXp + ' <span>/ ' + passMaxXp + ' XP</span>';
            if (progressBar) progressBar.style.width = percent + '%';
            if (leftTextTop) leftTextTop.innerText = xpLeft + ' XP';

            var btn = document.getElementById('passMainBtn');
            if (btn) {
                if (unclaimed > 0) {
                    btn.className = "pass-btn ready";
                    btn.innerHTML = "Забрать награду (" + unclaimed + " шт)";
                    btn.onclick = claimPassLevel;
                } else {
                    btn.className = "pass-btn waiting";
                    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Следующая награда через <span id="passLeftTextBtn">' + xpLeft + ' XP</span>';
                    btn.onclick = null;
                }
            }

            updateMainMenuPass();
        }

        function renderPassQuests() {
            var container = document.getElementById('passQuestsContainer');
            if (!container) return;
            container.innerHTML = '';

            var keys = Object.keys(userPassQuests);
            if (keys.length === 0) {
                container.innerHTML = '<div style="text-align:center;color:var(--text-muted);font-size:12px;padding:10px;">Задания появятся после загрузки профиля...</div>';
                return;
            }

            keys.forEach(function(k) {
                var q = userPassQuests[k];
                var pct = Math.min(100, (q.progress / q.target) * 100);
                var isDone = q.done || q.progress >= q.target;

                var barHtml = '';
                if (isDone) {
                    barHtml = '<div class="pass-task-bar-bg"><div class="pass-task-bar-fill" style="width:100%; background:#4ade80; box-shadow:0 0 10px rgba(74,222,128,0.5);"></div></div>' +
                              '<div class="pass-task-count" style="color:#4ade80; font-size:12px; font-weight:600;">✓ Выполнено</div>';
                } else {
                    barHtml = '<div class="pass-task-bar-bg"><div class="pass-task-bar-fill" style="width:' + pct + '%;"></div></div>' +
                              '<div class="pass-task-count">' + q.progress + ' / ' + q.target + '</div>';
                }

                var html = '<div class="pass-task">' +
                    '<div class="pass-task-top">' +
                        '<div class="pass-task-name" ' + (isDone ? 'style="color:#4ade80; font-weight:600;"' : '') + '>' + q.name + '</div>' +
                        '<div class="pass-task-xp">' + (isDone ? '' : '+' + q.xp + ' XP') + '</div>' +
                    '</div>' +
                    '<div class="pass-task-bar-wrap">' + barHtml + '</div>' +
                '</div>';

                container.innerHTML += html;
            });
        }

        function updatePassResetTimer() {
            var now = new Date();
            var mskOffset = 3 * 60 * 60 * 1000;
            var utc = now.getTime() + (now.getTimezoneOffset() * 60000);
            var mskNow = new Date(utc + mskOffset);

            var day = mskNow.getDay();
            var daysUntilMonday = (1 - day + 7) % 7;
            if (daysUntilMonday === 0 && (mskNow.getHours() > 0 || mskNow.getMinutes() > 0 || mskNow.getSeconds() > 0)) {
                daysUntilMonday = 7;
            }

            var nextMonday = new Date(mskNow);
            nextMonday.setDate(mskNow.getDate() + daysUntilMonday);
            nextMonday.setHours(0, 0, 0, 0);

            var diffMs = nextMonday.getTime() - mskNow.getTime();

            var d = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            var h = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            var m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

            var text = '';
            if (d > 0) text = d + 'д ' + h + 'ч';
            else text = h + 'ч ' + m + 'м';

            var el = document.getElementById('passQuestTimer');
            if (el) el.innerHTML = '↻ Обновление через<br>' + text;
        }

        async function claimPassLevel() {
            if (tg.HapticFeedback && tg.HapticFeedback.impactOccurred) tg.HapticFeedback.impactOccurred('heavy');
            var btn = document.getElementById('passMainBtn');
            if (!btn) return;
            btn.innerHTML = "Получение...";
            btn.onclick = null;

            try {
                var res = await fetch(API_BASE + '/api/pass_claim_level/' + userId, { method: 'POST', headers: authHeaders() });
                var data = await res.json();

                if (data.success) {
                    showPremiumToast(data.reward);
                    fetchProfile();
                } else {
                    tg.showAlert("Ошибка: " + data.error);
                    renderPassScreen();
                }
            } catch(e) {
                tg.showAlert("Ошибка сети!");
                renderPassScreen();
            }
        }

        function showPremiumToast(rewardText) {
            var toast = document.getElementById('webAppPremiumToast');
            if (!toast) {
                toast = document.createElement('div');
                toast.id = 'webAppPremiumToast';
                toast.className = 'premium-toast';
                document.body.appendChild(toast);
            }

            toast.innerHTML = '<span class="toast-icon">🎉</span> <span>Награда получена: <b style="color:#c4b5fd;">' + rewardText + '</b></span>';
            toast.classList.add('active');

            if (tg.HapticFeedback && tg.HapticFeedback.notificationOccurred) {
                tg.HapticFeedback.notificationOccurred('success');
            }

            setTimeout(function() {
                toast.classList.remove('active');
            }, 3500);
        }

        // Инициализация интервалов
        setInterval(updatePassResetTimer, 60000);
        updateMainMenuPass();
// ================= ЛОГИКА ГАЧИ (МАГАЗИН) =================
        // Максимум круток за раз. ДОЛЖЕН совпадать с MULTI_SUMMON_MAX в main.py
        var SUMMON_MAX = 24;
        var selectedSummonAmount = 8; // По умолчанию ползунок стоит на 8
        var summonedCardsData = [];
        var flippedCardsCount = 0;
        var summonTimers = [];      // таймеры анимации, чтобы их можно было отменить
        var summonInFlight = false; // защита от двойного нажатия

        // Ползунок в HTML мог остаться с max="16" — выставляем границы из JS
        (function initSummonSlider() {
            var slider = document.getElementById('gachaSlider');
            if (slider) { slider.min = 1; slider.max = SUMMON_MAX; }
        })();

        // Подсветка стоимости красным, если попыток не хватает
        function refreshSummonCostState() {
            var balEl = document.getElementById('shopAttemptsBal');
            var costBox = document.querySelector('.gacha-cost-box');
            if (balEl && costBox) {
                var have = parseInt(balEl.innerText.replace(/\D/g, '')) || 0;
                costBox.classList.toggle('not-enough', have < selectedSummonAmount);
            }
        }

        // Сколько колонок в сетке призыва для N карт
        function getSummonCols(n) {
            if (n <= 1) return 1;
            if (n === 2 || n === 4) return 2;                       // 2x1 или 2x2
            if (n === 3 || n === 5 || n === 6 || n === 9) return 3; // 3x1, 3x2, 3x3
            if (n > 16) return 6;                                   // 17–24: 6 колонок × до 4 рядов
            return 4;
        }

        function applySummonGridLayout(grid, n) {
            grid.style.gridTemplateColumns = `repeat(${getSummonCols(n)}, minmax(0, 1fr))`;
            // Класс для компактного вида (на случай старого WebView без CSS :has)
            grid.classList.toggle('summon-grid--24', n > 16);
        }

        function clearSummonTimers() {
            summonTimers.forEach(t => clearTimeout(t));
            summonTimers = [];
        }

        // Единая функция синхронизации ползунка и кнопок
        function syncSummon(val) {
            val = parseInt(val);
            if (isNaN(val) || val < 1) val = 1;
            if (val > SUMMON_MAX) val = SUMMON_MAX;

            selectedSummonAmount = val;

            // 1. Обновляем инпут (ползунок) и центральную цифру
            document.getElementById('gachaSlider').value = val;
            document.getElementById('gachaSliderVal').innerText = val;

            // 2. Обновляем активную кнопку снизу
            document.querySelectorAll('.gacha-quick-btn').forEach(b => {
                b.classList.remove('active');
                if (parseInt(b.dataset.val) === val) b.classList.add('active');
            });

            // 3. Обновляем текст на кнопке "Открыть"
            document.getElementById('btnFullSummon').innerText = 'Открыть ' + val;

            // 4. Считаем правильное склонение слова "попыток"
            var textStr = ' попыток';
            if (val === 1) textStr = ' попытка';
            else if (val > 1 && val < 5) textStr = ' попытки';
            document.getElementById('summonCostText').innerText = val + textStr;

            // 5. Заливка дорожки — только процент, сам градиент живёт в shop.css
            var percentage = ((val - 1) / (SUMMON_MAX - 1)) * 100;
            document.getElementById('gachaSlider').style.setProperty('--fill', percentage + '%');

            // 6. Подсвечиваем стоимость красным, если попыток не хватает
            refreshSummonCostState();

            if (tg.HapticFeedback && tg.HapticFeedback.selectionChanged) tg.HapticFeedback.selectionChanged();
        }

        // Функция для кнопок -1 / +1
        function adjustSummon(delta) {
            syncSummon(selectedSummonAmount + delta);
        }

        // Инициализируем слайдер при загрузке страницы
        syncSummon(8);

        // Функция запроса к серверу (ОСТАВЛЯЕМ КАК БЫЛА ПОКА ЧТО)
        async function executeSummon(isQuick) {
            if (summonInFlight) return; // уже идёт запрос
            summonInFlight = true;

            var btnFull = document.getElementById('btnFullSummon');
            var btnQuick = document.getElementById('btnQuickSummon');
            btnFull.disabled = true; btnQuick.disabled = true;

            try {
                var res = await fetch(API_BASE + '/api/multi_summon/' + userId, {
                    method: 'POST',
                    headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
                    body: JSON.stringify({ amount: selectedSummonAmount })
                });
                var data = await res.json();

                if (data.success && Array.isArray(data.cards) && data.cards.length) {
                    summonedCardsData = data.cards;
                    document.getElementById('shopAttemptsBal').innerText = data.new_attempts;
                    refreshSummonCostState();
                    fetchProfile(); // Фоново обновляем основную коллекцию

                    if (isQuick) showQuickResults();
                    else startEpicSummonSequence();

                    // Сервер вернул часть билетов (сбой посреди открытия)
                    if (data.refunded > 0) {
                        showToast('Часть билетов возвращена', 'Не удалось открыть ' + data.refunded + ' шт. — билеты вернулись на баланс.');
                    }
                } else {
                    // data.detail — так FastAPI отдаёт ошибки авторизации (401/403)
                    tg.showAlert(data.error || data.detail || 'Не удалось открыть карты');
                }
            } catch (e) {
                tg.showAlert("Ошибка соединения с сервером");
            } finally {
                btnFull.disabled = false; btnQuick.disabled = false;
                summonInFlight = false;
            }
        }

        // --- ЭПИЧНАЯ СЦЕНА ---
        function startEpicSummonSequence() {
            var overlay = document.getElementById('summonOverlay');
            var portal = document.getElementById('summonPortal');
            var rays = document.getElementById('summonRays');
            var grid = document.getElementById('summonGrid');
            var claimBtn = document.getElementById('summonClaimBtn');

            // ФИКС: отменяем таймеры прошлой анимации — иначе её карты
            // «доприлетали» в новую сетку
            clearSummonTimers();
            flippedCardsCount = 0;
            grid.innerHTML = '';
            grid.scrollTop = 0;
            claimBtn.classList.remove('show');
            overlay.classList.remove('shake');

            // УМНАЯ СЕТКА: считаем по реальному числу карт, а не по ползунку
            applySummonGridLayout(grid, summonedCardsData.length);

            overlay.classList.add('open');

            summonTimers.push(setTimeout(() => {
                portal.style.opacity = '1';
                rays.style.opacity = '1';
                if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
            }, 300));

            // При 17+ картах летят чуть быстрее, чтобы анимация не затягивалась
            var step = summonedCardsData.length > 16 ? 60 : 80;
            summonedCardsData.forEach((card, index) => {
                var isDivine = (card.rarity || '').includes('Божест');
                var delay = (index * step) + (isDivine ? 200 : 0) + 600;
                summonTimers.push(setTimeout(() => { spawnSummonCard(card, index); }, delay));
            });

            var totalTime = (summonedCardsData.length * step) + 1200;
            summonTimers.push(setTimeout(() => {
                document.querySelectorAll('.summon-card:not(.flipped)').forEach(c => c.classList.add('floating'));
            }, totalTime));
        }



        function getCardBackImage(rarity) {
            rarity = rarity || '';
            if(rarity.includes('Божест')) return 'back_divine.png';
            if(rarity.includes('Мифич')) return 'back_mythic.png';
            if(rarity.includes('Легенд')) return 'back_legendary.png';
            if(rarity.includes('Эпич')) return 'back_epic.png';
            if(rarity.includes('Редк')) return 'back_rare.png';
            return 'back_common.png';
        }

        function getRarityGlowColor(rarity) {
            rarity = rarity || '';
            if(rarity.includes('Божест')) return 'radial-gradient(circle, rgba(139,92,246,1) 0%, transparent 70%)';
            if(rarity.includes('Мифич')) return 'radial-gradient(circle, rgba(239,68,68,1) 0%, transparent 70%)';
            if(rarity.includes('Легенд')) return 'radial-gradient(circle, rgba(59,130,246,1) 0%, transparent 70%)';
            if(rarity.includes('Эпич')) return 'radial-gradient(circle, rgba(168,85,247,1) 0%, transparent 70%)';
            if(rarity.includes('Редк')) return 'radial-gradient(circle, rgba(250,204,21,1) 0%, transparent 70%)';
            return 'radial-gradient(circle, rgba(255,255,255,1) 0%, transparent 70%)';
        }

        function spawnSummonCard(card, index) {
            var grid = document.getElementById('summonGrid');
            var cardEl = document.createElement('div');
            cardEl.className = 'summon-card';

            var backImg = getCardBackImage(card.rarity);
            var glow = getRarityGlowColor(card.rarity);
            var isDivine = (card.rarity || '').includes('Божест');

            // УМНЫЙ ЗАМЕНИТЕЛЬ КАРТИНОК (.jpeg -> .webp)
            var imgSrc = `images/${card.file}`;
            var fallbackSrc = imgSrc.replace(/\.jpe?g$/i, '.webp');

            // ЛОГИКА ДУБЛИКАТА
            var dupHtml = '';
            var imgClass = '';
            if (card.is_dup) {
                imgClass = 'is-dup-img';
                dupHtml = `<div class="dup-overlay">
                              <div class="dup-slash"></div>
                              <div class="dup-stamp">ДУБЛИКАТ<br>+ ${card.dup_reward} ${MC_SYS.krw}</div>
                           </div>`;
            }

            // onerror="this.onerror=null; this.src=..." — если картинки нет, браузер сам подставит .webp
            cardEl.innerHTML = `
                <div class="rarity-flash" style="background: ${glow}"></div>
                <div class="summon-card-inner">
                    <div class="summon-card-front" style="background-image: url('images/${backImg}'), linear-gradient(#333, #111);"></div>
                    <div class="summon-card-back">
                        <img class="${imgClass}" src="${imgSrc}" onerror="this.onerror=null; this.src='${fallbackSrc}';">
                        ${dupHtml}
                    </div>
                </div>
            `;
            grid.appendChild(cardEl);

            setTimeout(() => {
                cardEl.classList.add('landed');
                if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
            }, 50);

            cardEl.onclick = function() {
                if (this.classList.contains('flipped')) return;

                this.classList.remove('floating');
                this.classList.add('flipped');
                flippedCardsCount++;

                setTimeout(() => {
                    if (isDivine) {
                        if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('heavy');
                        document.getElementById('summonOverlay').classList.remove('shake');
                        void document.getElementById('summonOverlay').offsetWidth;
                        document.getElementById('summonOverlay').classList.add('shake');
                    } else {
                        if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
                    }

                    // ФИКС: сравниваем с реальным числом карт (сервер мог вернуть меньше)
                    if (flippedCardsCount >= summonedCardsData.length) {
                        setTimeout(() => { document.getElementById('summonClaimBtn').classList.add('show'); }, 600);
                    }
                }, 300);
            };
        }

        function showQuickResults() {
            var overlay = document.getElementById('summonOverlay');
            var portal = document.getElementById('summonPortal');
            var rays = document.getElementById('summonRays');
            var grid = document.getElementById('summonGrid');

            clearSummonTimers();
            portal.style.opacity = '0'; rays.style.opacity = '0';
            overlay.classList.add('open');
            grid.innerHTML = '';
            grid.scrollTop = 0;

            // ТА ЖЕ УМНАЯ СЕТКА ДЛЯ БЫСТРОГО РЕЗУЛЬТАТА
            applySummonGridLayout(grid, summonedCardsData.length);

            summonedCardsData.forEach(card => {
                var cardEl = document.createElement('div');
                cardEl.className = 'summon-card landed flipped';
                cardEl.style.transition = 'none';

                var imgSrc = `images/${card.file}`;
                var fallbackSrc = imgSrc.replace(/\.jpe?g$/i, '.webp');

                var dupHtml = '';
                var imgClass = '';
                if (card.is_dup) {
                    imgClass = 'is-dup-img';
                    dupHtml = `<div class="dup-overlay">
                                  <div class="dup-slash"></div>
                                  <div class="dup-stamp">ДУБЛИКАТ<br>+ ${card.dup_reward} ${MC_SYS.krw}</div>
                               </div>`;
                }

                cardEl.innerHTML = `
                    <div class="summon-card-inner" style="transition: none;">
                        <div class="summon-card-back">
                            <img class="${imgClass}" src="${imgSrc}" onerror="this.onerror=null; this.src='${fallbackSrc}';">
                            ${dupHtml}
                        </div>
                    </div>
                `;
                grid.appendChild(cardEl);
            });
            document.getElementById('summonClaimBtn').classList.add('show');
        }

        function closeSummonScene() {
            if (tg.HapticFeedback) tg.HapticFeedback.selectionChanged();
            clearSummonTimers();
            document.getElementById('summonOverlay').classList.remove('open');
            var claimBtn = document.getElementById('summonClaimBtn');
            if(claimBtn) claimBtn.classList.remove('show');
        }
// ================= СПЛЭШ-ЭКРАН (ЗАГРУЗКА) =================
        setTimeout(function() {
            var splash = document.getElementById('splashScreen');
            if (splash) {
                splash.classList.add('hidden');
                setTimeout(() => splash.remove(), 500);
            }
        }, 2500); // Строго 2.5 секунды независимо от скорости интернета

        // ================= 3D ИНТЕРАКТИВ КАРТЫ (ПАКИ) =================
        var packWrapper = document.getElementById('packCardWrapper');
        var packInner = document.getElementById('packCardInner');

        function handleMove(e) {
            if (!isCardFlipped) return;

            var rect = packWrapper.getBoundingClientRect();
            // Получаем координаты (мышь или первый палец)
            var clientX = e.touches ? e.touches[0].clientX : e.clientX;
            var clientY = e.touches ? e.touches[0].clientY : e.clientY;

            var x = clientX - rect.left;
            var y = clientY - rect.top;

            var centerX = rect.width / 2;
            var centerY = rect.height / 2;

            // Вычисляем угол наклона (max 20-25 градусов)
            var rotateX = ((y - centerY) / centerY) * -20;
            var rotateY = ((x - centerX) / centerX) * 20;

            // ВАЖНО: Карта уже перевернута на 180 градусов, поэтому добавляем 180 к Y!
            packInner.style.transform = `scale(1.15) rotateX(${rotateX}deg) rotateY(${180 + rotateY}deg)`;
            packInner.style.transition = 'none'; // Убираем плавность во время движения для моментального отклика
        }

        function handleLeave() {
            if (!isCardFlipped) return;
            // Возвращаем в идеальное ровное состояние
            packInner.style.transform = 'scale(1.15) rotateY(180deg) rotateX(0deg)';
            packInner.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        }

        packWrapper.addEventListener('mousemove', handleMove);
        packWrapper.addEventListener('mouseleave', handleLeave);

        packWrapper.addEventListener('touchmove', handleMove, {passive: true});
        packWrapper.addEventListener('touchend', handleLeave);
// ================= Альбом системы коллекции ==================
var collActiveUniverse = null;
var universeColors = {
    'Башня Бога': '#f43f5e', // Розово-красный
    'Лукизм': '#f59e0b', // Золотой
    'Легенда о северном клинке': '#3b82f6', // Ледяной синий
    'Поднятие уровня в одиночку': '#8b5cf6', // Теневой фиолетовый
    'Система всемогущего дизайнера': '#10b981', // Изумрудный
    'Борьба в прямом эфире': '#ef4444', // Красный
    'Я злодейка в романе о боевых искусствах, но я сильнейшая!': '#ec4899', // Маджента
    'Убить Героя': '#7c3aed', // Темно-фиолетовый
    'Факультет зачистки подземелий': '#06b6d4', // Бирюзовый
    'Honkai: Star Rail': '#6366f1', // Космический индиго
    'Ветролом': '#14b8a6', // Бирюзово-зеленый
    'Мир после падения': '#94a3b8', // Серебряный (Светло-серый)
    'Гениальный мечник академии': '#2563eb', // Насыщенный синий
    'Я так и не смогла усмирить эту злую натуру': '#e11d48', // Карминный
    'Жизнь неудачника': '#84cc16', // Токсично-зеленый
    'Джинкс': '#d946ef', // Яркая фуксия
    'Проход защиты': '#ea580c', // Оранжевый
    'Агенты времени': '#0ea5e9', // Небесно-голубой
    'Теневой раб': '#4f46e5', // Темный индиго
    'Петля': '#f97316', // Ярко-оранжевый
    'Я прокачиваюсь во сне, убивая монстров': '#c084fc', // Лавандовый
    'Боксёр': '#dc2626' // Кроваво-красный
};

function initCollection() {
    if (typeof allCards === 'undefined' || !allCards.length) return;

    // Если игрок зашел внутрь конкретной вселенной, не сбрасываем экран
    if (collActiveUniverse) {
        openUniverseDetail(collActiveUniverse);
        return;
    }

    var container = document.getElementById('collUniversesContainer');
    if (!container) return;

    var ownedSet = new Set(typeof userOwnedCards !== 'undefined' ? userOwnedCards : []);
    var uniMap = {};

    // Подсчет карт
    allCards.forEach(c => {
        if (!c.series) return;
        if (!uniMap[c.series]) uniMap[c.series] = { total: 0, owned: 0 };
        uniMap[c.series].total++;
        if (ownedSet.has(c.id)) uniMap[c.series].owned++;
    });

    // 🔥 ОПТИМИЗАЦИЯ: Буферизация для скорости
    var htmlBuffer = '';
    var delayIndex = 0; // Для красивой каскадной анимации

    Object.keys(uniMap).sort().forEach(uniName => {
        var stats = uniMap[uniName];
        var pct = stats.total > 0 ? Math.round((stats.owned / stats.total) * 100) : 0;
        var color = universeColors[uniName] || 'var(--accent)';

        htmlBuffer += `
            <div class="coll-universe-card" data-uni="${mcEsc(uniName)}" onclick="openUniverseDetail(this.dataset.uni)" style="--uni-color: ${color}; animation-delay: ${delayIndex * 0.1}s;">
                <div class="coll-uni-top">
                    <div class="coll-uni-title">${mcEsc(uniName)}</div>
                    <div class="coll-uni-badge">${pct}%</div>
                </div>
                <div class="coll-uni-meta">
                    <span>Собрано карт</span>
                    <span class="coll-uni-count">${stats.owned} / ${stats.total}</span>
                </div>
                <div class="coll-uni-bar">
                    <div class="coll-uni-fill" style="width: ${pct}%;"></div>
                </div>
            </div>`;
        delayIndex++;
    });

    container.innerHTML = htmlBuffer; // Вставляем 1 раз! Работает со скоростью света.
}

function openUniverseDetail(uniName) {
    if (tg.HapticFeedback && tg.HapticFeedback.selectionChanged) tg.HapticFeedback.selectionChanged();

    collActiveUniverse = uniName;
    document.getElementById('collUniversesView').style.display = 'none';
    document.getElementById('collDetailView').style.display = 'block';

    // Сброс скролла наверх
    window.scrollTo({ top: 0, behavior: 'smooth' });

    var ownedSet = new Set(typeof userOwnedCards !== 'undefined' ? userOwnedCards : []);
    var uniCards = allCards.filter(c => c.series === uniName);
    var totalCount = uniCards.length;
    var ownedCount = uniCards.filter(c => ownedSet.has(c.id)).length;
    var totalPct = totalCount > 0 ? Math.round((ownedCount / totalCount) * 100) : 0;
    var uniColor = universeColors[uniName] || 'var(--accent)';

    // Липкая шапка
    var headerBox = document.getElementById('collDetailHeaderBox');
    headerBox.innerHTML = `
        <div class="coll-uni-top">
            <div class="coll-uni-title" style="font-size: 20px;">${uniName}</div>
            <div class="coll-uni-badge" style="--uni-color: ${uniColor}; padding: 6px 14px; font-size:13px; color:#000;">${totalPct}%</div>
        </div>
        <div class="coll-uni-meta" style="margin-top: 12px; color:rgba(255,255,255,0.6);">
            <span>Прогресс архива</span>
            <span class="coll-uni-count" style="color:#fff;">${ownedCount} / ${totalCount}</span>
        </div>
        <div class="coll-uni-bar" style="height: 8px; margin-top: 8px; background: rgba(0,0,0,0.5);">
            <div class="coll-uni-fill" style="--uni-color: ${uniColor}; width: ${totalPct}%; box-shadow: 0 0 15px ${uniColor};"></div>
        </div>`;

    var rarityMap = {};
    uniCards.forEach(c => {
        var r = c.rarity || 'Обычная ⚪️';
        if (!rarityMap[r]) rarityMap[r] = [];
        rarityMap[r].push(c);
    });

    var rContainer = document.getElementById('collDetailRaritiesContainer');

    var rarityOrder = ['Божественная ⚫️', 'Мифическая 🔴', 'Легендарная 🔵', 'Эпическая 🟢', 'Редкая 🟡', 'Обычная ⚪️', 'Лимитированная ✨', 'Ивентовая 🪎'];
    var rarityColors = {
        'Обычная ⚪️': '#94a3b8', 'Редкая 🟡': '#fde047', 'Эпическая 🟢': '#4ade80',
        'Легендарная 🔵': '#3b82f6', 'Мифическая 🔴': '#ef4444', 'Божественная ⚫️': '#c4b5fd'
    };

    // 🔥 ОПТИМИЗАЦИЯ: Буферизация секций
    var sectionsBuffer = '';

    rarityOrder.forEach(r => {
        if (!rarityMap[r] || rarityMap[r].length === 0) return;

        var rCards = rarityMap[r];
        var rOwned = rCards.filter(c => ownedSet.has(c.id)).length;
        var rPct = Math.round((rOwned / rCards.length) * 100);
        var rColor = rarityColors[r] || '#fff';

        sectionsBuffer += `
            <div class="coll-rarity-section">
                <div class="coll-rarity-trigger" style="--r-color: ${rColor};" onclick="toggleCollRarity(this)">
                    <div class="coll-rarity-title-txt">${r}</div>
                    <div class="coll-rarity-right-info">
                        <span style="font-size:14px; color:rgba(255,255,255,0.7); font-weight:700; margin-right:8px;">${rOwned} / ${rCards.length}</span>
                        <div class="coll-rarity-badge-pct" style="--r-color: ${rColor};">${rPct}%</div>
                    </div>
                </div>
                <div class="coll-grid-anim-wrapper">
                    <div class="coll-grid-overflow">
                        <div class="coll-cards-grid">`;

rCards.forEach(c => {
    var isOwned = ownedSet.has(c.id);
    var imgSrc = 'images/' + c.file;
    var fallbackSrc = imgSrc.replace(/\.jpe?g$/i, '.webp');

    if (isOwned) {
        sectionsBuffer += `
            <div class="coll-mini-card owned" style="--r-color: ${rColor};" onclick="openModalById('${c.id}')">
                <img src="${imgSrc}" loading="lazy" onerror="this.onerror=null; this.src='${fallbackSrc}';">
                <div class="coll-card-check">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="4"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <div class="coll-card-stats-strip">${c.name || ''}</div>
            </div>`;
    } else {
        sectionsBuffer += `
            <div class="coll-mini-card locked">
                <img src="${imgSrc}" loading="lazy" onerror="this.onerror=null; this.src='${fallbackSrc}';">
            </div>`;
    }
});

        sectionsBuffer += `</div></div></div></div>`;
    });

    rContainer.innerHTML = sectionsBuffer;
    manageBack();
}

function backToUniverses() {
    collActiveUniverse = null;
    document.getElementById('collDetailView').style.display = 'none';
    document.getElementById('collUniversesView').style.display = 'block';

    initCollection();
    manageBack();
}

function toggleCollRarity(triggerEl) {
    if (tg.HapticFeedback && tg.HapticFeedback.selectionChanged) tg.HapticFeedback.selectionChanged();

    var section = triggerEl.closest('.coll-rarity-section');
    var wasOpen = section.classList.contains('open');

    // Схема "Аккордеон": закрываем остальные открытые вкладки
    document.querySelectorAll('.coll-rarity-section').forEach(s => {
        if (section !== s) s.classList.remove('open');
    });

    if (!wasOpen) {
        section.classList.add('open');
        // Плавная прокрутка с учетом нашей высокой "липкой" шапки
        setTimeout(() => {
            var headerOffset = 150;
            var elementPosition = section.getBoundingClientRect().top;
            var offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                 top: offsetPosition,
                 behavior: "smooth"
            });
        }, 150);
    } else {
        section.classList.remove('open');
    }
}
// === РЕГИСТРАЦИЯ SERVICE WORKER (КЭШ ДЖЕДАЯ) ===
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('./sw.js')
            .then(function(reg) {
                console.log('⚡ Service Worker зарегистрирован в зоне:', reg.scope);
            })
            .catch(function(err) {
                console.error('❌ Ошибка регистрации Service Worker:', err);
            });
    });
}


    // ================= СИСТЕМА ПОКУПКИ КРУТОК В WEB APP =================
var currentBuyCurrency = 'krw';

var BUY_PACKS_KRW_DATA = [
    { price: 75,   attempts: 1 },
    { price: 375,  attempts: 6 },
    { price: 750,  attempts: 13 },
    { price: 1500, attempts: 28 },
    { price: 3750, attempts: 75 }
];

var BUY_PACKS_DIA_DATA = [
    { price: 50,   attempts: 15 },
    { price: 100,  attempts: 33 },
    { price: 250,  attempts: 90 },
    { price: 500,  attempts: 210 },
    { price: 1000, attempts: 475 }
];





var buyAttemptsInFlight = false;

// ================= ЛОГИКА РАМОК ПРОФИЛЯ =================
var userOwnedFrames = ['none'];
var equippedFrameId = 'none';
var selectedFrameForPreview = 'none';
var allFramesData = {};

// Загрузка рамок пользователя с сервера
async function loadUserFrames() {
    try {
        var res = await fetch(API_BASE + '/api/user_frames/' + userId, {
            headers: authHeaders()
        });
        var data = await res.json();
        if (data.success) {
            userOwnedFrames = data.owned_frames || ['none'];
            equippedFrameId = data.equipped_frame || 'none';
            allFramesData = data.all_frames || {};

            updateProfileFramesUI(equippedFrameId);
        }
    } catch (e) {
        console.error('Ошибка загрузки рамок:', e);
    }
}

// Отображение/скрытие рамок на всех аватарках
function updateProfileFramesUI(frameId) {
    equippedFrameId = frameId;
    var frameData = allFramesData[frameId];

    var frameElements = [
        document.getElementById('userAvatarFrame'),
        document.getElementById('psAvatarFrame'),
        document.getElementById('pubAvatarFrame')
    ];

    frameElements.forEach(el => {
        if (!el) return;
        if (frameId !== 'none' && frameData && frameData.url) {
            el.src = frameData.url;
            el.style.display = 'block'; // Показываем рамку
        } else {
            el.src = '';
            el.style.display = 'none'; // Полностью скрываем рамку, если её нет!
        }
    });
}

// Открытие шторки выбора рамки
function openFrameSystem() {
    if (tg.HapticFeedback && tg.HapticFeedback.impactOccurred) tg.HapticFeedback.impactOccurred('medium');

    selectedFrameForPreview = equippedFrameId;

    // Переносим текущую аватарку в предпросмотр
    var userAvatarSrc = document.getElementById('userAvatar').src;
    document.getElementById('framePreviewAvatar').src = userAvatarSrc;

    updateFramePreview(selectedFrameForPreview);
    renderFrameGrid();

    document.getElementById('frameSystemSheet').classList.add('open'); manageBack();
}

function closeFrameSystem() {
    if (tg.HapticFeedback && tg.HapticFeedback.selectionChanged) tg.HapticFeedback.selectionChanged();
    document.getElementById('frameSystemSheet').classList.remove('open'); manageBack();
}

// Отрисовка доступных рамок
// === ВЕКТОРНЫЕ ИКОНКИ ВАЛЮТ ВМЕСТО ЭМОДЗИ ===
var ICON_KRW_HTML = '<span class="b-ico" style="font-size:15px; margin-right:2px;">₩</span>';
var ICON_DIA_HTML = '<svg class="b-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:16px; height:16px; display:inline-block; vertical-align:middle; margin-right:2px; color:#06b6d4;"><path d="M3 9l3-5h12l3 5-9 12z"/><path d="M3 9h18M9 4l-2 5 5 12 5-12-2-5"/></svg>';

function renderFrameGrid() {
    var container = document.getElementById('frameListContainer');
    if (!container) return;
    container.innerHTML = '';

    var userAvatarSrc = document.getElementById('userAvatar') ? document.getElementById('userAvatar').src : '';

    userOwnedFrames.forEach(frameId => {
        var isNone = frameId === 'none';
        var frameInfo = allFramesData[frameId] || { name: 'Нет', url: '' };
        var isActive = (selectedFrameForPreview === frameId);
        var activeClass = isActive ? 'active' : '';

        var frameImgHtml = (isNone || !frameInfo.url)
            ? ''
            : `<img src="${frameInfo.url}" class="preview-frame-img" style="width: 120%; height: 120%;">`;

        var badgeHtml = isActive ? `<div class="frame-card-badge">✓</div>` : '';

        var html = `
            <div class="frame-card-item ${activeClass}" onclick="selectFrameItem('${frameId}')">
                <div class="frame-card-icon-wrap">
                    <img src="${userAvatarSrc}" class="frame-card-avatar">
                    ${frameImgHtml}
                    ${badgeHtml}
                </div>
                <div class="frame-card-label">${isNone ? 'Нет' : frameInfo.name}</div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
    });
}

function updateFramePreview(frameId) {
    selectedFrameForPreview = frameId;
    var prevImg = document.getElementById('framePreviewImg');
    var prevTitle = document.getElementById('framePreviewTitle');
    var badge = document.getElementById('previewCheckBadge');

    if (frameId !== 'none' && allFramesData[frameId]) {
        prevImg.src = allFramesData[frameId].url;
        prevImg.style.display = 'block';
        prevTitle.innerText = allFramesData[frameId].name;
    } else {
        prevImg.src = '';
        prevImg.style.display = 'none';
        prevTitle.innerText = 'Нет';
    }

    // Показывать бейдж с галочкой, если эта рамка сейчас надета на игрока
    if (badge) {
        badge.style.display = (frameId === equippedFrameId) ? 'flex' : 'none';
    }
}

function selectFrameItem(frameId) {
    if (tg.HapticFeedback && tg.HapticFeedback.selectionChanged) tg.HapticFeedback.selectionChanged();
    updateFramePreview(frameId);
    renderFrameGrid();
}

// Сохранение выбранной рамки на сервере
async function applySelectedFrame() {
    if (tg.HapticFeedback && tg.HapticFeedback.impactOccurred) tg.HapticFeedback.impactOccurred('heavy');

    try {
        var res = await fetch(API_BASE + '/api/equip_frame/' + userId, {
            method: 'POST',
            headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
            body: JSON.stringify({ frame_id: selectedFrameForPreview })
        });
        var data = await res.json();

        if (data.success) {
            updateProfileFramesUI(data.equipped_frame);
            showToast('Успешно!', 'Рамка обновлена');
            closeFrameSystem();
        } else {
            tg.showAlert(data.error);
        }
    } catch (e) {
        tg.showAlert('Ошибка сохранения рамки');
    }
}

// Автоматически вызов при старте приложения (добавить в функцию инициализации)
loadUserFrames();
// ================= МАГАЗИН РАМОК =================

// База рамок магазина (совпадает с бэкендом)
var SHOP_FRAMES_DATA = [
    { id: "fire", name: "Fire", url: "https://cdn.discordapp.com/avatar-decoration-presets/a_a065206df7b011a5510e4e5bca7d49be.png?size=240&passthrough=true", currency: "krw", price: 1500 },
    { id: "water", name: "Water", url: "https://cdn.discordapp.com/avatar-decoration-presets/a_250640ab00a8837a1d56f35879138177.png?size=240&passthrough=true", currency: "krw", price: 1500 },
    { id: "lightning", name: "Lightning", url: "https://cdn.discordapp.com/avatar-decoration-presets/a_365eed4178528fe8293c4212e8e2d5cb.png?size=240&passthrough=true", currency: "krw", price: 1500 },
    { id: "balance", name: "Balance", url: "https://cdn.discordapp.com/avatar-decoration-presets/a_82e4df4028396ad5ccaaafb397fa6248.png?size=240&passthrough=true", currency: "krw", price: 2000 },
    { id: "glitch", name: "Glitch", url: "https://cdn.discordapp.com/avatar-decoration-presets/a_e90ebc0114e7bdc30353c8b11953ea41.png?size=240&passthrough=true", currency: "dia", price: 50 },
    { id: "head", name: "Head in the clouds", url: "https://cdn.discordapp.com/avatar-decoration-presets/a_670b722e56740d11d1e6fe55b8094013.png?size=240&passthrough=true", currency: "dia", price: 100 },
];

var selectedShopFrame = null;

function switchShopSubTab(tab) {
    if (tg.HapticFeedback && tg.HapticFeedback.selectionChanged) tg.HapticFeedback.selectionChanged();

    var tabs = {
        gacha:  { btn: 'tabShopGachaBtn',  box: 'shopGachaContent'  },
        wheel:  { btn: 'tabShopWheelBtn',  box: 'shopWheelContent'  },
        frames: { btn: 'tabShopFramesBtn', box: 'shopFramesContent' }
    };

    Object.keys(tabs).forEach(function (key) {
        var btn = document.getElementById(tabs[key].btn);
        var box = document.getElementById(tabs[key].box);
        if (btn) btn.classList.toggle('active', key === tab);
        if (box) box.style.display = (key === tab) ? 'block' : 'none';
    });

    if (tab === 'frames') renderShopFrames();
    if (tab === 'wheel' && typeof initWheel === 'function') initWheel();
}

function renderShopFrames() {
    var grid = document.getElementById('shopFramesGrid');
    if (!grid) return;

    // Переключаем класс сетки на новую, чтобы карточки стали большими (по 2 в ряд)
    grid.className = 'premium-frames-grid';
    grid.innerHTML = '';

    var userAvatarSrc = document.getElementById('userAvatar') ? document.getElementById('userAvatar').src : '';

    var htmlBuffer = ''; // Оптимизация!

    SHOP_FRAMES_DATA.forEach(frame => {
        var isOwned = userOwnedFrames.includes(frame.id);
        var priceHtml = '';
        var discountBadge = '';

        // Векторные иконки под размер ценников
        var iconKrw = `<span style="color:#c4b5fd; font-weight:900; margin-right:2px; font-size:15px;">₩</span>`;
        var iconDia = `<svg viewBox="0 0 24 24" fill="none" stroke="#06b6d4" stroke-width="2" style="width:16px;height:16px; margin-right:2px;"><path d="M3 9l3-5h12l3 5-9 12z"/><path d="M3 9h18M9 4l-2 5 5 12 5-12-2-5"/></svg>`;

        if (isOwned) {
            priceHtml = '<div class="pf-price-tag owned">КУПЛЕНО ✓</div>';
        } else {
            var finalPrice = isUserPremium ? Math.floor(frame.price * 0.8) : frame.price;
            var currIcon = frame.currency === 'krw' ? iconKrw : iconDia;

            if (isUserPremium) {
                discountBadge = '<div class="pf-discount">-20%</div>';
                priceHtml = `<div class="pf-price-tag"><s style="font-size:11px; color:var(--text-muted); margin-right:4px;">${frame.price}</s> ${currIcon} ${finalPrice}</div>`;
            } else {
                priceHtml = `<div class="pf-price-tag">${currIcon} ${frame.price}</div>`;
            }
        }

        htmlBuffer += `
            <div class="premium-frame-card" onclick="openFrameShopPreview('${frame.id}')">
                ${discountBadge}
                <div class="pf-icon-wrap">
                    <img src="${userAvatarSrc}" class="pf-avatar">
                    <img src="${frame.url}" class="pf-frame">
                </div>
                <div class="pf-name">${frame.name}</div>
                ${priceHtml}
            </div>
        `;
    });

    grid.innerHTML = htmlBuffer;
}

function openFrameShopPreview(frameId) {
    if (tg.HapticFeedback && tg.HapticFeedback.impactOccurred) tg.HapticFeedback.impactOccurred('medium');

    selectedShopFrame = SHOP_FRAMES_DATA.find(f => f.id === frameId);
    if (!selectedShopFrame) return;

    var isOwned = userOwnedFrames.includes(frameId);

    document.getElementById('shopPreviewAvatar').src = document.getElementById('userAvatar').src;
    document.getElementById('shopPreviewFrame').src = selectedShopFrame.url;
    document.getElementById('shopPreviewTitle').innerText = selectedShopFrame.name;

    var priceBox = document.getElementById('shopPreviewPriceBox');
    var btnBuy = document.getElementById('btnBuyFrame');

    if (isOwned) {
        priceBox.innerHTML = '<div class="premium-discount-banner" style="color:#4ade80; background:rgba(74, 222, 128, 0.1); border-color:#4ade80;">Уже в вашей коллекции ✓</div>';
        btnBuy.style.display = 'none';
    } else {
        var finalPrice = isUserPremium ? Math.floor(selectedShopFrame.price * 0.8) : selectedShopFrame.price;
        var currIcon = selectedShopFrame.currency === 'krw' ? ICON_KRW_HTML : ICON_DIA_HTML;

        if (isUserPremium) {
            priceBox.innerHTML = `<div class="premium-discount-banner">👑 С Premium вы экономите 20%</div>`;
            btnBuy.innerHTML = `КУПИТЬ ЗА ${currIcon} ${finalPrice} 👑`;
        } else {
            priceBox.innerHTML = `<div class="premium-discount-banner no-prem">👑 С Premium вы бы сэкономили здесь 20%</div>`;
            btnBuy.innerHTML = `КУПИТЬ ЗА ${currIcon} ${finalPrice}`;
        }

        btnBuy.style.display = 'flex';
    }

    document.getElementById('frameShopPreviewSheet').classList.add('open'); manageBack();
}

function closeFrameShopPreview() {
    document.getElementById('frameShopPreviewSheet').classList.remove('open'); manageBack();
}

async function executeBuyFrame() {
    if (!selectedShopFrame) return;
    if (tg.HapticFeedback && tg.HapticFeedback.impactOccurred) tg.HapticFeedback.impactOccurred('heavy');

    var btn = document.getElementById('btnBuyFrame');
    btn.innerText = 'ОБРАБОТКА...';
    btn.disabled = true;

    try {
        var res = await fetch(API_BASE + '/api/buy_frame/' + userId, {
            method: 'POST',
            headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
            body: JSON.stringify({ frame_id: selectedShopFrame.id })
        });
        var data = await res.json();

        if (data.success) {
            showToast('Успешно!', 'Рамка добавлена в коллекцию!');

            // Моментально обновляем баланс
            document.getElementById('valKrw').innerText = formatBal(data.new_krw);
            document.getElementById('valDiamond').innerText = formatBal(data.new_dia);
            mcBal.krw = data.new_krw || 0; mcBal.dia = data.new_dia || 0;

            // Добавляем в инвентарь без перезагрузки
            userOwnedFrames.push(selectedShopFrame.id);

            closeFrameShopPreview();
            renderShopFrames(); // Перерисовываем магаз (появится галочка "КУПЛЕНО")

            // Если открыто окно выбора рамок в профиле - обновляем и его
            if(document.getElementById('frameListContainer')) renderFrameGrid();
        } else {
            tg.showAlert(data.error);
            btn.innerText = 'КУПИТЬ';
        }
    } catch (e) {
        tg.showAlert('Ошибка соединения с сервером');
        btn.innerText = 'КУПИТЬ';
    }
    btn.disabled = false;
}
async function toggleUsernameVisibility() {
    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
    var btn = document.getElementById('psHideUserBtn');
    btn.disabled = true;

    try {
        var res = await fetch(API_BASE + '/api/toggle_username/' + userId, {
            method: 'POST',
            headers: authHeaders()
        });
        var data = await res.json();

        if (data.success) {
            if (data.hidden) {
                btn.classList.add('active');
                btn.innerText = 'Скрыто';
                showToast('Конфиденциальность', 'Ваш username скрыт от других игроков');
            } else {
                btn.classList.remove('active');
                btn.innerText = 'Скрыть';
                showToast('Конфиденциальность', 'Ваш username теперь виден всем');
            }
        }
    } catch (e) {
        tg.showAlert('Ошибка соединения');
    }
    btn.disabled = false;
}
var currentModalCard = null;

// ВАЖНО: В твоей функции openModal(item) добавь в самом начале эту строку:
// currentModalCard = item;

const RARITY_COLORS = {
    'Обычная ⚪️': 'rgba(148,163,184,1)', 'Редкая 🟡': 'rgba(253,224,71,1)',
    'Эпическая 🟢': 'rgba(74,222,128,1)', 'Легендарная 🔵': 'rgba(59,130,246,1)',
    'Мифическая 🔴': 'rgba(239,68,68,1)', 'Божественная ⚫️': 'rgba(168,85,247,1)'
};


// =====================================================================
//  ✦✦✦  UPGRADE PACK  ✦✦✦
//  Навигация-«книга», взрывной Топ, владельцы и скины, полноэкранный
//  просмотр видео со звуком, новые достижения и витрина в профилях.
// =====================================================================

// ---------- Общие утилиты ----------
function mcEsc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
}
function mcFmt(n) { return (Number(n) || 0).toLocaleString('ru-RU'); }
function mcHaptic(kind) {
    if (!tg.HapticFeedback) return;
    try {
        if (kind === 'select') tg.HapticFeedback.selectionChanged();
        else if (kind === 'success' || kind === 'error' || kind === 'warning') tg.HapticFeedback.notificationOccurred(kind);
        else tg.HapticFeedback.impactOccurred(kind || 'light');
    } catch (e) {}
}
function mcReduced() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}
// Пауза и выключение звука у всех видео внутри элемента
function mcStopMedia(el) {
    if (!el) return;
    el.querySelectorAll('video').forEach(function (v) { try { v.pause(); v.muted = true; } catch (e) {} });
}
// Видео-скин: только .webm (имя файла из базы может быть .mp4 — меняем расширение)
function mcSkinVideo(file, cls, extra) {
    var src = 'images/skins/' + String(file || '').replace(/\.[^.\/]+$/, '') + '.webm';
    return '<video class="' + (cls || '') + '" src="' + src + '" autoplay loop muted playsinline webkit-playsinline preload="metadata" ' + (extra || '') + '></video>';
}
function mcRgb(hex) {
    var h = String(hex || '').replace('#', '');
    if (h.length === 3) h = h.replace(/./g, '$&$&');
    var n = parseInt(h, 16) || 0;
    return ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255);
}

// ---------- Системные иконки валют (те же, что в балансе на главной) ----------
var MC_DIA_PATH = '<path d="M3 9l3-5h12l3 5-9 12z"/><path d="M3 9h18M9 4l-2 5 5 12 5-12-2-5"/>';
var MC_SYS = {
    krw: '<span class="mc-cur mc-krw">₩</span>',
    bc: '<span class="mc-cur mc-bc">Ⓑ</span>',
    dia: '<svg class="mc-cur mc-dia" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round">' + MC_DIA_PATH + '</svg>',
    cards: '<svg class="mc-cur" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M12 3 2 8l10 5 10-5z"/><path d="M2 12l10 5 10-5"/><path d="M2 16l10 5 10-5"/></svg>',
    crown: '<svg class="mc-cur" viewBox="0 0 24 24" fill="currentColor"><path d="M2.5 8.2l4.6 3.6L12 4.6l4.9 7.2 4.6-3.6-2.1 10.6H4.6z"/><rect x="4.6" y="20" width="14.8" height="2" rx="1"/></svg>'
};
// Балансы в «сыром» виде (на главной они сокращены до 54K)
var mcBal = { krw: 0, dia: 0, bc: 0, att: 0 };
function mcSkinImg(file) {
    return 'images/skins/' + String(file || '').replace(/\.jpg|\.jpeg|\.png/i, '.webp');
}
function mcCardArt(file) { return 'images/' + String(file || '').replace(/\.jpe?g$/i, '.webp'); }
function mcRarityColor(rarity) {
    var r = rarity || '';
    if (r.indexOf('Божест') !== -1) return '#a855f7';
    if (r.indexOf('Мифич') !== -1) return '#ef4444';
    if (r.indexOf('Легенд') !== -1) return '#3b82f6';
    if (r.indexOf('Эпич') !== -1) return '#4ade80';
    if (r.indexOf('Редк') !== -1) return '#fde047';
    return '#94a3b8';
}
var MC_SKIN_LABELS = { awakened: '💠 Пробуждённый', absolute: '🔮 Абсолютный' };

var MC_ICONS = {
    soundOn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/></svg>',
    soundOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M22 9l-6 6M16 9l6 6"/></svg>',
    play: '<svg viewBox="0 0 24 24"><path d="M7 4.5v15l12.5-7.5z" fill="currentColor"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><rect x="6" y="4.5" width="4" height="15" rx="1.2" fill="currentColor"/><rect x="14" y="4.5" width="4" height="15" rx="1.2" fill="currentColor"/></svg>',
    expand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>',
    crown: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2.5 8.2l4.6 3.6L12 4.6l4.9 7.2 4.6-3.6-2.1 10.6H4.6z"/><rect x="4.6" y="20" width="14.8" height="2" rx="1"/></svg>'
};

// =====================================================================
//  1. НАВИГАЦИЯ: плавающий индикатор + перелистывание страниц как в книге
// =====================================================================
var MC_TAB_ORDER = ['catalog', 'shop', 'profile', 'tops', 'collection'];
var mcCurrentTab = 'profile';
var mcTabScroll = {};
var mcPageFlip = null;

function mcNavBtn(tabId) {
    return document.querySelector('.bottom-nav .nav-btn[data-tab="' + tabId + '"]');
}

function mcMoveNav(btn, animate, dir) {
    var ind = document.getElementById('navIndicator');
    if (!ind || !btn) return;
    if (!animate) ind.classList.add('no-anim');
    ind.style.setProperty('--x', btn.offsetLeft + 'px');
    ind.style.setProperty('--w', btn.offsetWidth + 'px');
    ind.classList.add('ready');
    if (!animate) {
        void ind.offsetWidth;
        ind.classList.remove('no-anim');
        return;
    }
    // «Жидкое» растяжение в сторону движения
    ind.style.transformOrigin = dir === 'left' ? 'right center' : 'left center';
    ind.classList.remove('stretch');
    void ind.offsetWidth;
    ind.classList.add('stretch');
}

function mcNavRipple(btn) {
    if (!btn) return;
    var r = document.createElement('span');
    r.className = 'nav-ripple';
    btn.appendChild(r);
    setTimeout(function () { r.remove(); }, 650);
}

function mcFinishFlip() {
    if (!mcPageFlip) return;
    var f = mcPageFlip;
    mcPageFlip = null;
    clearTimeout(f.timer);
    (f.anims || []).forEach(function (a) { try { a.cancel(); } catch (e) {} });
    if (f.curl && f.curl.parentNode) f.curl.parentNode.removeChild(f.curl);
    f.old.classList.remove('page-leaving', 'active');
    f.old.style.height = '';
    f.old.style.transformOrigin = '';
    try { f.old.scrollTop = 0; } catch (e) {}
    f.neu.style.transformOrigin = '';
}

// Перелистывание как в книге.
// Анимация идёт через Web Animations API — её не может перебить никакой CSS
// (раньше menu.css со своими правилами для #tab-profile гасил переворот с главной).
// Уходящая страница превращается в слой ровно размером с экран: на iPhone
// огромные 3D-слои во всю длину страницы иногда просто не рисовались.
function mcFlipPages(oldTab, newTab, flip, sy, targetY) {
    var vh = window.innerHeight || document.documentElement.clientHeight || 700;
    var sign = flip === 'left' ? -1 : 1;

    oldTab.classList.add('page-leaving');
    oldTab.style.height = vh + 'px';
    oldTab.style.transformOrigin = (flip === 'left' ? '0%' : '100%') + ' 50%';
    oldTab.scrollTop = sy;

    // Тень и блик на самом листе — ровно в видимой области
    var curl = document.createElement('div');
    curl.className = 'page-curl from-' + flip;
    curl.style.top = oldTab.scrollTop + 'px';
    curl.style.height = vh + 'px';
    oldTab.appendChild(curl);

    newTab.classList.add('active');
    newTab.style.transformOrigin = '50% ' + (targetY + vh / 2) + 'px';
    window.scrollTo(0, targetY);

    var D = 720, EASE = 'cubic-bezier(0.38, 0, 0.3, 1)';
    var anims = [];
    anims.push(oldTab.animate([
        { transform: 'perspective(1500px) rotateY(0deg)', boxShadow: '0 0 0 rgba(0,0,0,0)' },
        { transform: 'perspective(1500px) rotateY(' + (sign * 28) + 'deg)', boxShadow: (sign * -30) + 'px 0 70px rgba(0,0,0,0.7)', offset: 0.35 },
        { transform: 'perspective(1500px) rotateY(' + (sign * 98) + 'deg)', boxShadow: (sign * -30) + 'px 0 70px rgba(0,0,0,0.7)' }
    ], { duration: D, easing: EASE, fill: 'forwards' }));
    anims.push(curl.animate([{ opacity: 0 }, { opacity: 1 }], { duration: D, easing: 'ease-in', fill: 'forwards' }));
    anims.push(newTab.animate([
        { transform: 'scale(0.94)', opacity: 0.4 },
        { transform: 'scale(1)', opacity: 1 }
    ], { duration: D, easing: 'cubic-bezier(0.22, 0.8, 0.3, 1)' }));

    var shade = document.getElementById('pageFlipShade');
    if (shade) {
        shade.className = 'page-flip-shade from-' + flip;
        anims.push(shade.animate([{ opacity: 1 }, { opacity: 0 }], { duration: D, easing: 'ease-out', fill: 'forwards' }));
    }

    mcPageFlip = { old: oldTab, neu: newTab, curl: curl, anims: anims };
    anims[0].onfinish = mcFinishFlip;
    mcPageFlip.timer = setTimeout(mcFinishFlip, D + 150); // страховка
}

function switchTab(tabId, btnElement, opts) {
    var newTab = document.getElementById('tab-' + tabId);
    if (!newTab) return;
    btnElement = btnElement || mcNavBtn(tabId);
    mcHaptic('select');
    mcFinishFlip();

    var prevId = mcCurrentTab;
    var oldTab = document.getElementById('tab-' + prevId);
    // navDir — куда едет индикатор навигации;
    // flip — куда переворачивается страница (в обратную сторону, как в книге:
    // жмёшь «Каталог» слева — лист уходит вправо, возвращаешься в меню — влево)
    var navDir = MC_TAB_ORDER.indexOf(tabId) < MC_TAB_ORDER.indexOf(prevId) ? 'left' : 'right';
    var flip = navDir === 'left' ? 'right' : 'left';

    document.querySelectorAll('.bottom-nav .nav-btn').forEach(function (b) {
        b.classList.toggle('active', b === btnElement);
    });
    if (btnElement) {
        mcMoveNav(btnElement, prevId !== tabId, navDir);
        mcNavRipple(btnElement);
    }

    // Повторный тап по активной вкладке — плавно наверх
    if (prevId === tabId) {
        newTab.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    var sy = window.pageYOffset || document.documentElement.scrollTop || 0;
    mcTabScroll[prevId] = sy;
    var targetY = mcTabScroll[tabId] || 0;
    mcCurrentTab = tabId;

    document.querySelectorAll('.tab-content').forEach(function (t) {
        if (t !== oldTab && t !== newTab) t.classList.remove('active');
    });

    var canAnimate = oldTab && typeof oldTab.animate === 'function' && !(opts && opts.instant);
    if (canAnimate) {
        try {
            mcFlipPages(oldTab, newTab, flip, sy, targetY);
            MCSound.play('flip');
        } catch (e) {
            console.error('page flip error', e);
            mcFinishFlip();
            canAnimate = false;
        }
    }
    if (!canAnimate) {
        if (oldTab) oldTab.classList.remove('active', 'page-leaving');
        newTab.classList.add('active');
        window.scrollTo(0, targetY);
    }

    // Топы грузим только при первом переходе на вкладку
    if (tabId === 'tops' && !topsTimerInterval) {
        loadTopsTimer();
        switchTopCategory('pvp_season', document.getElementById('btnTopPvpSeason'));
    } else if (tabId === 'tops') {
        mcMoveLbGlider(document.querySelector('.lb-tab.active'), false);
    }
}

function mcInitNav() {
    var active = document.querySelector('.bottom-nav .nav-btn.active') || mcNavBtn('profile');
    mcMoveNav(active, false);
}
mcInitNav();
window.addEventListener('load', mcInitNav);
window.addEventListener('resize', function () {
    mcInitNav();
    mcMoveLbGlider(document.querySelector('.lb-tab.active'), false);
});
setTimeout(mcInitNav, 2700); // после сплэша (шрифты уже загружены)

// =====================================================================
//  2. МОДАЛКА КАРТЫ: видео-скины со звуком и полноэкранный режим
// =====================================================================
async function openModal(item) {
    currentModalCard = item;
    var cleanRarity = (item.rarity || '').split(' ')[0];
    var wrap = document.querySelector('.modal-img-wrapper');
    mcStopMedia(wrap);
    wrap.innerHTML = '';
    wrap.classList.remove('has-video');

    var barHtml = '';
    if (item.isSkin) {
        var label = MC_SKIN_LABELS[item.skinType] || 'Скин';
        if (item.skinType === 'absolute') {
            wrap.classList.add('has-video');
            wrap.innerHTML = '<div class="modal-media-frame glow-' + cleanRarity + '">' +
                mcSkinVideo(item.skinFile, 'modal-img modal-video', 'onclick="toggleModalVideoPlay()"') +
                '<div class="modal-skin-tag">' + label + '</div></div>';
            barHtml =
                '<button class="modal-media-btn sound" id="modalSoundBtn" onclick="toggleModalSound()">' + MC_ICONS.soundOff + '<span>Со звуком</span></button>' +
                '<button class="modal-media-btn" onclick="openModalFullscreen()">' + MC_ICONS.expand + '<span>Во весь экран</span></button>';
        } else {
            wrap.innerHTML = '<div class="modal-media-frame glow-' + cleanRarity + '">' +
                '<img src="' + mcSkinImg(item.skinFile) + '" class="modal-img" onclick="openModalFullscreen()" onerror="this.onerror=null; this.src=\'images/default.webp\';">' +
                '<div class="modal-skin-tag">' + label + '</div></div>';
            barHtml = '<button class="modal-media-btn" onclick="openModalFullscreen()">' + MC_ICONS.expand + '<span>Во весь экран</span></button>';
        }
        document.getElementById('modalNameTop').innerText = item.name + (item.skinType === 'awakened' ? ' [💠]' : ' [🔮]');
        document.getElementById('modalName').innerText = item.name;
        document.getElementById('modalCount').innerText = '—';
    } else {
        var fallbackSrc = (item.file || '').replace(/\.jpe?g$/i, '.webp');
        wrap.innerHTML = '<div class="modal-media-frame glow-' + cleanRarity + '">' +
            '<img src="images/' + fallbackSrc + '" class="modal-img" onclick="openModalFullscreen()"></div>';
        barHtml = '<button class="modal-media-btn" onclick="openModalFullscreen()">' + MC_ICONS.expand + '<span>Во весь экран</span></button>';
        document.getElementById('modalNameTop').innerText = item.name || '';
        document.getElementById('modalName').innerText = item.name || '';
    }
    wrap.insertAdjacentHTML('beforeend', '<div class="modal-media-bar">' + barHtml + '</div>');

    document.getElementById('modalRarity').innerText = item.rarity || '';
    document.getElementById('modalStyle').innerText = item.style || '';
    document.getElementById('modalSeries').innerText = item.series || 'Неизвестно';
    document.getElementById('modalSpeed').innerText = item.speed || 0;
    document.getElementById('modalStrength').innerText = item.strength || 0;
    document.getElementById('modalIntellect').innerText = item.intellect || 0;

    var statEls = [document.getElementById('modalSpeed'), document.getElementById('modalStrength'), document.getElementById('modalIntellect')];
    var top = (item.rarity || '').indexOf('Мифическая') !== -1 || (item.rarity || '').indexOf('Божественная') !== -1;
    statEls.forEach(function (el) { el.classList.toggle('mythic', top); });

    mcHaptic('light');
    document.getElementById('cardModal').classList.add('open');
    manageBack();

    if (!item.isSkin) {
        var countEl = document.getElementById('modalCount');
        countEl.innerText = '⏳';
        try {
            var res = await fetch(API_BASE + '/api/card_count/' + encodeURIComponent(item.id));
            if (res.ok) {
                var data = await res.json();
                if (currentModalCard === item) countEl.innerText = mcFmt(data.count);
            } else countEl.innerText = '?';
        } catch (e) { countEl.innerText = 'Ошибка'; }
    }
}

function closeModal() {
    var modal = document.getElementById('cardModal');
    mcStopMedia(modal);
    modal.classList.remove('open');
    manageBack();
}

function mcModalVideo() { return document.querySelector('#cardModal .modal-video'); }

function mcSoundBtnState(btn, muted) {
    if (!btn) return;
    btn.classList.toggle('on', !muted);
    btn.innerHTML = (muted ? MC_ICONS.soundOff : MC_ICONS.soundOn) + '<span>' + (muted ? 'Со звуком' : 'Звук включён') + '</span>';
}

function toggleModalSound() {
    var v = mcModalVideo();
    if (!v) return;
    mcHaptic('light');
    v.muted = !v.muted;
    if (!v.muted) {
        var p = v.play();
        if (p && p.catch) p.catch(function () { v.muted = true; mcSoundBtnState(document.getElementById('modalSoundBtn'), true); });
    }
    mcSoundBtnState(document.getElementById('modalSoundBtn'), v.muted);
}

function toggleModalVideoPlay() {
    var v = mcModalVideo();
    if (!v) return;
    if (v.paused) v.play().catch(function () {}); else v.pause();
}

function openModalFullscreen() {
    var item = currentModalCard;
    if (!item) return;
    if (item.isSkin) {
        var v = mcModalVideo();
        var withSound = !!(v && !v.muted);
        if (v) { v.pause(); }
        mcOpenViewer({
            kind: item.skinType === 'absolute' ? 'video' : 'image',
            file: item.skinFile,
            src: mcSkinImg(item.skinFile),
            title: item.name,
            sub: MC_SKIN_LABELS[item.skinType] || 'Скин',
            color: mcRarityColor(item.rarity),
            sound: withSound,
            startAt: v ? v.currentTime : 0,
            onClose: function () { var mv = mcModalVideo(); if (mv && document.getElementById('cardModal').classList.contains('open')) mv.play().catch(function () {}); }
        });
    } else {
        mcOpenViewer({ kind: 'image', src: mcCardArt(item.file), fallback: 'images/' + item.file, title: item.name, sub: item.rarity || '', color: mcRarityColor(item.rarity) });
    }
}

// =====================================================================
//  3. ПОЛНОЭКРАННЫЙ ПРОСМОТРЩИК (картинки и видео со звуком)
// =====================================================================
var mcViewer = { video: null, onClose: null, drag: null };

function mcOpenViewer(o) {
    var ov = document.getElementById('mediaViewer');
    var stage = document.getElementById('mvStage');
    var ctr = document.getElementById('mvControls');
    var bd = document.getElementById('mvBackdrop');
    if (!ov) return;
    mcTeardownViewer();

    document.getElementById('mvTitle').textContent = o.title || '';
    document.getElementById('mvSub').textContent = o.sub || '';
    ov.style.setProperty('--mv-glow', o.color || '#8b5cf6');
    mcViewer.onClose = o.onClose || null;

    if (o.kind === 'video') {
        stage.innerHTML = '<div class="mv-media-wrap">' + mcSkinVideo(o.file, 'mv-media', '') + '<div class="mv-play-flash" id="mvPlayFlash"></div></div>';
        bd.style.backgroundImage = '';
        var v = stage.querySelector('video');
        mcViewer.video = v;
        ctr.innerHTML =
            '<button class="mv-btn" id="mvPlayBtn" onclick="mcViewerPlay()">' + MC_ICONS.pause + '</button>' +
            '<div class="mv-progress" id="mvProgress"><div class="mv-progress-fill" id="mvProg"></div></div>' +
            '<button class="mv-btn mv-sound" id="mvSoundBtn" onclick="mcViewerSound()">' + MC_ICONS.soundOff + '<span>Звук</span></button>';
        ctr.style.display = '';

        v.addEventListener('click', mcViewerPlay);
        v.addEventListener('timeupdate', function () {
            var f = document.getElementById('mvProg');
            if (f && v.duration) f.style.width = (v.currentTime / v.duration * 100) + '%';
        });
        v.addEventListener('play', mcViewerSync);
        v.addEventListener('pause', mcViewerSync);
        v.addEventListener('volumechange', mcViewerSync);
        if (o.startAt) {
            v.addEventListener('loadedmetadata', function once() {
                v.removeEventListener('loadedmetadata', once);
                try { v.currentTime = o.startAt; } catch (e) {}
            });
        }
        document.getElementById('mvProgress').addEventListener('click', function (e) {
            if (!v.duration) return;
            var r = this.getBoundingClientRect();
            v.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * v.duration;
        });

        // Открыто по тапу пользователя — браузер разрешает звук сразу
        if (o.sound) {
            v.muted = false;
            var p = v.play();
            if (p && p.catch) p.catch(function () { v.muted = true; v.play().catch(function () {}); });
        }
        mcViewerSync();
    } else {
        var fb = o.fallback ? ' onerror="this.onerror=null; this.src=\'' + o.fallback + '\'"' : '';
        stage.innerHTML = '<div class="mv-media-wrap"><img class="mv-media" src="' + o.src + '"' + fb + ' alt=""></div>';
        bd.style.backgroundImage = 'url("' + o.src + '")';
        ctr.innerHTML = '';
        ctr.style.display = 'none';
    }

    ov.classList.add('open');
    ov.setAttribute('aria-hidden', 'false');
    MCSound.play('open');
    mcHaptic('medium');
    manageBack();
}

function mcViewerSync() {
    var v = mcViewer.video;
    if (!v) return;
    var pb = document.getElementById('mvPlayBtn');
    if (pb) pb.innerHTML = v.paused ? MC_ICONS.play : MC_ICONS.pause;
    var sb = document.getElementById('mvSoundBtn');
    if (sb) {
        sb.classList.toggle('on', !v.muted);
        sb.innerHTML = (v.muted ? MC_ICONS.soundOff : MC_ICONS.soundOn) + '<span>' + (v.muted ? 'Звук' : 'Звук вкл.') + '</span>';
    }
}

function mcViewerPlay() {
    var v = mcViewer.video;
    if (!v) return;
    if (v.paused) v.play().catch(function () {}); else v.pause();
    var fl = document.getElementById('mvPlayFlash');
    if (fl) {
        fl.innerHTML = v.paused ? MC_ICONS.pause : MC_ICONS.play;
        fl.classList.remove('show'); void fl.offsetWidth; fl.classList.add('show');
    }
}

function mcViewerSound() {
    var v = mcViewer.video;
    if (!v) return;
    mcHaptic('light');
    v.muted = !v.muted;
    if (!v.muted && v.paused) v.play().catch(function () {});
    mcViewerSync();
}

function mcTeardownViewer() {
    if (mcViewer.video) {
        try { mcViewer.video.pause(); mcViewer.video.removeAttribute('src'); mcViewer.video.load(); } catch (e) {}
    }
    mcViewer.video = null;
    var stage = document.getElementById('mvStage');
    if (stage) { stage.innerHTML = ''; stage.style.transform = ''; stage.style.opacity = ''; }
}

function mcCloseViewer() {
    var ov = document.getElementById('mediaViewer');
    if (!ov || !ov.classList.contains('open')) return;
    ov.classList.remove('open');
    ov.setAttribute('aria-hidden', 'true');
    var cb = mcViewer.onClose;
    mcViewer.onClose = null;
    setTimeout(mcTeardownViewer, 260);
    manageBack();
    if (cb) setTimeout(cb, 50);
}

// Смахивание вниз закрывает просмотр
(function initMediaViewerGestures() {
    var ov = document.getElementById('mediaViewer');
    var stage = document.getElementById('mvStage');
    var bd = document.getElementById('mvBackdrop');
    if (!ov || !stage) return;
    bd.addEventListener('click', mcCloseViewer);
    stage.addEventListener('click', function (e) { if (e.target === stage) mcCloseViewer(); });
    stage.addEventListener('touchstart', function (e) {
        if (e.touches.length !== 1) return;
        mcViewer.drag = { y: e.touches[0].clientY, dy: 0 };
        stage.style.transition = 'none';
    }, { passive: true });
    stage.addEventListener('touchmove', function (e) {
        if (!mcViewer.drag) return;
        var dy = e.touches[0].clientY - mcViewer.drag.y;
        mcViewer.drag.dy = dy;
        if (dy > 0) {
            stage.style.transform = 'translateY(' + dy + 'px) scale(' + Math.max(0.85, 1 - dy / 1200) + ')';
            ov.style.setProperty('--mv-dim', Math.max(0.25, 1 - dy / 400));
        }
    }, { passive: true });
    stage.addEventListener('touchend', function () {
        if (!mcViewer.drag) return;
        var dy = mcViewer.drag.dy;
        mcViewer.drag = null;
        stage.style.transition = '';
        ov.style.removeProperty('--mv-dim');
        if (dy > 110) mcCloseViewer();
        else stage.style.transform = '';
    });
})();

// =====================================================================
//  4. ВЛАДЕЛЬЦЫ КАРТЫ + СКИНЫ
// =====================================================================
var mcOsKey = null;

function mcOwnersHeader(c) {
    var rName = c.rarity || 'Обычная ⚪️';
    var cleanRarity = rName.split(' ')[0];
    var rColor = RARITY_COLORS[rName] || mcRarityColor(rName);
    var screen = document.getElementById('ownersScreen');
    screen.style.setProperty('--r-color', rColor);

    document.getElementById('osCardName').innerText = c.name || '';
    var pill = document.getElementById('osRarityPill');
    pill.innerText = cleanRarity;
    pill.style.setProperty('--r-color', rColor);
    document.getElementById('osCardWrap').style.setProperty('--r-color', rColor);

    var art = mcCardArt(c.file);
    var img = document.getElementById('osCardImg');
    img.onerror = function () { this.onerror = null; this.src = 'images/' + (c.file || ''); };
    img.src = art;
    document.getElementById('osBackdrop').style.backgroundImage = 'url("' + art + '")';

    var spd = c.speed || 0, str = c.strength || 0, intl = c.intellect || 0;
    document.getElementById('osCardStrip').innerText = c.name || '';
    document.getElementById('osStatRarity').innerText = cleanRarity;
    document.getElementById('osStatRarity').style.color = rColor;
    document.getElementById('osStatSpd').innerText = spd;
    document.getElementById('osStatStr').innerText = str;
    document.getElementById('osStatInt').innerText = intl;
    document.getElementById('osPower').innerText = mcFmt(spd + str + intl);

    var maxStat = Math.max(100, spd, str, intl);
    [['osBarSpd', spd], ['osBarStr', str], ['osBarInt', intl]].forEach(function (pair) {
        var el = document.getElementById(pair[0]);
        el.style.width = '0%';
        setTimeout(function () { el.style.width = Math.round(pair[1] / maxStat * 100) + '%'; }, 120);
    });

    // Скины
    var list = document.getElementById('osSkinsList');
    mcStopMedia(list);
    var cardSkins = (allSkins || []).filter(function (s) { return s.card_id === c.id; });
    var block = document.getElementById('osSkinsBlock');
    if (!cardSkins.length) {
        block.style.display = 'none';
        list.innerHTML = '';
        return;
    }
    block.style.display = '';
    document.getElementById('osSkinsCount').innerText = cardSkins.length;
    list.innerHTML = cardSkins.map(function (s, i) {
        var isVideo = s.type === 'absolute';
        var owned = (userOwnedSkins || []).indexOf(s.card_id + '_' + s.type) !== -1;
        var media = isVideo
            ? mcSkinVideo(s.file, 'os-skin-media', '')
            : '<img class="os-skin-media" src="' + mcSkinImg(s.file) + '" loading="lazy" onerror="this.onerror=null; this.src=\'images/default.webp\';" alt="">';
        return '<button class="os-skin-tile type-' + s.type + '" style="--i:' + i + '" onclick="openSkinViewer(\'' + mcEsc(s.card_id) + '\', \'' + s.type + '\')">' +
            media +
            '<div class="os-skin-shine"></div>' +
            (isVideo ? '<div class="os-skin-play">' + MC_ICONS.play + '</div>' : '') +
            (owned ? '<div class="os-skin-owned">✓ У вас</div>' : '') +
            '<div class="os-skin-type">' + (MC_SKIN_LABELS[s.type] || s.type) + '</div>' +
            '</button>';
    }).join('');
}

function openSkinViewer(cardId, type) {
    var s = (allSkins || []).find(function (x) { return x.card_id === cardId && x.type === type; });
    if (!s) return;
    var base = allCards.find(function (c) { return c.id === cardId; }) || {};
    mcOpenViewer({
        kind: type === 'absolute' ? 'video' : 'image',
        file: s.file,
        src: mcSkinImg(s.file),
        fallback: 'images/default.webp',
        title: base.name || 'Скин',
        sub: MC_SKIN_LABELS[type] || 'Скин',
        color: mcRarityColor(base.rarity)
    });
}

function openOwnersCardFullscreen() {
    var c = currentModalCard;
    if (!c) return;
    mcOpenViewer({ kind: 'image', src: mcCardArt(c.file), fallback: 'images/' + c.file, title: c.name, sub: c.rarity || '', color: mcRarityColor(c.rarity) });
}

async function openOwnersScreen(page) {
    page = Number(page) || 0;
    if (!currentModalCard) return;
    mcHaptic('light');
    var c = currentModalCard;
    var screen = document.getElementById('ownersScreen');
    var wasOpen = screen.classList.contains('open');

    if (!wasOpen || mcOsKey !== c.id) {
        mcOwnersHeader(c);
        mcOsKey = c.id;
        screen.scrollTop = 0;
    }
    screen.classList.add('open');
    manageBack();

    var container = document.getElementById('osListContent');
    var pag = document.getElementById('osPagination');
    container.innerHTML = new Array(5).join('<div class="os-owner-row skeleton"><div class="sk-circle"></div><div class="sk-line"></div></div>');
    pag.style.display = 'none';
    if (page === 0) {
        document.getElementById('osTotalOwners').innerText = '…';
        document.getElementById('osTotalCopies').innerText = '— копий';
    }

    try {
        var res = await fetch(API_BASE + '/api/card_owners/' + encodeURIComponent(c.id) + '?page=' + page);
        var data = await res.json();
        if (mcOsKey !== c.id) return;
        if (data.success) {
            mcCount(document.getElementById('osTotalOwners'), data.total_unique || 0, 700);
            document.getElementById('osTotalCopies').innerText = mcFmt(data.total_copies || 0) + ' копий';
            renderOwnersList(data);
        } else {
            container.innerHTML = '<div class="os-empty err">Ошибка загрузки</div>';
        }
    } catch (e) {
        container.innerHTML = '<div class="os-empty err">Ошибка соединения</div>';
    }
}

function closeOwnersScreen() {
    var screen = document.getElementById('ownersScreen');
    mcStopMedia(screen);
    screen.classList.remove('open');
    mcOsKey = null;
    manageBack();
}

function renderOwnersList(data) {
    var container = document.getElementById('osListContent');
    if (!data.owners || !data.owners.length) {
        container.innerHTML = '<div class="os-empty">Этой карты пока ни у кого нет.<br><span>Стань первым владельцем ✨</span></div>';
        document.getElementById('osPagination').style.display = 'none';
        return;
    }
    var offset = (data.page || 0) * (data.limit || 15);
    container.innerHTML = data.owners.map(function (player, i) {
        var pos = offset + i + 1;
        var cleanName = mcEsc((player.name || 'Игрок').trim());
        var initial = encodeURIComponent((player.name || 'U').trim().charAt(0).toUpperCase() || 'U');
        var fallbackImg = 'https://placehold.co/150x150/1c1c28/8b5cf6?text=' + initial;
        var avatarSrc = API_BASE + '/api/avatar/' + player.id + '?name=' + encodeURIComponent(player.name || 'U');
        var frameHtml = player.frame_url ? '<img src="' + mcEsc(player.frame_url) + '" class="avatar-frame" onerror="this.style.display=\'none\'">' : '';
        var isMe = String(player.id) === String(userId);
        var cls = 'os-owner-row' + (pos === 1 ? ' top1' : pos <= 3 ? ' top3' : '') + (isMe ? ' is-me' : '');
        return '<div class="' + cls + '" style="--i:' + i + '" onclick="openPublicProfile(' + Number(player.id) + ')">' +
            '<div class="os-pos">' + (pos === 1 ? MC_ICONS.crown : pos) + '</div>' +
            '<div class="top-avatar-wrap os-ava-wrap"><img src="' + avatarSrc + '" class="os-avatar" loading="lazy" onerror="this.onerror=null; this.src=\'' + fallbackImg + '\'">' + frameHtml + '</div>' +
            '<div class="os-name">' + cleanName + (isMe ? '<span class="os-me-tag">ВЫ</span>' : '') + '</div>' +
            '<div class="os-badge">×' + (player.count || 1) + '</div>' +
            '</div>';
    }).join('');

    var pag = document.getElementById('osPagination');
    var totalPages = Math.ceil((data.total_unique || 0) / (data.limit || 15));
    if (totalPages > 1) {
        pag.style.display = 'flex';
        pag.innerHTML = '';
        var btnPrev = document.createElement('button');
        btnPrev.className = 'page-btn';
        btnPrev.innerText = '◀ Назад';
        btnPrev.disabled = (data.page === 0);
        btnPrev.onclick = function () { openOwnersScreen(data.page - 1); };
        var ind = document.createElement('div');
        ind.className = 'page-indicator';
        ind.innerText = (data.page + 1) + ' / ' + totalPages;
        var btnNext = document.createElement('button');
        btnNext.className = 'page-btn';
        btnNext.innerText = 'Вперёд ▶';
        btnNext.disabled = (data.page >= totalPages - 1);
        btnNext.onclick = function () { openOwnersScreen(data.page + 1); };
        pag.appendChild(btnPrev); pag.appendChild(ind); pag.appendChild(btnNext);
    } else {
        pag.style.display = 'none';
    }
}

// Плавный счётчик чисел
function mcCount(el, target, duration) {
    if (!el) return;
    target = Number(target) || 0;
    if (mcReduced() || target < 3) { el.textContent = mcFmt(target); return; }
    duration = duration || 1100;
    var start = performance.now();
    function step(now) {
        var t = Math.min(1, (now - start) / duration);
        var eased = 1 - Math.pow(1 - t, 3);
        el.textContent = mcFmt(Math.round(target * eased));
        if (t < 1 && el.isConnected) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

// =====================================================================
//  5. ВЗРЫВНОЙ ТОП
// =====================================================================
var MC_LB_SWORD = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="m2.75 9.25 1.5 2.5 2 1.5m-4.5 0 1 1m1.5-2.5-1.5 1.5m3-1 8.5-8.5v-2h-2l-8.5 8.5"></path><path d="m10.25 12.25-2.25-2.25m2-2 2.25 2.25m1-1-1.5 2.5-2 1.5m4.5 0-1 1m-1.5-2.5 1.5 1.5m-7.25-5.25-4.25-4.25v-2h2l4.25 4.25"></path></svg>';
var MC_LB_CATS = {
    pvp_season: { sub: 'Победы в текущем сезоне · топ-1 получает рамку «Король сезона»', a: '#f43f5e', b: '#f97316', icon: MC_LB_SWORD },
    pvp:        { sub: 'Победы за всё время', a: '#ef4444', b: '#a855f7', icon: MC_LB_SWORD },
    rank:       { sub: 'Очки ранга — путь к Бессмертному Архонту', a: '#fbbf24', b: '#f97316', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' },
    level:      { sub: 'Уровень ManhwCard Pass', a: '#22c55e', b: '#06b6d4', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></svg>' },
    cards:      { sub: 'Уникальные карты в коллекции', a: '#8b5cf6', b: '#ec4899', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3 2 8l10 5 10-5z"/><path d="M2 12l10 5 10-5"/><path d="M2 16l10 5 10-5"/></svg>' },
    krw:        { sub: 'Самые богатые игроки', a: '#a855f7', b: '#6366f1', icon: '<span class="lb-glyph">₩</span>' },
    bc:         { sub: 'Запасы BattleCoin', a: '#f59e0b', b: '#eab308', icon: '<span class="lb-glyph">Ⓑ</span>' },
    diamond:    { sub: 'Алмазные магнаты', a: '#06b6d4', b: '#3b82f6', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 9l3-5h12l3 5-9 12z"/><path d="M3 9h18M9 4l-2 5 5 12 5-12-2-5"/></svg>' }
};
var mcLbReq = 0;

function mcMoveLbGlider(btn, animate) {
    var g = document.getElementById('lbTabsGlider');
    if (!g || !btn || !btn.offsetWidth) return;
    if (animate === false) g.classList.add('no-anim');
    g.style.setProperty('--x', btn.offsetLeft + 'px');
    g.style.setProperty('--w', btn.offsetWidth + 'px');
    g.classList.add('ready');
    if (animate === false) { void g.offsetWidth; g.classList.remove('no-anim'); }
}

function switchTopCategory(category, btnEl) {
    if (!MC_LB_CATS[category]) category = 'pvp_season';
    mcHaptic('select');
    currentTopCategory = category;
    btnEl = btnEl || document.querySelector('.lb-tab[data-cat="' + category + '"]');
    document.querySelectorAll('.lb-tab').forEach(function (b) { b.classList.toggle('active', b === btnEl); });

    var tabs = document.getElementById('lbTabs');
    if (btnEl && tabs) {
        mcMoveLbGlider(btnEl, true);
        tabs.scrollTo({ left: btnEl.offsetLeft - (tabs.clientWidth - btnEl.offsetWidth) / 2, behavior: 'smooth' });
    }

    var cfg = MC_LB_CATS[category];
    var root = document.getElementById('tab-tops');
    root.style.setProperty('--lb-a', cfg.a);
    root.style.setProperty('--lb-b', cfg.b);
    root.style.setProperty('--lb-a-rgb', mcRgb(cfg.a));
    root.style.setProperty('--lb-b-rgb', mcRgb(cfg.b));
    document.getElementById('topsTimer').style.display = category === 'pvp_season' ? '' : 'none';
    document.getElementById('lbSubtitle').textContent = cfg.sub;
    mcLoadTops(category);
}

function mcLbSkeleton() {
    var pod = '<div class="lb-podium sk">' +
        '<div class="lb-pod p2"><div class="sk-circle big"></div><div class="sk-line"></div><div class="lb-pedestal"></div></div>' +
        '<div class="lb-pod p1"><div class="sk-circle huge"></div><div class="sk-line"></div><div class="lb-pedestal"></div></div>' +
        '<div class="lb-pod p3"><div class="sk-circle big"></div><div class="sk-line"></div><div class="lb-pedestal"></div></div></div>';
    var rows = '';
    for (var i = 0; i < 6; i++) rows += '<div class="lb-row skeleton"><div class="sk-circle"></div><div class="sk-line"></div></div>';
    return pod + '<div class="lb-list">' + rows + '</div>';
}

function mcLbError(title, detail) {
    return '<div class="lb-empty err">' + title +
        (detail ? '<div class="lb-err-detail">' + mcEsc(detail) + '</div>' : '') +
        '<button onclick="mcLoadTops(currentTopCategory)">Повторить</button></div>';
}

async function mcLoadTops(category) {
    var my = ++mcLbReq;
    var container = document.getElementById('topsListContainer');
    container.innerHTML = mcLbSkeleton();
    document.getElementById('lbMe').style.display = 'none';

    var base = API_BASE + '/api/tops/' + encodeURIComponent(category);
    var data = null, lastErr = '';
    // Сначала с позицией игрока, если сервер ответил ошибкой — без неё
    var urls = [base + '?me=' + encodeURIComponent(userId), base];
    for (var i = 0; i < urls.length && !data; i++) {
        try {
            var res = await fetch(urls[i]);
            if (!res.ok) { lastErr = 'HTTP ' + res.status; continue; }
            data = await res.json();
        } catch (e) {
            lastErr = (e && e.message) || String(e);
        }
    }
    if (my !== mcLbReq) return; // пользователь уже переключил категорию
    if (!data) {
        container.innerHTML = mcLbError(lastErr.indexOf('HTTP') === 0 ? 'Сервер ответил ошибкой' : 'Нет связи с сервером', lastErr);
        return;
    }
    if (!data.success) {
        container.innerHTML = mcLbError('Ошибка рейтинга', data.error || '');
        return;
    }
    try {
        mcRenderTops(data.leaderboard || [], data.me);
    } catch (e) {
        console.error('Ошибка отрисовки топа:', e);
        container.innerHTML = mcLbError('Не удалось отрисовать рейтинг', (e && e.message) || String(e));
    }
}

function mcLbValue(p) {
    if (!p) return 0;
    if (p.value != null) return Number(p.value) || 0;
    return parseInt(String(p.score || '').replace(/[^\d]/g, ''), 10) || 0;
}

function mcLbAvatar(p, cls) {
    var name = (p.name || 'Игрок').trim();
    var initial = encodeURIComponent(name.charAt(0).toUpperCase() || 'U');
    var fallbackImg = 'https://placehold.co/150x150/1c1c28/8b5cf6?text=' + initial;
    var src = API_BASE + '/api/avatar/' + p.id + '?name=' + encodeURIComponent(name);
    return '<div class="lb-ava ' + (cls || '') + '">' +
        '<img class="lb-ava-img" src="' + src + '" loading="lazy" onerror="this.onerror=null; this.src=\'' + fallbackImg + '\'" alt="">' +
        (p.frame_url ? '<img class="lb-ava-frame" src="' + mcEsc(p.frame_url) + '" alt="" onerror="this.style.display=\'none\'">' : '') +
        '</div>';
}

function mcLbPodium(p, place) {
    var cfg = MC_LB_CATS[currentTopCategory] || MC_LB_CATS.pvp;
    var isMe = String(p.id) === String(userId);
    var name = mcEsc((p.name || 'Игрок').trim());
    var top = place === 1
        ? '<div class="lb-crown">' + MC_ICONS.crown + '</div><div class="lb-rays"></div>'
        : '';
    return '<div class="lb-pod p' + place + (isMe ? ' is-me' : '') + '" onclick="openPublicProfile(' + Number(p.id) + ')">' +
        top +
        '<div class="lb-pod-ava-wrap"><div class="lb-pod-ring"></div>' + mcLbAvatar(p, 'pod') +
        '<div class="lb-medal">' + place + '</div></div>' +
        '<div class="lb-pod-name">' + name + (p.is_premium ? ' <span class="lb-prem">👑</span>' : '') + '</div>' +
        '<div class="lb-pod-lvl">' + (isMe ? '<span class="lb-me-tag">ВЫ</span>' : 'Lv. ' + (p.level || 1)) + '</div>' +
        '<div class="lb-pod-score"><span class="lb-ico">' + cfg.icon + '</span><span data-count="' + mcLbValue(p) + '">0</span></div>' +
        '<div class="lb-pedestal"><span>' + place + '</span><i class="lb-ped-shine"></i></div>' +
        '</div>';
}

function mcLbRow(p, rank, leaderVal, idx) {
    var cfg = MC_LB_CATS[currentTopCategory] || MC_LB_CATS.pvp;
    var isMe = String(p.id) === String(userId);
    var val = mcLbValue(p);
    var pct = leaderVal > 0 ? Math.max(4, Math.round(val / leaderVal * 100)) : 0;
    return '<div class="lb-row' + (isMe ? ' is-me' : '') + '" style="--i:' + idx + '" onclick="openPublicProfile(' + Number(p.id) + ')">' +
        '<div class="lb-rank">' + rank + '</div>' +
        mcLbAvatar(p, 'row') +
        '<div class="lb-info">' +
            '<div class="lb-name">' + mcEsc((p.name || 'Игрок').trim()) + (p.is_premium ? ' <span class="lb-prem">👑</span>' : '') + (isMe ? '<span class="lb-me-tag">ВЫ</span>' : '') + '</div>' +
            '<div class="lb-meta"><span class="lb-lvl">Lv. ' + (p.level || 1) + '</span><div class="lb-gap"><div style="width:' + pct + '%"></div></div></div>' +
        '</div>' +
        '<div class="lb-score"><span class="lb-ico">' + cfg.icon + '</span>' + mcFmt(val) + '</div>' +
        '</div>';
}

function mcLbSparks() {
    var s = '<div class="lb-sparks">';
    for (var i = 0; i < 16; i++) {
        s += '<i style="left:' + (5 + Math.random() * 90).toFixed(1) + '%;--dl:' + (Math.random() * 4).toFixed(2) + 's;--du:' + (3 + Math.random() * 3).toFixed(2) + 's;--sz:' + (2 + Math.random() * 3).toFixed(1) + 'px"></i>';
    }
    return s + '</div>';
}

function mcRenderTops(list, me) {
    var container = document.getElementById('topsListContainer');
    if (!list || !list.length) {
        container.innerHTML = '<div class="lb-empty">Рейтинг пока пуст.<br><span>Займи первое место первым!</span></div>';
        mcRenderLbMe(me, []);
        return;
    }
    var leaderVal = mcLbValue(list[0]);
    var html = '<div class="lb-podium">' + mcLbSparks();
    [1, 0, 2].forEach(function (i) {
        html += list[i] ? mcLbPodium(list[i], i + 1) : '<div class="lb-pod p' + (i + 1) + ' empty"><div class="lb-pedestal"><span>' + (i + 1) + '</span></div></div>';
    });
    html += '</div><div class="lb-list">';
    list.slice(3).forEach(function (p, idx) { html += mcLbRow(p, idx + 4, leaderVal, idx); });
    html += '</div>';
    container.innerHTML = html;
    container.querySelectorAll('[data-count]').forEach(function (el) { mcCount(el, el.getAttribute('data-count')); });
    MCSound.play('shine');
    mcRenderLbMe(me, list);
}

function mcRenderLbMe(me, list) {
    var box = document.getElementById('lbMe');
    if (!me || !me.rank) { box.style.display = 'none'; return; }
    var cfg = MC_LB_CATS[currentTopCategory] || MC_LB_CATS.pvp;
    var inTop = list.some(function (p) { return String(p.id) === String(userId); });
    var sub;
    if (inTop) sub = me.rank <= 3 ? 'Ты на пьедестале 🔥' : 'Ты в топ-25 — держи позицию!';
    else if (list.length >= 25) sub = 'До топ-25: ещё ' + mcFmt(Math.max(1, mcLbValue(list[list.length - 1]) - (me.value || 0) + 1));
    else sub = 'Поднимайся выше!';
    var myFrame = (typeof allFramesData !== 'undefined' && equippedFrameId !== 'none' && allFramesData[equippedFrameId]) ? allFramesData[equippedFrameId].url : '';
    box.innerHTML =
        '<div class="lb-me-rank"><small>место</small>#' + mcFmt(me.rank) + '</div>' +
        mcLbAvatar({ id: userId, name: userName, frame_url: myFrame }, 'row') +
        '<div class="lb-me-info"><div class="lb-me-title">' + mcEsc(userName) + '</div><div class="lb-me-sub">' + sub + '</div></div>' +
        '<div class="lb-score"><span class="lb-ico">' + cfg.icon + '</span>' + mcFmt(me.value || 0) + '</div>';
    box.style.display = '';
    box.classList.remove('pop'); void box.offsetWidth; box.classList.add('pop');
}

function updateTopsTimerDisplay() {
    var t = Math.max(0, topsSecondsLeft || 0);
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var set = function (id, v) { var el = document.getElementById(id); if (el) el.textContent = v; };
    set('lbTmD', pad(Math.floor(t / 86400)));
    set('lbTmH', pad(Math.floor((t % 86400) / 3600)));
    set('lbTmM', pad(Math.floor((t % 3600) / 60)));
    set('lbTmS', pad(t % 60));
}

// =====================================================================
//  6. ДОСТИЖЕНИЯ
// =====================================================================
var MC_ACH_ICONS = {
    crown: '<path d="M2.5 8.2l4.6 3.6L12 4.6l4.9 7.2 4.6-3.6-2.1 10.6H4.6z"/><path d="M4.6 21h14.8"/>',
    swords: '<path d="M14.5 17.5L3 6V3h3l11.5 11.5"/><path d="M13 19l6-6"/><path d="M16 16l4 4"/><path d="M19 21l2-2"/><path d="M9.5 17.5L21 6V3h-3L6.5 14.5"/><path d="M11 19l-6-6"/><path d="M8 16l-4 4"/><path d="M5 21l-2-2"/>',
    trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>',
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 002.5 2.5z"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M8 15l2.5 2.5L16 13"/>',
    gem: '<path d="M6 3h12l4 6-10 12L2 9z"/><path d="M11 3 8 9l4 12 4-12-3-6"/><path d="M2 9h20"/>',
    coins: '<circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="M16.71 13.88l.7.71-2.82 2.82"/>',
    cards: '<path d="M12 3 2 8l10 5 10-5z"/><path d="M2 12l10 5 10-5"/><path d="M2 16l10 5 10-5"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>',
    star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    dice: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.2" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.2" fill="currentColor"/><circle cx="15.5" cy="8.5" r="1.2" fill="currentColor"/><circle cx="8.5" cy="15.5" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>',
    shield: '<path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5z"/><path d="M9 12l2 2 4-4"/>',
    bag: '<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
    flask: '<path d="M9 3h6"/><path d="M10 3v6L4.3 18.6A2 2 0 0 0 6 21.6h12a2 2 0 0 0 1.7-3L14 9V3"/><path d="M7 15h10"/>',
    chest: '<path d="M21 8v13H3V8"/><rect x="1" y="3" width="22" height="5" rx="1"/><path d="M10 12h4"/>',
    ticket: '<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/><path d="M13 5v2M13 17v2M13 11v2"/>',
    zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
    heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.8 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>',
    repeat: '<path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    mountain: '<path d="M8 3l4 8 5-5 5 15H2z"/>',
    sparkle: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
    infinity: '<path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4zm0 0c2 2.67 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.33-6 4z"/>'
};
var MC_ACH_META = {
    season_king: ['crown', '#fbbf24'], battle_master: ['swords', '#ef4444'], arena_legend: ['trophy', '#f59e0b'],
    year_nonstop: ['calendar', '#22c55e'], battlefield_elite: ['star', '#fbbf24'], relentless: ['flame', '#f97316'],
    mythic_collector: ['gem', '#ef4444'], scenery_master: ['image', '#14b8a6'], legendary_collector: ['gem', '#3b82f6'],
    royale_devoted: ['crown', '#a855f7'], reverse_millionaire: ['coins', '#a855f7'], mad_spendthrift: ['coins', '#f59e0b'],
    diamond_tycoon: ['gem', '#06b6d4'], recruiter: ['users', '#38bdf8'], limited_hunter: ['target', '#ec4899'],
    event_collector: ['ticket', '#f472b6'], card_master: ['cards', '#8b5cf6'], pinnacle_dev: ['mountain', '#22c55e'],
    marathoner: ['zap', '#eab308'], invincible_day: ['shield', '#10b981'], always_active: ['calendar', '#84cc16'],
    bet_king: ['dice', '#fbbf24'], bet_madman: ['dice', '#ef4444'], card_lover: ['heart', '#f43f5e'],
    immortal_archon: ['zap', '#c4b5fd'], trader: ['repeat', '#38bdf8'], hoarder: ['chest', '#d97706'],
    promo_hunter: ['ticket', '#a3e635'], alchemist: ['flask', '#a855f7'], gambler: ['dice', '#f97316'],
    skin_collector: ['sparkle', '#e879f9'], shopaholic: ['bag', '#fb7185'], premium_user: ['crown', '#fbbf24'],
    absolute_legend: ['infinity', '#f0abfc']
};
var MC_REWARD_SVGS = {
    krw: '<span class="ach-rw-glyph" style="color:#c4b5fd">₩</span>',
    battlecoin: '<span class="ach-rw-glyph" style="color:#fbbf24">Ⓑ</span>',
    // системный алмаз — тот же, что в балансе на главной
    diamond: '<svg class="ach-rw-dia" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round">' + MC_DIA_PATH + '</svg>',
    attempts: '<span class="ach-rw-glyph">🎟</span>'
};

function mcAchIcon(id, size) {
    var m = MC_ACH_META[id] || ['trophy', '#a855f7'];
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"' +
        (size ? ' style="width:' + size + 'px;height:' + size + 'px"' : '') + '>' + (MC_ACH_ICONS[m[0]] || MC_ACH_ICONS.trophy) + '</svg>';
}
function mcAchColor(id) { return (MC_ACH_META[id] || ['', '#a855f7'])[1]; }
function mcAchPrestige(a) {
    var r = a.rewards || {};
    return (r.frame_id ? 1000 : 0) + (r.diamond || 0) * 3 + (r.attempts || 0) * 2 + (r.battlecoin || 0) / 50 + (r.krw || 0) / 100;
}

var mcAchData = [];
var mcAchFilter = 'all';
var mcAchMode = 'own';        // own | public
var mcAchPublic = null;       // { id, name, data }
var mcAchClaiming = {};

function mcAchState(a) {
    if (mcAchMode === 'public') return a.earned ? 'claimed' : 'locked';
    if (a.is_claimed) return 'claimed';
    if (a.is_completed) return 'ready';
    return 'progress';
}

async function mcLoadAchievements() {
    try {
        var res = await fetch(API_BASE + '/api/achievements?user_id=' + encodeURIComponent(userId), { headers: authHeaders() });
        var data = await res.json();
        if (data.success) {
            mcAchData = data.achievements || [];
            updateAchSummaryUI();
            return true;
        }
    } catch (e) { console.error('Ошибка загрузки достижений:', e); }
    return false;
}

function mcShowAchSheet() {
    var m = document.getElementById('achievementsModal');
    m.style.display = 'flex';
    m.classList.remove('open');
    void m.offsetWidth;
    m.classList.add('open');
    document.getElementById('achievementsContainer').scrollTop = 0;
    manageBack();
}

function openAchievements() {
    mcHaptic('light');
    MCSound.play('open');
    mcAchMode = 'own';
    mcAchFilter = mcAchData.some(function (a) { return a.is_completed && !a.is_claimed; }) ? 'ready' : 'all';
    document.getElementById('achKicker').textContent = 'ЗАЛ СЛАВЫ';
    document.getElementById('achTitle').textContent = 'Достижения';
    mcShowAchSheet();
    if (mcAchData.length) mcRenderAchievements();
    else document.getElementById('achievementsContainer').innerHTML = mcAchSkeleton();
    mcLoadAchievements().then(function (ok) {
        if (mcAchMode !== 'own') return;
        if (ok) mcRenderAchievements();
        else if (!mcAchData.length) document.getElementById('achievementsContainer').innerHTML =
            '<div class="ach-empty err">Ошибка загрузки. Проверьте соединение.</div>';
    });
}

function openPublicAchievements() {
    if (!mcAchPublic || !mcAchPublic.data) return;
    mcHaptic('light');
    mcAchMode = 'public';
    mcAchFilter = 'all';
    document.getElementById('achKicker').textContent = 'ДОСТИЖЕНИЯ ИГРОКА';
    document.getElementById('achTitle').textContent = mcAchPublic.name || 'Игрок';
    mcShowAchSheet();
    mcRenderAchievements();
}

function closeAchievements() {
    var m = document.getElementById('achievementsModal');
    m.classList.remove('open');
    m.style.display = 'none';
    manageBack();
}
document.getElementById('achievementsModal').addEventListener('click', function (e) {
    if (e.target === this) closeAchievements();
});

function mcAchSkeleton() {
    var s = '';
    for (var i = 0; i < 5; i++) s += '<div class="ach-card skeleton"><div class="sk-square"></div><div class="sk-lines"><div class="sk-line"></div><div class="sk-line short"></div></div></div>';
    return s;
}

function setAchFilter(f) {
    mcHaptic('select');
    mcAchFilter = f;
    mcRenderAchievements();
    document.getElementById('achievementsContainer').scrollTop = 0;
}

function mcRenderAchievements() {
    var list = mcAchMode === 'public' ? ((mcAchPublic && mcAchPublic.data && mcAchPublic.data.achievements) || []) : mcAchData;
    var total = list.length || 0;
    var counts = { claimed: 0, ready: 0, progress: 0, locked: 0 };
    list.forEach(function (a) { counts[mcAchState(a)]++; });

    // Кольцо прогресса
    var pct = total ? Math.round(counts.claimed / total * 100) : 0;
    var ring = document.getElementById('achRingFill');
    var C = 2 * Math.PI * 27;
    ring.style.strokeDasharray = C;
    ring.style.strokeDashoffset = C;
    requestAnimationFrame(function () { ring.style.strokeDashoffset = C * (1 - pct / 100); });
    document.getElementById('achRingTxt').textContent = pct + '%';
    document.getElementById('achSub').innerHTML = mcAchMode === 'public'
        ? 'Открыто <b>' + counts.claimed + '</b> из ' + total
        : 'Получено <b>' + counts.claimed + '</b> из ' + total + (counts.ready ? ' · <span class="ach-sub-ready">🎁 ' + counts.ready + ' ждут</span>' : '');

    // Фильтры
    var filters = mcAchMode === 'public'
        ? [['all', 'Все', total], ['claimed', 'Открыты', counts.claimed], ['locked', 'Закрыты', counts.locked]]
        : [['all', 'Все', total], ['ready', 'Забрать', counts.ready], ['progress', 'В процессе', counts.progress], ['claimed', 'Получены', counts.claimed]];
    if (!filters.some(function (f) { return f[0] === mcAchFilter; })) mcAchFilter = 'all';
    document.getElementById('achFilters').innerHTML = filters.map(function (f) {
        return '<button class="ach-filter' + (mcAchFilter === f[0] ? ' active' : '') + (f[0] === 'ready' && f[2] ? ' hot' : '') +
            '" onclick="setAchFilter(\'' + f[0] + '\')">' + f[1] + ' <span>' + f[2] + '</span></button>';
    }).join('');

    // Сортировка: готовые → в процессе (по %) → полученные
    var order = { ready: 0, progress: 1, claimed: 2, locked: 3 };
    var items = list.filter(function (a) { return mcAchFilter === 'all' || mcAchState(a) === mcAchFilter; })
        .slice().sort(function (a, b) {
            var sa = mcAchState(a), sb = mcAchState(b);
            if (order[sa] !== order[sb]) return order[sa] - order[sb];
            if (sa === 'progress') return (b.progress / b.req) - (a.progress / a.req);
            return mcAchPrestige(b) - mcAchPrestige(a);
        });

    var container = document.getElementById('achievementsContainer');
    if (!items.length) {
        var msg = mcAchFilter === 'ready' ? 'Пока нечего забирать — продолжай играть!' : 'Здесь пока пусто';
        container.innerHTML = '<div class="ach-empty">' + msg + '</div>';
        return;
    }
    container.innerHTML = items.map(function (a, i) { return mcAchCard(a, i); }).join('');
}

function mcAchRewards(r) {
    r = r || {};
    var out = [];
    if (r.frame_id) {
        var fr = (typeof allFramesData !== 'undefined' && allFramesData[r.frame_id]) || null;
        out.push('<span class="ach-rw frame">' + (fr && fr.url ? '<img src="' + mcEsc(fr.url) + '" alt="">' : '🖼') + 'Рамка' + (fr ? ' «' + mcEsc(fr.name) + '»' : '') + '</span>');
    }
    if (r.krw) out.push('<span class="ach-rw">' + MC_REWARD_SVGS.krw + mcFmt(r.krw) + '</span>');
    if (r.battlecoin) out.push('<span class="ach-rw">' + MC_REWARD_SVGS.battlecoin + mcFmt(r.battlecoin) + '</span>');
    if (r.diamond) out.push('<span class="ach-rw">' + MC_REWARD_SVGS.diamond + mcFmt(r.diamond) + '</span>');
    if (r.attempts) out.push('<span class="ach-rw">' + MC_REWARD_SVGS.attempts + mcFmt(r.attempts) + '</span>');
    return out.join('');
}

function mcAchCard(a, i) {
    var st = mcAchState(a);
    var color = mcAchColor(a.id);
    var pct = a.req ? Math.min(100, Math.round((a.progress || 0) / a.req * 100)) : 0;
    var action = '';
    if (st === 'ready') action = '<button class="ach-claim" onclick="claimAchievement(\'' + mcEsc(a.id) + '\', this)">Забрать</button>';
    else if (st === 'claimed') action = '<div class="ach-done">✓</div>';
    else if (st === 'progress') action = '<div class="ach-pct">' + pct + '<small>%</small></div>';
    else action = '<div class="ach-lock">🔒</div>';

    var progHtml = '';
    if (mcAchMode === 'own' && st !== 'claimed') {
        progHtml = '<div class="ach-prog"><div class="ach-prog-bar"><div class="ach-prog-fill" style="width:' + (st === 'ready' ? 100 : pct) + '%"></div></div>' +
            '<div class="ach-prog-txt">' + mcFmt(Math.min(a.progress || 0, a.req)) + ' / ' + mcFmt(a.req) + '</div></div>';
    }
    return '<div class="ach-card st-' + st + '" style="--ac:' + color + ';--i:' + Math.min(i, 12) + '">' +
        '<div class="ach-ico">' + mcAchIcon(a.id) + (st === 'claimed' ? '<span class="ach-ico-check">✓</span>' : '') + '</div>' +
        '<div class="ach-body">' +
            '<div class="ach-card-title">' + mcEsc(a.title) + '</div>' +
            '<div class="ach-card-desc">' + mcEsc(a.desc) + '</div>' +
            '<div class="ach-rewards">' + mcAchRewards(a.rewards) + '</div>' +
            progHtml +
        '</div>' +
        '<div class="ach-action">' + action + '</div>' +
        '</div>';
}

function mcConfetti(anchor) {
    if (!anchor || mcReduced()) return;
    var r = anchor.getBoundingClientRect();
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    var colors = ['#fbbf24', '#a855f7', '#22d3ee', '#f43f5e', '#4ade80', '#ffffff'];
    for (var i = 0; i < 28; i++) {
        var p = document.createElement('i');
        p.className = 'ach-confetti';
        var ang = Math.random() * Math.PI * 2;
        var dist = 60 + Math.random() * 110;
        p.style.left = cx + 'px';
        p.style.top = cy + 'px';
        p.style.background = colors[i % colors.length];
        p.style.setProperty('--tx', Math.cos(ang) * dist + 'px');
        p.style.setProperty('--ty', (Math.sin(ang) * dist - 40) + 'px');
        p.style.setProperty('--rot', (Math.random() * 720 - 360) + 'deg');
        document.body.appendChild(p);
        (function (el) { setTimeout(function () { el.remove(); }, 1100); })(p);
    }
}

async function claimAchievement(achievId, btn) {
    if (mcAchClaiming[achievId]) return;
    mcAchClaiming[achievId] = true;
    if (btn) { btn.disabled = true; btn.classList.add('loading'); btn.textContent = '…'; }
    mcHaptic('heavy');
    try {
        var res = await fetch(API_BASE + '/api/claim_achievement', {
            method: 'POST',
            headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
            body: JSON.stringify({ user_id: userId, achiev_id: achievId })
        });
        var data = await res.json();
        if (data.success) {
            mcHaptic('success');
            MCSound.play('success');
            mcConfetti(btn);
            var item = mcAchData.find(function (a) { return a.id === achievId; });
            if (item) { item.is_claimed = true; item.is_completed = true; item.progress = item.req; }
            showToast('Достижение получено 🏆', String(data.message || '').replace(/^Награда получена:\s*/, ''));
            setTimeout(function () { if (mcAchMode === 'own') mcRenderAchievements(); }, 350);
            updateAchSummaryUI();
            if (typeof fetchProfile === 'function') fetchProfile();
            if (typeof loadUserFrames === 'function') loadUserFrames();
            // «Абсолютная легенда» зависит от остальных — тихо пересчитываем
            setTimeout(function () { mcLoadAchievements().then(function (ok) { if (ok && mcAchMode === 'own' && document.getElementById('achievementsModal').style.display === 'flex') mcRenderAchievements(); }); }, 1200);
        } else {
            mcHaptic('error');
            MCSound.play('error');
            tg.showAlert(data.message || 'Произошла ошибка');
            if (btn) { btn.disabled = false; btn.classList.remove('loading'); btn.textContent = 'Забрать'; }
        }
    } catch (e) {
        tg.showAlert('Ошибка соединения с сервером');
        if (btn) { btn.disabled = false; btn.classList.remove('loading'); btn.textContent = 'Забрать'; }
    } finally {
        mcAchClaiming[achievId] = false;
    }
}

// Витрина достижений (свой профиль, публичный профиль, главное меню)
function mcAchShowcase(prefix, earnedList, total, readyCount) {
    var countEl = document.getElementById(prefix + 'AchCount');
    var fillEl = document.getElementById(prefix + 'AchFill');
    var badgesEl = document.getElementById(prefix + 'AchBadges');
    if (!countEl || !badgesEl) return;
    var earned = earnedList.length;
    countEl.textContent = earned + ' / ' + total;
    if (fillEl) fillEl.style.width = (total ? Math.round(earned / total * 100) : 0) + '%';

    var top = earnedList.slice().sort(function (a, b) { return mcAchPrestige(b) - mcAchPrestige(a); });
    var shown = top.slice(0, 6);
    var html = '';
    if (readyCount) html += '<div class="ps-ach-ready">🎁<b>' + readyCount + '</b></div>';
    html += shown.map(function (a, i) {
        return '<div class="ps-ach-badge" style="--ac:' + mcAchColor(a.id) + ';--i:' + i + '" title="' + mcEsc(a.title) + '">' + mcAchIcon(a.id) + '</div>';
    }).join('');
    if (top.length > shown.length) html += '<div class="ps-ach-more">+' + (top.length - shown.length) + '</div>';
    if (!earned && !readyCount) html = '<div class="ps-ach-empty">' + (prefix === 'pub' ? 'Игрок ещё не открыл достижений' : 'Пока пусто — открой первое достижение!') + '</div>';
    badgesEl.innerHTML = html;
}

function updateAchSummaryUI() {
    if (!mcAchData.length) return;
    var claimed = mcAchData.filter(function (a) { return a.is_claimed; });
    var ready = mcAchData.filter(function (a) { return a.is_completed && !a.is_claimed; }).length;
    mcAchShowcase('ps', claimed, mcAchData.length, ready);
    var badge = document.getElementById('achMenuBadge');
    var sub = document.getElementById('achMenuSub');
    if (badge) { badge.style.display = ready ? '' : 'none'; badge.textContent = ready; }
    if (sub) sub.innerHTML = ready ? '<span class="ach-sub-ready">🎁 Готово: ' + ready + '</span>' : 'Открыто ' + claimed.length + ' / ' + mcAchData.length;
}

function resetPublicAchBox() {
    mcAchPublic = null;
    var box = document.getElementById('pubAchBox');
    if (box) box.style.display = '';
    var c = document.getElementById('pubAchCount'); if (c) c.textContent = '…';
    var f = document.getElementById('pubAchFill'); if (f) f.style.width = '0%';
    var b = document.getElementById('pubAchBadges');
    if (b) b.innerHTML = '<div class="ps-ach-badge sk"></div><div class="ps-ach-badge sk"></div><div class="ps-ach-badge sk"></div>';
}

async function loadPublicAchievements(targetId, name) {
    mcAchPublic = { id: targetId, name: name, data: null };
    try {
        var res = await fetch(API_BASE + '/api/public_achievements/' + encodeURIComponent(targetId));
        if (!res.ok) throw new Error('HTTP ' + res.status);
        var data = await res.json();
        if (!mcAchPublic || mcAchPublic.id !== targetId || !data.success) return;
        mcAchPublic.data = data;
        var earned = (data.achievements || []).filter(function (a) { return a.earned; });
        mcAchShowcase('pub', earned, (data.achievements || []).length, 0);
    } catch (e) {
        // Бэкенд ещё не обновлён — просто прячем блок
        var box = document.getElementById('pubAchBox');
        if (box && mcAchPublic && mcAchPublic.id === targetId) box.style.display = 'none';
    }
}

// Подгружаем достижения в фоне, чтобы бейдж «готово» был виден сразу
setTimeout(mcLoadAchievements, 1500);

// =====================================================================
//  7. СИСТЕМНАЯ КНОПКА «НАЗАД» (единый стек слоёв)
// =====================================================================
function mcIsOpen(id) { var e = document.getElementById(id); return !!(e && e.classList.contains('open')); }
function mcIsDisp(id, v) { var e = document.getElementById(id); return !!(e && e.style.display === v); }

var MC_BACK_LAYERS = [
    { open: function () { return typeof isWorkshopOpen === 'function' && isWorkshopOpen(); }, close: function () { workshopBack(); } },
    { open: function () { return mcIsOpen('mediaViewer'); }, close: function () { mcCloseViewer(); } },
    { open: function () { return mcIsOpen('duelArena'); }, close: function () { closeDuelArena(); } },
    { open: function () { return mcIsOpen('frameShopPreviewSheet'); }, close: function () { closeFrameShopPreview(); } },
    { open: function () { return mcIsOpen('buyAttemptsModal'); }, close: function () { closeBuyAttemptsModal(); } },
    { open: function () { return mcIsOpen('taskSheet'); }, close: function () { closeTaskSheet(); } },
    { open: function () { return mcIsDisp('achievementsModal', 'flex'); }, close: function () { closeAchievements(); } },
    { open: function () { return mcIsOpen('favSystemSheet'); }, close: function () { closeFavSystem(); } },
    { open: function () { return mcIsOpen('titleSystemSheet'); }, close: function () { closeTitleSystem(); } },
    { open: function () { return mcIsOpen('bgSystemSheet'); }, close: function () { closeBgSystem(); } },
    { open: function () { return mcIsOpen('frameSystemSheet'); }, close: function () { closeFrameSystem(); } },
    { open: function () { return mcIsOpen('ownersScreen'); }, close: function () { closeOwnersScreen(); } },
    { open: function () { return mcIsOpen('cardModal'); }, close: function () { closeModal(); } },
    { open: function () { return mcIsOpen('dailyModal'); }, close: function () { closeDailyModal(); } },
    { open: function () { return mcIsOpen('publicProfileScreen'); }, close: function () { closePublicProfile(); } },
    { open: function () { return mcIsOpen('fullProfileScreen'); }, close: function () { closeProfileModal(); } },
    { open: function () { return mcIsOpen('earnScreen'); }, close: function () { closeEarnModal(); } },
    { open: function () { return mcIsOpen('passScreen'); }, close: function () { closePassModal(); } },
    { open: function () { return mcIsDisp('collDetailView', 'block'); }, close: function () { backToUniverses(); } },
    { open: function () { return mcIsOpen('tierAnalytic'); }, close: function () { closeTierCard(); } },
    { open: function () { return mcIsOpen('tierScreen'); }, close: function () { closeTierScreen(); } }
];

function mcLayerOpen(l) { try { return !!l.open(); } catch (e) { return false; } }

function manageBack() {
    if (!tg.BackButton) return;
    if (MC_BACK_LAYERS.some(mcLayerOpen)) tg.BackButton.show();
    else tg.BackButton.hide();
}

if (tg.BackButton && tg.BackButton.onClick) {
    tg.BackButton.onClick(function () {
        for (var i = 0; i < MC_BACK_LAYERS.length; i++) {
            if (mcLayerOpen(MC_BACK_LAYERS[i])) {
                try { MC_BACK_LAYERS[i].close(); } catch (e) { console.error(e); }
                break;
            }
        }
        manageBack();
    });
}

// Закрытие по тапу на тёмный фон для шторок, где этого не было
['frameSystemSheet', 'frameShopPreviewSheet'].forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('click', function (e) {
        if (e.target !== this) return;
        if (id === 'frameSystemSheet') closeFrameSystem(); else closeFrameShopPreview();
    });
});

// =====================================================================
//  8. ЗВУКИ ИНТЕРФЕЙСА (синтез через Web Audio — никаких файлов)
// =====================================================================
var MCSound = (function () {
    var ctx = null, master = null, noiseBuf = null, on = true, last = {};
    try { on = localStorage.getItem('mc_sound') !== '0'; } catch (e) {}

    function getCtx() {
        if (!on) return null;
        if (!ctx) {
            var C = window.AudioContext || window.webkitAudioContext;
            if (!C) return null;
            try { ctx = new C(); } catch (e) { return null; }
            master = ctx.createGain();
            master.gain.value = 0.7;
            var comp = ctx.createDynamicsCompressor();
            master.connect(comp);
            comp.connect(ctx.destination);
        }
        if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
        return ctx;
    }
    function env(g, t, a, peak, d) {
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(peak, t + a);
        g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
    }
    function tone(t, f, dur, o) {
        o = o || {};
        var osc = ctx.createOscillator(), g = ctx.createGain();
        osc.type = o.type || 'sine';
        osc.frequency.setValueAtTime(f, t);
        if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + dur);
        env(g, t, o.a || 0.005, o.vol || 0.15, dur);
        osc.connect(g); g.connect(master);
        osc.start(t); osc.stop(t + (o.a || 0.005) + dur + 0.05);
    }
    function noise(t, dur, o) {
        o = o || {};
        if (!noiseBuf) {
            noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
            var d = noiseBuf.getChannelData(0);
            for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        }
        var src = ctx.createBufferSource();
        src.buffer = noiseBuf;
        var f = ctx.createBiquadFilter();
        f.type = o.filter || 'bandpass';
        f.Q.value = o.q || 1;
        f.frequency.setValueAtTime(o.f1 || 1200, t);
        if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t + dur);
        var g = ctx.createGain();
        env(g, t, o.a || 0.01, o.vol || 0.12, dur);
        src.connect(f); f.connect(g); g.connect(master);
        src.start(t, Math.random() * 0.4);
        src.stop(t + dur + 0.1);
    }
    function arp(t, notes, step, o) {
        notes.forEach(function (n, i) { tone(t + i * step, n, (o && o.dur) || 0.3, o); });
    }
    var N = { G4: 392, C5: 523.25, E5: 659.25, G5: 783.99, A5: 880, B5: 987.77, C6: 1046.5, D6: 1174.66, E6: 1318.5, G6: 1568, C7: 2093 };

    var S = {
        tap:     function (t) { tone(t, 1150, 0.045, { to: 720, vol: 0.07 }); },
        tick:    function (t) { tone(t, 1900, 0.018, { vol: 0.05, type: 'triangle' }); },
        open:    function (t) { tone(t, 420, 0.13, { to: 860, vol: 0.06, type: 'triangle' }); noise(t, 0.12, { f1: 900, f2: 3200, vol: 0.025 }); },
        flip:    function (t) { noise(t, 0.3, { f1: 3400, f2: 650, q: 0.6, vol: 0.12, a: 0.05 }); noise(t + 0.2, 0.1, { filter: 'lowpass', f1: 420, vol: 0.1 }); },
        pop:     function (t) { tone(t, 620, 0.08, { to: 1240, vol: 0.07 }); },
        shine:   function (t) { arp(t, [N.E6, N.G6, N.C7], 0.05, { vol: 0.035, dur: 0.25, type: 'triangle' }); },
        coin:    function (t) { tone(t, N.B5, 0.07, { vol: 0.1, type: 'triangle' }); tone(t + 0.07, N.E6, 0.3, { vol: 0.1, type: 'triangle' }); },
        success: function (t) {
            arp(t, [N.C6, N.E6, N.G6, N.C7], 0.075, { vol: 0.09, dur: 0.35, type: 'triangle' });
            noise(t + 0.25, 0.4, { filter: 'highpass', f1: 6000, vol: 0.03 });
        },
        error:   function (t) { tone(t, 230, 0.14, { to: 170, vol: 0.06, type: 'sawtooth' }); tone(t + 0.13, 180, 0.18, { to: 130, vol: 0.05, type: 'sawtooth' }); },
        whoosh:  function (t) { noise(t, 0.55, { f1: 300, f2: 4200, q: 0.8, vol: 0.12, a: 0.22 }); },
        portal:  function (t) { noise(t, 0.9, { f1: 200, f2: 2600, q: 0.7, vol: 0.12, a: 0.35 }); tone(t, 110, 0.9, { to: 330, vol: 0.06, type: 'triangle', a: 0.3 }); },
        land:    function (t) { tone(t, 210, 0.07, { to: 110, vol: 0.08 }); noise(t, 0.05, { filter: 'lowpass', f1: 900, vol: 0.05 }); },
        thud:    function (t) { tone(t, 140, 0.16, { to: 60, vol: 0.18 }); noise(t, 0.1, { filter: 'lowpass', f1: 500, vol: 0.08 }); },
        rumble:  function (t) { noise(t, 0.5, { filter: 'lowpass', f1: 160, vol: 0.2, a: 0.05 }); tone(t, 70, 0.5, { vol: 0.12 }); },
        win:     function (t) {
            arp(t, [N.G5, N.C6, N.E6], 0.09, { vol: 0.08, dur: 0.25, type: 'triangle' });
            [N.C6, N.E6, N.G6].forEach(function (f) { tone(t + 0.3, f, 0.7, { vol: 0.05, type: 'triangle' }); });
        },
        reveal:  function (t, rarity) {
            var r = String(rarity || '');
            if (r.indexOf('Божест') !== -1) {
                tone(t, 90, 0.8, { to: 38, vol: 0.3 });
                noise(t, 0.6, { filter: 'lowpass', f1: 300, vol: 0.18 });
                arp(t + 0.12, [N.C6, N.E6, N.G6, N.C7, N.E6 * 2], 0.06, { vol: 0.07, dur: 0.5, type: 'triangle' });
            } else if (r.indexOf('Мифич') !== -1) {
                tone(t, 120, 0.4, { to: 60, vol: 0.16 });
                arp(t + 0.05, [N.A5, N.C6, N.E6, N.A5 * 2], 0.06, { vol: 0.07, dur: 0.4, type: 'triangle' });
            } else if (r.indexOf('Легенд') !== -1) {
                arp(t, [N.G5, N.B5, N.D6, N.G6], 0.06, { vol: 0.07, dur: 0.3, type: 'triangle' });
            } else if (r.indexOf('Эпич') !== -1) {
                arp(t, [N.E5, N.G5, N.C6], 0.06, { vol: 0.07, dur: 0.25, type: 'triangle' });
            } else {
                tone(t, N.C6, 0.15, { vol: 0.06, type: 'triangle' });
            }
        }
    };

    function play(name, arg) {
        if (!on || !S[name]) return;
        var now = (window.performance && performance.now()) || Date.now();
        var gap = name === 'tick' ? 28 : 45;
        if (last[name] && now - last[name] < gap) return;
        last[name] = now;
        var c = getCtx();
        if (!c) return;
        try { S[name](c.currentTime + 0.01, arg); } catch (e) {}
    }
    function setOn(v) {
        on = !!v;
        try { localStorage.setItem('mc_sound', on ? '1' : '0'); } catch (e) {}
        if (!on && ctx && ctx.state === 'running') { try { ctx.suspend(); } catch (e) {} }
    }
    // iOS разрешает звук только после касания — «будим» звуковой движок на первом тапе
    ['touchend', 'pointerdown', 'click'].forEach(function (ev) {
        document.addEventListener(ev, function () { if (on) getCtx(); }, { capture: true, passive: true });
    });
    return { play: play, isOn: function () { return on; }, setOn: setOn };
})();

// ---------- Переключатель звука на главной ----------
function mcRenderSoundToggle() {
    var on = MCSound.isOn();
    var card = document.getElementById('sndToggleCard');
    if (!card) return;
    card.classList.toggle('on', on);
    var sub = document.getElementById('sndToggleSub');
    if (sub) sub.textContent = on ? 'Кнопки, анимации, награды' : 'Выключены';
    var ico = document.getElementById('sndToggleIco');
    if (ico) ico.innerHTML = on ? MC_ICONS.soundOn : MC_ICONS.soundOff;
}
function toggleUiSound() {
    MCSound.setOn(!MCSound.isOn());
    mcHaptic('select');
    mcRenderSoundToggle();
    if (MCSound.isOn()) MCSound.play('success');
}
mcRenderSoundToggle();

// ---------- Тихий «клик» на любые кнопки ----------
document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    var el = t.closest('button, a, [onclick], .card, .lb-row, .lb-pod, .os-skin-tile, .os-owner-row');
    if (!el) return;
    if (el.closest('.bottom-nav, #summonGrid, #packCardWrapper, [data-snd="off"]')) return;
    if (el.id === 'wheelSpinBtn' || el.id === 'sndToggleCard') return;
    MCSound.play('tap');
}, true);

// ---------- Подключаем звуки к существующим функциям ----------
function mcWrap(name, before, after) {
    var orig = window[name];
    if (typeof orig !== 'function' || orig.__mcWrapped) return;
    var wrapped = function () {
        var args = arguments, ctxThis = this;
        try { if (before) before.apply(ctxThis, args); } catch (e) {}
        var r = orig.apply(ctxThis, args);
        try { if (after) after.apply(ctxThis, args); } catch (e) {}
        return r;
    };
    wrapped.__mcWrapped = true;
    window[name] = wrapped;
}

mcWrap('startEpicSummonSequence', function () { MCSound.play('portal'); });
mcWrap('spawnSummonCard', null, function () { MCSound.play('land'); });
mcWrap('showQuickResults', function () { MCSound.play('shine'); });
mcWrap('syncSummon', function () { MCSound.play('tick'); });
mcWrap('startPackSequence', function () { MCSound.play('open'); });
mcWrap('openSystemPack', function () { MCSound.play('rumble'); });
mcWrap('clickToFlipCard', function () {
    if (isCardFlipped || !currentPackData) return;
    if (packTapCount + 1 < 3) MCSound.play('thud');
    else { var r = currentPackData.card_rarity; setTimeout(function () { MCSound.play('reveal', r); }, 60); }
});
mcWrap('showToast', function () { MCSound.play('pop'); });
mcWrap('showPremiumToast', function () { MCSound.play('success'); });
mcWrap('openDailyModal', function () { MCSound.play('open'); });

// Переворот карт в сцене призыва: звук по редкости
(function () {
    var grid = document.getElementById('summonGrid');
    if (!grid) return;
    grid.addEventListener('click', function (e) {
        var card = e.target.closest && e.target.closest('.summon-card');
        if (!card || card.classList.contains('flipped')) return;
        var idx = Array.prototype.indexOf.call(grid.children, card);
        var data = (summonedCardsData || [])[idx] || {};
        MCSound.play('whoosh');
        setTimeout(function () { MCSound.play('reveal', data.rarity); }, 280);
    }, true);
})();

// Колесо удачи: щелчки по секторам в такт вращению + фанфары на приз
function mcWheelAngle(el) {
    try {
        var t = getComputedStyle(el).transform;
        if (t && t !== 'none') {
            var v = t.replace(/^matrix(3d)?\(|\)$/g, '').split(',').map(parseFloat);
            return Math.atan2(v[1], v[0]) * 180 / Math.PI;
        }
        var bv = el.transform && el.transform.baseVal;
        if (bv && bv.numberOfItems) { var m = bv.consolidate().matrix; return Math.atan2(m.b, m.a) * 180 / Math.PI; }
    } catch (e) {}
    return 0;
}
function mcTrackWheel() {
    var els = [document.getElementById('wheelRotor'), document.querySelector('.wheel-svg')].filter(Boolean);
    if (!els.length || !window.requestAnimationFrame) return;
    var prev = els.map(mcWheelAngle);
    var start = performance.now(), lastMove = start, moved = false, total = 0, sector = 0;
    function frame(now) {
        var delta = 0;
        els.forEach(function (el, i) {
            var a = mcWheelAngle(el), d = a - prev[i];
            if (d > 180) d -= 360; else if (d < -180) d += 360;
            delta += Math.abs(d); prev[i] = a;
        });
        if (delta > 0.05) { moved = true; lastMove = now; }
        total += delta;
        var s = Math.floor(total / 36);
        if (s !== sector) { sector = s; MCSound.play('tick'); }
        var done = (moved && now - lastMove > 500) || (!moved && now - start > 2500) || now - start > 12000;
        if (!done) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
}
window.addEventListener('load', function () {
    mcWrap('spinWheel', function () {
        var btn = document.getElementById('wheelSpinBtn');
        if (btn && btn.disabled) return;
        MCSound.play('whoosh');
        setTimeout(mcTrackWheel, 30);
    });
    var ov = document.getElementById('wheelPrizeOverlay');
    if (ov && window.MutationObserver) {
        var shown = false;
        new MutationObserver(function () {
            var now = ov.classList.length > 1 || (ov.style.display && ov.style.display !== 'none');
            if (now && !shown) MCSound.play('win');
            shown = !!now;
        }).observe(ov, { attributes: true, attributeFilter: ['class', 'style'] });
    }
});

// =====================================================================
//  9. ПОКУПКА КРУТОК — новая витрина
// =====================================================================
var mcBuySel = -1;
var mcBuyBusy = false;

function mcPlural(n, forms) {
    n = Math.abs(n) % 100;
    var n1 = n % 10;
    if (n > 10 && n < 20) return forms[2];
    if (n1 > 1 && n1 < 5) return forms[1];
    if (n1 === 1) return forms[0];
    return forms[2];
}
function mcBuyPacks() { return currentBuyCurrency === 'dia' ? BUY_PACKS_DIA_DATA : BUY_PACKS_KRW_DATA; }
function mcBuyIcon() { return currentBuyCurrency === 'dia' ? MC_SYS.dia : MC_SYS.krw; }
function mcBuyBalance() { return currentBuyCurrency === 'dia' ? mcBal.dia : mcBal.krw; }

function openBuyAttemptsModal() {
    mcHaptic('medium');
    MCSound.play('open');
    document.getElementById('buyAttemptsModal').classList.add('open');
    manageBack();
    switchBuyCurrency(currentBuyCurrency || 'krw', true);
}

function closeBuyAttemptsModal() {
    mcHaptic('select');
    document.getElementById('buyAttemptsModal').classList.remove('open');
    manageBack();
}

function switchBuyCurrency(curr, silent) {
    currentBuyCurrency = curr === 'dia' ? 'dia' : 'krw';
    if (!silent) mcHaptic('select');
    mcBuySel = -1;
    var tabs = document.getElementById('bxTabs');
    if (tabs) tabs.setAttribute('data-cur', currentBuyCurrency);
    document.getElementById('tabBuyKrw').classList.toggle('active', currentBuyCurrency === 'krw');
    document.getElementById('tabBuyDia').classList.toggle('active', currentBuyCurrency === 'dia');
    mcRenderBuyPacks();
}

function mcRenderBuyBalances() {
    var set = function (id, v) { var el = document.getElementById(id); if (el) el.textContent = v; };
    set('bxBalKrw', mcFmt(mcBal.krw));
    set('bxBalDia', mcFmt(mcBal.dia));
    set('bxHave', mcFmt(mcBal.att));
}

function mcRenderBuyPacks() {
    mcRenderBuyBalances();
    var grid = document.getElementById('buyPacksGrid');
    var packs = mcBuyPacks();
    var base = packs[0].price / packs[0].attempts;
    var bal = mcBuyBalance();
    var best = packs.length - 1;
    grid.innerHTML = packs.map(function (p, i) {
        var bonus = Math.round((p.attempts * base / p.price - 1) * 100);
        var cls = 'bx-pack' + (i === best ? ' best' : '') + (bal < p.price ? ' cant' : '') + (i === mcBuySel ? ' selected' : '');
        var stack = '';
        for (var k = 0; k < Math.min(4, i + 1); k++) stack += '<span style="--k:' + k + '">🎟</span>';
        return '<button class="' + cls + '" style="--i:' + i + '" onclick="mcSelectBuyPack(' + i + ')">' +
            (i === best ? '<div class="bx-ribbon">ЛУЧШАЯ ЦЕНА</div>' : (bonus > 0 ? '<div class="bx-bonus">+' + bonus + '%</div>' : '')) +
            '<div class="bx-stack">' + stack + '</div>' +
            '<div class="bx-amt">+' + p.attempts + '</div>' +
            '<div class="bx-lbl">' + mcPlural(p.attempts, ['крутка', 'крутки', 'круток']) + '</div>' +
            '<div class="bx-price">' + mcBuyIcon() + '<span>' + mcFmt(p.price) + '</span></div>' +
            '<div class="bx-check">✓</div>' +
            '</button>';
    }).join('');
    mcUpdateBuyCta();
}

function mcSelectBuyPack(i) {
    mcBuySel = (mcBuySel === i) ? -1 : i;
    mcHaptic('select');
    MCSound.play('tick');
    document.querySelectorAll('#buyPacksGrid .bx-pack').forEach(function (el, k) {
        el.classList.toggle('selected', k === mcBuySel);
    });
    mcUpdateBuyCta();
}

function mcUpdateBuyCta(state) {
    var cta = document.getElementById('bxCta');
    if (!cta) return;
    cta.className = 'bx-cta' + (state ? ' ' + state : '');
    var packs = mcBuyPacks();
    var p = packs[mcBuySel];
    if (state === 'done') return;
    if (!p) {
        cta.disabled = true;
        cta.innerHTML = 'Выберите набор';
        return;
    }
    var bal = mcBuyBalance();
    if (bal < p.price) {
        cta.disabled = true;
        cta.classList.add('cant');
        cta.innerHTML = 'Не хватает ' + mcBuyIcon() + ' ' + mcFmt(p.price - bal);
        return;
    }
    cta.disabled = !!state;
    cta.innerHTML = state === 'loading'
        ? '<span class="bx-spin"></span> Покупаем…'
        : 'Купить +' + p.attempts + ' ' + mcPlural(p.attempts, ['крутку', 'крутки', 'круток']) + ' за ' + mcBuyIcon() + ' ' + mcFmt(p.price);
}

async function confirmBuyAttempts() {
    if (mcBuyBusy || mcBuySel < 0) return;
    var packs = mcBuyPacks();
    var p = packs[mcBuySel];
    if (!p || mcBuyBalance() < p.price) return;
    mcBuyBusy = true;
    mcHaptic('heavy');
    mcUpdateBuyCta('loading');
    try {
        var res = await fetch(API_BASE + '/api/buy_attempts/' + userId, {
            method: 'POST',
            headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
            body: JSON.stringify({ currency: currentBuyCurrency, pack_index: mcBuySel })
        });
        var data = await res.json();
        if (data.success) {
            var got = data.bought_attempts || p.attempts;
            if (data.new_krw == null) data.new_krw = currentBuyCurrency === 'krw' ? mcBal.krw - p.price : mcBal.krw;
            if (data.new_diamond == null) data.new_diamond = currentBuyCurrency === 'dia' ? mcBal.dia - p.price : mcBal.dia;
            if (data.new_attempts == null) data.new_attempts = mcBal.att + got;
            mcHaptic('success');
            MCSound.play('coin');
            mcBal.krw = data.new_krw; mcBal.dia = data.new_diamond; mcBal.att = data.new_attempts;
            document.getElementById('valKrw').innerText = formatBal(data.new_krw);
            document.getElementById('valDiamond').innerText = formatBal(data.new_diamond);
            document.getElementById('shopAttemptsBal').innerText = data.new_attempts;
            if (typeof refreshSummonCostState === 'function') refreshSummonCostState();
            var cta = document.getElementById('bxCta');
            mcConfetti(cta);
            mcUpdateBuyCta('done');
            cta.innerHTML = '✓ Получено +' + got + ' ' + mcPlural(got, ['крутка', 'крутки', 'круток']);
            showToast('Успешно!', 'Приобретено +' + got + ' ' + mcPlural(got, ['крутка', 'крутки', 'круток']) + '!');
            setTimeout(function () { mcBuyBusy = false; mcRenderBuyPacks(); }, 1300);
            fetchProfile();
            return;
        }
        MCSound.play('error');
        tg.showAlert(data.error || data.detail || 'Не удалось купить');
    } catch (e) {
        MCSound.play('error');
        tg.showAlert('Ошибка соединения с сервером');
    }
    mcBuyBusy = false;
    mcUpdateBuyCta();
}