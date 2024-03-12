import { feeBasisPoints, maxFee } from "./vars";

export const displayTokenAmount = (amount: bigint, decimals: number): string => {
    return (Number(amount) / Math.pow(10, decimals)).toFixed(3)
}

export const generateExplorerTxUrl = (txId: string): string => {
    return `https://explorer.solana.com/tx/${txId}?cluster=devnet`;
    // return `https://explorer.solana.com/tx/${txId}?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899`;
}

// Calculate the fee for the transfer
export const calcFee = (transferAmount: bigint): bigint => {
    const calcFee = (transferAmount * BigInt(feeBasisPoints)) / BigInt(10_000);
    const fee = calcFee > maxFee ?  maxFee : calcFee;
    return fee
}
