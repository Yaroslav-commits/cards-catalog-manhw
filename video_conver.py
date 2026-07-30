import os
from moviepy import VideoFileClip

# Указываем конкретную папку для видео
folder_path = 'images/skins'

if not os.path.exists(folder_path):
    print(f"Папка '{folder_path}' не найдена!")
else:
    print(f"🔍 Сканируем папку: {folder_path}\n")

    for filename in os.listdir(folder_path):
        if filename.lower().endswith('.mp4'):
            old_path = os.path.join(folder_path, filename)

            # Меняем расширение на .webm
            new_filename = filename.rsplit('.', 1)[0] + '.webm'
            new_path = os.path.join(folder_path, new_filename)

            # Проверка на то, существует ли уже конвертированное видео
            if os.path.exists(new_path):
                print(f"⏭️ Пропущено (уже есть .webm): {new_filename}")
                continue

            try:
                print(f"⏳ Конвертируем: {filename} -> {new_filename} ...")

                # Загружаем видео
                clip = VideoFileClip(old_path)

                # Сохраняем в формате WebM (используя видеокодек libvpx)
                clip.write_videofile(
                    new_path,
                    codec='libvpx',
                    audio_codec='libvorbis',
                    logger=None  # Отключает лишний служебный вывод в консоль
                )

                # Закрываем файл, чтобы освободить оперативную память
                clip.close()

                print(f"✅ Успешно конвертировано: {new_filename}\n")

            except Exception as e:
                print(f"❌ Ошибка при конвертации {filename}: {e}\n")