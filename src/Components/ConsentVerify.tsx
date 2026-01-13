import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Form } from 'react-bootstrap';
import { BROWSER_WALLET, WALLET_CONNECT } from '../Hooks/config';
import concordium_wallet from '../Assets/concordium_wallet.png';
import google_wallet from '../Assets/google_wallet.png';
import other_wallet from '../Assets/other_wallet.png';
import back from '../Assets/back.png';
import check_circle from '../Assets/check_circle.svg';
import { toast } from 'react-toastify';
import { requestDigitalCreds } from '../utils/walletVerify';
import { getStatement } from '../utils/Concordium';
import { isAndroid, isChrome, isDesktop, isMobile } from 'react-device-detect';
import { allCountries } from '../utils/countries';

const ConsentVerify = ({
  setToastLayout,
  setActiveConnectorType,
  setLoading,
  handleAgree,
  account,
  proof,
  level,
  loading,
  activeConnectorError,
}: any) => {
  const { t } = useTranslation();
  const handleClose = () => {
    level === 3 || level === 4 ? setToastLayout('decentralized') : setToastLayout('');
    setShowQR(false);
    setStep(1);
  };
  const [wallet, setWallet] = useState('concordium');
  const [loadingQR, setLoadingQR] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    const initProof = async () => {
      if (account && !proof && level && loading === 'verifying_age_country') {
        await handleAgree();
      } else {
        if (activeConnectorError) {
          await handleAgree();
        }
      }
    };
    if (window['aesirx1stparty']) {
      if (window['concordium'] || isMobile) {
        initProof();
      } else if (loading === 'verifying_age_country' || loading === 'verifying_sign_proof') {
        setLoading('done');
        if (!isMobile) {
          toast.error(
            (window as any)?.aesirx_analytics_translate
              ?.txt_browser_wallet_extension_not_detected ??
              t('txt_browser_wallet_extension_not_detected'),
            {
              toastId: 'extension_not_detected',
            }
          );
        }
        handleClose();
      }
    }
  }, [account, proof, activeConnectorError, loading]);

  const generateQR = async () => {
    try {
      setLoadingQR(true);
      const mdocAttributes = {
        birthDateAttr: {
          namespace: 'org.iso.18013.5.1',
          name: 'birth_date',
          displayName: 'Birth Date',
          checked: true,
        },
        countryAttr: {
          namespace: 'org.iso.18013.5.1',
          name: 'issuing_country',
          displayName: 'Issuing Country',
          checked: true,
        },
      };
      const [data, statement] = await Promise.all([
        requestDigitalCreds('openid4vp', 'org.iso.18013.5.1.mDL', mdocAttributes, null, null, null),
        getStatement(),
      ]);

      if (!data?.response_data || !statement) {
        toast.error(
          (window as any)?.aesirx_analytics_translate?.txt_failed_to_verify_age_and_country ??
            t('txt_failed_to_verify_age_and_country')
        );
        handleClose();
        return;
      }

      const birthDate =
        data?.response_data?.find((item: any) => item?.name === 'birth_date')?.value ?? '';
      const issuingCountry = data.response_data?.find(
        (item: any) => item?.name === 'issuing_country'
      )?.value;

      const dob = statement?.find(
        (item: any) => item?.attributeTag === 'dob' && item?.type === 'AttributeInRange'
      );
      const lower = dob?.lower;
      const upper = dob?.upper;

      if (dob && birthDate) {
        const birthDateInt = parseInt(birthDate.replace(/-/g, ''), 10);
        if (birthDateInt < lower || birthDateInt > upper) {
          toast.error(
            (window as any)?.aesirx_analytics_translate
              ?.txt_your_age_does_not_fall_within_the_permitted_range ??
              t('txt_your_age_does_not_fall_within_the_permitted_range')
          );
          handleClose();
          return;
        }
      }

      const nationality = statement?.find((item: any) => item?.attributeTag === 'nationality');
      const allowCountries = nationality?.type === 'AttributeInSet' ? nationality?.set : [];
      const disallowCountries = nationality?.type === 'AttributeNotInSet' ? nationality?.set : [];

      if (nationality && issuingCountry) {
        const isAllowed =
          (allowCountries?.length > 0 && allowCountries.includes(issuingCountry)) ||
          (disallowCountries?.length > 0 && !disallowCountries.includes(issuingCountry));

        if (!isAllowed) {
          toast.error(
            (window as any)?.aesirx_analytics_translate?.txt_issuing_country_is_not_allowed ??
              t('txt_issuing_country_is_not_allowed')
          );
          handleClose();
          return;
        }
      }
      setLoadingQR(false);
      handleClose();
      await handleAgree();
    } catch (err) {
      console.log(err);
      setLoadingQR(false);
    }
  };
  return (
    <div className="consent-verify-modal">
      <div className="pt-2 pt-lg-3 rounded-top bg-white">
        <div className="border-bottom px-2 px-lg-4">
          <div className="d-flex align-items-center mt-1 mt-lg-2 mb-2 mb-lg-3">
            <img
              width="36px"
              height="36px"
              src={back}
              className="align-text-bottom cursor-pointer"
              alt="back_icon"
              onClick={() => {
                step === 1 ? handleClose() : setStep(1);
              }}
            />
            <h3 className="fs-3 fw-semibold text-primary ms-3 my-0">
              {step === 1
                ? window['ageCheck'] && window['countryCheck']
                  ? ((window as any)?.aesirx_analytics_translate?.txt_age_country_verification ??
                    t('txt_age_country_verification'))
                  : window['ageCheck']
                    ? ((window as any)?.aesirx_analytics_translate?.txt_age_verification ??
                      t('txt_age_verification'))
                    : ((window as any)?.aesirx_analytics_translate?.txt_country_verification ??
                      t('txt_country_verification'))
                : ((window as any)?.aesirx_analytics_translate?.txt_choose_a_verification_method ??
                  t('txt_choose_a_verification_method'))}
            </h3>
          </div>
        </div>
        {step === 1 ? (
          <div className="p-2 p-lg-4">
            <div className="d-flex align-items-start check-line mb-2">
              <span className="mt-1px">
                <img src={check_circle} width={'14px'} height={'15px'} alt="Check Icon" />
              </span>
              <div className="ms-10px">
                <div>
                  {(window as any)?.aesirx_analytics_translate?.txt_you_must_be_at_least ??
                    t('txt_you_must_be_at_least')}{' '}
                  {window['minimumAge'] ?? 18}{' '}
                  {(window as any)?.aesirx_analytics_translate
                    ?.txt_years_old_to_access_this_content ??
                    t('txt_years_old_to_access_this_content')}
                </div>
              </div>
            </div>
            {window['maximumAge'] ? (
              <div className="d-flex align-items-start check-line mb-2">
                <span className="mt-1px">
                  <img src={check_circle} width={'14px'} height={'15px'} alt="Check Icon" />
                </span>
                <div className="ms-10px">
                  <div>
                    {(window as any)?.aesirx_analytics_translate
                      ?.txt_access_is_limited_to_users_under ??
                      t('txt_access_is_limited_to_users_under')}{' '}
                    {window['maximumAge']}{' '}
                    {(window as any)?.aesirx_analytics_translate?.txt_years ?? t('txt_years')}
                  </div>
                </div>
              </div>
            ) : (
              []
            )}
            {window['countryCheck'] && window['allowedCountries']?.length > 0 ? (
              <div className="d-flex align-items-start check-line mb-2">
                <span className="mt-1px">
                  <img src={check_circle} width={'14px'} height={'15px'} alt="Check Icon" />
                </span>
                <div className="ms-10px">
                  <div>
                    {(window as any)?.aesirx_analytics_translate
                      ?.txt_to_access_this_content_you_must_be_from ??
                      t('txt_to_access_this_content_you_must_be_from')}{' '}
                    {window['allowedCountries']?.map((code: any) => allCountries[code]).join(', ')}.
                  </div>
                </div>
              </div>
            ) : (
              []
            )}
            {window['countryCheck'] && window['disallowedCountries']?.length > 0 ? (
              <div className="d-flex align-items-start check-line mb-2">
                <span className="mt-1px">
                  <img src={check_circle} width={'14px'} height={'15px'} alt="Check Icon" />
                </span>
                <div className="ms-10px">
                  <div>
                    {(window as any)?.aesirx_analytics_translate
                      ?.txt_access_is_excluded_to_users_from ??
                      t('txt_access_is_excluded_to_users_from')}{' '}
                    {window['disallowedCountries']
                      ?.map((code: any) => allCountries[code])
                      .join(', ')}
                    .
                  </div>
                </div>
              </div>
            ) : (
              []
            )}
            <div className="d-flex align-items-start check-line mb-2">
              <span className="mt-1px">
                <img src={check_circle} width={'14px'} height={'15px'} alt="Check Icon" />
              </span>
              <div className="ms-10px">
                <div>
                  {(window as any)?.aesirx_analytics_translate
                    ?.txt_to_comply_with_the_law_we_need_to_verify_your ??
                    t('txt_to_comply_with_the_law_we_need_to_verify_your')}{' '}
                  {window['ageCheck'] && window['countryCheck']
                    ? ((window as any)?.aesirx_analytics_translate?.txt_age_country ??
                      t('txt_age_country'))
                    : window['ageCheck']
                      ? ((window as any)?.aesirx_analytics_translate?.txt_age ?? t('txt_age'))
                      : ((window as any)?.aesirx_analytics_translate?.txt_country ??
                        t('txt_country'))}{' '}
                  {(window as any)?.aesirx_analytics_translate?.txt_before_granting_you_access ??
                    t('txt_before_granting_you_access')}
                </div>
              </div>
            </div>
            <div className="d-flex align-items-start check-line mb-4">
              <span className="mt-1px">
                <img src={check_circle} width={'14px'} height={'15px'} alt="Check Icon" />
              </span>
              <div className="ms-10px">
                <div>
                  {(window as any)?.aesirx_analytics_translate?.txt_verification_is_done ??
                    t('txt_verification_is_done')}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {showQR ? (
              <div className="p-2 p-lg-4">
                {loadingQR && (
                  <div>
                    <span
                      className="spinner-border spinner-border-sm d-block mx-auto"
                      role="status"
                      aria-hidden="true"
                      style={{ width: '40px', height: '40px' }}
                    ></span>
                  </div>
                )}
                <p className="text-sm text-gray-500 text-center max-w-sm mt-4">
                  {isMobile
                    ? ((window as any)?.aesirx_analytics_translate?.txt_please_accept_the_request ??
                      t('txt_please_accept_the_request'))
                    : ((window as any)?.aesirx_analytics_translate?.txt_scan_this_qr ??
                      t('txt_scan_this_qr'))}
                </p>
              </div>
            ) : (
              <div className="consent-verify-modal-choose p-2 p-lg-4">
                <div className="fw-semibold mb-1">
                  {(window as any)?.aesirx_analytics_translate?.txt_choose_your_wallet ??
                    t('txt_choose_your_wallet')}
                </div>
                <div className="fs-14 lh-sm fst-italic mb-1">
                  {(window as any)?.aesirx_analytics_translate?.txt_select_wallet ??
                    t('txt_select_wallet')}
                </div>
                <div className="fs-14 lh-sm fst-italic mb-1">
                  {(window as any)?.aesirx_analytics_translate?.txt_privacy_note ??
                    t('txt_privacy_note')}
                </div>
                <ul className="ms-2 mb-3 w-lg-90">
                  <li className="fs-14 lh-sm fst-italic ms-2">
                    <div
                      dangerouslySetInnerHTML={{
                        __html:
                          (window as any)?.aesirx_analytics_translate?.txt_privacy_note_1 ??
                          t('txt_privacy_note_1'),
                      }}
                    />
                  </li>
                  <li className="fs-14 lh-sm fst-italic ms-2">
                    <div
                      dangerouslySetInnerHTML={{
                        __html:
                          (window as any)?.aesirx_analytics_translate?.txt_privacy_note_2 ??
                          t('txt_privacy_note_2'),
                      }}
                    />
                  </li>
                </ul>
                <Form className={`mb-0 w-100 bg-white`}>
                  <label
                    className={`consent-verify-wallet ${wallet === 'concordium' ? 'active' : ''}`}
                    htmlFor="concordium-wallet"
                  >
                    <Form.Check
                      type="radio"
                      id="concordium-wallet"
                      value={'concordium'}
                      checked={wallet === 'concordium'}
                      onChange={(e) => setWallet(e.target.value)}
                    />
                    <div className="mx-2">
                      <img
                        width="36px"
                        height="36px"
                        src={concordium_wallet}
                        className="align-text-bottom"
                        alt="Concordium"
                      />
                    </div>
                    <div>
                      {isDesktop ? 'Concordium Browser Wallet' : 'CryptoX Wallet (Concordium ID)'}
                    </div>
                  </label>
                  <label
                    className={`consent-verify-wallet ${wallet === 'google' ? 'active' : ''}`}
                    htmlFor="google-wallet"
                  >
                    <Form.Check
                      type="radio"
                      id="google-wallet"
                      value={'google'}
                      checked={wallet === 'google'}
                      onChange={(e) => setWallet(e.target.value)}
                    />

                    <div className="mx-2">
                      <img
                        width="36px"
                        height="36px"
                        src={google_wallet}
                        className="align-text-bottom"
                        alt="Concordium"
                      />
                    </div>
                    <div>Google Wallet ID</div>
                  </label>
                  <label className={`consent-verify-wallet disabled`} htmlFor="other-wallet">
                    <Form.Check type="radio" id="other-wallet" value={'other'} disabled />

                    <div className="mx-2">
                      <img
                        width="36px"
                        height="36px"
                        src={other_wallet}
                        className="align-text-bottom"
                        alt="Other Wallet"
                      />
                    </div>
                    <div>
                      {(window as any)?.aesirx_analytics_translate?.txt_other_methods_coming_soon ??
                        t('txt_other_methods_coming_soon')}
                    </div>
                  </label>
                </Form>
                <div className="my-2 my-lg-3">
                  <span>
                    {(window as any)?.aesirx_analytics_translate?.txt_dont_have_a_digital_wallet ??
                      t('txt_dont_have_a_digital_wallet')}
                  </span>
                  <a
                    href="https://docs.concordium.com/en/mainnet/docs/browser-wallet/setup-browser-wallet.html"
                    target="_blank"
                    rel="noreferrer"
                    className="text-success fw-semibold ms-1 text-decoration-none"
                  >
                    {(window as any)?.aesirx_analytics_translate?.txt_create_concordium_id ??
                      t('txt_create_concordium_id')}
                  </a>
                </div>
                <div className="fs-14 lh-sm fst-italic">
                  {(window as any)?.aesirx_analytics_translate?.txt_register_with_your_passport ??
                    t('txt_register_with_your_passport')}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <div className="rounded-bottom position-relative overflow-hidden text-white bg-white">
        <div className="position-relative p-2 p-lg-4 pt-2 pt-lg-3">
          <div className="d-flex align-items-center justify-content-between flex-wrap">
            <div className="d-flex w-100 flex-wrap flex-lg-nowrap justify-content-between">
              <Button
                variant="outline-success"
                onClick={() => {
                  handleClose();
                }}
                className="d-flex align-items-center justify-content-center fs-14 px-4 px-lg-5 me-3 mb-2 mb-lg-0 rounded-pill py-2 py-lg-3"
              >
                {(window as any)?.aesirx_analytics_translate?.txt_cancel ?? t('txt_cancel')}
              </Button>
              {!showQR ? (
                <Button
                  variant="outline-success"
                  onClick={async () => {
                    if (step === 1) {
                      setStep(2);
                    } else {
                      if (wallet === 'concordium') {
                        setLoading('verifying_age_country');
                        if (isMobile) {
                          setActiveConnectorType(WALLET_CONNECT);
                        } else {
                          setActiveConnectorType(BROWSER_WALLET);
                        }
                      } else if (wallet === 'google') {
                        if (isChrome) {
                          if (isMobile && !isAndroid) {
                            handleClose();
                            toast.error(
                              (window as any)?.aesirx_analytics_translate
                                ?.txt_this_feature_is_only_available_in_android_device ??
                                t('txt_this_feature_is_only_available_in_android_device')
                            );
                            return;
                          }
                          setShowQR(true);
                          generateQR();
                        } else {
                          handleClose();
                          toast.error(
                            (window as any)?.aesirx_analytics_translate
                              ?.txt_this_feature_is_only_available_in_google_chrome ??
                              t('txt_this_feature_is_only_available_in_google_chrome')
                          );
                        }
                      }
                    }
                  }}
                  className="d-flex align-items-center justify-content-center fs-14 px-4 px-lg-5 mb-2 mb-lg-0 rounded-pill py-2 py-lg-3"
                  disabled={loading !== 'done'}
                >
                  {loading !== 'done' ? (
                    <span
                      className="spinner-border spinner-border-sm me-1"
                      role="status"
                      aria-hidden="true"
                    ></span>
                  ) : (
                    <></>
                  )}
                  {step === 1
                    ? ((window as any)?.aesirx_analytics_translate?.txt_continue_to_verification ??
                      t('txt_continue_to_verification'))
                    : ((window as any)?.aesirx_analytics_translate?.txt_save_wallet ??
                      t('txt_save_wallet'))}
                </Button>
              ) : (
                <></>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { ConsentVerify };
