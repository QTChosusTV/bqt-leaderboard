#!/usr/bin/env python3
"""
center_images.py
----------------
Loads all images from an input folder, centers the visible content
on a transparent canvas of the original image dimensions, and exports
them with the same filename to an output folder.

Usage:
    python center_images.py <input_folder> <output_folder>

Example:
    python center_images.py ./images ./centered
"""

import sys
import os
from pathlib import Path
from PIL import Image

SUPPORTED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp", ".tiff"}


def get_content_bbox(img: Image.Image) -> tuple[int, int, int, int] | None:
    """
    Returns the bounding box (left, top, right, bottom) of the non-transparent
    content in the image. Works for RGBA (alpha channel) and RGB images.
    Returns None if the image is completely transparent / empty.
    """
    if img.mode == "RGBA":
        # Use alpha channel to find non-transparent pixels
        alpha = img.split()[3]
        bbox = alpha.getbbox()
        return bbox
    else:
        # For non-RGBA images, convert to RGBA first to detect content
        rgba = img.convert("RGBA")
        alpha = rgba.split()[3]
        bbox = alpha.getbbox()
        if bbox:
            return bbox
        # Fallback: use the full image as bbox for opaque images
        return (0, 0, img.width, img.height)


def center_image(img: Image.Image) -> Image.Image:
    """
    Centers the visible content of the image on a transparent canvas
    of the same original dimensions.
    """
    original_width, original_height = img.size

    # Ensure we work in RGBA mode
    if img.mode != "RGBA":
        img = img.convert("RGBA")

    bbox = get_content_bbox(img)

    if bbox is None:
        print("  ⚠ Image appears fully transparent — skipping centering.")
        return img

    left, top, right, bottom = bbox
    content_width = right - left
    content_height = bottom - top

    # Crop out just the visible content
    content = img.crop(bbox)

    # Calculate position to paste content centered on the canvas
    paste_x = (original_width - content_width) // 2
    paste_y = (original_height - content_height) // 2

    # Create a blank transparent canvas with the original dimensions
    canvas = Image.new("RGBA", (original_width, original_height), (0, 0, 0, 0))
    canvas.paste(content, (paste_x, paste_y), content)

    return canvas


def process_folder(input_folder: str, output_folder: str) -> None:
    input_path = Path(input_folder)
    output_path = Path(output_folder)

    if not input_path.exists() or not input_path.is_dir():
        print(f"❌ Input folder not found: {input_folder}")
        sys.exit(1)

    # Collect all supported image files
    image_files = [
        f for f in input_path.iterdir()
        if f.is_file() and f.suffix.lower() in SUPPORTED_EXTENSIONS
    ]

    if not image_files:
        print(f"⚠ No supported images found in: {input_folder}")
        print(f"  Supported formats: {', '.join(SUPPORTED_EXTENSIONS)}")
        return

    # Create output folder if it doesn't exist
    output_path.mkdir(parents=True, exist_ok=True)

    print(f"📂 Input:  {input_path.resolve()}")
    print(f"📂 Output: {output_path.resolve()}")
    print(f"🖼  Found {len(image_files)} image(s)\n")

    success = 0
    failed = 0

    for image_file in sorted(image_files):
        print(f"  Processing: {image_file.name}")
        try:
            img = Image.open(image_file)
            original_mode = img.mode
            original_size = img.size

            centered = center_image(img)

            # Determine output format and extension
            out_ext = image_file.suffix.lower()
            out_filename = image_file.name

            # PNG preserves transparency; for other formats convert back
            if out_ext == ".png":
                save_img = centered
            elif out_ext in {".jpg", ".jpeg"}:
                # JPEG doesn't support transparency — flatten onto white
                background = Image.new("RGB", centered.size, (255, 255, 255))
                background.paste(centered, mask=centered.split()[3])
                save_img = background
            else:
                save_img = centered

            out_path = output_path / out_filename
            save_img.save(out_path)

            print(f"  ✅ Saved  → {out_path.name}  "
                  f"({original_size[0]}×{original_size[1]}, {original_mode})")
            success += 1

        except Exception as e:
            print(f"  ❌ Failed: {image_file.name} — {e}")
            failed += 1

    print(f"\n✨ Done! {success} centered, {failed} failed.")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python center_images.py <input_folder> <output_folder>")
        print("Example: python center_images.py ./images ./centered")
        sys.exit(1)

    process_folder(sys.argv[1], sys.argv[2])