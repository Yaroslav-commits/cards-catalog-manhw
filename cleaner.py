import os

# Указываем папку с картинками
folder_path = 'images'

if not os.path.exists(folder_path):
    print(f"Папка '{folder_path}' не найдена!")
else:
    # Перебираем все файлы в папке
    for filename in os.listdir(folder_path):
        # Снова ищем только .jpeg файлы
        if filename.lower().endswith('.jpeg'):
            file_path = os.path.join(folder_path, filename)

            try:
                # Удаляем файл
                os.remove(file_path)
                print(f"🗑️ Успешно удален: {filename}")
            except Exception as e:
                print(f"❌ Ошибка при удалении {filename}: {e}")