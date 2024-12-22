import { db } from "./db";
import { aptos } from "../leo-web3";

export interface PortfolioData {
  token: string;
  balance: number;
  history: {
    amount: number;
    timestamp: Date;
    type: "buy" | "sell";
  }[];
}

export async function addbuy(
  accountAddr: string,
  tokenAddr: string,
  fromAmount: number,
  toAmount: number,
) {
  await updatePortfolio(accountAddr, tokenAddr, toAmount, "buy");
}

export async function addsell(
  accountAddr: string,
  tokenAddr: string,
  fromAmount: number,
  toAmount: number,
) {
  await updatePortfolio(accountAddr, tokenAddr, toAmount, "sell");
}

export async function updatePortfolio(
  accountAddr: string,
  tokenAddr: string,
  tokenAmount: number,
  operation: "buy" | "sell",
) {
  const portfolio_ = await db
    .collection("aptossniper_portfolio")
    .doc(accountAddr)
    .get();
  const portfolio = portfolio_.data();

  const balance = await getAccountTokenBalance(accountAddr, tokenAddr);
  // remove token from portfolio if any
  if (balance == 0) {
    if (portfolio && portfolio[tokenAddr]) {
      delete portfolio[tokenAddr];
      await db
        .collection("aptossniper_portfolio")
        .doc(accountAddr)
        .set(portfolio);
    }

    return;
  }

  // has balance, update token to portfolio
  if (portfolio && portfolio[tokenAddr]) {
    await db
      .collection("aptossniper_portfolio")
      .doc(accountAddr)
      .update({
        [tokenAddr]: {
          balance,
          history: [
            ...portfolio[tokenAddr].history,
            {
              amount: tokenAmount,
              timestamp: new Date(),
              type: operation,
            },
          ],
        },
      });
  }

  // has balance, add token to portfolio
  await db
    .collection("aptossniper_portfolio")
    .doc(accountAddr)
    .set({
      ...(portfolio || {}), // spread syntax safety if portfolio is undefined
      [tokenAddr]: {
        token: tokenAddr,
        balance,
        history: [
          {
            amount: tokenAmount,
            timestamp: new Date(),
            type: operation,
          },
        ],
      }
    });
}

export async function getPortfolio(accountAddr: string): Promise<PortfolioData[]> {
  const portfolio_ = await db
    .collection("aptossniper_portfolio")
    .doc(accountAddr)
    .get();
  const portfolio = portfolio_.data();

  if (!portfolio || portfolio.length == 0) return [];

  return Object.keys(portfolio).map((token) => portfolio[token]);
}

async function getAccountTokenBalance(accountAddr: string, tokenAddr: string): Promise<number> {
  return await aptos.getAccountCoinAmount({
    accountAddress: accountAddr,
    coinType: tokenAddr as `${string}::${string}::${string}`,
  })
}
