// 프로토타입 lastDays(n)에 대응 - 오늘을 포함해 최근 n일의 ISO 날짜 목록을 오래된 순으로 만든다.
export function isoDateDaysAgo(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function buildLastDays(range: number): string[] {
  const out: string[] = [];
  for (let i = range - 1; i >= 0; i -= 1) {
    out.push(isoDateDaysAgo(i));
  }
  return out;
}

// 값이 있는 항목들 중 가장 자주 나타난 5단계 인덱스를 고른다(프로토타입 modeLv 대응).
export function modeLevelIndex(levelIndexes: number[]): number | null {
  if (levelIndexes.length === 0) {
    return null;
  }
  const counts = new Map<number, number>();
  levelIndexes.forEach((index) => counts.set(index, (counts.get(index) ?? 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}
