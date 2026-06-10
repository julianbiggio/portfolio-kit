#!/usr/bin/env python3
"""
Regenera el favicon y los íconos a partir de las INICIALES de config.js
y el color de marca (--blue) de index.html.

Genera en icons/: favicon.svg, favicon-16.png, favicon-32.png, favicon.ico, apple-touch-icon.png

Uso:   python3 tools/gen_icons.py
Requisitos: Pillow  (pip install pillow)
"""
import re, pathlib
from PIL import Image, ImageDraw, ImageFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
FONT_BOLD = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"

def read(p):
    return (ROOT / p).read_text(encoding="utf-8")

def grab(pattern, text, default):
    m = re.search(pattern, text)
    return m.group(1) if m else default

# --- datos: iniciales (config.js) + color de marca (index.html) ---
cfg = read("config.js")
initials = grab(r'initials\s*:\s*"([^"]+)"', cfg, "JB")
color = "#" + grab(r'--blue:\s*#([0-9a-fA-F]{6})', read("index.html"), "2e44c9")

def rounded_icon(size, radius_ratio=0.22, square=False):
    """Ícono cuadrado con esquinas redondeadas e iniciales centradas en blanco."""
    ss = 4  # supersampling para bordes nítidos
    n = size * ss
    img = Image.new("RGBA", (n, n), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if square:   # apple-touch: iOS aplica su propia máscara, va lleno
        d.rectangle([0, 0, n, n], fill=color)
    else:
        d.rounded_rectangle([0, 0, n - 1, n - 1], radius=int(n * radius_ratio), fill=color)
    font = ImageFont.truetype(FONT_BOLD, int(n * 0.52))
    d.text((n / 2, n / 2 * 1.06), initials, font=font, fill="white", anchor="mm")
    return img.resize((size, size), Image.LANCZOS)

# --- carpeta de salida ---
ICONS = ROOT / "icons"
ICONS.mkdir(exist_ok=True)

# --- SVG (vectorial) ---
(ICONS / "favicon.svg").write_text(
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">'
    f'<rect width="100" height="100" rx="22" fill="{color}"/>'
    f'<text x="50" y="68" font-family="Arial,sans-serif" font-size="52" font-weight="700" '
    f'fill="white" text-anchor="middle">{initials}</text></svg>',
    encoding="utf-8")

# --- PNGs + ICO ---
rounded_icon(16).save(ICONS / "favicon-16.png")
rounded_icon(32).save(ICONS / "favicon-32.png")
rounded_icon(180, square=True).save(ICONS / "apple-touch-icon.png")
rounded_icon(48).save(ICONS / "favicon.ico",
                      sizes=[(16, 16), (32, 32), (48, 48)])

print(f"OK · iniciales='{initials}' color={color}")
print("  icons/: favicon.svg, favicon-16.png, favicon-32.png, favicon.ico, apple-touch-icon.png")
