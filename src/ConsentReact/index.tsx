import React, { ReactNode, Suspense, useEffect, useState } from 'react';

import ConsentContextProvider from '../utils/ConsentContextProvider';
import { getConsentTemplate } from '../utils/consent';

const ConsentComponentCustom = React.lazy(() => import('../Components/ConsentCustom'));

interface ConsentReact {
  children?: ReactNode;
  isOptInReplaceAnalytics?: boolean;
  isHideConsentModal?: boolean;
}

const ConsentReact = ({
  isOptInReplaceAnalytics = false,
  children,
  isHideConsentModal,
}: ConsentReact) => {
  const [layout, setLayout] = useState(
    process.env.REACT_APP_CONSENT_LAYOUT ?? 'simple-consent-mode'
  );
  const [gtagId, setGtagId] = useState(process.env.REACT_APP_ANALYTICS_GTAG_ID);
  const [gtmId, setGtmId] = useState(process.env.REACT_APP_ANALYTICS_GTM_ID);
  const [customConsentText, setCustomConsentText] = useState(
    process.env.REACT_APP_ANALYTICS_CONSENT_TEXT
  );
  useEffect(() => {
    const init = async () => {
      const data: any = await getConsentTemplate(
        process.env.REACT_APP_ENDPOINT_ANALYTICS_URL,
        window.location.host
      );
      setLayout(data?.data?.template ?? process.env.REACT_APP_CONSENT_LAYOUT);
      setGtagId(data?.data?.gtag_id ?? process.env.REACT_APP_ANALYTICS_GTAG_ID);
      setGtmId(data?.data?.gtm_id ?? process.env.REACT_APP_ANALYTICS_GTM_ID);
      setCustomConsentText(
        data?.data?.consent_text ?? process.env.REACT_APP_ANALYTICS_CONSENT_TEXT
      );
    };
    init();
  }, []);
  return (
    <ConsentContextProvider>
      {children}
      {process.env.NEXT_PUBLIC_DISABLE_ANALYTICS_CONSENT !== 'true' && !isHideConsentModal && (
        <Suspense fallback={<></>}>
          <ConsentComponentCustom
            endpoint={process.env.REACT_APP_ENDPOINT_ANALYTICS_URL}
            networkEnv={process.env.REACT_APP_CONCORDIUM_NETWORK}
            aesirXEndpoint={process.env.REACT_APP_ENDPOINT_URL ?? 'https://api.aesirx.io'}
            gtagId={gtagId}
            gtmId={gtmId}
            customConsentText={customConsentText}
            layout={layout}
            isOptInReplaceAnalytics={isOptInReplaceAnalytics}
          />
        </Suspense>
      )}
    </ConsentContextProvider>
  );
};
export default ConsentReact;
