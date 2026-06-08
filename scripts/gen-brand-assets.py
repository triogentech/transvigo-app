#!/usr/bin/env python3
"""Generate all branded app + Play Store assets from the TransVigo logo.

The logo is a light-background mark (dark "TRANSVIGO" wordmark + colour swoosh),
so every surface uses a light background for legibility. Run from driver-app/:
    python3 scripts/gen-brand-assets.py
"""
from PIL import Image, ImageDraw, ImageFont
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, "assets", "images")
STORE = os.path.join(ROOT, "store")
os.makedirs(STORE, exist_ok=True)

NAVY = (27, 45, 107)      # #1B2D6B
WHITE = (255, 255, 255)

logo = Image.open(os.path.join(IMG, "transvigo-logo.png")).convert("RGBA")

def trim(im):
    """Crop fully-transparent margins using the alpha channel."""
    bbox = im.split()[3].getbbox()
    return im.crop(bbox) if bbox else im

mark = trim(logo)  # tight logo

def fit_width(im, target_w):
    w, h = im.size
    s = target_w / w
    return im.resize((round(w * s), round(h * s)), Image.LANCZOS)

def centered(canvas_size, content, bg):
    """Paste `content` centered onto a `bg`-filled square canvas."""
    cw = Image.new("RGBA", (canvas_size, canvas_size), bg + (255,))
    cx = (canvas_size - content.width) // 2
    cy = (canvas_size - content.height) // 2
    cw.alpha_composite(content, (cx, cy))
    return cw

def centered_transparent(canvas_size, content):
    cw = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    cx = (canvas_size - content.width) // 2
    cy = (canvas_size - content.height) // 2
    cw.alpha_composite(content, (cx, cy))
    return cw

# 1. App icon (1024) — white bg, logo at 82% width. Flattened (no alpha) for iOS.
icon = centered(1024, fit_width(mark, int(1024 * 0.82)), WHITE).convert("RGB")
icon.save(os.path.join(IMG, "icon.png"))

# 2. Adaptive icon foreground (1024) — logo within the ~62% safe zone, transparent.
adaptive = centered_transparent(1024, fit_width(mark, int(1024 * 0.62)))
adaptive.save(os.path.join(IMG, "adaptive-icon.png"))

# 3. Splash (1600 square) — logo at 66% width on transparent; contained on white.
splash = centered_transparent(1600, fit_width(mark, int(1600 * 0.66)))
splash.save(os.path.join(IMG, "splash.png"))

# 4. Notification icon (256) — white silhouette of the swoosh (top crop), transparent.
top = mark.crop((0, 0, mark.width, int(mark.height * 0.46)))
top = trim(top)
alpha = top.split()[3]
sil = Image.new("RGBA", top.size, (255, 255, 255, 0))
white_fill = Image.new("RGBA", top.size, (255, 255, 255, 255))
sil.paste(white_fill, (0, 0), mask=alpha)
sil = fit_width(sil, int(256 * 0.92))
notif = centered_transparent(256, sil)
notif.save(os.path.join(IMG, "notification-icon.png"))

# 5. Favicon (48) — downscaled app icon.
icon.resize((48, 48), Image.LANCZOS).save(os.path.join(IMG, "favicon.png"))

# 6. Play Store hi-res icon (512) — white bg + logo.
icon.resize((512, 512), Image.LANCZOS).save(os.path.join(STORE, "play-icon-512.png"))

# 7. Feature graphic (1024x500) — navy bg, white rounded card holding the logo.
fg = Image.new("RGBA", (1024, 500), NAVY + (255,))
draw = ImageDraw.Draw(fg)
card_w, card_h = 760, 300
cx0 = (1024 - card_w) // 2
cy0 = (500 - card_h) // 2 - 14
draw.rounded_rectangle([cx0, cy0, cx0 + card_w, cy0 + card_h], radius=28, fill=WHITE + (255,))
logo_in_card = fit_width(mark, int(card_w * 0.80))
fg.alpha_composite(logo_in_card, (cx0 + (card_w - logo_in_card.width) // 2,
                                   cy0 + (card_h - logo_in_card.height) // 2))
# tagline under the card
tagline = "Fleet operations in your pocket"
font = None
for fp in ["/System/Library/Fonts/Supplemental/Arial Bold.ttf",
           "/System/Library/Fonts/Helvetica.ttc",
           "/System/Library/Fonts/Supplemental/Arial.ttf"]:
    if os.path.exists(fp):
        try:
            font = ImageFont.truetype(fp, 30)
            break
        except Exception:
            pass
if font:
    tb = draw.textbbox((0, 0), tagline, font=font)
    tw = tb[2] - tb[0]
    draw.text(((1024 - tw) // 2, cy0 + card_h + 24), tagline, font=font, fill=WHITE + (255,))
fg.convert("RGB").save(os.path.join(STORE, "feature-graphic-1024x500.png"))

print("Generated assets:")
for p in ["icon.png", "adaptive-icon.png", "splash.png", "notification-icon.png", "favicon.png"]:
    im = Image.open(os.path.join(IMG, p))
    print(f"  assets/images/{p:22} {im.size} {im.mode}")
for p in ["play-icon-512.png", "feature-graphic-1024x500.png"]:
    im = Image.open(os.path.join(STORE, p))
    print(f"  store/{p:30} {im.size} {im.mode}")
