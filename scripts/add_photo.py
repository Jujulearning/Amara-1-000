#!/usr/bin/env python3
"""Prepare a photo for the Amara Health site.

Applies the Amara campaign grade (restrained warmth, gentle shadow lift) and
writes three sizes into assets/img/, each as JPEG and AVIF:
    NAME-800   800px wide, for phones
    NAME-1400  1400px wide, for tablets and laptops
    NAME       up to 2400px wide, for large and Retina screens

Usage:
    python3 scripts/add_photo.py SOURCE NAME [--crop W:H] [--focus X]

    --crop 4:5   crop to an aspect ratio before exporting
    --focus 0.4  horizontal (for wide crops) or vertical (for tall crops)
                 centre of the crop, 0..1 (default 0.5)
    --vibrance 1.2  lift colour and contrast before grading, for sources
                    that arrive muted (default 1.0 = unchanged)

Requires Pillow 11.2+ (for AVIF).
"""
import argparse
from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter, ImageOps

OUT = Path(__file__).resolve().parent.parent / "assets" / "img"


def grade(im):
    """Amara campaign grade. Keep it restrained: skin tones and food must stay true."""
    im = im.convert("RGB")
    im = ImageEnhance.Color(im).enhance(0.98)
    r, g, b = im.split()
    lift = 4  # a touch of shadow lift; keep blacks deep so images stay crisp
    r = r.point(lambda v: min(255, int(lift + v * (252 - lift) / 255 * 1.018)))
    g = g.point(lambda v: int(lift + v * (250 - lift) / 255))
    b = b.point(lambda v: int(lift - 2 + v * (240 - lift) / 255))
    return Image.merge("RGB", (r, g, b))


def crop(im, ratio, focus):
    rw, rh = (float(x) for x in ratio.split(":"))
    w, h = im.size
    if w / h > rw / rh:  # too wide: trim sides
        cw = round(h * rw / rh)
        left = min(max(0, round(w * focus - cw / 2)), w - cw)
        return im.crop((left, 0, left + cw, h))
    ch = round(w * rh / rw)  # too tall: trim top/bottom
    top = min(max(0, round(h * focus - ch / 2)), h - ch)
    return im.crop((0, top, w, top + ch))


def export(im, name, sharpen=True):
    """One resize per output, then a single light sharpen tuned to that size."""
    widths = [(800, "-800"), (1400, "-1400"), (2400, "")]
    for w, suffix in widths:
        if suffix and im.width <= w:
            continue  # never upscale a smaller variant
        t = im.copy()
        if t.width > w:
            t = t.resize((w, round(t.height * w / t.width)), Image.LANCZOS)
        if sharpen:
            t = t.filter(ImageFilter.UnsharpMask(radius=0.6 if w <= 800 else 0.9, percent=60, threshold=2))
        t.save(OUT / f"{name}{suffix}.jpg", quality=90, optimize=True, progressive=True, subsampling=0)
        t.save(OUT / f"{name}{suffix}.avif", quality=80, speed=4)
    print(f"{name}: {im.size[0]}x{im.size[1]}")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("source")
    ap.add_argument("name")
    ap.add_argument("--crop")
    ap.add_argument("--focus", type=float, default=0.5)
    ap.add_argument("--vibrance", type=float, default=1.0)
    args = ap.parse_args()
    im = ImageOps.exif_transpose(Image.open(args.source)).convert("RGB")
    if args.crop:
        im = crop(im, args.crop, args.focus)
    if args.vibrance != 1.0:
        im = ImageEnhance.Color(im).enhance(args.vibrance)
        im = ImageEnhance.Contrast(im).enhance(1 + (args.vibrance - 1) / 2)
    export(grade(im), args.name)


if __name__ == "__main__":
    main()
