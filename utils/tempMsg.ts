import { MyContext } from "../bot";

let tempmsgId = 0;

export async function sendTempMsg(ctx: MyContext, message: string) {
  // if (tempmsgId !== 0) {
  //   ctx.api.deleteMessage(ctx.session.currentchatid, tempmsgId);
  // }
  const msg = await ctx.reply(`Status : ${message}`);
  tempmsgId = msg.message_id;
}
