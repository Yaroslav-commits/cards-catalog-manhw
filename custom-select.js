/* =====================================================================
   CUSTOM SELECT — замена нативных дропдаунов.

   Оригинальный <select> остаётся в DOM: он скрыт, но значение в него
   пишется, и после выбора кидается настоящее событие 'change'.
   Поэтому весь существующий код вида

       document.getElementById('styleFilter').value
       styleFilter.addEventListener('change', applyFilters)

   продолжает работать без единой правки.

   Подключение:
       <link rel="stylesheet" href="custom-select.css">
       <script src="custom-select.js"></script>
       <script>CustomSelect.init('.filters-grid select, #styleFilter');</script>

   Опции через data-атрибуты на <select>:
       data-cs-title="Редкость"   заголовок шторки
       data-cs-search="always"    поиск всегда (по умолчанию — от 10 пунктов)
       data-cs-search="never"     поиск отключён
       data-cs-class="cs-tall"    доп. класс на поле
       data-cs-skip                не трогать этот селект
   ===================================================================== */

(function (global) {
    'use strict';

    var SEARCH_THRESHOLD = 10;
    var instances = [];
    var openInstance = null;

    var ICON_CHEVRON =
        '<svg class="cs-chevron" viewBox="0 0 12 8" fill="none" aria-hidden="true">' +
        '<path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" stroke-width="2" ' +
        'stroke-linecap="round" stroke-linejoin="round"/></svg>';

    var ICON_CHECK =
        '<svg class="cs-check" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
        '<path d="M2.5 8.5L6 12L13.5 4" stroke="currentColor" stroke-width="2.2" ' +
        'stroke-linecap="round" stroke-linejoin="round"/></svg>';

    function haptic(type) {
        try {
            var tg = global.Telegram && global.Telegram.WebApp;
            if (tg && tg.HapticFeedback) tg.HapticFeedback.selectionChanged(type);
        } catch (e) { /* вне Telegram — молча игнорируем */ }
    }

    function isDesktop() {
        return global.matchMedia('(min-width: 700px) and (pointer: fine)').matches;
    }

    function CustomSelect(select) {
        this.select = select;
        this.isOpen = false;
        this.activeIndex = -1;
        this.items = [];       // {value, label, disabled, group}
        this.buttons = [];     // видимые (после фильтра поиском) кнопки
        this.build();
        this.syncFromSelect();
        this.watch();
        this.syncStyle();
    }

    CustomSelect.prototype.build = function () {
        var select = this.select;

        select.classList.add('cs-native');
        select.setAttribute('tabindex', '-1');
        select.setAttribute('aria-hidden', 'true');

        var field = document.createElement('button');
        field.type = 'button';
        field.className = 'cs-field';

        /* Переносим на поле классы и inline-стили селекта: они часто отвечают
           за раскладку (filter-full = grid-column: 1 / -1), а скрытый селект
           из потока выпадает и применить их уже не может. */
        for (var c = 0; c < select.classList.length; c++) {
            if (select.classList[c] !== 'cs-native') field.classList.add(select.classList[c]);
        }
        if (select.getAttribute('style')) field.setAttribute('style', select.getAttribute('style'));
        if (select.dataset.csClass) field.className += ' ' + select.dataset.csClass;
        field.setAttribute('aria-haspopup', 'listbox');
        field.setAttribute('aria-expanded', 'false');
        field.innerHTML = '<span class="cs-field-value"></span>' + ICON_CHEVRON;

        select.parentNode.insertBefore(field, select.nextSibling);
        this.field = field;
        this.valueEl = field.querySelector('.cs-field-value');

        field.addEventListener('click', this.toggle.bind(this));
        field.addEventListener('keydown', this.onFieldKey.bind(this));
    };

    CustomSelect.prototype.title = function () {
        if (this.select.dataset.csTitle) return this.select.dataset.csTitle;
        if (this.select.getAttribute('aria-label')) return this.select.getAttribute('aria-label');
        var id = this.select.id;
        if (id) {
            var label = document.querySelector('label[for="' + id + '"]');
            if (label) return label.textContent.trim();
        }
        return 'Выберите значение';
    };

    /* Перечитываем <option> из DOM — вызывается при инициализации
       и каждый раз, когда список перерисовал твой код. */
    CustomSelect.prototype.syncFromSelect = function () {
        var items = [];
        var nodes = this.select.children;

        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            if (node.tagName === 'OPTGROUP') {
                for (var j = 0; j < node.children.length; j++) {
                    items.push(readOption(node.children[j], node.label));
                }
            } else if (node.tagName === 'OPTION') {
                items.push(readOption(node, null));
            }
        }

        this.items = items;
        this.updateField();

        if (this.isOpen) this.renderList('');
    };

    function readOption(opt, group) {
        return {
            value: opt.value,
            label: (opt.textContent || '').trim(),
            disabled: opt.disabled,
            group: group
        };
    }

    CustomSelect.prototype.updateField = function () {
        var value = this.select.value;
        var current = null;

        for (var i = 0; i < this.items.length; i++) {
            if (this.items[i].value === value) { current = this.items[i]; break; }
        }

        var placeholder = this.select.dataset.csPlaceholder || '—';
        this.valueEl.textContent = current ? current.label : placeholder;
        this.valueEl.classList.toggle('is-placeholder', !current || current.value === '');

        var disabled = this.select.disabled;
        this.field.disabled = disabled;
        this.field.setAttribute('aria-disabled', disabled ? 'true' : 'false');
    };

    /* Следим за тем, как твой код меняет селект: подмена опций,
       программная установка value, disabled, style.display. */
    CustomSelect.prototype.watch = function () {
        var self = this;

        if (global.MutationObserver) {
            this.observer = new MutationObserver(function () {
                self.syncFromSelect();
                self.syncStyle();
            });
            this.observer.observe(this.select, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['disabled', 'style', 'class']
            });
        }

        /* Присвоение select.value — это свойство, а не атрибут, и никакой
           observer его не поймает. Перехватываем сеттер, чтобы подпись на
           кнопке обновлялась при программной установке значения. */
        try {
            var desc = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
            if (desc && desc.get && desc.set) {
                Object.defineProperty(this.select, 'value', {
                    configurable: true,
                    get: function () { return desc.get.call(self.select); },
                    set: function (v) {
                        desc.set.call(self.select, v);
                        self.updateField();
                    }
                });
                this.valuePatched = true;
            }
        } catch (e) { /* экзотический движок — обойдёмся без перехвата */ }

        // Если значение выставили и сами кинули change
        this.select.addEventListener('change', function () {
            if (!self.silent) self.updateField();
        });
    };

    /* Переносим на кнопку display, выставленный скриптом на селекте:
       скрытый селект на style.display = 'none' уже не реагирует. */
    CustomSelect.prototype.syncStyle = function () {
        var display = this.select.style.display;
        this.field.style.display = (display === 'none') ? 'none' : (display || '');
    };

    CustomSelect.prototype.toggle = function () {
        if (this.isOpen) this.close(); else this.open();
    };

    CustomSelect.prototype.open = function () {
        if (this.isOpen || this.select.disabled) return;
        if (openInstance) openInstance.close();

        var self = this;
        this.isOpen = true;
        openInstance = this;
        this.field.setAttribute('aria-expanded', 'true');

        var overlay = document.createElement('div');
        overlay.className = 'cs-overlay';

        var useSearch = this.select.dataset.csSearch === 'always' ||
            (this.select.dataset.csSearch !== 'never' && this.items.length >= SEARCH_THRESHOLD);

        overlay.innerHTML =
            '<div class="cs-sheet" role="dialog" aria-modal="true">' +
            '<div class="cs-grabber"></div>' +
            '<div class="cs-title"></div>' +
            (useSearch
                ? '<div class="cs-search"><input type="text" inputmode="search" ' +
                  'autocomplete="off" placeholder="Поиск"></div>'
                : '') +
            '<div class="cs-list" role="listbox" tabindex="-1"></div>' +
            '</div>';

        overlay.querySelector('.cs-title').textContent = this.title();

        this.overlay = overlay;
        this.sheet = overlay.querySelector('.cs-sheet');
        this.listEl = overlay.querySelector('.cs-list');
        this.searchEl = overlay.querySelector('.cs-search input');

        document.body.appendChild(overlay);
        document.body.classList.add('cs-lock');

        if (isDesktop()) this.positionSheet();

        this.renderList('');

        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) self.close();
        });

        this.listEl.addEventListener('click', function (e) {
            var btn = e.target.closest('.cs-option');
            if (!btn || btn.getAttribute('aria-disabled') === 'true') return;
            self.commit(btn.dataset.value);
        });

        if (this.searchEl) {
            this.searchEl.addEventListener('input', function () {
                self.renderList(self.searchEl.value);
            });
            this.searchEl.addEventListener('keydown', this.onListKey.bind(this));
        }

        this.listEl.addEventListener('keydown', this.onListKey.bind(this));
        this._onDocKey = this.onDocKey.bind(this);
        document.addEventListener('keydown', this._onDocKey);

        this._onReposition = function () {
            if (isDesktop()) self.positionSheet(); else self.close();
        };
        global.addEventListener('resize', this._onReposition);
        global.addEventListener('scroll', this._onReposition, true);

        // Запускаем анимацию въезда в следующем кадре
        requestAnimationFrame(function () {
            overlay.classList.add('is-open');
            if (self.searchEl && isDesktop()) self.searchEl.focus();
            else self.focusSelected();
        });

        haptic();
    };

    CustomSelect.prototype.positionSheet = function () {
        var rect = this.field.getBoundingClientRect();
        var sheet = this.sheet;
        sheet.style.setProperty('--cs-anchor-width', rect.width + 'px');
        sheet.style.setProperty('--cs-anchor-left', rect.left + 'px');

        var spaceBelow = global.innerHeight - rect.bottom;
        var top = spaceBelow < 260 && rect.top > 260
            ? rect.top - Math.min(320, this.items.length * 38 + 12) - 6
            : rect.bottom + 6;

        sheet.style.setProperty('--cs-anchor-top', Math.max(8, top) + 'px');
    };

    CustomSelect.prototype.renderList = function (query) {
        var q = (query || '').trim().toLowerCase();
        var value = this.select.value;
        var html = '';
        var lastGroup = null;
        var shown = 0;

        for (var i = 0; i < this.items.length; i++) {
            var item = this.items[i];
            if (q && item.label.toLowerCase().indexOf(q) === -1) continue;

            if (item.group && item.group !== lastGroup) {
                html += '<div class="cs-group-label">' + escapeHtml(item.group) + '</div>';
                lastGroup = item.group;
            }

            html +=
                '<button type="button" class="cs-option" role="option"' +
                ' data-value="' + escapeHtml(item.value) + '"' +
                ' aria-selected="' + (item.value === value ? 'true' : 'false') + '"' +
                (item.disabled ? ' aria-disabled="true"' : '') + '>' +
                '<span class="cs-option-label">' + escapeHtml(item.label) + '</span>' +
                ICON_CHECK +
                '</button>';
            shown++;
        }

        this.listEl.innerHTML = shown
            ? html
            : '<div class="cs-empty">Ничего не найдено</div>';

        this.buttons = Array.prototype.slice.call(this.listEl.querySelectorAll('.cs-option'));
        this.activeIndex = -1;
    };

    CustomSelect.prototype.focusSelected = function () {
        for (var i = 0; i < this.buttons.length; i++) {
            if (this.buttons[i].getAttribute('aria-selected') === 'true') {
                this.setActive(i);
                this.buttons[i].scrollIntoView({ block: 'center' });
                return;
            }
        }
        if (this.buttons.length) this.setActive(0);
    };

    CustomSelect.prototype.setActive = function (index) {
        if (this.activeIndex >= 0 && this.buttons[this.activeIndex]) {
            this.buttons[this.activeIndex].classList.remove('is-active');
        }
        this.activeIndex = index;
        var btn = this.buttons[index];
        if (btn) {
            btn.classList.add('is-active');
            btn.focus({ preventScroll: true });
            btn.scrollIntoView({ block: 'nearest' });
        }
    };

    CustomSelect.prototype.move = function (delta) {
        if (!this.buttons.length) return;
        var next = this.activeIndex;
        for (var step = 0; step < this.buttons.length; step++) {
            next = (next + delta + this.buttons.length) % this.buttons.length;
            if (this.buttons[next].getAttribute('aria-disabled') !== 'true') {
                this.setActive(next);
                return;
            }
        }
    };

    CustomSelect.prototype.onFieldKey = function (e) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.open();
        }
    };

    CustomSelect.prototype.onListKey = function (e) {
        if (e.key === 'ArrowDown') { e.preventDefault(); this.move(1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); this.move(-1); }
        else if (e.key === 'Home') { e.preventDefault(); this.setActive(0); }
        else if (e.key === 'End') { e.preventDefault(); this.setActive(this.buttons.length - 1); }
        else if (e.key === 'Enter') {
            e.preventDefault();
            var btn = this.buttons[this.activeIndex];
            if (btn && btn.getAttribute('aria-disabled') !== 'true') this.commit(btn.dataset.value);
        }
    };

    CustomSelect.prototype.onDocKey = function (e) {
        if (e.key === 'Escape') { e.preventDefault(); this.close(); }
    };

    CustomSelect.prototype.commit = function (value) {
        var changed = this.select.value !== value;

        this.silent = true;
        this.select.value = value;
        this.silent = false;

        this.updateField();
        this.close();

        if (changed) {
            haptic();
            // Настоящее событие — существующие обработчики его поймают
            this.select.dispatchEvent(new Event('input', { bubbles: true }));
            this.select.dispatchEvent(new Event('change', { bubbles: true }));
        }
    };

    CustomSelect.prototype.close = function () {
        if (!this.isOpen) return;

        var self = this;
        var overlay = this.overlay;

        this.isOpen = false;
        if (openInstance === this) openInstance = null;
        this.field.setAttribute('aria-expanded', 'false');

        document.removeEventListener('keydown', this._onDocKey);
        global.removeEventListener('resize', this._onReposition);
        global.removeEventListener('scroll', this._onReposition, true);

        overlay.classList.remove('is-open');
        document.body.classList.remove('cs-lock');

        var done = function () {
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        };
        overlay.addEventListener('transitionend', done, { once: true });
        setTimeout(done, 400); // страховка, если transitionend не придёт

        this.overlay = this.sheet = this.listEl = this.searchEl = null;
        this.buttons = [];

        try { self.field.focus({ preventScroll: true }); } catch (e) {}
    };

    CustomSelect.prototype.destroy = function () {
        this.close();
        if (this.observer) this.observer.disconnect();
        if (this.valuePatched) {
            try { delete this.select.value; } catch (e) {}
        }
        if (this.field && this.field.parentNode) this.field.parentNode.removeChild(this.field);
        this.select.classList.remove('cs-native');
        this.select.removeAttribute('aria-hidden');
        this.select.removeAttribute('tabindex');
    };

    function escapeHtml(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    var API = {
        /* Улучшает все селекты по селектору. Повторный вызов безопасен —
           уже обработанные пропускаются. */
        init: function (selector) {
            var list = document.querySelectorAll(selector || 'select');
            for (var i = 0; i < list.length; i++) {
                var el = list[i];
                if (el.dataset.csSkip !== undefined) continue;
                if (el.classList.contains('cs-native')) continue;
                var inst = new CustomSelect(el);
                el._customSelect = inst;
                instances.push(inst);
            }
            return instances;
        },

        /* Позвать, если добавил опции в обход DOM-мутаций или сомневаешься. */
        refresh: function (el) {
            if (el && el._customSelect) { el._customSelect.syncFromSelect(); return; }
            for (var i = 0; i < instances.length; i++) instances[i].syncFromSelect();
        },

        closeAll: function () { if (openInstance) openInstance.close(); },

        destroyAll: function () {
            while (instances.length) instances.pop().destroy();
        }
    };

    global.CustomSelect = API;
})(window);
