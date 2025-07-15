import { cleanHostName, escapeRegex, getYoutubeID, randomString } from './utils';

import React, { useEffect, useState } from 'react';

import { createRoot } from 'react-dom/client';
import ConsentContextProvider from './utils/ConsentContextProvider';
import ConsentComponentCustom from './Components/ConsentCustom';
import OptinConsent from './Components/OptInConsent';
import { Buffer } from 'buffer';
import { appLanguages } from './translations';
import { AesirXI18nextProvider } from './utils/I18nextProvider';
import { getConsentTemplate } from './utils/consent';
import { AnalyticsContextProvider } from 'aesirx-analytics';

window.Buffer = Buffer;
declare global {
  interface Window {
    process: any;
    funcAfterConsent: any;
    funcAfterReject: any;
    configBlockJS: any;
    aesirxBlockJSDomains: any;
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
    <ConsentContextProvider>
      <ConsentComponentCustom
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
    </ConsentContextProvider>
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
            {window['optInConsentData'] && (
              <AesirXI18nextProvider appLanguages={appLanguages}>
                <OptinConsent />
              </AesirXI18nextProvider>
            )}
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
const addProviderToList = (node: any, cleanedHostname: string) => {
  const nodeCategory =
    node.hasAttribute('data-aesirxconsent') && node.getAttribute('data-aesirxconsent');
  if (!nodeCategory) return;
  const categoryName = nodeCategory.replace('aesirxconsent-', '');
  const provider = configBlockJS?._providersToBlock?.find(({ re }: any) => re === cleanedHostname);
  if (!provider) {
    configBlockJS._providersToBlock.push({
      re: cleanedHostname,
      categories: [categoryName],
      fullPath: false,
    });
  } else if (!provider.isOverridden) {
    provider.categories = [categoryName];
    provider.isOverridden = true;
  } else if (!provider.categories.includes(categoryName)) provider.categories.push(categoryName);
};

const addPlaceholder = (htmlElm: any, uniqueID: string) => {
  const shortCodeData = configBlockJS._shortCodes.find(
    (code: any) => code.key === 'video_placeholder'
  );
  const videoPlaceHolderDataCode = shortCodeData.content;
  const { offsetWidth, offsetHeight } = htmlElm;
  if (offsetWidth === 0 || offsetHeight === 0) return;
  htmlElm.insertAdjacentHTML(
    'beforebegin',
    `${videoPlaceHolderDataCode}`.replace('[UNIQUEID]', uniqueID)
  );
  const addedNode = document.getElementById(uniqueID);
  addedNode.style.width = `${offsetWidth}px`;
  addedNode.style.height = `${offsetHeight}px`;
  const innerTextElement: HTMLElement = document.querySelector(
    `#${uniqueID} .video-placeholder-text-normal`
  );
  innerTextElement.style.display = 'block';
  innerTextElement.style.backgroundColor = '#000';
  innerTextElement.style.borderColor = '#000';
  innerTextElement.style.color = '#fff';
  const youtubeID = getYoutubeID(htmlElm.src);
  if (!youtubeID) return;
  addedNode.classList.replace('video-placeholder-normal', 'video-placeholder-youtube');
  addedNode.style.backgroundImage = `linear-gradient(rgba(76,72,72,.7),rgba(76,72,72,.7)),url('https://img.youtube.com/vi/${youtubeID}/maxresdefault.jpg')`;
  innerTextElement.classList.replace(
    'video-placeholder-text-normal',
    'video-placeholder-text-youtube'
  );
};
const shouldBlockProvider = (formattedRE: string) => {
  const provider = configBlockJS._providersToBlock.find(({ re }: any) =>
    new RegExp(escapeRegex(re)).test(formattedRE)
  );
  const params = new URLSearchParams(window.location.search);
  const consentParams = params.get('consent');
  if (sessionStorage.getItem('aesirx-analytics-allow') || consentParams === 'yes') return false;
  return provider && true;
};

const blockScripts = (mutations: any) => {
  for (const { addedNodes } of mutations) {
    for (const node of addedNodes) {
      if (
        !node.src ||
        !node.nodeName ||
        !['script', 'iframe'].includes(node.nodeName.toLowerCase())
      )
        continue;
      try {
        const urlToParse = node.src.startsWith('//')
          ? `${window.location.protocol}${node.src}`
          : node.src;
        const { hostname, pathname } = new URL(urlToParse);
        const cleanedHostname = cleanHostName(`${hostname}${pathname}`);
        addProviderToList(node, cleanedHostname);
        if (!shouldBlockProvider(cleanedHostname)) continue;
        const uniqueID = randomString(8, false);
        if (node.nodeName.toLowerCase() === 'iframe') addPlaceholder(node, uniqueID);
        else {
          node.type = 'javascript/blocked';
          const scriptEventListener = function (event: Event) {
            event.preventDefault();
            node.removeEventListener('beforescriptexecute', scriptEventListener);
          };
          node.addEventListener('beforescriptexecute', scriptEventListener);
        }
        const position =
          document.head.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_CONTAINED_BY
            ? 'head'
            : 'body';
        node.remove();
        configBlockJS._backupNodes.push({
          position: position,
          node: node.cloneNode(),
          uniqueID,
        });
      } catch (error) {
        console.log('error', error);
      }
    }
  }
};
const _nodeListObserver = new MutationObserver(blockScripts);
_nodeListObserver.observe(document.documentElement, {
  childList: true,
  subtree: true,
});
