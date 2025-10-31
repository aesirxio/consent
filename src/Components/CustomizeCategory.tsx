import React, { Fragment, useEffect, useState } from 'react';
import plus from '../Assets/plus.png';
import minus from '../Assets/minus.png';
import { useTranslation } from 'react-i18next';
import { Accordion, Button, Form } from 'react-bootstrap';
import ConsentHeader from './ConsentHeader';
import { postDisabledBlockDomains } from '../utils/consent';

const CustomizeCategory = ({
  languageSwitcher,
  modeSwitcher,
  setShowCustomize,
  disabledBlockDomains,
  handleRevokeBtn,
  showRevoke,
  endpoint,
}: any) => {
  const { t } = useTranslation();

  const blockJSDomains = [
    ...window?.aesirxBlockJSDomains,
    ...window?.aesirxHoldBackJS.map((item) => ({
      domain: null,
      blocking_permanent: 'off',
      ...item,
    })),
  ];

  const groupByCategory = blockJSDomains?.reduce((acc: any, item: any) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category]?.push({
      domain: item.domain,
      name: item.name,
      script: item.script,
    });
    return acc;
  }, {});

  const isConsented =
    showRevoke ||
    (sessionStorage.getItem('aesirx-analytics-revoke') &&
      sessionStorage.getItem('aesirx-analytics-revoke') !== '0');

  const [disabledItems, setDisabledItems] = useState([]);
  const [isDoNotSell, setIsDoNotSell] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = (category: string) => {
    setDisabledItems((prev) => {
      const isDisabled = prev.some((item) => item.category === category);
      if (isDisabled) {
        return prev.filter((item) => item.category !== category);
      } else {
        return [...prev, ...blockJSDomains.filter((item) => item.category === category)];
      }
    });
  };
  const handleCheckCustomize = (category: string, el: any) => {
    setDisabledItems((prev) => {
      const isDisabled = prev.some((item) => item.domain === el.domain);
      if (isDisabled) {
        return prev.filter((item) => item.domain !== el.domain);
      } else {
        return [...prev, el];
      }
    });
  };

  useEffect(() => {
    if (disabledBlockDomains || window['disabledBlockJSDomains']) {
      const dataBlockDomains = window['disabledBlockJSDomains']?.length
        ? window['disabledBlockJSDomains']
        : disabledBlockDomains
          ? JSON.parse(disabledBlockDomains)
          : [];
      setDisabledItems(dataBlockDomains);
    }
  }, []);

  return (
    <Fragment>
      <ConsentHeader languageSwitcher={languageSwitcher} modeSwitcher={modeSwitcher} />
      <div className={`pb-1 pb-lg-3 pt-0 bg-white`}>
        <Accordion className="p-2 p-lg-4 accordion-customize" alwaysOpen>
          {Object.keys(groupByCategory).length > 0 &&
            ['essential', 'functional', 'analytics', 'advertising', 'custom']
              .filter((key) => groupByCategory[key])
              ?.map((key, index) => {
                let title = '';
                let subTitle = '';
                switch (key) {
                  case 'essential':
                    title =
                      (window as any)?.aesirx_analytics_translate?.txt_essential_tracking ??
                      t('txt_essential_tracking');
                    subTitle =
                      (window as any)?.aesirx_analytics_translate?.txt_essential_tracking_desc ??
                      t('txt_essential_tracking_desc');
                    break;
                  case 'functional':
                    title =
                      (window as any)?.aesirx_analytics_translate?.txt_functional_tracking ??
                      t('txt_functional_tracking');
                    subTitle =
                      (window as any)?.aesirx_analytics_translate?.txt_functional_tracking_desc ??
                      t('txt_functional_tracking_desc');
                    break;
                  case 'analytics':
                    title =
                      (window as any)?.aesirx_analytics_translate?.txt_analytics_tracking ??
                      t('txt_analytics_tracking');
                    subTitle =
                      (window as any)?.aesirx_analytics_translate?.txt_analytics_tracking_desc ??
                      t('txt_analytics_tracking_desc');
                    break;
                  case 'advertising':
                    title =
                      (window as any)?.aesirx_analytics_translate?.txt_advertising_tracking ??
                      t('txt_advertising_tracking');
                    subTitle =
                      (window as any)?.aesirx_analytics_translate?.txt_advertising_tracking_desc ??
                      t('txt_advertising_tracking_desc');
                    break;
                  default:
                    title =
                      (window as any)?.aesirx_analytics_translate?.txt_custom_tracking ??
                      t('txt_custom_tracking');
                    subTitle =
                      (window as any)?.aesirx_analytics_translate?.txt_custom_tracking_desc ??
                      t('txt_custom_tracking_desc');
                }
                const allCategoryItems = blockJSDomains?.filter((item) => item.category === key);
                const isCategoryChecked = !allCategoryItems?.every((item) =>
                  disabledItems?.some((disabled) => disabled.domain === item.domain)
                );
                return (
                  <Accordion.Item eventKey={index?.toString()} key={index}>
                    <div className="d-flex align-items-center justify-content-between">
                      <Accordion.Header>
                        <div className="d-flex align-items-center">
                          <div className="accordion-img">
                            <img className="plus" src={plus} width={20} height={20} alt="plus" />
                            <img className="minus" src={minus} width={20} height={20} alt="minus" />
                          </div>
                          <div className="accordion-title">
                            <div className="fw-medium text-black">{title}</div>
                            <p className="mb-0 fs-14 d-none d-lg-block">{subTitle}</p>
                          </div>
                        </div>
                      </Accordion.Header>
                      {key === 'essential' ? (
                        <div className="text-success fs-14 fw-medium pe-2 pe-lg-3 text-nowrap">
                          {(window as any)?.aesirx_analytics_translate?.txt_always_active ??
                            t('txt_always_active')}
                        </div>
                      ) : (
                        <Form.Check
                          className="ms-auto me-0 pe-3"
                          type="switch"
                          value={key}
                          checked={isCategoryChecked}
                          onChange={() => {
                            handleToggle(key);
                          }}
                        />
                      )}
                    </div>
                    <p className="mb-0 fs-14 subtitle-mobile d-lg-none">{subTitle}</p>
                    <Accordion.Body>
                      {groupByCategory[key]?.map((el: any, index: number) => {
                        const isDomainChecked = !disabledItems.some(
                          (item) => item.domain === el.domain
                        );
                        return (
                          <label
                            className="fs-12 d-flex align-items-center justify-content-between mb-0"
                            key={index}
                            htmlFor="inline-checkbox1"
                          >
                            <div>
                              {el?.name ? el?.name : el?.domain} -{' '}
                              {el?.name && typeof el?.script === 'function'
                                ? ((window as any)?.aesirx_analytics_translate?.txt_scripts ??
                                  t('txt_scripts'))
                                : el?.domain
                                  ? ((window as any)?.aesirx_analytics_translate
                                      ?.txt_domain_path_based ?? t('txt_domain_path_based'))
                                  : ((window as any)?.aesirx_analytics_translate
                                      ?.txt_third_party_plugins ?? t('txt_third_party_plugins'))}
                            </div>
                            <div>
                              <Form.Check
                                inline
                                name={`domain-${key}-${index}`}
                                type="checkbox"
                                id={`domain-${key}-${index}`}
                                checked={isDomainChecked}
                                onChange={() => {
                                  handleCheckCustomize(key, el);
                                }}
                                disabled={key === 'essential' ? true : false}
                              />
                            </div>
                          </label>
                        );
                      })}
                    </Accordion.Body>
                  </Accordion.Item>
                );
              })}
          {window['aesirxOptOutMode'] === 'true' &&
          window['aesirxOptOutDoNotSell'] === 'true' &&
          isConsented ? (
            <Accordion.Item className="mt-3" eventKey={'donotsell'}>
              <div className="d-flex align-items-center justify-content-between">
                <Accordion.Header>
                  <div className="d-flex align-items-center">
                    <div className="accordion-title">
                      <div className="fw-medium text-black">
                        {(window as any)?.aesirx_analytics_translate?.txt_do_not_sell ??
                          t('txt_do_not_sell')}
                      </div>
                      <p className="mb-0 fs-14 d-none d-lg-block">
                        {(window as any)?.aesirx_analytics_translate?.txt_disables_third_party ??
                          t('txt_disables_third_party')}
                      </p>
                    </div>
                  </div>
                </Accordion.Header>
                <Form.Check
                  className="ms-auto me-0 pe-3"
                  type="switch"
                  value={'donotsell'}
                  onChange={(e) => {
                    setIsDoNotSell(e?.target?.checked);
                  }}
                />
              </div>
              <p className="mb-0 fs-14 subtitle-mobile d-lg-none">
                {(window as any)?.aesirx_analytics_translate?.txt_disables_third_party ??
                  t('txt_disables_third_party')}
              </p>
            </Accordion.Item>
          ) : (
            <></>
          )}
        </Accordion>
      </div>
      <div className="rounded-bottom position-relative overflow-hidden text-white bg-white">
        <div className="position-relative pt-2 pt-lg-3 p-3">
          <div className="d-flex align-items-center justify-content-between flex-wrap">
            <div className="d-flex w-100 flex-wrap flex-lg-nowrap justify-content-between">
              <Button
                variant="outline-success"
                onClick={() => {
                  setShowCustomize(false);
                }}
                className="d-flex align-items-center justify-content-center fs-14 px-5 me-3 mb-2 mb-lg-0 rounded-pill py-2 py-lg-3"
              >
                {(window as any)?.aesirx_analytics_translate?.txt_back ?? t('txt_back')}
              </Button>
              <Button
                variant="outline-success"
                onClick={async () => {
                  window['disabledBlockJSDomains'] = disabledItems;
                  if (window['aesirxOptOutMode'] === 'true' && isConsented) {
                    setIsLoading(true);
                    const levelRevoke =
                      sessionStorage.getItem('aesirx-analytics-revoke') &&
                      parseInt(sessionStorage.getItem('aesirx-analytics-revoke'));

                    if (isDoNotSell) {
                      sessionStorage.setItem('aesirx-analytics-rejected', 'true');
                      await handleRevokeBtn();
                    } else {
                      await postDisabledBlockDomains(endpoint);
                    }
                    if (levelRevoke <= 1 && window['aesirx1stparty']) {
                      setTimeout(() => {
                        window.location.reload();
                      }, 1000);
                    } else {
                      setShowCustomize(false);
                      setIsLoading(false);
                    }
                  } else {
                    setShowCustomize(false);
                  }
                }}
                className="d-flex align-items-center justify-content-center fs-14 px-5 me-3 mb-2 mb-lg-0 rounded-pill py-2 py-lg-3"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span
                    className="spinner-border spinner-border-sm me-1"
                    role="status"
                    aria-hidden="true"
                  ></span>
                ) : (
                  <></>
                )}
                {(window as any)?.aesirx_analytics_translate?.txt_save ?? t('txt_save')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
};

export { CustomizeCategory };
