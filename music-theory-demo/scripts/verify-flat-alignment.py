from pathlib import Path

from PIL import Image


image = Image.open(Path("public/assets/interval-minor-third.png")).convert("RGB")
staff_rows = {row for line in (65, 85, 105, 125, 145) for row in range(line - 2, line + 3)}
ink_pixels = 0

for x in range(642, 671):
    for y in range(128, 162):
        if y in staff_rows:
            continue
        red, green, blue = image.getpixel((x, y))
        if red < 50 and green < 50 and blue < 75:
            ink_pixels += 1

if ink_pixels < 80:
    raise SystemExit(
        f"Flat accidental is not large enough beside E4: found only {ink_pixels} glyph pixels near E4."
    )

print(f"Flat accidental alignment verified with {ink_pixels} glyph pixels beside E4.")

# A flat has a vertical stem and a rounded lower bowl.  For E-flat4, the
# bottom staff line must pass through that bowl (not merely touch the stem).
# This band immediately above the E4 line excludes the notehead and proves
# that the bowl reaches the line from above.
bowl_pixels_above_e_line = 0
for x in range(650, 663):
    for y in range(137, 143):
        red, green, blue = image.getpixel((x, y))
        if red < 50 and green < 50 and blue < 75:
            bowl_pixels_above_e_line += 1

if bowl_pixels_above_e_line < 15:
    raise SystemExit(
        "Flat accidental bowl does not reach the E4 staff line: "
        f"found only {bowl_pixels_above_e_line} pixels above it."
    )

print(
    "Flat accidental bowl alignment verified with "
    f"{bowl_pixels_above_e_line} pixels above the E4 line."
)
