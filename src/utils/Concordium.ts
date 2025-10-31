import {
  AccountAddress,
  ContractAddress,
  deserializeReceiveReturnValue,
  ReceiveName,
  ReturnValue,
  SchemaVersion,
  ConcordiumGRPCClient,
  ContractName,
  EntrypointName,
} from '@concordium/web-sdk';
import { NFT_SMARTCONTRACT, NFT_SMARTCONTRACT_TESTNET } from './config';
import axios from 'axios';

const invokeSmartContract = async (
  account: any,
  name: any,
  index: any,
  subIndex: any,
  schema: any,
  method: any,
  rpcClient: ConcordiumGRPCClient
) => {
  try {
    const res = await rpcClient.invokeContract({
      invoker: AccountAddress.fromBase58(account),
      method: ReceiveName.fromString(`${name}.${method}`),
      contract: ContractAddress.create(index, subIndex),
    });

    if (!res || res.tag === 'failure' || !res.returnValue) {
      throw new Error(
        `RPC call 'invokeContract' on method '${name}.view' of contract '${method}' failed`
      );
    }
    const returnValue = await deserializeReceiveReturnValue(
      ReturnValue.toBuffer(res.returnValue),
      window['aesirxBuffer'].from(schema, 'base64'),
      ContractName.fromString(name),
      EntrypointName.fromString(method),
      SchemaVersion.V2
    );

    console.log('invokeSmartContract', returnValue);

    return returnValue;
  } catch (error: any) {
    console.log('invokeSmartContract error', error);
    return null;
  }
};

const getWeb3ID = async (account: string, gRPCClient: ConcordiumGRPCClient, network: any) => {
  try {
    const dataNFT = await invokeSmartContract(
      account,
      network === 'testnet' ? NFT_SMARTCONTRACT_TESTNET.name : NFT_SMARTCONTRACT.name,
      network === 'testnet' ? NFT_SMARTCONTRACT_TESTNET.index : NFT_SMARTCONTRACT.index,
      network === 'testnet' ? NFT_SMARTCONTRACT_TESTNET.subIndex : NFT_SMARTCONTRACT.subIndex,
      network === 'testnet' ? NFT_SMARTCONTRACT_TESTNET.schema : NFT_SMARTCONTRACT.schema,
      'view',
      gRPCClient
    );
    const nft = dataNFT?.state?.find((arrVal: any) => account === arrVal[0]?.Account[0]);
    if (nft) {
      const tokens = nft[1]['owned_tokens'];
      if (tokens) {
        return true;
      }
    }
  } catch (error) {
    return false;
  }

  return false;
};

const handleProof = async (account: string, setLoading: any, setProof: any, connection: any) => {
  setLoading && setLoading(true);
  try {
    const challenge = await getChallenge(account ?? '');
    const statement = await getStatement();
    const testStatement = [
      {
        statement: statement,
        idQualifier: {
          type: 'cred',
          issuers: [0, 1, 3, 4],
        },
      },
    ];
    const presentation = await connection.requestVerifiablePresentation(challenge, testStatement);
    if (presentation) {
      setProof(true);
      setLoading && setLoading(false);
    }
    return true;
  } catch (error) {
    console.error('error', error);
    setProof(false);
    setLoading && setLoading(false);
    return false;
  }
};

const getChallenge = async (walletAccount: string) => {
  try {
    const endpoint = window['web3Endpoint'] ?? 'https://web3id.backend.aesirx.io:8001';
    return (await axios.get(`${endpoint}/challenge?account=${walletAccount}`)).data?.challenge;
  } catch (error: any) {
    console.log('getChallenge', error);
    throw error;
  }
};

const getStatement = async () => {
  const response = [];

  const ageCheck = window['ageCheck'];
  const countryCheck = window['countryCheck'];
  const minimumAge = window['minimumAge'] ?? 0;
  const maximumAge = window['maximumAge'] ?? 150;
  const allowedCountries = window['allowedCountries'] ?? [];
  const disallowedCountries = window['disallowedCountries'] ?? [];

  // Country check
  if (countryCheck) {
    let countrySet = [];
    let type = '';

    if (allowedCountries.length > 0) {
      countrySet = allowedCountries;
      type = 'AttributeInSet';
    } else if (disallowedCountries.length > 0) {
      countrySet = disallowedCountries;
      type = 'AttributeNotInSet';
    }

    if (countrySet.length > 0) {
      response.push({
        type: type,
        attributeTag: 'nationality',
        set: countrySet,
      });
    }
  }

  // Age check
  if (ageCheck) {
    const today = new Date();

    const lowerDateObj = new Date(today);
    lowerDateObj.setFullYear(lowerDateObj.getFullYear() - maximumAge);
    const lowerDate = formatDate(lowerDateObj);

    const upperDateObj = new Date(today);
    upperDateObj.setFullYear(upperDateObj.getFullYear() - minimumAge);
    const upperDate = formatDate(upperDateObj);

    response.push({
      type: 'AttributeInRange',
      attributeTag: 'dob',
      lower: lowerDate,
      upper: upperDate,
    });
  }
  return response;
};

function formatDate(date: any) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

export { invokeSmartContract, getWeb3ID, handleProof, getStatement };
