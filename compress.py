from PIL import Image
import os

# Путь к твоей папке с картами
directory = "images/"

for filename in os.listdir(directory):
    if filename.endswith((".png", ".jpg", ".jpeg")):
        filepath = os.path.join(directory, filename)

        # Открываем картинку
        img = Image.open(filepath)

        # Конвертируем в WebP и сохраняем с качеством 80% (визуально не отличить, но вес падает в 5-10 раз)
        new_filename = filename.rsplit('.', 1)[0] + '.webp'
        img.save(os.path.join(directory, new_filename), 'webp', quality=80)

        print(f"Сжато: {new_filename}")

print("Готово! Теперь можешь поменять расширения в cards.json на .webp")