import * as bip39 from "bip39";
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
