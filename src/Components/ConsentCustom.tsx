/* eslint-disable no-case-declarations */
import {
  agreeConsents,
  getConsents,
  getMember,
  getNonce,
  getSignature,
  getWalletNonce,
  loadConsentDefault,
  postDisabledBlockDomains,
  revokeConsents,
  verifySignature,
} from '../utils/consent';
import React, { Suspense, useContext, useEffect, useState } from 'react';
import { Button, Col, Form, Row } from 'react-bootstrap';
import useConsentStatus from '../Hooks/useConsentStatus';
import '../styles/style.scss';
import { TermsComponent } from './Terms';
import { ToastContainer, toast } from 'react-toastify';

import no from '../Assets/no.svg';
import bg from '../Assets/bg.png';
import privacy from '../Assets/privacy.svg';
import checkbox from '../Assets/checkbox.svg';
import checkbox_active from '../Assets/checkbox_active.svg';
import check_circle from '../Assets/check_circle.svg';
import wallet_consent from '../Assets/wallet_consent.png';
import wallet_shield_consent from '../Assets/wallet_shield_consent.png';

import ContentLoader from 'react-content-loader';
import { SSOButton } from 'aesirx-sso';
import {
  MAINNET,
  WithWalletConnector,
  useConnection,
  useConnect,
  ConnectorType,
  stringMessage,
  useGrpcClient,
  TESTNET,
} from '@concordium/react-components';
import { BROWSER_WALLET, WALLET_CONNECT } from '../Hooks/config';
import { OsTypes, isDesktop, isMobile, osName } from 'react-device-detect';
import { LoadingStatus } from './LoadingStatus';
import ConnectModal from './Connect';
import { ConsentContext } from '../utils/ConsentContextProvider';
import { useTranslation } from 'react-i18next';
import { useAccount, useSignMessage } from 'wagmi';
import SSOEthereumProvider from './Ethereum';
import { getWeb3ID, handleProof } from '../utils/Concordium';
import { trackEvent, AnalyticsContext, startTracker } from 'aesirx-analytics';
import ConsentHeader from './ConsentHeader';
import { CustomizeCategory } from './CustomizeCategory';
import { useWeb3Modal } from '@web3modal/react';
import { ConsentVerify } from './ConsentVerify';
import { isSixMonthsApart } from '../utils';
const ConsentComponentCustom = ({
  endpoint,
  aesirXEndpoint,
  networkEnv,
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
  consentVersion,
  languageSwitcher,
  modeSwitcher,
}: any) => {
  return (
    <>
      {!isOptInReplaceAnalytics ? (
        <>
          <WithWalletConnector network={networkEnv === 'testnet' ? TESTNET : MAINNET}>
            {(props: any) => (
              <ConsentComponentCustomWrapper
                {...props}
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
                consentVersion={consentVersion}
                languageSwitcher={languageSwitcher}
                modeSwitcher={modeSwitcher}
              />
            )}
          </WithWalletConnector>
        </>
      ) : (
        <></>
      )}
    </>
  );
};
const ConsentComponentCustomWrapper = (props: any) => {
  const [
    uuid,
    level,
    connection,
    account,
    show,
    setShow,
    web3ID,
    setWeb3ID,
    handleLevel,
    showRevoke,
    handleRevoke,
  ] = useConsentStatus(props?.endpoint, props?.layout, props);
  const { isOpen } = useWeb3Modal();

  return (
    <div className={`aesirxconsent ${isOpen ? 'web3modal-open' : ''}`}>
      <SSOEthereumProvider layout={props?.layout} level={level}>
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
          consentVersion={props?.consentVersion}
          languageSwitcher={props?.languageSwitcher}
          modeSwitcher={props?.modeSwitcher}
          uuid={uuid}
          level={level}
          connection={connection}
          account={account}
          show={show}
          setShow={setShow}
          web3ID={web3ID}
          setWeb3ID={setWeb3ID}
          handleLevel={handleLevel}
          showRevoke={showRevoke}
          handleRevoke={handleRevoke}
        />
      </SSOEthereumProvider>
    </div>
  );
};
const ConsentComponentCustomApp = (props: any) => {
  const {
    endpoint,
    aesirXEndpoint,
    loginApp,
    isLoggedApp,
    gtagId,
    gtmId,
    layout,
    customConsentText,
    customCookieText,
    customDetailText,
    customRejectText,
    disabledBlockDomains,
    consentVersion,
    languageSwitcher,
    modeSwitcher,
    activeConnectorType,
    activeConnector,
    activeConnectorError,
    connectedAccounts,
    genesisHashes,
    setActiveConnectorType,
    network,
    uuid,
    level,
    connection,
    account,
    show,
    setShow,
    web3ID,
    setWeb3ID,
    handleLevel,
    showRevoke,
    handleRevoke,
  } = props;
  const { setConnection } = useConnection(connectedAccounts, genesisHashes);

  const { isConnecting } = useConnect(activeConnector, setConnection);

  const handleOnConnect = async (connectorType: ConnectorType, network = 'concordium') => {
    if (network === 'concordium') {
      setActiveConnectorType(connectorType);
    }
    setLoading('done');
  };

  const [consents, setConsents] = useState<number[]>([1, 2]);
  const [revokeConsentOption, setRevokeConsentOption] = useState<string>('consent');
  const [loading, setLoading] = useState('done');
  const [loadingRevoke, setLoadingRevoke] = useState(false);
  const [loadingCheckAccount, setLoadingCheckAccount] = useState(false);
  const [showExpandConsent, setShowExpandConsent] = useState(true);
  const [showRejectedConsent, setShowRejectedConsent] = useState(false);
  const [showExpandRevoke, setShowExpandRevoke] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [showBackdrop, setShowBackdrop] = useState(true);
  const [consentTier4, setConsentTier4] = useState<any>({});
  const [toastLayout, setToastLayout] = useState<any>(
    level === 3 || level === 4 ? 'decentralized' : ''
  );
  const [upgradeLevel, setUpgradeLevel] = useState<any>(level === 4 || level === 3 ? level : 0);
  const [proof, setProof] = useState(false);

  const consentContext = useContext(ConsentContext);
  const analyticsContext = useContext(AnalyticsContext);
  const { t } = useTranslation();
  const gRPCClient = useGrpcClient(network);
  const revoke = sessionStorage.getItem('aesirx-analytics-revoke');
  // Metamask
  const { address, connector } =
    (layout === 'simple-consent-mode' || level === 1) &&
    (!revoke || revoke === '0' || revoke === '1')
      ? { address: '', connector: '' }
      : useAccount();
  const { signMessage }: any =
    (layout === 'simple-consent-mode' || level === 1) &&
    (!revoke || revoke === '0' || revoke === '1')
      ? { signMessage: {} }
      : useSignMessage({
          async onSuccess(data: any, variables: any) {
            const signature = window['aesirxBuffer']
              .from(
                typeof data === 'object' && data !== null ? JSON.stringify(data) : data,
                'utf-8'
              )
              .toString('base64');
            const jwt = sessionStorage.getItem('aesirx-analytics-jwt');
            if (variables?.message.indexOf('Revoke consent') > -1) {
              // Revoke Metamask
              const levelRevoke = sessionStorage.getItem('aesirx-analytics-revoke');
              const consentList = await getConsents(endpoint, uuid);
              consentList.forEach(async (consent: any) => {
                (!consent?.expiration ||
                  isSixMonthsApart(consent?.datetime, consent?.expiration)) &&
                  (await revokeConsents(
                    endpoint,
                    levelRevoke,
                    consent?.consent_uuid,
                    address,
                    signature,
                    web3ID,
                    jwt,
                    'metamask'
                  ));
              });
              setLoading('done');
              handleRevoke(false);
              setShowExpandConsent(false);
              setShow(true);
              setShowBackdrop(false);
              sessionStorage.removeItem('aesirx-analytics-allow');
            } else if (variables?.message.indexOf('Login with nonce') > -1) {
              const res = await verifySignature(aesirXEndpoint, 'metamask', address, data);
              sessionStorage.setItem('aesirx-analytics-jwt', res?.jwt);
              setLoadingCheckAccount(false);
              const nonce = await getNonce(
                endpoint,
                address,
                'Decentralized Consent + Shield of Privacy:{nonce} {domain} {time}',
                'metamask'
              );
              signMessage({ message: `${nonce}` });
            } else {
              setLoading('saving');
              // Consent Metamask
              await agreeConsents(
                endpoint,
                level,
                uuid,
                consents,
                address,
                signature,
                web3ID,
                jwt,
                'metamask',
                gtagId,
                gtmId,
                consentVersion
              );
              await postDisabledBlockDomains(endpoint);
              sessionStorage.setItem('aesirx-analytics-uuid', uuid);
              sessionStorage.setItem('aesirx-analytics-allow', '1');
              sessionStorage.setItem('aesirx-analytics-consent-type', 'metamask');

              setShow(false);
              setLoading('done');
              handleRevoke(true, level);
              setShowBackdrop(false);
            }
          },
          async onError(error: any) {
            setLoading('done');
            toast.error(error.message);
          },
        });

  const handleChange = async ({ target: { value } }: any) => {
    if (consents.indexOf(parseInt(value)) === -1) {
      setConsents([...consents, ...[parseInt(value)]]);
    } else {
      setConsents(consents.filter((consent) => consent !== parseInt(value)));
    }
  };

  const handleAgree = async () => {
    try {
      let flag = true;
      // Wallets
      let jwt = '';
      if (level > 2) {
        if (level === 4) {
          try {
            setLoadingCheckAccount(true);
            if (account && !proof && (window['ageCheck'] || window['countryCheck'])) {
              if (isMobile) {
                setLoading('verifying_sign_proof');
              }
              const response = await handleProof(account, null, setProof, connection);
              if (!response) {
                setLoadingCheckAccount(false);
                toast.error('Failed to verify age and country!');
                return false;
              }
            }
            const nonceLogin = await getWalletNonce(
              aesirXEndpoint,
              account ? 'concordium' : 'metamask',
              account ?? address
            );
            if (nonceLogin) {
              try {
                if (account) {
                  const signature = await connection.signMessage(
                    account,
                    stringMessage(`${nonceLogin}`)
                  );
                  const convertedSignature =
                    typeof signature === 'object' && signature !== null
                      ? signature
                      : JSON.parse(signature);

                  if (signature) {
                    const data = await verifySignature(
                      aesirXEndpoint,
                      'concordium',
                      account,
                      convertedSignature
                    );
                    sessionStorage.setItem('aesirx-analytics-jwt', data?.jwt);
                    jwt = data?.jwt;
                    loginApp && !isLoggedApp && loginApp(data);
                    setLoadingCheckAccount(false);
                  }
                } else {
                  signMessage({ message: `${nonceLogin}` });
                }
              } catch (error) {
                setLoadingCheckAccount(false);
                toast(error.message);
              }
            }
          } catch (error) {
            SSOClick('.loginSSO');
            setLoadingCheckAccount(false);
            return;
          }
        }
        if (account) {
          // Concordium
          setLoading('sign');
          const signature = await getSignature(
            endpoint,
            account,
            connection,
            level === 3
              ? 'Decentralized Consent:{nonce} {domain} {time}'
              : 'Decentralized Consent + Shield of Privacy:{nonce} {domain} {time}'
          );
          setLoading('saving');
          await agreeConsents(
            endpoint,
            level,
            uuid,
            consents,
            account,
            signature,
            web3ID,
            jwt,
            'concordium',
            gtagId,
            gtmId,
            consentVersion
          );
          await postDisabledBlockDomains(endpoint);
          sessionStorage.setItem('aesirx-analytics-consent-type', 'concordium');
          setToastLayout('');
        } else if (connector) {
          // Metamask
          if (level === 3) {
            const nonce = await getNonce(
              endpoint,
              address,
              level === 3
                ? 'Decentralized Consent:{nonce} {domain} {time}'
                : 'Decentralized Consent + Shield of Privacy:{nonce} {domain} {time}',
              'metamask'
            );
            signMessage({ message: `${nonce}` });
          }
        } else {
          setLoading('connect');
          flag = false;
        }
      } else {
        if (account && !proof && (window['ageCheck'] || window['countryCheck'])) {
          if (isMobile) {
            setLoading('verifying_sign_proof');
          }
          const response = await handleProof(account, null, setProof, connection);
          if (!response) {
            setLoading('done');
            toast.error('Failed to verify age and country!');
            return false;
          }
        }
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
              gtmId,
              consentVersion
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
              gtmId,
              consentVersion
            );
          }
        });
        await postDisabledBlockDomains(endpoint);
      }

      if (flag && (account || level < 3)) {
        sessionStorage.setItem('aesirx-analytics-uuid', uuid);
        sessionStorage.setItem('aesirx-analytics-allow', '1');

        setShow(false);
        setLoading('done');
        handleRevoke(true, level);
        setToastLayout('');
        setShowBackdrop(false);
        setShowExpandRevoke(false);
      }
    } catch (error) {
      console.log(error);
      handleNotAllow();

      setLoading('done');
      toast.error(error?.response?.data?.error ?? error.message);
    }
  };

  useEffect(() => {
    const init = async () => {
      if (Object.keys(consentTier4)?.length && (account || address)) {
        await consentTier4Init(consentTier4);
        setConsentTier4({});
      }
    };
    init();
  }, [consentTier4, account, address]);

  const consentTier4Init = async (response: any) => {
    let hasWeb3ID = true;
    if (response?.loginType === 'concordium') {
      const web3ID = await getWeb3ID(account, gRPCClient, network?.name);
      if (web3ID) {
        setWeb3ID(web3ID);
      } else {
        hasWeb3ID = false;
      }
    } else {
      const memberData = await getMember(aesirXEndpoint, response?.access_token);
      hasWeb3ID = memberData?.web3id ? true : false;
    }
    if (hasWeb3ID) {
      if (response?.loginType === 'concordium') {
        // Concordium
        sessionStorage.setItem('aesirx-analytics-consent-type', 'concordium');

        if (account && !proof && (window['ageCheck'] || window['countryCheck'])) {
          if (isMobile) {
            setLoading('verifying_sign_proof');
          }
          const response = await handleProof(account, null, setProof, connection);
          if (!response) {
            return false;
          }
        }
        const signature = await getSignature(
          endpoint,
          account,
          connection,
          'Decentralized Consent + Shield of Privacy:{nonce} {domain} {time}'
        );
        await agreeConsents(
          endpoint,
          level,
          uuid,
          consents,
          account,
          signature,
          null,
          response?.jwt,
          'concordium',
          gtagId,
          gtmId,
          consentVersion
        );
        await postDisabledBlockDomains(endpoint);
        setShow(false);
        handleRevoke(true, level);
        setToastLayout('');
        setLoading('done');
      } else if (response?.loginType === 'metamask') {
        // Metamask
        sessionStorage.setItem('aesirx-analytics-consent-type', 'metamask');
        const nonce = await getNonce(
          endpoint,
          address,
          'Decentralized Consent + Shield of Privacy:{nonce} {domain} {time}',
          'metamask'
        );
        signMessage({ message: `${nonce}` });
      }
    } else {
      handleLevel(3);
      toast("You haven't minted any WEB3 ID yet. Try to mint at https://dapp.shield.aesirx.io");
      setLoading('done');
    }
  };
  const onGetData = async (response: any) => {
    // on Login Tier 2 & 4
    try {
      setLoading('saving');
      const levelRevoke = sessionStorage.getItem('aesirx-analytics-revoke');
      sessionStorage.setItem('aesirx-analytics-jwt', response?.jwt);
      if (levelRevoke && levelRevoke !== '0') {
        // Revoke Consent
        sessionStorage.setItem(
          'aesirx-analytics-consent-type',
          response?.loginType === 'concordium' ? 'concordium' : 'metamask'
        );
        await handleRevokeBtn();
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        // Agree Consent
        if (level === 4) {
          if (response?.loginType === 'concordium' && isDesktop) {
            setActiveConnectorType(BROWSER_WALLET);
          }
          setConsentTier4(response);
        } else {
          await agreeConsents(
            endpoint,
            level,
            uuid,
            consents,
            null,
            null,
            null,
            response?.jwt,
            'concordium',
            gtagId,
            gtmId,
            consentVersion
          );
          await postDisabledBlockDomains(endpoint);
          setShow(false);
          handleRevoke(true, level);
          setToastLayout('');
          setLoading('done');
        }
      }
      loginApp && !isLoggedApp && loginApp(response);
    } catch (error) {
      console.log(error);
      setShow(false);
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
    const consentType = sessionStorage.getItem('aesirx-analytics-consent-type');
    const jwt = sessionStorage.getItem('aesirx-analytics-jwt');
    try {
      let flag = true;

      if (levelRevoke !== '1') {
        if (parseInt(levelRevoke) > 2) {
          if (!jwt && (parseInt(levelRevoke) === 2 || parseInt(levelRevoke) === 4)) {
            SSOClick('.revokeLogin');
            return;
          }
          if (account && consentType !== 'metamask') {
            setLoading('sign');
            const signature = await getSignature(
              endpoint,
              account,
              connection,
              'Revoke consent:{nonce} {domain} {time}'
            );
            setLoading('saving');
            const consentList = await getConsents(endpoint, uuid);
            consentList.forEach(async (consent: any) => {
              (!consent?.expiration || isSixMonthsApart(consent?.datetime, consent?.expiration)) &&
                (await revokeConsents(
                  endpoint,
                  levelRevoke,
                  consent?.consent_uuid,
                  account,
                  signature,
                  web3ID,
                  jwt
                ));
            });
            setLoading('done');
            handleRevoke(false);
          } else if (connector) {
            // Metamask
            setLoading('sign');
            setLoading('saving');
            const nonce = await getNonce(
              endpoint,
              address,
              'Revoke consent:{nonce} {domain} {time}',
              'metamask'
            );
            signMessage({ message: `${nonce}` });
          } else {
            setLoading('connect');
            flag = false;
          }
        } else {
          if (!jwt && parseInt(levelRevoke) === 2) {
            SSOClick('.revokeLogin');
            return;
          } else {
            setLoading('saving');
            const consentList = await getConsents(endpoint, uuid);
            consentList.forEach(async (consent: any) => {
              (!consent?.expiration || isSixMonthsApart(consent?.datetime, consent?.expiration)) &&
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

        if (flag && ((account && consentType !== 'metamask') || level < 3)) {
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

  const SSOClick = (selector: string) => {
    const element: HTMLElement = document.querySelector(selector) as HTMLElement;
    element.click();
  };

  useEffect(() => {
    if (activeConnectorError) {
      if (!toast.isActive('extension_not_detected')) {
        toast.error(activeConnectorError);
      }
    }
  }, [activeConnectorError]);

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
      showExpandRevoke &&
      isDesktop &&
      (sessionStorage.getItem('aesirx-analytics-revoke') === '3' ||
        sessionStorage.getItem('aesirx-analytics-revoke') === '4')
    ) {
      setActiveConnectorType(BROWSER_WALLET);
    }
  }, [showExpandRevoke]);

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

  const ConsentLevelUprade = ({ level, levelname, image, content, isUpgrade = false }: any) => {
    return (
      <div
        className={`consent_level mt-2 h-100 ${
          isUpgrade ? `cursor-pointer ${upgradeLevel === level ? 'active' : ''}` : ''
        } `}
        onClick={() => {
          setUpgradeLevel(level);
          handleLevel(level);
        }}
      >
        <div className="d-flex align-items-center justify-content-between flex-wrap">
          <img className="level-img mb-2" src={image} alt="level" />
          <div className="status-tier-text fw-semibold text-primary w-100 mb-1">{levelname}</div>
          <div className="fs-14">{content}</div>
        </div>
        <div className="checkbox_img">
          <img
            width={'23px'}
            height={'23px'}
            src={upgradeLevel === level ? checkbox_active : checkbox}
            alt="Checkbox icon"
          />
        </div>
      </div>
    );
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
                      if (
                        osName !== OsTypes?.IOS &&
                        isMobile &&
                        !connection &&
                        sessionStorage.getItem('aesirx-analytics-revoke') &&
                        parseInt(sessionStorage.getItem('aesirx-analytics-revoke')) > 2
                      ) {
                        setActiveConnectorType(WALLET_CONNECT);
                      }
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
                              {(sessionStorage.getItem('aesirx-analytics-revoke') === '4' ||
                                sessionStorage.getItem('aesirx-analytics-revoke') === '2') && (
                                <div>
                                  <Suspense fallback={<div>Loading...</div>}>
                                    <SSOButton
                                      className="d-none revokeLogin"
                                      text={'Login Revoke'}
                                      onGetData={onGetData}
                                    />
                                  </Suspense>
                                </div>
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
                    {toastLayout === 'decentralized' ? (
                      <>
                        <div className="bg-white rounded p-3 w-auto">
                          <>
                            <p className="mb-1 mb-lg-3">
                              {(window as any)?.aesirx_analytics_translate
                                ?.txt_select_your_preferred ?? t('txt_select_your_preferred')}
                            </p>
                            <Form>
                              <Row>
                                <Col lg={6} className="mb-2 mb-lg-0">
                                  <ConsentLevelUprade
                                    level={3}
                                    levelname={
                                      (window as any)?.aesirx_analytics_translate
                                        ?.txt_decentralized_wallet ?? t('txt_decentralized_wallet')
                                    }
                                    image={wallet_consent}
                                    content={
                                      <>
                                        <div className="d-flex align-items-start check-line">
                                          <span>
                                            <img
                                              src={check_circle}
                                              width={'14px'}
                                              height={'15px'}
                                              alt="Check Icon"
                                            />
                                          </span>
                                          <div className="ms-10px">
                                            {(window as any)?.aesirx_analytics_translate
                                              ?.txt_decentralized_wallet_will_be_loaded ??
                                              t('txt_decentralized_wallet_will_be_loaded')}
                                          </div>
                                        </div>
                                        <div className="d-flex align-items-start check-line">
                                          <span>
                                            <img
                                              src={check_circle}
                                              width={'14px'}
                                              height={'15px'}
                                              alt="Check Icon"
                                            />
                                          </span>
                                          <div className="ms-10px">
                                            {(window as any)?.aesirx_analytics_translate
                                              ?.txt_both_first_party_third_party ??
                                              t('txt_both_first_party_third_party')}
                                          </div>
                                        </div>
                                        <div className="d-flex align-items-start check-line">
                                          <span>
                                            <img
                                              src={check_circle}
                                              width={'14px'}
                                              height={'15px'}
                                              alt="Check Icon"
                                            />
                                          </span>
                                          <div className="ms-10px">
                                            {(window as any)?.aesirx_analytics_translate
                                              ?.txt_all_consented_data_will_be_collected ??
                                              t('txt_all_consented_data_will_be_collected')}
                                          </div>
                                        </div>
                                        <div className="d-flex align-items-start check-line">
                                          <span>
                                            <img
                                              src={check_circle}
                                              width={'14px'}
                                              height={'15px'}
                                              alt="Check Icon"
                                            />
                                          </span>
                                          <div className="ms-10px">
                                            {(window as any)?.aesirx_analytics_translate
                                              ?.txt_users_can_revoke ?? t('txt_users_can_revoke')}
                                          </div>
                                        </div>
                                      </>
                                    }
                                    isUpgrade={true}
                                  />
                                </Col>
                                <Col lg={6}>
                                  <ConsentLevelUprade
                                    level={4}
                                    levelname={
                                      (window as any)?.aesirx_analytics_translate
                                        ?.txt_decentralized_wallet_shield ??
                                      t('txt_decentralized_wallet_shield')
                                    }
                                    image={wallet_shield_consent}
                                    content={
                                      <>
                                        <div className="d-flex align-items-start check-line">
                                          <span>
                                            <img
                                              src={check_circle}
                                              width={'14px'}
                                              height={'15px'}
                                              alt="Check Icon"
                                            />
                                          </span>
                                          <div className="ms-10px">
                                            {(window as any)?.aesirx_analytics_translate
                                              ?.txt_decentralized_wallet_will_be_loaded ??
                                              t('txt_decentralized_wallet_will_be_loaded')}
                                          </div>
                                        </div>
                                        <div className="d-flex align-items-start check-line">
                                          <span>
                                            <img
                                              src={check_circle}
                                              width={'14px'}
                                              height={'15px'}
                                              alt="Check Icon"
                                            />
                                          </span>
                                          <div className="ms-10px">
                                            {(window as any)?.aesirx_analytics_translate
                                              ?.txt_both_first_party_third_party ??
                                              t('txt_both_first_party_third_party')}
                                          </div>
                                        </div>
                                        <div className="d-flex align-items-start check-line">
                                          <span>
                                            <img
                                              src={check_circle}
                                              width={'14px'}
                                              height={'15px'}
                                              alt="Check Icon"
                                            />
                                          </span>
                                          <div className="ms-10px">
                                            {(window as any)?.aesirx_analytics_translate
                                              ?.txt_all_consented_data_will_be_collected ??
                                              t('txt_all_consented_data_will_be_collected')}
                                          </div>
                                        </div>
                                        <div className="d-flex align-items-start check-line">
                                          <span>
                                            <img
                                              src={check_circle}
                                              width={'14px'}
                                              height={'15px'}
                                              alt="Check Icon"
                                            />
                                          </span>
                                          <div className="ms-10px">
                                            {(window as any)?.aesirx_analytics_translate
                                              ?.txt_users_can_revoke_dapp ??
                                              t('txt_users_can_revoke_dapp')}
                                          </div>
                                        </div>
                                        <div className="d-flex align-items-start check-line">
                                          <span>
                                            <img
                                              src={check_circle}
                                              width={'14px'}
                                              height={'15px'}
                                              alt="Check Icon"
                                            />
                                          </span>
                                          <div className="ms-10px">
                                            {(window as any)?.aesirx_analytics_translate
                                              ?.txt_users_can_earn ?? t('txt_users_can_earn')}
                                          </div>
                                        </div>
                                      </>
                                    }
                                    isUpgrade={true}
                                  />
                                </Col>
                              </Row>
                            </Form>
                            <div className="d-flex w-100 flex-wrap flex-lg-nowrap justify-content-between mt-4">
                              <Button
                                id="back-button"
                                variant="outline-success"
                                onClick={() => {
                                  setToastLayout('');
                                  handleLevel(1);
                                }}
                                className="d-flex align-items-center justify-content-center fs-14 w-100 w-lg-30 me-3 mb-2 mb-lg-0 rounded-pill py-2"
                              >
                                {(window as any)?.aesirx_analytics_translate?.txt_back ??
                                  t('txt_back')}
                              </Button>
                              <div
                                className={`ssoBtnWrapper d-flex align-items-center justify-content-center w-100 w-lg-30 me-3 bg-success rounded-pill ${
                                  level === 4 && !account && !address ? '' : 'd-none'
                                }`}
                              >
                                {layout !== 'simple-consent-mode' && (
                                  <Suspense
                                    fallback={
                                      <div className="d-flex h-100 justify-content-center align-items-center">
                                        Loading...
                                      </div>
                                    }
                                  >
                                    <SSOButton
                                      className="btn btn-success d-flex align-items-center justify-content-center loginSSO rounded-pill py-2 py-lg-3 w-100 fs-14 text-white"
                                      text={
                                        <>
                                          {(window as any)?.aesirx_analytics_translate
                                            ?.txt_continue ?? t('txt_continue')}
                                        </>
                                      }
                                      ssoState={'noscopes'}
                                      onGetData={onGetData}
                                      {...(level === 2 ? { noCreateAccount: true } : {})}
                                    />
                                  </Suspense>
                                )}
                              </div>
                              {level === 4 && !account && !address ? (
                                <></>
                              ) : (
                                <Button
                                  variant="success"
                                  disabled={
                                    loadingCheckAccount ||
                                    loading === 'sign' ||
                                    loading === 'saving'
                                  }
                                  onClick={() => {
                                    if (window['ageCheck'] || window['countryCheck']) {
                                      setToastLayout('verify-age-country');
                                    } else {
                                      handleAgree();
                                    }
                                  }}
                                  className="w-100 me-3 d-flex align-items-center justify-content-center fs-14 rounded-pill py-2 py-lg-3 w-100 w-lg-30 fs-14 text-white"
                                >
                                  {loadingCheckAccount ||
                                  loading === 'sign' ||
                                  loading === 'saving' ? (
                                    <span
                                      className="spinner-border spinner-border-sm me-1"
                                      role="status"
                                      aria-hidden="true"
                                    ></span>
                                  ) : (
                                    <></>
                                  )}
                                  {(window as any)?.aesirx_analytics_translate?.txt_continue ??
                                    t('txt_continue')}
                                </Button>
                              )}
                            </div>
                          </>
                        </div>
                      </>
                    ) : toastLayout === 'verify-age-country' ? (
                      <>
                        <ConsentVerify
                          setToastLayout={setToastLayout}
                          setLoading={setLoading}
                          setActiveConnectorType={setActiveConnectorType}
                          handleAgree={handleAgree}
                          account={account}
                          proof={proof}
                          level={level}
                          loading={loading}
                          activeConnectorError={activeConnectorError}
                        />
                      </>
                    ) : (
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
                              level={level}
                              loading={loading}
                              loadingCheckAccount={loadingCheckAccount}
                              consents={consents}
                              account={account}
                              address={address}
                              layout={layout}
                              handleChange={handleChange}
                              handleNotAllow={() => handleNotAllow(false)}
                              handleAgree={handleAgree}
                              setToastLayout={setToastLayout}
                              setShowCustomize={setShowCustomize}
                              t={t}
                            />
                          </TermsComponent>
                        )}
                      </>
                    )}
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
      {!account && loading === 'connect' && (
        <ConnectModal
          isConnecting={isConnecting}
          handleOnConnect={handleOnConnect}
          activeConnectorError={activeConnectorError}
          activeConnectorType={activeConnectorType}
          activeConnector={activeConnector}
        />
      )}
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
  level,
  loading,
  loadingCheckAccount,
  consents,
  account,
  address,
  layout,
  handleChange,
  handleNotAllow,
  handleAgree,
  setToastLayout,
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

            {level === 2 || (level === 4 && !account && !address) ? (
              <></>
            ) : (
              <>
                <Button
                  id="consent-button"
                  variant="outline-success"
                  disabled={loadingCheckAccount}
                  onClick={() => {
                    if (window['ageCheck'] || window['countryCheck']) {
                      setToastLayout('verify-age-country');
                    } else {
                      handleAgree();
                    }
                  }}
                  className="w-100 me-0 me-lg-3 mb-2 mb-lg-0 d-flex align-items-center justify-content-center fs-14 rounded-pill py-2 py-lg-3"
                >
                  {loadingCheckAccount ? (
                    <span
                      className="spinner-border spinner-border-sm me-1"
                      role="status"
                      aria-hidden="true"
                    ></span>
                  ) : (
                    <></>
                  )}
                  {(window as any)?.aesirx_analytics_translate?.txt_yes_i_consent ??
                    t('txt_yes_i_consent')}
                </Button>
              </>
            )}
            {layout === 'simple-consent-mode' ? (
              <></>
            ) : (
              <>
                <Button
                  id="decentralize-consent-button"
                  variant="outline-success"
                  onClick={() => {
                    setToastLayout('decentralized');
                  }}
                  className="d-flex align-items-center justify-content-center fs-14 w-100 px-3 mb-2 mb-lg-0 rounded-pill py-2 py-lg-3 text-nowrap"
                >
                  {(window as any)?.aesirx_analytics_translate?.txt_change_consent ??
                    t('txt_change_consent')}
                </Button>{' '}
              </>
            )}
          </>
        ) : (
          <></>
        )}
      </div>
    </Form>
  );
};

export default ConsentComponentCustom;
