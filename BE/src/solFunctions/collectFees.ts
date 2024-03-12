import {Connection, PublicKey, Signer, Transaction, sendAndConfirmTransaction} from "@solana/web3.js";
import {
    Account,
    createWithdrawWithheldTokensFromAccountsInstruction,
    getTransferFeeAmount,
    TOKEN_2022_PROGRAM_ID,
    unpackAccount,
    createAssociatedTokenAccountIdempotent,
    getAssociatedTokenAddressSync,
    ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {decimals, refundPercentage} from "../vars";
import { getAmountPool, transferInstructions, updateAmountInstruction, wallet } from '../client';
import { displayTokenAmount } from '../utils';
import { SentAmount } from "../types";

// Collect fees -> refund token to whitelist wallet
export default async (connection: Connection, mint: PublicKey, authority: Signer) => {
    await collectFees(connection, mint, authority);
    await refundFees(connection, mint, authority);
}

async function executeTransactions(connection: Connection, transactionList: Transaction[], singers: Signer[]):Promise<PromiseSettledResult<string>[]> {
    let result:PromiseSettledResult<string>[] = [];
    let staggeredTransactions:Promise<string>[] = transactionList.map((transaction, i, allTx) => {
        return (new Promise((resolve) => {
            setTimeout(() => {
                console.log(`Requesting Transaction ${i+1}/${allTx.length}`);
                sendAndConfirmTransaction(connection,transaction,singers).then(resolve).catch(error => console.log(error.message));
            }, 0);
        })
        )})
        result = await Promise.allSettled(staggeredTransactions);
    return result;
}

const getRefundAmount = (amount: bigint) => {
    return BigInt(Math.ceil(Number(amount) * refundPercentage / 10000));
}

const collectFees = async (connection: Connection, mint: PublicKey, authority: Signer) => {
    const allAccounts = await connection.getProgramAccounts(TOKEN_2022_PROGRAM_ID, {
        filters: [
            {
                "dataSize": 187
            },
            {
                memcmp: {
                    offset: 0,
                    bytes: mint.toString()
                }
            }
        ]
    })

    const accountsToWithdrawFrom: Account[] = [];
    
    for (const accountInfo of allAccounts) {
        const account = unpackAccount(accountInfo.pubkey, accountInfo.account, TOKEN_2022_PROGRAM_ID);
        const transferFeeAmount = getTransferFeeAmount(account);
        
        if (transferFeeAmount !== null && transferFeeAmount.withheldAmount > 0) {
            accountsToWithdrawFrom.push(account);
        }
    }
    
    const authorityAta = await createAssociatedTokenAccountIdempotent(connection, authority, mint, authority.publicKey, null, TOKEN_2022_PROGRAM_ID);
    
    let totalFees = BigInt(0);
    let txs: Transaction[] = [];
    let blockhash = (await connection.getLatestBlockhash()).blockhash;
    
    let step = 10;
    for (let i = 0; i < accountsToWithdrawFrom.length; i += step) {
        const accountsChunk = accountsToWithdrawFrom.slice(i, i + step);
        const accounts = accountsChunk.map(account => account.address);
        const tx = new Transaction().add(createWithdrawWithheldTokensFromAccountsInstruction(mint, authorityAta, authority.publicKey, [authority], accounts, TOKEN_2022_PROGRAM_ID));
        tx.feePayer = authority.publicKey;
        tx.recentBlockhash = blockhash;
        txs.push(tx);
        totalFees += accountsChunk.map(account => getTransferFeeAmount(account).withheldAmount).reduce((sum, current) => sum + current, BigInt(0));
    }

    console.log(`Total fees ${totalFees}`);
    if (totalFees < 10 ** decimals) return console.log("Fees are too low");
    
    const txIds = await executeTransactions(connection, txs, [authority])
    console.log(txIds)
    
    console.log(`Collected ${displayTokenAmount(totalFees, decimals)} tokens from fees`);
}

const refundFees = async (connection: Connection, mint: PublicKey, authority: Signer) => {
    const whitelist = (await getAmountPool(mint))?.whitelist;
    console.log(whitelist)

    let Refunded = BigInt(0);
    let txs: Transaction[] = [];
    const addressesToRefund: SentAmount[] = [];
    for (let i = 0; i < whitelist.length; i ++) {
        if (whitelist[i].amount > 0) {
            addressesToRefund.push(whitelist[i])
        }
    }
    let step = 5;
    for (let i = 0; i < addressesToRefund.length; i += step) {
        const addressesChunk = addressesToRefund.slice(i, i + step);
        const tx = new Transaction();

        for (let j = 0; j < addressesChunk.length; j ++) {
            const to = addressesChunk[j];
            const [createAssociatedTokenAccountIdempotentInxtruction, transferInstruction] = await transferInstructions(mint, authority, to.address, getRefundAmount(BigInt(to.amount.toString())));
            const updateAmountIx = await updateAmountInstruction(mint, to.address, to.amount);
            Refunded += getRefundAmount(BigInt(to.amount.toString()));

            tx.add(createAssociatedTokenAccountIdempotentInxtruction).add(transferInstruction).add(updateAmountIx);
        }

        txs.push(tx);
    }
    console.log(txs)
    const txIds2 = await executeTransactions(connection, txs, [authority, wallet.payer])
    console.log(txIds2)
    
    console.log(`Refunded ${displayTokenAmount(Refunded, decimals)} tokens`);
}