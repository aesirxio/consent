async function requestDigitalCreds(
  requestedProtocol: string,
  doctype: string,
  requestedMdocAttributes: any,
  transactionData = null,
  issuanceOffer = null,
  vct_values = null,
  dcql_query = null
) {
  const request = await getRequest(
    requestedProtocol,
    doctype,
    requestedMdocAttributes,
    transactionData,
    issuanceOffer,
    vct_values,
    dcql_query
  );
  try {
    const credentialResponse: any = await navigator.credentials.get({
      digital: {
        requests: [
          {
            protocol: request['protocol'],
            data: request['request'],
          },
        ],
      },
    } as any);
    if (credentialResponse?.constructor.name == 'DigitalCredential') {
      const data = credentialResponse.data;
      const protocol = credentialResponse.protocol;
      const responseForServer = {
        protocol: protocol,
        data: data,
        state: request['state'],
        origin: location.origin,
      };
      const serverResponse = await callServer('validateResponse', responseForServer);
      return serverResponse;
    } else if (credentialResponse?.constructor.name == 'IdentityCredential') {
      const data = credentialResponse.token;
      const protocol = requestedProtocol;
      const responseForServer = {
        protocol: protocol,
        data: data,
        state: request['state'],
        origin: location.origin,
      };
      const serverResponse = await callServer('validateResponse', responseForServer);
      return serverResponse;
    } else {
      throw 'Unknown response type';
    }
  } catch (err) {
    alert(err);
  }
}
async function callServer(cmd, params) {
  const config = {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  };
  const response = await fetch('https://aesirx.io/api/services/googleWallet/' + cmd, config);
  return await response.json();
}
async function getRequest(
  requestedProtocol: string,
  doctype: string,
  requestedMdocAttributes: string,
  transactionData = null,
  issuanceOffer = null,
  vct_values = null,
  dcql_query = null
) {
  const params = { protocol: requestedProtocol, doctype: doctype, attrs: requestedMdocAttributes };
  if (transactionData != null) {
    params['transaction_data'] = transactionData;
  }
  if (issuanceOffer != null) {
    params['issuance_offer'] = issuanceOffer;
  }
  if (vct_values != null) {
    params['vct_values'] = vct_values;
  }
  if (dcql_query != null) {
    params['dcql_query'] = dcql_query;
  }

  const request = await callServer('getRequest', params);

  return request;
}

export { requestDigitalCreds };
