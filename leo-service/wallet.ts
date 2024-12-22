import * as bip39 from "bip39";
import { accountFromMnemonic } from "./swap";
import { aptos } from "../leo-web3";
import { MyContext } from "../bot";
import { ethers } from "ethers";

export async function generateWallet() {
  let mnemonic = bip39.generateMnemonic();
  let wallet: any;

  try {
    wallet = await ethers.Wallet.fromPhrase(mnemonic);
  } catch (e) {
    console.log(e);
    mnemonic = await bip39.generateMnemonic();
    wallet = await ethers.Wallet.fromPhrase(mnemonic);
  }

  return { wallet: wallet.address, mnemonic };
}

export async function getAccountBalances(ctx: MyContext) {
  try {
    const balances = await aptos.getAccountCoinsData({
      accountAddress:
        ctx.session.wallet_aptos?.accountAddress.toString() as string,
    });

    ctx.session.balances = balances;
    return balances;
  } catch (e) {
    console.log(e);
    return [];
  }
}
