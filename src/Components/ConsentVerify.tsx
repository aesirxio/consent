import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Form, Modal } from 'react-bootstrap';
import { BROWSER_WALLET } from '../Hooks/config';
import concordium_logo from '../Assets/concordium_logo.png';
import google_wallet from '../Assets/google_wallet.png';
import { toast } from 'react-toastify';
import { requestDigitalCreds } from '../utils/walletVerify';
import { getStatement } from '../utils/Concordium';
import { isAndroid, isChrome, isMobile } from 'react-device-detect';

const ConsentVerify = ({
  show,
  setShow,
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
    setShow(false);
    setShowQR(false);
  };
  const [wallet, setWallet] = useState('concordium');
  const [loadingQR, setLoadingQR] = useState(false);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    const initProof = async () => {
      show && handleClose();
      if (account && !proof && level && loading === 'verifying_age_country') {
        await handleAgree();
      } else {
        if (activeConnectorError) {
          await handleAgree();
        }
      }
    };
    if (window['aesirx1stparty']) {
      if (window['concordium']) {
        initProof();
      } else if (loading === 'verifying_age_country') {
        setLoading('done');
        toast.error('Browser wallet extension not detected', { toastId: 'extension_not_detected' });
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
        toast.error('Failed to verify age and country!');
        handleClose();
        return;
      }

      const birthDate =
        data.response_data?.find((item: any) => item?.name === 'birth_date')?.value ?? '';
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
          toast.error('Your age does not fall within the permitted range.');
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
          toast.error('Issuing country is not allowed!');
          handleClose();
          return;
        }
      }

      await handleAgree();
      setLoadingQR(false);
      handleClose();
    } catch (err) {
      console.log(err);
      setLoadingQR(false);
    }
  };
  return (
    <Modal
      className="aesirxconsent aesirxconsent-modal consent-verify-modal"
      show={show}
      onHide={handleClose}
      centered
      backdropClassName="consent-verify-backdrop"
    >
      <Modal.Body className="aesirxconsent">
        <div className="pt-3 rounded-top bg-white">
          <div className="border-bottom px-3">
            <h3 className="fs-3 fw-semibold mt-2 mb-3 text-primary">Verify your age & country</h3>
          </div>
          {showQR ? (
            <div className="p-3">
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
                Please scan QR code with your Android device
              </p>
            </div>
          ) : (
            <div className="p-3">
              <div>Choose your wallet:</div>
              <Form className={`mb-0 w-100 bg-white`}>
                <div className="consent-verify-wallet">
                  <Form.Check
                    type="radio"
                    id="concordium-wallet"
                    value={'concordium'}
                    checked={wallet === 'concordium'}
                    onChange={(e) => setWallet(e.target.value)}
                  />
                  <div className="bg-dark rounded-2 mx-2 p-1 border">
                    <img
                      width="22px"
                      height="22px"
                      src={concordium_logo}
                      className="align-text-bottom"
                      alt="Concordium"
                    />
                  </div>
                  <label htmlFor="concordium-wallet">Concordium wallet</label>
                </div>
                <div className="consent-verify-wallet">
                  <Form.Check
                    type="radio"
                    id="google-wallet"
                    value={'google'}
                    checked={wallet === 'google'}
                    onChange={(e) => setWallet(e.target.value)}
                  />

                  <div className="rounded-2 mx-2 p-1 border">
                    <img
                      width="22px"
                      height="19px"
                      src={google_wallet}
                      className="align-text-bottom"
                      alt="Concordium"
                    />
                  </div>
                  <label htmlFor="google-wallet">Google wallet</label>
                </div>
                {/* <div className="consent-verify-wallet">
                  <Form.Check
                    type="radio"
                    id="apple-wallet"
                    value={'apple'}
                    disabled
                    checked={wallet === 'apple'}
                    onChange={(e) => setWallet(e.target.value)}
                  />

                  <div className="rounded-2 mx-2 p-1 border">
                    <img
                      width="22px"
                      height="22px"
                      src={apple_wallet}
                      className="align-text-bottom"
                      alt="Concordium"
                    />
                  </div>
                  <label htmlFor="apple-wallet">Apple wallet (coming soon)</label>
                </div> */}
              </Form>
            </div>
          )}
        </div>
        <div className="rounded-bottom position-relative overflow-hidden text-white bg-white">
          <div className="position-relative pt-2 pt-lg-3 p-3">
            <div className="d-flex align-items-center justify-content-between flex-wrap">
              <div className="d-flex w-100 flex-wrap flex-lg-nowrap justify-content-between">
                <Button
                  variant="outline-success"
                  onClick={() => {
                    handleClose();
                  }}
                  className="d-flex align-items-center justify-content-center fs-14 px-5 me-3 mb-2 mb-lg-0 rounded-pill py-2 py-lg-3"
                >
                  {(window as any)?.aesirx_analytics_translate?.txt_back ?? t('txt_back')}
                </Button>
                {!showQR ? (
                  <Button
                    variant="outline-success"
                    onClick={async () => {
                      if (wallet === 'concordium') {
                        setLoading('verifying_age_country');
                        setActiveConnectorType(BROWSER_WALLET);
                      } else if (wallet === 'google') {
                        if (isChrome) {
                          if (isMobile && !isAndroid) {
                            handleClose();
                            toast.error('This feature is only available in Android device');
                            return;
                          }
                          setShowQR(true);
                          generateQR();
                        } else {
                          handleClose();
                          toast.error('This feature is only available in Google Chrome');
                        }
                      }
                    }}
                    className="d-flex align-items-center justify-content-center fs-14 px-5 me-3 mb-2 mb-lg-0 rounded-pill py-2 py-lg-3"
                    // disabled={loadingVerify}
                  >
                    {/* {loadingVerify ? (
                  <span
                    className="spinner-border spinner-border-sm me-1"
                    role="status"
                    aria-hidden="true"
                  ></span>
                ) : (
                  <></>
                )} */}
                    {(window as any)?.aesirx_analytics_translate?.txt_save ?? t('txt_save')}
                  </Button>
                ) : (
                  <></>
                )}
              </div>
            </div>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export { ConsentVerify };
