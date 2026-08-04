from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
STAFF_ROWS = {row for line in (65, 85, 105, 125, 145) for row in range(line - 2, line + 3)}


def glyph_pixels(filename):
    image = Image.open(ROOT / "public" / "assets" / filename).convert("RGB")
    pixels = 0
    # Key signatures are engraved after the clef (x 185–320), well before
    # either chord (x 520 and 860). Staff lines are excluded from the count.
    for x in range(185, 320):
        for y in range(38, 160):
            if y in STAFF_ROWS:
                continue
            red, green, blue = image.getpixel((x, y))
            if red < 50 and green < 50 and blue < 75:
                pixels += 1
    return pixels


checks = {
    # Leland's sharp and flat glyphs have different optical centres. These
    # expected values prevent a global offset from fixing one while breaking
    # the other.
    "practice-cadence-f-perfect.png": ([99], "F major requires one flat"),
    "practice-cadence-g-perfect.png": ([64], "G major requires one sharp"),
    "practice-cadence-d-perfect.png": ([64, 95], "D major requires two sharps"),
    "practice-cadence-a-perfect.png": ([64, 95, 54], "A major requires three sharps"),
    "practice-cadence-b-flat-perfect.png": ([99, 139], "B-flat major requires two flats"),
}

def glyph_centre_y(image, x_start, x_end):
    ys = []
    for x in range(x_start, x_end):
        for y in range(20, 160):
            if y in STAFF_ROWS:
                continue
            red, green, blue = image.getpixel((x, y))
            if red < 50 and green < 50 and blue < 75:
                ys.append(y)
    return sum(ys) / len(ys) if ys else None


for filename, (expected_positions, message) in checks.items():
    count = glyph_pixels(filename)
    if count < 60:
        raise SystemExit(f"{filename}: {message}; no key signature found after the clef.")
    image = Image.open(ROOT / "public" / "assets" / filename).convert("RGB")
    for index, expected_y in enumerate(expected_positions):
        centre_y = glyph_centre_y(image, 200 + index * 29, 222 + index * 29)
        if centre_y is None or abs(centre_y - expected_y) > 4:
            raise SystemExit(
                f"{filename}: key-signature symbol {index + 1} is not aligned with "
                f"its staff position {expected_y}; found {centre_y}."
            )

print("Cadence key signatures verified after the treble clef and on their correct staff positions.")
