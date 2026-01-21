import { useCallback, useContext, useEffect, useState } from 'react';
import { ConsentContext } from '../utils/ConsentContextProvider';
import { AnalyticsContext } from 'aesirx-analytics';
import { getConsents } from '../utils/consent';
import { toast } from 'react-toastify';
import {
  MAINNET,
  useConnection,
  useConnect,
  WalletConnectionProps,
  useGrpcClient,
  TESTNET,
} from '@concordium/react-components';
import { BROWSER_WALLET } from './config';
import { isDesktop } from 'react-device-detect';
import { BlockHash } from '@concordium/web-sdk';
import { unBlockScripts } from '../utils';

const useConsentStatus = (endpoint?: string, layout?: string, props?: WalletConnectionProps) => {
  const [show, setShow] = useState(false);
  const [showRevoke, setShowRevoke] = useState(false);
  const [level, setLevel] = useState<any>(1);
  const [web3ID, setWeb3ID] = useState<boolean>();

  const consentContext = useContext(ConsentContext);
  const analyticsContext = useContext(AnalyticsContext);
  const isUsingAnalytics = analyticsContext?.setUUID ? true : false;
  const { activeConnector, network, connectedAccounts, genesisHashes, setActiveConnectorType } =
    props;

  const params = new URLSearchParams(window.location.search);
  const isConsentParams = params.get('consent') === 'yes';

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
          if (level > 1) {
            sessionStorage.setItem('aesirx-analytics-allow', '1');
            handleRevoke(true, '1');
          }

          consentList.forEach((consent: any) => {
            if (consent.expiration && new Date(consent.expiration) < new Date()) {
              if (isConsentParams) {
                setShow(false);
                handleRevoke(true, '0', true);
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

  const { connection, setConnection, account } = useConnection(connectedAccounts, genesisHashes);

  const { connect, connectError } = useConnect(activeConnector, setConnection);

  const [, setRpcGenesisHash] = useState();
  const [, setRpcError] = useState('');
  const rpc = useGrpcClient(network);

  useEffect(() => {
    if (rpc && layout !== 'simple-consent-mode' && level !== 1) {
      setRpcGenesisHash(undefined);
      rpc
        .getConsensusStatus()
        .then((status: any) => {
          return status.genesisBlock;
        })
        .then((hash: any) => {
          let r = false;
          switch (network?.name) {
            case 'testnet':
              r = BlockHash.toHexString(hash) === TESTNET.genesisHash;
              break;

            default:
              r = BlockHash.toHexString(hash) === MAINNET.genesisHash;
          }
          if (!r) {
            throw new Error(`Please change the network to ${network} in Wallet`);
          }

          setRpcGenesisHash(hash);
          setRpcError('');
        })
        .catch((err: any) => {
          setRpcGenesisHash(undefined);
          toast(err.message);
          setRpcError(err.message);
        });
    }
  }, [rpc, level]);

  useEffect(() => {
    if (activeConnector) {
      connect();
    }
  }, [activeConnector]);

  useEffect(() => {
    if (
      connectError &&
      connectError !==
        'A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received'
    ) {
      toast.error(connectError);
    }
  }, [connectError]);

  const handleLevel = useCallback(
    async (_level: number) => {
      if (layout !== 'simple-consent-mode') {
        setLevel(_level);
        if (_level > 3 && isDesktop && !connection && window['concordium']) {
          setActiveConnectorType(BROWSER_WALLET);
        }
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
    connection,
    account,
    show,
    setShow,
    web3ID,
    setWeb3ID,
    handleLevel,
    showRevoke,
    handleRevoke,
  ];
};

export default useConsentStatus;
