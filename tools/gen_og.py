#!/usr/bin/env python3
"""
Regenera img/og-photo.jpg (1200x630) — la imagen que se ve al compartir el link —
a partir de img/photo.jpg, centrada sobre un fondo tomado del borde de la foto.

Uso:   python3 tools/gen_og.py
Requisitos: Pillow  (pip install pillow)
"""
import pathlib
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
W, H = 1200, 630

photo = Image.open(ROOT / "img" / "photo.jpg").convert("RGB")

# Fondo: promedio de las esquinas superiores (fondo puro, sin tocar la cabeza)
def patch_avg(box):
    return photo.crop(box).resize((1, 1), Image.LANCZOS).getpixel((0, 0))
c = photo.width // 6
tl = patch_avg((0, 0, c, c))
tr = patch_avg((photo.width - c, 0, photo.width, c))
bg = tuple(round((a + b) / 2) for a, b in zip(tl, tr))

canvas = Image.new("RGB", (W, H), bg)

# "contain": escalar la foto para que entre completa, y centrarla
scale = min(W / photo.width, H / photo.height)
new = photo.resize((round(photo.width * scale), round(photo.height * scale)), Image.LANCZOS)
canvas.paste(new, ((W - new.width) // 2, (H - new.height) // 2))

canvas.save(ROOT / "img" / "og-photo.jpg", quality=88, optimize=True, progressive=True)
print(f"OK · img/og-photo.jpg {W}x{H} (fondo {bg})")
