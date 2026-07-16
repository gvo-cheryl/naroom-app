# NAROOM Frontend

나로움의 사용자용 모바일 애플리케이션입니다.

사용자가 하루의 감정과 생각을 부담 없이 기록하고, AI와 함께 내용을 정리할 수 있는 화면을 제공합니다. 기록이 쌓이면 LifeTime에서 주간·월간 흐름과 반복되는 패턴, 이전에는 알아차리지 못했던 작은 변화를 확인할 수 있습니다.

매일 기록하거나 목표를 완벽하게 달성하는 것을 요구하지 않습니다. 쉬었다가 다시 돌아오는 과정과 작은 시도도 자연스럽게 이어질 수 있도록 설계합니다.

## 주요 기능

- 회원가입 및 로그인
- 온보딩
- 오늘의 감정·에너지 체크인
- 감사·감정·일상 기록
- AI 반영과 후속 질문
- 기록 캘린더 및 검색
- 주간·월간 LifeTime 회고
- 사용자 주도 자기정리
- 작은 챌린지
- 비경쟁적 뱃지와 성취
- 알림 및 개인정보 설정

## Tech Stack

- TypeScript
- React Native
- React Navigation
- TanStack Query
- 상태 관리 라이브러리
- Firebase
- NAROOM API

정확한 라이브러리와 버전은 `package.json`을 기준으로 합니다.

## Project Structure

```text
src/
├── app/
├── components/
├── features/
│   ├── auth/
│   ├── check-in/
│   ├── records/
│   ├── reflection/
│   ├── lifetime/
│   └── challenge/
├── navigation/
├── services/
├── hooks/
├── stores/
├── styles/
└── types/
