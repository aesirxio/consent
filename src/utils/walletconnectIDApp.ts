import SignClient from '@walletconnect/sign-client';
import { CONCORDIUM_WALLET_CONNECT_PROJECT_ID } from '@concordium/react-components';

const CONCORDIUM_CHAINS = {
  testnet: 'ccd:4221332d34e1694168c2a0c0b3fd0f27',
  mainnet: 'ccd:9dd9ca4d19e9393877d2c44b70f89acb',
} as const;

const CONCORDIUM_DEEPLINK_SCHEME = 'concordiumidapp';

type ConcordiumNetwork = 'testnet' | 'mainnet';

const getNetwork = (): ConcordiumNetwork => {
  const n = (window as any)?.aesirxConcordiumNetwork;
  return n === 'testnet' ? 'testnet' : 'mainnet';
};

const getChainId = (): string => CONCORDIUM_CHAINS[getNetwork()];

const getProjectId = (): string =>
  (window as any)?.aesirxWalletConnectProjectId ?? CONCORDIUM_WALLET_CONNECT_PROJECT_ID;

let clientInstance: SignClient | null = null;
let initPromise: Promise<SignClient> | null = null;

export const resetSignClient = (): void => {
  clientInstance = null;
  initPromise = null;
};

export const getSignClient = async (): Promise<SignClient> => {
  if (clientInstance) return clientInstance;
  if (initPromise) return initPromise;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'aesirx-consent';

  initPromise = SignClient.init({
    projectId: getProjectId(),
    metadata: {
      name: hostname,
      description: 'AesirX Consent age/country verification',
      url: origin,
      icons: [`${origin}/favicon.ico`],
    },
  })
    .then(async (client) => {
      const sessions = client.session.getAll();
      for (const session of sessions) {
        try {
          await client.disconnect({
            topic: session.topic,
            reason: { code: 6000, message: 'Cleanup stale session' },
          });
        } catch {
          // ignore
        }
      }
      const pairings = client.core.pairing.getPairings();
      for (const pairing of pairings) {
        try {
          await client.core.pairing.disconnect({ topic: pairing.topic });
        } catch {
          // ignore
        }
      }
      clientInstance = client;
      return client;
    })
    .catch((err) => {
      initPromise = null;
      throw err;
    });

  return initPromise;
};

export const createPairing = async (client: SignClient) => {
  const { uri, approval } = await client.connect({
    optionalNamespaces: {
      ccd: {
        methods: ['request_verifiable_presentation_v1'],
        chains: [getChainId()],
        events: [],
      },
    },
    pairingTopic: undefined,
  });
  return { uri, approval };
};

const waitForRelayConnection = async (client: SignClient, maxWaitMs = 5000): Promise<boolean> => {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitMs) {
    try {
      if (client.core.relayer.connected) return true;
    } catch {
      // ignore
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return false;
};

export const sendVPRToIDApp = async (
  client: SignClient,
  sessionTopic: string,
  vpr: unknown
): Promise<unknown> => {
  if (isIOS()) {
    await waitForRelayConnection(client, 3000);
  }
  return client.request({
    topic: sessionTopic,
    chainId: getChainId(),
    request: {
      method: 'request_verifiable_presentation_v1',
      params: vpr as object,
    },
  });
};

export const isIOS = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
};

export const isAndroid = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
};

export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
};

export const buildDeepLinkURI = (wcUri: string): string =>
  `${CONCORDIUM_DEEPLINK_SCHEME}://wc?uri=${encodeURIComponent(wcUri)}`;
