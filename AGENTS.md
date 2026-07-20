# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Naroom App

## 프로젝트 개요

- 프로젝트명: `naroom-app`
- 역할: Naroom의 iOS 및 Android 모바일 앱
- 라우팅 루트: `src/app`
- 제품 목적과 사용자 맥락은 `docs/PRODUCT_CONTEXT.md`를 먼저 확인한다.
- 현재 작업 범위와 완료 기준은 해당 GitHub Issue 또는 사용자가 제공한 요구사항을 기준으로 한다.

## 기술 스택

- Node.js 24.18.0
- pnpm 11.15.0
- Expo SDK 57
- React Native 0.86
- React 19
- TypeScript
- Expo Router
- React Compiler
- Expo Go 기반 초기 로컬 실행

프로젝트별 런타임 버전은 `mise.toml`을 따른다.

## 주요 경로

- 라우트 및 화면: `src/app`
- 정적 리소스: `assets`
- Expo 설정: `app.json`
- 공통 제품 맥락: `docs/PRODUCT_CONTEXT.md`
- Claude 설정: `.claude/settings.json`
- Claude 작업 규칙: `CLAUDE.md` → `AGENTS.md`

## 로컬 실행

```bash
pnpm start
```

Metro 실행 후 다음 단축키를 사용할 수 있다.

- `i`: iOS Simulator 실행
- `a`: Android Emulator 실행
- `w`: 웹 실행
- `r`: 앱 다시 불러오기
- `j`: 디버거 실행

다음 스크립트도 사용할 수 있다.

```bash
pnpm ios
pnpm android
pnpm web
```

## 검증 명령

```bash
pnpm lint
pnpm dlx expo-doctor
```

코드를 변경한 후에는 다음을 수행한다.

1. 변경한 화면 또는 기능을 실행해 확인한다.
2. `pnpm lint`를 실행한다.
3. 의존성이나 Expo 설정을 변경했다면 `pnpm dlx expo-doctor`를 실행한다.
4. 변경한 파일과 검증 결과를 사용자에게 보고한다.
5. 검증하지 못한 플랫폼이 있다면 이유를 명시한다.

## 패키지 설치 규칙

Expo 및 React Native 관련 패키지는 현재 SDK와의 호환성을 위해 다음 명령을 우선한다.

```bash
pnpm exec expo install <package>
```

다음 작업은 사용자에게 이유와 영향을 먼저 설명한다.

- 새로운 상태 관리 라이브러리 도입
- UI 라이브러리 또는 디자인 시스템 도입
- Expo Router 구조 변경
- 네이티브 모듈 설치
- Expo SDK 또는 React Native 버전 변경
- `app.json`의 권한과 앱 식별자 변경

## 코딩 규칙

- 신규 화면과 라우트는 `src/app`의 Expo Router 구조를 따른다.
- TypeScript 타입을 명확하게 작성한다.
- 불필요한 `any` 사용을 피한다.
- 화면 컴포넌트에 데이터 처리와 복잡한 비즈니스 로직을 과도하게 넣지 않는다.
- 반복되는 UI와 동작은 역할이 분명한 컴포넌트나 훅으로 분리한다.
- 로딩, 오류, 빈 상태, 취소 흐름을 고려한다.
- API 주소를 소스 코드에 직접 하드코딩하지 않는다.
- 접근성과 iOS·Android 차이를 고려한다.
- 기존 코드 스타일과 Expo Router 구조를 따른다.
- 요청 범위와 관계없는 리팩터링이나 파일 정리는 수행하지 않는다.
- 작업 범위를 벗어나는 변경이 필요하면 먼저 이유를 설명한다.

## 제품 표현 규칙

- 사용자를 평가하거나 재촉하는 표현을 사용하지 않는다.
- 기록하지 못한 날을 실패처럼 표현하지 않는다.
- 비교, 경쟁, 완벽주의를 자극하는 문구를 피한다.
- 사용자의 감정이나 정신건강 상태를 단정하거나 진단하지 않는다.
- 제품의 구체적인 UX·카피 원칙은 `docs/PRODUCT_CONTEXT.md`를 따른다.

## 환경변수 규칙

공개 가능한 클라이언트 환경변수만 `EXPO_PUBLIC_` 접두사를 사용한다.

현재 기본 변수는 다음과 같다.

```text
EXPO_PUBLIC_API_BASE_URL
EXPO_PUBLIC_SENTRY_DSN
```

`EXPO_PUBLIC_` 변수는 앱 번들에 포함되어 사용자에게 노출될 수 있다. 따라서 비밀값을 넣지 않는다.

환경변수 이름과 안전한 예시는 `.env.example`에서 관리한다.

## 민감정보 및 접근 금지 대상

Claude Code는 다음 파일과 값을 읽거나 수정하거나 출력해서는 안 된다.

- `.env.local`
- `.env.*.local`
- OpenAI API 키
- JWT 서명 키
- DB 및 Redis 비밀번호
- Firebase 및 Google Cloud 서비스 계정 JSON
- 인증서 및 keystore
- `.p8`, `.p12`, `.jks`, `.key`, `.mobileprovision`
- 실제 사용자 데이터와 인증 토큰

클라이언트 앱에는 서버 전용 비밀값을 저장하지 않는다.

민감정보가 Git 변경사항에 포함된 것을 발견하면 값을 출력하지 말고, 노출 가능성만 사용자에게 알린다.

## 수정 또는 생성 금지 대상

명시적인 요청 없이 다음을 수정하거나 생성하지 않는다.

- `node_modules/`
- `.expo/`
- `.history/`
- `dist/`
- `web-build/`
- `ios/`
- `android/`
- 네이티브 인증서와 서명 파일
- `.gitignore`의 민감정보 제외 규칙

`ios/` 또는 `android/` 생성이 필요한 경우에는 Expo Prebuild 및 관리 워크플로에 미치는 영향을 먼저 설명한다.

다음 파일은 수정할 수 있지만, 변경 이유와 영향을 먼저 확인한다.

- `app.json`
- `package.json`
- `pnpm-lock.yaml`
- `tsconfig.json`
- `.claude/settings.json`
- `.vscode/` 설정

## 작업 절차

1. Expo SDK 57의 정확한 버전 문서를 확인한다.
2. `docs/PRODUCT_CONTEXT.md`를 확인한다.
3. 현재 GitHub Issue 또는 사용자가 제공한 요구사항을 확인한다.
4. 구현 범위와 제외 범위를 구분한다.
5. 수정 예정 화면, 컴포넌트, 설정 파일과 검증 방법을 먼저 설명한다.
6. 승인된 범위 안에서만 작업한다.
7. 실행 확인, lint 및 필요한 진단을 수행한다.
8. 변경사항, 검증 결과, 남은 위험 요소를 요약한다.

제품 문서와 현재 Issue가 충돌하면 임의로 판단하지 말고 사용자에게 확인한다.