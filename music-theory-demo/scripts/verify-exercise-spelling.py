from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]


def has_notehead(image, y):
    ink = 0
    for x in range(680, 703):
        red, green, blue = image.getpixel((x, y))
        if red < 40 and green < 45 and blue < 70:
            ink += 1
    return ink >= 8


checks = [
    ("practice-g-b-flat-minor.png", 175, "B-flat must occupy B's staff space"),
    ("practice-d-f-sharp-major.png", 135, "F-sharp must occupy F's staff line"),
    ("practice-e-g-sharp-major.png", 125, "G-sharp must occupy G's staff line"),
    ("practice-f-a-flat-minor.png", 115, "A-flat must occupy A's staff space"),
]

for filename, written_y, message in checks:
    image = Image.open(ROOT / "public" / "assets" / filename).convert("RGB")
    if not has_notehead(image, written_y):
        raise SystemExit(f"{filename}: {message}")

print("Exercise notation spelling verified for B-flat, F-sharp, G-sharp, and A-flat.")
