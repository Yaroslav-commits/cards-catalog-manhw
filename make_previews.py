"""
Лёгкие превью карт для сеток (открытие круток, каталог, коллекция).

Оригиналы артов огромные (до 3840×5120, ~0.6 МБ). Если показывать их в сетке
из 24 маленьких карт, телефон качает ~15 МБ и распаковывает гигабайт картинок —
отсюда подтормаживания. Превью: ширина 420 px, WebP, ~40–60 КБ.

Запуск (из корня репозитория):
    python make_previews.py            # создаст недостающие превью
    python make_previews.py --force    # пересоздаст все

Результат: images/preview/<имя файла>.webp
Если превью для карты нет, сайт сам возьмёт оригинал — ничего не сломается.
Поэтому после добавления новых карт просто запусти скрипт ещё раз и закоммить
папку images/preview.
"""
import json
import os
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, "images")
DST = os.path.join(SRC, "preview")
CARDS = os.path.join(ROOT, "cards.json")
WIDTH = 420
QUALITY = 78


def source_path(file_name):
    """Тот же путь, что берёт сайт: сначала как в cards.json, потом .webp."""
    p = os.path.join(SRC, file_name)
    if os.path.exists(p):
        return p
    alt = os.path.splitext(p)[0] + ".webp"
    return alt if os.path.exists(alt) else None


def main():
    force = "--force" in sys.argv
    os.makedirs(DST, exist_ok=True)
    with open(CARDS, encoding="utf-8") as f:
        cards = json.load(f)
    files = sorted({c.get("file") for c in cards if c.get("file")})

    made = skipped = missing = 0
    for name in files:
        out = os.path.join(DST, os.path.splitext(name)[0] + ".webp")
        if not force and os.path.exists(out):
            skipped += 1
            continue
        src = source_path(name)
        if not src:
            missing += 1
            continue
        try:
            im = Image.open(src)
            im.draft("RGB", (WIDTH, WIDTH * 2))  # быстрее для JPEG
            im = im.convert("RGB")
            h = round(im.height * WIDTH / im.width)
            im = im.resize((WIDTH, h), Image.LANCZOS)
            im.save(out, "WEBP", quality=QUALITY, method=6)
            made += 1
        except Exception as e:
            print(f"  ! {name}: {e}")
    print(f"Готово: создано {made}, уже было {skipped}, нет исходника {missing}")


if __name__ == "__main__":
    main()
