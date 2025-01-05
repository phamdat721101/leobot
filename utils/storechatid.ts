import { db } from "./db";
import { generateWallet } from "../leo-service/wallet";
import { decryptPrivateKey, encryptPrivateKey } from "./encryption";
import { cache } from "./cache";
import axios from "axios";

const TELEGRAM_BOT_API_URL = `https://api.telegram.org/bot${process.env.BOT_KEY}`;

export async function storeDataInTelegramCloud(chatId: string, data: string, fileName: string = "data.txt"): Promise<void> {
  try {
      // Convert data to a file (Blob)
      const blob = new Blob([data], { type: "text/plain" });
      const formData = new FormData();
      formData.append("chat_id", chatId);
      formData.append("document", blob, fileName);

      // Send the file to Telegram's cloud storage (Saved Messages)
      const response = await axios.post(`${TELEGRAM_BOT_API_URL}/sendDocument`, formData, {
          headers: {
              "Content-Type": "multipart/form-data",
          },
      });

      if (response.data.ok) {
          console.log("Data stored in Telegram cloud successfully.");
      } else {
          throw new Error("Failed to store data in Telegram cloud.");
      }
  } catch (error) {
      console.error("Error storing data in Telegram cloud:", error);
      throw error;
  }
}

export async function retrieveDataFromTelegramCloud(chatId: string, fileName: string = "data.txt"): Promise<string | null> {
  try {
      // Get the latest message from the chat
      const response = await axios.get(`${TELEGRAM_BOT_API_URL}/getUpdates`, {
          params: {
              chat_id: chatId,
              limit: 1,
          },
      });

      console.log("Resp re: ", response.data.result[0].message.chat)

      if (response.data.ok && response.data.result.length > 0) {
          const message = response.data.result[0].message;
          if (message.document && message.document.file_name === fileName) {
              // Download the file
              const fileResponse = await axios.get(`${TELEGRAM_BOT_API_URL}/getFile`, {
                  params: {
                      file_id: message.document.file_id,
                  },
              });

              if (fileResponse.data.ok) {
                  const fileUrl = `https://api.telegram.org/file/bot${process.env.BOT_KEY}/${fileResponse.data.result.file_path}`;
                  const fileData = await axios.get(fileUrl);
                  return fileData.data;
              }
          }
      }

      console.log("No data found in Telegram cloud.");
      return null;
  } catch (error) {
      console.error("Error retrieving data from Telegram cloud:", error);
      throw error;
  }
}


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
