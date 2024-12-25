import { aptos } from "../leo-web3";
import { ethers, parseUnits } from "ethers";
import { solidityPacked as encodePacked } from "ethers";
import manta_slp_abi from '../abi/manta_slp.json';
import erc_20_abi from '../abi/erc20.json'

export async function getPool(tokenType: string): Promise<any | null> {
  try {
    return await aptos.view({
      payload: {
        function: `${process.env.MODULE_ADDR}::pump::get_pool`,
        typeArguments: [tokenType],
        functionArguments: []
      }
    })
  } catch (_) {
    return null
  };
}

export async function checkPoolExistence(tokenType: string): Promise<boolean> {
  const pool = await getPool(tokenType);
  if (pool) { return true } else { return false };
}

export const amountAddFee = (rawAmount: bigint, fee: bigint) => {
  const feePercentage = fee / 100n;
  return (rawAmount * (100n + feePercentage)) / 100n;
};

export const getAmountIn = (
  amountOut: bigint, // b
  reserveIn: bigint, // x
  reserverOut: bigint // y
): bigint => {
  if (amountOut >= reserverOut) throw new Error('Insufficient liquidity');
  return (reserveIn * amountOut) / (reserverOut - amountOut) + 1n;
};

export async function getVtoken(walletAddress: string, tokenAddress: string, url: string){
  // Create a provider (you can use Infura, Alchemy, or any other provider)
  const provider = new ethers.JsonRpcProvider(url);

  // Create an instance of the ERC20 contract
  const erc20Contract = new ethers.Contract(tokenAddress, [
    "function balanceOf(address owner) view returns (uint256)"
  ], provider);

  // Get the balance
  const balance = await erc20Contract.balanceOf(walletAddress);
  
  return balance; 
}

export async function mintVmanta(ctx: any) {
  // Create provider and signer
  const provider = new ethers.JsonRpcProvider("https://manta-pacific.drpc.org");
  const wallet = ctx.session.wallet_aptos
  if(!wallet){
    await ctx.reply("Please start the bot") 
    return
  }
  const signer = new ethers.Wallet(wallet.privateKey, provider);

  /*Call to approve to spend*/

  // Create contract instance with signer
  const contract = new ethers.Contract(
    "0x95A4D4b345c551A9182289F9dD7A018b7Fd0f940",
    manta_slp_abi,
    signer
  );

  const args = [
    "0x95CeF13441Be50d20cA4558CC0a27B601aC544E5", // MANTA token address
    parseUnits("1", 18), // amount
    0, // channel_id
    4000000, // dstGasForCall
    encodePacked(["uint16", "uint256"], [1, BigInt(4200000)]), // adapterParams
  ];

  try {
    const sendAndCallFee = await contract.estimateSendAndCallFee(...args)
    console.log("Send fee: ", sendAndCallFee)
    // Send transaction
    const tx = await contract.create_order(...args, {
      value: sendAndCallFee as BigInt
    });

    const signResp = await signer.signTransaction(tx)
    // Wait for transaction confirmation
    const receipt = await tx.wait();
    await ctx.reply(`Mint successfully ${receipt}`)
  } catch (error: any) {
    if(error.message.includes("INSUFFICIENT_FUNDS")){
      await ctx.reply(`Mint error: INSUFFICIENT_FUNDS`)
    }else{
      await ctx.reply(`Mint error: ${error.message}`)
    }
  }
}