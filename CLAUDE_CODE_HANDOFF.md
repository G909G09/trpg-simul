# TRPG 플랫폼 — 클로드 코드 인계용 요약

Cowork(claude.ai)에서 여기까지 진행한 프로젝트를 클로드 코드(CLI)로 옮겨서 계속 작업하기 위한 요약입니다. 아래 내용을 클로드 코드 세션에 붙여넣고 시작하면 됩니다.

## 프로젝트 개요

구글 스프레드시트를 DB로, 구글 Apps Script(HtmlService)를 백엔드+호스팅으로 쓰는 TRPG(테이블탑 롤플레잉 게임) 동반자 웹앱입니다. 원래는 소규모 고정 파티(2~6명)용으로 시작했고, 이후 1인 플레이(솔로 모드)가 추가됐습니다. 별도 서버/DB 없이 개인 구글 계정만으로 배포·운영되는 것이 핵심 제약입니다.

- 스프레드시트: **TRPG 플랫폼 - 캐릭터&세션 DB** — https://docs.google.com/spreadsheets/d/1WJQVL4I38ivCE5zjNCNCpQ2QcROeUuKMkkpFLMoKB_o/edit
- 배포 방식(B안 적용 후, 최신): GitHub 저장소 https://github.com/G909G09/trpg-simul — `backend/Code.gs`를 Apps Script에 붙여넣어 JSON API로 웹앱 배포, `docs/index.html`은 GitHub Pages로 서빙(**플레이어 공유 URL: https://g909g09.github.io/trpg-simul/**).
- 사용자에게 배포 방법을 안내하는 문서가 `설치가이드.md`이며, 코드를 바꿀 때마다 이 문서도 필요시 함께 갱신해야 합니다.

## 절대 지켜야 할 제약

- **이모지 사용 금지** — UI 어디에도 이모지를 쓰지 않는다는 게 프로젝트 초반에 명시된 고정 제약입니다.
- 기본 폰트: **프리텐다드(Pretendard)**, 강조/제목 폰트: **카페24 써라운드(Cafe24 Ssurround)** — 둘 다 jsDelivr CDN으로 로드. ("뒤틀림폰트"는 공개 CDN이 없고 라이선스 문의가 필요해 포기했음.)
- 톤/스타일 목표: 토스(Toss)처럼 귀엽고 친근하면서 세련된 느낌 + 애플 스타일 "리퀴드 글라스"(`backdrop-filter` 블러/반투명 + 움직이는 배경 블롭).
- UI 참고 대상: Roll20 / Foundry VTT / D&D Beyond / Owlbear Rodeo의 UX 패턴(항상 떠 있는 사이드바·채팅, 탭형 시트, 이니셔티브 트래커, 온디맨드 주사위 트레이 등).
- 반응형: 720px 이하에서 하단 탭바 + "목록/상세" 마스터-디테일 토글 패턴.

## 파일 구조 (`/root/trpg-platform/`) — Cowork 세션 당시 기준, 아래는 역사적 기록

> **참고**: 이 섹션은 Cowork 샌드박스에서의 작업 이력을 그대로 남긴 것입니다. 클로드 코드로 인계된 뒤 B안(하이브리드) 아키텍처를 적용하면서 실제 파일 구조는 `backend/Code.gs` + `docs/index.html`로 재편되었습니다 (테스트 파일들은 인계 과정에서 실물로 넘어오지 않았음). 현재 구조는 위 "아키텍처 결정" 섹션 참고.

실제로 사용자에게 전달해야 하는(=배포용) 파일은 3개뿐입니다. 나머지는 개발용 스크래치/테스트 파일입니다.

**배포용 (사용자가 Apps Script 프로젝트에 붙여넣는 것)**
- `Code.gs` (334줄) — 백엔드 전체. 시트 CRUD, 주사위 파서, 게임상태 저장 등.
- `index.html` (2541줄, ~139KB) — 프론트 전체(HTML+CSS+JS 한 파일). 캐릭터 시트/솔로 플레이/활동/GM 도구 4탭 + 플로팅 주사위 버튼.
- `설치가이드.md` — 사용자용 설치·사용 매뉴얼. 최근 "재배포 필요" 변경 이력 섹션 추가됨.

**테스트 (Playwright, `node <파일명>`으로 실행, 브라우저는 `/opt/pw-browsers/chromium` 사용)**
- `test_ui2.js` (282줄, 26개 체크) — 파티 모드 전체 회귀 테스트(탭, 캐릭터 시트, 주사위 드로어, 활동 피드, GM 이니셔티브 트래커, 모바일 반응형 등).
- `test_dice_error.js` (82줄, 4개 체크) — 주사위 무한 회전 버그 재발 방지 테스트.
- `test_solo.js` (368줄, 42개 체크) — 솔로 모드 전체(위저드, 시나리오 분기, 전투, 엔딩 4종, 이어하기, 활동 피드 연동, 이상 데이터 방어 등).
- 세 파일 다 항상 전부 통과해야 정상 상태입니다. `node test_ui2.js`는 이 샌드박스 환경에서 jsDelivr 폰트 CDN 접근이 막혀 있어 콘솔 에러 2건이 항상 뜨는데, 이건 **샌드박스 네트워크 제약일 뿐 실제 버그가 아님**을 이미 확인했습니다(WebFetch로는 같은 CDN URL이 정상 응답하는 것도 확인함). 실제 배포 환경(사용자 브라우저)에서는 문제 없습니다.
- `screenshot_solo.js` — 화면 캡처용 애드혹 스크립트 (headless GPU 옵션 필요: `--enable-gpu --ignore-gpu-blocklist --use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`, 안 그러면 `backdrop-filter` 블러가 캡처에 안 나옴).

**스크래치/구버전 (참고용, index.html이 최신 소스로 우선함)**
- `solo_engine.js`, `solo_data.js` — 솔로 모드 JS를 처음 짤 때 쓴 원본 초안. index.html에 이미 스플라이스되어 들어갔고 index.html이 최신본이므로, 이 두 파일은 더 이상 손대지 않아도 됩니다(참고 자료로만 유지).
- `debug_ui.js`, `debug_dice_error.js`, `final_screens.js`, `glass_check.js`, `test_dice.js`, `test_ui.js` — 과거 디버깅/스크린샷용 일회성 스크립트. 삭제해도 무방.

## 지금까지 만든 기능 (시간순)

1. **기본 뼈대**: 캐릭터 시트 관리, 주사위 굴리기(`NdM`, 수정치, `khN`/`klN` 어드밴티지 등 지원), 세션 로그, GM 도구(이니셔티브 트래커, NPC/몬스터 HP 관리).
2. **UX 인터랙티브화**: 정적이던 UI를 항목 특징이 바로 보이는 인터랙티브 UI로 개편 (이모지 금지 명시).
3. **UI 전면 개편**: Roll20/Foundry/D&D Beyond/Owlbear Rodeo 참고, 반응형+직관성 강화.
4. **폰트/비주얼 리디자인**: 프리텐다드+카페24 써라운드, 토스 스타일 필 형태, 애플 글라스 UI(블러+블롭 배경).
5. **버그 수정**: 주사위 굴리기 시 무한 회전하던 버그 — `withHandlers`가 실패 시 스피닝을 안 멈추는 게 원인이었고, 실패 콜백 지원 + 15초 워치독 타이머로 해결.
6. **솔로 플레이 모드 신규 구축** (완전히 새 탭, 기존 파티 기능은 안 건드림):
   - 발더스 게이트 3 참고 6단계 캐릭터 생성 위저드: 종족(8종) → 클래스(8종) → 배경(8종) → 능력치 포인트 바이(총 27점, 8~15 범위) → 이름/외형 → 요약 확인.
   - "사전 작성 분기형 시나리오" 방식 GM(실시간 AI 호출 없음, 추가 API 비용 없음) — 21노드짜리 원샷 시나리오 "안개 낀 숲", 판정/전투/분기 선택 포함, 엔딩 4종(최고/무사귀환/여운/패배).
   - D&D 5e 단순화 규칙: 능력 수정치 `floor((score-10)/2)`, HP `히트다이스+CON수정치`, AC `10+DEX수정치`(방어구 없음), 전투는 1d20+수정치 대 AC, 피해 1d8+수정치.
   - 시트 자동 생성(`getOrCreateSheet_`) — `솔로_캐릭터` 탭이 없으면 자동 생성, 진행 상황은 기존 `게임상태` 탭에 `솔로진행_<ID>` 키로 재사용 저장.
   - 진행 상황 자동저장/이어하기 지원.
7. **사용자 버그 리포트 2건 + 아키텍처 질문** → 이번 세션에서 실제로 수정 완료 (아래 "최근에 고친 것" 참고).

## 최근에 고친 것 (이번 세션에서 실제 작업 완료, 배포 파일 갱신됨)

1. **주사위 굴림이 활동 피드에 안 뜨던 문제** — 솔로 모드의 `performCheck()`, `combatAttack()`, `enemyTurn()`, `applyAutoDamage()` 네 함수 모두 주사위 굴린 뒤 `loadRollLog()`/`markActivityUnseen()`을 안 부르고 있었음(파티 모드 FAB의 `doRoll()`은 부르고 있었음 — 그래서 파티 모드는 멀쩡하고 솔로 모드만 최대 6초 지연이 있었던 것). 네 곳 모두 서버 응답 성공 콜백에 두 함수 호출을 추가해서 해결. `test_solo.js`에 회귀 테스트 2개 추가.
2. **시트에 있는 캐릭터가 솔로 목록에서 안 보이던 문제** — 근본 원인을 코드 재검토로 특정: `colorForClass()`와 이니셜 계산이 `.trim()`을 문자열이 아닌 값(시트를 수동 편집해서 이름 칸에 숫자만 들어간 경우 등)에 호출하면 `TypeError`가 나서, `renderSoloCharList()`의 `.map()` 전체가 죽어버려 **캐릭터 전원이 한꺼번에 안 보이는** 구조였음. 모든 값을 `String()`으로 안전하게 감싸고, 그래도 특정 행에서 렌더링 실패가 나면 그 행만 콘솔 로그를 남기고 건너뛰도록(`try/catch` per-row) 방어 코드 추가. 파티 캐릭터/NPC 목록에도 동일한 잠재 버그가 있어서 같이 고침. `test_solo.js`에 "이상한 값이 섞인 행" 회귀 테스트 2개 추가.
   - 참고: 이게 사용자가 겪은 문제의 **확실한 원인이라고 100% 확정된 건 아님** — 코드 리뷰로 찾아낸 가장 그럴듯한 원인이라 방어 코드를 넣은 것. 만약 재배포 후에도 재현되면 브라우저 콘솔(F12) 에러와 `솔로_캐릭터` 시트 1행(헤더)이 정확히 `ID, 캐릭터명, 종족, 클래스, 배경, 능력치(JSON), 현재HP, 최대HP, 스킬/특기, 소지품, 외형, 골드, 최종수정` 순서와 일치하는지, 그리고 Apps Script에서 "배포 관리 > 새 버전"으로 실제 재배포했는지를 확인해야 함.
3. **"사이트가 무겁다" 문제의 1차 조치(최적화, 구조 변경 아님)** — `document.visibilitychange`를 활용해 브라우저 탭이 백그라운드일 때 4개의 폴링 `setInterval`(주사위기록 6초/세션로그 8초/캐릭터 12초/NPC+게임상태 12초)을 쉬게 하고, 탭에 돌아오면 즉시 한 번 갱신하도록 함. 화면·기능은 전혀 안 바뀜, 순수 최적화.

이 세 가지 다 `index.html`/`Code.gs`에 반영 완료, 회귀 테스트(42+26+4=72개) 전부 통과 확인함, `설치가이드.md`에 "최근 수정 사항 (재배포 필요)" 섹션 추가함.

## 아키텍처 결정 — B안(하이브리드) 적용 완료

"사이트가 무겁다"는 지적에 대해 A(현 구조+최적화)/B(하이브리드)/C(완전 재작성) 3안을 제시했었고, **클로드 코드 세션에서 사용자가 B안을 선택**해 실제로 적용했습니다.

- 스프레드시트+Apps Script는 이제 **JSON API 서버 전용**(`backend/Code.gs`, `doGet`은 상태 확인용, `doPost`가 `{method, args}`를 받아 화이트리스트 함수를 디스패치).
- 화면(`docs/index.html`)은 **GitHub Pages 정적 호스팅**으로 분리. `google.script.run`을 쓰던 유일한 지점인 `withHandlers()` 함수만 `fetch` 기반으로 교체했고(내부 구현을 Proxy로 감싸 33개 호출부는 시그니처 그대로 유지), 나머지 UI 로직은 전혀 건드리지 않음.
- CORS 프리플라이트 회피를 위해 프론트→백엔드 POST는 `Content-Type: text/plain`으로 보냄(Apps Script가 `doOptions`를 지원하지 않아 preflight가 오면 실패하기 때문).
- 파일 구조가 `기존 파일/` 단일 폴더에서 `backend/Code.gs` + `docs/index.html`로 재편됨. `설치가이드.md`도 1부(백엔드 배포)/2부(GitHub Pages 배포) 2단계 구조로 전면 갱신.
- **아직 남은 것**: 실제 GitHub 저장소 생성/push, GitHub Pages 활성화, 사용자가 Apps Script를 재배포해 받은 URL을 `docs/index.html`의 `API_URL`에 채워넣는 작업, 그리고 CORS 동작 실제 스모크 테스트 — 전부 사용자와 함께 브라우저로 진행 예정(계정에 영향을 주는 외부 작업이라 각 단계 확인 필요).
- A안에서 이미 적용됐던 백그라운드 폴링 중지 최적화는 그대로 유지됨. 솔로 모듈 지연 로딩 등 추가 최적화는 필요시 별도로 진행 가능.

## Apps Script 관련 특이사항 (일반 웹 개발과 다른 점)

- `google.script.run.withSuccessHandler(fn).withFailureHandler(fn).메서드명(인자)` 형태의 비동기 RPC. 로컬에서 테스트하려면 이 객체를 통째로 모킹해야 함 — `index.html` 안의 `withHandlers(successFn, failureFn)`가 프로젝트 전역 래퍼(기본 실패 토스트 + 선택적 커스텀 실패 콜백).
- **Playwright `page.addInitScript()`로 이 모킹을 넣을 때 주의**: 클로저를 바깥 함수로 뺀 뒤 반환값만 넘기면 안 됨 — Playwright가 함수를 `.toString()`으로만 직렬화해서 바깥 스코프 변수 참조를 잃어버림(`window.__mockApi`가 `undefined`가 되는 식으로 실패함). 반드시 `page.addInitScript(() => { ...전부 이 안에서... })`처럼 모든 데이터+프록시 로직을 한 화살표 함수 안에 인라인으로 다 넣어야 함. `test_solo.js`/`test_ui2.js`/`test_dice_error.js`가 이 패턴을 씀.
- 시트가 없으면 자동 생성하는 `getOrCreateSheet_(name, headers)`와, 없으면 에러 던지는 기존 `getSheet_(name)` 두 가지가 공존함 — 새 기능 추가할 때 사용자가 수동으로 시트 탭을 만들 필요 없게 하려면 `getOrCreateSheet_`를 쓸 것.
- `index.html` 안 전역 변수는 `let`/`const`로 선언돼 있어서 `window.변수명`으로 접근 안 됨(클래식 스크립트 최상위 `let`은 `window` 프로퍼티가 안 됨) — 테스트에서 상태를 확인할 땐 DOM(`innerText` 등)이나 `window.__mockApi`처럼 명시적으로 `window`에 붙인 것만 `page.evaluate()`로 읽을 수 있음.

## 다음에 할 만한 일 (사용자가 요청하면)

- 위 아키텍처 이전 여부 재확인.
- 새로운 원샷 시나리오 추가(같은 분기형 JS 오브젝트 패턴 `SOLO_SCENARIO.nodes`로 확장 가능).
- 클로드 코드로 옮긴 뒤에는 git 저장소로 만들어서 버전 관리하는 걸 추천 — 지금은 `/root/trpg-platform/`이 git repo가 아님(`git status`가 "not a git repository"라고 나옴).
