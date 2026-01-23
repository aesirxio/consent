import { useCallback, useContext, useEffect, useState } from 'react';
import { ConsentContext } from '../utils/ConsentContextProvider';
import { AnalyticsContext } from 'aesirx-analytics';
import { getConsents, loadConsentDefault } from '../utils/consent';
import { unBlockScripts } from '../utils';

const useConsentStatusSimple = (endpoint?: string, layout?: string, props?: any) => {
  const [show, setShow] = useState(false);
  const [showRevoke, setShowRevoke] = useState(false);
  const [level, setLevel] = useState<any>(1);
  const [web3ID, setWeb3ID] = useState<boolean>();

  const consentContext = useContext(ConsentContext);
  const analyticsContext = useContext(AnalyticsContext);
  const isUsingAnalytics = analyticsContext?.setUUID ? true : false;
  const params = new URLSearchParams(window.location.search);
  const isConsentParams = params.get('consent') === 'yes';
  const { gtagId, gtmId } = props;

  const observerModal = () => {
    const callback = (mutationList: any) => {
      for (const mutation of mutationList) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          if (!mutation.target.classList?.contains('minimize')) {
            const firstElement = mutation.target.querySelector('a, button, input') as HTMLElement;
            if (firstElement) {
              firstElement.focus();
            }
          }
        }
      }
    };
    const targetNode = document.querySelector('#consent-modal > div');
    if (targetNode) {
      const observer = new MutationObserver(callback);

      observer.observe(targetNode, { attributes: true });
    }
  };

  useEffect(() => {
    const allow = sessionStorage.getItem('aesirx-analytics-allow');
    const currentUuid = sessionStorage.getItem('aesirx-analytics-uuid');
    observerModal();
    if (
      (isUsingAnalytics &&
        analyticsContext.visitor_uuid &&
        (allow === null || analyticsContext.visitor_uuid !== currentUuid)) ||
      (!isUsingAnalytics &&
        consentContext.visitor_uuid &&
        (allow === null || consentContext.visitor_uuid !== currentUuid))
    ) {
      (async () => {
        const consentList = await getConsents(
          endpoint,
          isUsingAnalytics ? analyticsContext.visitor_uuid : consentContext.visitor_uuid
        );
        sessionStorage.setItem(
          'aesirx-analytics-uuid',
          isUsingAnalytics ? analyticsContext.visitor_uuid : consentContext.visitor_uuid
        );
        if (consentList?.length === 0) {
          if (isConsentParams) {
            setShow(false);
            handleRevoke(true, '0', true);
          } else {
            setShow(true);
          }
          sessionStorage.removeItem('aesirx-analytics-allow');
        } else {
          if (gtagId || gtmId) {
            sessionStorage.setItem('consentGranted', 'true');
            loadConsentDefault(gtagId, gtmId);
          }
          if (level > 1) {
            sessionStorage.setItem('aesirx-analytics-allow', '1');
            handleRevoke(true, '1');
          }

          consentList.forEach((consent: any) => {
            if (consent.expiration && new Date(consent.expiration) < new Date()) {
              if (isConsentParams) {
                setShow(false);
                handleRevoke(true, '0');
              } else {
                setShow(true);
              }
              sessionStorage.removeItem('aesirx-analytics-allow');
              return;
            } else {
              setShow(false);
              sessionStorage.setItem(
                'aesirx-analytics-uuid',
                isUsingAnalytics ? analyticsContext.visitor_uuid : consentContext.visitor_uuid
              );
              sessionStorage.setItem('aesirx-analytics-allow', '1');
              if (consent) {
                const revokeTier = !consent?.consent_uuid
                  ? ''
                  : consent?.web3id && consent?.address
                    ? '4'
                    : consent?.address && !consent?.web3id
                      ? '3'
                      : '2';
                if (revokeTier) {
                  handleRevoke(true, revokeTier);
                } else {
                  handleRevoke(true, '1');
                }
              }
            }
          });
        }
      })();
    }
  }, [analyticsContext.visitor_uuid, consentContext.visitor_uuid]);

  const handleLevel = useCallback(
    async (_level: number) => {
      if (layout !== 'simple-consent-mode') {
        setLevel(_level);
      } else {
        setLevel(1);
      }
    },
    [level, layout]
  );

  const handleRevoke = (status: boolean, level: string, isConsentParams = false) => {
    sessionStorage.setItem('aesirx-analytics-revoke', level ? level : '0');
    setShowRevoke(status);
    if ((level && level !== '0') || isConsentParams) {
      window.funcAfterConsent && window.funcAfterConsent();
      window.configBlockJS && unBlockScripts((props as any)?.disabledBlockDomains);
      if (
        window['aesirx_analytics_degistered_scripts'] ||
        window['aesirx_analytics_deregistered_scripts_head'] ||
        window['aesirx_analytics_deregistered_scripts_footer']
      ) {
        const blockJSList = Object.assign(
          window['aesirx_analytics_degistered_scripts'],
          window['aesirx_analytics_deregistered_scripts_head'],
          window['aesirx_analytics_deregistered_scripts_footer']
        );
        Object.keys(blockJSList).forEach((key) => {
          const isPermanentBlocked = window?.aesirxBlockJSDomains?.some(
            (item: any) =>
              blockJSList[key].src.includes(item.domain) && item.blocking_permanent === 'on'
          );
          if (isPermanentBlocked) return;
          const scriptNode = document.createElement('script');
          scriptNode.src =
            blockJSList[key].src + (blockJSList[key].ver ? `?ver=${blockJSList[key].ver}` : '');
          scriptNode.type = 'text/javascript';
          document.body.appendChild(scriptNode);
        });
      }
      if (window.aesirxHoldBackJS?.length) {
        const disabledCategories =
          window.disabledBlockJSDomains?.map((item: any) => item.name) || [];
        window.aesirxHoldBackJS.forEach((item: any) => {
          if (!disabledCategories.includes(item.name)) {
            if (typeof item.script === 'function') {
              item.script();
            }
          }
        });
      }
    }
  };

  return [
    isUsingAnalytics ? analyticsContext.visitor_uuid : consentContext.visitor_uuid,
    level,
    show,
    setShow,
    web3ID,
    setWeb3ID,
    handleLevel,
    showRevoke,
    handleRevoke,
  ];
};

export default useConsentStatusSimple;
