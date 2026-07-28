# Clicker Kingdom - Codebase Technical Reference & Guide

> **프로젝트 목적**: 사용자가 각 기능이 어떤 파일과 코드에 존재하는지 한눈에 파악하고, 모듈별 변경 사항을 지속적으로 추적하고 업데이트할 수 있도록 안내하는 기술 문서입니다.

---

## 1. 디렉터리 및 모듈 구조 (Directory Structure)

```text
clicker kingdom/
├── README.md             # 프로젝트 소개 및 실행 가이드
├── CODEBASE.md           # 코드베이스 모듈 위치 및 변경 이력 기록 문서
├── index.html            # 메인 HTML 뼈대 (랜딩 페이지, 클릭커, 상점, 대전, 랭킹, 미션, 관리자)
├── css/
│   ├── main.css          # 고유 디자인 시스템, 테마 변수, 버튼제국 스타일, 오라 애니메이션, 히어로 랜딩, 기본 레이아웃, 계정 드롭다운
│   └── components.css    # 상점 카드, 이펙트 카드, 클릭커 밑 빠른 업그레이드 패널, 10초 실시간 전선 게이지, 알약 스타일 모달 탭, 랭킹/칭호 뱃지, 미션, 제보/Admin 모달
└── js/
    ├── app.js            # 전체 통합 스크립트 (모든 브라우저 file:// 및 http:// 호환 실행)
    └── supabase-sync.js  # Supabase 클라우드 동기화 (선택적, 미설정 시 로컬 IndexedDB만 사용)
```


---

## 2. 주요 기능별 코드 위치 안내 (Feature Mapping)

| 기능 분류 | 담당 코드 위치 (js/app.js) | 핵심 함수 / 주요 객체 | 설명 |
| :--- | :--- | :--- | :--- |
| **계정 드롭다운** | `renderTopbarActions()` 내 `userChip` 드롭다운 | 클릭 시 아이디 표시 | 상단바 닉네임 버튼 클릭 시 아이디가 포함된 작은 드롭다운 메뉴 표시, 바깥 클릭 시 자동 닫힘 |
| **랭킹 새로고침 버튼** | `setupEventListeners()` 내 `rankingRefreshBtn` | 클릭 시 `renderRankingView()` 재호출 | 랭킹 화면 제목 옆 `🔄 새로고침` 버튼, 누르면 즉시 최신 데이터 로드 및 토스트 알림 |
| **히어로 랜딩** | Section 12 | `initLanding`, `switchView('landing')` | logis.xyz & buttonempire 스타일 히어로 랜딩 제어 |
| **전역 상태** | Section 3 | `state`, `notifyStateChange()` | 누적 클릭, CPS, 오프라인 CPS, 계정, 이펙트 반응형 상태 저장소 |
| **저장소 API** | Section 2 | `getAccount()`, `setLeaderboard()` | 계정, 랭킹, 미션, 제보 데이터 IndexedDB/LocalStorage 비동기 저장 |
| **클릭커 & 빠른 구매**| Section 11 | `renderClickerView()`, `renderQuickUpgrades()` | 구매 가능한 **모든 업그레이드(군대/보구/이펙트)**가 클릭커 밑에 즉시 자동 노출 |
| **✨ 제국 이펙트 상점**| Section 4 | `buyEffect()`, `equipEffect()` | **상점 진입 시 기본 선택 탭**, 4종 특수 이펙트(황금 용, 번개 전율, 은하수, 용암 불꽃) 해금 |
| **인증 알약 탭 모달** | Section 11 & HTML | `setModalTab()` | 상단 바 스타일 둥근 알약 탭, **로그인 ("다시 오신 것을 환영합니다. 황제시여")**, **회원가입 ("저희의 황제가 되어 제국을 건설하십시오")** 서브 문구 반영 |
| **군대/상점/백그라운드** | Section 4 | `buyArmy()`, `buyOfflineArmy()`, `buyRelic()` | Spacebar Clicker 9종 군대, 5종 보구, 백그라운드 CPS 상점 구매 |
| **전투력/칭호** | Section 5 | `calcBattlePower()`, `equipTitle()` | 전투력 공식 산출, 로그인 검증, 칭호 해금 및 메인 씰(Seal) Visual 변형 |
| **친구 대전 & 전장** | Section 6 | `generateRoomCode()`, `startBattle()` | 4자리 룸코드 친구 대전, 본인 코드 입력 방지 및 진짜 군대(🏰⚔️🚩) 전장 Visual 연출 |
| **미션 시스템** | Section 7 | `claimMissionReward()` | vibers 스타일 일일 미션 & 업적 클리어 검증 |
| **명예의 전당** | Section 8 | `renderRankingView()` | logis.xyz 스타일 3가지 다각도 리더보드 순위표 (수동 새로고침) |
| **버그/아이디어**| Section 9 | `submitFeedback()` | vibers 참고 버그 제보/아이디어 작성 & 포상금 지급 |
| **관리자 모드** | Section 10 | `handleAdminLogin()`, `handleAdminCustomClickSet()` | 관리자 모드 수동 클릭 수 직접 숫자 입력 설정 및 제보 관리 |

---

## 3. 변경 이력 (Changelog)

### [v2.6.0] - 2026-07-28
- **계정 드롭다운 UI 추가**: 상단바 계정 닉네임을 클릭 가능하게 변경, 클릭 시 작은 드롭다운에서 아이디 표시. 바깥 클릭 시 자동 닫힘.
- **랭킹 수동 새로고침 버튼**: 지난 버전의 "5초마다 자동 새로고침" 로직을 제거하고, 랭킹 화면 제목 옆에 `🔄 새로고침` 버튼 추가. 사용자가 필요할 때만 클릭해서 새로고침 가능 (네트워크 효율성 개선).
- **계정 클릭 수 저장 동작 확인**: 클릭할 때마다 1초 debounce로 IndexedDB 로컬 계정 + 랭킹 + Supabase 클라우드에 자동 저장됨을 확인. 랭킹 새로고침 시 최신 데이터 반영.
- **미사용 모듈 파일 12개 삭제**: `state.js`, `ui.js`, `upgrades.js`, `empire.js`, `battle.js`, `admin.js`, `feedback.js`, `landing.js`, `missions.js`, `ranking.js`, `storage.js`, `config.js` — 이들 파일은 과거 모듈화 시도 스냅샷이었으며, `index.html`에서 로드되지 않아 실행되지 않음. `app.js`가 단일 통합 파일로 모든 기능을 담당.

### [v2.5.0] - 2026-07-28
- **이펙트 상점 전용 전환**: 클릭커 하단 빠른 구매 패널에서 이펙트 항목 제거, **이펙트는 상점에서만 구매 가능**하도록 변경.
- **신규 업그레이드 등장 애니메이션**: 클릭 수 변경 시 newly affordable 업그레이드에 `quick-upgrade-new` 클래스 적용 및 반짝이는 scale/fade-in 키프레임 애니메이션 추가.
- **백그라운드 CPS 로그인 필수화**: `buyOfflineArmy()` 함수에 로그인 검증 추가, 미로그인 시 인증 모달 호출. 상점 내 백그라운드 CPS 탭에서 비로그인 시 로그인 안내 UI 표시.

### [v2.4.0] - 2026-07-27
- **구매 가능한 모든 업그레이드 노출**: 클릭커 하단 자금 모임에 따른 빠른 구매 패널에서 제한 없이 구매 가능한 **모든 군대, 보구, 이펙트**가 노출되도록 개선.
- **상점 탭 기본값 변경**: 상점(`⚔️ 군대 상점`) 클릭 진입 시 **[✨ 제국 이펙트]** 탭이 기본 선택되어 표시되도록 설정.
- **인증 모달 탭 알약(Pill) 스타일 적용**: 로그인/회원가입 전환 버튼을 상단바 및 상점 탭과 동일한 고급스러운 둥근 알약(Pill) 컨테이너 스타일로 수정.
- **인증 탭 맞춤 환영 메시지 도입**:
  - 로그인 탭 선택 시: `"다시 오신 것을 환영합니다. 황제시여"`
  - 회원가입 탭 선택 시: `"저희의 황제가 되어 제국을 건설하십시오"`

### [v2.3.0] - 2026-07-27
- **Button Empire 스타일 고급 UI 애니메이션 적용**.
- **✨ 제국 수호 이펙트 4종 상점 신설**.
