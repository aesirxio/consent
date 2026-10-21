import i18n from 'i18next';

// Labels only, so the script bundles don't pull in every translation JSON.
export const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'da', label: 'Dansk' },
  { value: 'vi', label: 'Vietnamese' },
  { value: 'th', label: 'Thai' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'nl', label: 'Dutch' },
  { value: 'ar', label: 'Arabic' },
  { value: 'cs', label: 'Czech' },
  { value: 'de', label: 'German' },
  { value: 'el', label: 'Greek' },
  { value: 'fi', label: 'Finnish' },
  { value: 'he', label: 'Hebrew' },
  { value: 'hu', label: 'Hungarian' },
  { value: 'id', label: 'Indonesian' },
  { value: 'it', label: 'Italian' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'ms', label: 'Malay' },
  { value: 'no', label: 'Norwegian' },
  { value: 'pl', label: 'Polish' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ro', label: 'Romanian' },
  { value: 'se', label: 'Swedish' },
  { value: 'tr', label: 'Turkish' },
  { value: 'bg', label: 'Bulgarian' },
  { value: 'sk', label: 'Slovak' },
  { value: 'uk', label: 'Ukrainian' },
  { value: 'hr', label: 'Croatian' },
  { value: 'hi', label: 'Hindi' },
  { value: 'zh', label: 'Chinese (Hong Kong)' },
  { value: 'sr', label: 'Serbian' },
  { value: 'tl', label: 'Tagalog' },
];

// Language codes whose built file in dist/translations has a different name.
const translationFiles = { da: 'dk', uk: 'ua' };
// Standard codes that map to a different code in languageOptions.
const languageAliases = { sv: 'se', nb: 'no', nn: 'no', vn: 'vi', dk: 'da', ua: 'uk' };
const TRANSLATION_SCRIPT_ID = 'aesirx-consent-translation';

const findTranslationScript = (): HTMLScriptElement | null =>
  (document.getElementById(TRANSLATION_SCRIPT_ID) as HTMLScriptElement) ??
  Array.from(document.scripts).find((s) => /\/translations\/[a-z]+\.js(\?|$)/.test(s.src)) ??
  null;

const getTranslationUrl = (lang: string) => {
  const file = `${translationFiles[lang] ?? lang}.js`;
  const current = findTranslationScript();
  if (current) {
    return current.src.replace(/[a-z]+\.js(\?.*)?$/, file);
  }
  const uiEntry = window['aesirxConsentConfig']?.uiEntry;
  return uiEntry ? new URL(`../translations/${file}`, new URL(uiEntry, location.href)).href : null;
};

export const getCurrentLanguage = (): string => {
  if (i18n.isInitialized) {
    return i18n.language;
  }
  const file = findTranslationScript()?.src.match(/\/([a-z]+)\.js(\?|$)/)?.[1];
  const lang = Object.keys(translationFiles).find((key) => translationFiles[key] === file) ?? file;
  return lang ?? 'en';
};

// The React/Next wrappers mount AesirXI18nextProvider, which initializes i18next with all
// translations. The script bundles don't, so load translations/{lang}.js instead, which sets
// window.aesirx_analytics_translate.
export const changeLanguage = (lang: string): Promise<void> => {
  if (i18n.isInitialized) {
    (window as any).aesirx_analytics_translate = null;
    return i18n.changeLanguage(lang).then(() => undefined);
  }
  const url = getTranslationUrl(lang);
  if (!url) {
    console.warn('AesirX Consent: translations script not found, cannot change language');
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.onload = () => {
      Array.from(document.scripts)
        .filter((s) => s !== script && /\/translations\/[a-z]+\.js(\?|$)/.test(s.src))
        .forEach((s) => s.remove());
      script.id = TRANSLATION_SCRIPT_ID;
      resolve();
    };
    script.onerror = () => {
      script.remove();
      reject(new Error(`AesirX Consent: failed to load ${url}`));
    };
    document.head.appendChild(script);
  });
};

// Maps e.g. "vi-VN" or "sv" to a code in languageOptions, or null if unsupported.
const resolveLanguage = (lang?: string): string | null => {
  if (!lang) return null;
  const normalized = lang.toLowerCase();
  const primary = normalized.split(/[-_]/)[0];
  const match = [normalized, primary]
    .map((code) => languageAliases[code] ?? code)
    .find((code) => languageOptions.some((option) => option.value === code));
  return match ?? null;
};

// Script bundles only: load the translations for <html lang> when the page included a
// different one, as AesirXI18nextProvider does with i18next in the React/Next wrappers.
export const initLanguage = async () => {
  if (i18n.isInitialized) return;
  const lang = resolveLanguage(document.documentElement.lang);
  if (!lang || lang === getCurrentLanguage()) return;
  try {
    await changeLanguage(lang);
  } catch (error) {
    console.error(error);
  }
};
