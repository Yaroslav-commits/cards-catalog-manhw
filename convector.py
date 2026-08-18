import os
from PIL import Image, ImageFile

# 🔥 МАГИЧЕСКАЯ СТРОКА: заставляет скрипт игнорировать битые концы файлов
ImageFile.LOAD_TRUNCATED_IMAGES = True

# 📂 Теперь здесь список папок, с которыми мы работаем
folders = ['images', 'images/skins']

# Перебираем каждую папку из списка
for folder_path in folders:
    print(f"\n🔍 Проверяем папку: {folder_path}")

    if not os.path.exists(folder_path):
        print(f"⚠️ Папка '{folder_path}' не найдена, пропускаем.")
        continue  # Переходим к следующей папке

    # Перебираем все файлы в текущей папке
    for filename in os.listdir(folder_path):
        if filename.lower().endswith(('.jpeg', '.jpg')):
            old_path = os.path.join(folder_path, filename)

            new_filename = filename.rsplit('.', 1)[0] + '.webp'
            new_path = os.path.join(folder_path, new_filename)

            if os.path.exists(new_path):
                print(f"⏭️ Пропущено (уже есть): {new_path}")
                continue

            try:
                with Image.open(old_path) as img:
                    img.save(new_path, 'webp')
                print(f"✅ Конвертировано: {old_path} -> {new_filename}")
            except Exception as e:
                print(f"❌ Ошибка с {old_path}: {e}")