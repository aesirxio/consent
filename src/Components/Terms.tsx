import React, { Fragment, useState } from 'react';
import bg from '../Assets/bg.png';
import privacy from '../Assets/privacy.svg';
import check_circle from '../Assets/check_circle.svg';
import { useTranslation } from 'react-i18next';
import { Nav, Tab } from 'react-bootstrap';
import ConsentHeader from './ConsentHeader';

const TermsComponent = ({
  children,
  isCustom = false,
  layout,
  isRejectedLayout,
  customConsentText,
  customCookieText,
  customDetailText,
  customRejectText,
  languageSwitcher,
  modeSwitcher,
}: any) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('consent');

  return (
    <>
      <Fragment>
        <ConsentHeader
          isRejectedLayout={isRejectedLayout}
          languageSwitcher={languageSwitcher}
          modeSwitcher={modeSwitcher}
        />
        <div className={`pb-1 pb-lg-3 ${isCustom ? 'pt-0' : 'p-3'} bg-white`}>
          <>
            {isCustom ? (
              <>
                <Tab.Container
                  id="consent_info_tab"
                  activeKey={activeTab}
                  onSelect={(k) => setActiveTab(k)}
                >
                  <Nav
                    variant="tabs"
                    className={`mb-2 mb-lg-4 w-100 flex-nowrap align-items-center consent_info_tab ${
                      isRejectedLayout ? 'd-none' : ''
                    }`}
                  >
                    <Nav.Item>
                      <Nav.Link type="button" eventKey="consent">
                        {(window as any)?.aesirx_analytics_translate?.txt_consent_nanagement ??
                          t('txt_consent_nanagement')}
                      </Nav.Link>
                    </Nav.Item>{' '}
                    {customCookieText ? (
                      <Nav.Item>
                        <Nav.Link type="button" eventKey="cookie-declaration">
                          {(window as any)?.aesirx_analytics_translate?.txt_cookie_declaration ??
                            t('txt_cookie_declaration')}
                        </Nav.Link>
                      </Nav.Item>
                    ) : (
                      <></>
                    )}
                    <Nav.Item>
                      <Nav.Link type="button" eventKey="detail">
                        {(window as any)?.aesirx_analytics_translate?.txt_details ??
                          t('txt_details')}
                      </Nav.Link>
                    </Nav.Item>
                    {/* <Nav.Item>
                      <Nav.Link type="button" eventKey="about">
                        {(window as any)?.aesirx_analytics_translate?.txt_about ?? t('txt_about')}
                      </Nav.Link>
                    </Nav.Item> */}
                  </Nav>
                  <Tab.Content>
                    <Tab.Pane eventKey="consent" className="w-auto px-2 px-lg-4">
                      {isRejectedLayout ? (
                        <>
                          {customRejectText ? (
                            <>
                              <div
                                dangerouslySetInnerHTML={{
                                  __html: customRejectText,
                                }}
                              />
                            </>
                          ) : (
                            <>
                              {' '}
                              <p className="mt-0 pt-4 mb-2">
                                {(window as any)?.aesirx_analytics_translate?.txt_you_have_chosen ??
                                  t('txt_you_have_chosen')}
                              </p>
                              <p className="mt-2 mb-3">
                                {(window as any)?.aesirx_analytics_translate?.txt_only_anonymized ??
                                  t('txt_only_anonymized')}
                              </p>
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
                                    ?.txt_consent_allow_data ? (
                                    <div
                                      dangerouslySetInnerHTML={{
                                        __html: (window as any)?.aesirx_analytics_translate
                                          ?.txt_consent_allow_data,
                                      }}
                                    />
                                  ) : (
                                    <div
                                      dangerouslySetInnerHTML={{
                                        __html: t('txt_consent_allow_data', {
                                          interpolation: { escapeValue: false },
                                        }),
                                      }}
                                    />
                                  )}
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
                                    ?.txt_decentralized_consent_allow_data ? (
                                    <div
                                      dangerouslySetInnerHTML={{
                                        __html: (window as any)?.aesirx_analytics_translate
                                          ?.txt_decentralized_consent_allow_data,
                                      }}
                                    />
                                  ) : (
                                    <div
                                      dangerouslySetInnerHTML={{
                                        __html: t('txt_decentralized_consent_allow_data', {
                                          interpolation: { escapeValue: false },
                                        }),
                                      }}
                                    />
                                  )}
                                </div>
                              </div>
                            </>
                          )}
                        </>
                      ) : (
                        <div className="tab_content">
                          {customConsentText ? (
                            <>
                              <div
                                dangerouslySetInnerHTML={{
                                  __html: customConsentText,
                                }}
                              />
                            </>
                          ) : (
                            <>
                              {' '}
                              <p className="mt-0 mb-1 mb-lg-2 text-black fw-semibold">
                                {(window as any)?.aesirx_analytics_translate
                                  ?.txt_manage_your_consent ?? t('txt_manage_your_consent')}
                              </p>
                              <p className="mt-0 mb-1 mb-lg-3">
                                {layout === 'simple-consent-mode'
                                  ? ((window as any)?.aesirx_analytics_translate
                                      ?.txt_choose_how_we_use_simple ??
                                    t('txt_choose_how_we_use_simple'))
                                  : ((window as any)?.aesirx_analytics_translate
                                      ?.txt_choose_how_we_use ?? t('txt_choose_how_we_use'))}
                              </p>
                              <div className="mb-1 mb-lg-3">
                                <p className="mb-1 mb-lg-2 text-black">
                                  {(window as any)?.aesirx_analytics_translate?.txt_by_consenting ??
                                    t('txt_by_consenting')}
                                </p>
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
                                    <div>
                                      {(window as any)?.aesirx_analytics_translate
                                        ?.txt_analytics_behavioral ?? t('txt_analytics_behavioral')}
                                    </div>
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
                                    <div>
                                      {(window as any)?.aesirx_analytics_translate?.txt_form_data ??
                                        t('txt_form_data')}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <p className="mb-1 mb-lg-2 text-black">
                                  {(window as any)?.aesirx_analytics_translate?.txt_please_note ??
                                    t('txt_please_note')}
                                </p>
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
                                    <div>
                                      {(window as any)?.aesirx_analytics_translate
                                        ?.txt_we_do_not_share ?? t('txt_we_do_not_share')}
                                    </div>
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
                                    <div>
                                      {(window as any)?.aesirx_analytics_translate
                                        ?.txt_you_can_opt_in ?? t('txt_you_can_opt_in')}
                                    </div>
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
                                      ?.txt_for_more_details ? (
                                      <div
                                        dangerouslySetInnerHTML={{
                                          __html: (window as any)?.aesirx_analytics_translate
                                            ?.txt_for_more_details,
                                        }}
                                      />
                                    ) : (
                                      <div
                                        dangerouslySetInnerHTML={{
                                          __html: t('txt_for_more_details', {
                                            interpolation: { escapeValue: false },
                                          }),
                                        }}
                                      />
                                    )}
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </Tab.Pane>
                    {customCookieText ? (
                      <Tab.Pane eventKey="cookie-declaration" className={'px-2 px-lg-4'}>
                        <div className="tab_content mb-1 mb-lg-3 pe-2 pe-lg-3 cookie_declaration_section">
                          <div
                            dangerouslySetInnerHTML={{
                              __html: customCookieText,
                            }}
                          />
                        </div>
                      </Tab.Pane>
                    ) : (
                      <></>
                    )}
                    <Tab.Pane
                      eventKey="detail"
                      title={
                        (window as any)?.aesirx_analytics_translate?.txt_details ?? t('txt_details')
                      }
                      className="px-2 px-lg-4"
                    >
                      <div className={`tab_content about_section`}>
                        {customDetailText ? (
                          <>
                            <div
                              dangerouslySetInnerHTML={{
                                __html: customDetailText,
                              }}
                            />
                          </>
                        ) : (
                          <>
                            <p className="mt-0 mb-1 mb-lg-2 text-black fw-semibold">
                              {(window as any)?.aesirx_analytics_translate
                                ?.txt_manage_your_consent ?? t('txt_manage_your_consent')}
                            </p>
                            <p className="mt-0 mb-1 mb-lg-3">
                              {layout === 'simple-consent-mode'
                                ? ((window as any)?.aesirx_analytics_translate
                                    ?.txt_choose_how_we_use_simple ??
                                  t('txt_choose_how_we_use_simple'))
                                : ((window as any)?.aesirx_analytics_translate
                                    ?.txt_choose_how_we_use ?? t('txt_choose_how_we_use'))}
                            </p>
                            <div className="mb-1 mb-lg-3">
                              <p className="mb-1 mb-lg-2 text-black fw-semibold">
                                {(window as any)?.aesirx_analytics_translate?.txt_benefit ??
                                  t('txt_benefit')}
                              </p>
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
                                    ?.txt_control_your_data ? (
                                    <div
                                      dangerouslySetInnerHTML={{
                                        __html: (window as any)?.aesirx_analytics_translate
                                          ?.txt_control_your_data,
                                      }}
                                    />
                                  ) : (
                                    <div
                                      dangerouslySetInnerHTML={{
                                        __html: t('txt_control_your_data', {
                                          interpolation: { escapeValue: false },
                                        }),
                                      }}
                                    />
                                  )}
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
                                  {(window as any)?.aesirx_analytics_translate?.txt_earn_rewards ? (
                                    <div
                                      dangerouslySetInnerHTML={{
                                        __html: (window as any)?.aesirx_analytics_translate
                                          ?.txt_earn_rewards,
                                      }}
                                    />
                                  ) : (
                                    <div
                                      dangerouslySetInnerHTML={{
                                        __html: t('txt_earn_rewards', {
                                          interpolation: { escapeValue: false },
                                        }),
                                      }}
                                    />
                                  )}
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
                                    ?.txt_transparent_data ? (
                                    <div
                                      dangerouslySetInnerHTML={{
                                        __html: (window as any)?.aesirx_analytics_translate
                                          ?.txt_transparent_data,
                                      }}
                                    />
                                  ) : (
                                    <div
                                      dangerouslySetInnerHTML={{
                                        __html: t('txt_transparent_data', {
                                          interpolation: { escapeValue: false },
                                        }),
                                      }}
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="mb-1 mb-lg-3">
                              <p className="mb-1 mb-lg-2 text-black fw-semibold">
                                {(window as any)?.aesirx_analytics_translate
                                  ?.txt_understanding_your_privacy ??
                                  t('txt_understanding_your_privacy')}
                              </p>
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
                                    ?.txt_reject_no_data ? (
                                    <div
                                      dangerouslySetInnerHTML={{
                                        __html: (window as any)?.aesirx_analytics_translate
                                          ?.txt_reject_no_data,
                                      }}
                                    />
                                  ) : (
                                    <div
                                      dangerouslySetInnerHTML={{
                                        __html: t('txt_reject_no_data', {
                                          interpolation: { escapeValue: false },
                                        }),
                                      }}
                                    />
                                  )}
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
                                    ?.txt_consent_first_third_party ? (
                                    <div
                                      dangerouslySetInnerHTML={{
                                        __html: (window as any)?.aesirx_analytics_translate
                                          ?.txt_consent_first_third_party,
                                      }}
                                    />
                                  ) : (
                                    <div
                                      dangerouslySetInnerHTML={{
                                        __html: t('txt_consent_first_third_party', {
                                          interpolation: { escapeValue: false },
                                        }),
                                      }}
                                    />
                                  )}
                                </div>
                              </div>
                              {layout === 'simple-consent-mode' ? (
                                <></>
                              ) : (
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
                                      ?.txt_decentralizered_consent_choose ? (
                                      <div
                                        dangerouslySetInnerHTML={{
                                          __html: (window as any)?.aesirx_analytics_translate
                                            ?.txt_decentralizered_consent_choose,
                                        }}
                                      />
                                    ) : (
                                      <div
                                        dangerouslySetInnerHTML={{
                                          __html: t('txt_decentralizered_consent_choose', {
                                            interpolation: { escapeValue: false },
                                          }),
                                        }}
                                      />
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </Tab.Pane>
                    {/* <Tab.Pane eventKey="about" className="px-2 px-lg-4">
                      <div className="tab_content mb-1 mb-lg-3">
                        <p className="mb-1 mb-lg-2 text-black fw-semibold">
                          {(window as any)?.aesirx_analytics_translate
                            ?.txt_our_commitment_in_action ?? t('txt_our_commitment_in_action')}
                        </p>
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
                            {(window as any)?.aesirx_analytics_translate?.txt_private_protection ? (
                              <div
                                dangerouslySetInnerHTML={{
                                  __html: (window as any)?.aesirx_analytics_translate
                                    ?.txt_private_protection,
                                }}
                              />
                            ) : (
                              <div
                                dangerouslySetInnerHTML={{
                                  __html: t('txt_private_protection', {
                                    interpolation: { escapeValue: false },
                                  }),
                                }}
                              />
                            )}
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
                            {(window as any)?.aesirx_analytics_translate?.txt_enables_compliance ? (
                              <div
                                dangerouslySetInnerHTML={{
                                  __html: (window as any)?.aesirx_analytics_translate
                                    ?.txt_enables_compliance,
                                }}
                              />
                            ) : (
                              <div
                                dangerouslySetInnerHTML={{
                                  __html: t('txt_enables_compliance', {
                                    interpolation: { escapeValue: false },
                                  }),
                                }}
                              />
                            )}
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
                              ?.txt_proactive_protection ? (
                              <div
                                dangerouslySetInnerHTML={{
                                  __html: (window as any)?.aesirx_analytics_translate
                                    ?.txt_proactive_protection,
                                }}
                              />
                            ) : (
                              <div
                                dangerouslySetInnerHTML={{
                                  __html: t('txt_proactive_protection', {
                                    interpolation: { escapeValue: false },
                                  }),
                                }}
                              />
                            )}
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
                            <div
                              dangerouslySetInnerHTML={{
                                __html: t('txt_flexible_consent', {
                                  interpolation: { escapeValue: false },
                                }),
                              }}
                            />
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
                            {(window as any)?.aesirx_analytics_translate?.txt_learn_more ? (
                              <div
                                dangerouslySetInnerHTML={{
                                  __html: (window as any)?.aesirx_analytics_translate
                                    ?.txt_learn_more,
                                }}
                              />
                            ) : (
                              <div
                                dangerouslySetInnerHTML={{
                                  __html: t('txt_learn_more', {
                                    interpolation: { escapeValue: false },
                                  }),
                                }}
                              />
                            )}
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
                            {(window as any)?.aesirx_analytics_translate?.txt_for_business ? (
                              <div
                                dangerouslySetInnerHTML={{
                                  __html: (window as any)?.aesirx_analytics_translate
                                    ?.txt_for_business,
                                }}
                              />
                            ) : (
                              <div
                                dangerouslySetInnerHTML={{
                                  __html: t('txt_for_business', {
                                    interpolation: { escapeValue: false },
                                  }),
                                }}
                              />
                            )}
                          </div>
                        </div>
                        <div className="ms-4">
                          {(window as any)?.aesirx_analytics_translate?.txt_more_info_at ? (
                            <div
                              dangerouslySetInnerHTML={{
                                __html: (window as any)?.aesirx_analytics_translate
                                  ?.txt_more_info_at,
                              }}
                            />
                          ) : (
                            <div
                              dangerouslySetInnerHTML={{
                                __html: t('txt_more_info_at', {
                                  interpolation: { escapeValue: false },
                                }),
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </Tab.Pane> */}
                  </Tab.Content>
                </Tab.Container>
              </>
            ) : (
              <></>
            )}
          </>
        </div>
        {isCustom ? (
          <div className="rounded-bottom position-relative overflow-hidden text-white bg-white">
            <div className="position-relative pt-2 pt-lg-3 p-3">
              <div className="d-flex align-items-center justify-content-between flex-wrap">
                {children}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-bottom position-relative overflow-hidden text-white">
            <img
              className="position-absolute h-100 w-100 object-fit-cover"
              src={bg}
              alt="Background Image"
            />
            <img
              className="position-absolute h-100 w-100 object-fit-cover lightning flash-effect"
              src={bg}
              alt="Background Image"
            />
            <div className="position-relative pt-2 pt-lg-3 p-3">
              <div className="d-flex align-items-center justify-content-between flex-wrap">
                <div className="me-2">
                  <img src={privacy} alt={'SoP Icon'} />{' '}
                  {(window as any)?.aesirx_analytics_translate?.txt_shield_of_privacy ??
                    t('txt_shield_of_privacy')}
                </div>
                {children}
              </div>
            </div>
          </div>
        )}
      </Fragment>
    </>
  );
};

export { TermsComponent };
