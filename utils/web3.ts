import { bytesToHex } from "./cryptography";
import { derivePath } from "ed25519-hd-key";
import * as bip39 from "@scure/bip39";
import { Account, Ed25519Account, Ed25519PrivateKey } from "@aptos-labs/ts-sdk";

const path = "m/44'/637'/0'/0'/0'";

export function accountFromMnemonic(mnemonic: string) {
  const seed = bytesToHex(bip39.mnemonicToSeedSync(mnemonic));
  const { key } = derivePath(path, seed);
  const privateKeyBytes = new Uint8Array(key);

  const privateKey = new Ed25519PrivateKey(privateKeyBytes);
  const account = Account.fromPrivateKey({ privateKey });
  return account;
}