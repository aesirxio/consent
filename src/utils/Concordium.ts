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
    setProof(false);
    setLoading && setLoading(false);
    return false;
  }
};

const getChallenge = async (walletAccount: string) => {
  try {
    return (await axios.get(`${window['web3Endpoint']}/challenge?account=${walletAccount}`)).data
      ?.challenge;
  } catch (error: any) {
    console.log('getChallenge', error);
    throw error;
  }
};

const getStatement = async () => {
  try {
    return (await axios.get(`${window['aesirx1stparty']}/statement`)).data;
  } catch (error: any) {
    console.log('getChallenge', error);
    throw error;
  }
};

export { invokeSmartContract, getWeb3ID, handleProof, getStatement };
