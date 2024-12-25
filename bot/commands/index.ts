import { InlineKeyboard } from "grammy";
import { accountFromMnemonic } from "../../leo-service/swap";
import { bot } from "../../bot";
import { storeChatAndUserId } from "../../utils/storechatid";
import { mainmenu_board } from "../keyboard";
import { aptos } from "../../leo-web3";
import { ethers } from "ethers";
import { getVtoken } from "../../utils/token";
import { util } from "@google-cloud/storage/build/cjs/src/nodejs-common";

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

      const mantaBalance = await getVtoken(wallet.address, "0x95CeF13441Be50d20cA4558CC0a27B601aC544E5", "https://manta-pacific.drpc.org")
      const vMantaBalance = await getVtoken(wallet.address, "0x7746ef546d562b443AE4B4145541a3b1a3D75717", "https://manta-pacific.drpc.org")
      
      const provider = new ethers.JsonRpcProvider("https://manta-pacific.drpc.org")
      const weiBalance = await provider.getBalance(wallet.address)
      const ethBalance = await ethers.formatEther(weiBalance)

      let board_message = `
      <b>Welcome to LeoBot 🎯
      \nWallet : <code>${wallet.address.toString()}</code>
      \nManta Balance : <code>${mantaBalance.toString()}</code>
      \nVManta Balance : <code>${vMantaBalance.toString()}</code>
      \nETH Balance : <code>${ethBalance.toString()}</code>\n</b>` 
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
