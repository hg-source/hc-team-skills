import importlib.util
import json
import sys
from pathlib import Path

SCRIPT = Path(__file__).parents[1] / "scripts" / "validate_plan.py"


def load_module():
    spec = importlib.util.spec_from_file_location("validate_plan", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def valid_plan():
    return {
        "deck": {"audience": "경영진", "decision": "투자 우선순위 승인"},
        "slides": [
            {"title": "6월 흑자 전환으로 성장 투자 여력이 생겼습니다", "role": "executive-summary", "layout_family": "editorial-summary", "visual": "metric+decision"},
            {"title": "매출보다 CM2 개선이 손익 전환을 견인했습니다", "role": "performance", "layout_family": "annotated-chart", "visual": "line-chart"},
            {"title": "신제품은 프로틴바를 1순위로 집중해야 합니다", "role": "portfolio", "layout_family": "portfolio-map", "visual": "priority-matrix"},
        ],
    }


def test_valid_plan_passes():
    m = load_module()
    result = m.validate_plan(valid_plan())
    assert result["ok"] is True
    assert result["errors"] == []


def test_repeated_layout_is_rejected():
    m = load_module()
    plan = valid_plan()
    plan["slides"][1]["layout_family"] = "editorial-summary"
    result = m.validate_plan(plan)
    assert result["ok"] is False
    assert any("연속" in e for e in result["errors"])


def test_topic_only_title_is_rejected():
    m = load_module()
    plan = valid_plan()
    plan["slides"][1]["title"] = "매출 현황"
    result = m.validate_plan(plan)
    assert result["ok"] is False
    assert any("주장형" in e for e in result["errors"])


def test_card_grid_ratio_is_limited():
    m = load_module()
    plan = valid_plan()
    plan["slides"].extend([
        {"title": "운영 지표는 주 단위로 관리해야 합니다", "role": "actions", "layout_family": "card-grid", "visual": "cards"},
        {"title": "신규 조직은 P&L 오너십을 중심으로 설계합니다", "role": "org", "layout_family": "org-map", "visual": "org-map"},
        {"title": "실행 리스크는 세 가지 선행조건에 달려 있습니다", "role": "risk", "layout_family": "card-grid", "visual": "cards"},
        {"title": "다음 회의 전 세 가지 결정을 닫아야 합니다", "role": "actions", "layout_family": "card-grid", "visual": "cards"},
    ])
    result = m.validate_plan(plan)
    assert result["ok"] is False
    assert any("카드" in e for e in result["errors"])


def test_cli_returns_nonzero_for_invalid_plan(tmp_path):
    import subprocess
    plan = valid_plan()
    plan["slides"][0]["title"] = "핵심 요약"
    path = tmp_path / "plan.json"
    path.write_text(json.dumps(plan, ensure_ascii=False), encoding="utf-8")
    cp = subprocess.run([sys.executable, str(SCRIPT), str(path)], capture_output=True, text=True)
    assert cp.returncode == 1
    payload = json.loads(cp.stdout)
    assert payload["ok"] is False
