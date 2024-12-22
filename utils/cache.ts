import NodeCache from "node-cache";
import { db } from "./db";
import { bot } from "../bot";

export const cache = new NodeCache();

export async function initcache() {
  const usersPromise = db.collection("aptossniper_users").get();
  const configPromise = db.collection("aptossniper_config").get();
  const portfolioPromise = db.collection("aptossniper_portfolio").get();
  // const referalPromise = db.collection("aptossniper_referal").get();

  const [users_, config_, portfolio_] = await Promise.all([
    usersPromise,
    configPromise,
    portfolioPromise,
    // referalPromise,
  ]);

  const users = users_.docs.map((doc) => doc.data());
  const config = config_.docs.map((doc) => doc.data());
  const portfolio = portfolio_.docs.map((doc) => doc.data());
  // const referal = referal_.docs.map((doc) => doc.data());
  cache.set("users", users);
  cache.set("config", config);
  cache.set("portfolio", portfolio);
  // cache.set("referal", referal);
  users.forEach((user: any) => {
    const cacheData = {
      userData: user,
      portfolio: portfolio_.docs.find((doc) => doc.id == user.userId)?.data(),
      // referal: referal_.docs.find((doc) => doc.id == user.userId)?.data(),
      config: config_.docs.find((doc) => doc.id == user.userId)?.data(),
    };
    // console.log("Cache data", cacheData);
    cache.set(user.userId, cacheData);
  });

  bot.start();
}
// Call initcache every 1 hour

// // Get a value from the cache
// const cachedValue = cache.get('key');
// console.log(cachedValue); // Output: value

// // Check if a key exists in the cache
// const keyExists = cache.has('key');
// console.log(keyExists); // Output: true

// // Delete a key from the cache
// const deleted = cache.del('key');
// console.log(deleted); // Output: true

// // Clear the entire cache
// cache.flushAll();
