import { db } from "../../utils/db";
import { bot } from "../../bot";
import { withdraw_apt } from "../keyboard";

export async function initializeInputs() {
  bot.on("message", async (ctx) => {
    const message = ctx.message;
    const token_address = message?.text as string;
    const wallet = ctx.session.wallet_leo;
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
  });
}
