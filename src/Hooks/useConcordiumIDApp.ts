import { useState, useCallback, useRef, useEffect } from 'react';
import type SignClient from '@walletconnect/sign-client';
import {
  getSignClient,
  createPairing,
  sendVPRToIDApp,
  buildDeepLinkURI,
  isMobileDevice,
  isIOS as checkIsIOS,
  resetSignClient,
} from '../utils/walletconnectIDApp';

export type IDAppFlowState =
  | 'idle'
  | 'connecting'
  | 'awaiting_proof'
  | 'verifying'
  | 'verified'
  | 'failed';

interface UseConcordiumIDAppReturn {
  state: IDAppFlowState;
  wcUri: string | null;
  deepLinkUri: string | null;
  isMobile: boolean;
  isIOS: boolean;
  error: string | null;
  startVerification: () => Promise<void>;
  reset: () => void;
  resendVPR: () => Promise<void>;
}

const VERIFIER_URL = 'https://verify.aesirx.io';

const getVerifierUrl = (): string => {
  const override = (window as any)?.aesirxVerifierUrl;
  const url = typeof override === 'string' && override.length > 0 ? override : VERIFIER_URL;
  return url.replace(/\/$/, '');
};

const getStatementParams = () => {
  const w = window as any;
  return {
    ageCheck: !!w.ageCheck,
    countryCheck: !!w.countryCheck,
    minimumAge: typeof w.minimumAge === 'number' ? w.minimumAge : 18,
    maximumAge: typeof w.maximumAge === 'number' ? w.maximumAge : 0,
    allowedCountries: Array.isArray(w.allowedCountries) ? w.allowedCountries : [],
    disallowedCountries: Array.isArray(w.disallowedCountries) ? w.disallowedCountries : [],
  };
};

export const useConcordiumIDApp = (
  handleAgree: () => Promise<void> | void
): UseConcordiumIDAppReturn => {
  const [state, setState] = useState<IDAppFlowState>('idle');
  const [wcUri, setWcUri] = useState<string | null>(null);
  const [deepLinkUri, setDeepLinkUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const clientRef = useRef<SignClient | null>(null);
  const vprDataRef = useRef<{ connectionId: string; vpr: unknown } | null>(null);
  const hasAutoResentRef = useRef(false);
  const backgroundedAtRef = useRef<number | null>(null);

  const isMobile = typeof window !== 'undefined' ? isMobileDevice() : false;
  const isIOS = typeof window !== 'undefined' ? checkIsIOS() : false;

  const finalizeVerify = useCallback(
    async (sessionId: string, vp: unknown, vpr: unknown) => {
      const verifierUrl = getVerifierUrl();

      setState('verifying');
      const verifyRes = await fetch(`${verifierUrl}/verification/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, presentation: vp, verificationRequest: vpr }),
      });
      if (!verifyRes.ok) {
        const errData = await verifyRes.json().catch(() => ({}));
        throw new Error((errData as { error?: string }).error || 'Verification failed');
      }
      setState('verified');
      await handleAgree();
    },
    [handleAgree]
  );

  useEffect(() => {
    if (!isIOS) return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden') {
        backgroundedAtRef.current = Date.now();
        return;
      }
      const wasBackgrounded = backgroundedAtRef.current;
      const timeInBackground = wasBackgrounded ? Date.now() - wasBackgrounded : 0;
      backgroundedAtRef.current = null;

      if (
        state === 'awaiting_proof' &&
        vprDataRef.current &&
        clientRef.current &&
        sessionIdRef.current &&
        !hasAutoResentRef.current
      ) {
        hasAutoResentRef.current = true;
        const delay = timeInBackground > 5000 ? 2500 : 1500;
        setTimeout(async () => {
          if (!vprDataRef.current || !clientRef.current || !sessionIdRef.current) {
            hasAutoResentRef.current = false;
            return;
          }
          const { connectionId, vpr } = vprDataRef.current;
          try {
            const vp = await sendVPRToIDApp(clientRef.current, connectionId, vpr);
            await finalizeVerify(sessionIdRef.current, vp, vpr);
          } catch (err) {
            console.error('[IDApp] Auto-resend failed:', err);
            hasAutoResentRef.current = false;
          }
        }, delay);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isIOS, state, finalizeVerify]);

  const reset = useCallback(() => {
    setState('idle');
    setWcUri(null);
    setDeepLinkUri(null);
    setError(null);
    sessionIdRef.current = null;
    vprDataRef.current = null;
    hasAutoResentRef.current = false;
    resetSignClient();
  }, []);

  const resendVPR = useCallback(async () => {
    if (!vprDataRef.current || !clientRef.current || !sessionIdRef.current) {
      setError('Cannot resend - connection data lost. Please try again.');
      setState('failed');
      return;
    }
    const { connectionId, vpr } = vprDataRef.current;
    try {
      const vp = await sendVPRToIDApp(clientRef.current, connectionId, vpr);
      await finalizeVerify(sessionIdRef.current, vp, vpr);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Resend failed';
      setError(message);
      setState('failed');
    }
  }, [finalizeVerify]);

  const startVerification = useCallback(async () => {
    try {
      setState('connecting');
      setError(null);

      const verifierUrl = getVerifierUrl();

      const client = await getSignClient();
      clientRef.current = client;

      const { uri, approval } = await createPairing(client);
      if (!uri) throw new Error('WalletConnect did not return a pairing URI');
      setWcUri(uri);
      setDeepLinkUri(buildDeepLinkURI(uri));

      const session = await approval();
      const connectionId = session.topic;

      const createRes = await fetch(`${verifierUrl}/verification/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionId,
          statement: getStatementParams(),
          contextString: `Verification for ${window.location.hostname}`,
          resourceId: window.location.pathname || '/',
        }),
      });
      if (!createRes.ok) {
        const errData = await createRes.json().catch(() => ({}));
        throw new Error(
          (errData as { error?: string }).error || 'Failed to create verification request'
        );
      }
      const { sessionId, vpr } = await createRes.json();
      sessionIdRef.current = sessionId;
      vprDataRef.current = { connectionId, vpr };

      setState('awaiting_proof');
      const vp = await sendVPRToIDApp(client, connectionId, vpr);
      await finalizeVerify(sessionId, vp, vpr);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Verification failed';
      console.error('[IDApp] Verification flow error:', err);
      setError(message);
      setState('failed');
    }
  }, [finalizeVerify]);

  return {
    state,
    wcUri,
    deepLinkUri,
    isMobile,
    isIOS,
    error,
    startVerification,
    reset,
    resendVPR,
  };
};
