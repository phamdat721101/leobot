import { bytesToHex } from "../utils/cryptography";
import { derivePath } from "ed25519-hd-key";
import * as bip39 from "@scure/bip39";

import { ethers } from "ethers";

const path = "m/44'/637'/0'/0'/0'";

export async function accountFromMnemonic(mnemonic: string) {
  const normalizeMnemonics = mnemonic
    .trim()
    .split(/\s+/)
    .map((part) => part.toLowerCase())
    .join(" ");

  const seed = bytesToHex(bip39.mnemonicToSeedSync(normalizeMnemonics));
  const { key } = derivePath(path, seed);
  const privateKeyBytes = new Uint8Array(key);
  const wallet = await ethers.Wallet.fromPhrase(mnemonic);
  return wallet;
}