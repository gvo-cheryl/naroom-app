// 프로토타입 missionTypeName()에 대응한다.
const MISSION_TYPE_LABELS: Record<string, string> = {
  OBSERVATION: '관찰형',
  QUESTION: '질문형',
  ACTION: '행동형',
  RECORD: '기록형',
  REVIEW: '되돌아보기형',
};

export function missionTypeLabel(missionType: string): string {
  return MISSION_TYPE_LABELS[missionType] ?? missionType;
}

// 프로토타입 ATTEMPTS에 대응한다.
const ATTEMPT_STATUS_LABELS: Record<string, string> = {
  DONE: '해봤어요',
  PARTIALLY_DONE: '조금 해봤어요',
  RESTED: '오늘은 쉬었어요',
  TRIED_DIFFERENTLY: '다른 방식으로 해봤어요',
  NOT_A_FIT: '지금은 나와 맞지 않았어요',
  RECORD_ONLY: '기록만 남길래요',
};

export function attemptStatusLabel(attemptStatus: string): string {
  return ATTEMPT_STATUS_LABELS[attemptStatus] ?? attemptStatus;
}
