export const FIREBASE_KEY = process.env.FIREBASE_KEY
export const ADMIN_ADDR = process.env.ADMIN_ADDR
export const PLATFORM_FEE = process.env.PLATFORM_FEE || 4;

export interface ContractConfig {
  admin: string;
  platformFee: bigint;
  remainTokenReserves: bigint;
  tokenDecimals: number;
}