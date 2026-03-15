import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'ja' | 'en' | 'zh' | 'ko' | 'es' | 'fr' | 'de' | 'pt' | 'ru' | 'ar';

interface LocalizationContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string, defaultValue?: string) => string;
  isAutoDetected: boolean;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

// Translation dictionary
const translations: Record<Language, Record<string, string>> = {
  ja: {
    'app.title': 'SWELL',
    'app.tagline': '波を読む',
    'category.news': 'ニュース',
    'category.social': 'ソーシャル',
    'category.market': '市況',
    'wave.low': '小波',
    'wave.medium': '通常波',
    'wave.high': '高波',
    'sentiment.blue': '中立',
    'sentiment.green': '好意的',
    'sentiment.yellow': '賛否割れ',
    'sentiment.red': '反対・炎上',
    'button.back': '← 戻る',
    'button.next': '次へ',
    'button.skip': 'スキップ',
    'error.topic_not_found': 'トピックが見つかりません',
    'settings.theme': 'テーマ',
    'settings.language': '言語',
    'settings.account': 'アカウント',
  },
  en: {
    'app.title': 'SWELL',
    'app.tagline': 'Read the Waves',
    'category.news': 'News',
    'category.social': 'Social',
    'category.market': 'Market',
    'wave.low': 'Low Wave',
    'wave.medium': 'Normal Wave',
    'wave.high': 'High Wave',
    'sentiment.blue': 'Neutral',
    'sentiment.green': 'Positive',
    'sentiment.yellow': 'Mixed',
    'sentiment.red': 'Negative',
    'button.back': '← Back',
    'button.next': 'Next',
    'button.skip': 'Skip',
    'error.topic_not_found': 'Topic not found',
    'settings.theme': 'Theme',
    'settings.language': 'Language',
    'settings.account': 'Account',
  },
  zh: {
    'app.title': 'SWELL',
    'app.tagline': '读懂波澜',
    'category.news': '新闻',
    'category.social': '社交',
    'category.market': '市场',
    'wave.low': '小浪',
    'wave.medium': '中浪',
    'wave.high': '大浪',
    'sentiment.blue': '中立',
    'sentiment.green': '正面',
    'sentiment.yellow': '混合',
    'sentiment.red': '负面',
    'button.back': '← 返回',
    'button.next': '下一步',
    'button.skip': '跳过',
    'error.topic_not_found': '未找到主题',
    'settings.theme': '主题',
    'settings.language': '语言',
    'settings.account': '账户',
  },
  ko: {
    'app.title': 'SWELL',
    'app.tagline': '파도를 읽다',
    'category.news': '뉴스',
    'category.social': '소셜',
    'category.market': '시장',
    'wave.low': '작은 파도',
    'wave.medium': '보통 파도',
    'wave.high': '큰 파도',
    'sentiment.blue': '중립',
    'sentiment.green': '긍정',
    'sentiment.yellow': '혼합',
    'sentiment.red': '부정',
    'button.back': '← 뒤로',
    'button.next': '다음',
    'button.skip': '건너뛰기',
    'error.topic_not_found': '주제를 찾을 수 없음',
    'settings.theme': '테마',
    'settings.language': '언어',
    'settings.account': '계정',
  },
  es: {
    'app.title': 'SWELL',
    'app.tagline': 'Lee las Olas',
    'category.news': 'Noticias',
    'category.social': 'Social',
    'category.market': 'Mercado',
    'wave.low': 'Ola Baja',
    'wave.medium': 'Ola Normal',
    'wave.high': 'Ola Alta',
    'sentiment.blue': 'Neutral',
    'sentiment.green': 'Positivo',
    'sentiment.yellow': 'Mixto',
    'sentiment.red': 'Negativo',
    'button.back': '← Atrás',
    'button.next': 'Siguiente',
    'button.skip': 'Omitir',
    'error.topic_not_found': 'Tema no encontrado',
    'settings.theme': 'Tema',
    'settings.language': 'Idioma',
    'settings.account': 'Cuenta',
  },
  fr: {
    'app.title': 'SWELL',
    'app.tagline': 'Lisez les Vagues',
    'category.news': 'Actualités',
    'category.social': 'Social',
    'category.market': 'Marché',
    'wave.low': 'Petite Vague',
    'wave.medium': 'Vague Normale',
    'wave.high': 'Grande Vague',
    'sentiment.blue': 'Neutre',
    'sentiment.green': 'Positif',
    'sentiment.yellow': 'Mixte',
    'sentiment.red': 'Négatif',
    'button.back': '← Retour',
    'button.next': 'Suivant',
    'button.skip': 'Ignorer',
    'error.topic_not_found': 'Sujet non trouvé',
    'settings.theme': 'Thème',
    'settings.language': 'Langue',
    'settings.account': 'Compte',
  },
  de: {
    'app.title': 'SWELL',
    'app.tagline': 'Lesen Sie die Wellen',
    'category.news': 'Nachrichten',
    'category.social': 'Sozial',
    'category.market': 'Markt',
    'wave.low': 'Kleine Welle',
    'wave.medium': 'Normale Welle',
    'wave.high': 'Große Welle',
    'sentiment.blue': 'Neutral',
    'sentiment.green': 'Positiv',
    'sentiment.yellow': 'Gemischt',
    'sentiment.red': 'Negativ',
    'button.back': '← Zurück',
    'button.next': 'Weiter',
    'button.skip': 'Überspringen',
    'error.topic_not_found': 'Thema nicht gefunden',
    'settings.theme': 'Design',
    'settings.language': 'Sprache',
    'settings.account': 'Konto',
  },
  pt: {
    'app.title': 'SWELL',
    'app.tagline': 'Leia as Ondas',
    'category.news': 'Notícias',
    'category.social': 'Social',
    'category.market': 'Mercado',
    'wave.low': 'Onda Baixa',
    'wave.medium': 'Onda Normal',
    'wave.high': 'Onda Alta',
    'sentiment.blue': 'Neutro',
    'sentiment.green': 'Positivo',
    'sentiment.yellow': 'Misto',
    'sentiment.red': 'Negativo',
    'button.back': '← Voltar',
    'button.next': 'Próximo',
    'button.skip': 'Pular',
    'error.topic_not_found': 'Tópico não encontrado',
    'settings.theme': 'Tema',
    'settings.language': 'Idioma',
    'settings.account': 'Conta',
  },
  ru: {
    'app.title': 'SWELL',
    'app.tagline': 'Читайте Волны',
    'category.news': 'Новости',
    'category.social': 'Социальные',
    'category.market': 'Рынок',
    'wave.low': 'Малая волна',
    'wave.medium': 'Нормальная волна',
    'wave.high': 'Большая волна',
    'sentiment.blue': 'Нейтральный',
    'sentiment.green': 'Положительный',
    'sentiment.yellow': 'Смешанный',
    'sentiment.red': 'Отрицательный',
    'button.back': '← Назад',
    'button.next': 'Далее',
    'button.skip': 'Пропустить',
    'error.topic_not_found': 'Тема не найдена',
    'settings.theme': 'Тема',
    'settings.language': 'Язык',
    'settings.account': 'Аккаунт',
  },
  ar: {
    'app.title': 'SWELL',
    'app.tagline': 'اقرأ الموجات',
    'category.news': 'أخبار',
    'category.social': 'اجتماعي',
    'category.market': 'السوق',
    'wave.low': 'موجة منخفضة',
    'wave.medium': 'موجة عادية',
    'wave.high': 'موجة عالية',
    'sentiment.blue': 'محايد',
    'sentiment.green': 'إيجابي',
    'sentiment.yellow': 'مختلط',
    'sentiment.red': 'سلبي',
    'button.back': '← رجوع',
    'button.next': 'التالي',
    'button.skip': 'تخطي',
    'error.topic_not_found': 'لم يتم العثور على الموضوع',
    'settings.theme': 'المظهر',
    'settings.language': 'اللغة',
    'settings.account': 'الحساب',
  },
};

/**
 * Detect language from device locale
 */
function detectLanguage(): Language {
  try {
    const locales = getLocales();
    if (locales.length === 0) return 'en';

    const primaryLocale = locales[0].languageCode;
    const supportedLanguages: Language[] = ['ja', 'en', 'zh', 'ko', 'es', 'fr', 'de', 'pt', 'ru', 'ar'];

    // Exact match
    if (supportedLanguages.includes(primaryLocale as Language)) {
      return primaryLocale as Language;
    }

    // Fallback to English
    return 'en';
  } catch (error) {
    console.warn('Error detecting language:', error);
    return 'en';
  }
}

export function LocalizationProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [isAutoDetected, setIsAutoDetected] = useState(true);

  // Initialize language on mount
  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        // Check if user has saved a language preference
        const savedLanguage = await AsyncStorage.getItem('app_language');
        if (savedLanguage && translations[savedLanguage as Language]) {
          setLanguageState(savedLanguage as Language);
          setIsAutoDetected(false);
        } else {
          // Auto-detect from device locale
          const detectedLang = detectLanguage();
          setLanguageState(detectedLang);
          setIsAutoDetected(true);
          // Save the detected language
          await AsyncStorage.setItem('app_language', detectedLang);
        }
      } catch (error) {
        console.warn('Error initializing language:', error);
        setLanguageState('en');
      }
    };

    initializeLanguage();
  }, []);

  const handleSetLanguage = useCallback(async (lang: Language) => {
    if (translations[lang]) {
      setLanguageState(lang);
      setIsAutoDetected(false);
      try {
        await AsyncStorage.setItem('app_language', lang);
      } catch (error) {
        console.warn('Error saving language preference:', error);
      }
    }
  }, []);

  const t = useCallback(
    (key: string, defaultValue?: string): string => {
      return translations[language]?.[key] || defaultValue || key;
    },
    [language],
  );

  return (
    <LocalizationContext.Provider
      value={{
        language,
        setLanguage: handleSetLanguage,
        t,
        isAutoDetected,
      }}
    >
      {children}
    </LocalizationContext.Provider>
  );
}

export function useLocalization() {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useLocalization must be used within LocalizationProvider');
  }
  return context;
}
