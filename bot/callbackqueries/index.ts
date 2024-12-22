import { bot } from "../../bot";
import { mainmenu_board, request_board, setting_board } from "../keyboard";
import { getVtoken, mintVmanta } from "../../utils/token";

// Define types for our data structure
interface HolderInfo {
  name: string;
  holders: number;
  unique_id: string;
  network: string;
  url: string;
}

interface VDOTData {
  apy: string;
  apyBase: string;
  apyReward: string;
  tvl: number;
  tvm: number;
  totalIssuance: number;
  holders: number;
  holdersList: HolderInfo[];
}

interface Data {
  tvl: number;
  addresses: number;
  revenue: number;
  vDOT: VDOTData;
}

// Sample data (replace this with your actual data source)
const data: Data = {
  tvl: 128783099,
  addresses: 89168,
  revenue: 3886150,
  vDOT: {
    apy: "15.34",
    apyBase: "15.17",
    apyReward: "0.17",
    tvl: 74398732.4975793,
    tvm: 7072122.86098662,
    totalIssuance: 4940953.70767365,
    holders: 4455,
    holdersList: [
      {
        name: "vDOT",
        holders: 2551,
        unique_id: "asset_registry/9658598ef1eace56a0662d4a067a260e42b36f2a",
        network: "bifrost",
        url: "https://bifrost.subscan.io/custom_token?unique_id=asset_registry/9658598ef1eace56a0662d4a067a260e42b36f2a"
      },
    ]
  }
};

export async function initiateCallbackQueries() {
  try {
    bot.callbackQuery("main", async (ctx) => {
      ctx.session.history = 0;
      ctx.session.input_tag = ""
      ctx.session.reply = false
      ctx.session.token = ""
      const wallet = ctx.session.wallet_aptos;
      if (!wallet) {
        await ctx.reply("Start the bot first");
        return;
      }
      let board_message = `
      <b>Welcome to LeoBot 🎯\n
      To get started DEFI, and you will see a dashboard pop up.
      __________\n</b>\n`
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
    bot.callbackQuery("setting_wallet", async (ctx) => {
      if (!ctx.session.wallet_aptos) {
        await ctx.reply("Please start the bot first");
        return;
      }

      await ctx.reply(
        "Wallet Management",
        {

          reply_markup: setting_board,
          parse_mode: "HTML",
        }
      );

    });
    bot.callbackQuery("export_seed_phrase", async (ctx) => {
      const wallet = ctx.session.wallet_aptos;
      if (!wallet) {
        await ctx.reply("Please start the bot first");
        return;
      }

      const msg = await ctx.reply(`<b>Your Wallet:</b> \n<code>${wallet.address.toString()}</code>\n\n<b>Private Key:</b> \n<code>${wallet.privateKey.toString()}</code>\n\n<b>Save it somewhere,this message will self destruct in 10s</b>`,
        {
          parse_mode: "HTML",
        }
      );

      setTimeout(async () => {
        await ctx.api.deleteMessage(ctx.chat?.id as number, msg.message_id);
      }, 10000);
    })
    bot.callbackQuery("stake", async (ctx) =>{
      const message = `
      💰 <b>Current Earning Opportunities</b>

      🔄 Last update: 2024-12-12 14:05

      1️⃣ <b>Shoebill Finance</b>
      📈 Est. APY: 20.14%

      2️⃣ <b>Gull Network</b>
      📈 Est. APY: 18.60%

      3️⃣ <b>Monroe</b>
      📈 Est. APY: 15%

      ℹ️ <i>APY rates are subject to change. DYOR before investing.</i>`;

      await ctx.reply(message, {
        reply_markup: request_board,
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true }
      });
    })
    bot.callbackQuery("vdot", async (ctx) =>{
      const vdotData = data.vDOT;
      let message = `
        <b>vDOT Statistics:</b>\n
        <b>APY:</b> ${vdotData.apy}%\n
        <b>Base APY:</b> ${vdotData.apyBase}%\n
        <b>Reward APY:</b> ${vdotData.apyReward}%\n
        <b>TVL:</b> $${vdotData.tvl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n
        <b>TVM:</b> $${vdotData.tvm.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n
        <b>Total Issuance:</b> ${vdotData.totalIssuance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n
        <b>Total Holders:</b> ${vdotData.holders.toLocaleString()}\n\n
        <b>Holders by Network:</b>\n
        `;

      for (const holder of vdotData.holdersList) {
        message += `<b>${holder.network.charAt(0).toUpperCase() + holder.network.slice(1)}:</b> ${holder.holders.toLocaleString()} holders\n`;
        message += `More info: <a href="${holder.url}">${holder.url}</a>\n\n`;
      }

      await ctx.reply(message, {
        reply_markup: request_board,
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true }
      });
    })
    bot.callbackQuery("vManta", async (ctx) =>{      
      let mantaResp = await mintVmanta(ctx)
      console.log("Manta resp: ", mantaResp)
    })
    bot.callbackQuery("trade_board", async (ctx) => {
      const wallet = ctx.session.wallet_aptos;
      if (!wallet) {
        await ctx.reply("Start the bot first");
        return;
      }

      const vManta = await getVtoken(wallet.address, "0x7746ef546d562b443AE4B4145541a3b1a3D75717", "https://manta-pacific.drpc.org")
      
      const portfolioMessage = `
      📊 <b>Overall Statistics:</b>\n
      👥 <b>Addresses:</b> <code>${wallet.address.toLocaleString()}</code>\n
      💰 <b>Vmanta Balance:</b> $${vManta.toLocaleString()}\n`;

      await ctx.reply(portfolioMessage, {
        reply_markup: request_board,
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true }
      });
    });
    bot.callbackQuery("wallet_address", async (ctx) => {
      await ctx.reply("Enter the wallet address: ");
      ctx.session.reply = true;
      ctx.session.input_tag = "wallet_address";
    });

  } catch (e) {
    console.log(e);
  }
}
