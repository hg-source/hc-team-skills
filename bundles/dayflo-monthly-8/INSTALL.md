# 설치

필수: Git, Node.js 22.20 이상, Claude Code.

새 스킬로 바로 설치할 때:

```powershell
npx -y skills@1.5.23 add hg-source/hc-team-skills --skill agent-reach deep-search deep-validation-flow deepflow night-mode visual-deck ppt-deck pptx-expert-v2 -a claude-code -g --copy
```

설치 후 Claude Code를 완전히 다시 열고 "딥플로우로 조사해줘" 또는 "PPT덱 만들자"처럼 호출합니다.

이미 같은 이름의 스킬이 있거나 Codex·Hermes가 같은 정본을 공유하는 PC에서는 위 명령을 바로 실행하지 말고 [CODEX_PROMPT.md](CODEX_PROMPT.md)의 명령문을 Codex에 전달하세요. 기존 폴더를 날짜 백업하고 정본·연결 경로를 확인한 뒤 통합해야 합니다.

선택 기능: Agent Reach 플랫폼별 백엔드, Google Sheets용 gws 인증, PPTX 생성용 npm 의존성, Windows PowerPoint 렌더링은 각 기능을 실제 사용할 때 별도 설정합니다.
