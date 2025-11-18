/* eslint-disable no-case-declarations */
import {
  agreeConsents,
  getConsents,
  loadGtagScript,
  loadGtmScript,
  postDisabledBlockDomains,
  revokeConsents,
} from '../utils/consent';
import React, { useContext, useEffect, useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import '../styles/style.scss';
import { TermsComponent } from './Terms';
import { ToastContainer, toast } from 'react-toastify';

import no from '../Assets/no.svg';
import bg from '../Assets/bg.png';
import privacy from '../Assets/privacy.svg';

import ContentLoader from 'react-content-loader';
import { LoadingStatus } from './LoadingStatus';
import { ConsentContext } from '../utils/ConsentContextProvider';
import { useTranslation } from 'react-i18next';
import { trackEvent, AnalyticsContext, startTracker } from 'aesirx-analytics';
import ConsentHeader from './ConsentHeader';
import { CustomizeCategory } from './CustomizeCategory';
import { useWeb3Modal } from '@web3modal/react';
import useConsentStatusSimple from '../Hooks/useConsentStatusSimple';
declare global {
  interface Window {
    dataLayer: any;
  }
}
declare const dataLayer: any[];

const ConsentCustomSimple = ({
  endpoint,
  aesirXEndpoint,
  loginApp,
  isLoggedApp,
  gtagId,
  gtmId,
  layout,
  isOptInReplaceAnalytics,
  customConsentText,
  customCookieText,
  customDetailText,
  customRejectText,
  disabledBlockDomains,
  languageSwitcher,
  modeSwitcher,
}: any) => {
  return (
    <>
      {!isOptInReplaceAnalytics ? (
        <>
          <ConsentComponentCustomWrapper
            endpoint={endpoint}
            aesirXEndpoint={aesirXEndpoint}
            loginApp={loginApp}
            isLoggedApp={isLoggedApp}
            gtagId={gtagId}
            gtmId={gtmId}
            layout={layout}
            customConsentText={customConsentText}
            customCookieText={customCookieText}
            customDetailText={customDetailText}
            customRejectText={customRejectText}
            disabledBlockDomains={disabledBlockDomains}
            languageSwitcher={languageSwitcher}
            modeSwitcher={modeSwitcher}
          />
        </>
      ) : (
        <></>
      )}
    </>
  );
};
const ConsentComponentCustomWrapper = (props: any) => {
  const [uuid, level, show, setShow, web3ID, setWeb3ID, handleLevel, showRevoke, handleRevoke] =
    useConsentStatusSimple(props?.endpoint, props?.layout, props);
  const { isOpen } = useWeb3Modal();

  return (
    <div className={`aesirxconsent ${isOpen ? 'web3modal-open' : ''}`}>
      <ConsentComponentCustomApp
        {...props}
        endpoint={props?.endpoint}
        aesirXEndpoint={props?.aesirXEndpoint}
        loginApp={props?.loginApp}
        isLoggedApp={props?.isLoggedApp}
        gtagId={props?.gtagId}
        gtmId={props?.gtmId}
        layout={props?.layout}
        customConsentText={props?.customConsentText}
        customCookieText={props?.customCookieText}
        customDetailText={props?.customDetailText}
        customRejectText={props?.customRejectText}
        disabledBlockDomains={props?.disabledBlockDomains}
        languageSwitcher={props?.languageSwitcher}
        modeSwitcher={props?.modeSwitcher}
        uuid={uuid}
        level={level}
        show={show}
        setShow={setShow}
        web3ID={web3ID}
        setWeb3ID={setWeb3ID}
        handleLevel={handleLevel}
        showRevoke={showRevoke}
        handleRevoke={handleRevoke}
      />
    </div>
  );
};
const ConsentComponentCustomApp = (props: any) => {
  const {
    endpoint,
    gtagId,
    gtmId,
    layout,
    customConsentText,
    customCookieText,
    customDetailText,
    customRejectText,
    disabledBlockDomains,
    languageSwitcher,
    modeSwitcher,
    uuid,
    level,
    show,
    setShow,
    handleLevel,
    showRevoke,
    handleRevoke,
  } = props;

  const [consents, setConsents] = useState<number[]>([1, 2]);
  const [revokeConsentOption, setRevokeConsentOption] = useState<string>('consent');
  const [loading, setLoading] = useState('done');
  const [loadingRevoke, setLoadingRevoke] = useState(false);
  const [showExpandConsent, setShowExpandConsent] = useState(true);
  const [showRejectedConsent, setShowRejectedConsent] = useState(false);
  const [showExpandRevoke, setShowExpandRevoke] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [showBackdrop, setShowBackdrop] = useState(true);

  const consentContext = useContext(ConsentContext);
  const analyticsContext = useContext(AnalyticsContext);
  const { t } = useTranslation();

  const handleChange = async ({ target: { value } }: any) => {
    if (consents.indexOf(parseInt(value)) === -1) {
      setConsents([...consents, ...[parseInt(value)]]);
    } else {
      setConsents(consents.filter((consent) => consent !== parseInt(value)));
    }
  };

  const handleAgree = async () => {
    try {
      if (level) {
        setLoading('saving');
        const consentList = await getConsents(endpoint, uuid);
        consents.forEach(async (consent) => {
          const existConsent = consentList.find((item: any) => item?.consent === consent);
          if (!existConsent) {
            await agreeConsents(
              endpoint,
              window['aesirxOptOutMode'] === 'true'
                ? 6
                : disabledBlockDomains?.length || window['disabledBlockJSDomains']?.length
                  ? 5
                  : 1,
              uuid,
              consent,
              null,
              null,
              null,
              null,
              null,
              gtagId,
              gtmId
            );
          } else if (
            !!existConsent?.consent_uuid &&
            existConsent?.expiration &&
            new Date(existConsent.expiration) < new Date()
          ) {
            await agreeConsents(
              endpoint,
              window['aesirxOptOutMode'] === 'true'
                ? 6
                : disabledBlockDomains?.length || window['disabledBlockJSDomains']?.length
                  ? 5
                  : 1,
              uuid,
              consent,
              null,
              null,
              null,
              null,
              null,
              gtagId,
              gtmId
            );
          }
        });
        await postDisabledBlockDomains(endpoint);
      }
      sessionStorage.setItem('aesirx-analytics-uuid', uuid);
      sessionStorage.setItem('aesirx-analytics-allow', '1');

      setShow(false);
      setLoading('done');
      handleRevoke(true, level);
      setShowBackdrop(false);
      setShowExpandRevoke(false);
    } catch (error) {
      console.log(error);
      handleNotAllow();

      setLoading('done');
      toast.error(error?.response?.data?.error ?? error.message);
    }
  };

  const handleNotAllow = async (isGPC = false) => {
    sessionStorage.setItem('aesirx-analytics-uuid', uuid);
    setShowExpandConsent(false);
    setShowBackdrop(false);
    const hostUrl = endpoint ? endpoint : '';
    const root = hostUrl ? hostUrl.replace(/\/$/, '') : '';
    await trackEvent(root, '', {
      event_name: isGPC ? 'Reject consent GPC' : 'Reject consent',
      event_type: 'reject-consent',
    });
    sessionStorage.setItem('aesirx-analytics-rejected', 'true');
    window.funcAfterReject && window.funcAfterReject();
  };
  const handleRevokeBtn = async () => {
    const levelRevoke = sessionStorage.getItem('aesirx-analytics-revoke');
    const jwt = sessionStorage.getItem('aesirx-analytics-jwt');
    try {
      if (levelRevoke !== '1') {
        if (parseInt(levelRevoke) > 2) {
          //
        } else {
          if (!jwt && parseInt(levelRevoke) === 2) {
            //
          } else {
            setLoading('saving');
            const consentList = await getConsents(endpoint, uuid);
            consentList.forEach(async (consent: any) => {
              !consent?.expiration &&
                (await revokeConsents(
                  endpoint,
                  levelRevoke,
                  consent?.consent_uuid,
                  null,
                  null,
                  null,
                  jwt
                ));
            });
            setLoading('done');
            handleRevoke(false);
          }
        }

        if (level < 3) {
          setShowExpandConsent(false);
          setShow(true);
          setShowBackdrop(false);
          sessionStorage.removeItem('aesirx-analytics-allow');
        }
      } else {
        await revokeConsents(
          endpoint,
          window['aesirxOptOutMode'] === 'true'
            ? '6'
            : disabledBlockDomains?.length || window['disabledBlockJSDomains']?.length
              ? '5'
              : levelRevoke,
          uuid,
          null,
          null,
          null,
          jwt
        );
        handleRevoke(false);
        setShowExpandConsent(false);
        setShow(true);
        setShowBackdrop(false);
        sessionStorage.removeItem('aesirx-analytics-allow');
      }
      const hostUrl = endpoint ? endpoint : '';
      const root = hostUrl ? hostUrl.replace(/\/$/, '') : '';
      trackEvent(root, '', {
        event_name: 'Revoke consent',
        event_type: 'revoke-consent',
      });
      if (window['aesirx1stparty']) {
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error) {
      console.log(error);
      setLoading('done');
      toast.error(error?.response?.data?.error ?? error.message);
    }
  };

  useEffect(() => {
    const isRejected = sessionStorage.getItem('aesirx-analytics-rejected') === 'true';
    if (isRejected) {
      setShowBackdrop(false);
      setShowExpandConsent(false);
    }
    if (
      sessionStorage.getItem('aesirx-analytics-revoke') &&
      sessionStorage.getItem('aesirx-analytics-revoke') !== '0'
    ) {
      window.funcAfterConsent && window.funcAfterConsent();
    }
    const init = async () => {
      const isAnalyticsEnabled = window['aesirx-analytics-enable'] === 'true';
      const disableGPC = window['disableGPCsupport'] === 'true';
      const hasGlobalPrivacyControl = (navigator as any).globalPrivacyControl;
      const shouldStartTracking =
        (!analyticsContext?.setUUID && !isAnalyticsEnabled) ||
        (analyticsContext?.setUUID && isAnalyticsEnabled);

      if (shouldStartTracking) {
        const response = await startTracker(endpoint, '', '', '', window['attributes']);

        if (response?.visitor_uuid) {
          window['visitor_uuid'] = response.visitor_uuid;

          if (!isAnalyticsEnabled) {
            consentContext?.setUUID?.(response.visitor_uuid);
          } else {
            analyticsContext?.setUUID?.(response.visitor_uuid);
            if (response.event_uuid) {
              analyticsContext?.setEventID?.(response.event_uuid);
              window['event_uuid'] = response.event_uuid;
            }
          }
        }
      }

      if (hasGlobalPrivacyControl && !disableGPC) {
        handleNotAllow(true);
      }
    };
    init();
  }, []);

  useEffect(() => {
    const isOptOutMode = window['aesirxOptOutMode'] === 'true';
    const isRejected = sessionStorage.getItem('aesirx-analytics-rejected') === 'true';
    const isConsented =
      showRevoke ||
      (sessionStorage.getItem('aesirx-analytics-revoke') &&
        sessionStorage.getItem('aesirx-analytics-revoke') !== '0');
    const uuid = sessionStorage.getItem('aesirx-analytics-uuid');
    if (uuid) {
      if (isOptOutMode && !isConsented && !isRejected) {
        handleAgree();
      }
    }
  }, [showRevoke, show, consentContext]);

  useEffect(() => {
    (gtagId || gtmId) && loadConsentDefault(gtagId, gtmId);
  }, [layout, gtagId, gtmId]);

  useEffect(() => {
    if (
      sessionStorage.getItem('aesirx-analytics-revoke') &&
      sessionStorage.getItem('aesirx-analytics-revoke') !== '0'
    ) {
      if (window.aesirxHoldBackJS?.length && typeof disabledBlockDomains !== 'undefined') {
        const arrayDisabledBlockDomains = disabledBlockDomains
          ? Array.isArray(disabledBlockDomains)
            ? disabledBlockDomains
            : JSON.parse(disabledBlockDomains)
          : [];
        const disabledCategories = arrayDisabledBlockDomains?.map((item: any) => item.name) || [];
        window.aesirxHoldBackJS.forEach((item: any) => {
          if (!disabledCategories.includes(item.name)) {
            if (typeof item.script === 'function') {
              item.script();
            }
          }
        });
      }
    }
  }, [disabledBlockDomains]);

  const loadConsentDefault = async (gtagId: any, gtmId: any) => {
    window.dataLayer = window.dataLayer || [];
    function gtag( // eslint-disable-next-line @typescript-eslint/no-unused-vars
      p0: string, // eslint-disable-next-line @typescript-eslint/no-unused-vars
      p1: any, // eslint-disable-next-line @typescript-eslint/no-unused-vars
      p2?: any
    ) {
      // eslint-disable-next-line prefer-rest-params
      dataLayer.push(arguments);
    }
    if (
      sessionStorage.getItem('consentGranted') === 'true' &&
      ((gtmId &&
        !document.querySelector(
          `script[src="https://www.googletagmanager.com/gtm.js?id=${gtmId}"]`
        )) ||
        (gtagId &&
          !document.querySelector(
            `script[src="https://www.googletagmanager.com/gtag/js?id=${gtagId}"]`
          )))
    ) {
      gtagId && (await loadGtagScript(gtagId));
      gtmId && (await loadGtmScript(gtmId));
      if (gtagId) {
        gtag('js', new Date());
        gtag('config', `${gtagId}`);
      }
      if (gtmId) {
        dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
      }
    }
    if (sessionStorage.getItem('consentGranted') === 'true') {
      gtag('consent', 'update', {
        ad_user_data: 'granted',
        ad_personalization: 'granted',
        ad_storage: 'granted',
        analytics_storage: 'granted',
      });
    }
  };
  const paymentRevoke = sessionStorage.getItem('aesirx-analytics-opt-payment');
  const optInRevokes = Object.keys(sessionStorage)
    .filter((key) => key.startsWith('aesirx-analytics-optin'))
    .map((key) => key);
  return (
    <div>
      <div className={`offcanvas-backdrop fade ${showBackdrop && show ? 'show' : 'd-none'}`} />
      <div
        tabIndex={-1}
        className={`toast-container position-fixed m-md-3 ${
          showExpandRevoke ? 'top-50 start-50 translate-middle' : 'bottom-0 end-0'
        }`}
      >
        <div
          className={`toast revoke-toast custom ${
            showRevoke ||
            (sessionStorage.getItem('aesirx-analytics-revoke') &&
              sessionStorage.getItem('aesirx-analytics-revoke') !== '0')
              ? 'show'
              : ''
          } ${showExpandRevoke ? '' : 'minimize'}`}
        >
          <LoadingStatus loading={loading} />
          <div className="toast-body p-0 shadow mx-1 mx-md-0 mb-2 mb-md-0">
            <div
              className={`revoke-wrapper minimize-shield-wrapper position-relative ${
                showExpandRevoke ? 'bg-white' : ''
              }`}
            >
              {!showExpandRevoke && (
                <>
                  <img
                    className="cover-img position-absolute h-100 w-100 object-fit-cover"
                    src={bg}
                    alt="Background Image"
                  />
                  <div
                    className="minimize-shield"
                    onClick={() => {
                      setShowExpandRevoke(true);
                    }}
                  >
                    <img src={privacy} alt="SoP Icon" />
                    {(window as any)?.aesirx_analytics_translate?.txt_shield_of_privacy ??
                      t('txt_shield_of_privacy')}
                  </div>
                </>
              )}

              {showExpandRevoke && (
                <>
                  {showCustomize ? (
                    <CustomizeCategory
                      languageSwitcher={languageSwitcher}
                      modeSwitcher={modeSwitcher}
                      setShowCustomize={setShowCustomize}
                      disabledBlockDomains={disabledBlockDomains}
                      handleRevokeBtn={handleRevokeBtn}
                      showRevoke={showRevoke}
                      endpoint={endpoint}
                    />
                  ) : (
                    <>
                      <ConsentHeader
                        languageSwitcher={languageSwitcher}
                        modeSwitcher={modeSwitcher}
                        layout={layout}
                      />
                      <div
                        className="minimize-revoke"
                        onClick={() => {
                          setShowExpandRevoke(false);
                        }}
                      >
                        <img src={no} alt="No Icon" />
                      </div>
                      <div className="p-3 bg-white">
                        {window['aesirxOptOutMode'] === 'true'
                          ? ((window as any)?.aesirx_analytics_translate?.txt_tracking_default ??
                            t('txt_tracking_default'))
                          : paymentRevoke
                            ? ((window as any)?.aesirx_analytics_translate
                                ?.txt_you_can_revoke_on_the_site ??
                              t('txt_you_can_revoke_on_the_site'))
                            : ((window as any)?.aesirx_analytics_translate?.txt_you_can_revoke ??
                              t('txt_you_can_revoke'))}
                      </div>
                      <Form
                        className={`mb-0 w-100 bg-white px-3 ${window['aesirxOptOutMode'] === 'true' ? 'd-none' : ''}`}
                      >
                        <Form.Check
                          id={`option-revoke-consent`}
                          checked={revokeConsentOption === 'consent'}
                          type="checkbox"
                          label={
                            (window as any)?.aesirx_analytics_translate
                              ?.txt_revoke_consent_for_the_site ??
                            t('txt_revoke_consent_for_the_site')
                          }
                          value={'consent'}
                          onChange={({ target: { value } }) => {
                            setRevokeConsentOption(value);
                          }}
                        />
                        {optInRevokes?.map((item, key) => {
                          return (
                            <Form.Check
                              key={key}
                              id={`option-revoke-${item}`}
                              checked={revokeConsentOption === item}
                              type="checkbox"
                              label={
                                item === 'aesirx-analytics-optin-default'
                                  ? ((window as any)?.aesirx_analytics_translate
                                      ?.txt_revoke_opt_in ?? t('txt_revoke_opt_in'))
                                  : item === 'aesirx-analytics-optin-payment'
                                    ? ((window as any)?.aesirx_analytics_translate
                                        ?.txt_revoke_opt_in_payment ??
                                      t('txt_revoke_opt_in_payment'))
                                    : item === 'aesirx-analytics-optin-advisor'
                                      ? ((window as any)?.aesirx_analytics_translate
                                          ?.txt_revoke_opt_in_advisor ??
                                        t('txt_revoke_opt_in_advisor'))
                                      : ((window as any)?.aesirx_analytics_translate
                                          ?.txt_revoke_opt_in ??
                                        t('txt_revoke_opt_in') +
                                          ' ' +
                                          item?.replace('aesirx-analytics-optin-', ''))
                              }
                              value={item}
                              onChange={({ target: { value } }) => {
                                setRevokeConsentOption(value);
                              }}
                            />
                          );
                        })}
                      </Form>

                      <div className="rounded-bottom position-relative overflow-hidden bg-white">
                        <div className="position-relative p-3">
                          <div className="d-flex align-items-center flex-wrap">
                            <div className="d-flex align-items-center w-100 justify-content-end flex-wrap">
                              {window['aesirxOptOutMode'] === 'true' ? (
                                <Button
                                  variant="outline-success"
                                  onClick={() => {
                                    setShowCustomize(true);
                                  }}
                                  className="d-flex align-items-center justify-content-center fs-14 w-100 w-lg-35 me-0 me-lg-3 mb-2 mb-lg-0 rounded-pill py-2 py-lg-3"
                                >
                                  {(window as any)?.aesirx_analytics_translate?.txt_customize ??
                                    t('txt_customize')}
                                </Button>
                              ) : (
                                <a
                                  className="manage-consent fs-14 btn btn-outline-success rounded-pill py-2 py-lg-3 d-flex align-items-center justify-content-center w-100 w-lg-35"
                                  href="https://dapp.shield.aesirx.io/revoke-consent"
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {(window as any)?.aesirx_analytics_translate
                                    ?.txt_manage_consent ?? t('txt_manage_consent')}
                                </a>
                              )}
                              {loading === 'done' ? (
                                <Button
                                  variant="outline-success"
                                  onClick={async () => {
                                    setLoadingRevoke(true);
                                    if (window['aesirxOptOutMode'] === 'true') {
                                      sessionStorage.setItem('aesirx-analytics-rejected', 'true');
                                    }
                                    if (revokeConsentOption === 'consent') {
                                      await handleRevokeBtn();
                                      const levelRevoke =
                                        sessionStorage.getItem('aesirx-analytics-revoke') &&
                                        parseInt(sessionStorage.getItem('aesirx-analytics-revoke'));
                                      if (levelRevoke <= 1 && window['aesirx1stparty']) {
                                        setTimeout(() => {
                                          window.location.reload();
                                        }, 1000);
                                      }
                                    } else {
                                      sessionStorage.removeItem(revokeConsentOption);
                                      setShowExpandRevoke(false);
                                      setRevokeConsentOption('consent');
                                      setTimeout(() => {
                                        window.location.reload();
                                      }, 1000);
                                    }
                                    setLoadingRevoke(false);
                                  }}
                                  className={
                                    'd-flex align-items-center justify-content-center w-100 w-lg-35 revoke-btn fs-14 rounded-pill py-2 py-lg-3'
                                  }
                                  disabled={loadingRevoke}
                                >
                                  {loadingRevoke ? (
                                    <span
                                      className="spinner-border spinner-border-sm me-1"
                                      role="status"
                                      aria-hidden="true"
                                    ></span>
                                  ) : (
                                    <></>
                                  )}
                                  {window['aesirxOptOutMode'] === 'true'
                                    ? ((window as any)?.aesirx_analytics_translate
                                        ?.txt_opt_out_tracking ?? t('txt_opt_out_tracking'))
                                    : ((window as any)?.aesirx_analytics_translate
                                        ?.txt_revoke_consent ?? t('txt_revoke_consent'))}
                                </Button>
                              ) : (
                                <></>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <div
        tabIndex={-1}
        id={'consent-modal'}
        className={`toast-container position-fixed m-md-3 ${
          showExpandConsent ? 'top-50 start-50 translate-middle' : 'bottom-0 end-0'
        }`}
      >
        <div
          className={`toast custom ${show ? 'show' : ''} ${showExpandConsent ? '' : 'minimize'}`}
        >
          <LoadingStatus loading={loading} />
          <div className="toast-body p-0 shadow mx-1 mx-md-0 mb-2 mb-md-0">
            {!showExpandConsent ? (
              <>
                <div className="minimize-shield-wrapper position-relative">
                  <img
                    className="cover-img position-absolute h-100 w-100 object-fit-cover"
                    src={bg}
                    alt="Background Image"
                  />
                  <div
                    className="minimize-shield"
                    ref={consentContext?.ref}
                    onClick={() => {
                      setShowExpandConsent(true);
                      const rejectConsent = sessionStorage.getItem('aesirx-analytics-rejected');
                      rejectConsent && setShowRejectedConsent(true);
                      if (window['aesirxOptOutMode'] !== 'true') {
                        sessionStorage.removeItem('aesirx-analytics-rejected');
                      }
                    }}
                  >
                    <img src={privacy} alt="SoP Icon" />
                    {(window as any)?.aesirx_analytics_translate?.txt_shield_of_privacy ??
                      t('txt_shield_of_privacy')}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white">
                {level ? (
                  <>
                    <>
                      {showCustomize ? (
                        <CustomizeCategory
                          languageSwitcher={languageSwitcher}
                          modeSwitcher={modeSwitcher}
                          setShowCustomize={setShowCustomize}
                          disabledBlockDomains={disabledBlockDomains}
                        />
                      ) : (
                        <TermsComponent
                          level={level}
                          handleLevel={handleLevel}
                          isCustom={true}
                          layout={layout}
                          customConsentText={customConsentText}
                          customCookieText={customCookieText}
                          customDetailText={customDetailText}
                          customRejectText={customRejectText}
                          isRejectedLayout={showRejectedConsent}
                          languageSwitcher={languageSwitcher}
                          modeSwitcher={modeSwitcher}
                        >
                          <ConsentAction
                            loading={loading}
                            loadingCheckAccount={false}
                            consents={consents}
                            layout={layout}
                            handleChange={handleChange}
                            handleNotAllow={() => handleNotAllow(false)}
                            handleAgree={handleAgree}
                            setToastLayout={null}
                            setShowCustomize={setShowCustomize}
                            t={t}
                          />
                        </TermsComponent>
                      )}
                    </>
                  </>
                ) : (
                  <div className="p-4">
                    <ContentLoader
                      speed={2}
                      width={340}
                      height={84}
                      viewBox="0 0 340 84"
                      backgroundColor="#f3f3f3"
                      foregroundColor="#ecebeb"
                    >
                      <rect x="0" y="0" rx="3" ry="3" width="67" height="11" />
                      <rect x="76" y="0" rx="3" ry="3" width="140" height="11" />
                      <rect x="127" y="48" rx="3" ry="3" width="53" height="11" />
                      <rect x="187" y="48" rx="3" ry="3" width="72" height="11" />
                      <rect x="18" y="48" rx="3" ry="3" width="100" height="11" />
                      <rect x="0" y="71" rx="3" ry="3" width="37" height="11" />
                      <rect x="18" y="23" rx="3" ry="3" width="140" height="11" />
                      <rect x="166" y="23" rx="3" ry="3" width="173" height="11" />
                    </ContentLoader>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
};

const ConsentAction = ({
  loading,
  consents,
  handleChange,
  handleNotAllow,
  handleAgree,
  setShowCustomize,
  t,
}: any) => {
  const blockJSDomains = [
    ...(Array.isArray(window?.aesirxBlockJSDomains) ? window.aesirxBlockJSDomains : []),
    ...(Array.isArray(window?.aesirxHoldBackJS)
      ? window.aesirxHoldBackJS.map((item: any) => ({
          domain: null,
          blocking_permanent: 'off',
          ...item,
        }))
      : []),
  ];
  const isCategory = blockJSDomains?.some((item: any) =>
    Object.prototype.hasOwnProperty.call(item, 'category')
  );
  return (
    <Form className="mb-0 w-100">
      <Form.Check
        checked={consents.includes(1)}
        type="switch"
        label="Personal data share consent."
        value={1}
        onChange={handleChange}
        className="d-none"
      />
      <Form.Check
        checked={consents.includes(2)}
        type="switch"
        label="Personal data cross site share consent."
        value={2}
        onChange={handleChange}
        className="d-none"
      />
      <div className="d-flex w-100 flex-wrap flex-lg-nowrap">
        {loading === 'done' ? (
          <>
            <Button
              id="reject-button"
              variant="outline-success"
              onClick={() => {
                handleNotAllow(false);
              }}
              className="d-flex align-items-center justify-content-center fs-14 w-100 me-0 me-lg-3 mb-2 mb-lg-0 rounded-pill py-2 py-lg-3"
            >
              {(window as any)?.aesirx_analytics_translate?.txt_reject_consent ??
                t('txt_reject_consent')}
            </Button>
            {isCategory && (
              <Button
                id="customize-button"
                variant="outline-success"
                onClick={() => {
                  setShowCustomize(true);
                }}
                className="d-flex align-items-center justify-content-center fs-14 w-100 me-0 me-lg-3 mb-2 mb-lg-0 rounded-pill py-2 py-lg-3"
              >
                {(window as any)?.aesirx_analytics_translate?.txt_customize ?? t('txt_customize')}
              </Button>
            )}

            <Button
              id="consent-button"
              variant="outline-success"
              onClick={() => {
                handleAgree();
              }}
              className="w-100 me-0 me-lg-3 mb-2 mb-lg-0 d-flex align-items-center justify-content-center fs-14 rounded-pill py-2 py-lg-3"
            >
              {(window as any)?.aesirx_analytics_translate?.txt_yes_i_consent ??
                t('txt_yes_i_consent')}
            </Button>
          </>
        ) : (
          <></>
        )}
      </div>
    </Form>
  );
};

export default ConsentCustomSimple;
