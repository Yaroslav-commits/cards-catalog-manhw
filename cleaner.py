import os

# 📂 Тот же список папок для очистки
folders = ['images', 'images/skins']

# Перебираем каждую папку
for folder_path in folders:
    print(f"\n🧹 Очищаем папку: {folder_path}")

    if not os.path.exists(folder_path):
        print(f"⚠️ Папка '{folder_path}' не найдена, пропускаем.")
        continue

    for filename in os.listdir(folder_path):
        if filename.lower().endswith(('.jpeg', '.jpg')):
            file_path = os.path.join(folder_path, filename)

            try:
                os.remove(file_path)
                print(f"🗑️ Удален: {file_path}")
            except Exception as e:
                print(f"❌ Ошибка при удалении {file_path}: {e}")