import os
import json
from pathlib import Path

def generar_estructura_tiendas(ruta_base):
    estructura = {}
    
    # Recorrer todas las carpetas de tiendas
    for tienda_dir in Path(ruta_base).iterdir():
        if tienda_dir.is_dir():
            tienda_id = tienda_dir.name
            estructura_tienda = {
                "id": tienda_id,
                "categorias": {},
                "info": {}
            }
            
            # Leer el archivo info.json si existe
            info_json_path = tienda_dir / "info.json"
            if info_json_path.exists():
                with open(info_json_path, 'r', encoding='utf-8') as f:
                    estructura_tienda["info"] = json.load(f)
            
            # Buscar la carpeta de catálogo (puede llamarse 'catalogo' o 'catalog')
            catalogo_dir = None
            for possible_dir in ['catalogo', 'catalog']:
                if (tienda_dir / possible_dir).exists():
                    catalogo_dir = tienda_dir / possible_dir
                    break
            
            if catalogo_dir:
                # Recorrer el catálogo de categorías
                for categoria_dir in catalogo_dir.iterdir():
                    if categoria_dir.is_dir():
                        categoria_nombre = categoria_dir.name
                        imagenes = []
                        
                        # Recoger todas las imágenes .webp en la categoría
                        for imagen_path in categoria_dir.glob('*.webp'):
                            # Guardar la ruta relativa desde la carpeta stores
                            ruta_relativa = str(imagen_path.relative_to(ruta_base))
                            imagenes.append(ruta_relativa)
                        
                        # Solo agregar si hay imágenes
                        if imagenes:
                            estructura_tienda["categorias"][categoria_nombre] = imagenes
            
            estructura[tienda_id] = estructura_tienda
    
    return estructura

if __name__ == "__main__":
    # Ruta base donde se encuentra la carpeta stores
    ruta_base = "./stores"
    
    # Generar la estructura
    datos_tiendas = generar_estructura_tiendas(ruta_base)
    
    # Guardar el resultado en un archivo JSON
    output_file = "tiendas_catalogo_completo.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(datos_tiendas, f, ensure_ascii=False, indent=2)
    
    print(f"Archivo JSON generado: {output_file}")