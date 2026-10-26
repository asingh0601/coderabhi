# -*- coding: utf-8 -*-
"""Regenerates the raster icons from the same geometry as assets/logo-tile.svg.

The SVG is the source of truth for the mark; this redraws it with Pillow so
the favicons and the social card can be rebuilt without a design tool. Keep
the numbers here in step with logo-tile.svg if the mark ever changes.

    python tools/make-icons.py

Everything is drawn at 8x and downsampled, which is cheaper than hunting for
an antialiasing flag Pillow does not have.
"""
import math
import os

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, 'assets')

BLUE = (108, 155, 255, 255)      # --blue
INK = (11, 14, 20, 255)          # --bg
PAPER = (230, 235, 245, 255)     # --text
DIM = (151, 161, 187, 255)       # --dim

SS = 8                           # supersample factor
UNIT = 64                        # the SVG's coordinate space


def tile(size):
    """The mark set in a rounded tile, exactly as logo-tile.svg draws it."""
    n = size * SS
    s = n / float(UNIT)
    img = Image.new('RGBA', (n, n), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    d.rounded_rectangle([0, 0, n - 1, n - 1], radius=15 * s, fill=BLUE)

    w = 6 * s                    # stroke width
    r = w / 2.0                  # cap radius

    def line(x1, y1, x2, y2):
        d.line([x1 * s, y1 * s, x2 * s, y2 * s], fill=INK, width=int(round(w)))

    def arc(cx, cy, rad, start, end):
        # Pillow lays the stroke inward from the bounding box, so a box of
        # radius `rad` puts the centreline at rad - w/2. Grow the box by half
        # the stroke to land the centreline where the SVG puts it.
        out = rad + w / (2.0 * s)
        box = [(cx - out) * s, (cy - out) * s, (cx + out) * s, (cy + out) * s]
        d.arc(box, start, end, fill=INK, width=int(round(w)))

    def cap(x, y):
        d.ellipse([x * s - r, y * s - r, x * s + r, y * s + r], fill=INK)

    # C: one arc, open to the right
    arc(24.765, 32.2, 13.5, 60.1, 299.9)
    cap(31.5, 20.5)
    cap(31.5, 43.9)

    # R: stem, bowl, leg
    line(37.5, 19.5, 37.5, 44.5)
    line(37.5, 19.5, 44, 19.5)
    arc(44, 26.25, 6.75, 270, 90)
    line(44, 33, 37.5, 33)
    line(42, 33, 49.5, 44.5)
    for p in [(37.5, 19.5), (37.5, 44.5), (44, 19.5), (44, 33), (37.5, 33),
              (42, 33), (49.5, 44.5)]:
        cap(*p)

    return img.resize((size, size), Image.LANCZOS)


def font(names, size):
    """First of these Windows faces that actually exists, else the default."""
    for name in names:
        path = os.path.join(r'C:\Windows\Fonts', name)
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except OSError:
                pass
    return ImageFont.load_default()


def social():
    """The 1200x630 card that shows up when a link is pasted somewhere."""
    w, h = 1200, 630
    img = Image.new('RGBA', (w, h), INK)
    d = ImageDraw.Draw(img)

    # a soft wash in the corner, the same idea as the site's hero
    glow = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    for i in range(44, 0, -1):
        a = int(2 + i * 0.7)
        rad = i * 26
        gd.ellipse([w - rad, -rad // 2, w + rad, h // 2 + rad],
                   fill=(108, 155, 255, max(1, a // 9)))
    img.alpha_composite(glow)

    mark = tile(150)
    img.alpha_composite(mark, (86, 96))

    name = font(['segoeuib.ttf', 'seguisb.ttf', 'arialbd.ttf'], 82)
    role = font(['segoeui.ttf', 'arial.ttf'], 36)
    mono = font(['consola.ttf', 'cour.ttf'], 28)

    d.text((86, 300), 'Abhishek Singh', font=name, fill=PAPER)
    d.text((90, 404), 'Software engineer \u00b7 11+ years', font=role, fill=DIM)
    d.text((90, 470), 'backend \u00b7 cloud \u00b7 AI that reaches real users',
           font=role, fill=DIM)
    d.text((90, 548), 'coderabhi.in', font=mono, fill=BLUE)

    return img.convert('RGB')


def main():
    for size, name in [(180, 'favicon-180.png'), (32, 'favicon-32.png'),
                       (512, 'logo-tile.png')]:
        p = os.path.join(ASSETS, name)
        tile(size).save(p)
        print('wrote', name)

    base = tile(256)
    base.save(os.path.join(ASSETS, 'favicon.ico'), format='ICO',
              sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
    print('wrote favicon.ico')

    social().save(os.path.join(ASSETS, 'og-image.png'), optimize=True)
    print('wrote og-image.png')


if __name__ == '__main__':
    main()
