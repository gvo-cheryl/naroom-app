import SwiftUI
import WidgetKit

@main
struct NaroomWidgetsBundle: WidgetBundle {
	var body: some Widget {
		TodayQuoteWidget()
		QuickRecordWidget()
	}
}
