async function getDexTokenPriceNative(tokenAddress: string) {
  const res = await fetch(
    `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`
  );
  const data: any = await res.json();
  const price = data.pairs?.find((pair: any) => pair.chainId === "aptos");
  return Number(price?.priceNative) || null;
}
async function getTokenMC(tokenAddress: string) {
  const res = await fetch(
    `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`
  );
  const data: any = await res.json();
  const price = data.pairs?.find((pair: any) => pair.chainId === "aptos");

  return formatNumber(price?.fdv) || null;
}
function formatNumber(number: number) {
  if (!number) {
    return null;
  }
  if (number >= 1e9) {
    return (number / 1e9).toFixed(2) + "B";
  } else if (number >= 1e6) {
    return (number / 1e6).toFixed(2) + "M";
  } else if (number >= 1e3) {
    return (number / 1e3).toFixed(2) + "K";
  } else {
    return number.toString();
  }
}

export { getDexTokenPriceNative, getTokenMC };
