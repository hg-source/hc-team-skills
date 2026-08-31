import importlib.util
import sys
import zipfile
from pathlib import Path

SCRIPT = Path(__file__).parents[1] / "scripts" / "analyze_pptx.py"


def load_module():
    spec = importlib.util.spec_from_file_location("analyze_pptx", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def make_fixture(path: Path):
    presentation = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldSz cx="12192000" cy="6858000"/>
</p:presentation>'''
    slide = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree>
<p:sp><p:nvSpPr><p:cNvPr id="2" name="Title"/></p:nvSpPr><p:spPr><a:xfrm><a:off x="914400" y="457200"/><a:ext cx="9144000" cy="914400"/></a:xfrm></p:spPr><p:txBody><a:bodyPr/><a:p><a:r><a:rPr lang="ko-KR" sz="3200"><a:latin typeface="Pretendard"/></a:rPr><a:t>성과가 목표를 상회했습니다</a:t></a:r></a:p></p:txBody></p:sp>
<p:sp><p:nvSpPr><p:cNvPr id="3" name="Body"/></p:nvSpPr><p:spPr><a:xfrm><a:off x="914400" y="1828800"/><a:ext cx="4572000" cy="2743200"/></a:xfrm><a:solidFill><a:srgbClr val="F5F5F3"/></a:solidFill></p:spPr><p:txBody><a:bodyPr/><a:p><a:r><a:rPr sz="1400"><a:latin typeface="Pretendard"/></a:rPr><a:t>본문</a:t></a:r></a:p></p:txBody></p:sp>
</p:spTree></p:cSld></p:sld>'''
    with zipfile.ZipFile(path, "w") as z:
        z.writestr("ppt/presentation.xml", presentation)
        z.writestr("ppt/slides/slide1.xml", slide)


def test_analyze_extracts_native_structure(tmp_path):
    m = load_module()
    pptx = tmp_path / "fixture.pptx"
    make_fixture(pptx)
    result = m.analyze_pptx(pptx)
    assert result["slide_count"] == 1
    assert result["slide_size_inches"] == {"width": 13.333, "height": 7.5}
    assert result["fonts"]["Pretendard"] == 2
    assert result["colors"]["F5F5F3"] == 1
    assert result["slides"][0]["text_count"] == 2
    assert result["slides"][0]["shape_count"] == 2
    assert result["slides"][0]["layout_signature"]


def test_missing_presentation_xml_is_error(tmp_path):
    m = load_module()
    pptx = tmp_path / "bad.pptx"
    with zipfile.ZipFile(pptx, "w") as z:
        z.writestr("ppt/slides/slide1.xml", "<x/>")
    try:
        m.analyze_pptx(pptx)
    except ValueError as exc:
        assert "presentation.xml" in str(exc)
    else:
        raise AssertionError("ValueError expected")
