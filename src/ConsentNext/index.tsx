import React, { ReactNode, useEffect, useState } from 'react';

import ConsentContextProvider from '../utils/ConsentContextProvider';
import dynamic from 'next/dynamic';
import { getConsentTemplate } from '../utils/consent';

const ConsentComponentCustom = dynamic(() => import('../Components/ConsentCustom'), { ssr: false });

interface ConsentNext {
  loginApp?: any;
  isLoggedApp?: boolean;
  isOptInReplaceAnalytics?: boolean;
  children?: ReactNode;
  isHideConsentModal?: boolean;
}

const ConsentNext = ({
  loginApp,
  isLoggedApp,
  isOptInReplaceAnalytics = false,
  children,
  isHideConsentModal,
}: ConsentNext) => {
  const [layout, setLayout] = useState(
    process.env.NEXT_PUBLIC_CONSENT_LAYOUT ?? 'simple-consent-mode'
  );
  const [gtagId, setGtagId] = useState(process.env.NEXT_PUBLIC_ANALYTICS_GTAG_ID);
  const [gtmId, setGtmId] = useState(process.env.NEXT_PUBLIC_ANALYTICS_GTM_ID);
  const [customConsentText, setCustomConsentText] = useState(
    process.env.NEXT_PUBLIC_ANALYTICS_CONSENT_TEXT
  );
  useEffect(() => {
    const init = async () => {
      const data: any = await getConsentTemplate(
        process.env.NEXT_PUBLIC_ENDPOINT_ANALYTICS_URL,
        window.location.host
      );
      setLayout(data?.data?.template ?? process.env.NEXT_PUBLIC_CONSENT_LAYOUT);
      setGtagId(data?.data?.gtag_id ?? process.env.NEXT_PUBLIC_ANALYTICS_GTAG_ID);
      setGtmId(data?.data?.gtm_id ?? process.env.NEXT_PUBLIC_ANALYTICS_GTM_ID);
      setCustomConsentText(
        data?.data?.consent_text ?? process.env.NEXT_PUBLIC_ANALYTICS_CONSENT_TEXT
      );
    };
    init();
  }, []);
  return (
    <>
      <ConsentContextProvider>
        {children}
        {process.env.NEXT_PUBLIC_DISABLE_ANALYTICS_CONSENT !== 'true' && !isHideConsentModal && (
          <>
            <ConsentComponentCustom
              endpoint={process.env.NEXT_PUBLIC_ENDPOINT_ANALYTICS_URL}
              networkEnv={process.env.NEXT_PUBLIC_CONCORDIUM_NETWORK}
              aesirXEndpoint={process.env.NEXT_PUBLIC_ENDPOINT_URL ?? 'https://api.aesirx.io'}
              loginApp={loginApp}
              isLoggedApp={isLoggedApp}
              gtagId={gtagId}
              gtmId={gtmId}
              customConsentText={customConsentText}
              layout={layout}
              isOptInReplaceAnalytics={isOptInReplaceAnalytics}
            />
          </>
        )}
      </ConsentContextProvider>
    </>
  );
};
export default ConsentNext;
