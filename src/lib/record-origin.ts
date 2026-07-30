// "기록하기"(RecordFab)는 탭 화면 위에 겹쳐 그리는 독립 버튼이라, 어느 탭에서 눌렀는지가
// record 라우트 그룹(중첩 스택) 안에는 전달되지 않는다. 기록 완료 후 그 탭으로 돌아가려면
// 눌렀던 시점의 경로(usePathname() 결과)를 여기에 잠깐 담아뒀다가 완료 화면에서 꺼내 쓴다.
// usePathname()은 typed routes의 Href 리터럴 유니온이 아니라 일반 string을 돌려주므로
// 이 모듈도 string으로만 다루고, 실제 네비게이션 호출부에서 Href로 취급한다.
let originTab = '/(app)/home';

export function setRecordOriginTab(tab: string) {
  originTab = tab;
}

export function getRecordOriginTab(): string {
  return originTab;
}
