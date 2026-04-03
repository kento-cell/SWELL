import WidgetKit
import SwiftUI

// MARK: - Data Models

struct NewsItem: Codable, Identifiable {
    let id: String
    let title: String
    let source: String
    let waveLevel: String
    let waveSentiment: String
    let timestamp: Int
    let description: String?
}

struct CategoryData: Codable {
    let category: String
    let items: [NewsItem]
    let lastUpdated: Int
    let source: String
}

// MARK: - Timeline Provider

struct SWELLProvider: TimelineProvider {
    // データ取得先URL（Cloudflare Pages移行後はCDN URLに変更）
    static let dataURL = "https://your-domain.com/data/news.json"

    func placeholder(in context: Context) -> SWELLEntry {
        SWELLEntry(
            date: Date(),
            items: [
                WidgetNewsItem(title: "ニュースを読み込み中...", source: "SWELL", waveLevel: .medium, sentiment: .blue),
            ]
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (SWELLEntry) -> Void) {
        completion(placeholder(in: context))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<SWELLEntry>) -> Void) {
        Task {
            let items = await fetchNews()
            let entry = SWELLEntry(date: Date(), items: items)
            // 2分後に次回更新
            let nextUpdate = Calendar.current.date(byAdding: .minute, value: 2, to: Date())!
            let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
            completion(timeline)
        }
    }

    private func fetchNews() async -> [WidgetNewsItem] {
        guard let url = URL(string: SWELLProvider.dataURL) else {
            return sampleItems
        }
        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            let categoryData = try JSONDecoder().decode(CategoryData.self, from: data)
            return categoryData.items.prefix(5).map { item in
                WidgetNewsItem(
                    title: item.title,
                    source: item.source,
                    waveLevel: WaveLevel(rawValue: item.waveLevel) ?? .medium,
                    sentiment: WaveSentiment(rawValue: item.waveSentiment) ?? .blue
                )
            }
        } catch {
            return sampleItems
        }
    }

    private var sampleItems: [WidgetNewsItem] {
        [
            WidgetNewsItem(title: "最新ニュースを取得中...", source: "SWELL", waveLevel: .medium, sentiment: .blue),
        ]
    }
}

// MARK: - Widget Data

enum WaveLevel: String {
    case low, medium, high

    var label: String {
        switch self {
        case .low: return "小波"
        case .medium: return "通常波"
        case .high: return "高波"
        }
    }

    var icon: String {
        switch self {
        case .low: return "〜"
        case .medium: return "≋"
        case .high: return "🌊"
        }
    }
}

enum WaveSentiment: String {
    case blue, green, yellow, red

    var color: Color {
        switch self {
        case .blue: return Color(hex: "6366F1")
        case .green: return Color(hex: "10B981")
        case .yellow: return Color(hex: "F59E0B")
        case .red: return Color(hex: "EF4444")
        }
    }
}

struct WidgetNewsItem: Identifiable {
    let id = UUID()
    let title: String
    let source: String
    let waveLevel: WaveLevel
    let sentiment: WaveSentiment
}

struct SWELLEntry: TimelineEntry {
    let date: Date
    let items: [WidgetNewsItem]
    var trialWarning: String? = nil  // nil=Premium, 文字列=警告メッセージ
}

// MARK: - Widget Views

struct SWELLWidgetSmallView: View {
    let entry: SWELLEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text("SWELL")
                    .font(.system(size: 12, weight: .bold, design: .monospaced))
                    .foregroundColor(Color(hex: "E11D48"))
                Spacer()
            }

            Divider().background(Color.white.opacity(0.2))

            if let warning = entry.trialWarning {
                // Trial warning mode
                Spacer()
                VStack(spacing: 6) {
                    Text("⚠").font(.system(size: 20))
                    Text(warning)
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(Color(hex: "F59E0B"))
                        .multilineTextAlignment(.center)
                    Text("Premium →")
                        .font(.system(size: 11, weight: .bold, design: .monospaced))
                        .foregroundColor(Color(hex: "6366F1"))
                }
                .frame(maxWidth: .infinity)
                Spacer()
            } else if let item = entry.items.first {
                VStack(alignment: .leading, spacing: 4) {
                    Text(item.title)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(.white)
                        .lineLimit(3)
                    HStack(spacing: 4) {
                        Circle().fill(item.sentiment.color).frame(width: 6, height: 6)
                        Text(item.source)
                            .font(.system(size: 9, design: .monospaced))
                            .foregroundColor(.white.opacity(0.6))
                        Spacer()
                        Text(item.waveLevel.label)
                            .font(.system(size: 9, design: .monospaced))
                            .foregroundColor(item.sentiment.color)
                    }
                }
            }
            Spacer()
        }
        .padding(12)
        .background(Color(hex: "1A1A2E"))
    }
}

struct SWELLWidgetMediumView: View {
    let entry: SWELLEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            // Header
            HStack {
                Text("SWELL")
                    .font(.system(size: 12, weight: .bold, design: .monospaced))
                    .foregroundColor(Color(hex: "E11D48"))
                Text("NEWS")
                    .font(.system(size: 10, weight: .medium, design: .monospaced))
                    .foregroundColor(.white.opacity(0.5))
                Spacer()
                Text("WAVE")
                    .font(.system(size: 9, design: .monospaced))
                    .foregroundColor(.white.opacity(0.4))
            }

            Divider()
                .background(Color.white.opacity(0.2))

            // News list
            ForEach(entry.items.prefix(3)) { item in
                HStack(spacing: 8) {
                    // Wave indicator
                    RoundedRectangle(cornerRadius: 2)
                        .fill(item.sentiment.color)
                        .frame(width: 3, height: 28)

                    VStack(alignment: .leading, spacing: 2) {
                        Text(item.title)
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(.white)
                            .lineLimit(1)

                        HStack(spacing: 4) {
                            Text(item.source)
                                .font(.system(size: 9, design: .monospaced))
                                .foregroundColor(.white.opacity(0.5))
                            Text(item.waveLevel.label)
                                .font(.system(size: 9, design: .monospaced))
                                .foregroundColor(item.sentiment.color)
                        }
                    }

                    Spacer()
                }
            }

            Spacer(minLength: 0)
        }
        .padding(12)
        .background(Color(hex: "1A1A2E"))
    }
}

struct SWELLWidgetLargeView: View {
    let entry: SWELLEntry

    var body: some View {
        let displayCount = entry.trialWarning != nil ? 3 : 5

        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text("SWELL")
                    .font(.system(size: 14, weight: .bold, design: .monospaced))
                    .foregroundColor(Color(hex: "E11D48"))
                Text("NEWS")
                    .font(.system(size: 11, weight: .medium, design: .monospaced))
                    .foregroundColor(.white.opacity(0.5))
                Spacer()
                Text(entry.date, style: .time)
                    .font(.system(size: 10, design: .monospaced))
                    .foregroundColor(.white.opacity(0.4))
            }

            Divider().background(Color.white.opacity(0.2))

            ForEach(Array(entry.items.prefix(displayCount).enumerated()), id: \.element.id) { index, item in
                HStack(spacing: 8) {
                    RoundedRectangle(cornerRadius: 2)
                        .fill(item.sentiment.color)
                        .frame(width: 3, height: 36)
                    VStack(alignment: .leading, spacing: 3) {
                        Text(item.title)
                            .font(.system(size: 13, weight: .medium))
                            .foregroundColor(.white)
                            .lineLimit(2)
                        HStack(spacing: 6) {
                            HStack(spacing: 3) {
                                Circle().fill(item.sentiment.color).frame(width: 5, height: 5)
                                Text(item.source)
                                    .font(.system(size: 9, design: .monospaced))
                                    .foregroundColor(.white.opacity(0.5))
                            }
                            Text(item.waveLevel.label)
                                .font(.system(size: 9, design: .monospaced))
                                .foregroundColor(item.sentiment.color)
                        }
                    }
                    Spacer()
                }
                .padding(.vertical, 2)

                if index < displayCount - 1 {
                    Divider().background(Color.white.opacity(0.1))
                }
            }

            // Trial warning banner
            if let warning = entry.trialWarning {
                HStack {
                    Text("⚠ \(warning)")
                        .font(.system(size: 10, weight: .medium))
                        .foregroundColor(Color(hex: "F59E0B"))
                    Spacer()
                    Text("Premium →")
                        .font(.system(size: 10, weight: .bold, design: .monospaced))
                        .foregroundColor(Color(hex: "6366F1"))
                }
                .padding(.horizontal, 10)
                .padding(.vertical, 8)
                .background(Color(hex: "F59E0B").opacity(0.12))
                .cornerRadius(8)
                .padding(.top, 4)
            }

            Spacer(minLength: 0)
        }
        .padding(14)
        .background(Color(hex: "1A1A2E"))
    }
}

// MARK: - Widget Definition

struct SWELLWidget: Widget {
    let kind: String = "SWELLWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: SWELLProvider()) { entry in
            if #available(iOS 17.0, *) {
                SWELLWidgetEntryView(entry: entry)
                    .containerBackground(Color(hex: "1A1A2E"), for: .widget)
            } else {
                SWELLWidgetEntryView(entry: entry)
            }
        }
        .configurationDisplayName("SWELL")
        .description("波を読む — 最新ニュースの波を表示")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

struct SWELLWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    let entry: SWELLEntry

    var body: some View {
        switch family {
        case .systemSmall:
            SWELLWidgetSmallView(entry: entry)
        case .systemMedium:
            SWELLWidgetMediumView(entry: entry)
        case .systemLarge:
            SWELLWidgetLargeView(entry: entry)
        default:
            SWELLWidgetMediumView(entry: entry)
        }
    }
}

// MARK: - Color Extension

extension Color {
    init(hex: String) {
        let scanner = Scanner(string: hex)
        var rgbValue: UInt64 = 0
        scanner.scanHexInt64(&rgbValue)
        self.init(
            red: Double((rgbValue >> 16) & 0xFF) / 255.0,
            green: Double((rgbValue >> 8) & 0xFF) / 255.0,
            blue: Double(rgbValue & 0xFF) / 255.0
        )
    }
}

// MARK: - Preview

#Preview(as: .systemSmall) {
    SWELLWidget()
} timeline: {
    SWELLEntry(date: Date(), items: [
        WidgetNewsItem(title: "米軍がテヘラン郊外の橋を攻撃", source: "NHK", waveLevel: .high, sentiment: .green),
    ])
}

#Preview(as: .systemMedium) {
    SWELLWidget()
} timeline: {
    SWELLEntry(date: Date(), items: [
        WidgetNewsItem(title: "米軍がテヘラン郊外の橋を攻撃 イラン側は徹底抗戦続ける構え", source: "NHK", waveLevel: .high, sentiment: .green),
        WidgetNewsItem(title: "マイクロソフト 日本国内でのAI開発に約1兆6000億円投資", source: "NHK", waveLevel: .medium, sentiment: .green),
        WidgetNewsItem(title: "トランプ大統領 輸入医薬品に100％の追加関税", source: "Yahoo", waveLevel: .high, sentiment: .blue),
    ])
}

#Preview(as: .systemLarge) {
    SWELLWidget()
} timeline: {
    SWELLEntry(date: Date(), items: [
        WidgetNewsItem(title: "米軍がテヘラン郊外の橋を攻撃 イラン側は徹底抗戦続ける構え", source: "NHK", waveLevel: .high, sentiment: .green),
        WidgetNewsItem(title: "マイクロソフト 日本国内でのAI開発に約1兆6000億円投資", source: "NHK", waveLevel: .medium, sentiment: .green),
        WidgetNewsItem(title: "トランプ大統領 輸入医薬品に100％の追加関税", source: "Yahoo", waveLevel: .high, sentiment: .blue),
        WidgetNewsItem(title: "大阪市の住宅街に出没し保護されたシカ 名前「シカやん」に", source: "NHK", waveLevel: .medium, sentiment: .blue),
        WidgetNewsItem(title: "信号設定ミス、新たに計15駅で確認 JR東日本", source: "朝日新聞", waveLevel: .medium, sentiment: .blue),
    ])
}
