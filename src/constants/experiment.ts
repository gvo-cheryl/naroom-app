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
