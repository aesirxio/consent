import React, { createContext, useContext } from 'react';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import common_dk from '../translations/dk/common.json';
import common_en from '../translations/en/common.json';
import common_es from '../translations/es/common.json';
import common_th from '../translations/th/common.json';
import common_vn from '../translations/vi/common.json';
import common_fr from '../translations/fr/common.json';
import common_nl from '../translations/nl/common.json';
import common_ar from '../translations/ar/common.json';
import common_cs from '../translations/cs/common.json';
import common_de from '../translations/de/common.json';
import common_el from '../translations/el/common.json';
import common_fi from '../translations/fi/common.json';
import common_he from '../translations/he/common.json';
import common_hu from '../translations/hu/common.json';
import common_id from '../translations/id/common.json';
import common_it from '../translations/it/common.json';
import common_ja from '../translations/ja/common.json';
import common_ko from '../translations/ko/common.json';
import common_ms from '../translations/ms/common.json';
import common_no from '../translations/no/common.json';
import common_pl from '../translations/pl/common.json';
import common_pt from '../translations/pt/common.json';
import common_ro from '../translations/ro/common.json';
import common_se from '../translations/se/common.json';
import common_tr from '../translations/tr/common.json';
import common_bg from '../translations/bg/common.json';
import common_sk from '../translations/sk/common.json';
import common_ua from '../translations/ua/common.json';
import common_hr from '../translations/hr/common.json';
import common_hi from '../translations/hi/common.json';
import common_zh from '../translations/zh/common.json';
import common_sr from '../translations/sr/common.json';
import common_tl from '../translations/tl/common.json';
import { appLanguages } from '../translations';

const defaultLanguages: any = {
  en: {
    title: 'English',
    translation: common_en,
  },
  da: {
    title: 'Dansk',
    translation: common_dk,
  },
  vi: {
    title: 'Vietnamese',
    translation: common_vn,
  },
  th: {
    title: 'Thai',
    translation: common_th,
  },
  es: {
    title: 'Spanish',
    translation: common_es,
  },
  fr: {
    title: 'French',
    translation: common_fr,
  },
  nl: {
    title: 'Dutch',
    translation: common_nl,
  },
  ar: {
    title: 'Arabic',
    translation: common_ar,
  },
  cs: {
    title: 'Czech',
    translation: common_cs,
  },
  de: {
    title: 'German',
    translation: common_de,
  },
  el: {
    title: 'Greek',
    translation: common_el,
  },
  fi: {
    title: 'Finnish',
    translation: common_fi,
  },
  he: {
    title: 'Hebrew',
    translation: common_he,
  },
  hu: {
    title: 'Hungarian',
    translation: common_hu,
  },
  id: {
    title: 'Indonesian',
    translation: common_id,
  },
  it: {
    title: 'Italian',
    translation: common_it,
  },
  ja: {
    title: 'Japanese',
    translation: common_ja,
  },
  ko: {
    title: 'Korean',
    translation: common_ko,
  },
  ms: {
    title: 'Malay',
    translation: common_ms,
  },
  no: {
    title: 'Norwegian',
    translation: common_no,
  },
  pl: {
    title: 'Polish',
    translation: common_pl,
  },
  pt: {
    title: 'Portuguese',
    translation: common_pt,
  },
  ro: {
    title: 'Romanian',
    translation: common_ro,
  },
  se: {
    title: 'Swedish',
    translation: common_se,
  },
  tr: {
    title: 'Turkish',
    translation: common_tr,
  },
  bg: {
    title: 'Bulgarian',
    translation: common_bg,
  },
  sk: {
    title: 'Slovak',
    translation: common_sk,
  },
  uk: {
    title: 'Ukrainian',
    translation: common_ua,
  },
  hr: {
    title: 'Croatian',
    translation: common_hr,
  },
  hi: {
    title: 'Hindi',
    translation: common_hi,
  },
  zh: {
    title: 'Chinese (Hong Kong)',
    translation: common_zh,
  },
  sr: {
    title: 'Serbian',
    translation: common_sr,
  },
  tl: {
    title: 'Tagalog',
    translation: common_tl,
  },
};

interface IContext {
  listLanguages: any;
}

const I18NextContext = createContext<IContext>({
  listLanguages: [],
});

const AesirXI18nextProvider = ({ children }: { children: React.ReactNode }) => {
  const listLanguages: any = [];

  if (!i18n.isInitialized) {
    i18n
      .use(LanguageDetector)
      .use(initReactI18next)
      .init({
        resources: defaultLanguages,
        lng: (typeof window !== 'undefined' && document.documentElement.lang) || 'en',
        fallbackLng: 'en',
        debug: !process.env.NODE_ENV || process.env.NODE_ENV === 'development',
      });
  }

  Object.entries(appLanguages).forEach(([key, resource]) => {
    i18n.addResourceBundle(key, 'translation', resource);
  });
  const sortedLanguages = Object.keys(defaultLanguages).map((key) => ({
    label: defaultLanguages[key].title,
    value: key,
  }));
  listLanguages.push(...sortedLanguages);

  return (
    <I18NextContext.Provider value={{ listLanguages }}>
      <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    </I18NextContext.Provider>
  );
};

const useI18nextContext = () => useContext(I18NextContext);

const withI18nextContext = (Component: any) => (props: any) => {
  return <Component {...props} {...useI18nextContext()} />;
};

export { AesirXI18nextProvider, useI18nextContext, withI18nextContext };
