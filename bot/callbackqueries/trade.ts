import { request_board } from "../keyboard";
import { MODULE_ADDR, INITIAL_VIRTUAL_APTOS_RESERVES, INITIAL_VIRTUAL_TOKEN_RESERVES, PLATFORM_FEE } from "../../utils/config";
import { addbuy, addsell } from "../../utils/portfolio";

import { aptos } from "../../leo-web3";
import {
  amountAddSlip,
  amountRemoveFee,
  displayAmount,
  getUtilAmountOut,
  parseAmount,
} from '../../utils/price';
import { swapToken, sellLsToken, panora_client } from "../../leo-service/swap";
import { getPool } from "../../utils/token";

export async function tradeCallbackQueries() {
  try {
  } catch (e) {
    console.log(e);
  }
}

const userPages: Record<number, number> = {};

export async function sendContent(ctx: any, pageNumber: number) {
  try {
    const chatId = ctx.chat?.id;
    if (!chatId) return;

    // Ensure page number is within bounds
    const signer = ctx.session.wallet_aptos;
    if (!signer) {
      await ctx.reply("Start the bot first");
      return;
    }   
    // Save the current page for the user
    userPages[chatId] = pageNumber;

    // Prepare content and buttons
    console.log("pageNumber: ", pageNumber)
    ctx.session.history = pageNumber;

    let portfolioMessage = `✨ <b>Token Information</b> ✨\n`    
    if ('callbackQuery' in ctx && ctx.callbackQuery) {
      await ctx.editMessageText(portfolioMessage, {
        reply_markup: request_board,
        parse_mode: "HTML"
      });
    }
  } catch (error: any) {
    console.log("His error: ", error)
    await ctx.reply(`Not Found: ${error}`)
  }
};

export async function buyToken(ctx: any, fromToken: any, buy_amount: any) {
  try {
    const signer = ctx.session.wallet_aptos;
    if (!signer) {
      await ctx.reply("Start the bot first");
      return;
    }
   
    const contractPool = await getPool(fromToken);

    let init_apt = INITIAL_VIRTUAL_APTOS_RESERVES;          
    let init_token = INITIAL_VIRTUAL_TOKEN_RESERVES;
    if(contractPool){
      init_apt = contractPool[3]; 
      init_token = contractPool[2];
    }          

    const amount_out = displayAmount(
      getUtilAmountOut(
        amountRemoveFee(
          parseAmount(buy_amount, 8),
          BigInt(PLATFORM_FEE as number)
        ),
        BigInt(init_apt as string),
        BigInt(init_token as string)
      ),
      6
    )

    const tokenAmount = parseAmount(amount_out, 6)

    try {
      if (!contractPool) {
        const wallet = ctx.session.wallet_aptos;
        if (!wallet) {
          await ctx.reply("Please set your wallet first");
          return;
        }
        const tx: any = await swapToken(
          wallet,
          Number(buy_amount),
          fromToken,
          ctx.session.config,
          ctx,
          6
        );

        await addbuy(
          signer.accountAddress.toString(),
          fromToken,
          Number(buy_amount),
          Number(parseAmount(amount_out, 6)),
        );

        let message_resp = `<b>Buy order placed for : \n
          <b>Hash :</b><code>${tx?.hash}</code>\n
          <a href="https://explorer.aptoslabs.com/txn/${tx?.hash}?network=mainnet">View on Explorer</a></b>`
        await ctx.reply(
          `${message_resp}`,
          {
            parse_mode: "HTML",
          }
        );
      } else {
        if (contractPool[5] == false) {
          try {
            const maxAptosIn = amountAddSlip(
              BigInt(parseAmount(buy_amount, 8)),
              BigInt(1)
            );
            const transaction = await aptos.transaction.build.simple({
              sender: signer.accountAddress,
              data: {
                function: `${MODULE_ADDR}::pump::buy`,
                typeArguments: [
                  fromToken as string,
                ],
                functionArguments: [
                  maxAptosIn + BigInt(100000000),
                  tokenAmount
                ],

              },
              options: {
              }
            });
            const [userTransactionResponse] = await aptos.transaction.simulate.simple({
              signerPublicKey: signer.publicKey,
              transaction,
            });
            console.log("Stimulate tx: ", userTransactionResponse)
            if (userTransactionResponse.success == false) {
              await ctx.reply(userTransactionResponse.vm_status)
              return
            }

            const senderAuthenticator = await aptos.transaction.sign({
              signer: signer,
              transaction
            });

            const submittedTransaction = await aptos.transaction.submit.simple({
              transaction,
              senderAuthenticator
            });


            const executedTransaction = await aptos.waitForTransaction({ transactionHash: submittedTransaction.hash });

            await addbuy(
              signer.accountAddress.toString(),
              fromToken,
              Number(maxAptosIn),
              Number(parseAmount(amount_out, 6)),
            );

            await ctx.reply(`Swap successful!\n` +
              `Transaction Hash: <code>${executedTransaction.hash}</code>\n` +
              `<code>${buy_amount}</code> $APT -> <code>${amount_out}</code> $${fromToken.split('::')[2]}`,
              { parse_mode: "HTML" });
          } catch (e: any) {
            console.log(e);
            await ctx.reply("Insufficient APT balance for transaction fee");
            if (e.message.includes("INSUFFICIENT_BALANCE_FOR_TRANSACTION_FEE")) {
              await ctx.reply("Insufficient APT balance for transaction fee");
            }
          }
        } else {
          const wallet = ctx.session.wallet_aptos;
          if (!wallet) {
            await ctx.reply("Please set your wallet first");
            return;
          }
          const tx: any = await swapToken(
            wallet,
            Number(buy_amount),
            fromToken,
            ctx.session.config,
            ctx,
            6
          );

          await addbuy(
            signer.accountAddress.toString(),
            fromToken,
            Number(buy_amount),
            Number(parseAmount(amount_out, 6)),
          );

          let message_resp = `<b>Buy order placed for : \n
            <b>Hash :</b><code>${tx?.hash}</code>\n
            <a href="https://explorer.aptoslabs.com/txn/${tx?.hash}?network=mainnet">View on Explorer</a></b>`
          await ctx.reply(
            `${message_resp}`,
            {
              parse_mode: "HTML",
            }
          );
        }
      }
    } catch (error) {
      console.log("Error buy x: ", error)
      await ctx.reply("Insufficient APT balance for transaction fee");
    }
    ctx.session.awaitingAmount = false;
  } catch (e) {
    console.log("Error tx: ", e)
    await ctx.reply("Insufficient APT balance for transaction fee");
    return
  }
  ctx.session.token = "";
  ctx.session.reply = false;
  ctx.session.input_tag = "";
  ctx.session.amount = "0";
}

export async function sellToken(ctx: any, fromToken: any, sell_percent: any) {
  try {
    const wallet = ctx.session.wallet_aptos;
    if (!wallet) {
      await ctx.reply("Start the bot first");
      return;
    }    

    let amount = await aptos.getAccountCoinAmount(
      {
        accountAddress: wallet.accountAddress,
        coinType: fromToken as `${string}::${string}::${string}`
      }
    )
    console.log("Amount token: ", amount)

    let token_info = await panora_client.getPrices({
      tokenAddress: [fromToken as `0x${string}`]
    });

    let sell_amount = amount / (10 ** Number(token_info[0]?.decimals))

    const contractPool = await getPool(fromToken);

    try {
      if (!contractPool) {
        const config = ctx.session.config;
        const tx: any = await sellLsToken(
          wallet,
          Number((sell_amount * Number(sell_percent) / Number(100)).toString()),
          fromToken,
          6,
          config,
          ctx
        );

        await addsell(
          wallet.accountAddress.toString(),
          fromToken,
          Number((sell_amount * Number(sell_percent) / Number(100)).toString()),
          sell_amount,
        );

        await ctx.reply(
          `<b>Sell order placed for : </b>\n
                <code>${fromToken}</code>  \n
                <b>Hash :</b><code>${tx?.hash}</code>\n
                <a href="https://explorer.aptoslabs.com/txn/${tx?.hash}?network=mainnet">View on Explorer</a>`,
          {
            parse_mode: "HTML",
          }
        );
      } else {
        if (contractPool[5] == false) {
          try {
            const maxAptosIn = amountAddSlip(
              BigInt(10000000000),
              BigInt(1)
            );

            const transaction = await aptos.transaction.build.simple({
              sender: wallet.accountAddress,
              data: {
                function: `${MODULE_ADDR}::pump::sell`,
                typeArguments: [
                  fromToken as string,
                ],
                functionArguments: [
                  Number(Math.floor(amount * Number(sell_percent) / Number(100))),
                  1
                ],

              },
              options: {}
            });
            const [userTransactionResponse] = await aptos.transaction.simulate.simple({
              signerPublicKey: wallet.publicKey,
              transaction,
            });
            if (userTransactionResponse.success == false) {
              await ctx.reply(userTransactionResponse.vm_status)
              return
            }

            const senderAuthenticator = await aptos.transaction.sign({
              signer: wallet,
              transaction
            });

            const submittedTransaction = await aptos.transaction.submit.simple({
              transaction,
              senderAuthenticator
            });

            const executedTransaction = await aptos.waitForTransaction({ transactionHash: submittedTransaction.hash });

            await addsell(
              wallet.accountAddress.toString(),
              fromToken,
              Number((sell_amount * Number(sell_percent) / Number(100)).toString()),
              sell_amount,
            );
            await ctx.reply(`Swap successful!\n` +
              `Transaction Hash: <code>${executedTransaction.hash}</code>\n` +
              `Sold: <code>${Number(Math.floor(amount * Number(sell_percent) / Number(100))) / 1e6}</code> $${fromToken.split('::')[2]}`,
              { parse_mode: "HTML" });
          } catch (e: any) {
            console.log(e);
            await ctx.reply("Insufficient APT balance for transaction fee");
            if (e.message.includes("INSUFFICIENT_BALANCE_FOR_TRANSACTION_FEE")) {
              await ctx.reply("Insufficient APT balance for transaction fee");
            }
          }

        } else {
          const config = ctx.session.config;
          const tx: any = await sellLsToken(
            wallet,
            Number((sell_amount * Number(sell_percent) / Number(100)).toString()),
            fromToken,
            6,
            config,
            ctx
          );

          await addsell(
            wallet.accountAddress.toString(),
            fromToken,
            Number((sell_amount * Number(sell_percent) / Number(100)).toString()),
            sell_amount,
          );

          await ctx.reply(
            `<b>Sell order placed for : </b>\n
                  <code>${fromToken}</code>  \n
                  <b>Hash :</b><code>${tx?.hash}</code>\n
                  <a href="https://explorer.aptoslabs.com/txn/${tx?.hash}?network=mainnet">View on Explorer</a>`,
            {
              parse_mode: "HTML",
            }
          );
        }
      }
    } catch (error: any) {
      await ctx.reply("Insufficient APT balance for transaction fee: ", error);
    }
    ctx.session.awaitingAmount = false;
  } catch (e) {
    console.log("Error tx: ", e)
    await ctx.reply("Insufficient APT balance for transaction fee");
    return
  }
  ctx.session.token = "";
  ctx.session.reply = false;
  ctx.session.input_tag = "";
  ctx.session.amount = "0";
}