import { InlineKeyboard } from "grammy";
import { accountFromMnemonic } from "../../leo-service/swap";
import { bot } from "../../bot";
import { storeChatAndUserId } from "../../utils/storechatid";
import { mainmenu_board } from "../keyboard";
import { aptos } from "../../leo-web3";
import { ethers } from "ethers";

export async function initializeCommands() {
  try {
    bot.api.setMyCommands([
      { command: "start", description: "Start the bot" },    
    ]);

    bot.command("start", async (ctx) => {
      console.log(new Date().getSeconds(), "start");
      ctx.session.history = 0;
      ctx.session.input_tag = ""
      ctx.session.reply = false
      ctx.session.token = ""
      const msg = ctx.message?.text.split(" ");
      if (msg?.length == 2) {
        ctx.session.ref = msg[1];
      }
      const mnm = await storeChatAndUserId(ctx);
      const wallet = await accountFromMnemonic(mnm);

      ctx.session.wallet_aptos = wallet;
      const balances = 0;      
      let board_message = `
      <b>Welcome to LeoBot 🎯
      \nWallet : <code>${wallet.address.toString()}</code>
      \nBalance : <code>${balances.toString()}</code>\n</b>` 
      await ctx.reply(
       `${board_message}`,
        {
          reply_markup: mainmenu_board,
          link_preview_options: {
            is_disabled: true,
          },
          parse_mode: "HTML",
        }
      );
    });    
       
  } catch (e) {
    console.log(e);
  }
}
