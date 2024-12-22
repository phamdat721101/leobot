import { aptos } from "../leo-web3";

export const FIREBASE_KEY = process.env.FIREBASE_KEY
export const ADMIN_ADDR = process.env.ADMIN_ADDR
export const INITIAL_VIRTUAL_APTOS_RESERVES = process.env.INITIAL_VIRTUAL_APTOS_RESERVES || 1600000000;
export const INITIAL_VIRTUAL_TOKEN_RESERVES = process.env.INITIAL_VIRTUAL_TOKEN_RESERVES || 48000000000000;
export const PLATFORM_FEE = process.env.PLATFORM_FEE || 4;
export const MODULE_ADDR = process.env.MODULE_ADDR || "0x4e5e85fd647c7e19560590831616a3c021080265576af3182535a1d19e8bc2b3";

export interface ContractConfig {
  admin: string;
  platformFee: bigint;
  graduatedFee: bigint;
  initialVirtualAptosReserves: bigint;
  initialVirtualTokenReserves: bigint;
  remainTokenReserves: bigint;
  tokenDecimals: number;
}

export const getContractConfig = async (): Promise<ContractConfig> => {
  const [
    admin,
    platformFee,
    graduatedFee,
    initialVirtualAptosReserves,
    initialVirtualTokenReserves,
    remainTokenReserves,
    tokenDecimals
  ] = await aptos.view({
    payload: {
      function: `${process.env.MODULE_ADDR}::pump::get_configuration`,
      typeArguments: [],
      functionArguments: []
    }
  });
  return {
    admin,
    platformFee: BigInt(platformFee as number),
    graduatedFee: BigInt(graduatedFee as string),
    initialVirtualAptosReserves: BigInt(initialVirtualAptosReserves as string),
    initialVirtualTokenReserves: BigInt(initialVirtualTokenReserves as string),
    remainTokenReserves: BigInt(remainTokenReserves as string),
    tokenDecimals
  } as ContractConfig;
};