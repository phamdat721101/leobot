import { ethers, parseUnits } from "ethers";
import { solidityPacked as encodePacked } from "ethers";
import moonbeam_slp_abi from '../abi/moonbeam_slp.json'
import erc_20_abi from '../abi/erc20.json'

export async function mintxcDOT(ctx: any) {
  // Create provider and signer
  const provider = new ethers.JsonRpcProvider("https://rpc.api.moonbeam.network");
  const wallet = ctx.session.wallet_leo
  if(!wallet){
    await ctx.reply("Please start the bot") 
    return
  }
  const signer = new ethers.Wallet(wallet.privateKey, provider);

  /*Call to approve to spend*/

  // Create contract instance with signer
  const contract = new ethers.Contract(
    "0xF1d4797E51a4640a76769A50b57abE7479ADd3d8",
    moonbeam_slp_abi,
    signer
  );

  const args = [
    "0xFfFFfFff1FcaCBd218EDc0EbA20Fc2308C778080", // xcDOT token address 
    parseUnits("1", 10), // amount
    1284, // Moonbeam chain id
    wallet.address, // receiver
    "bifrost", // sample remark
    0, // sample channel_id
  ];

  try {
    const erc_contract = new ethers.Contract(
        "0xFfFFfFff1FcaCBd218EDc0EbA20Fc2308C778080",
        erc_20_abi,
        signer
    );
    const approve_args = [
        "0xF1d4797E51a4640a76769A50b57abE7479ADd3d8",
        parseUnits("1", 10), // 1 xcDOT is operationalMin and 10 is the token decimals
    ]
    const tx = await erc_contract.approve(...approve_args);
    await signer.signTransaction(tx)

    const receipt_approve = await tx.wait();
    await ctx.reply(`Approve successfully ${receipt_approve}`)
  } catch (error: any) {
    await ctx.reply(`Approve error: ${error.message}`)
    return
  }

  try {
    // Send transaction
    const tx = await contract.create_order(...args);
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