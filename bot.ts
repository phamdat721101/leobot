require("dotenv").config();

import { Bot, Context, session, SessionFlavor } from "grammy";
import { Ed25519Account } from "@aptos-labs/ts-sdk";
import { initializeCommands } from "./bot/commands";
import { initiateCallbackQueries } from "./bot/callbackqueries";
import { initializeInputs } from "./bot/input";
import { rpcConfig } from "./leo-web3";
import { initcache } from "./utils/cache";

interface SessionData {
  amount: string;
  amount_withdraw: string;
  token: string;
  balances: any;
  ref?: string;
  limit_price: string;
  wallet: string;
  input_tag: string;
  reply: boolean;
  sequence_number: number;
  currentmsg: number;
  currentchatid: number;
  userid: string;
  percentage?: string;
  config: {
    gasLimit: string;
    slippage: string;
    gasPricedelta: string;
  };
  wallet_aptos: any;
  costum_amount: boolean;
  address: string;
  sessionset: boolean;
  awaitingAmount: boolean;
  history: number;
  rpc_url: string;
}
export type MyContext = Context & SessionFlavor<SessionData>;
let reply = false;
let input_tag: any = "";
export const bot = new Bot<MyContext>(process.env.BOT_KEY as string);
function initial(): SessionData {
  return {
    amount: "0",
    amount_withdraw: "0",
    token: "",
    limit_price: "",
    balances: [],
    wallet: "",
    input_tag: "",
    reply: false,
    wallet_aptos: null,
    sequence_number: 0,
    userid: "",
    currentmsg: 0,
    percentage: "0.5",
    currentchatid: 0,
    config: {
      gasLimit: "20000",
      slippage: "5",
      gasPricedelta: "3",
    },
    address: "",
    sessionset: false,
    costum_amount: false,
    awaitingAmount: false,
    history: 0,
    rpc_url: "https://manta-pacific.drpc.org"
  };
}
bot.use(session({ initial }));
try {
  rpcConfig();
  initializeCommands();
  initiateCallbackQueries();
  initializeInputs();
  // initcache();
} catch (e) {
  console.log(e);
}

bot.start()