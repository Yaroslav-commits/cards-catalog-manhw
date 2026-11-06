"""
Миниатюры для тирлиста — ТОЛЬКО для карт из tierlist.json.

Запуск из корня репозитория веб-аппа (там, где лежит папка images/):
    pip install pillow
    python make_thumbs.py путь/к/tierlist.json

Как скрипт находит картинку карты (по порядку):
  1. поле "file" в tierlist.json — оно есть в выгрузке /tierexport;
  2. cards.py бота, если указать его:  --cards путь/к/data/cards.py
  3. файл в images/, имя которого совпадает с id карты (yu.webp и т.п.).

Результат: images/thumbs/<имя>.webp шириной 300 px. Остальные карты бота
не трогаются. Готовые миниатюры пропускаются; после /tieradd сделай
/tierexport, запусти скрипт на новом файле и закоммить папку thumbs.
"""

import argparse
import importlib.util
import json
import os
import sys

from PIL import Image

SRC = "images"
DST = os.path.join(SRC, "thumbs")
WIDTH = 300          # с запасом на зум 220% и ретину
QUALITY = 78
EXTS = (".webp", ".png", ".jpg", ".jpeg")


def load_cards(path):
    """Достаём словарь CARDS из cards.py, не импортируя остальной бот."""
    spec = importlib.util.spec_from_file_location("bot_cards", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return getattr(mod, "CARDS", {})


def index_images():
    """Имя файла без расширения (в нижнем регистре) → имя файла в images/."""
    out = {}
    for name in os.listdir(SRC):
        stem, ext = os.path.splitext(name)
        if ext.lower() in EXTS and os.path.isfile(os.path.join(SRC, name)):
            # .webp в приоритете — это то, что реально показывает веб-апп
            if stem.lower() not in out or ext.lower() == ".webp":
                out[stem.lower()] = name
    return out


def resolve(card_id, row, cards, images):
    """Имя файла в images/ для карты или None."""
    candidates = []
    if row.get("file"):
        candidates.append(row["file"])
    if cards and card_id in cards and cards[card_id].get("file"):
        candidates.append(cards[card_id]["file"])
    candidates.append(card_id)

    for cand in candidates:
        stem = os.path.splitext(os.path.basename(str(cand)))[0].lower()
        if stem in images:
            return images[stem]
    return None


def make_thumb(name):
    src = os.path.join(SRC, name)
    out = os.path.join(DST, os.path.splitext(name)[0] + ".webp")
    if os.path.exists(out) and os.path.getmtime(out) >= os.path.getmtime(src):
        return "skip"
    with Image.open(src) as im:
        im = im.convert("RGBA") if im.mode in ("P", "LA") else im
        if im.width > WIDTH:
            h = round(im.height * WIDTH / im.width)
            im = im.resize((WIDTH, h), Image.LANCZOS)
        im.save(out, "WEBP", quality=QUALITY, method=6)
    return "made"


def main():
    ap = argparse.ArgumentParser(description="Миниатюры для карт тирлиста")
    ap.add_argument("tierlist", nargs="?", default="tierlist.json",
                    help="tierlist.json (по умолчанию в текущей папке)")
    ap.add_argument("--cards", help="путь к data/cards.py бота")
    args = ap.parse_args()

    if not os.path.isdir(SRC):
        sys.exit("Нет папки images/ — запусти скрипт из корня веб-аппа")
    if not os.path.isfile(args.tierlist):
        sys.exit(f"Не найден {args.tierlist}")

    with open(args.tierlist, encoding="utf-8") as fh:
        seed = json.load(fh)

    cards = load_cards(args.cards) if args.cards else {}
    images = index_images()
    os.makedirs(DST, exist_ok=True)

    made = skipped = failed = 0
    missing = []
    seen = set()
    for rows in seed.values():
        for row in rows:
            cid = row.get("id")
            if not cid or cid in seen:
                continue
            seen.add(cid)
            name = resolve(cid, row, cards, images)
            if not name:
                missing.append(f"{cid} ({row.get('name', '')})")
                continue
            try:
                if make_thumb(name) == "made":
                    made += 1
                else:
                    skipped += 1
            except Exception as e:
                failed += 1
                print(f"  ✗ {cid} / {name}: {e}")

    print(f"Карт в тирлисте: {len(seen)}")
    print(f"Создано {made}, уже были {skipped}, ошибок {failed}, не найдено картинок {len(missing)}")
    if missing:
        print("\nНе нашёл картинку для:")
        for m in missing:
            print("  •", m)
        if not args.cards:
            print("\nПодсказка: укажи --cards путь/к/data/cards.py "
                  "или используй свежий файл из /tierexport — там есть имена файлов.")


if __name__ == "__main__":
    main()