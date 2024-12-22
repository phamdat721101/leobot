export const DEFAULT_DEPLOYMENT_FEE = 300_000n;

export const displayAmount = (
  value: bigint | undefined,
  decimals: number,
  displayDecimals: number = decimals
): string => {
  if (!value) return '0';
  if (value <= 0) return '0';

  // If the value is smaller than the number of decimals, pad with leading zeros
  const paddedValue = value.toString().padStart(decimals + 1, '0');

  // Insert the decimal point
  const integerPart = paddedValue.slice(0, -decimals);
  const fractionalPart = paddedValue.slice(-decimals);

  // Limit the fractional part to the number of display decimals
  const limitedFractionalPart = fractionalPart.slice(0, displayDecimals);

  return `${integerPart}.${limitedFractionalPart}`;
};

export const displayShortHandAmount = (
  strCombinedValue: string,
  decimals = 2
) => {
  const numValue = Number.parseFloat(strCombinedValue);
  if (numValue >= 1_000_000_000) {
    return `${(numValue / 1_000_000_000).toFixed(decimals)}b`;
  } else if (numValue >= 1_000_000) {
    return `${(numValue / 1_000_000).toFixed(decimals)}m`;
  } else if (numValue >= 1000) {
    return `${(numValue / 1000).toFixed(decimals)}k`;
  }
  return numValue.toFixed(decimals);
};

export const displayAmountWithSeparator = (
  strCombinedValue: string,
  decimals = 8
) =>
  Number.parseFloat(strCombinedValue).toLocaleString('en-US', {
    minimumFractionDigits: decimals
  });

export const parseAmount = (value: string, decimals: number): bigint => {
  const cleanValue = value.replace('.', '');
  if (Number.isNaN(Number(cleanValue))) {
    throw new TypeError('Invalid number');
  }
  try {
    BigInt(Number(cleanValue));
  } catch {
    throw new Error('Invalid number');
  }
  if (cleanValue.startsWith('-')) {
    throw new Error('Invalid number');
  }
  const parts = value.split('.');
  if (parts.length > 2) {
    throw new Error('Invalid number');
  }

  const [integerPart = '', fractionalPart = ''] = parts;
  const missingZeros = decimals - fractionalPart.length;

  let normalizedValue = integerPart + fractionalPart;
  if (missingZeros > 0) {
    normalizedValue += '0'.repeat(missingZeros);
  } else if (missingZeros < 0) {
    normalizedValue = normalizedValue.slice(0, missingZeros);
  }
  return BigInt(normalizedValue);
};

export const amountAddFee = (rawAmount: bigint, fee: bigint) => {
  const feePercentage = fee / 100n;
  return (rawAmount * (100n + feePercentage)) / 100n;
};

export const amountAddSlip = (rawAmount: bigint, slip: bigint) =>
  (rawAmount * (100n + slip)) / 100n;

export const amountRemoveSlip = (rawAmount: bigint, slip: bigint) =>
  (rawAmount * (100n - slip)) / 100n;

export const amountRemoveFee = (rawAmount: bigint, fee: bigint) => {
  const feePercentage = fee / 100n;
  return (rawAmount * (100n - feePercentage)) / 100n;
};

export const amountRemoveGas = (rawAmount: bigint) =>
  rawAmount - DEFAULT_DEPLOYMENT_FEE;

export const getAmountIn = (
  amountOut: bigint, // b
  reserveIn: bigint, // x
  reserverOut: bigint // y
): bigint => {
  if (amountOut >= reserverOut) throw new Error('Insufficient liquidity');
  return (reserveIn * amountOut) / (reserverOut - amountOut) + 1n;
};

export const getUtilAmountOut = (
  amountIn: bigint, // a
  reserveIn: bigint, // x
  reserveOut: bigint // y
): bigint => (reserveOut * amountIn) / (reserveIn + amountIn);

export const trimLeadingZeros = (value: string): string => {
  // trim off leading zeros
  while (value.startsWith('0') && value.length > 1 && value[1] !== '.') {
    value = value.slice(1);
  }
  return value;
};

export const validateAmount = ({
  value,
  isInputAptos,
  isBuy,
  realAptosReserves,
  realTokenReserves
}: {
  value: string;
  isInputAptos: boolean;
  isBuy: boolean;
  realAptosReserves: bigint;
  realTokenReserves: bigint;
}): boolean => {
  try {
    const amount = parseAmount(value, isInputAptos ? 8 : 6);

    if (isBuy && !isInputAptos && amount > BigInt(realTokenReserves))
      return false;

    return !(!isBuy && isInputAptos && amount > BigInt(realAptosReserves));
  } catch {
    return false;
  }
};

export const getCap = (
  virtualAptosReserves: bigint,
  initialTokenReserves: bigint,
  virtualTokenReserves: bigint,
  aptosPrice: number
): number =>
  Number(
    (((BigInt(initialTokenReserves) * BigInt(virtualAptosReserves)) /
      BigInt(virtualTokenReserves)) *
      BigInt(aptosPrice)) /
      10_000_000_000_000_000n
  );

export const getTokenValue = ({
  tokenAmount,
  virtualAptosReserves,
  virtualTokenReserves,
  aptosPrice
}: {
  tokenAmount: bigint;
  virtualAptosReserves: bigint;
  virtualTokenReserves: bigint;
  aptosPrice: number;
}): number =>
  Number(
    (BigInt(tokenAmount) * BigInt(virtualAptosReserves) * BigInt(aptosPrice)) /
      BigInt(virtualTokenReserves) /
      10_000_000_000_000_000n
  );
