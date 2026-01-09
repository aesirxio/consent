import React, { useEffect, useState } from 'react';

import { createRoot } from 'react-dom/client';
import ConsentComponentCustomSimple from './Components/ConsentCustomSimple';
import OptinConsent from './Components/OptInConsent';
import { Buffer } from 'buffer';
import { getConsentTemplate } from './utils/consent';
import { AnalyticsContextProvider } from 'aesirx-analytics';
import { blockScripts } from './utils';
import ConsentContextProviderIsolate from './utils/ConsentContextProviderIsolate';

window['aesirxBuffer'] = Buffer;
declare global {
  interface Window {
    process: any;
    funcAfterConsent: any;
    funcAfterReject: any;
    configBlockJS: any;
    aesirxBlockJSDomains: any;
    aesirxHoldBackJS: any;
    disabledBlockJSDomains: any;
  }
}
window['aesirx-consent-enable'] = 'true';
const ConsentPopup = () => {
  window.process = { env: '' };
  const [layout, setLayout] = useState(window['consentLayout'] ?? 'simple-consent-mode');
  const [gtagId, setGtagId] = useState(window['analyticsGtagId']);
  const [gtmId, setGtmId] = useState(window['analyticsGtmId']);
  const [customConsentText, setCustomConsentText] = useState(window['analyticsConsentText']);
  const [customCookieText, setCustomCookieText] = useState(window['analyticsCookieText']);
  const [customDetailText, setCustomDetailText] = useState(window['analyticsDetailText']);
  const [customRejectText, setCustomRejectText] = useState(window['analyticsRejectText']);
  const [disabledBlockDomains, setDisabledBlockDomains] = useState(
    window['disabledBlockJSDomains']
  );
  useEffect(() => {
    const init = async () => {
      const data: any = await getConsentTemplate(
        window['aesirx1stparty'] ?? '',
        window.location.host
      );

      if (data?.data?.gpc_support) {
        window['disableGPCsupport'] = data?.data?.disable_gpc_support;
      }
      if (data?.data?.gpc_consent === 'opt-out') {
        window['aesirxOptOutMode'] = 'true';
      }
      if (data?.data?.gpc_consent_donotsell === 'yes') {
        window['aesirxOptOutDoNotSell'] = 'true';
      }
      if (data?.data?.age_check) {
        window['ageCheck'] = data?.data?.age_check;
      }
      if (data?.data?.country_check) {
        window['countryCheck'] = data?.data?.country_check;
      }
      if (data?.data?.maximum_age) {
        window['minimumAge'] = data?.data?.minimum_age;
      }
      if (data?.data?.minimum_age) {
        window['maximumAge'] = data?.data?.maximum_age;
      }
      if (data?.data?.allowed_countries?.length) {
        window['allowedCountries'] = data?.data?.allowed_countries;
      }
      if (data?.data?.disallowed_countries?.length) {
        window['disallowedCountries'] = data?.data?.disallowed_countries;
      }

      if (data?.data?.geo_handling === 'yes') {
        const geoData = data?.data?.geo_rules?.length
          ? data?.data?.geo_rules?.map((r: any) => {
              return {
                geo_rules_language: r?.language,
                geo_rules_logic: r?.logic,
                geo_rules_consent_mode: r?.consent_mode,
                geo_rules_timezone: r?.timezone,
                geo_rules_override: r?.override_field,
              };
            })
          : [];
        window['geoRules'] = geoData;
      }
      setLayout(data?.data?.template ?? window['consentLayout']);
      setGtagId(data?.data?.gtag_id ?? window['analyticsGtagId']);
      setGtmId(data?.data?.gtm_id ?? window['analyticsGtmId']);
      setCustomConsentText(data?.data?.consent_text ?? window['analyticsConsentText']);
      setCustomCookieText(data?.data?.cookie_text ?? window['analyticsCookieText']);
      setCustomDetailText(data?.data?.detail_text ?? window['analyticsDetailText']);
      setCustomRejectText(data?.data?.reject_text ?? window['analyticsRejectText']);
      setDisabledBlockDomains(
        data?.data?.disabled_block_domains ?? window['disabledBlockJSDomains']
      );
    };
    init();
  }, []);
  return (
    <ConsentContextProviderIsolate>
      <ConsentComponentCustomSimple
        endpoint={window['aesirx1stparty'] ?? ''}
        networkEnv={window['concordiumNetwork'] ?? ''}
        aesirXEndpoint={window['aesirxEndpoint'] ?? 'https://api.aesirx.io'}
        languageSwitcher={window['languageSwitcher'] ?? ''}
        modeSwitcher={window['modeSwitcher'] ?? ''}
        gtagId={gtagId}
        gtmId={gtmId}
        layout={layout}
        customConsentText={customConsentText}
        customCookieText={customCookieText}
        customDetailText={customDetailText}
        customRejectText={customRejectText}
        disabledBlockDomains={disabledBlockDomains}
      />
    </ConsentContextProviderIsolate>
  );
};
let rootElement: any = {};

const AesirConsent = () => {
  const update = async () => {
    if (document.readyState === 'complete') {
      if ((navigator as any)?.globalPrivacyControl && window['disableGPCsupport'] !== 'true') {
        (window as any)?.__uspapi &&
          (window as any)?.__uspapi('setGPCSignal', 1, function (result) {
            console.log('GPC signal registered in IAB USP API:', result);
          });
      }
      const container = document.body?.appendChild(document.createElement('DIV'));
      rootElement = createRoot(container);
      const isOptInReplaceAnalytics = window['optInConsentData']
        ? JSON.parse(window?.optInConsentData)?.some((obj: any) =>
            Object.keys(obj).includes('replaceAnalyticsConsent')
          )
        : false;
      if (window['disableAnalyticsConsent'] !== 'true') {
        rootElement?.render(
          <>
            {!isOptInReplaceAnalytics ? (
              <>
                {window['aesirx-analytics-enable'] === 'true' ? (
                  <AnalyticsContextProvider>
                    <ConsentPopup />
                  </AnalyticsContextProvider>
                ) : (
                  <ConsentPopup />
                )}{' '}
              </>
            ) : (
              <></>
            )}
            {window['optInConsentData'] && <OptinConsent />}
          </>
        );
      }
    }
  };
  document.addEventListener('readystatechange', update, true);

  update();
};

AesirConsent();

interface ConfigBlockJS {
  _providersToBlock: any[];
  categories: any[];
  _shortCodes: any[];
  _backupNodes: any[];
}
const configBlockJS: ConfigBlockJS = {
  _providersToBlock: [
    ...(window.aesirxBlockJSDomains?.length
      ? [
          ...window.aesirxBlockJSDomains
            ?.filter((el: string) => el)
            ?.map((item: any) => {
              return { re: item?.domain, categories: [item?.category] };
            }),
        ]
      : []),
  ],
  categories: [],
  _shortCodes: [
    {
      key: 'video_placeholder',
      content:
        '<div class="video-placeholder-normal" data-aesirx-tag="video-placeholder" id="[UNIQUEID]"><p class="video-placeholder-text-normal" data-aesirx-tag="placeholder-title">Please accept consent to access this content</p></div>',
      tag: '',
      status: true,
      attributes: [],
    },
  ],
  _backupNodes: [],
};
window.configBlockJS = configBlockJS;

const _nodeListObserver = new MutationObserver(blockScripts);
_nodeListObserver.observe(document.documentElement, {
  childList: true,
  subtree: true,
});
