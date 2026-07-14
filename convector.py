import os
from PIL import Image

# Указываем папку с картинками
folder_path = 'images'

# Проверяем, существует ли папка
if not os.path.exists(folder_path):
    print(f"Папка '{folder_path}' не найдена!")
else:
    # Перебираем все файлы в папке
    for filename in os.listdir(folder_path):
        # Ищем файлы, которые заканчиваются на .jpeg (игнорируя регистр букв)
        if filename.lower().endswith('.jpeg'):
            # Создаем полные пути к файлам
            old_path = os.path.join(folder_path, filename)

            # Меняем расширение с .jpeg на .webp для нового файла
            new_filename = filename.rsplit('.', 1)[0] + '.webp'
            new_path = os.path.join(folder_path, new_filename)

            try:
                # Открываем оригинальную картинку и сохраняем как WebP
                with Image.open(old_path) as img:
                    img.save(new_path, 'webp')
                print(f"✅ Успешно конвертировано: {filename} -> {new_filename}")
            except Exception as e:
                print(f"❌ Ошибка при конвертации {filename}: {e}")