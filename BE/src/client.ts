import * as anchor from '@coral-xyz/anchor';
import { TransferHook } from '../target/types/transfer_hook';
import { Keypair, PublicKey, Signer, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import {
    TOKEN_2022_PROGRAM_ID,
    createTransferCheckedWithFeeAndTransferHookInstruction,
    getAssociatedTokenAddressSync,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    createAssociatedTokenAccountIdempotentInstruction,
} from '@solana/spl-token';

import { AmountPool } from './types';
import { calcFee, generateExplorerTxUrl } from './utils';
import { decimals } from './vars';

require('dotenv').config()

// Configure the client to use the local cluster.
const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);

export const program = anchor.workspace.TransferHook as anchor.Program<TransferHook>;

export const wallet = provider.wallet as anchor.Wallet;
export const connection = provider.connection;

const EXTRA_ACCOUNT_METAS_SEED = "extra-account-metas";
const AMOUNT_POOL_SEED = "amount";
const ADMIN_ADDRESS = "5RoELXPzGfPFJ8DqHXX6QmgLguYERWfptPC3SUkwCBGz";

export const addWhitelist = async (mint: PublicKey, address: PublicKey) => {
    const [amountPool] = PublicKey.findProgramAddressSync(
        [Buffer.from(AMOUNT_POOL_SEED), mint.toBuffer()],
        program.programId,
    );

    const addWhitelistInstruction = await program.methods
        .addWhitelist(address)
        .accounts({
            admin: new PublicKey(ADMIN_ADDRESS),
            amountPool: amountPool,
            mint,
        })
        .instruction();

    const transaction = new Transaction().add(addWhitelistInstruction);

    const txSig = await sendAndConfirmTransaction(provider.connection, transaction, [wallet.payer], {
        skipPreflight: true,
        commitment: 'confirmed',
    });
    console.log('Transaction Signature:', generateExplorerTxUrl(txSig));
}

export const removeWhitelist = async (mint: PublicKey, address: PublicKey) => {
    const [amountPool] = PublicKey.findProgramAddressSync(
        [Buffer.from(AMOUNT_POOL_SEED), mint.toBuffer()],
        program.programId,
    );

    const removeWhitelistInstruction = await program.methods
        .removeWhitelist(address)
        .accounts({
            admin: new PublicKey(ADMIN_ADDRESS),
            amountPool: amountPool,
            mint,
        })
        .instruction();

    const transaction = new Transaction().add(removeWhitelistInstruction);

    const txSig = await sendAndConfirmTransaction(provider.connection, transaction, [wallet.payer], {
        skipPreflight: true,
        commitment: 'confirmed',
    });
    console.log('Transaction Signature:', generateExplorerTxUrl(txSig));
}

export const updateAmount = async (mint: PublicKey, address: PublicKey, amount: anchor.BN) => {
    const [amountPool] = PublicKey.findProgramAddressSync(
        [Buffer.from(AMOUNT_POOL_SEED), mint.toBuffer()],
        program.programId,
    );

    const updateAmountInstruction = await program.methods
        .updateAmount(address, amount)
        .accounts({
            admin: new PublicKey(ADMIN_ADDRESS),
            amountPool: amountPool,
            mint,
        })
        .instruction();

    const transaction = new Transaction().add(updateAmountInstruction);

    const txSig = await sendAndConfirmTransaction(provider.connection, transaction, [wallet.payer], {
        skipPreflight: true,
        commitment: 'confirmed',
    });
    console.log('Transaction Signature:', generateExplorerTxUrl(txSig));
}

export const updateAmountInstruction = async (mint: PublicKey, address: PublicKey, amount: anchor.BN): Promise<anchor.web3.TransactionInstruction> => {
    const [amountPool] = PublicKey.findProgramAddressSync(
        [Buffer.from(AMOUNT_POOL_SEED), mint.toBuffer()],
        program.programId,
    );

    const updateAmountInstruction = await program.methods
        .updateAmount(address, amount)
        .accounts({
            admin: new PublicKey(ADMIN_ADDRESS),
            amountPool: amountPool,
            mint,
        })
        .instruction();
    
    return updateAmountInstruction
}

export const initializeExtraAccountMetaList = async (mint: PublicKey) => {
    // ExtraAccountMetaList address
    // Store extra accounts required by the custom transfer hook instruction
    const [extraAccountMetaListPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from(EXTRA_ACCOUNT_METAS_SEED), mint.toBuffer()],
        program.programId,
    );
    const [amountPool] = PublicKey.findProgramAddressSync(
        [Buffer.from(AMOUNT_POOL_SEED), mint.toBuffer()],
        program.programId,
    );

    const initializeExtraAccountMetaListInstruction = await program.methods
        .initializeExtraAccountMetaList()
        .accounts({
            mint,
            extraAccountMetaList: extraAccountMetaListPDA,
            amountPool,
        })
        .instruction();

    const transaction = new Transaction().add(initializeExtraAccountMetaListInstruction);

    const txSig = await sendAndConfirmTransaction(provider.connection, transaction, [wallet.payer], {
        skipPreflight: true,
        commitment: 'confirmed',
    });
    console.log('Transaction Signature:', generateExplorerTxUrl(txSig));
}

export const getAmountPool = async (mint: PublicKey) : Promise<AmountPool | null>  => {
    const [amountPool] = PublicKey.findProgramAddressSync(
        [Buffer.from(AMOUNT_POOL_SEED), mint.toBuffer()],
        program.programId,
    );

    try {
        return await program.account.amountPool.fetch(amountPool) as undefined as AmountPool
    } catch {
        return null
    }
}

export const transferInstructions = async(mint: PublicKey, from: Signer, to: PublicKey, amount: bigint): Promise<anchor.web3.TransactionInstruction[]> => {
    const sourceTokenAccount = getAssociatedTokenAddressSync(
        mint,
        from.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID,
    );

    // Recipient token account address
    const destinationTokenAccount = getAssociatedTokenAddressSync(
        mint,
        to,
        false,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID,
    );

    const createAssociatedTokenAccountIdempotentInxtruction = createAssociatedTokenAccountIdempotentInstruction(
        from.publicKey,
        destinationTokenAccount,
        to,
        mint,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID,
    );

    // Standard token transfer instruction
    const transferInstruction = await createTransferCheckedWithFeeAndTransferHookInstruction(
        connection,
        sourceTokenAccount,
        mint,
        destinationTokenAccount,
        from.publicKey,
        amount,
        decimals,
        calcFee(amount),
        [],
        'confirmed',
        TOKEN_2022_PROGRAM_ID,
    );

    return [createAssociatedTokenAccountIdempotentInxtruction, transferInstruction]
}

export const transfer = async(mint: PublicKey, from: Signer, to: PublicKey, amount: bigint) => {
    const [createAssociatedTokenAccountIdempotentInxtruction, transferInstruction] = await transferInstructions(mint, from, to, amount);
    const transaction = new Transaction().add(createAssociatedTokenAccountIdempotentInxtruction).add(transferInstruction);

    const txSig = await sendAndConfirmTransaction(connection, transaction, [from], {
      skipPreflight: true,
      commitment: 'confirmed',
    });
    console.log('Transfer Signature:', generateExplorerTxUrl(txSig));
}
