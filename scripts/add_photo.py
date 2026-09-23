#!/usr/bin/env python3
"""Prepare a photo for the Amara Health site.

Applies the Amara campaign grade (restrained warmth, softly lifted shadows,
gentle contrast) and writes four files into assets/img/:
    NAME.jpg, NAME.avif         full size (long side capped at 1800px)
    NAME-800.jpg, NAME-800.avif  800px long side, for phones

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

from PIL import Image, ImageEnhance, ImageOps

OUT = Path(__file__).resolve().parent.parent / "assets" / "img"


def grade(im):
    """Amara campaign grade. Keep it restrained: skin tones and food must stay true."""
    im = im.convert("RGB")
    im = ImageEnhance.Contrast(im).enhance(0.95)
    im = ImageEnhance.Color(im).enhance(0.96)
    r, g, b = im.split()
    lift = 9  # matte shadows
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


def export(im, name):
    for long_side, suffix in ((1800, ""), (800, "-800")):
        t = im.copy()
        t.thumbnail((long_side, long_side), Image.LANCZOS)
        t.save(OUT / f"{name}{suffix}.jpg", quality=82, optimize=True, progressive=True)
        t.save(OUT / f"{name}{suffix}.avif", quality=58, speed=4)
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
