import { db } from "./db";
import { generateWallet } from "../leo-service/wallet";
import { decryptPrivateKey, encryptPrivateKey } from "./encryption";
import { cache } from "./cache";

export async function storeChatAndUserId(ctx: any) {
  const { message } = ctx;
  const chatId = message?.chat?.id;
  const userId = message?.chat?.id;
  ctx.session.userid = String(userId);
  let mnemonic = "";
  if (chatId && userId) {
    // const user_cache: any = cache.get("users");
    const user = await db.collection("aptossniper_users").doc(chatId.toString()).get();
    // let user = user_cache.find((user: any) => user.chatId == chatId);

    if (user && user?.data()?.encryptedmnemonic) {
      console.log("User: ", user?.data()?.encryptedmnemonic, " -id: ", chatId.toString())
      if (user?.ref) {
        ctx.session.ref = user?.ref;
      }
      let encryptedmnemonic = user?.data()?.encryptedmnemonic || ""
      mnemonic = decryptPrivateKey(encryptedmnemonic);
    } else {
      const user_exists = await db
        .collection("aptossniper_users")
        .doc(chatId.toString())
        .get();
      if (user_exists.exists) {
        const user = user_exists.data();
        if (user_exists?.ref) {
          ctx.session.ref = user_exists?.ref;
        }
        mnemonic = decryptPrivateKey(user?.encryptedmnemonic);
      } else {
        const wallet = await generateWallet();
        mnemonic = wallet.mnemonic;
        const encryptedmnemonic = encryptPrivateKey(wallet.mnemonic);
        await db
          .collection("aptossniper_users")
          .doc(chatId.toString())
          .set(
            {
              chatId,
              userId,
              encryptedmnemonic: encryptedmnemonic,
              wallet: wallet.wallet.toString(),
              ref: ctx.session.ref ?? "",
            },
            { merge: true }
          );
        if (ctx.session.ref) {
          const ref = await db
            .collection("aptossniper_referal")
            .doc(ctx.session.ref)
            .get();
          const ref_data = ref.data();
          await db
            .collection("aptossniper_referal")
            .doc(ctx.session.ref)
            .set(
              {
                ref: ref_data?.ref ? ref_data?.ref + 1 : 1,
                refAmount: ref_data?.refAmount ? ref_data?.refAmount : 0,
              },
              { merge: true }
            );
        }
        cache.set(userId, {
          userData: {
            chatId,
            userId,
            encryptedmnemonic: encryptedmnemonic,
            wallet: wallet.wallet.toString(),
            ref: ctx.session.ref,
          },
        });
      }
    }
  }
  return mnemonic;
}
