import { SDK } from "@pontem/liquidswap-sdk";
import {
  Aptos,
  AptosConfig,
  Ed25519Account,
  Network,
} from "@aptos-labs/ts-sdk";

export let pontemSdk = null as unknown as SDK;
export let aptos = null as unknown as Aptos;

export function rpcConfig() {
  // let pontemSdk: SDK;
  let aptosConfig: AptosConfig;
  switch (process.env.NETWORK) {
    case "mainnet":
      pontemSdk = new SDK({ nodeUrl: "https://rpc.ankr.com/http/aptos/v1" });
      aptosConfig = new AptosConfig({ network: Network.MAINNET });
      break;
    case "testnet":
      pontemSdk = new SDK({ nodeUrl: "https://fullnode.testnet.aptoslabs.com/v1" });
      aptosConfig = new AptosConfig({ network: Network.TESTNET });
      break;
    default:
      pontemSdk = new SDK({ nodeUrl: "https://rpc.ankr.com/http/aptos/v1" });
      aptosConfig = new AptosConfig({ network: Network.MAINNET });
      break;
  }

  aptos = new Aptos(aptosConfig);
}
export async function reqFaucet(signer: Ed25519Account) {
  const tx = await aptos.transaction.build.simple({
    sender: signer.accountAddress,
    data: {
      function:
        "0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::faucet::request",
      typeArguments: [
        "0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::coins::BTC",
      ],
      functionArguments: [
        "0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9",
      ],
    },
  });

  const committedTransaction = await aptos.signAndSubmitTransaction({
    signer: signer,
    transaction: tx,
  });
  console.log(committedTransaction);
}
export async function fundFaucet(address: string) {
  aptos.faucet.fundAccount({
    accountAddress: address,
    amount: 100000000000,
    options: {
      timeoutSecs: 600,
    },
  });
}
