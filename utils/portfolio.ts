import { db } from "./db";

export interface PortfolioData {
  token: string;
  balance: number;
  history: {
    amount: number;
    timestamp: Date;
    type: "buy" | "sell";
  }[];
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

