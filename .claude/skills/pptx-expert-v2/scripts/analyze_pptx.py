#!/usr/bin/env python
"""Extract reusable structural signals from an editable PPTX template."""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import zipfile
from collections import Counter
from pathlib import Path
from xml.etree import ElementTree as ET

EMU_PER_INCH = 914400
NS = {
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "p": "http://schemas.openxmlformats.org/presentationml/2006/main",
}


def _slide_number(name: str) -> int:
    match = re.search(r"slide(\d+)\.xml$", name)
    return int(match.group(1)) if match else 10**9


def _layout_signature(root: ET.Element) -> str:
    boxes = []
    for shape in root.findall(".//p:sp", NS):
        xfrm = shape.find("./p:spPr/a:xfrm", NS)
        if xfrm is None:
            continue
        off = xfrm.find("a:off", NS)
        ext = xfrm.find("a:ext", NS)
        if off is None or ext is None:
            continue
        values = [int(off.get("x", 0)), int(off.get("y", 0)), int(ext.get("cx", 0)), int(ext.get("cy", 0))]
        boxes.append(tuple(round(v / 91440) for v in values))  # 0.1-inch buckets
    digest = hashlib.sha1(repr(sorted(boxes)).encode()).hexdigest()[:12]
    return f"shapes:{len(boxes)}:{digest}"


def analyze_pptx(path: str | Path) -> dict:
    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(path)
    fonts: Counter[str] = Counter()
    colors: Counter[str] = Counter()
    slides = []
    with zipfile.ZipFile(path) as z:
        names = set(z.namelist())
        if "ppt/presentation.xml" not in names:
            raise ValueError("ppt/presentation.xml이 없는 유효하지 않은 PPTX입니다.")
        presentation = ET.fromstring(z.read("ppt/presentation.xml"))
        size = presentation.find("p:sldSz", NS)
        if size is None:
            raise ValueError("presentation.xml에 p:sldSz가 없습니다.")
        width = round(int(size.get("cx")) / EMU_PER_INCH, 3)
        height = round(int(size.get("cy")) / EMU_PER_INCH, 3)
        slide_names = sorted(
            [n for n in names if re.fullmatch(r"ppt/slides/slide\d+\.xml", n)],
            key=_slide_number,
        )
        for index, name in enumerate(slide_names, 1):
            root = ET.fromstring(z.read(name))
            shapes = root.findall(".//p:sp", NS)
            texts = [t.text or "" for t in root.findall(".//a:t", NS) if (t.text or "").strip()]
            for latin in root.findall(".//a:latin", NS):
                face = (latin.get("typeface") or "").strip()
                if face:
                    fonts[face] += 1
            for clr in root.findall(".//a:srgbClr", NS):
                val = (clr.get("val") or "").upper()
                if val:
                    colors[val] += 1
            slides.append({
                "index": index,
                "shape_count": len(shapes),
                "text_count": len(texts),
                "texts": texts,
                "layout_signature": _layout_signature(root),
            })
    return {
        "file": str(path.resolve()),
        "slide_count": len(slides),
        "slide_size_inches": {"width": width, "height": height},
        "fonts": dict(fonts.most_common()),
        "colors": dict(colors.most_common()),
        "slides": slides,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("pptx", type=Path)
    parser.add_argument("--out", type=Path)
    args = parser.parse_args()
    result = analyze_pptx(args.pptx)
    text = json.dumps(result, ensure_ascii=False, indent=2)
    if args.out:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(text + "\n", encoding="utf-8")
    else:
        print(text)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
