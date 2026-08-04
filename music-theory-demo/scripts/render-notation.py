from pathlib import Path
import json

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "assets"
MUSIC_FONT = "/Applications/MuseScore 4.app/Contents/Resources/fonts/Leland.otf"
TEXT_FONT = "/System/Library/Fonts/Supplemental/Arial.ttf"

WIDTH, HEIGHT = 1400, 260
STAFF_LEFT, STAFF_RIGHT = 76, 1324
LAYOUT = json.loads((ROOT / "assets-source" / "notation-layout.json").read_text())
STAFF_LINES = LAYOUT["staffLines"]
PITCH_Y = {int(midi): y for midi, y in LAYOUT["pitchY"].items()}
LEDGER_LINES = LAYOUT["ledgerLines"]
KEY_SIGNATURES = {
    # Treble-clef order and vertical positions: sharps F–C–G; flats B–E.
    "G": [(77, "\ue262")],
    "D": [(77, "\ue262"), (72, "\ue262")],
    "A": [(77, "\ue262"), (72, "\ue262"), (79, "\ue262")],
    "F": [(71, "\ue260")],
    "Bb": [(71, "\ue260"), (64, "\ue260")],
}


def draw_ledger_lines(draw, x, midi):
    if midi <= 60:
        y = LEDGER_LINES["middleC"]
        draw.line((x - 24, y, x + 24, y), fill="#17203c", width=2)
    if midi <= 57:
        y = LEDGER_LINES["lowA"]
        draw.line((x - 24, y, x + 24, y), fill="#17203c", width=2)


def draw_chord(draw, x, midis, roman, chord_name, accidentals=None):
    text_font = ImageFont.truetype(TEXT_FONT, 21)
    for midi in midis:
        y = PITCH_Y[midi]
        draw_ledger_lines(draw, x, midi)
        draw.ellipse((x - 12, y - 8, x + 12, y + 8), fill="#11182f")
    stem_top = min(PITCH_Y[midi] for midi in midis) - 45
    stem_bottom = max(PITCH_Y[midi] for midi in midis)
    draw.line((x + 15, stem_top, x + 15, stem_bottom), fill="#11182f", width=3)
    for midi, accidental in accidentals or []:
        accidental_font = ImageFont.truetype(MUSIC_FONT, 58)
        accidental_box = draw.textbbox((0, 0), accidental, font=accidental_font)
        glyph_center_y = (accidental_box[1] + accidental_box[3]) / 2
        draw.text(
            (x - 43, PITCH_Y[midi] - glyph_center_y - 8),
            accidental,
            font=accidental_font,
            fill="#11182f",
        )
    draw.text((x, 244), roman, font=text_font, fill="#2456d8", anchor="mm")


def draw_key_signature(draw, key):
    """Engrave a key signature after the clef, before the first chord."""
    if not key:
        return
    accidental_font = ImageFont.truetype(MUSIC_FONT, 62)
    for index, (midi, accidental) in enumerate(KEY_SIGNATURES[key]):
        accidental_box = draw.textbbox((0, 0), accidental, font=accidental_font)
        glyph_center_y = (accidental_box[1] + accidental_box[3]) / 2
        # Flats need a slightly higher optical placement than sharps in this
        # music font; a shared correction would place the flat too low.
        optical_offset = -8 if accidental == "\ue260" else 0
        draw.text(
            (205 + index * 29, PITCH_Y[midi] - glyph_center_y + optical_offset),
            accidental,
            font=accidental_font,
            fill="#11182f",
        )


def render(
    filename,
    first,
    second,
    first_roman,
    second_roman,
    first_name,
    second_name,
    key_signature=None,
    first_accidentals=None,
    second_accidentals=None,
):
    image = Image.new("RGB", (WIDTH, HEIGHT), "#ffffff")
    draw = ImageDraw.Draw(image)
    for y in STAFF_LINES:
        draw.line((STAFF_LEFT, y, STAFF_RIGHT, y), fill="#1f2433", width=2)
    draw.line((STAFF_RIGHT, STAFF_LINES[0], STAFF_RIGHT, STAFF_LINES[-1]), fill="#1f2433", width=4)
    clef_font = ImageFont.truetype(MUSIC_FONT, 118)
    clef = "\ue050"
    clef_box = draw.textbbox((0, 0), clef, font=clef_font)
    draw.text((92 - clef_box[0], 28 - clef_box[1]), clef, font=clef_font, fill="#11182f")
    draw_key_signature(draw, key_signature)
    draw_chord(draw, 520, first, first_roman, first_name, first_accidentals)
    draw_chord(draw, 860, second, second_roman, second_name, second_accidentals)
    image.save(OUT / filename, optimize=True)


def render_interval(filename, lower_midi, upper_midi, accidental):
    image = Image.new("RGB", (WIDTH, HEIGHT), "#ffffff")
    draw = ImageDraw.Draw(image)
    for y in STAFF_LINES:
        draw.line((STAFF_LEFT, y, STAFF_RIGHT, y), fill="#1f2433", width=2)
    draw.line((STAFF_RIGHT, STAFF_LINES[0], STAFF_RIGHT, STAFF_LINES[-1]), fill="#1f2433", width=4)
    clef_font = ImageFont.truetype(MUSIC_FONT, 118)
    clef = "\ue050"
    clef_box = draw.textbbox((0, 0), clef, font=clef_font)
    draw.text((92 - clef_box[0], 28 - clef_box[1]), clef, font=clef_font, fill="#11182f")
    x = 690
    for midi in [lower_midi, upper_midi]:
        y = PITCH_Y[midi]
        draw_ledger_lines(draw, x, midi)
        draw.ellipse((x - 12, y - 8, x + 12, y + 8), fill="#11182f")
    draw.line((x + 13, PITCH_Y[upper_midi] - 45, x + 13, PITCH_Y[lower_midi]), fill="#11182f", width=3)
    if accidental:
        accidental_font = ImageFont.truetype(MUSIC_FONT, 68)
        accidental_box = draw.textbbox((0, 0), accidental, font=accidental_font)
        glyph_center_y = (accidental_box[1] + accidental_box[3]) / 2
        draw.text(
            # The flat glyph's rounded lower bowl—not its thin stem—must
            # intersect the E4 line, as in conventional staff engraving.
            (x - 42, PITCH_Y[upper_midi] - glyph_center_y - 10),
            accidental,
            font=accidental_font,
            fill="#11182f",
        )
        # Reapply a real staff line only when the altered note sits on one.
        if PITCH_Y[upper_midi] in STAFF_LINES:
            draw.line((STAFF_LEFT, PITCH_Y[upper_midi], STAFF_RIGHT, PITCH_Y[upper_midi]), fill="#1f2433", width=2)
    image.save(OUT / filename, optimize=True)


OUT.mkdir(parents=True, exist_ok=True)
render(
    "cadence-perfect.png",
    # Use close voice leading: B→C, D→E, G stays common.
    [59, 62, 67],
    [60, 64, 67],
    "V",
    "I",
    "G major",
    "C major",
)
render(
    "cadence-imperfect.png",
    [60, 64, 67],
    # Keep the reverse cadence equally close voiced: C→B, E→D, G stays common.
    [59, 62, 67],
    "I",
    "V",
    "C major",
    "G major",
)
render_interval("interval-major-third.png", 60, 64, None)
render_interval("interval-minor-third.png", 60, 64, "\ue260")
render_interval("practice-g-b-major.png", 55, 59, None)
# Display pitches are diatonic staff positions; accidentals alter sound, not height.
render_interval("practice-g-b-flat-minor.png", 55, 59, "\ue260")
render_interval("practice-d-f-sharp-major.png", 62, 65, "\ue262")
render_interval("practice-a-c-minor.png", 57, 60, None)
# The rendered pitch values stay diatonic; audio MIDI is declared separately
# in practice.html so an accidental never moves a note to a different space.
render_interval("practice-e-g-sharp-major.png", 64, 67, "\ue262")
render_interval("practice-e-g-minor.png", 64, 67, None)
render_interval("practice-f-a-major.png", 65, 69, None)
render_interval("practice-f-a-flat-minor.png", 65, 69, "\ue260")
# Cadence practice bank: every example has close voice leading and a distinct
# written progression. Display pitches are diatonic; the matching audio MIDI
# is declared independently in practice.html.
render("practice-cadence-f-perfect.png", [64, 67, 72], [65, 69, 72], "V", "I", "C major", "F major", key_signature="F")
render("practice-cadence-f-imperfect.png", [65, 69, 72], [64, 67, 72], "I", "V", "F major", "C major", key_signature="F")
render(
    "practice-cadence-g-perfect.png", [65, 69, 74], [67, 71, 74], "V", "I", "D major", "G major",
    key_signature="G",
)
render(
    "practice-cadence-g-imperfect.png", [67, 71, 74], [65, 69, 74], "I", "V", "G major", "D major",
    key_signature="G",
)
render(
    "practice-cadence-d-perfect.png", [60, 64, 69], [62, 65, 69], "V", "I", "A major", "D major",
    key_signature="D",
)
render(
    "practice-cadence-d-imperfect.png", [62, 65, 69], [60, 64, 69], "I", "V", "D major", "A major",
    key_signature="D",
)
render(
    "practice-cadence-a-perfect.png", [67, 71, 76], [69, 72, 76], "V", "I", "E major", "A major",
    key_signature="A",
)
render(
    "practice-cadence-a-imperfect.png", [69, 72, 76], [67, 71, 76], "I", "V", "A major", "E major",
    key_signature="A",
)
render(
    "practice-cadence-b-flat-perfect.png", [69, 72, 77], [71, 74, 77], "V", "I", "F major", "B-flat major",
    key_signature="Bb",
)
render(
    "practice-cadence-b-flat-imperfect.png", [71, 74, 77], [69, 72, 77], "I", "V", "B-flat major", "F major",
    key_signature="Bb",
)
