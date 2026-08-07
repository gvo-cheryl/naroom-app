import SwiftUI
import WidgetKit

// 목록성 데이터가 필요 없는 딥링크 전용 위젯이다(스파이크 문서 §5) - 홈의 "빠른 기록" 버튼과 같은 역할.
struct QuickRecordEntry: TimelineEntry {
	let date: Date
}

struct QuickRecordProvider: TimelineProvider {
	func placeholder(in context: Context) -> QuickRecordEntry {
		QuickRecordEntry(date: Date())
	}

	func getSnapshot(in context: Context, completion: @escaping (QuickRecordEntry) -> Void) {
		completion(QuickRecordEntry(date: Date()))
	}

	func getTimeline(in context: Context, completion: @escaping (Timeline<QuickRecordEntry>) -> Void) {
		completion(Timeline(entries: [QuickRecordEntry(date: Date())], policy: .never))
	}
}

struct QuickRecordWidgetView: View {
	var body: some View {
		VStack(spacing: 4) {
			Text("＋")
				.font(.system(size: 28))
			Text("빠른 기록")
				.font(.system(size: 13))
		}
		.foregroundColor(.white)
		.frame(maxWidth: .infinity, maxHeight: .infinity)
		.widgetURL(URL(string: "naroomapp://record/type"))
	}
}

struct QuickRecordWidget: Widget {
	let kind: String = "QuickRecordWidget"

	var body: some WidgetConfiguration {
		StaticConfiguration(kind: kind, provider: QuickRecordProvider()) { _ in
			QuickRecordWidgetView()
				.containerBackground(Color(.sRGB, red: 0.165, green: 0.165, blue: 0.157, opacity: 1), for: .widget)
		}
		.configurationDisplayName("빠른 기록")
		.description("바로 기록을 시작해요.")
		.supportedFamilies([.systemSmall])
	}
}
