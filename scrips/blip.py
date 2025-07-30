import os
import json
from PIL import Image
from transformers import BlipProcessor, BlipForConditionalGeneration
from tqdm import tqdm
import torch

def initialize_models():
    device = "cuda" if torch.cuda.is_available() else "cpu"
    processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
    img_model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base").to(device)
    return processor, img_model, device

def generate_description(image_path, processor, img_model, device):
    try:
        image = Image.open(image_path).convert('RGB')
        prompt = "Describe the clothing in detail."
        inputs = processor(image, text=prompt, return_tensors="pt").to(device)
        outputs = img_model.generate(**inputs, max_length=100)
        description = processor.decode(outputs[0], skip_special_tokens=True)
        return description.strip()
    except Exception as e:
        print(f"[ERROR] Describiendo {image_path}: {e}")
        return None

def process_images_in_stores(stores_dir):
    processor, img_model, device = initialize_models()
    results = []
    all_images = []
    for root, _, files in os.walk(stores_dir):
        for file in files:
            if file.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
                all_images.append(os.path.join(root, file))

    for img_path in tqdm(all_images, desc="Procesando imágenes"):
        description = generate_description(img_path, processor, img_model, device)
        if not description:
            continue
        results.append({
            "image_path": img_path,
            "description": description
        })

    output_file = "clothing_catalog_analysis.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    print(f"\nProceso completado. Resultados guardados en {output_file}")

if __name__ == "__main__":
    # Carpeta 'stores' dentro de 'public'
    script_dir = os.path.dirname(os.path.abspath(__file__))
    stores_dir = os.path.join(script_dir, "stores")
    process_images_in_stores(stores_dir)