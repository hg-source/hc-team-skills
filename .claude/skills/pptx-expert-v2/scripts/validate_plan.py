#!/usr/bin/env python
"""Validate a storyboard before slide generation.

The validator targets structural causes of generic AI decks: topic-only titles,
repeated layouts, and excessive card grids. It intentionally does not score
visual taste; rendered-slide QA handles that later.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

GENERIC_TITLES = {
    "개요", "핵심 요약", "요약", "현황", "매출 현황", "실적 현황", "분석",
    "전략", "실행 계획", "계획", "로드맵", "조직도", "다음 단계", "결론",
    "시장 분석", "경쟁사 분석", "상품 포트폴리오", "리스크",
}
EXEMPT_REPEAT_ROLES = {"cover", "divider", "appendix-divider"}
CLAIM_ENDINGS = (
    "다", "니다", "합니다", "됩니다", "했습니다", "입니다", "있습니다",
    "없습니다", "필요", "확정", "우선", "집중", "전환", "개선", "확대",
    "축소", "상회", "하회", "견인", "달성", "보류",
)


def _is_claim_title(title: str) -> bool:
    normalized = " ".join(title.split()).strip(" .·")
    if normalized in GENERIC_TITLES:
        return False
    if len(normalized) < 12:
        return False
    return normalized.endswith(CLAIM_ENDINGS) or any(
        token in normalized for token in ("해야 ", "필요합니다", "견인", "때문", "으로 ", "보다 ")
    )


def validate_plan(plan: dict[str, Any]) -> dict[str, Any]:
    errors: list[str] = []
    warnings: list[str] = []
    slides = plan.get("slides")
    if not isinstance(slides, list) or not slides:
        return {"ok": False, "errors": ["slides가 비어 있습니다."], "warnings": []}

    deck = plan.get("deck", {})
    if not deck.get("audience"):
        errors.append("deck.audience가 필요합니다.")
    if not deck.get("decision"):
        errors.append("deck.decision이 필요합니다.")

    previous = None
    card_count = 0
    for idx, slide in enumerate(slides, 1):
        title = str(slide.get("title", "")).strip()
        role = str(slide.get("role", "")).strip()
        layout = str(slide.get("layout_family", "")).strip()
        visual = str(slide.get("visual", "")).strip()
        if not title:
            errors.append(f"슬라이드 {idx}: title이 없습니다.")
        elif role not in EXEMPT_REPEAT_ROLES and not _is_claim_title(title):
            errors.append(f"슬라이드 {idx}: 제목을 주제어가 아닌 주장형 문장으로 작성하세요: {title}")
        if not role:
            errors.append(f"슬라이드 {idx}: role이 없습니다.")
        if not layout:
            errors.append(f"슬라이드 {idx}: layout_family가 없습니다.")
        if not visual:
            errors.append(f"슬라이드 {idx}: visual이 없습니다.")
        if layout == "card-grid":
            card_count += 1
        if previous and layout == previous["layout"]:
            if role not in EXEMPT_REPEAT_ROLES and previous["role"] not in EXEMPT_REPEAT_ROLES:
                errors.append(f"슬라이드 {idx-1}~{idx}: 동일 레이아웃 '{layout}'을 연속 사용했습니다.")
        previous = {"layout": layout, "role": role}

    if card_count / len(slides) > 0.30:
        errors.append(f"카드형 레이아웃이 {card_count}/{len(slides)}장으로 30%를 초과했습니다.")
    if len({str(s.get('layout_family', '')) for s in slides}) < min(3, len(slides)):
        warnings.append("레이아웃 종류가 적습니다. 슬라이드 역할별 시각 문법을 더 분리하세요.")

    return {"ok": not errors, "errors": errors, "warnings": warnings}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("plan", type=Path)
    args = parser.parse_args()
    plan = json.loads(args.plan.read_text(encoding="utf-8"))
    result = validate_plan(plan)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
