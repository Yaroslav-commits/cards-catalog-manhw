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
        "lee_jinson", "kim_gapryeon", "beakcheon", "antares", 
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

        function switchTab(tabId, btnElement) {
            if (tg.HapticFeedback && tg.HapticFeedback.selectionChanged) {
                tg.HapticFeedback.selectionChanged();
            }
            document.querySelectorAll('.tab-content').forEach(function(tab) { tab.classList.remove('active'); });
            document.querySelectorAll('.nav-btn').forEach(function(btn) { btn.classList.remove('active'); });
            document.getElementById('tab-' + tabId).classList.add('active');
            btnElement.classList.add('active');

            // --- НОВОЕ: Загружаем топы только при первом переходе на вкладку ---
            if (tabId === 'tops' && !topsTimerInterval) {
                loadTopsTimer();
                switchTopCategory('pvp_season', document.getElementById('btnTopPvpSeason'));
            }
        }

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
                    
                    document.getElementById('valKrw').innerText = data.krw;
                    document.getElementById('valDiamond').innerText = data.diamond;
                    document.getElementById('valBc').innerText = data.battlecoin;
                    if (document.getElementById('shopAttemptsBal')) {
                        document.getElementById('shopAttemptsBal').innerText = data.attempts || 0;
                    }
                    
                    userOwnedCards = data.owned_cards || [];
                    document.getElementById('valCards').innerText = userOwnedCards.length;

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
                        var icon = isMythic ? '👑' : '📦';
                        innerHtml = '<div class="d-day">' + dayNum + '</div><div class="d-icon">' + icon + '</div><div class="d-val">Pack</div>';
                    } else {
                        var valText = r.krw;
                        if(r.dia) valText += '<br>+' + r.dia + '💎';
                        innerHtml = '<div class="d-day">' + dayNum + '</div><div class="d-icon">💴</div><div class="d-val">' + valText + '</div>';
                    }
                }

                grid.innerHTML += '<div class="' + classes + '">' + innerHtml + '</div>';
            });

            // Рендер кнопок в зависимости от статуса пропущенных дней
            var footerContainer = document.getElementById('dailyFooterContainer');
            if (canClaimDaily) {
                if (needsRecovery) {
                    footerContainer.innerHTML = 
                        '<button class="daily-footer-btn active recover" onclick="claimDailyBonus(\'recover\')">Восстановить стрик (10 💎)</button>' +
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
            document.getElementById('dailyModal').classList.add('open');
        }
        function closeDailyModal() {
            document.getElementById('dailyModal').classList.remove('open');
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
    
    if (tab === 'cards') {
        btnCards.classList.add('active');
        btnSkins.classList.remove('active');
        slider.style.transform = 'translateX(0)';
        
        document.getElementById('sortFilter').style.display = 'block';
        document.getElementById('styleFilter').style.display = 'block';
        document.getElementById('exclusiveFilterBtn').style.display = 'flex';
    } else {
        btnCards.classList.remove('active');
        btnSkins.classList.add('active');
        slider.style.transform = 'translateX(100%)';
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
                mediaHtml = '<div class="img-wrap"><div class="spinner-ring"></div><video src="images/skins/' + webFileName + '" autoplay loop muted playsinline style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover; border-radius:12px; z-index:2; pointer-events:none;" onloadeddata="this.parentElement.classList.add(\'loaded\')"></video></div>';
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
async function openModal(item) {
    currentModalCard = item;

    var cleanRarity = (item.rarity || '').split(' ')[0];
    var modalImgWrapper = document.querySelector('.modal-img-wrapper');
    modalImgWrapper.innerHTML = '';

    if (item.isSkin) {
        var webFileName = (item.skinFile || '').replace(/\.jpg|\.jpeg|\.png/i, '.webp').replace(/\.mp4/i, '.webm');
        if (item.skinType === 'absolute') {
            // ДОБАВЛЕНО skins/
            modalImgWrapper.innerHTML = '<video src="images/skins/' + webFileName + '" class="modal-img glow-' + cleanRarity + '" autoplay loop muted playsinline></video>';
        } else {
            // ДОБАВЛЕНО skins/
            modalImgWrapper.innerHTML = '<img src="images/skins/' + webFileName + '" class="modal-img glow-' + cleanRarity + '">';
        }
        document.getElementById('modalNameTop').innerText = item.name + (item.skinType === 'awakened' ? ' [💠]' : ' [🔮]');
        document.getElementById('modalName').innerText = item.name;
        document.getElementById('modalCount').innerText = "—"; 
    } else {
        var fallbackSrc = (item.file || '').replace(/\.jpe?g$/i, '.webp');
        modalImgWrapper.innerHTML = '<img src="images/' + fallbackSrc + '" class="modal-img glow-' + cleanRarity + '">';
        document.getElementById('modalNameTop').innerText = item.name || '';
        document.getElementById('modalName').innerText = item.name || '';
        
        document.getElementById('modalCount').innerText = "⏳";
        try {
            var res = await fetch(API_BASE + '/api/card_count/' + item.id);
            if(res.ok) {
                var data = await res.json();
                document.getElementById('modalCount').innerText = data.count;
            } else {
                document.getElementById('modalCount').innerText = "?";
            }
        } catch(e) { document.getElementById('modalCount').innerText = "Ошибка"; }
    }

    document.getElementById('modalRarity').innerText = item.rarity || '';
    document.getElementById('modalStyle').innerText = item.style || '';
    document.getElementById('modalSeries').innerText = item.series || 'Неизвестно';
    document.getElementById('modalSpeed').innerText = item.speed || 0;
    document.getElementById('modalStrength').innerText = item.strength || 0;
    document.getElementById('modalIntellect').innerText = item.intellect || 0;

    var statEls = [document.getElementById('modalSpeed'), document.getElementById('modalStrength'), document.getElementById('modalIntellect')];
    if((item.rarity || '').includes('Мифическая') || (item.rarity || '').includes('Божественная')) {
        statEls.forEach(el => el.classList.add('mythic'));
    } else {
        statEls.forEach(el => el.classList.remove('mythic'));
    }

    if (tg.HapticFeedback && tg.HapticFeedback.impactOccurred) tg.HapticFeedback.impactOccurred('light');
    document.getElementById('cardModal').classList.add('open');
}

        function closeModal() {
            document.getElementById('cardModal').classList.remove('open');
        }

        document.querySelectorAll('.modal-overlay').forEach(function(overlay) {
            overlay.addEventListener('click', function(e) {
                if (e.target === overlay) overlay.classList.remove('open');
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
            var isRef = (tab === 'ref');
            document.getElementById('earnTabRef').classList.toggle('active', isRef);
            document.getElementById('earnTabTasks').classList.toggle('active', !isRef);
            document.getElementById('earnRef').classList.toggle('active', isRef);
            document.getElementById('earnTasks').classList.toggle('active', !isRef);
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
            var btn = document.getElementById('subDoBtn');
            if (!btn) return;
            if (tasksData && tasksData.subscribe_done) {
                var row = btn.parentElement;
                var chk = document.createElement('div');
                chk.className = 'partner-done-check';
                chk.innerHTML = '✓';
                btn.replaceWith(chk);
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
        function manageBack() {
            if (!tg.BackButton) return;
            var earnOpen = document.getElementById('earnScreen').classList.contains('open');
            var sheetOpen = document.getElementById('taskSheet').classList.contains('open');
            var profileOpen = document.getElementById('fullProfileScreen').classList.contains('open');
            var pubProfileOpen = document.getElementById('publicProfileScreen').classList.contains('open'); 
            var passOpen = document.getElementById('passScreen').classList.contains('open');
            var detailOpen = document.getElementById('collDetailView').style.display === 'block';
            var ownersOpen = document.getElementById('ownersScreen').classList.contains('open');
            var favSystemOpen = document.getElementById('favSystemSheet').classList.contains('open'); // Для любимых карт
            var titleSystemOpen = document.getElementById('titleSystemSheet').classList.contains('open'); // Для титулов
            var bgSystemOpen = document.getElementById('bgSystemSheet').classList.contains('open'); // Для фонов
            var frameSystemOpen = document.getElementById('frameSystemSheet').classList.contains('open'); // Для рамок

            if (earnOpen || sheetOpen || profileOpen || pubProfileOpen || passOpen || detailOpen || ownersOpen || favSystemOpen || titleSystemOpen || bgSystemOpen || frameSystemOpen) {
                tg.BackButton.show();
            } else {
                tg.BackButton.hide();
            }
        }

        if (tg.BackButton && tg.BackButton.onClick) {
            tg.BackButton.onClick(function() {
                // ПОРЯДОК ВАЖЕН: Закрываем окна от верхних к нижним
                if (document.getElementById('taskSheet').classList.contains('open')) closeTaskSheet();
                else if (document.getElementById('favSystemSheet').classList.contains('open')) closeFavSystem();
                else if (document.getElementById('titleSystemSheet').classList.contains('open')) closeTitleSystem();
                else if (document.getElementById('bgSystemSheet').classList.contains('open')) closeBgSystem();
                else if (document.getElementById('frameSystemSheet').classList.contains('open')) closeFrameSystem();
                else if (document.getElementById('ownersScreen').classList.contains('open')) closeOwnersScreen();
                else if (document.getElementById('publicProfileScreen').classList.contains('open')) closePublicProfile();
                else if (document.getElementById('fullProfileScreen').classList.contains('open')) closeProfileModal();
                else if (document.getElementById('earnScreen').classList.contains('open')) closeEarnModal();
                else if (document.getElementById('passScreen').classList.contains('open')) closePassModal();
                else if (document.getElementById('collDetailView').style.display === 'block') backToUniverses();
            });
        }
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
            document.getElementById('titleSystemSheet').classList.add('open');
        }

        function closeTitleSystem() {
            document.getElementById('titleSystemSheet').classList.remove('open');
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
                        slotHtml = '<img src="images/' + card.file + '" style="width:100%; height:100%; object-fit:cover; border-radius:14px;">';
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
            document.getElementById('bgSystemSheet').classList.add('open');
        }

        function closeBgSystem() {
            document.getElementById('bgSystemSheet').classList.remove('open');
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

        function switchTopCategory(category, btnEl) {
            if (tg.HapticFeedback && tg.HapticFeedback.selectionChanged) tg.HapticFeedback.selectionChanged();
            
            // Красим активную кнопку
            document.querySelectorAll('.tops-nav-btn').forEach(function(btn) { btn.classList.remove('active'); });
            if (btnEl) btnEl.classList.add('active');

            currentTopCategory = category;
            
            // Показываем таймер ТОЛЬКО для PvP сезона
            document.getElementById('topsTimer').style.display = (category === 'pvp_season') ? 'inline-flex' : 'none';

            loadTops(category);
        }

        async function loadTops(category) {
            var container = document.getElementById('topsListContainer');
            container.innerHTML = '<div style="text-align:center; padding: 40px; color: var(--text-muted);"><div class="spinner-ring" style="position:relative; margin: 0 auto 10px; border-color:rgba(255,255,255,0.1); border-top-color:var(--accent);"></div>Загрузка данных...</div>';

            try {
                var res = await fetch(API_BASE + '/api/tops/' + category);
                var data = await res.json();

                if (data.success) {
                    renderTops(data.leaderboard);
                } else {
                    container.innerHTML = '<div style="text-align:center; padding: 40px; color: #ef4444;">Ошибка: ' + data.error + '</div>';
                }
            } catch (e) {
                container.innerHTML = '<div style="text-align:center; padding: 40px; color: #ef4444;">Ошибка соединения с сервером</div>';
            }
        }

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

function renderTops(list) {
    var container = document.getElementById('topsListContainer');
    container.innerHTML = '';

    if (!list || list.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding: 40px; color: var(--text-muted);">Список пуст</div>';
        return;
    }

    list.forEach(function(player, index) {
        var rank = index + 1;
        var rankClass = '';

        if (rank === 1) rankClass = 'rank-1';
        else if (rank === 2) rankClass = 'rank-2';
        else if (rank === 3) rankClass = 'rank-3';

        var cleanName = (player.name || 'Игрок').trim();
        var initial = cleanName.charAt(0).toUpperCase();

        var scoreHtml = player.score;
        if (currentTopCategory === 'krw') scoreHtml = '<span class="top-score-ico">₩</span> ' + player.score.replace(' ₩', '');
        else if (currentTopCategory === 'diamond') scoreHtml = '<span class="top-score-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 9l3-5h12l3 5-9 12z"/><path d="M3 9h18M9 4l-2 5 5 12 5-12-2-5"/></svg></span> ' + player.score.replace(' 💎', '');
        else if (currentTopCategory === 'cards') scoreHtml = '<span class="top-score-ico">🃣</span> ' + player.score.replace(' шт.', '');
        else if (currentTopCategory === 'pvp' || currentTopCategory === 'pvp_season') scoreHtml = '<span class="top-score-ico">⚔</span> ' + player.score.replace(' побед', '');
        else if (currentTopCategory === 'rank') scoreHtml = '<span class="top-score-ico">✪</span> ' + player.score.replace(' RP', '');
        else if (currentTopCategory === 'bc') scoreHtml = '<span class="top-score-ico">Ⓑ</span> ' + player.score.replace(' 🪙', '');

        var fallbackImg = "https://placehold.co/150x150/1c1c28/8b5cf6?text=" + initial;
        var avatarSrc = API_BASE + "/api/avatar/" + player.id + "?name=" + encodeURIComponent(cleanName);

        // === МАГИЯ РАМОК В ТОПЕ ===
        var frameHtml = player.frame_url
            ? `<img src="${player.frame_url}" class="avatar-frame">`
            : '';

        var imgHtml = `
            <div class="top-avatar-wrap">
                <img src="${avatarSrc}" class="top-avatar" onerror="this.src='${fallbackImg}'">
                ${frameHtml}
            </div>
        `;

        var html = `
            <div class="top-row" data-rank="${rank}" onclick="openPublicProfile(${player.id})">
                <div class="top-rank ${rankClass}">#${rank}</div>
                ${imgHtml}
                <div class="top-info">
                    <div class="top-name">${cleanName}</div>
                    <div class="top-level-tag">Lv. ${player.level || 1}</div>
                </div>
                <div class="top-score">${scoreHtml}</div>
            </div>
        `;

        container.innerHTML += html;
    });
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

        function updateTopsTimerDisplay() {
            var d = Math.floor(topsSecondsLeft / 86400);
            var h = Math.floor((topsSecondsLeft % 86400) / 3600);
            var m = Math.floor((topsSecondsLeft % 3600) / 60);
            
            var text = '';
            if (d > 0) text += d + 'д ';
            text += h + 'ч ' + m + 'м';
            
            var el = document.getElementById('topsTimeValue');
            if (el) el.innerText = text;
        }
// ================= ЧУЖОЙ ПРОФИЛЬ (БЕЗ БАГОВ И ВЫЛЕТОВ) =================
function closePublicProfile() {
    document.getElementById('publicProfileScreen').classList.remove('open');
    manageBack();
}

async function openPublicProfile(targetId) {
    if (tg.HapticFeedback && tg.HapticFeedback.impactOccurred) tg.HapticFeedback.impactOccurred('light');

    // 🔥 ФИКС: Закрываем экран владельцев, чтобы не наслаивалось!
    document.getElementById('ownersScreen').classList.remove('open');

    document.getElementById('publicProfileScreen').classList.add('open');
    manageBack()

    try {
        var res = await fetch(API_BASE + '/api/public_profile/' + targetId);
        var data = await res.json();

        if (data.success) {
            var p = data.profile;
            var dispName = p.nickname || p.username || 'Игрок ' + p.id;

            document.getElementById('pubName').innerHTML = dispName + ' <span style="font-size: 20px;" id="pubStatusEmoji">' + (p.is_premium ? '👑' : '🧩') + '</span>';

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
                        favGrid.innerHTML += '<div class="ps-fav-slot" onclick="openModalById(\'' + card.id + '\')" style="border:none; padding:0; cursor:pointer;"><img src="images/' + card.file + '" style="width:100%; height:100%; object-fit:cover; border-radius:14px;"></div>';
                        continue;
                    }
                }
                favGrid.innerHTML += '<div class="ps-fav-slot" style="cursor:default; opacity:0.15;">+</div>';
            }

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
            if(lvlEl) lvlEl.innerHTML = 'Уровень <b>' + realPassLevel + '</b>';
            
            var unclaimed = realPassLevel - claimedPassLevels;
            if (unclaimed > 0) {
                if(progEl) progEl.innerHTML = '<span style="color:#4ade80">🎁 Награда ждёт!</span> ›';
            } else {
                if(progEl) progEl.innerHTML = 'Прогресс <b>' + pct + '%</b> ›';
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

        function closePublicProfile() {
            document.getElementById('publicProfileScreen').classList.remove('open');
            manageBack();
        }

        // Инициализация интервалов
        setInterval(updatePassResetTimer, 60000);
        updateMainMenuPass();
// ================= ЛОГИКА ГАЧИ (МАГАЗИН) =================
        var selectedSummonAmount = 8; // По умолчанию ползунок стоит на 8
        var summonedCardsData = [];
        var flippedCardsCount = 0;

        // Единая функция синхронизации ползунка и кнопок
        function syncSummon(val) {
            val = parseInt(val);
            if (val < 1) val = 1;
            if (val > 16) val = 16;
            
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
            
            // Закрашиваем линию слайдера (фиолетовый прогресс-бар)
            var percentage = ((val - 1) / 15) * 100;
            document.getElementById('gachaSlider').style.background = `linear-gradient(90deg, var(--accent) ${percentage}%, rgba(255,255,255,0.1) ${percentage}%)`;

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
                
                if (data.success) {
                    summonedCardsData = data.cards;
                    document.getElementById('shopAttemptsBal').innerText = data.new_attempts;
                    fetchProfile(); // Фоново обновляем основную коллекцию
                    
                    if (isQuick) showQuickResults();
                    else startEpicSummonSequence();
                } else {
                    tg.showAlert(data.error);
                }
            } catch (e) {
                tg.showAlert("Ошибка соединения с сервером");
            }
            
            btnFull.disabled = false; btnQuick.disabled = false;
        }

        // --- ЭПИЧНАЯ СЦЕНА ---
        function startEpicSummonSequence() {
            var overlay = document.getElementById('summonOverlay');
            var portal = document.getElementById('summonPortal');
            var rays = document.getElementById('summonRays');
            var grid = document.getElementById('summonGrid');
            var claimBtn = document.getElementById('summonClaimBtn');
            
            flippedCardsCount = 0;
            grid.innerHTML = '';
            claimBtn.classList.remove('show');
            overlay.classList.remove('shake');
            
            // УМНАЯ СЕТКА: красиво распределяем любое число от 1 до 16
            var cols = 4; // по умолчанию 4 колонки
            if (selectedSummonAmount === 1) cols = 1;
            else if (selectedSummonAmount === 2 || selectedSummonAmount === 4) cols = 2; // 2x1 или 2x2
            else if (selectedSummonAmount === 3 || selectedSummonAmount === 5 || selectedSummonAmount === 6 || selectedSummonAmount === 9) cols = 3; // 3x1, 3x2, 3x3
            
            grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
            
            overlay.classList.add('open');
            
            setTimeout(() => { 
                portal.style.opacity = '1'; 
                rays.style.opacity = '1';
                if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
            }, 300);

            summonedCardsData.forEach((card, index) => {
                var isDivine = (card.rarity || '').includes('Божест');
                var delay = (index * 80) + (isDivine ? 200 : 0) + 600; 
                setTimeout(() => { spawnSummonCard(card, index); }, delay);
            });

            var totalTime = (summonedCardsData.length * 80) + 1200;
            setTimeout(() => {
                document.querySelectorAll('.summon-card').forEach(c => c.classList.add('floating'));
            }, totalTime);
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
                              <div class="dup-stamp">ДУБЛИКАТ<br>+ ${card.dup_reward} 💴</div>
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
                    
                    if (flippedCardsCount >= selectedSummonAmount) {
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
            
            portal.style.opacity = '0'; rays.style.opacity = '0';
            overlay.classList.add('open');
            grid.innerHTML = '';
            
            // ТА ЖЕ УМНАЯ СЕТКА ДЛЯ БЫСТРОГО РЕЗУЛЬТАТА
            var cols = 4;
            if (selectedSummonAmount === 1) cols = 1;
            else if (selectedSummonAmount === 2 || selectedSummonAmount === 4) cols = 2;
            else if (selectedSummonAmount === 3 || selectedSummonAmount === 5 || selectedSummonAmount === 6 || selectedSummonAmount === 9) cols = 3;
            
            grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
            
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
                                  <div class="dup-stamp">ДУБЛИКАТ<br>+ ${card.dup_reward} 💴</div>
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
// ================= ДВУХУРОВНЕВЫЙ АЛЬБОМ СИСТЕМЫ =================
        var collActiveUniverse = null;
        var universeColors = {
            'Поднятие уровня в одиночку': '#8b5cf6',
            'ДжоДжо': '#f59e0b',
            'Блич': '#ef4444',
            'Код Гиас': '#d946ef',
            'Наруто': '#a855f7',
            'Клинок рассекающий демонов': '#06b6d4'
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
            container.innerHTML = '';
            
            var ownedSet = new Set(typeof userOwnedCards !== 'undefined' ? userOwnedCards : []);
            
            // Группируем все карты по сериям (вселенным)
            var uniMap = {};
            allCards.forEach(c => {
                if (!c.series) return;
                if (!uniMap[c.series]) uniMap[c.series] = { total: 0, owned: 0 };
                uniMap[c.series].total++;
                if (ownedSet.has(c.id)) uniMap[c.series].owned++;
            });
            
            // Отрисовываем плашки вселенных ровно как на картинке
            Object.keys(uniMap).sort().forEach(uniName => {
                var stats = uniMap[uniName];
                var pct = stats.total > 0 ? Math.round((stats.owned / stats.total) * 100) : 0;
                var color = universeColors[uniName] || 'var(--accent)';
                
                var cardHtml = `
                    <div class="coll-universe-card" onclick="openUniverseDetail('${uniName}')">
                        <div class="coll-uni-top">
                            <div class="coll-uni-title">${uniName}</div>
                            <div class="coll-uni-badge" style="--uni-color: ${color};">${pct}%</div>
                        </div>
                        <div class="coll-uni-meta">
                            <span>Карты</span>
                            <span class="coll-uni-count">${stats.owned} / ${stats.total}</span>
                        </div>
                        <div class="coll-uni-bar">
                            <div class="coll-uni-fill" style="--uni-color: ${color}; width: ${pct}%;"></div>
                        </div>
                    </div>`;
                container.insertAdjacentHTML('beforeend', cardHtml);
            });
        }

        function openUniverseDetail(uniName) {
            collActiveUniverse = uniName;
            document.getElementById('collUniversesView').style.display = 'none';
            document.getElementById('collDetailView').style.display = 'block';
            
            var ownedSet = new Set(typeof userOwnedCards !== 'undefined' ? userOwnedCards : []);
            var uniCards = allCards.filter(c => c.series === uniName);
            var totalCount = uniCards.length;
            var ownedCount = uniCards.filter(c => ownedSet.has(c.id)).length;
            var totalPct = totalCount > 0 ? Math.round((ownedCount / totalCount) * 100) : 0;
            var uniColor = universeColors[uniName] || 'var(--accent)';
            
            // Отрисовка верхней инфо-плашки вселенной (Окно 2)
            var headerBox = document.getElementById('collDetailHeaderBox');
            headerBox.innerHTML = `
                <div class="coll-uni-top">
                    <div class="coll-uni-title" style="font-size: 20px;">${uniName}</div>
                    <div class="coll-uni-badge" style="--uni-color: ${uniColor}; padding: 6px 14px; font-size:13px;">${totalPct}%</div>
                </div>
                <div class="coll-uni-meta" style="margin-top: 15px;">
                    <span>Карты вселенной</span>
                    <span class="coll-uni-count">${ownedCount} / ${totalCount}</span>
                </div>
                <div class="coll-uni-bar" style="height: 8px; margin-top: 6px;">
                    <div class="coll-uni-fill" style="--uni-color: ${uniColor}; width: ${totalPct}%; box-shadow: 0 0 10px ${uniColor};"></div>
                </div>`;
                
            // Группируем карты внутри вселенной по редкости
            var rarityMap = {};
            uniCards.forEach(c => {
                var r = c.rarity || 'Обычная ⚪️';
                if (!rarityMap[r]) rarityMap[r] = [];
                rarityMap[r].push(c);
            });
            
            var rContainer = document.getElementById('collDetailRaritiesContainer');
            rContainer.innerHTML = '';
            
            var rarityOrder = ['Божественная ⚫️', 'Мифическая 🔴', 'Легендарная 🔵', 'Эпическая 🟢', 'Редкая 🟡', 'Обычная ⚪️', 'Лимитированная ✨', 'Ивентовая 🪎'];
            var rarityColors = {
                'Обычная ⚪️': '#94a3b8', 'Редкая 🟡': '#fde047', 'Эпическая 🟢': '#4ade80',
                'Легендарная 🔵': '#3b82f6', 'Мифическая 🔴': '#ef4444', 'Божественная ⚫️': '#d6d3d1',
                'Лимитированная ✨': '#f472b6', 'Ивентовая 🪎': '#fb923c'
            };
            
            rarityOrder.forEach(r => {
                if (!rarityMap[r] || rarityMap[r].length === 0) return;
                
                var rCards = rarityMap[r];
                var rOwned = rCards.filter(c => ownedSet.has(c.id)).length;
                var rPct = Math.round((rOwned / rCards.length) * 100);
                var rColor = rarityColors[r] || '#fff';
                
                var sectionHtml = `
                    <div class="coll-rarity-section">
                        <div class="coll-rarity-trigger" style="--r-color: ${rColor};" onclick="toggleCollRarity(this)">
                            <div class="coll-rarity-title-txt">${r}</div>
                            <div class="coll-rarity-right-info">
                                <span style="font-size:13px; color:rgba(255,255,255,0.5); font-weight:600;">${rOwned} / ${rCards.length}</span>
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
                        var clickData = JSON.stringify(c).replace(/"/g, '&quot;');
                        sectionHtml += `
                            <div class="coll-mini-card owned" style="--r-color: ${rColor};" onclick="openModal(${clickData})">
                                <img src="${imgSrc}" loading="lazy" onerror="this.onerror=null; this.src='${fallbackSrc}';">
                                <div class="coll-card-check">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="3.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                </div>
                                <div class="coll-card-stats-strip">${c.name || ''}</div>
                            </div>`;
                    } else {
                        sectionHtml += `
                            <div class="coll-mini-card locked">
                                <img src="${imgSrc}" loading="lazy" onerror="this.onerror=null; this.src='${fallbackSrc}';">
                            </div>`;
                    }
                });
                
                sectionHtml += `</div></div></div></div>`;
                rContainer.insertAdjacentHTML('beforeend', sectionHtml);
            });
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
            var section = triggerEl.closest('.coll-rarity-section');
            var wasOpen = section.classList.contains('open');
            
            // Rolling accordion: закрываем открытую редкость перед открытием новой
            document.querySelectorAll('.coll-rarity-section').forEach(s => section !== s && s.classList.remove('open'));
            
            if (!wasOpen) {
                section.classList.add('open');
                setTimeout(() => {
                    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 150);
            } else {
                section.classList.remove('open');
            }
            if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
                window.Telegram.WebApp.HapticFeedback.selectionChanged();
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

function openBuyAttemptsModal() {
    if (tg.HapticFeedback && tg.HapticFeedback.impactOccurred) tg.HapticFeedback.impactOccurred('medium');
    document.getElementById('buyAttemptsModal').classList.add('open');
    switchBuyCurrency('krw');
}

function closeBuyAttemptsModal() {
    if (tg.HapticFeedback && tg.HapticFeedback.selectionChanged) tg.HapticFeedback.selectionChanged();
    document.getElementById('buyAttemptsModal').classList.remove('open');
}

function switchBuyCurrency(curr) {
    currentBuyCurrency = curr;
    document.getElementById('tabBuyKrw').classList.toggle('active', curr === 'krw');
    document.getElementById('tabBuyDia').classList.toggle('active', curr === 'dia');
    renderBuyPacks();
}

function renderBuyPacks() {
    var grid = document.getElementById('buyPacksGrid');
    grid.innerHTML = '';

    var packs = currentBuyCurrency === 'krw' ? BUY_PACKS_KRW_DATA : BUY_PACKS_DIA_DATA;

    packs.forEach((p, index) => {
        var priceStr = currentBuyCurrency === 'krw' ? (p.price + ' 💴') : (p.price + ' 💎');
        var packHtml = `
            <div class="gacha-pack-card" onclick="executeBuyAttempts('${currentBuyCurrency}', ${index})">
                <div class="gacha-pack-left">
                    <div class="gacha-pack-icon">🎟</div>
                    <div>
                        <div class="gacha-pack-amt">+${p.attempts} круток</div>
                        <div class="gacha-pack-sub">Набор попыток</div>
                    </div>
                </div>
                <button class="gacha-pack-btn">${priceStr}</button>
            </div>
        `;
        grid.insertAdjacentHTML('beforeend', packHtml);
    });
}

async function executeBuyAttempts(currency, packIndex) {
    if (tg.HapticFeedback && tg.HapticFeedback.impactOccurred) tg.HapticFeedback.impactOccurred('heavy');

    try {
        var res = await fetch(API_BASE + '/api/buy_attempts/' + userId, {
            method: 'POST',
            headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
            body: JSON.stringify({ currency: currency, pack_index: packIndex })
        });
        var data = await res.json();

        if (data.success) {
            showToast('Успешно!', 'Приобретено +' + data.bought_attempts + ' круток!');

            // Моментально обновляем балансы в Web App
            document.getElementById('valKrw').innerText = data.new_krw;
            document.getElementById('valDiamond').innerText = data.new_diamond;
            document.getElementById('shopAttemptsBal').innerText = data.new_attempts;

            closeBuyAttemptsModal();
            fetchProfile(); // Фоновая синхронизация
        } else {
            tg.showAlert(data.error);
        }
    } catch (e) {
        tg.showAlert('Ошибка соединения с сервером');
    }
}
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

    document.getElementById('frameSystemSheet').classList.add('open');
}

function closeFrameSystem() {
    if (tg.HapticFeedback && tg.HapticFeedback.selectionChanged) tg.HapticFeedback.selectionChanged();
    document.getElementById('frameSystemSheet').classList.remove('open');
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

    document.getElementById('tabShopGachaBtn').classList.toggle('active', tab === 'gacha');
    document.getElementById('tabShopFramesBtn').classList.toggle('active', tab === 'frames');

    document.getElementById('shopGachaContent').style.display = tab === 'gacha' ? 'block' : 'none';
    document.getElementById('shopFramesContent').style.display = tab === 'frames' ? 'block' : 'none';

    if (tab === 'frames') {
        renderShopFrames();
    }
}

function renderShopFrames() {
    var grid = document.getElementById('shopFramesGrid');
    if (!grid) return;
    grid.innerHTML = '';

    var userAvatarSrc = document.getElementById('userAvatar') ? document.getElementById('userAvatar').src : '';

    SHOP_FRAMES_DATA.forEach(frame => {
        var isOwned = userOwnedFrames.includes(frame.id);
        var priceHtml = '';

        if (isOwned) {
            priceHtml = '<div class="shop-frame-status owned">КУПЛЕНО ✓</div>';
        } else {
            var finalPrice = isUserPremium ? Math.floor(frame.price * 0.8) : frame.price;
            var currIcon = frame.currency === 'krw' ? ICON_KRW_HTML : ICON_DIA_HTML;
            var discountHtml = isUserPremium ? `<s style="font-size:10px; color:var(--text-muted); margin-right:4px;">${frame.price}</s>` : '';
            priceHtml = `<div class="shop-frame-status price">${discountHtml}${currIcon}${finalPrice}</div>`;
        }

        var html = `
            <div class="frame-item-card" onclick="openFrameShopPreview('${frame.id}')">
                <div class="frame-item-icon">
                    <img src="${userAvatarSrc}" class="mini-avatar">
                    <img src="${frame.url}" class="avatar-frame">
                </div>
                <div class="frame-item-name">${frame.name}</div>
                ${priceHtml}
            </div>
        `;
        grid.insertAdjacentHTML('beforeend', html);
    });
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

    document.getElementById('frameShopPreviewSheet').classList.add('open');
}

function closeFrameShopPreview() {
    document.getElementById('frameShopPreviewSheet').classList.remove('open');
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
            document.getElementById('valKrw').innerText = data.new_krw;
            document.getElementById('valDiamond').innerText = data.new_dia;

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
// ================= ДОСТИЖЕНИЯ (С ОРИГИНАЛЬНЫМИ SVG-ИКОНКАМИ) =================

// Коллекция SVG-иконок для наград и кубка
const ACHIEV_SVGS = {
    trophy: `<svg class="achiev-icon-svg" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:24px;height:24px;"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"></path></svg>`,

    krw: `<svg class="reward-svg-icon" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11h18M3 15h18M4 5l4 14l4-10l4 10l4-14"></path></svg>`,

    battlecoin: `<svg class="reward-svg-icon" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 6h4.5a3 3 0 0 1 0 6H8V6z M8 12h5.5a3 3 0 0 1 0 6H8v-6z"></path></svg>`,

    diamond: `<svg class="reward-svg-icon" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12l4 6-10 12L2 9z"></path><path d="M11 3 8 9l4 12 4-12-3-6"></path><path d="M2 9h20"></path></svg>`,

    attempts: `<svg class="reward-svg-icon" viewBox="0 0 24 24" fill="none" stroke="#c084fc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6"></path><path d="M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path></svg>`,

    frame: `<svg class="reward-svg-icon" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`
};

function openAchievements() {
    // 1. Безопасно достаем ID игрока (чтобы скрипт не крашился)
    let myUserId = 0;
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) {
        myUserId = window.Telegram.WebApp.initDataUnsafe.user.id;
    } else {
        myUserId = userId; 
    }

    // 2. Открываем темный фон и саму шторку
    document.getElementById('achievementsModal').style.display = 'flex';

    // 3. Делаем запрос к твоему Python-серверу (добавлен API_BASE и заголовки)
    fetch(API_BASE + '/api/achievements?user_id=' + myUserId, {
        headers: authHeaders()
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                renderAchievementsList(data.achievements);
            }
        })
        .catch(err => {
            console.error("Ошибка загрузки достижений:", err);
            document.getElementById('achievementsContainer').innerHTML = '<div style="text-align:center; color:#ff453a; margin-top: 20px;">Ошибка загрузки. Проверьте соединение.</div>';
        });
}

function closeAchievements() {
    document.getElementById('achievementsModal').style.display = 'none';
}

function renderAchievementsList(achievements) {
    const container = document.getElementById('achievementsContainer');
    container.innerHTML = ''; // Очищаем индикатор загрузки

    achievements.forEach(ach => {
        // Вычисляем процент для прогресс-бара
        let percent = Math.min((ach.progress / ach.req) * 100, 100);

        // Генерация стильных карточек наград с SVG-иконками
        let rewardTags = [];
        if (ach.rewards.krw) {
            rewardTags.push(`<span class="reward-tag">${ACHIEV_SVGS.krw} ${ach.rewards.krw} KRW</span>`);
        }
        if (ach.rewards.battlecoin) {
            rewardTags.push(`<span class="reward-tag">${ACHIEV_SVGS.battlecoin} ${ach.rewards.battlecoin} BC</span>`);
        }
        if (ach.rewards.diamond) {
            rewardTags.push(`<span class="reward-tag">${ACHIEV_SVGS.diamond} ${ach.rewards.diamond}</span>`);
        }
        if (ach.rewards.attempts) {
            rewardTags.push(`<span class="reward-tag">${ACHIEV_SVGS.attempts} ${ach.rewards.attempts} Круток</span>`);
        }
        if (ach.rewards.frame_id) {
            rewardTags.push(`<span class="reward-tag">${ACHIEV_SVGS.frame} Рамка</span>`);
        }

        // Кнопка статуса
        let btnHtml = '';
        if (ach.is_claimed) {
            btnHtml = `<button class="achiev-btn claimed">✓ Забрано</button>`;
        } else if (ach.is_completed) {
            btnHtml = `<button class="achiev-btn ready" onclick="claimAchievement('${ach.id}')">Забрать</button>`;
        } else {
            btnHtml = `<button class="achiev-btn locked">Заблокировано</button>`;
        }

        // Создаем карточку достижения
        const card = document.createElement('div');
        card.className = 'achiev-card';
        card.innerHTML = `
            <div class="achiev-icon-wrap">
                ${ACHIEV_SVGS.trophy}
            </div>
            <div class="achiev-info">
                <div class="achiev-title">${ach.title}</div>
                <div class="achiev-desc">${ach.desc}</div>
                
                <div class="achiev-reward" style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px;">
                    ${rewardTags.join('')}
                </div>
                
                <div class="achiev-progress-wrap">
                    <div class="achiev-progress-bar">
                        <div class="achiev-progress-fill" style="width: ${percent}%;"></div>
                    </div>
                    <div class="achiev-progress-text">${ach.progress} / ${ach.req}</div>
                </div>
            </div>
            <div>
                ${btnHtml}
            </div>
        `;
        container.appendChild(card);
    });
}

function claimAchievement(achievId) {
    fetch(API_BASE + '/api/claim_achievement', {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
        body: JSON.stringify({ user_id: userId, achiev_id: achievId })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            tg.showAlert(data.message); // Теперь покажет название рамки
            openAchievements(); // Обновляем список достижений

            if (typeof fetchProfile === "function") fetchProfile(); // Обновляем профиль/баланс

            // 🔥 ИСПРАВЛЕНИЕ: Синхронизируем инвентарь рамок, чтобы она сразу появилась в профиле
            if (typeof loadUserFrames === "function") loadUserFrames();
        } else {
            tg.showAlert(data.message || "Произошла ошибка");
        }
    })
    .catch(err => {
        console.error("Ошибка при получении награды:", err);
        tg.showAlert("Ошибка соединения с сервером");
    });
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

async function openOwnersScreen(page = 0) {
    if (!currentModalCard) return;
    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');

    var c = currentModalCard;
    var rName = c.rarity || 'Обычная ⚪️';
    var cleanRarity = rName.split(' ')[0];
    var rColor = RARITY_COLORS[rName] || '#fff';

    // 1. Заполняем статику (Шапка и Характеристики)
    document.getElementById('osCardName').innerText = c.name;

    var pill = document.getElementById('osRarityPill');
    pill.innerText = cleanRarity;
    pill.style.setProperty('--r-color', rColor);

    var wrap = document.getElementById('osCardWrap');
    wrap.style.setProperty('--r-color', rColor);

    var fallbackSrc = (c.file || '').replace(/\.jpe?g$/i, '.webp');
    document.getElementById('osCardImg').src = 'images/' + fallbackSrc;
    document.getElementById('osCardStrip').innerText = c.name + '  💥 ' + (c.speed + c.strength + c.intellect);

    document.getElementById('osStatRarity').innerText = cleanRarity;
    document.getElementById('osStatRarity').style.color = rColor;
    document.getElementById('osStatSpd').innerText = c.speed || 0;
    document.getElementById('osStatStr').innerText = c.strength || 0;
    document.getElementById('osStatInt').innerText = c.intellect || 0;

    // Скины
    var cardSkins = allSkins.filter(s => s.card_id === c.id);
    var skinsBlock = document.getElementById('osSkinsBlock');
    if (cardSkins.length > 0) {
        skinsBlock.style.display = 'block';
        document.getElementById('osSkinsCount').innerText = cardSkins.length;
        var sList = document.getElementById('osSkinsList');
        sList.innerHTML = '';
        cardSkins.forEach(s => {
            var sFile = (s.file || '').replace(/\.jpg|\.jpeg|\.png/i, '.webp').replace(/\.mp4/i, '.webm');
            sList.innerHTML += `<img src="images/skins/${sFile}">`;
        });
    } else {
        skinsBlock.style.display = 'none';
    }

    // 2. Открываем экран и грузим игроков
    document.getElementById('ownersScreen').classList.add('open');
    manageBack(); // Чтобы работала системная кнопка "Назад"

    var container = document.getElementById('osListContent');
    var pag = document.getElementById('osPagination');
    container.innerHTML = '<div style="text-align:center; padding:40px; color:var(--text-muted);"><span class="spinner-ring" style="position:relative; margin: 0 auto 10px; border-color:rgba(255,255,255,0.1); border-top-color:var(--accent); width:30px; height:30px;"></span><br>Поиск владельцев...</div>';
    pag.style.display = 'none';
    document.getElementById('osTotalOwners').innerText = '...';

    try {
        var res = await fetch(API_BASE + '/api/card_owners/' + c.id + '?page=' + page);
        var data = await res.json();

        if (data.success) {
            document.getElementById('osTotalOwners').innerText = data.total_unique;
            renderOwnersList(data);
        } else {
            container.innerHTML = '<div style="text-align:center; color:#ef4444; padding:20px;">Ошибка загрузки</div>';
        }
    } catch (e) {
        container.innerHTML = '<div style="text-align:center; color:#ef4444; padding:20px;">Ошибка соединения</div>';
    }
}

function closeOwnersScreen() {
    document.getElementById('ownersScreen').classList.remove('open');
    manageBack();
}

function renderOwnersList(data) {
    var container = document.getElementById('osListContent');
    container.innerHTML = '';

    if (!data.owners || data.owners.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding: 40px; color: var(--text-muted);">Этой карты ни у кого нет</div>';
        return;
    }

    data.owners.forEach(function(player) {
        var cleanName = (player.name || 'Игрок').trim();
        var initial = cleanName.charAt(0).toUpperCase();
        var fallbackImg = "https://placehold.co/150x150/1c1c28/8b5cf6?text=" + initial;
        var avatarSrc = API_BASE + "/api/avatar/" + player.id + "?name=" + encodeURIComponent(cleanName);

        var frameHtml = player.frame_url ? `<img src="${player.frame_url}" class="avatar-frame" style="width:130%; height:130%;">` : '';
        var badgeHtml = player.count > 1 ? `<div class="os-badge">×${player.count}</div>` : '';

        var html = `
            <div class="os-owner-row" onclick="openPublicProfile(${player.id})">
                <div class="top-avatar-wrap" style="margin:0;">
                    <img src="${avatarSrc}" class="os-avatar" onerror="this.src='${fallbackImg}'">
                    ${frameHtml}
                </div>
                <div class="os-name">${cleanName}</div>
                ${badgeHtml}
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
    });

    var pag = document.getElementById('osPagination');
    var totalPages = Math.ceil(data.total_unique / data.limit);

    if (totalPages > 1) {
        pag.style.display = 'flex';
        pag.innerHTML = '';

        var btnPrev = document.createElement('button');
        btnPrev.className = 'page-btn';
        btnPrev.innerText = '◀ Назад';
        btnPrev.disabled = (data.page === 0);
        btnPrev.onclick = () => openOwnersScreen(data.page - 1);

        var ind = document.createElement('div');
        ind.className = 'page-indicator';
        ind.innerText = (data.page + 1) + ' / ' + totalPages;

        var btnNext = document.createElement('button');
        btnNext.className = 'page-btn';
        btnNext.innerText = 'Вперед ▶';
        btnNext.disabled = (data.page >= totalPages - 1);
        btnNext.onclick = () => openOwnersScreen(data.page + 1);

        pag.appendChild(btnPrev);
        pag.appendChild(ind);
        pag.appendChild(btnNext);
    } else {
        pag.style.display = 'none';
    }
}