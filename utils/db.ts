import { initializeApp, getApps } from "firebase-admin/app";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { FIREBASE_KEY } from "./config";

// const serviceAccount = FIREBASE_KEY || "";
const serviceAccount = require('../leo-bot.json');

const apps = getApps();
if (!apps.length) {
  initializeApp({
    credential: admin.credential.cert(
      serviceAccount
    ),
  });
}

export const db = getFirestore();

async function getDocument(chatId: string) {
  const docRef = db.collection("aptossniper_users").doc(chatId);

  try {
    const doc = await docRef.get();

    if (!doc.exists) {
      console.log("No such document!");
    } else {
      console.log("Document data:", doc.data());
    }
  } catch (error) {
    console.log("Error getting document:", error);
  }
}
