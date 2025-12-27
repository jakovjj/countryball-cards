from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from PIL import Image


@dataclass(frozen=True)
class ImageTarget:
    src: Path
    widths: list[int]


def generate_webp_width_variants(target: ImageTarget, *, quality: int = 82) -> list[Path]:
    if not target.src.exists():
        raise FileNotFoundError(str(target.src))

    image = Image.open(target.src)
    image.load()

    if image.mode not in ("RGB", "RGBA"):
        image = image.convert("RGBA")

    written: list[Path] = []

    for width in target.widths:
        if width >= image.size[0]:
            # Don't upscale.
            continue

        height = round(image.size[1] * (width / image.size[0]))
        out_path = target.src.with_name(f"{target.src.stem}-{width}.webp")

        resized = image.resize((width, height), Image.Resampling.LANCZOS)
        resized.save(out_path, format="WEBP", quality=quality, method=6)
        written.append(out_path)

    return written


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    assets = root / "assets"

    targets = [
        ImageTarget(assets / "contents.webp", [360, 540, 720, 900, 1080, 1440]),
        ImageTarget(assets / "box_art.webp", [320, 480, 640, 720, 960, 1440]),
    ]

    for target in targets:
        image = Image.open(target.src)
        image.load()

        print(
            f"{target.src.relative_to(root).as_posix()} original: {image.size[0]}x{image.size[1]} ({target.src.stat().st_size} bytes)"
        )

        written = generate_webp_width_variants(target)
        for out_path in written:
            width = int(out_path.stem.split("-")[-1])
            print(
                f"  -> {out_path.name}: {width}w ({out_path.stat().st_size} bytes)"
            )

        print("")


if __name__ == "__main__":
    main()
