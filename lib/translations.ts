/**
 * Comprehensive translation dictionary for Swell app
 * Supports Japanese, English, and other languages
 */

export type Language = 'ja' | 'en' | 'zh' | 'ko';

export const translations: Record<Language, Record<string, string>> = {
  ja: {
    // App Title & Navigation
    'app.title': 'SWELL',
    'app.subtitle': 'ニュースを読む前に、波を見る',
    'nav.home': 'ホーム',
    'nav.settings': '設定',
    'nav.saved': '保存済み',
    'nav.profile': 'プロフィール',

    // Categories
    'category.news': 'ニュース',
    'category.social': 'ソーシャル',
    'category.market': 'マーケット',

    // Home Screen
    'home.wave_ranking': 'ウェーブランキング',
    'home.trending_now': 'トレンド中',
    'home.no_data': 'データがありません',
    'home.loading': '読み込み中...',
    'home.error': 'エラーが発生しました',
    'home.data_source': 'データソース',

    // Topic Card
    'topic.comments': 'コメント',
    'topic.score': 'スコア',
    'topic.share': '共有',
    'topic.save': '保存',
    'topic.saved': '保存済み',
    'topic.source': 'ソース',
    'topic.time': '時間',

    // Premium Features
    'premium.unlock': 'ロック解除',
    'premium.subscribe': '購読する',
    'premium.price': '¥480/月',
    'premium.benefits': 'プレミアム機能を利用できます',
    'premium.cancel_anytime': 'いつでもキャンセル可能',
    'premium.restore': '購入を復元',
    'premium.terms': '利用規約',

    // Settings
    'settings.title': '設定',
    'settings.theme': 'テーマ',
    'settings.language': '言語',
    'settings.notifications': '通知',
    'settings.about': 'について',
    'settings.version': 'バージョン',
    'settings.feedback': 'フィードバック',
    'settings.privacy': 'プライバシーポリシー',
    'settings.terms': '利用規約',

    // Theme Options
    'theme.normal': 'ノーマル',
    'theme.cli': 'CLI',
    'theme.pixel': '8ビット',
    'theme.light': 'ライト',
    'theme.dark': 'ダーク',

    // Language Options
    'language.japanese': '日本語',
    'language.english': 'English',
    'language.chinese': '中文',
    'language.korean': '한국어',

    // Buttons
    'button.next': '次へ',
    'button.skip': 'スキップ',
    'button.close': '閉じる',
    'button.save': '保存',
    'button.cancel': 'キャンセル',
    'button.confirm': '確認',
    'button.delete': '削除',
    'button.edit': '編集',

    // Messages
    'message.success': '成功しました',
    'message.error': 'エラーが発生しました',
    'message.loading': '読み込み中...',
    'message.empty': 'データがありません',
    'message.retry': '再試行',

    // Tutorial
    'tutorial.title': 'ウェーブの色を読む',
    'tutorial.description': 'ウェーブの色は話題への反応の強さを表します',
    'tutorial.blue': '青 = 中立',
    'tutorial.green': '緑 = 好意的',
    'tutorial.yellow': '黄 = 話題',
    'tutorial.red': '赤 = 失上がり',

    // SOCIAL Category
    'social.videos': 'トレンド動画',
    'social.trending': 'トレンド中',
    'social.youtube': 'YouTube',
    'social.tiktok': 'TikTok',
    'social.views': '再生数',
    'social.likes': 'いいね',
    'social.watch': '視聴',

    // MARKET Category
    'market.stocks': '株価',
    'market.price': '価格',
    'market.change': '変動',
    'market.high': '高値',
    'market.low': '安値',
    'market.volume': '出来高',
    'market.portfolio': 'ポートフォリオ',
    'market.add_stock': '銘柄を追加',
    'market.remove_stock': '銘柄を削除',

    // Preferences
    'preferences.interests': '興味',
    'preferences.technology': 'テクノロジー',
    'preferences.business': 'ビジネス',
    'preferences.science': 'サイエンス',
    'preferences.entertainment': 'エンターテイメント',
    'preferences.sports': 'スポーツ',
    'preferences.health': 'ヘルス',
    'preferences.customize': 'カスタマイズ',

    // Data Sources
    'source.hackernews': 'HackerNews',
    'source.rss': 'RSS',
    'source.youtube': 'YouTube',
    'source.tiktok': 'TikTok',
    'source.yahoo_finance': 'Yahoo Finance',
    'source.mock': 'モックデータ',
  },

  en: {
    // App Title & Navigation
    'app.title': 'SWELL',
    'app.subtitle': 'Check the waves before reading news',
    'nav.home': 'Home',
    'nav.settings': 'Settings',
    'nav.saved': 'Saved',
    'nav.profile': 'Profile',

    // Categories
    'category.news': 'News',
    'category.social': 'Social',
    'category.market': 'Market',

    // Home Screen
    'home.wave_ranking': 'Wave Ranking',
    'home.trending_now': 'Trending Now',
    'home.no_data': 'No data available',
    'home.loading': 'Loading...',
    'home.error': 'An error occurred',
    'home.data_source': 'Data Source',

    // Topic Card
    'topic.comments': 'Comments',
    'topic.score': 'Score',
    'topic.share': 'Share',
    'topic.save': 'Save',
    'topic.saved': 'Saved',
    'topic.source': 'Source',
    'topic.time': 'Time',

    // Premium Features
    'premium.unlock': 'Unlock',
    'premium.subscribe': 'Subscribe',
    'premium.price': '¥480/month',
    'premium.benefits': 'Access premium features',
    'premium.cancel_anytime': 'Cancel anytime',
    'premium.restore': 'Restore Purchase',
    'premium.terms': 'Terms',

    // Settings
    'settings.title': 'Settings',
    'settings.theme': 'Theme',
    'settings.language': 'Language',
    'settings.notifications': 'Notifications',
    'settings.about': 'About',
    'settings.version': 'Version',
    'settings.feedback': 'Feedback',
    'settings.privacy': 'Privacy Policy',
    'settings.terms': 'Terms of Service',

    // Theme Options
    'theme.normal': 'Normal',
    'theme.cli': 'CLI',
    'theme.pixel': '8-bit',
    'theme.light': 'Light',
    'theme.dark': 'Dark',

    // Language Options
    'language.japanese': '日本語',
    'language.english': 'English',
    'language.chinese': '中文',
    'language.korean': '한국어',

    // Buttons
    'button.next': 'Next',
    'button.skip': 'Skip',
    'button.close': 'Close',
    'button.save': 'Save',
    'button.cancel': 'Cancel',
    'button.confirm': 'Confirm',
    'button.delete': 'Delete',
    'button.edit': 'Edit',

    // Messages
    'message.success': 'Success',
    'message.error': 'An error occurred',
    'message.loading': 'Loading...',
    'message.empty': 'No data available',
    'message.retry': 'Retry',

    // Tutorial
    'tutorial.title': 'Read the Wave Color',
    'tutorial.description': 'Wave color shows the strength of reaction to topics',
    'tutorial.blue': 'Blue = Neutral',
    'tutorial.green': 'Green = Positive',
    'tutorial.yellow': 'Yellow = Trending',
    'tutorial.red': 'Red = Negative',

    // SOCIAL Category
    'social.videos': 'Trending Videos',
    'social.trending': 'Trending',
    'social.youtube': 'YouTube',
    'social.tiktok': 'TikTok',
    'social.views': 'Views',
    'social.likes': 'Likes',
    'social.watch': 'Watch',

    // MARKET Category
    'market.stocks': 'Stocks',
    'market.price': 'Price',
    'market.change': 'Change',
    'market.high': 'High',
    'market.low': 'Low',
    'market.volume': 'Volume',
    'market.portfolio': 'Portfolio',
    'market.add_stock': 'Add Stock',
    'market.remove_stock': 'Remove Stock',

    // Preferences
    'preferences.interests': 'Interests',
    'preferences.technology': 'Technology',
    'preferences.business': 'Business',
    'preferences.science': 'Science',
    'preferences.entertainment': 'Entertainment',
    'preferences.sports': 'Sports',
    'preferences.health': 'Health',
    'preferences.customize': 'Customize',

    // Data Sources
    'source.hackernews': 'HackerNews',
    'source.rss': 'RSS',
    'source.youtube': 'YouTube',
    'source.tiktok': 'TikTok',
    'source.yahoo_finance': 'Yahoo Finance',
    'source.mock': 'Mock Data',
  },

  zh: {
    'app.title': 'SWELL',
    'app.subtitle': '阅读新闻前先看看波浪',
    'nav.home': '首页',
    'nav.settings': '设置',
    'nav.saved': '已保存',
    'nav.profile': '个人资料',
    'category.news': '新闻',
    'category.social': '社交',
    'category.market': '市场',
  },

  ko: {
    'app.title': 'SWELL',
    'app.subtitle': '뉴스를 읽기 전에 파도를 확인하세요',
    'nav.home': '홈',
    'nav.settings': '설정',
    'nav.saved': '저장됨',
    'nav.profile': '프로필',
    'category.news': '뉴스',
    'category.social': '소셜',
    'category.market': '마켓',
  },
};

/**
 * Get translated text for a key in the specified language
 */
export function t(key: string, language: Language = 'ja'): string {
  return translations[language]?.[key] ?? key;
}

/**
 * Hook to use translations in components
 */
export function useTranslation(language: Language = 'ja') {
  return (key: string) => t(key, language);
}
