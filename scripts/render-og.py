#!/usr/bin/env python3
"""Commit-time renderer for the 1200x630 share cards. Not used at request time."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets"
LOGO = OUT / "logo.png"
W, H = 1200, 630
BG = (11, 6, 20)
INK = (243, 238, 251)
MUTED = (169, 155, 196)
ACCENT = (205, 184, 242)
STRONG = (138, 92, 240)

FONT = "/usr/share/fonts/truetype/macos/Inter-Bold.ttf"
FONT_MED = "/usr/share/fonts/truetype/macos/Inter-Medium.ttf"


def load_logo(height):
    logo = Image.open(LOGO).convert("RGBA")
    pixels = []
    for r, g, b, a in logo.getdata():
        if r < 18 and g < 18 and b < 18:
            pixels.append((r, g, b, 0))
        else:
            pixels.append((r, g, b, a))
    logo.putdata(pixels)
    ratio = height / logo.height
    return logo.resize((round(logo.width * ratio), height), Image.Resampling.LANCZOS)


def card(path, kicker, title, lines):
    base = Image.new("RGB", (W, H), BG)
    glow = Image.new("RGB", (W, H), BG)
    draw_glow = ImageDraw.Draw(glow)
    draw_glow.ellipse((-260, -160, 820, 820), fill=(42, 18, 96))
    draw_glow.ellipse((640, 280, 1400, 900), fill=(28, 12, 64))
    glow = glow.filter(ImageFilter.GaussianBlur(70))
    image = Image.blend(base, glow, 0.9)
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((28, 28, W - 28, H - 28), radius=28, outline=STRONG, width=2)

    logo = load_logo(72)
    image.paste(logo, (72, 64), logo)

    kicker_font = ImageFont.truetype(FONT_MED, 22)
    title_font = ImageFont.truetype(FONT, 92)
    line_font = ImageFont.truetype(FONT_MED, 32)
    draw.text((72, 250), kicker.upper(), font=kicker_font, fill=ACCENT)
    draw.text((68, 286), title, font=title_font, fill=INK)
    y = 420
    for line in lines:
        draw.text((72, y), line, font=line_font, fill=MUTED)
        y += 48
    image.save(path, "PNG", optimize=True)
    print(path.name, image.size)


def main():
    card(
        OUT / "og-home.png",
        "Western University chapter",
        "DevNet",
        ["12 cities. One network.", "London, Ontario"],
    )
    card(
        OUT / "og-western.png",
        "London, Ontario",
        "Western",
        ["DevNet at Western University", "Intro workshop · Nov 6"],
    )
    card(
        OUT / "og-socials.png",
        "DevNet",
        "Follow",
        ["LinkedIn · X · Instagram", "devnetwork.app"],
    )
    home = Image.open(OUT / "og-home.png")
    home.save(OUT / "og-image.png", "PNG", optimize=True)


if __name__ == "__main__":
    main()
