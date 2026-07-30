// naroom_beta1_prototype.html INT_LV/ENG_LV/NEEDS를 그대로 옮긴다(승인된 카피).
// 저장값은 프로토타입처럼 0~100(API도 이 범위)이고, 화면에는 5단계 라벨로만 보여준다.
export const INTENSITY_LABELS = ['거의 없음', '조금', '보통', '크게', '아주 크게'];
export const ENERGY_LABELS = ['거의 없음', '낮음', '보통', '있음', '충분함'];
export const CHECKIN_NEEDS = ['휴식', '이해', '거리', '대화', '안정', '정리', '용기', '도움'];

// 0~100 값을 라벨 개수만큼 균등한 구간(5개 라벨이면 20%씩)으로 나눠 인덱스를 고른다.
export function levelLabelIndex(value: number, labelCount: number): number {
  const binWidth = 100 / labelCount;
  return Math.min(labelCount - 1, Math.max(0, Math.floor(value / binWidth)));
}
