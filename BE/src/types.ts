import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from '@solana/web3.js';

export interface AmountPool {
    whitelist: SentAmount[],
}

export interface SentAmount {
    address: PublicKey,
    amount: anchor.BN,
}
