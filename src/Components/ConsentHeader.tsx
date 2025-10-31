import React, { useContext, useEffect } from 'react';
import bg from '../Assets/bg.png';
import privacy from '../Assets/privacy.svg';
import { useTranslation } from 'react-i18next';
import { useI18nextContext } from '../utils/I18nextProvider';
import Select, { StylesConfig } from 'react-select';
import i18n from 'i18next';
import { ConsentContext } from '../utils/ConsentContextProvider';

const ConsentHeader = ({ isRejectedLayout, languageSwitcher, modeSwitcher, layout }: any) => {
  const { t } = useTranslation();
  const { listLanguages } = useI18nextContext();
  const currentLanguage = listLanguages.filter(
    (lang: any) => lang.value == i18n.language || i18n.language?.includes(lang.value)
  );
  const consentContext = useContext(ConsentContext);
  const customStyles: StylesConfig = {
    menuList: (base) => ({
      ...base,
      maxHeight: '160px',
    }),
  };

  const listMode = [
    { value: 'opt-in', label: 'Opt-In' },
    { value: 'opt-out', label: 'Opt-Out' },
  ];

  const [mode, setMode] = React.useState(listMode[0]);

  useEffect(() => {
    const userOverrideMode = localStorage.getItem('user_override_mode');
    const userOverrideLanguage = localStorage.getItem('user_override_language');
    if (window['aesirxOptOutMode'] === 'true') {
      setMode(listMode?.find((r: any) => r.value === 'opt-out'));
    }
    if (window['geoRules']) {
      if (userOverrideLanguage) {
        i18n.changeLanguage(userOverrideLanguage);
        (window as any).aesirx_analytics_translate = null;
      }
      const matchedRule = matchGeoRule(window['geoRules']);
      if (userOverrideMode) {
        setMode(listMode?.find((r: any) => r.value === userOverrideMode));
        if (userOverrideMode === 'opt-out') {
          window['aesirxOptOutMode'] = 'true';
        } else if (userOverrideMode === 'opt-in') {
          window['aesirxOptOutMode'] = 'false';
        }
      } else if (matchedRule) {
        if (matchedRule?.geo_rules_consent_mode === 'opt-out') {
          window['aesirxOptOutMode'] = 'true';
          setMode(listMode?.find((r: any) => r.value === 'opt-out'));
        } else if (matchedRule?.geo_rules_consent_mode === 'opt-in') {
          window['aesirxOptOutMode'] = 'false';
          setMode(listMode?.find((r: any) => r.value === 'opt-in'));
        }
      }

      if (matchedRule?.geo_rules_override === 'yes') {
        window['languageSwitcher'] = true;
        window['modeSwitcher'] = true;
      }

      consentContext.forceUpdate('changed');
    }
  }, [layout]);
  return (
    <div
      className={`rounded-top align-items-center justify-content-between p-2 p-lg-3 fw-medium flex-wrap py-2 py-lg-3 px-lg-4 header-consent-bg ${
        !modeSwitcher && isRejectedLayout ? 'd-none' : 'd-flex'
      } ${i18n.language}`}
      style={{
        borderBottom: '1px solid #DEDEDE',
      }}
    >
      <div className="text-primary text-nowrap">
        {(window as any)?.aesirx_analytics_translate?.txt_tracking_data_privacy ??
          t('txt_tracking_data_privacy')}
      </div>
      {languageSwitcher ? (
        <div className="language-switcher ms-auto me-2 d-flex align-items-center fs-14">
          <Select
            styles={{
              ...customStyles,
              control: (base) => ({
                ...base,
                minWidth: '105px',
              }),
            }}
            components={{
              IndicatorSeparator: () => null,
            }}
            isClearable={false}
            isSearchable={false}
            placeholder={t('txt_select')}
            options={listLanguages}
            className="shadow-none"
            onChange={(data: any) => {
              i18n.changeLanguage(data.value);
              consentContext.forceUpdate('Language changed');
              localStorage.setItem('user_override_language', data.value);
              (window as any).aesirx_analytics_translate = null;
            }}
            defaultValue={
              currentLanguage?.length ? currentLanguage : [{ label: 'English', value: 'en' }]
            }
          />
        </div>
      ) : (
        <></>
      )}
      {modeSwitcher ? (
        <div className="language-switcher ms-1 me-2 d-flex align-items-center fs-14">
          <Select
            styles={customStyles}
            components={{
              IndicatorSeparator: () => null,
            }}
            isClearable={false}
            isSearchable={false}
            placeholder={t('txt_select')}
            options={listMode}
            className="shadow-none"
            onChange={(data: any) => {
              const rejected = sessionStorage.getItem('aesirx-analytics-rejected');
              localStorage.setItem('user_override_mode', data.value);
              if (rejected) {
                sessionStorage.removeItem('aesirx-analytics-rejected');
              }
              setMode(data);
              if (data.value === 'opt-out') {
                window['aesirxOptOutMode'] = 'true';
              } else {
                window['aesirxOptOutMode'] = 'false';
              }
              consentContext.forceUpdate('Mode changed');
            }}
            value={mode}
          />
        </div>
      ) : (
        <></>
      )}
      <div className="d-flex align-items-center fs-14 text-primary">
        <a
          href="https://shield.aesirx.io/"
          rel="noreferrer"
          target="_blank"
          className="minimize-shield-wrapper position-relative text-decoration-none"
        >
          <img
            className="cover-img position-absolute h-100 w-100 object-fit-cover z-1"
            src={bg}
            alt="Background Image"
          />
          <div className="minimize-shield position-relative z-2 py-2">
            <img src={privacy} alt="SoP Icon" />
            {(window as any)?.aesirx_analytics_translate?.txt_shield_of_privacy ??
              t('txt_shield_of_privacy')}
          </div>
        </a>
      </div>
    </div>
  );
};
export default ConsentHeader;

const matchGeoRule = (rules) => {
  const userLang = navigator.language;
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone?.toLowerCase();
  for (const rule of rules) {
    const langMatch = userLang === rule.geo_rules_language;
    const tzMatch = rule.geo_rules_timezone ? userTimeZone === rule.geo_rules_timezone : true;
    if (rule.geo_rules_logic === 'and') {
      if (langMatch && tzMatch) {
        return rule;
      }
    } else if (rule.geo_rules_logic === 'or') {
      if (langMatch || tzMatch) {
        return rule;
      }
    }
  }

  return null;
};
