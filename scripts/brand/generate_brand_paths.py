"""
Generuje ścieżki SVG znaków marki z konturów fontów (Instrument Serif / Instrument Sans, OFL).

    python scripts/brand/generate_brand_paths.py [katalog_z_fontami]

Wymaga: fonttools, uharfbuzz. Domyślny katalog fontów: assets-src/fonts
(InstrumentSerif-Regular.ttf, InstrumentSans-VF.ttf — z github.com/google/fonts, ofl/).
Wynik: components/brand/paths.generated.ts (commitowany; skrypt uruchamia się tylko przy zmianie znaku).

Kształt wordmarku: AD ASTRA wersalikami, rozstrzelenie 0.04em, kerning z fontu (HarfBuzz).
W drugim „A” poprzeczka jest usunięta (wewnętrzne krawędzie nóg przedłużone do szczytu
przeciwkształtu), a w jej miejscu stoi czteroramienna gwiazda.
"""

from __future__ import annotations

import io
import sys
from pathlib import Path

import uharfbuzz as hb
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = Path(__file__).resolve().parents[2]
FONT_DIR = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "assets-src" / "fonts"
OUT = ROOT / "components" / "brand" / "paths.generated.ts"


def load(path: Path, variations: dict[str, float] | None = None) -> tuple[TTFont, bytes]:
    font = TTFont(path)
    if variations:
        font = instancer.instantiateVariableFont(font, variations)
    buf = io.BytesIO()
    font.save(buf)
    data = buf.getvalue()
    return TTFont(io.BytesIO(data)), data


def shape(data: bytes, text: str) -> list[tuple[int, int]]:
    """Zwraca (gid, x_advance) z kerningiem."""
    face = hb.Face(hb.Blob(data))
    font = hb.Font(face)
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(font, buf, {"kern": True, "liga": False})
    return [(i.codepoint, p.x_advance) for i, p in zip(buf.glyph_infos, buf.glyph_positions)]


def remove_crossbar(ops: list) -> list:
    """Usuwa poprzeczkę z „A” Instrument Serif (kształt sprawdzany asercjami)."""
    outer_end = next(i for i, (op, _) in enumerate(ops) if op == "closePath")
    outer, counter = ops[: outer_end + 1], ops[outer_end + 1 :]
    # Dolna krawędź poprzeczki w konturze zewnętrznym:
    start = outer.index(("lineTo", ((294, 222),)))
    end = outer.index(("lineTo", ((89, 88),)))
    assert outer[start + 1 : end] == [
        ("qCurveTo", ((288, 248), (261, 248))),
        ("lineTo", ((156, 248),)),
        ("qCurveTo", ((130, 248), (123, 222))),
    ], "Kontur A różni się od oczekiwanego — sprawdź wersję fontu."
    assert counter[0] == ("moveTo", ((153, 278),)), "Nieoczekiwany przeciwkształt A."
    # Wewnętrzne krawędzie nóg jedną prostą do szczytu przeciwkształtu
    # (nachylenia zgodne z oryginałem, bez załamania w miejscu dawnej poprzeczki):
    bridge = [
        ("lineTo", ((212, 563),)),
        ("lineTo", ((207, 563),)),
    ]
    return outer[: start + 1] + bridge + outer[end:]


class Line:
    """Napis złożony z glifów, w jednostkach fontu, y w dół, wersaliki od y=0."""

    def __init__(
        self,
        font: TTFont,
        data: bytes,
        text: str,
        tracking_em: float,
        cap: int,
        min_gap: float | None = None,
    ):
        self.font, self.cap = font, cap
        upm = font["head"].unitsPerEm
        glyph_set = font.getGlyphSet()
        order = font.getGlyphOrder()
        self.svg = SVGPathPen(glyph_set, ntos=lambda v: f"{round(v, 1):g}")
        self.bounds = BoundsPen(glyph_set)
        self.glyphs: list[tuple[str, float]] = []  # (nazwa glifu, x)
        x = 0.0
        shaped = shape(data, text)
        prev_right: float | None = None
        for index, (gid, advance) in enumerate(shaped):
            name = order[gid]
            box = BoundsPen(glyph_set)
            glyph_set[name].draw(box)
            # Kerning fontu bywa zbyt ciasny przy wersalikach z szeryfami (np. R→A):
            # pilnujemy minimalnego odstępu między obrysami sąsiednich glifów.
            if min_gap is not None and box.bounds and prev_right is not None:
                gap = x + box.bounds[0] - prev_right
                if gap < min_gap:
                    x += min_gap - gap
            self.glyphs.append((name, x))
            if box.bounds:
                prev_right = x + box.bounds[2]
            x += advance + (tracking_em * upm if index < len(shaped) - 1 else 0)
        self.advance = x
        self.glyph_set = glyph_set

    def draw(self, skip: set[int] = frozenset(), override: dict[int, list] | None = None) -> None:
        override = override or {}
        for index, (name, x) in enumerate(self.glyphs):
            if index in skip:
                continue
            transform = (1, 0, 0, -1, x, self.cap)
            for pen in (self.svg, self.bounds):
                target = TransformPen(pen, transform)
                if index in override:
                    rec = RecordingPen()
                    rec.value = override[index]
                    rec.replay(target)
                else:
                    self.glyph_set[name].draw(target)

    def glyph_x(self, index: int) -> float:
        return self.glyphs[index][1]


def fmt_box(bounds) -> str:
    x0, y0, x1, y1 = (round(v, 1) for v in bounds)
    return f"{{ x: {x0:g}, y: {y0:g}, width: {round(x1 - x0, 1):g}, height: {round(y1 - y0, 1):g} }}"


def main() -> None:
    serif, serif_data = load(FONT_DIR / "InstrumentSerif-Regular.ttf")
    sans500, sans500_data = load(FONT_DIR / "InstrumentSans-VF.ttf", {"wght": 500, "wdth": 100})
    sans400, sans400_data = load(FONT_DIR / "InstrumentSans-VF.ttf", {"wght": 400, "wdth": 100})

    serif_cap = serif["OS/2"].sCapHeight
    sans_cap = sans500["OS/2"].sCapHeight
    sans_xheight_cap = sans400["OS/2"].sCapHeight

    # --- AD ASTRA ------------------------------------------------------------
    word = Line(serif, serif_data, "AD ASTRA", 0.04, serif_cap, min_gap=40)
    star_a = 3  # A, D, spacja, [A]STRA
    assert word.glyphs[star_a][0] == "A"
    rec = RecordingPen()
    serif.getGlyphSet()["A"].draw(rec)
    word.draw(override={star_a: remove_crossbar(rec.value)})
    # Gwiazda w miejscu poprzeczki (dawna poprzeczka: y 248–278), środek między nogami.
    star_y = 263
    star_cx = word.glyph_x(star_a) + 208.5
    star_cy = serif_cap - star_y
    wordmark_d, wordmark_bounds = word.svg.getCommands(), word.bounds.bounds

    # --- ALTUM Development -----------------------------------------------------
    altum = Line(sans500, sans500_data, "ALTUM", 0.32, sans_cap)
    altum.draw()
    development = Line(sans400, sans400_data, "Development", 0.04, sans_xheight_cap)
    development.draw()

    # --- Hasło (OG image) -----------------------------------------------------
    taglines = {}
    for key, text in {"pl": "OD FUNDAMENTU DO GWIAZD", "en": "FROM THE FOUNDATION TO THE STARS"}.items():
        line = Line(sans500, sans500_data, text, 0.3, sans_cap)
        line.draw()
        taglines[key] = line

    def entry(name: str, line: Line, extra: str = "") -> str:
        return (
            f"export const {name} = {{\n"
            f'  d: "{line.svg.getCommands()}",\n'
            f"  box: {fmt_box(line.bounds.bounds)},\n"
            f"  capHeight: {line.cap},{extra}\n"
            f"}} as const;\n"
        )

    out = [
        "// Plik generowany: scripts/brand/generate_brand_paths.py — nie edytuj ręcznie.\n",
        "// Ścieżki w jednostkach fontu (1000 = 1 em), oś y w dół, góra wersalików na y = 0.\n\n",
        "export const WORDMARK = {\n",
        f'  d: "{wordmark_d}",\n',
        f"  box: {fmt_box(wordmark_bounds)},\n",
        f"  capHeight: {serif_cap},\n",
        f"  star: {{ cx: {round(star_cx, 1):g}, cy: {round(star_cy, 1):g} }},\n",
        "} as const;\n\n",
        entry("ALTUM", altum),
        "\n",
        entry("DEVELOPMENT", development),
        "\n",
        entry("TAGLINE_PL", taglines["pl"]),
        "\n",
        entry("TAGLINE_EN", taglines["en"]),
    ]
    OUT.write_text("".join(out), encoding="utf-8", newline="\n")
    print(f"zapisano {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
