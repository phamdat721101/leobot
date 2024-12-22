import { InlineKeyboard } from "grammy";
import { db } from "../../utils/db";
import { bot } from "../../bot";
import { withdraw_apt } from "../keyboard";
import { buyToken } from "../callbackqueries/trade";

export async function initializeInputs() {
  bot.on("message", async (ctx) => {
    const message = ctx.message;
    const token_address = message?.text as string;
    const wallet = ctx.session.wallet_aptos;
    if (!wallet) {
      await ctx.reply("Start the bot first");
      return;
    }
    if (/^[\w]+::[\w]+::[\w]+$/.test(token_address)) {
      ctx.session.token = token_address;
    }

    if (!/^0x[a-fA-F0-9]{64}$/.test(token_address)) {
      console.log("Withdraw: ", token_address)
      ctx.session.amount_withdraw = token_address;
    }

    try {
      if (ctx.session.reply == true) {
        const message = ctx.message;
        const input_tag = ctx.session.input_tag;
        let configs = ctx.session.config;
        const [token_addr, token_module, token_name] = ctx.session.token.split('::');
        switch (input_tag) {        
          case "buy_5_apt":
            buyToken(ctx, ctx.session.token, "5")
            break;                              
          case "gasLimit":
            const gasLimit = message?.text as string;
            if (
              isNaN(Number(gasLimit)) ||
              Number(gasLimit) < 0 ||
              !Number.isInteger(Number(gasLimit))
            ) {
              await ctx.reply(
                "Invalid gas limit. Please enter a positive integer."
              );
              break;
            }
            await db
              .collection("aptossniper_configs")
              .doc(String(String(ctx.message?.from?.id)))
              .set(
                {
                  ...configs,
                  gasLimit: gasLimit,
                },
                { merge: true }
              );
            ctx.session.config = {
              ...configs,
              gasLimit: gasLimit,
            };
            await ctx.reply(`Gas limit set to ${gasLimit}`, {
              reply_markup: new InlineKeyboard().text("Main menu  🔙", "main"),
            });
            ctx.session.reply = false;
            ctx.session.input_tag = "";
            break;
          case "slippage":
            const slippage = message?.text as string;
            if (
              isNaN(Number(slippage)) ||
              Number(slippage) < 0 ||
              !Number.isInteger(Number(slippage))
            ) {
              await ctx.reply(
                "Invalid slippage. Please enter a positive integer."
              );
              break;
            }
            await db
              .collection("aptossniper_configs")
              .doc(String(ctx.message?.from?.id))
              .set(
                {
                  ...configs,
                  slippage: slippage,
                },
                { merge: true }
              );
            ctx.session.config = {
              ...configs,
              slippage: slippage,
            };
            await ctx.reply(`Slippage set to ${slippage}`, {
              reply_markup: new InlineKeyboard().text("Main menu  🔙", "main"),
            });
            ctx.session.reply = false;
            ctx.session.input_tag = "";
            break;                                       
          case "withdraw_address":
            const address = message?.text as string;
            ctx.session.address = address;

            await ctx.reply(
              `<b>Confirm Withdraw</b>\n${ctx.session.amount} of APT withdraw to recipient address <code>${address}</code>\n`,
              {
                reply_markup: withdraw_apt,
                parse_mode: "HTML",
              }
            );
            ctx.session.reply = false;
            ctx.session.input_tag = "";
            break;
        }
      }
    } catch (e) {
      console.log(e);
    }
  });
}
