import os
import re
import shutil
from pathlib import Path

def renumber_images(base_path):
    """
    Recorre las carpetas y reenumera las imágenes manteniendo el formato:
    tienda_categoria_##.webp
    """
    for store in os.listdir(base_path):
        store_path = os.path.join(base_path, store, 'catalog')
        if not os.path.isdir(store_path):
            continue
        
        for category in os.listdir(store_path):
            category_path = os.path.join(store_path, category)
            if not os.path.isdir(category_path):
                continue
            
            # Obtener todas las imágenes de la categoría
            images = []
            pattern = re.compile(rf"^{store}_{category}_(\d+)\.webp$", re.IGNORECASE)
            
            for filename in os.listdir(category_path):
                match = pattern.match(filename)
                if match:
                    num = int(match.group(1))
                    images.append((num, filename))
            
            # Si no hay imágenes, continuar con la siguiente categoría
            if not images:
                continue
            
            # Ordenar por número original
            images.sort()
            
            # Renumerar
            temp_dir = os.path.join(category_path, 'temp_renumber')
            os.makedirs(temp_dir, exist_ok=True)
            
            try:
                # Primero mover todas las imágenes a temporal
                for idx, (old_num, filename) in enumerate(images, start=1):
                    old_path = os.path.join(category_path, filename)
                    new_temp_path = os.path.join(temp_dir, f"{store}_{category}_{idx:02d}.webp")
                    shutil.move(old_path, new_temp_path)
                
                # Mover de vuelta con los nuevos números
                for idx in range(1, len(images) + 1):
                    temp_path = os.path.join(temp_dir, f"{store}_{category}_{idx:02d}.webp")
                    new_path = os.path.join(category_path, f"{store}_{category}_{idx:02d}.webp")
                    shutil.move(temp_path, new_path)
                
                print(f"Renumeradas {len(images)} imágenes en {store}/{category}")
            
            finally:
                # Eliminar directorio temporal si existe
                if os.path.exists(temp_dir):
                    shutil.rmtree(temp_dir)

if __name__ == "__main__":
    base_directory = "./stores"  # Cambia esto por tu ruta base
    renumber_images(base_directory)
    print("Proceso de renumeración completado")