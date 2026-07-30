import type { EntryType, TagCategory } from '@/api/types';

// naroom_beta1_prototype.html RECORD_TYPES/PROMPTS/TAG_KINDS를 그대로 옮긴다(승인된 카피).
// EXPERIMENT_MISSION은 작은 실험 도메인이 아직 없어 제외한다.
export interface RecordTypeOption {
  id: EntryType;
  name: string;
  desc: string;
  placeholder: string;
}

export const RECORD_TYPES: RecordTypeOption[] = [
  { id: 'FREE', name: '자유 기록', desc: '형식 없이 지금 떠오르는 대로', placeholder: '오늘 있었던 일, 지금의 생각을 편하게 적어보세요.' },
  { id: 'EMOTION', name: '감정 기록', desc: '지금의 감정에서 시작하기', placeholder: '어떤 감정이 언제부터 느껴졌나요?' },
  {
    id: 'GRATITUDE',
    name: '감사하거나 다행이었던 일',
    desc: '완벽하지 않아도 괜찮아요',
    placeholder: '오늘 조금이라도 다행이라고 느낀 일이 있었나요?',
  },
  { id: 'PROMPT', name: '질문 하나 받아보기', desc: '질문에서 시작하는 기록', placeholder: '떠오르는 만큼만 적어도 괜찮아요.' },
  {
    id: 'QUOTE_REFLECTION',
    name: '오늘의 문장으로 기록',
    desc: '문장에 머물며 쓰기',
    placeholder: '이 문장을 읽고 떠오른 것을 적어보세요.',
  },
];

export function recordTypeOf(id: string | undefined): RecordTypeOption {
  return RECORD_TYPES.find((t) => t.id === id) ?? RECORD_TYPES[0];
}

export const RECORD_PROMPTS = [
  '오늘 마음이 가장 크게 움직인 순간은 언제였나요?',
  '지금의 나에게 무엇이 필요하다고 느껴지나요?',
  '오늘 나를 조금 편하게 해준 조건이 있었나요?',
  '요즘 반복해서 떠오르는 생각이 있나요?',
];

export const TAG_CATEGORY_LABELS: Record<TagCategory, string> = {
  EMOTION: '감정',
  SITUATION: '상황',
  NEED: '욕구',
  VALUE: '가치',
  ACTION: '행동',
  RECOVERY: '회복 요인',
  CUSTOM: '내 태그',
};
