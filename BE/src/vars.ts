import {Connection, Keypair, PublicKey} from "@solana/web3.js"
import {decode as bs58Decode} from 'bs58'

require('dotenv').config()

export const mint = new PublicKey(process.env.MINT)
export const decimals = Number(process.env.DECIMALS);
export const feeBasisPoints = 200; // 2%
export const maxFee = BigInt(9 * 10 ** decimals); // 9 tokens
export const refundPercentage = Number(process.env.REFUND_PERCENTAGE);
export const authority = Keypair.fromSecretKey(bs58Decode(process.env.WITHDRAW_WITHHELD_PRIVATE_KEY))

export const COLLECT_CRON = process.env.COLLECT_CRON;