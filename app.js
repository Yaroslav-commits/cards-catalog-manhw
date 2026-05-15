let tg = window.Telegram.WebApp;
tg.expand();

// Установка юзернейма
let tgUser = tg.initDataUnsafe?.user;
if (tgUser) {
    document.getElementById('user-name').innerText = tgUser.first_name;
}

// Данные
let cardsData = {};
let currentUniverse = '';

// Цвета редкостей
const rarityColors = {
    "Божественная ⚫️": "var(--divine)",
    "Мифическая 🔴": "var(--mythic)",
    "Легендарная 🔵": "var(--legendary)",
    "Эпическая 🟢": "var(--epic)",
    "Редкая 🟡": "var(--rare)",
    "Обычная ⚪️": "var(--common)"
};

// Загрузка
async function loadData() {
    try {
        let res = await fetch('cards.json');
        cardsData = await res.json();
        initApp();
    } catch (e) {
        console.error("Ошибка загрузки cards.json", e);
    }
}

function initApp() {
    renderUniverses();
    renderBattlePass();
    // Витрина (покажем первые 3)
    let fav = document.getElementById('favorite-cards');
    let keys = Object.keys(cardsData).slice(0,3);
    fav.innerHTML = keys.map(k => createCardHTML(k, cardsData[k])).join('');
}

function nav(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-' + viewId).classList.add('active');
    document.getElementById('back-btn').style.display = viewId === 'home' ? 'none' : 'block';
    
    if (viewId === 'admin') renderAdminCards();
}

function createCardHTML(key, card) {
    let color = rarityColors[card.rarity] || '#fff';
    return `
        <div class="card-item" style="border-color:${color}" onclick="openCard('${key}')">
            <img src="${card.file}" onerror="this.src='https://via.placeholder.com/150x200?text=No+Image'">
            <div class="card-name">${card.name}</div>
        </div>
    `;
}

function renderUniverses() {
    let list = document.getElementById('universes-list');
    let seriesSet = new Set(Object.values(cardsData).map(c => c.series));
    list.innerHTML = '';
    seriesSet.forEach(s => {
        let div = document.createElement('div');
        div.className = 'list-item';
        div.innerHTML = `<span>📖 ${s}</span> <span>➡️</span>`;
        div.onclick = () => openUniverse(s);
        list.appendChild(div);
    });
}

function openUniverse(series) {
    currentUniverse = series;
    document.getElementById('current-universe-title').innerText = series;
    let grid = document.getElementById('cards-grid');
    grid.innerHTML = '';
    for (let key in cardsData) {
        if (cardsData[key].series === series) {
            grid.innerHTML += createCardHTML(key, cardsData[key]);
        }
    }
    nav('cards');
}

function openCard(key) {
    let card = cardsData[key];
    document.getElementById('modal-img').src = card.file;
    document.getElementById('modal-name').innerText = card.name;
    document.getElementById('modal-rarity').innerText = card.rarity;
    document.getElementById('modal-rarity').style.color = rarityColors[card.rarity];
    document.getElementById('modal-rarity-border').style.backgroundColor = rarityColors[card.rarity];
    document.getElementById('m-spd').innerText = card.speed;
    document.getElementById('m-str').innerText = card.strength;
    document.getElementById('m-int').innerText = card.intellect;
    
    let modal = document.getElementById('card-modal');
    modal.style.display = 'flex';
}

function closeModal() {
    document.getElementById('card-modal').style.display = 'none';
}

function renderBattlePass() {
    let free = document.getElementById('free-days');
    let pro = document.getElementById('pro-days');
    
    const freeRewards = ["3 💎","3 💎","5 💎","2 💎","2 💎","1 💎","1 💎","1 💎","1 💎","3 💎","2 💎","2 💎","1 💎","Лимитка 🎴"];
    const proRewards = ["200 💎","200 💎","200 💎","200 💎","200 💎","200 💎","Титул 👑","200 💎","200 💎","200 💎","200 💎","200 💎","200 💎","Лимитка 🎴"];
    
    for(let i=0; i<14; i++) {
        free.innerHTML += `<div class="bp-day"><span>День ${i+1}</span> <span>${freeRewards[i]}</span></div>`;
        pro.innerHTML += `<div class="bp-day"><span>День ${i+1}</span> <span style="color:#FF9F0A">${proRewards[i]}</span></div>`;
    }
}

function buyPass() {
    tg.sendData(JSON.stringify({action: "buy_pro_pass"}));
    alert("Запрос на покупку Pro Pass (449 ⭐) отправлен в бота!");
}

function renderAdminCards() {
    let filter = document.getElementById('admin-filter').value;
    let list = document.getElementById('admin-cards');
    list.innerHTML = '';
    
    for (let key in cardsData) {
        let card = cardsData[key];
        if (filter === 'all' || card.rarity === filter) {
            let div = document.createElement('div');
            div.className = 'list-item';
            div.innerHTML = `<span>${card.name}</span> <span style="color:${rarityColors[card.rarity]}">${card.rarity}</span>`;
            list.appendChild(div);
        }
    }
}

window.onload = loadData;
