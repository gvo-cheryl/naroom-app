import SwiftUI
import WidgetKit

// App Group(UserDefaults)으로 메인 앱(iosWidgetSync.ts)이 써둔 오늘의 문장을 읽기만 한다 - 위젯
// 프로세스는 JS를 실행할 수 없어 API를 직접 호출하지 않는다(스파이크 문서 §4).
private let appGroupId = "group.io.naroom.app"

struct TodayQuoteEntry: TimelineEntry {
	let date: Date
	let text: String
	let author: String?
}

struct TodayQuoteProvider: TimelineProvider {
	func placeholder(in context: Context) -> TodayQuoteEntry {
		TodayQuoteEntry(date: Date(), text: "오늘의 문장을 확인해볼 수 있어요.", author: nil)
	}

	func getSnapshot(in context: Context, completion: @escaping (TodayQuoteEntry) -> Void) {
		completion(currentEntry())
	}

	func getTimeline(in context: Context, completion: @escaping (Timeline<TodayQuoteEntry>) -> Void) {
		let nextUpdate = Calendar.current.date(byAdding: .hour, value: 1, to: Date()) ?? Date()
		completion(Timeline(entries: [currentEntry()], policy: .after(nextUpdate)))
	}

	private func currentEntry() -> TodayQuoteEntry {
		let defaults = UserDefaults(suiteName: appGroupId)
		let text = defaults?.string(forKey: "todayQuoteText") ?? "오늘의 문장을 확인해볼 수 있어요."
		let author = defaults?.string(forKey: "todayQuoteAuthor")
		return TodayQuoteEntry(date: Date(), text: text, author: author)
	}
}

struct TodayQuoteWidgetView: View {
	var entry: TodayQuoteEntry

	var body: some View {
		VStack(alignment: .leading, spacing: 6) {
			Text(entry.text)
				.font(.system(size: 14))
				.lineLimit(4)
			if let author = entry.author {
				Text("— \(author)")
					.font(.system(size: 11))
					.foregroundColor(.secondary)
			}
		}
		.padding()
		.frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
		.widgetURL(URL(string: "naroomapp://(app)/home"))
	}
}

struct TodayQuoteWidget: Widget {
	let kind: String = "TodayQuoteWidget"

	var body: some WidgetConfiguration {
		StaticConfiguration(kind: kind, provider: TodayQuoteProvider()) { entry in
			TodayQuoteWidgetView(entry: entry)
				.containerBackground(Color(.sRGB, red: 0.914, green: 0.922, blue: 0.898, opacity: 1), for: .widget)
		}
		.configurationDisplayName("오늘의 문장")
		.description("오늘의 문장을 홈 화면에서 바로 봐요.")
		.supportedFamilies([.systemSmall, .systemMedium])
	}
}
